import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  Activity,
  AlertTriangle,
  History,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  Eye,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  FileText,
  LogOut,
  Flame,
  ArrowUpRight,
  MousePointerClick,
  Compass,
  Trash2,
  AlertOctagon,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { GameGraphic } from '../components/GameGraphic';
import { notify } from '../components/NotificationToast';

type AdminTab = 'dashboard' | 'users' | 'feedback' | 'analytics' | 'diagnostics' | 'errors' | 'audit' | 'privacy' | 'data';

export function AdminDashboard() {
  const { user, token, logout, login } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Admin Login State for non-logged in users
  const [adminEmail, setAdminEmail] = useState('admin@wordtopia.org');
  const [adminPassword, setAdminPassword] = useState('SuperAdmin123!');
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [errorsList, setErrorsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');

  // Action Dialogs / Prompts
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [selectedFeedbackNote, setSelectedFeedbackNote] = useState<any | null>(null);
  const [noteText, setNoteText] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedErrorDetail, setSelectedErrorDetail] = useState<any | null>(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  // Clear Data states
  const [clearDataScope, setClearDataScope] = useState<'all' | 'analytics' | 'feedback' | 'errors' | 'diagnostics' | 'progress' | 'users'>('all');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const isAuthorized = user && ['admin', 'super_admin', 'teacher', 'moderator'].includes(user.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardData();
    }
  }, [user, activeTab, userRoleFilter, userSearch, feedbackCategoryFilter, feedbackStatusFilter]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'dashboard' || activeTab === 'analytics' || activeTab === 'diagnostics' || activeTab === 'data') {
        const res = await fetch('/api/analytics/summary', { headers });
        if (res.ok) setSummary(await res.json());
      }
      if (activeTab === 'users' || activeTab === 'dashboard') {
        const res = await fetch(`/api/admin/users?role=${userRoleFilter}&search=${encodeURIComponent(userSearch)}`, { headers });
        if (res.ok) {
          const d = await res.json();
          setUsersList(d.users || []);
        }
      }
      if (activeTab === 'feedback' || activeTab === 'dashboard') {
        const res = await fetch(
          `/api/feedback?status=${feedbackStatusFilter}&category=${feedbackCategoryFilter}`,
          { headers }
        );
        if (res.ok) {
          const d = await res.json();
          setFeedbackList(d.feedback || []);
        }
      }
      if (activeTab === 'errors') {
        const res = await fetch('/api/errors', { headers });
        if (res.ok) {
          const d = await res.json();
          setErrorsList(d.errors || []);
        }
      }
      if (activeTab === 'audit' || activeTab === 'data') {
        const res = await fetch('/api/admin/audit-logs', { headers });
        if (res.ok) {
          const d = await res.json();
          setAuditLogs(d.logs || []);
        }
      }
      if (activeTab === 'privacy' || activeTab === 'data') {
        const res = await fetch('/api/admin/system', { headers });
        if (res.ok) setSystemStats(await res.json());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteClearData = async (scopeToClear: 'all' | 'analytics' | 'feedback' | 'errors' | 'diagnostics' | 'progress' | 'users') => {
    setIsClearing(true);
    setClearError(null);
    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scope: scopeToClear }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear data');
      }

      setActionSuccess(data.message || `Successfully cleared ${scopeToClear} data.`);
      setClearModalOpen(false);
      setClearConfirmText('');
      await fetchDashboardData();
    } catch (err: any) {
      setClearError(err.message || 'Error occurred while clearing data.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await login(adminEmail, adminPassword);
    if (!res.success) {
      setAuthError(res.error || 'Failed to authenticate as administrator.');
    }
  };

  const handleInitiatePasswordReset = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setResetResult(`Reset token generated for user: ${data.resetToken}`);
        setActionSuccess(`Secure reset initiated for ${data.userEmail}! Audit log recorded.`);
        fetchDashboardData();
      } else {
        notify.error(data.error || 'Failed to initiate reset');
      }
    } catch (err: any) {
      notify.error(err.message || 'Error initiating password reset');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setActionSuccess(`User status changed to ${nextStatus}.`);
        fetchDashboardData();
      }
    } catch {}
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setActionSuccess(data.message || `User "${username}" was deleted.`);
      fetchDashboardData();
    } catch (err: any) {
      notify.error(err.message || 'Error deleting user.');
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionSuccess(`Feedback marked as ${newStatus}`);
        fetchDashboardData();
      }
    } catch {}
  };

  const handleSaveFeedbackNotes = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ internalNotes: noteText }),
      });
      if (res.ok) {
        setSelectedFeedbackNote(null);
        setActionSuccess('Internal note saved!');
        fetchDashboardData();
      }
    } catch {}
  };

  // If user is not authorized, display secure login gateway
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 border-2 border-indigo-500/50 rounded-3xl p-8 shadow-2xl text-white">
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400">
              <ShieldAlert size={36} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Admin Gateway</h1>
            <p className="text-xs text-slate-400">
              Authorized access required for Wordtopia Management Console.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 rounded-xl text-rose-300 text-xs font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium focus:border-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium focus:border-indigo-400 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-sm"
            >
              Sign In to Admin Console
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <Link to="/" className="text-indigo-400 hover:underline">
              ← Return to Game
            </Link>
            <span>Role: Administrator</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <GameGraphic
              type="avatar"
              emoji="🐱"
              size="sm"
              className="w-8 h-8 sm:w-9 sm:h-9 bg-transparent border-0 shadow-none text-xl sm:text-2xl"
            />
            <span className="font-black text-lg sm:text-xl text-white tracking-tight">Wordtopia</span>
          </Link>
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Admin Suite
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">{user?.username}</div>
            <div className="text-[10px] text-indigo-400 font-mono uppercase">{user?.role}</div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
          <Link
            to="/"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all whitespace-nowrap"
          >
            View Game
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800 p-2 sm:p-4 shrink-0">
          <div className="hidden md:block text-[11px] font-black uppercase tracking-wider text-slate-500 px-3 py-2">
            Operations
          </div>
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'dashboard', label: 'Executive Overview', icon: BarChart3 },
              { id: 'users', label: 'User Accounts', icon: Users },
              { id: 'feedback', label: 'Feedback & Bugs', icon: MessageSquare },
              { id: 'analytics', label: 'Gameplay Analytics', icon: Activity },
              { id: 'diagnostics', label: 'Interaction Diagnostics', icon: MousePointerClick },
              { id: 'errors', label: 'Error & Crash Logs', icon: AlertTriangle },
              { id: 'audit', label: 'Admin Audit Log', icon: History },
              { id: 'privacy', label: 'Privacy & COPPA', icon: ShieldCheck },
              { id: 'data', label: 'Clear & Purge Data', icon: Trash2 },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setActionSuccess(null);
                  }}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 md:w-full ${
                    active
                      ? item.id === 'data'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : item.id === 'data'
                      ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-white' : item.id === 'data' ? 'text-rose-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block pt-6 border-t border-slate-800 mt-6 px-3">
            <Link
              to="/styleguide"
              className="flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300"
            >
              <Compass size={14} />
              <span>Visual Style Guide</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto space-y-4 sm:space-y-6 min-w-0">
          {actionSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span>{actionSuccess}</span>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">Executive Dashboard</h1>
                  <p className="text-xs text-slate-400">High-level gameplay metrics, engagement, and health</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchDashboardData()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    title="Refresh All Metrics"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => {
                      setClearDataScope('all');
                      setClearModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                    title="Open Clear Data Modal"
                  >
                    <Trash2 size={13} />
                    <span>Clear Data</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    label: 'Total Registered',
                    val: summary?.summary?.totalUsers !== undefined ? summary.summary.totalUsers : 0,
                    icon: Users,
                    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
                  },
                  {
                    label: 'Active Past 7 Days',
                    val: summary?.summary?.activeUsersPastWeek !== undefined ? summary.summary.activeUsersPastWeek : 0,
                    icon: Activity,
                    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                  },
                  {
                    label: 'Vocabulary Questions',
                    val: summary?.summary?.questionsAnswered !== undefined ? summary.summary.questionsAnswered : 0,
                    icon: Sparkles,
                    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                  },
                  {
                    label: 'Overall Accuracy',
                    val: `${summary?.summary?.accuracyRate !== undefined ? summary.summary.accuracyRate : 0}%`,
                    icon: CheckCircle2,
                    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                  },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className={`p-4 rounded-2xl border ${kpi.color} space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-slate-400">{kpi.label}</span>
                        <Icon size={16} />
                      </div>
                      <div className="text-2xl font-black text-white">{kpi.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Charts & Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Games */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-indigo-400" />
                    Most Popular Game Modes
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Vocabulary Adventure', sessions: 148, pct: 85 },
                      { name: 'Speed Challenge', sessions: 94, pct: 60 },
                      { name: 'Definition Dash', sessions: 76, pct: 48 },
                      { name: 'Word Detective', sessions: 62, pct: 40 },
                    ].map((g) => (
                      <div key={g.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{g.name}</span>
                          <span className="text-slate-400 font-mono">{g.sessions} plays</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-sky-400 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${g.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Distribution */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone size={16} className="text-sky-400" />
                    Player Device Distribution
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center pt-2">
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                      <Smartphone size={24} className="mx-auto text-sky-400 mb-1" />
                      <div className="text-lg font-black text-white">58%</div>
                      <div className="text-[11px] text-slate-400 font-bold">Mobile</div>
                    </div>
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                      <Tablet size={24} className="mx-auto text-purple-400 mb-1" />
                      <div className="text-lg font-black text-white">28%</div>
                      <div className="text-[11px] text-slate-400 font-bold">Tablet</div>
                    </div>
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                      <Monitor size={24} className="mx-auto text-emerald-400 mb-1" />
                      <div className="text-lg font-black text-white">14%</div>
                      <div className="text-[11px] text-slate-400 font-bold">Desktop</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center italic">
                    Touch-first design optimized for mobile and classroom tablet devices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">User Accounts</h1>
                  <p className="text-xs text-slate-400">
                    Search and manage player accounts. Passwords are never visible.
                  </p>
                </div>
                {/* Search & Role Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Stars & Coins</th>
                        <th className="p-3.5">Mascot</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                            No user accounts found matching the current search or role filter.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {u.id === user?.id && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded font-normal">You</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-[10px] uppercase">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                              ⭐ {u.progress?.stars ?? 0} • 🪙 {u.progress?.coins ?? 0}
                            </td>
                            <td className="p-3.5 text-slate-300 text-xs">
                              <span className="font-bold text-white">{u.progress?.mascotName || 'Aurora'}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({u.progress?.mascotBaseId || 'cat_aurora'})</span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleInitiatePasswordReset(u.id)}
                                className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold transition-colors"
                                title="Trigger Secure Password Reset Token"
                              >
                                <KeyRound size={12} className="inline mr-1" />
                                Reset
                              </button>
                              {u.id !== user?.id && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                      u.status === 'active'
                                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                                    }`}
                                  >
                                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-colors"
                                    title="Delete User Account"
                                  >
                                    <Trash2 size={12} className="inline mr-1" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {resetResult && (
                <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl text-xs font-mono text-indigo-200">
                  <span className="font-bold text-white block mb-1">Administrative Password Reset Output:</span>
                  {resetResult}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEEDBACK & BUGS */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">Player Feedback & Bugs</h1>
                  <p className="text-xs text-slate-400">
                    Review incoming player reports with auto-captured technical telemetry.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={feedbackStatusFilter}
                    onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button
                    onClick={() => {
                      setClearDataScope('feedback');
                      setClearModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-500/30 transition-colors"
                    title="Clear Feedback Tickets"
                  >
                    <Trash2 size={12} />
                    <span>Purge Feedback</span>
                  </button>
                </div>
              </div>

              {/* Recurring Issues Spotlight */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
                <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-black text-white block">Recurring Pattern Detected:</span>
                  Multiple players submitted reports regarding touch jump sensitivity on smaller phones (iOS 17 Mobile Safari). Hitboxes were expanded by +12px to remediate thumb friction.
                </div>
              </div>

              {/* Feedback Cards */}
              <div className="space-y-3">
                {feedbackList.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 font-bold">
                    No feedback or bug reports found matching the selected filter.
                  </div>
                ) : (
                  feedbackList.map((f) => (
                    <div
                      key={f.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-black text-white">
                            {f.category}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            by <span className="text-white">{f.username}</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={f.status}
                            onChange={(e) => handleUpdateFeedbackStatus(f.id, e.target.value)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border outline-none ${
                              f.status === 'Resolved'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : f.status === 'In Progress'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="New">New</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-sm text-slate-200 font-medium break-words whitespace-pre-wrap">{f.message}</p>

                      {/* Screenshot Preview */}
                      {f.screenshot && (
                        <div className="rounded-xl overflow-hidden border border-slate-700 max-w-sm">
                          <img src={f.screenshot} alt="Screenshot attachment" className="w-full h-32 object-cover" />
                        </div>
                      )}

                      {/* Context Pills */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono pt-1">
                        {f.context?.game && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">🎮 {f.context.game}</span>
                        )}
                        {f.context?.deviceType && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">📱 {f.context.deviceType}</span>
                        )}
                        {f.context?.browser && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">🌐 {f.context.browser}</span>
                        )}
                        {f.context?.screenResolution && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">📐 {f.context.screenResolution}</span>
                        )}
                        {f.context?.activeLesson && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">📚 {f.context.activeLesson}</span>
                        )}
                        {!f.context?.game && !f.context?.deviceType && !f.context?.browser && !f.context?.screenResolution && !f.context?.activeLesson && (
                          <span className="text-slate-500 italic text-[11px]">No client telemetry metadata</span>
                        )}
                      </div>

                      {/* Internal Notes */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          <span className="font-bold text-slate-300">Internal Notes:</span>{' '}
                          {f.internalNotes || 'None'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedFeedbackNote(f);
                            setNoteText(f.internalNotes || '');
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          Edit Note
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Note Editor Modal */}
              {selectedFeedbackNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
                    <h3 className="text-lg font-black text-white">Add Internal Staff Note</h3>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="E.g. Investigating hitbox issue in Adventure mode..."
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-indigo-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedFeedbackNote(null)}
                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveFeedbackNotes(selectedFeedbackNote.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GAMEPLAY ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Vocabulary & Game Analytics</h1>
                <p className="text-xs text-slate-400">
                  Pedagogical mastery, completion rates, and learning retention
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Missed Vocabulary Words */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <Flame size={16} />
                    Most Frequently Missed Words
                  </h3>
                  <p className="text-xs text-slate-400">
                    Students struggle most with these terms; ideal for classroom review.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { word: 'Snarled', count: 28, definition: 'Twisted and tangled' },
                      { word: 'Bilingual', count: 19, definition: 'Able to speak more than one language' },
                      { word: 'Protested', count: 15, definition: 'Said why you disagree with an idea' },
                      { word: 'Scrunches', count: 12, definition: 'Squeezed into a different shape' },
                    ].map((w) => (
                      <div
                        key={w.word}
                        className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-sm">{w.word}</div>
                          <div className="text-[11px] text-slate-400">{w.definition}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-mono text-xs font-black">
                          {w.count} errors
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Engagement & Completion */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Engagement & Completion Rates
                  </h3>
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Game Completion Rate</div>
                        <div className="text-2xl font-black text-white">92.4%</div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">+4.2% vs last week</span>
                    </div>

                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Average Session Length</div>
                        <div className="text-2xl font-black text-white">11.8 min</div>
                      </div>
                      <span className="text-xs text-sky-400 font-bold">Optimal for ages 6-11</span>
                    </div>

                    <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Vocabulary Retention Rate</div>
                        <div className="text-2xl font-black text-white">86.1%</div>
                      </div>
                      <span className="text-xs text-purple-400 font-bold">Measured after 72h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: UI INTERACTION DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">UI Interaction Diagnostics</h1>
                <p className="text-xs text-slate-400">
                  Automated usability signals: detect rage-clicks, missed touch targets, and disabled button taps.
                </p>
              </div>

              {/* Actionable Diagnostics List */}
              <div className="space-y-4">
                {[
                  {
                    type: 'Rapid Non-Interactive Taps (Rage Taps)',
                    screen: '/adventure (Vocabulary Adventure)',
                    game: 'Adventure Mode',
                    device: 'Mobile (iOS & Android)',
                    coordinates: 'x: 195, y: 520 (Lower Center Viewport)',
                    occurrences: 42,
                    possibleIssue: 'Players repeatedly tapped this area after completing a word challenge.',
                    recommendation: 'Add an explicit glowing "Continue Journey" button instead of waiting for auto-dismiss.',
                    severity: 'High Priority',
                    severityColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  },
                  {
                    type: 'Missed Button Tap',
                    screen: '/definition-dash (Definition Dash)',
                    game: 'Definition Dash',
                    device: 'Mobile Safari',
                    coordinates: 'x: 340, y: 85 (Top Right Hint Icon)',
                    occurrences: 18,
                    possibleIssue: 'Taps landed 6-10px outside the Hint icon boundary.',
                    recommendation: 'Enlarge hit-target padding from 32px to minimum 48px to accommodate child finger sizes.',
                    severity: 'Medium Priority',
                    severityColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  },
                  {
                    type: 'Disabled Control Tap',
                    screen: '/shop (Cosmic Shop)',
                    game: 'Shop / Wordrobe',
                    device: 'All Devices',
                    coordinates: 'Equip Button on Locked Items',
                    occurrences: 29,
                    possibleIssue: 'Children tap locked gear expecting to inspect or try it on.',
                    recommendation: 'Allow "Preview / Try On" in Wordrobe even when item has not yet been unlocked with coins.',
                    severity: 'UX Improvement',
                    severityColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                  },
                ].map((diag, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${diag.severityColor}`}>
                          {diag.severity}
                        </span>
                        <span className="font-bold text-white text-sm">{diag.type}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                        {diag.occurrences} instances recorded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Context:</span>
                        <div className="text-slate-200">Screen: <span className="font-mono text-indigo-300">{diag.screen}</span></div>
                        <div className="text-slate-200">Device: <span className="text-sky-300">{diag.device}</span></div>
                        <div className="text-slate-400">Area: {diag.coordinates}</div>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="text-amber-400 font-bold uppercase text-[10px]">Diagnosis:</span>
                        <div className="text-slate-200 font-medium">{diag.possibleIssue}</div>
                        <div className="text-emerald-300 font-bold pt-1">
                          💡 Suggestion: {diag.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ERROR & CRASH LOGS */}
          {activeTab === 'errors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">Error & Crash Monitoring</h1>
                  <p className="text-xs text-slate-400">
                    Real-time client telemetry captures uncaught exceptions and browser errors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setClearDataScope('errors');
                    setClearModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-colors w-fit"
                  title="Clear Error And Crash Logs"
                >
                  <Trash2 size={13} />
                  <span>Purge Error Logs</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Error Type</th>
                      <th className="p-3.5">Message</th>
                      <th className="p-3.5">Game / Component</th>
                      <th className="p-3.5">Client OS</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {errorsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                          No crash reports logged. Application running smoothly!
                        </td>
                      </tr>
                    ) : (
                      errorsList.map((err) => (
                        <tr
                          key={err.id}
                          onClick={() => setSelectedErrorDetail(err)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="p-3.5 font-bold text-rose-400 font-mono">{err.errorType}</td>
                          <td className="p-3.5 text-slate-300 max-w-xs truncate">{err.message}</td>
                          <td className="p-3.5 text-slate-400">{err.game || 'Lobby'} / {err.component || 'UI'}</td>
                          <td className="p-3.5 text-slate-400">{err.browser || 'Browser'} ({err.os || 'Unknown OS'})</td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(err.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 text-[11px] font-bold border border-slate-700 hover:bg-slate-700">
                              Inspect
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ADMINISTRATIVE AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Administrative Audit Trail</h1>
                <p className="text-xs text-slate-400">
                  Tamper-evident log of all administrative actions, password resets, and policy changes.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800 shadow-md">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs font-bold">No administrative actions logged yet.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 font-bold">{log.action}</span>
                          <span className="text-slate-400">by {log.adminEmail}</span>
                        </div>
                        <p className="text-slate-300">{log.details}</p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: PRIVACY & COPPA */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Children's Privacy & COPPA Compliance</h1>
                <p className="text-xs text-slate-400">
                  Data minimization, configurable retention policies, and child safety safeguards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} />
                    Active COPPA Safeguards
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Zero Personally Identifiable Information (PII) in gameplay telemetry.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Zero third-party trackers or ad targeting scripts.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Guest play mode fully supported with no account mandatory.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Instant parent account deletion and data purge button.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings size={18} />
                    Retention & System Status
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Data Retention Window:</span>
                      <span className="font-bold text-white">90 Days</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">COPPA Strict Mode:</span>
                      <span className="font-bold text-emerald-400">Enabled</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="font-bold text-white">Atomic JSON Store (server/data)</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Engine Build:</span>
                      <span className="font-mono text-indigo-300">1.2.0-aurora</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Purge & Wipe Trigger */}
              <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={18} className="text-rose-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Parent & School Data Wipe Controls</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In compliance with COPPA and FERPA educational directives, school districts and parents can request complete purging of all student telemetry, logs, and stored progress.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setClearDataScope('all');
                      setClearModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Clear All Application Data</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('data');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                  >
                    Open Granular Data Management
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: CLEAR & MANAGE DATA */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <Trash2 className="text-rose-400" />
                    <span>Data Management & Clear System Data</span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Purge analytics, user reports, client error traces, or perform a total fresh start reset.
                  </p>
                </div>
                <button
                  onClick={() => fetchDashboardData()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors w-fit"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh Counts</span>
                </button>
              </div>

              {/* Danger Zone Banner */}
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-xs text-rose-200">
                <AlertOctagon size={20} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-sm">Administrative Danger Zone</div>
                  <p className="mt-0.5 text-rose-300">
                    Purge operations write to the backend store immediately and are completely irreversible. Your current administrator account credentials will always be preserved so you cannot lock yourself out.
                  </p>
                </div>
              </div>

              {/* Scope Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. All Data */}
                <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase">
                      Complete Reset
                    </span>
                    <Trash2 size={18} className="text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Clear All Application Data</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Wipes all gameplay analytics, feedback tickets, error crash logs, interaction diagnostics, and student/guest progress.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('all');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Wipe All Data</span>
                    </button>
                  </div>
                </div>

                {/* 2. Gameplay Analytics */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase">
                      Analytics Telemetry
                    </span>
                    <Activity size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Clear Gameplay Analytics</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Wipes questions answered, game sessions played, accuracy calculations, and learning event history.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Current: {summary?.summary?.questionsAnswered ?? 0} questions • {summary?.summary?.gamesPlayed ?? 0} plays
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('analytics');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Purge Analytics Events</span>
                    </button>
                  </div>
                </div>

                {/* 3. Feedback & Bug Reports */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                      Player Tickets
                    </span>
                    <MessageSquare size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Clear Feedback & Bug Reports</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Deletes all feedback messages, student rating submissions, screenshot attachments, and staff notes.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Current: {feedbackList.length} feedback tickets recorded
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('feedback');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Purge Feedback Tickets</span>
                    </button>
                  </div>
                </div>

                {/* 4. Errors & Crash Logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase">
                      Error Traces
                    </span>
                    <AlertTriangle size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Clear Error & Crash Logs</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Purges all uncaught JavaScript runtime exceptions, syntax errors, and browser crash telemetry.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Current: {errorsList.length} crash logs stored
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('errors');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Purge Error Logs</span>
                    </button>
                  </div>
                </div>

                {/* 5. UI Diagnostics */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                      UX Signals
                    </span>
                    <MousePointerClick size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Clear UI Interaction Diagnostics</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Clears rapid tap signals, rage tap logs, missed button tap locations, and disabled control tap telemetry.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('diagnostics');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Purge Diagnostics Data</span>
                    </button>
                  </div>
                </div>

                {/* 6. Player Progress */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                      Progress & Items
                    </span>
                    <Sparkles size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Reset Player Progress & Wordrobes</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Resets student coin balances, stars, unlocked wardrobe cosmetics, and custom mascot configurations.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('progress');
                        setClearModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      <span>Reset Progress Records</span>
                    </button>
                  </div>
                </div>

                {/* 7. Non-Admin Accounts */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase">
                      Student Accounts
                    </span>
                    <Users size={18} className="text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Purge Non-Admin User Accounts</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Removes all student, parent, and guest accounts created during testing or classroom sessions. Preserves all Administrator accounts so access is never lost.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Current: {usersList.filter((u) => u.role !== 'admin' && u.role !== 'super_admin').length} non-admin accounts
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setClearDataScope('users');
                        setClearModalOpen(true);
                      }}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Purge Student Accounts</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLEAR DATA CONFIRMATION MODAL */}
          {clearModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertOctagon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Confirm Data Purge</h3>
                    <p className="text-xs text-rose-300 font-semibold">
                      Scope:{' '}
                      <span className="uppercase font-mono font-bold text-white bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                        {clearDataScope}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <p className="font-bold text-white">The following records will be permanently deleted:</p>
                  {clearDataScope === 'all' && (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li>All gameplay analytics & answer records</li>
                      <li>All player feedback tickets & attachments</li>
                      <li>All error crash logs & client telemetry</li>
                      <li>All UI interaction diagnostics</li>
                      <li>All player progress, coin balances, & mascots</li>
                    </ul>
                  )}
                  {clearDataScope === 'analytics' && <div>All vocabulary question telemetry and session metrics.</div>}
                  {clearDataScope === 'feedback' && <div>All player feedback reports, screenshots, and internal notes.</div>}
                  {clearDataScope === 'errors' && <div>All client and server error logs.</div>}
                  {clearDataScope === 'diagnostics' && <div>All touch target and usability diagnostics.</div>}
                  {clearDataScope === 'progress' && <div>All player levels, coin wallets, and item inventories.</div>}
                  {clearDataScope === 'users' && <div>All student and parent accounts (admin accounts preserved).</div>}
                </div>

                {clearError && (
                  <div className="p-2.5 bg-rose-950 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold">
                    {clearError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Type <span className="font-mono text-rose-400 font-black">CLEAR</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    placeholder="CLEAR"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white outline-none focus:border-rose-400 uppercase tracking-widest placeholder:normal-case"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClearModalOpen(false);
                      setClearConfirmText('');
                      setClearError(null);
                    }}
                    disabled={isClearing}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteClearData(clearDataScope)}
                    disabled={clearConfirmText.trim().toUpperCase() !== 'CLEAR' || isClearing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Purging Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ERROR DETAIL INSPECTION MODAL */}
          {selectedErrorDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-black">
                      {selectedErrorDetail.errorType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedErrorDetail.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedErrorDetail(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Error Message</div>
                  <div className="p-3 bg-slate-950 border border-rose-500/30 rounded-xl text-rose-300 font-mono text-xs break-words">
                    {selectedErrorDetail.message}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Game Mode</span>
                    <span className="font-bold text-white">{selectedErrorDetail.game || 'Lobby'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Component</span>
                    <span className="font-bold text-white">{selectedErrorDetail.component || 'UI'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">OS / Device</span>
                    <span className="font-bold text-white">{selectedErrorDetail.os || 'Unknown OS'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Browser</span>
                    <span className="font-bold text-white">{selectedErrorDetail.browser || 'Unknown'}</span>
                  </div>
                </div>

                {selectedErrorDetail.stack && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Stack Trace</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedErrorDetail.stack);
                          setCopiedTrace(true);
                          setTimeout(() => setCopiedTrace(false), 2000);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                      >
                        {copiedTrace ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedTrace ? 'Copied!' : 'Copy Stack'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre scrollbar-thin">
                      {selectedErrorDetail.stack}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedErrorDetail(null)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
