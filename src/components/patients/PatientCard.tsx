import React from 'react';
import { User, MapPin, Calendar, ClipboardList, UserPlus, ShieldCheck, XCircle } from 'lucide-react';
import type { Patient } from '../../types/database';
import PatientStatusBadge from './PatientStatusBadge';
import { calculateAge } from '../../utils/medical';

interface PatientCardProps {
  patient: Patient;
  onViewDetails?: (patient: Patient) => void;
  onVerify?: (patient: Patient) => void;
  onReject?: (patient: Patient) => void;
  onReassign?: (patient: Patient) => void;
  showActions?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onViewDetails, 
  onVerify, 
  onReject, 
  onReassign,
  showActions = true 
}) => {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,209,255,0.1)]">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-lg font-light tracking-[0.1em] text-white uppercase">{fullName}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> {calculateAge(patient.date_of_birth)}
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                PT-ID: {patient.patient_id.toString().padStart(4, '0')}
              </span>
            </div>
          </div>
        </div>
        <PatientStatusBadge status={patient.registration_status || 'active'} />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-slate-400">
          <MapPin size={14} className="text-sky-500" />
          <span className="text-xs font-light tracking-wide truncate">{patient.address || 'Barangay Bantayan'}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <ClipboardList size={14} className="text-sky-500" />
          <span className="text-xs font-light tracking-wide truncate">
            {patient.medical_conditions || 'No conditions listed'}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
          {patient.registration_status === 'pending_verification' ? (
            <>
              <button 
                onClick={() => onVerify?.(patient)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-cyan/30 transition-all"
              >
                <ShieldCheck size={14} /> APPROVE
              </button>
              <button 
                onClick={() => onReject?.(patient)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                <XCircle size={14} /> REJECT
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onViewDetails?.(patient)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                DETAILS →
              </button>
              {onReassign && (
                <button 
                  onClick={() => onReassign?.(patient)}
                  className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-sky-500/20 transition-all"
                  title="Reassign Caregiver"
                >
                  <UserPlus size={14} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientCard;
