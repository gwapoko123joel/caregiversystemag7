import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  ChevronDown, 
  ArrowUpRight, 
  Activity, 
  Clock,
  Menu,
  X,
  Sun,
  Moon,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary text-text-main overflow-hidden selection:bg-sky-500 selection:text-white transition-colors duration-300">
      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blur-glow-primary opacity-40 dark:opacity-100 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none transition-opacity" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blur-glow-secondary opacity-30 dark:opacity-100 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none transition-opacity" />

      {/* ── CLEAN CLINICAL HEADER ── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo remains the anchor */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Heart size={24} fill="white" className="text-white" />
            </div>
            <span className="font-black text-white uppercase tracking-tighter text-2xl">
              Bantayan<span className="text-sky-500">Care</span>
            </span>
          </div>

          {/* Right Side: Only the essential portal entry */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mr-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Live</span>
            </div>
            
            <Link 
              to="/login"
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2"
            >
              Sign In to Portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <main className="relative z-10 px-6 md:px-12 pt-32 md:pt-48 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side */}
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-light tracking-widest uppercase mb-8 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Barangay Bantayan Deployment
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6 md:mb-8 text-text-main transition-colors">
            Streamlining <span className="text-sky-500">Care Coordination.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-sidebar-text-muted font-medium leading-relaxed mb-10 md:mb-12 max-w-lg transition-colors">
            Automated caregiver reporting and real-time monitoring for Barangay Bantayan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-sky-500 text-white font-light rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(0,186,255,0.4)] hover:scale-[1.02] transition-all text-sm uppercase tracking-widest"
            >
              SIGN IN AS HEALTH WORKER <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side Visualization */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[600px]">
            
            {/* Orbiting Paths */}
            <div className="orbit-path w-[100%] h-[100%] opacity-10 dark:opacity-20 border-sidebar-text-muted transition-opacity" />
            <div className="orbit-path w-[75%] h-[75%] opacity-20 dark:opacity-40 animate-[spin_20s_linear_infinite] border-sidebar-text-muted transition-opacity" />
            <div className="orbit-path w-[50%] h-[50%] opacity-30 dark:opacity-60 border-sky-500/30 animate-[spin_15s_linear_infinite_reverse] transition-opacity" />

            {/* Central Stacked Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-12 bg-gradient-to-r from-sky-400/80 to-sky-600/80 rounded-lg transform -skew-x-[45deg] shadow-lg mb-1" />
                <div className="w-32 h-12 bg-card border border-card-border rounded-lg transform -skew-x-[45deg] mb-1 transition-colors" />
                <div className="w-32 h-12 bg-card/60 backdrop-blur-sm border border-card-border rounded-lg transform -skew-x-[45deg] transition-colors" />
              </div>
            </div>

            {/* Orbiting Cards */}
            <div className="absolute top-[10%] left-[10%] z-30 animate-pulse-slow">
              <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-card-border shadow-xl dark:shadow-2xl flex items-center justify-center group hover:border-sky-500/50 transition-all">
                <div className="relative w-12 h-12">
                   <svg className="w-full h-full" viewBox="0 0 36 36">
                     <circle cx="18" cy="18" r="16" fill="none" className="stroke-sidebar-text-muted/10" strokeWidth="4" />
                     <circle cx="18" cy="18" r="16" fill="none" className="stroke-sky-500" strokeWidth="4" strokeDasharray="75, 100" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-sky-500 rounded-full" />
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[15%] right-[5%] z-30">
              <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-card-border shadow-xl dark:shadow-2xl hover:border-sky-400/50 transition-all">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-500">
                      <Clock size={18} />
                    </div>
                    <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">NEXT CHECK-IN</span>
                 </div>
                 <div className="text-2xl font-light tracking-[0.1em] text-text-main">14:20 <span className="text-xs text-sky-500 font-bold uppercase ml-1">PM</span></div>
              </div>
            </div>

            <div className="absolute -bottom-[5%] left-1/2 -translate-x-1/2 z-30">
               <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-2xl border border-card-border min-w-[200px] shadow-xl dark:shadow-2xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Patient Vitals Trend</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-sky-500 rounded-full" />
                      <div className="w-1 h-1 bg-sky-500 opacity-40 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                     <div className="bg-sky-500/10 w-3 h-[40%] rounded-t-sm" />
                     <div className="bg-sky-500/30 w-3 h-[70%] rounded-t-sm" />
                     <div className="bg-sky-500/20 w-3 h-[55%] rounded-t-sm" />
                     <div className="bg-sky-500 w-3 h-[90%] rounded-t-sm shadow-[0_0_10px_rgba(0,186,255,0.5)]" />
                     <div className="bg-sky-500/30 w-3 h-[30%] rounded-t-sm" />
                  </div>
               </div>
            </div>

            <div className="absolute top-[18%] right-[10%] z-40">
               <div className="flex flex-col gap-2">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-card bg-gradient-to-br ${i%2===0 ? 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900' : 'from-sky-400 to-sky-600'} flex items-center justify-center transition-all shadow-sm`}>
                        {i%2===0 ? <Users size={12} className="text-sidebar-text-muted" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-card bg-card backdrop-blur-md flex items-center justify-center text-[10px] font-light text-text-main shadow-sm">+12</div>
                  </div>
                  <div className="px-2 py-1 bg-card/60 backdrop-blur-sm border border-card-border rounded flex items-center gap-2 shadow-sm transition-all">
                     <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">4 CAREGIVERS ACTIVE</span>
                  </div>
               </div>
            </div>

            <div className="absolute top-[40%] left-[15%] z-40 animate-bounce">
               <div className="px-3 py-1.5 rounded-full flex items-center gap-2 node-urgent transition-all border-none">
                  <Activity size={14} className="text-current" />
                  <span className="text-xs font-light text-current">! BP-145</span>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── SYSTEM CAPABILITIES SECTION ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureInfo title="Caregiver Support" desc="Real-time field reporting and shift management for BHWs." />
          <FeatureInfo title="Patient Records" desc="Centralized clinical dossiers with longitudinal trend tracking." />
          <FeatureInfo title="Medical Consults" desc="Direct coordination pipeline between field staff and doctors." />
          <FeatureInfo title="Emergency SOS" desc="Sub-second latency crisis alerts with global system takeover." />
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
};

// Helper Component
function FeatureInfo({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-8 bg-white/5 border border-white/5 rounded-[32px] hover:border-sky-500/20 transition-all group">
      <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3 group-hover:text-sky-500 transition-colors">{title}</h4>
      <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
    </div>
  )
}

export default LandingPage;
