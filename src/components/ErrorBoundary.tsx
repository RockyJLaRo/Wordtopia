import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, WifiOff } from 'lucide-react';
import { logApplicationError } from '../services/telemetry';
import { isChunkLoadError } from '../utils/lazyWithRetry';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** When this value changes (e.g. the route path), a caught error is cleared automatically. */
  resetKey?: string;
  /** 'inline' renders inside the page area so the HUD/navigation stay usable. */
  variant?: 'fullscreen' | 'inline';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo);
    if (isChunkLoadError(error)) return; // connectivity issue, not an app bug
    try {
      logApplicationError(error, 'ErrorBoundary', window.location.pathname);
    } catch {}
  }

  public override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
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

      const isInline = this.props.variant === 'inline';
      const isNetworkProblem =
        isChunkLoadError(this.state.error) || (typeof navigator !== 'undefined' && navigator.onLine === false);

      return (
        <div
          role="alert"
          className={
            isInline
              ? 'flex-1 flex items-center justify-center p-4'
              : 'min-h-screen bg-slate-900 text-white flex items-center justify-center p-4'
          }
        >
          <div className="bg-slate-800 text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
              {isNetworkProblem ? <WifiOff size={32} /> : <AlertTriangle size={32} />}
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              {isNetworkProblem ? "Can't Reach the Internet" : 'Oops! A Tiny Tumble!'}
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              {isNetworkProblem
                ? 'This part of the game needs to download first. Check your Wi-Fi or data, then tap Try Again. Your progress is saved.'
                : "Something unexpected happened, but don't worry: your game progress, stars, and coins are safely saved."}
            </p>

            {!isNetworkProblem && this.state.error && (
              <details className="bg-slate-950/80 rounded-xl p-3 text-left mb-6 border border-slate-700 text-xs text-slate-400">
                <summary className="cursor-pointer font-bold">Details for grown-ups</summary>
                <div className="mt-2 max-h-32 overflow-y-auto font-mono text-rose-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={isNetworkProblem ? this.handleReload : this.handleReset}
                className="w-full sm:w-auto min-h-11 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <RotateCcw size={16} />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto min-h-11 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-600"
              >
                <Home size={16} />
                <span>Return to Lobby</span>
              </button>

              {!isNetworkProblem && (
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full sm:w-auto min-h-11 px-4 py-2.5 text-slate-300 hover:text-white font-medium text-xs transition-colors"
                >
                  Reload Page
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
