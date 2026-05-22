import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart,
  ArrowRight,
  ShieldCheck,
  Globe,
  Mail,
  Navigation,
  Lock
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#020617] text-text-main overflow-hidden selection:bg-sky-500 selection:text-white transition-colors duration-300">
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
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 !text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2"
            >
              AUTHORIZE ACCESS 🔒 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HIGH-FIDELITY CLINICAL HERO ── */}
      <section className="relative min-h-screen w-full bg-[#020617] flex items-center overflow-hidden border-b border-white/5">
        
        {/* Technical Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(14,165,233,0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
        
        {/* Large Background Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-8 w-full z-10 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* ── LEFT: MISSION CONTROL TEXT (6 Columns) ── */}
            <div className="lg:col-span-6 space-y-10">
              
              {/* Status Hub Badge */}
              <div className="inline-flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Node Deployment: DUM-PH_X01</span>
              </div>

              {/* Professional Headline */}
              <div className="space-y-4">
                <h1 className="text-6xl md:text-[5.5rem] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                  Field-To-Clinic <br/>
                  <span className="text-sky-500 not-italic">Live Telemetry.</span>
                </h1>
                <div className="h-1.5 w-24 bg-sky-500 rounded-full" />
              </div>

              {/* Focused Subtext */}
              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                A synchronized health coordination network for <span className="text-white font-bold">Barangay Bantayan</span>. 
                Bridging the communication gap between field caregivers and clinicians with <span className="text-sky-400 font-mono">sub-second latency</span>.
              </p>

              {/* CTA Actions */}
              <div className="flex flex-wrap items-center gap-6 pt-6">
                <Link 
                  to="/login" 
                  className="px-10 py-5 bg-sky-500 hover:bg-sky-400 !text-slate-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl shadow-sky-500/30 active:scale-95 flex items-center gap-3"
                >
                  Authorize Access <Lock size={16} />
                </Link>
              </div>
            </div>

            {/* ── RIGHT: TELEMETRY NETWORK VISUAL (6 Columns) ── */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[550px] aspect-square">
                
                {/* Main Core Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/5 rounded-[4rem] border border-sky-500/10 backdrop-blur-3xl flex items-center justify-center z-20 shadow-2xl">
                   <div className="w-48 h-48 bg-sky-500/10 rounded-[3rem] border border-sky-500/20 flex items-center justify-center">
                      <div className="w-32 h-32 bg-sky-500/20 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                         <Heart size={80} className="text-sky-500" fill="currentColor" />
                      </div>
                   </div>
                   <p className="absolute bottom-6 text-[9px] font-black text-sky-500/60 uppercase tracking-[0.3em]">Central Hub</p>
                </div>

                {/* Floating Telemetry Nodes (Strategic Placement) */}
                {/* BHW Node 01 */}
                <div className="absolute top-[5%] left-[5%] p-5 bg-slate-900/80 border border-emerald-500/30 rounded-3xl backdrop-blur-xl shadow-2xl animate-float z-30">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Node_BHW_01</span>
                   </div>
                   <p className="text-lg font-mono text-white font-black">BP: 120/80</p>
                   <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1">Status: Normal</p>
                </div>

                {/* BHW Node 02 (Urgent) */}
                <div className="absolute bottom-[10%] right-[5%] p-5 bg-slate-900/80 border border-rose-500/30 rounded-3xl backdrop-blur-xl shadow-2xl animate-float z-30" style={{ animationDelay: '1.5s' }}>
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Node_BHW_04</span>
                   </div>
                   <p className="text-lg font-mono text-rose-400 font-black">O2: 89%</p>
                   <p className="text-[8px] font-bold text-rose-500 uppercase mt-1">Alert: Critical</p>
                </div>

                {/* Connection Web (SVG) */}
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 100 100">
                   <path d="M 20 20 L 50 50" stroke="#0ea5e9" strokeWidth="0.2" strokeDasharray="2 2" />
                   <path d="M 80 80 L 50 50" stroke="#f43f5e" strokeWidth="0.2" strokeDasharray="2 2" />
                   <circle cx="50" cy="50" r="40" stroke="rgba(14,165,233,0.1)" fill="none" strokeWidth="0.1" />
                   <circle cx="50" cy="50" r="30" stroke="rgba(14,165,233,0.1)" fill="none" strokeWidth="0.1" />
                </svg>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SYSTEM CAPABILITIES SECTION ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FeatureInfo title="Caregiver Support" desc="Real-time field reporting and shift management for BHWs." />
          <FeatureInfo title="Patient Records" desc="Centralized clinical dossiers with longitudinal trend tracking." />
          <FeatureInfo title="Medical Consults" desc="Direct coordination pipeline between field staff and doctors." />
          <FeatureInfo title="Emergency SOS" desc="Sub-second latency crisis alerts with global system takeover." />
        </div>
      </section>

      {/* ── CLEAN PROFESSIONAL FOOTER ── */}
      <footer className="bg-[#020617] border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <Heart size={18} fill="white" className="text-white" />
              </div>
              <span className="font-black text-white uppercase tracking-tighter text-xl">
                Bantayan<span className="text-sky-500">Care</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Empowering Barangay Bantayan through automated care coordination and real-time health monitoring protocols.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
               <ShieldCheck size={12} className="text-emerald-500" />
               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">HIPAA Compliant System</span>
            </div>
          </div>

          {/* Column 2: Quick Nodes */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-500 hover:text-sky-400 text-xs transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-sky-400 text-xs transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Deployment</h4>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Dumaguete City<br/>Negros Oriental</p>
            </div>
          </div>

          {/* Column 3: System Status */}
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
               <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase">Operational</span>
               </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              All nodes are currently synchronized with the regional health gateway.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
            © 2026 BantayanCare. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
             <Globe size={18} className="text-white cursor-pointer hover:text-sky-500" />
             <Mail size={18} className="text-white cursor-pointer hover:text-sky-500" />
             <Navigation size={18} className="text-white cursor-pointer hover:text-sky-500" />
          </div>
        </div>
      </footer>
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
