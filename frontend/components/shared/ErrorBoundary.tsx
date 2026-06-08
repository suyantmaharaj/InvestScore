'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props  { children: ReactNode; fallback?: ReactNode; }
interface State  { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}
        >
          <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: '#E8A020' }} />
          <p className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary, #015376)' }}>
            Something went wrong
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted, #4A5568)' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00B5ED] text-white text-sm font-semibold hover:bg-[#0099CC] transition mx-auto"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
