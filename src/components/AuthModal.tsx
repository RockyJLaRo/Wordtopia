import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Sparkles, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { confetti } from '../utils/confetti';

export function AuthModal() {
  const { isAuthModalOpen, authModalMode, setAuthModal, login, register, requestPasswordReset, confirmPasswordReset, isLoading, error } =
    useAuthStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    authModalMode === 'register' ? 'register' : authModalMode === 'forgot_password' ? 'forgot' : 'login'
  );

  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [role, setRole] = useState<'user' | 'parent' | 'teacher'>('user');
  const [notice, setNotice] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const result = await login(identifier, password);
    if (result.success) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const result = await register(username, email, password, role);
    if (result.success) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const result = await requestPasswordReset(email);
    if (result.success) {
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setMode('reset');
        setNotice('Reset token generated! Enter your new password below.');
      } else {
        setNotice(result.message);
      }
    } else {
      setNotice(result.message);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const result = await confirmPasswordReset(resetToken, newPassword);
    if (result.success) {
      setMode('login');
      setNotice('Password reset successfully! Please sign in with your new password.');
    } else {
      setNotice(result.message);
    }
  };

  const fillDemoAdmin = () => {
    setIdentifier('admin@wordtopia.org');
    setPassword('SuperAdmin123!');
  };

  const fillDemoStudent = () => {
    setIdentifier('parent.leo@example.com');
    setPassword('LeoPass123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-sky-400 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              {mode === 'login' ? (
                <Lock size={18} />
              ) : mode === 'register' ? (
                <Sparkles size={18} />
              ) : (
                <Key size={18} />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black">
                {mode === 'login'
                  ? 'Sign In to Wordtopia'
                  : mode === 'register'
                  ? 'Join the Adventure'
                  : mode === 'forgot'
                  ? 'Reset Password'
                  : 'New Password'}
              </h2>
              <p className="text-[10px] sm:text-xs text-sky-100 font-medium">
                Save progress & sync across devices
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModal(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Quick Demo Autofill Bar for testers */}
          {mode === 'login' && (
            <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-500">Quick Test:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={fillDemoStudent}
                  className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold rounded-lg transition-colors"
                >
                  Student
                </button>
              </div>
            </div>
          )}

          {/* Mode Switch Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                  mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                  mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {notice && (
            <div className="mb-4 p-3 bg-sky-50 border border-sky-300 rounded-xl text-sky-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-sky-600" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="explorer@school.edu or Username"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-600 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setNotice(null);
                    }}
                    className="text-xs font-bold text-sky-600 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">Player Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a fun username"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                  Guardian / Student Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'user', label: 'Student' },
                    { id: 'parent', label: 'Parent' },
                    { id: 'teacher', label: 'Teacher' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        role === r.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-black'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Enter your account email and we'll generate a secure, single-use password reset token.
              </p>
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-sm"
              >
                Send Reset Token
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* RESET PASSWORD WITH TOKEN */}
          {mode === 'reset' && (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token here"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-xs focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-sm"
              >
                Update Password
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <Shield size={14} className="shrink-0 text-emerald-500" />
            <span>Child privacy protected (COPPA compliant). No sensitive data tracked.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
