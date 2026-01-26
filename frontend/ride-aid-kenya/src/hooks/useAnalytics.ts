import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Analytics hook for tracking page views and user interactions
 * Replace with your actual analytics service (Google Analytics, Mixpanel, etc.)
 */
export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    trackPageView(location.pathname);
  }, [location]);

  return {
    trackEvent,
    trackPageView,
    trackConversion,
  };
}

/**
 * Track custom events
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined') {
    // Google Analytics 4 example
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', { category, action, label, value });
    }
  }
}

/**
 * Track page views
 */
export function trackPageView(path: string) {
  if (typeof window !== 'undefined') {
    // Google Analytics 4 example
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Page View:', path);
    }
  }
}

/**
 * Track conversions (payments, form submissions, etc.)
 */
export function trackConversion(
  conversionType: 'payment' | 'feedback' | 'signup',
  value?: number
) {
  if (typeof window !== 'undefined') {
    // Google Analytics 4 example
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID',
        value: value,
        currency: 'KES',
        transaction_id: Date.now().toString(),
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Conversion:', { conversionType, value });
    }
  }
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
