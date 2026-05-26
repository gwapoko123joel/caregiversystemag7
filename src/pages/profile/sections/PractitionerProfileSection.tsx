import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, Shield, Award, Building2, 
  CheckCircle2, Clock, XCircle, AlertTriangle,
  Phone, Calendar, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import type { PractitionerCredentials } from '../../../types/database';

interface Props {
  caregiverId: string;
}

export function PractitionerProfileSection({ caregiverId }: Props) {
  const [credentials, setCredentials] = useState<PractitionerCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredentials = async () => {
      const { data } = await supabase
        .from('practitioner_credentials')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .maybeSingle();
      
      setCredentials(data);
      setLoading(false);
    };
    fetchCredentials();
  }, [caregiverId]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // No credentials submitted yet
  if (!credentials) {
    return (
      <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" 
                          strokeWidth={1.5} />
          <div className="flex-1">
            <h3 className="text-sm font-light tracking-[0.2em] uppercase text-amber-300 mb-2 tracking-tighter leading-tight">
              Credentials Required
            </h3>
            <p className="text-sm font-light text-slate-50/70 mb-4 leading-relaxed">
              You haven't submitted your medical credentials yet. Please complete your 
              practitioner profile to start receiving patient consultations.
            </p>
            <button
              onClick={() => navigate('/profile/credentials/submit')}
              className="px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30
                       border border-amber-500/30 text-amber-300 
                       font-light tracking-wider uppercase text-sm
                       flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Shield className="w-4 h-4" strokeWidth={1.5} />
              Submit Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Credentials exist - render the section
  const statusConfig = {
    verified: { 
      icon: CheckCircle2, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/30',
      label: 'Verified'
    },
    pending: { 
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30',
      label: 'Pending Verification'
    },
    rejected: { 
      icon: XCircle, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/30',
      label: 'Rejected'
    },
    expired: { 
      icon: AlertTriangle, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10', 
      border: 'border-orange-500/30',
      label: 'Expired'
    },
  };

  const status = statusConfig[credentials.verification_status];
  const StatusIcon = status.icon;

  // Calculate days until license expires
  const daysUntilExpiry = Math.floor(
    (new Date(credentials.prc_license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 90;

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      {/* Header with status badge */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 
                       flex items-center gap-2">
          <Stethoscope className="w-4 h-4" strokeWidth={1.5} />
          Medical Credentials
        </h3>
        
        <div className={`px-4 py-2 rounded-full ${status.bg} ${status.border} border
                       flex items-center gap-2`}>
          <StatusIcon className={`w-4 h-4 ${status.color}`} strokeWidth={1.5} />
          <span className={`text-xs font-light tracking-wider uppercase ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Expiry warning */}
      {isExpiringSoon && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30
                   flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm font-light text-orange-200 leading-relaxed">
            Your PRC license expires in {daysUntilExpiry} days. Please renew soon.
          </p>
        </motion.div>
      )}

      {/* Credentials grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CredentialField
          icon={Shield}
          label="PRC License Number"
          value={credentials.prc_license_number}
        />
        
        <CredentialField
          icon={Award}
          label="Profession"
          value={credentials.prc_profession}
        />
        
        <CredentialField
          icon={Calendar}
          label="License Expiry"
          value={new Date(credentials.prc_license_expiry).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        />
        
        <CredentialField
          icon={Building2}
          label="Primary Hospital"
          value={credentials.primary_hospital || 'Not specified'}
        />

        <CredentialField
          icon={Phone}
          label="Clinical Hotline"
          value={credentials.clinical_hotline}
        />

        {credentials.backup_contact && (
          <CredentialField
            icon={Phone}
            label="Backup Contact"
            value={credentials.backup_contact}
          />
        )}
      </div>

      {/* Specializations */}
      {credentials.specializations && credentials.specializations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-3 leading-relaxed">
            Specializations
          </p>
          <div className="flex flex-wrap gap-2">
            {credentials.specializations.map((spec) => (
              <span
                key={spec}
                className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20
                         text-xs font-light tracking-wider text-cyan-200"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hospital affiliations */}
      {credentials.hospital_affiliations && credentials.hospital_affiliations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-3 leading-relaxed">
            Hospital Affiliations
          </p>
          <div className="space-y-2">
            {credentials.hospital_affiliations.map((hospital, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-sm font-light text-slate-50 leading-relaxed">{hospital.name}</p>
                {hospital.role && (
                  <p className="text-xs font-light text-slate-50/60 mt-1 leading-relaxed">{hospital.role}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact preferences */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
        <PreferenceBadge 
          label="Accepts Calls" 
          enabled={credentials.accepts_calls} 
        />
        <PreferenceBadge 
          label="Accepts SMS" 
          enabled={credentials.accepts_sms} 
        />
      </div>

      {/* Action button */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <button
          onClick={() => navigate('/profile/credentials/edit')}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10
                   border border-cyan-500/20 text-cyan-300 
                   font-light tracking-wider uppercase text-sm
                   flex items-center gap-2 transition-colors min-h-[44px]"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
          Request Credential Update
        </button>
        <p className="text-xs font-light text-slate-50/40 mt-2 leading-relaxed">
          Credential changes require admin re-verification
        </p>
      </div>
    </div>
  );
}

function CredentialField({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20
                    flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-cyan-300" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-light tracking-wider uppercase text-cyan-300/60 mb-1 leading-relaxed">
          {label}
        </p>
        <p className="text-sm font-light text-slate-50 truncate leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function PreferenceBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`px-4 py-3 rounded-xl border flex items-center gap-3
                   ${enabled 
                     ? 'bg-emerald-500/10 border-emerald-500/30' 
                     : 'bg-white/5 border-white/10'}`}>
      <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-white/30'}`} />
      <span className={`text-sm font-light ${enabled ? 'text-emerald-200' : 'text-slate-50/50'}`}>
        {label}
      </span>
    </div>
  );
}
