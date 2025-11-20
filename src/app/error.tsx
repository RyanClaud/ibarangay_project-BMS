'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // CRITICAL: Check creation mode IMMEDIATELY on render
  const [isCreatingUser, setIsCreatingUser] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('creating_user') === 'true';
  });

  useEffect(() => {
    // Continuously check if we're in user creation mode
    const checkCreationMode = () => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
      return creating;
    };

    // Check immediately
    const creating = checkCreationMode();
    
    if (creating) {
      // During user creation, suppress the error and show loading instead
      console.log('🔒 Error suppressed during user creation:', error.message);
      
      // Poll for completion very frequently
      const checkInterval = setInterval(() => {
        const stillCreating = sessionStorage.getItem('creating_user') === 'true';
        if (!stillCreating) {
          clearInterval(checkInterval);
          console.log('✅ Creation complete - reloading immediately');
          window.location.reload();
        }
      }, 100); // Check every 100ms
      
      return () => clearInterval(checkInterval);
    } else {
      // Normal error handling
      console.error('Application error:', error);
    }
  }, [error]);

  // Also check on every render
  useEffect(() => {
    const interval = setInterval(() => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // ALWAYS double-check sessionStorage on every render
  const isCurrentlyCreating = typeof window !== 'undefined' && sessionStorage.getItem('creating_user') === 'true';
  
  if (isCreatingUser || isCurrentlyCreating) {
    // Show loading overlay instead of error during user creation
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        style={{ zIndex: 2147483647 }}
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

  // Normal error page for non-creation errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
