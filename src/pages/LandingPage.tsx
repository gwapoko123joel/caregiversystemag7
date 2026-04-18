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
  Heart
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary text-text-main overflow-hidden selection:bg-sky-500 selection:text-white transition-colors duration-300">
      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blur-glow-primary opacity-40 dark:opacity-100 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none transition-opacity" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blur-glow-secondary opacity-30 dark:opacity-100 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none transition-opacity" />

      {/* ── Navigation ── */}
      <nav className="relative z-50 px-6 py-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95 group/logo">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,186,255,0.4)] group-hover/logo:shadow-[0_0_30px_rgba(0,186,255,0.6)] transition-all">
             <Heart size={24} className="text-white fill-white" />
          </div>
          <span className="font-black tracking-tight text-lg hidden md:block text-text-main uppercase">BantayanCare</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {[
            'Caregiver Support',
            'Patient Records',
            'Medical Consults',
            'Emergency Resources'
          ].map((item) => (
            <button key={item} className="flex items-center gap-1 text-sm font-black uppercase tracking-widest text-sidebar-text-muted hover:text-text-main transition-colors group">
              {item} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-card text-sidebar-text-muted hover:text-text-main transition-all border border-card-border shadow-sm dark:shadow-none hover:shadow-md mr-2"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="px-6 py-2.5 text-xs font-black uppercase tracking-widest border border-card-border rounded-full bg-card hover:bg-card/80 transition-colors text-sidebar-text-muted hover:text-text-main">
            Contact Support
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="group px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-sky-500 text-white rounded-full hover:shadow-[0_0_30px_rgba(0,186,255,0.5)] transition-all flex items-center gap-2"
          >
            Log In <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-card text-sidebar-text-muted transition-all border border-card-border"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="text-text-main p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-primary/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="flex flex-col h-full p-8">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg">
                         <Heart size={20} className="text-white fill-white" />
                      </div>
                      <span className="font-black uppercase tracking-tight text-text-main">BantayanCare</span>
                   </div>
                   <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-card border border-card-border rounded-xl">
                      <X size={20} />
                   </button>
                </div>

                <div className="space-y-6">
                   {[
                     'Caregiver Support',
                     'Patient Records',
                     'Medical Consults',
                     'Emergency Resources'
                   ].map((item) => (
                     <button key={item} className="w-full text-left text-lg font-black uppercase tracking-widest text-sidebar-text-muted hover:text-sky-500 transition-colors py-2 border-b border-card-border/50">
                        {item}
                     </button>
                   ))}
                </div>

                <div className="mt-auto space-y-4">
                   <button 
                     onClick={() => navigate('/login')}
                     className="w-full py-5 bg-sky-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all text-sm"
                   >
                     Access Dashboard
                   </button>
                   <button className="w-full py-5 bg-card border border-card-border text-text-main font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-sm">
                     Contact Support
                   </button>
                </div>
             </div>
          </div>
        )}
      </nav>

      {/* ── Hero Content ── */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side */}
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-black tracking-widest uppercase mb-8 transition-colors">
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
              className="group px-8 py-4 bg-sky-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(0,186,255,0.4)] hover:scale-[1.02] transition-all text-sm uppercase tracking-widest"
            >
              VIEW PATIENT DASHBOARD <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
            {/* Pie Chart Card (Top Left) */}
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

            {/* Next Check-in Card (Bottom Right) */}
            <div className="absolute bottom-[15%] right-[5%] z-30">
              <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-card-border shadow-xl dark:shadow-2xl hover:border-sky-400/50 transition-all">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-500">
                      <Clock size={18} />
                    </div>
                    <span className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest">NEXT CHECK-IN</span>
                 </div>
                 <div className="text-2xl font-black tracking-tight text-text-main">14:20 <span className="text-xs text-sky-500 font-bold uppercase ml-1">PM</span></div>
              </div>
            </div>

            {/* Vitals Trend Card (Bottom Center) */}
            <div className="absolute -bottom-[5%] left-1/2 -translate-x-1/2 z-30">
               <div className="p-4 rounded-2xl bg-card/90 backdrop-blur-2xl border border-card-border min-w-[200px] shadow-xl dark:shadow-2xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest">Patient Vitals Trend</span>
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

            {/* Personnel Count (Top Right) */}
            <div className="absolute top-[18%] right-[10%] z-40">
               <div className="flex flex-col gap-2">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-card bg-gradient-to-br ${i%2===0 ? 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900' : 'from-sky-400 to-sky-600'} flex items-center justify-center transition-all shadow-sm`}>
                        {i%2===0 ? <Users size={12} className="text-sidebar-text-muted" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-card bg-card backdrop-blur-md flex items-center justify-center text-[10px] font-black text-text-main shadow-sm">+12</div>
                  </div>
                  <div className="px-2 py-1 bg-card/60 backdrop-blur-sm border border-card-border rounded flex items-center gap-2 shadow-sm transition-all">
                     <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-tighter">4 CAREGIVERS ACTIVE</span>
                  </div>
               </div>
            </div>

            {/* Critical Alert Marker */}
            <div className="absolute top-[40%] left-[15%] z-40 animate-bounce">
               <div className="px-3 py-1.5 rounded-full flex items-center gap-2 node-urgent transition-all border-none">
                  <Activity size={14} className="text-current" />
                  <span className="text-xs font-black italic text-current">! BP-145</span>
               </div>
            </div>

            {/* Floating Particles */}
            <div className="absolute top-[20%] left-[40%] w-1 h-1 bg-sky-500 rounded-full shadow-[0_0_8px_white]" />
            <div className="absolute bottom-[30%] right-[30%] w-0.5 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_white]" />
            <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-sidebar-text-muted/20 rounded-full" />

          </div>
        </div>
      </main>

      {/* ── Footer Stats ── */}
      <footer className="relative z-10 px-6 md:px-12 pb-12 border-t border-card-border pt-12 transition-colors">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {[
             { label: 'Network', value: '1,240+' },
             { label: 'Authorized', value: '86' },
             { label: 'Telemetry', value: '3.1k/s' },
             { label: 'Response', value: '< 4m' }
           ].map(stat => (
             <div key={stat.label} className="p-4 bg-card/50 border border-card-border rounded-2xl">
                <div className="text-sidebar-text-muted text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1 transition-colors">{stat.label}</div>
                <div className="text-lg md:text-2xl font-black text-text-main transition-colors">{stat.value}</div>
             </div>
           ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
