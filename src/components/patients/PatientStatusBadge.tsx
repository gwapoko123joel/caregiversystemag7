import React from 'react';

export type PatientStatus = 'pending_verification' | 'active' | 'inactive' | 'archived' | 'rejected';

interface PatientStatusBadgeProps {
  status: PatientStatus;
  className?: string;
}

const PatientStatusBadge: React.FC<PatientStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending_verification':
        return {
          label: 'PENDING',
          container: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'active':
        return {
          label: 'ACTIVE',
          container: 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan',
          dot: 'bg-brand-cyan shadow-[0_0_8px_rgba(0,209,255,0.5)]',
        };
      case 'inactive':
        return {
          label: 'INACTIVE',
          container: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
          dot: 'bg-slate-500',
        };
      case 'archived':
        return {
          label: 'ARCHIVED',
          container: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
          dot: 'bg-purple-500',
        };
      case 'rejected':
        return {
          label: 'REJECTED',
          container: 'bg-red-500/10 border-red-500/30 text-red-500',
          dot: 'bg-red-500',
        };
      default:
        return {
          label: (status as string).toUpperCase(),
          container: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
          dot: 'bg-slate-500',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${styles.container} ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      <span className="text-[10px] font-light uppercase tracking-widest leading-none">
        {styles.label}
      </span>
    </div>
  );
};

export default PatientStatusBadge;
