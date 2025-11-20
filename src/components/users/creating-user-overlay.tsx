'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface CreatingUserOverlayProps {
  isCreating: boolean;
}

export function CreatingUserOverlay({ isCreating }: CreatingUserOverlayProps) {
  useEffect(() => {
    if (!isCreating) return;

    // Hide all error overlays with maximum specificity
    const style = document.createElement('style');
    style.id = 'creating-user-overlay-styles';
    style.textContent = `
      /* Hide Next.js error overlays */
      body > nextjs-portal,
      body > [data-nextjs-dialog-overlay],
      body > [data-nextjs-dialog],
      #__next-build-watcher,
      [data-nextjs-toast],
      [data-nextjs-error-overlay],
      [data-overlay-container] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -1 !important;
      }
      
      /* Ensure our overlay is on top */
      .creating-user-fullscreen-overlay {
        z-index: 999999 !important;
      }
    `;
    document.head.appendChild(style);

    // Intercept and suppress console errors
    const originalError = console.error;
    (window as any).__originalConsoleError = originalError;
    
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('Missing or insufficient permissions') || 
          msg.includes('PERMISSION_DENIED') ||
          msg.includes('FirebaseError')) {
        // Silently ignore Firebase errors during creation
        return;
      }
      originalError.apply(console, args);
    };

    // Poll for completion
    const checkInterval = setInterval(() => {
      const stillCreating = sessionStorage.getItem('creating_user') === 'true';
      if (!stillCreating) {
        clearInterval(checkInterval);
        // Reload page after creation completes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }, 500);

    // Cleanup
    return () => {
      clearInterval(checkInterval);
      const styleEl = document.getElementById('creating-user-overlay-styles');
      if (styleEl) styleEl.remove();
      
      // Restore console.error
      if ((window as any).__originalConsoleError) {
        console.error = (window as any).__originalConsoleError;
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
