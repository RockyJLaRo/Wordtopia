import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { logApplicationError } from '../services/telemetry';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
    try {
      logApplicationError(error, 'ErrorBoundary', window.location.pathname);
    } catch {}
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">Oops! A Tiny Tumble!</h2>
            <p className="text-slate-300 text-sm mb-4">
              Something unexpected happened, but don't worry: your game progress, stars, and coins are safely saved.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 rounded-xl p-3 text-left mb-6 border border-slate-700 max-h-32 overflow-y-auto font-mono text-xs text-rose-300">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <RotateCcw size={16} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-600"
              >
                <Home size={16} />
                <span>Return to Lobby</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 text-slate-400 hover:text-white font-medium text-xs transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
