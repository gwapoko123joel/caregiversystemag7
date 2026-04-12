import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ChevronDown, 
  ArrowUpRight, 
  Activity, 
  Clock,
  Menu,
  X
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-hidden selection:bg-brand-neon-green selection:text-brand-dark">
      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="relative z-50 px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-neon-green to-brand-accent-green rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
            <span className="font-black text-brand-dark text-xl">CC</span>
          </div>
          <span className="font-bold tracking-tight text-lg hidden md:block">CARE COORDINATION SYSTEM</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {[
            'Caregiver Support',
            'Patient Records',
            'Medical Consults',
            'Emergency Resources'
          ].map((item) => (
            <button key={item} className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors group">
              {item} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="px-6 py-2.5 text-sm font-semibold border border-white/10 rounded-full hover:bg-white/5 transition-colors">
            Contact Support
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="group px-6 py-2.5 text-sm font-semibold bg-brand-neon-green text-brand-dark rounded-full hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all flex items-center gap-2"
          >
            Log In <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* ── Hero Content ── */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side */}
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-neon-green/10 border border-brand-neon-green/20 text-brand-neon-green text-xs font-bold tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon-green"></span>
            </span>
            Barangay Bantayan Deployment
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
            Streamlining <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon-green to-brand-accent-green">Care Coordination.</span> Supporting Barangay Bantayan.
          </h1>
          
          <p className="text-xl text-gray-400 font-medium leading-relaxed mb-12 max-w-lg">
            An automated caregiver reporting and on-time patient monitoring platform, designed for Dumaguete City.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-brand-neon-green text-brand-dark font-bold rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(57,255,20,0.4)] hover:scale-[1.02] transition-all text-lg"
            >
              VIEW PATIENT DASHBOARD <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side Visualization */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[600px]">
            
            {/* Orbiting Paths */}
            <div className="orbit-path w-[100%] h-[100%] opacity-20 border-white/40" />
            <div className="orbit-path w-[75%] h-[75%] opacity-40 animate-[spin_20s_linear_infinite]" />
            <div className="orbit-path w-[50%] h-[50%] opacity-60 border-brand-neon-green/30 animate-[spin_15s_linear_infinite_reverse]" />

            {/* Central Stacked Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-12 bg-gradient-to-r from-brand-neon-green/80 to-brand-accent-green/80 rounded-lg transform -skew-x-[45deg] shadow-lg mb-1" />
                <div className="w-32 h-12 bg-white/20 backdrop-blur-md rounded-lg transform -skew-x-[45deg] mb-1" />
                <div className="w-32 h-12 bg-white/10 backdrop-blur-sm rounded-lg transform -skew-x-[45deg]" />
              </div>
            </div>

            {/* Orbiting Cards */}
            {/* Pie Chart Card (Top Left) */}
            <div className="absolute top-[10%] left-[10%] z-30 animate-pulse-slow">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center group hover:border-brand-neon-green/50 transition-colors">
                <div className="relative w-12 h-12">
                   <svg className="w-full h-full" viewBox="0 0 36 36">
                     <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="4" />
                     <circle cx="18" cy="18" r="16" fill="none" className="stroke-brand-neon-green" strokeWidth="4" strokeDasharray="75, 100" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                   </div>
                </div>
              </div>
            </div>

            {/* Next Check-in Card (Bottom Right) */}
            <div className="absolute bottom-[15%] right-[5%] z-30">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:border-brand-accent-green/50 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent-green/20 flex items-center justify-center text-brand-accent-green">
                      <Clock size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-400">NEXT CHECK-IN</span>
                 </div>
                 <div className="text-2xl font-black tracking-tight">14:20 <span className="text-xs text-brand-accent-green font-bold uppercase ml-1">PM</span></div>
              </div>
            </div>

            {/* Vitals Trend Card (Bottom Center) */}
            <div className="absolute -bottom-[5%] left-1/2 -translate-x-1/2 z-30">
               <div className="p-4 rounded-2xl bg-[#1e1b4b]/80 backdrop-blur-2xl border border-white/10 min-w-[200px] shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Vitals Trend</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-brand-neon-green rounded-full" />
                      <div className="w-1 h-1 bg-brand-neon-green opacity-40 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                     <div className="bg-brand-neon-green/20 w-3 h-[40%] rounded-t-sm" />
                     <div className="bg-brand-neon-green/40 w-3 h-[70%] rounded-t-sm" />
                     <div className="bg-brand-neon-green/60 w-3 h-[55%] rounded-t-sm" />
                     <div className="bg-brand-neon-green w-3 h-[90%] rounded-t-sm shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                     <div className="bg-brand-neon-green/40 w-3 h-[30%] rounded-t-sm" />
                  </div>
               </div>
            </div>

            {/* Personnel Count (Top Right) */}
            <div className="absolute top-[18%] right-[10%] z-40">
               <div className="flex flex-col gap-2">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-brand-dark bg-gradient-to-br ${i%2===0 ? 'from-brand-purple to-brand-dark' : 'from-brand-neon-green to-brand-accent-green'} flex items-center justify-center`}>
                        {i%2===0 ? <Users size={12} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-brand-dark" />}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-brand-dark bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-bold">+12</div>
                  </div>
                  <div className="px-2 py-1 bg-brand-dark/60 backdrop-blur-sm border border-white/10 rounded flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-brand-neon-green rounded-full animate-pulse" />
                     <span className="text-[10px] font-bold text-gray-400">4 CAREGIVERS ACTIVE</span>
                  </div>
               </div>
            </div>

            {/* Critical Alert Marker */}
            <div className="absolute top-[40%] left-[15%] z-40 animate-bounce">
               <div className="px-3 py-1.5 bg-red-500 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                  <Activity size={14} />
                  <span className="text-xs font-black italic">! BP-145</span>
               </div>
            </div>

            {/* Floating Particles */}
            <div className="absolute top-[20%] left-[40%] w-1 h-1 bg-brand-neon-green rounded-full shadow-[0_0_8px_white]" />
            <div className="absolute bottom-[30%] right-[30%] w-0.5 h-0.5 bg-brand-accent-green rounded-full shadow-[0_0_8px_white]" />
            <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-white/30 rounded-full" />

          </div>
        </div>
      </main>

      {/* ── Footer Stats ── */}
      <footer className="relative z-10 px-6 md:px-12 pb-12 border-t border-white/5 pt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {[
             { label: 'Patient Fleet', value: '1,240+' },
             { label: 'Caregivers Authorised', value: '86' },
             { label: 'Real-time Vitals/Sec', value: '3,100' },
             { label: 'Average Emergency Response', value: '< 4m' }
           ].map(stat => (
             <div key={stat.label}>
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</div>
                <div className="text-2xl font-black">{stat.value}</div>
             </div>
           ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
