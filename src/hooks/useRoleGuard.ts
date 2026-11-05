// ============================================================
// hooks/useRoleGuard.ts — Role-based access guard hook
// Redirects to public view if the current user's role is not
// in the allowed list.
// Usage:  useRoleGuard(['director', 'coordinator'])
// ============================================================
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const { currentUser, setActiveView } = useApp();

  useEffect(() => {
    if (!currentUser) {
      setActiveView('public');
      return;
    }
    if (!allowedRoles.includes(currentUser.role as UserRole)) {
      // Redirect based on actual role
      switch (currentUser.role) {
        case 'scorer':      setActiveView('scorekeeper'); break;
        case 'player':      setActiveView('player');      break;
        case 'guest':       setActiveView('public');      break;
        default:            setActiveView('admin');       break;
      }
    }
  }, [currentUser, allowedRoles, setActiveView]);

  return {
    isAllowed: currentUser ? allowedRoles.includes(currentUser.role as UserRole) : false,
    user: currentUser,
  };
}

