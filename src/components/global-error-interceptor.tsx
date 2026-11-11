'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global error interceptor that handles ChunkLoadErrors on new deployments
 * and suppresses spurious errors during user creation
 */
export function GlobalErrorInterceptor() {
  const pathname = usePathname();

  useEffect(() => {
    const isCreatingUser = () => {
      if (typeof window === 'undefined') return false;
      return sessionStorage.getItem('creating_user') === 'true';
    };

    // Auto-reload on ChunkLoadError / failed chunks to seamlessly recover after new deployments
    const handleChunkError = (message: string, errorObj?: any) => {
      const isChunkError =
        errorObj?.name === 'ChunkLoadError' ||
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('no-response');

      if (isChunkError) {
        const reloadKey = 'chunk_error_reload_ts';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        // Reload once within 15 seconds to fetch latest build from Vercel
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(reloadKey, now.toString());
          console.warn('🔄 Stale deployment chunk detected. Refreshing page for latest version...');
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(async (registrations) => {
              for (const reg of registrations) {
                await reg.unregister();
              }
              window.location.reload();
            }).catch(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
          return true;
        }
      }
      return false;
    };

    if (isCreatingUser()) {
      const style = document.createElement('style');
      style.id = 'global-error-interceptor-styles';
      style.textContent = `
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
        .creating-user-fullscreen-overlay {
          z-index: 2147483647 !important;
          position: fixed !important;
          inset: 0 !important;
        }
        body {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || (typeof event.reason === 'string' ? event.reason : '') || '';
      
      if (handleChunkError(reasonMsg, event.reason)) {
        event.preventDefault();
        return;
      }

      if (isCreatingUser()) {
        if (
          reasonMsg.includes('Missing or insufficient permissions') ||
          reasonMsg.includes('PERMISSION_DENIED') ||
          reasonMsg.includes('permission-denied') ||
          reasonMsg.includes('FirebaseError') ||
          reasonMsg.includes('auth/')
        ) {
          console.log('🔒 Suppressed error during user creation:', reasonMsg);
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
      }
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      
      if (handleChunkError(message, event.error)) {
        event.preventDefault();
        return;
      }

      if (isCreatingUser()) {
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

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
      const styleEl = document.getElementById('global-error-interceptor-styles');
      if (styleEl) styleEl.remove();
    };
  }, [pathname]);

  return null;
}
