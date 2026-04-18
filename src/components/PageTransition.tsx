import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: ReactNode
}

/**
 * Reusable wrapper for "Slide and Fade" page transitions.
 * Mimics the physical action of pulling a medical chart onto a desk.
 */
export default function PageTransition({ children, ...props }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
        mass: 1,
        duration: 0.35
      }}
      className="w-full h-full"
      {...props}
    >
      {children}
    </motion.div>
  )
}
