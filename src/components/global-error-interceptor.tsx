'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global error interceptor that prevents error pages from showing during user creation
 */
export function GlobalErrorInterceptor() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're in user creation mode
    const isCreatingUser = () => {
      if (typeof window === 'undefined') return false;
      return sessionStorage.getItem('creating_user') === 'true';
    };

    // If in creation mode, add aggressive CSS to hide everything except our overlay
    if (isCreatingUser()) {
      const style = document.createElement('style');
      style.id = 'global-error-interceptor-styles';
      style.textContent = `
        /* Hide Next.js error overlays and dialogs */
        body > nextjs-portal,
        body > [data-nextjs-dialog-overlay],
        body > [data-nextjs-dialog],
        body > [data-nextjs-toast],
        body > [data-nextjs-error-overlay],
        body > [data-overlay-container],
        #__next-build-watcher,
        [data-nextjs-error],
        [data-nextjs-scroll-lock],
        .nextjs-container-errors-pseudo-html,
        .nextjs-container-errors,
        .nextjs-toast-errors {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -9999 !important;
        }
        
        /* Ensure creating user overlay is always on top */
        .creating-user-fullscreen-overlay {
          z-index: 2147483647 !important;
          position: fixed !important;
          inset: 0 !important;
        }
        
        /* Prevent body scroll during creation */
        body {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Intercept unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isCreatingUser()) {
        const reason = event.reason?.message || event.reason || '';
        if (
          reason.includes('Missing or insufficient permissions') ||
          reason.includes('PERMISSION_DENIED') ||
          reason.includes('permission-denied') ||
          reason.includes('FirebaseError') ||
          reason.includes('auth/')
        ) {
          console.log('🔒 Suppressed error during user creation:', reason);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
      }
    };

    // Intercept errors
    const handleError = (event: ErrorEvent) => {
      if (isCreatingUser()) {
        const message = event.message || '';
        if (
          message.includes('Missing or insufficient permissions') ||
          message.includes('PERMISSION_DENIED') ||
          message.includes('permission-denied') ||
          message.includes('FirebaseError') ||
          message.includes('auth/')
        ) {
          console.log('🔒 Suppressed error during user creation:', message);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
      }
    };

    // Add event listeners with capture phase to intercept early
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
      
      const styleEl = document.getElementById('global-error-interceptor-styles');
      if (styleEl) styleEl.remove();
    };
  }, [pathname]);

  return null;
}
