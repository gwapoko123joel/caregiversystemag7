import { Award, Clock, MapPin } from 'lucide-react';
import { FormField } from '../../ProfilePage';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
}

export function CaregiverProfileSection({ formData, setFormData }: Props) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 mb-6 
                     flex items-center gap-2">
        <Award className="w-4 h-4" strokeWidth={1.5} />
        Caregiver Field Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="BHW ID Number"
          icon={Award}
          value={formData.bhw_id_number || ''}
          onChange={(v: string) => setFormData({ ...formData, bhw_id_number: v })}
          placeholder="Barangay Health Worker ID"
        />
        <FormField 
          label="Assigned Barangay"
          icon={MapPin}
          value={formData.assigned_barangay || ''}
          onChange={(v: string) => setFormData({ ...formData, assigned_barangay: v })}
          placeholder="e.g., Bantayan"
        />
        <div className="md:col-span-2">
          <FormField 
            label="Shift Schedule"
            icon={Clock}
            value={formData.shift_schedule || ''}
            onChange={(v: string) => setFormData({ ...formData, shift_schedule: v })}
            placeholder="e.g., Monday-Friday, 8AM-5PM"
          />
        </div>
      </div>
    </div>
  );
}
