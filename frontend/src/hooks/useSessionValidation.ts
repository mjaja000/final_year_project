import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

/**
 * Hook to handle session invalidation globally
 * Detects when a request returns SESSION_INVALIDATED and redirects to login
 */
export function useSessionValidation() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Intercept fetch to monitor for SESSION_INVALIDATED
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if response is 401 with SESSION_INVALIDATED reason
      if (response.status === 401) {
        try {
          const data = await response.json();
          
          if (data.reason === 'SESSION_INVALIDATED') {
            // Clear auth tokens
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            
            // Show notification
            toast({
              title: 'Session Ended',
              description: 'You logged in from another device. Please log in again.',
              variant: 'destructive',
            });
            
            // Redirect to appropriate login page
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'admin') {
              navigate('/admin/login?reason=SESSION_INVALIDATED');
            } else {
              navigate('/driver/login?reason=SESSION_INVALIDATED');
            }
          }
          
          // Return new response since we consumed the body
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        } catch (e) {
          // If JSON parsing fails, return original response
          return response;
        }
      }
      
      return response;
    };

    // Cleanup on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate, toast]);
}
