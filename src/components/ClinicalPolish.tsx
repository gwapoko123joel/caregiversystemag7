import { motion } from 'framer-motion'
import { RefreshCw, FileQuestion } from 'lucide-react'

/**
 * Skeleton Card for Grid items.
 */
export function SkeletonCard() {
  return (
    <div className="p-6 bg-card border border-card-border rounded-3xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
      </div>
      <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800/50 rounded mb-2 animate-pulse" />
      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      
      {/* Glint Effect */}
      <motion.div 
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
      />
    </div>
  )
}

/**
 * Skeleton Row for Tables.
 */
export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/50 rounded" />
      </td>
    </tr>
  )
}

/**
 * Professional Empty State with 'Retry Node Sync' capability.
 */
export function EmptyState({ 
  title = "No Data Found", 
  message = "The node synchronization returned zero results for this clinical view.", 
  onRetry,
  icon: Icon = FileQuestion
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6 relative group border border-card-border">
        <div className="absolute inset-0 bg-sky-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon size={32} className="text-slate-400 dark:text-slate-600 relative z-10" />
      </div>
      
      <h3 className="text-lg font-semibold text-text-main uppercase mb-2 tracking-tighter leading-tight">{title}</h3>
      <p className="text-sm font-medium text-sidebar-text-muted mb-8 max-w-[280px] leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-card border border-card-border rounded-xl text-[10px] font-semibold uppercase tracking-widest text-text-main hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={14} className="text-sky-500" />
          Retry Node Sync
        </button>
      )}
    </div>
  )
}
