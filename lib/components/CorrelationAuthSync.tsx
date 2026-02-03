/**
 * Correlation Auth Sync Component
 * 
 * Synchronizes correlation context with authentication state.
 * Must be used within BackendAuthProvider to access auth context.
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '../providers/backend-auth-provider';
import { useCorrelationContext } from '../hooks/useCorrelationContext';

export function CorrelationAuthSync() {
  const { user } = useAuth();
  const { getContext } = useCorrelationContext(user?.id);

  useEffect(() => {
    // Update correlation context when user changes
    if (user?.id) {
      const context = getContext();
      if (context && context.userId !== user.id) {
        // Context will be updated by the hook dependency
        console.debug('Correlation context updated for user:', user.id);
      }
    }
  }, [user?.id, getContext]);

  // This component doesn't render anything, it just manages correlation state
  return null;
}