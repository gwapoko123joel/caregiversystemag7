import { Shield, Building, Phone, Calendar, MapPin } from 'lucide-react';
import { FormField } from '../../shared/ProfilePage';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
}

export function AdminProfileSection({ formData, setFormData }: Props) {
  const adminLevels = [
    { value: 'barangay_health_officer', label: 'Barangay Health Officer' },
    { value: 'system_admin', label: 'System Administrator' },
    { value: 'super_admin', label: 'Super Administrator' },
  ];

  const adminLevelDescriptions: Record<string, string> = {
    barangay_health_officer: 'Manages local barangay health operations and field caregivers',
    system_admin: 'Oversees system operations, user authorization, and platform configuration',
    super_admin: 'Full system control with audit and override capabilities',
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 mb-6 
                     flex items-center gap-2">
        <Shield className="w-4 h-4" strokeWidth={1.5} />
        Administrative Authority
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Level - Custom select with descriptions */}
        <div className="md:col-span-2">
          <label className="block text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-2">
            Admin Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {adminLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setFormData({ ...formData, admin_level: level.value })}
                className={`p-4 rounded-xl border text-left transition-all
                          ${formData.admin_level === level.value
                            ? 'bg-cyan-500/15 border-cyan-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${
                    formData.admin_level === level.value ? 'text-cyan-300' : 'text-slate-50/40'
                  }`} strokeWidth={1.5} />
                  <span className={`text-xs font-light tracking-wider uppercase
                                  ${formData.admin_level === level.value 
                                    ? 'text-cyan-300' 
                                    : 'text-slate-50/60'}`}>
                    {level.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {formData.admin_level && (
            <p className="text-xs font-light text-slate-50/50 mt-3 leading-relaxed">
              {adminLevelDescriptions[formData.admin_level]}
            </p>
          )}
        </div>

        <FormField
          label="Department"
          icon={Building}
          value={formData.department || ''}
          onChange={(v: string) => setFormData({ ...formData, department: v })}
          placeholder="e.g., Barangay Health Office"
        />

        <FormField
          label="Office Phone"
          icon={Phone}
          value={formData.office_phone || ''}
          onChange={(v: string) => setFormData({ ...formData, office_phone: v })}
          placeholder="+639XXXXXXXXX"
        />

        <FormField
          label="Appointment Date"
          icon={Calendar}
          type="date"
          value={formData.appointment_date || ''}
          onChange={(v: string) => setFormData({ ...formData, appointment_date: v })}
        />

        <div className="md:col-span-1">
          <FormField
            label="Jurisdiction"
            icon={MapPin}
            value={formData.jurisdiction || ''}
            onChange={(v: string) => setFormData({ ...formData, jurisdiction: v })}
            placeholder="Areas of oversight"
          />
        </div>
      </div>

      {/* Authority indicator banner */}
      {formData.admin_level && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20
                        flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30
                          flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-cyan-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-1 leading-relaxed">
                Active Authority
              </p>
              <p className="text-sm font-light text-slate-50 leading-relaxed">
                {adminLevels.find(l => l.value === formData.admin_level)?.label}
              </p>
              {formData.jurisdiction && (
                <p className="text-xs font-light text-slate-50/50 mt-1 leading-relaxed">
                  Jurisdiction: {formData.jurisdiction}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
