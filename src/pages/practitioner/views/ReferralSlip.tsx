import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'

interface ReferralSlipProps {
  data: any
  patient: any
  doctor: any
  onBack: () => void
}

export default function ReferralSlip({ data, patient, doctor, onBack }: ReferralSlipProps) {
  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in zoom-in duration-500">
      {/* Action Bar (Hidden during print) */}
      <div className="flex items-center justify-between mb-8 no-print print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-sidebar-text-muted hover:text-sky-500 transition-colors uppercase text-[10px] font-semibold tracking-widest">
          <ArrowLeft size={16} /> Back to Form
        </button>
        <button 
          onClick={handlePrint}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-50 rounded-2xl flex items-center gap-3 text-xs font-semibold uppercase tracking-widest shadow-lg shadow-sky-500/20 active:scale-95"
        >
          <Printer size={18} /> Print Referral Slip
        </button>
      </div>

      {/* THE DOCUMENT */}
      <div className="bg-white text-slate-900 p-12 rounded-sm shadow-2xl min-h-[11in] font-serif border-[12px] border-slate-100 print:border-none print:shadow-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
          <h1 className="text-xl font-bold uppercase tracking-tighter leading-tight">Republic of the Philippines</h1>
          <h2 className="text-lg font-bold uppercase tracking-tighter leading-tight">Province of Negros Oriental</h2>
          <h3 className="text-md font-bold uppercase tracking-tighter leading-tight">City of Dumaguete</h3>
          <h4 className="text-2xl font-bold mt-2 text-sky-700 font-sans">Barangay Bantayan Health Center</h4>
          <p className="text-[10px] uppercase font-sans font-bold mt-1 text-slate-500 tracking-tighter leading-relaxed">Clinical Referral Node • Automated Coordination System</p>
        </div>

        {/* Title */}
        <div className="flex justify-between items-center mb-10">
          <h5 className="text-2xl font-semibold uppercase tracking-tighter italic border-b-4 border-sky-500 font-sans">Clinical Referral Slip</h5>
          <div className="text-right">
            <p className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">Document ID</p>
            <p className="text-sm font-mono font-bold leading-relaxed">REF-{data.referral_id.slice(0,8).toUpperCase()}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 border-l-4 border-slate-900">
          <div>
            <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase leading-relaxed">Patient Name</p>
            <p className="text-lg font-bold uppercase font-sans leading-relaxed">{patient.first_name} {patient.last_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase leading-relaxed">Date of Referral</p>
            <p className="text-lg font-bold uppercase font-sans leading-relaxed">{new Date(data.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Clinical Context */}
        <div className="space-y-8 mb-12">
          <section>
            <h6 className="text-sm font-sans font-semibold uppercase text-sky-700 border-b border-slate-200 mb-2">Target Facility / Institution</h6>
            <p className="text-lg font-medium font-sans leading-relaxed">{data.target_facility}</p>
          </section>

          <section>
            <h6 className="text-sm font-sans font-semibold uppercase text-sky-700 border-b border-slate-200 mb-2">Reason for Referral</h6>
            <p className="text-md leading-relaxed font-sans">{data.reason_for_referral}</p>
          </section>

          <section>
            <h6 className="text-sm font-sans font-semibold uppercase text-sky-700 border-b border-slate-200 mb-2">Last Synchronized Vitals (Snapshot)</h6>
            <div className="grid grid-cols-4 gap-4 mt-3">
               <div className="text-center p-3 border border-slate-200 rounded">
                  <p className="text-[9px] font-sans font-semibold uppercase leading-relaxed">BP</p>
                  <p className="text-md font-bold font-sans leading-relaxed">{data.vitals_at_referral?.blood_pressure || 'N/A'}</p>
               </div>
               <div className="text-center p-3 border border-slate-200 rounded">
                  <p className="text-[9px] font-sans font-semibold uppercase leading-relaxed">HR</p>
                  <p className="text-md font-bold font-sans leading-relaxed">{data.vitals_at_referral?.heart_rate || 'N/A'} BPM</p>
               </div>
               <div className="text-center p-3 border border-slate-200 rounded">
                  <p className="text-[9px] font-sans font-semibold uppercase leading-relaxed">SpO2</p>
                  <p className="text-md font-bold font-sans leading-relaxed">{data.vitals_at_referral?.oxygen_saturation || 'N/A'}%</p>
               </div>
               <div className="text-center p-3 border border-slate-200 rounded">
                  <p className="text-[9px] font-sans font-semibold uppercase leading-relaxed">Temp</p>
                  <p className="text-md font-bold font-sans leading-relaxed">{data.vitals_at_referral?.temperature || 'N/A'}°C</p>
               </div>
            </div>
          </section>
        </div>

        {/* Signature Area */}
        <div className="mt-20 flex justify-end">
          <div className="text-center w-64 border-t-2 border-slate-900 pt-2">
            <p className="text-md font-semibold uppercase font-sans leading-relaxed">Dr. {doctor.last_name || 'Medical Officer'}, MD</p>
            <p className="text-[10px] font-sans font-semibold uppercase tracking-widest text-slate-500 leading-relaxed">PRC License: {doctor.prc_license || 'XXXXXX'}</p>
            <p className="text-[9px] font-sans text-slate-400 mt-1 italic leading-relaxed">Electronically Signed via BantayanCare</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-6 border-t border-slate-100 flex justify-between items-center opacity-50 grayscale">
          <div className="flex items-center gap-2">
             <ShieldCheck size={14} />
             <span className="text-[8px] font-sans font-bold uppercase tracking-widest">Authenticated Coordination Node</span>
          </div>
          <span className="text-[8px] font-sans font-bold uppercase tracking-widest">© 2026 BantayanCare System • Dumaguete City</span>
        </div>
      </div>
    </div>
  )
}
