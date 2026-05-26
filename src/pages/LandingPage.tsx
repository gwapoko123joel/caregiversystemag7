import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const LandingPage: React.FC = () => {
  useEffect(() => {
    document.body.style.backgroundColor = '#020617';
    document.body.style.backgroundImage = 'none';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-50 overflow-hidden flex flex-col justify-between selection:bg-sky-500 selection:text-slate-50">
      
      {/* ── LIQUID LAYERS (Background SVGs) ── */}
      {/* Layer 1: Deep Violet */}
      <svg className="absolute top-0 right-0 h-full w-full object-cover z-0 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-90" viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
        </defs>
        <path d="M400,1024 C700,700 -100,400 700,0 L1440,0 L1440,1024 Z" fill="url(#wave1)"/>
      </svg>

      {/* Layer 2: Mid Blue */}
      <svg className="absolute top-0 right-0 h-full w-full object-cover z-0 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-95" viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path d="M650,1024 C950,600 200,300 1000,0 L1440,0 L1440,1024 Z" fill="url(#wave2)"/>
      </svg>

      {/* Layer 3: Electric Sky */}
      <svg className="absolute top-0 right-0 h-full w-full object-cover z-0 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-100" viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <path d="M900,1024 C1200,500 500,200 1250,0 L1440,0 L1440,1024 Z" fill="url(#wave3)"/>
      </svg>

      {/* ── HEADER ── */}
      <nav className="relative z-50 w-full px-6 md:px-12 py-8">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center relative">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Heart size={24} fill="white" className="text-slate-50" />
            </div>
            <span className="font-bold text-slate-50 uppercase tracking-tighter text-2xl hidden sm:block">
              Bantayan<span className="text-sky-500">Care</span>
            </span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Secure Access Node</span>
          </div>

          <Link 
            to="/login"
            className="px-8 py-3 text-white font-bold uppercase text-[10px] tracking-widest rounded-full border border-white/10 hover:border-white/20 transition-all bg-transparent hover:bg-white/5 backdrop-blur-md"
          >
            LOG IN
          </Link>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 w-full max-w-screen-2xl mx-auto">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-md">
            FIELD-TO-<br/>
            CLINIC<br/>
            SYNCHRONIZATION.
          </h1>
          <p className="text-slate-300 max-w-lg mt-8 text-lg font-medium leading-relaxed">
            Distributed telemetry network for Barangay Bantayan. Streamlining the coordination handshake between Field BHW Nodes and Authorized Practitioners.
          </p>
          <div className="pt-6">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center px-12 py-5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-full font-bold uppercase text-xs tracking-widest transition-all shadow-[0_0_25px_rgba(14,165,233,0.4)] hover:shadow-[0_0_40px_rgba(14,165,233,0.6)] hover:scale-105 active:scale-95"
            >
              AUTHORIZE ACCESS 🔒
            </Link>
          </div>
        </div>
      </main>

      {/* ── MINIMALIST FOOTER ── */}
      <div className="absolute bottom-8 w-full text-center z-50 pointer-events-none drop-shadow-md">
        <p className="text-white font-mono text-[9px] uppercase tracking-[0.3em]">
          © 2026 BantayanCare • Secured Regional Node: Dumaguete-X01
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
