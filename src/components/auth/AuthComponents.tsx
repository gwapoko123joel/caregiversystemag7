import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

// ============================================
// ANIMATED BACKGROUND PARTICLES
// ============================================
export const AuthBackground = ({ variant = 'default' }: { variant?: 'default' | 'governance' }) => {
  const colors = variant === 'governance'
    ? ['bg-red-500/5', 'bg-amber-500/5', 'bg-orange-500/5']
    : ['bg-cyan-500/5', 'bg-blue-500/5', 'bg-indigo-500/5'];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Animated orbs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 60, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${colors[0]} blur-3xl`}
      />
      <motion.div
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 60, -100, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${colors[1]} blur-3xl`}
      />
      <motion.div
        animate={{
          x: [0, 60, -80, 0],
          y: [0, -40, 80, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full ${colors[2]} blur-3xl`}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

// ============================================
// BANTAYANCARE LOGO
// ============================================
export const BantayanLogo = ({ size = 'default' }: { size?: 'default' | 'large' }) => {
  const sizes = {
    default: { icon: 'w-10 h-10', text: 'text-xl' },
    large: { icon: 'w-12 h-12', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.default;

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.icon} rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 
                        flex items-center justify-center shadow-lg shadow-cyan-500/25`}>
        <Heart className="w-5 h-5 text-white fill-white" />
      </div>
      <span className={`${s.text} font-black tracking-tight text-white`}>
        BANTAYAN<span className="text-cyan-400">CARE</span>
      </span>
    </div>
  );
};

// ============================================
// INPUT FIELD
// ============================================
interface AuthInputProps {
  icon: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  icon,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  autoComplete = 'off',
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
}) => (
  <div className="space-y-2">
    <label className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
      {icon}
      {label}
    </label>
    <div className="relative">
      <input
        type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 
                   text-sm text-white placeholder-slate-500
                   focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 
                   focus:bg-slate-800/80 outline-none transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 
                     hover:text-cyan-400 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  </div>
);

// ============================================
// SUBMIT BUTTON
// ============================================
interface AuthButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'governance';
}

export const AuthButton: React.FC<AuthButtonProps> = ({ loading, children, onClick, variant = 'default' }) => {
  const variants = {
    default: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25',
    governance: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-500/25',
  };

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={loading}
      className={`w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wider uppercase
                  shadow-lg transition-all duration-300 
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  ${variants[variant]}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Authenticating...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// ============================================
// ERROR ALERT
// ============================================
export const AuthError = ({ message, onDismiss }: { message: string, onDismiss?: () => void }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 
                   bg-red-500/10 backdrop-blur-sm"
      >
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-300">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================
// NODE FOOTER
// ============================================
export const AuthNodeFooter = ({ variant = 'default' }: { variant?: 'default' | 'governance' }) => (
  <div className="text-center space-y-1">
    <p className="text-[10px] tracking-[0.25em] text-slate-600 uppercase">
      {variant === 'governance'
        ? '🔒 This access point is monitored and logged'
        : '⊙ Secured connection — Barangay Bantayan Network'
      }
    </p>
    <p className="text-[9px] tracking-[0.2em] text-slate-700 uppercase">
      Encrypted Node: DUMAGUETE-X01
    </p>
  </div>
);
