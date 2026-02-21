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
      try {
        const response = await originalFetch(...args);
        
        // Check if response is 401 
        if (response.status === 401) {
          // Clone response so we can read it without consuming the original
          const clonedResponse = response.clone();
          
          try {
            const data = await clonedResponse.json();
            
            if (data.reason === 'SESSION_INVALIDATED') {
              // Get user role BEFORE clearing localStorage
              const userRole = localStorage.getItem('userRole');
              
              // Clear auth tokens
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              
              // Show notification
              toast({
                title: 'Session Ended',
                description: 'You logged in from another device. Please log in again.',
                variant: 'destructive',
              });
              
              // Redirect to appropriate login page based on original role
              if (userRole === 'admin') {
                navigate('/admin/login?reason=SESSION_INVALIDATED');
              } else {
                navigate('/driver/login?reason=SESSION_INVALIDATED');
              }
            }
          } catch (parseError) {
            // Silently ignore JSON parse errors - return original response
            return response;
          }
        }
        
        return response;
      } catch (error) {
        // If fetch itself fails, rethrow
        throw error;
      }
    };

    // Cleanup on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate, toast]);
}
