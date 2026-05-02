import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Dashboard Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
          <div className="max-w-2xl backdrop-blur-xl bg-white/5 border border-sky-500/20 rounded-2xl p-8 text-white text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <span className="text-2xl text-red-500">!</span>
            </div>
            <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-4">
              Operational Interface Disrupted
            </h2>
            <div className="bg-black/40 rounded-xl p-4 mb-6 text-left border border-white/5">
               <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                {this.state.error?.message}
              </pre>
            </div>
            <p className="text-sm font-light text-red-400/90 leading-relaxed mb-6">
              {this.state.error?.message}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-black tracking-widest uppercase hover:bg-sky-500/30 transition-all active:scale-95"
            >
              Reinitialize Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
