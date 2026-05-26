import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentSession } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'wrong_role'>('checking');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const sessionData = await getCurrentSession();

      if (!sessionData || !sessionData.user) {
        setStatus('unauthorized');
        return;
      }

      if (!sessionData.role) {
        setStatus('unauthorized');
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(sessionData.role)) {
        setUserRole(sessionData.role);
        setStatus('wrong_role');
        return;
      }

      setUserRole(sessionData.role);
      setStatus('authorized');
    };

    verify();
  }, [allowedRoles]);

  // Loading state
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
        <p className="text-[10px] tracking-[0.25em] text-slate-500 uppercase leading-relaxed">
          Verifying Access Credentials...
        </p>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to correct dashboard
  if (status === 'wrong_role') {
    const redirectMap: Record<string, string> = {
      admin: '/dashboard/admin',
      medical_practitioner: '/dashboard/practitioner',
      caregiver: '/dashboard/caregiver',
    };
    const redirect = userRole ? (redirectMap[userRole] || '/login') : '/login';
    return <Navigate to={redirect} replace />;
  }

  // Authorized
  return <>{children}</>;
};

export default ProtectedRoute;
