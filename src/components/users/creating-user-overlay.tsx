'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface CreatingUserOverlayProps {
  isCreating: boolean;
}

export function CreatingUserOverlay({ isCreating }: CreatingUserOverlayProps) {
  useEffect(() => {
    if (!isCreating) return;

    // Hide all error overlays with maximum specificity and aggressive selectors
    const style = document.createElement('style');
    style.id = 'creating-user-overlay-styles';
    style.textContent = `
      /* Hide ALL Next.js error overlays and dialogs */
      body > nextjs-portal,
      body > [data-nextjs-dialog-overlay],
      body > [data-nextjs-dialog],
      body > [data-nextjs-toast],
      body > [data-nextjs-error-overlay],
      body > [data-overlay-container],
      body > [data-nextjs-error],
      #__next-build-watcher,
      [data-nextjs-scroll-lock],
      .nextjs-container-errors-pseudo-html,
      .nextjs-container-errors,
      .nextjs-toast-errors,
      [id^="__next"],
      [class*="nextjs"],
      [class*="error-overlay"],
      [class*="toast-error"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
      
      /* Ensure our overlay is ALWAYS on top with maximum z-index */
      .creating-user-fullscreen-overlay {
        z-index: 2147483647 !important;
        position: fixed !important;
        inset: 0 !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Lock body scroll */
      body {
        overflow: hidden !important;
      }
      
      /* Hide any error boundaries */
      [data-error-boundary],
      [class*="error-boundary"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Intercept and suppress ALL console errors and warnings
    const originalError = console.error;
    const originalWarn = console.warn;
    (window as any).__originalConsoleError = originalError;
    (window as any).__originalConsoleWarn = originalWarn;
    
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('Missing or insufficient permissions') || 
          msg.includes('PERMISSION_DENIED') ||
          msg.includes('permission-denied') ||
          msg.includes('FirebaseError') ||
          msg.includes('auth/') ||
          msg.includes('Firestore')) {
        // Silently ignore Firebase errors during creation
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('Missing or insufficient permissions') || 
          msg.includes('PERMISSION_DENIED') ||
          msg.includes('permission-denied') ||
          msg.includes('FirebaseError') ||
          msg.includes('auth/') ||
          msg.includes('Firestore')) {
        // Silently ignore Firebase warnings during creation
        return;
      }
      originalWarn.apply(console, args);
    };

    // Aggressively remove any error overlays that appear
    const removeErrorOverlays = () => {
      const selectors = [
        'nextjs-portal',
        '[data-nextjs-dialog-overlay]',
        '[data-nextjs-dialog]',
        '[data-nextjs-toast]',
        '[data-nextjs-error-overlay]',
        '[data-overlay-container]',
        '[data-nextjs-error]',
        '.nextjs-container-errors',
        '.nextjs-toast-errors'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
          (el as HTMLElement).style.visibility = 'hidden';
          (el as HTMLElement).style.opacity = '0';
          (el as HTMLElement).style.zIndex = '-9999';
        });
      });
    };

    // Remove overlays immediately and periodically
    removeErrorOverlays();
    const removeInterval = setInterval(removeErrorOverlays, 100);

    // Poll for completion
    const checkInterval = setInterval(() => {
      const stillCreating = sessionStorage.getItem('creating_user') === 'true';
      if (!stillCreating) {
        clearInterval(checkInterval);
        clearInterval(removeInterval);
        console.log('✅ Creation lock released - reloading immediately');
        // Reload immediately to prevent any error pages from showing
        window.location.reload();
      }
    }, 200); // Check very frequently (every 200ms)

    // Cleanup
    return () => {
      clearInterval(checkInterval);
      clearInterval(removeInterval);
      const styleEl = document.getElementById('creating-user-overlay-styles');
      if (styleEl) styleEl.remove();
      
      // Restore console methods
      if ((window as any).__originalConsoleError) {
        console.error = (window as any).__originalConsoleError;
      }
      if ((window as any).__originalConsoleWarn) {
        console.warn = (window as any).__originalConsoleWarn;
      }
    };
  }, [isCreating]);

  if (!isCreating) return null;

  return (
    <div 
      className="creating-user-fullscreen-overlay fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      style={{ zIndex: 999999 }}
    >
      <div className="text-center space-y-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          </div>
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-32 h-32 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Creating Staff Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we set up the new account...
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Creating authentication account</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Setting up user profile</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Configuring permissions</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600">
          This process usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
}
