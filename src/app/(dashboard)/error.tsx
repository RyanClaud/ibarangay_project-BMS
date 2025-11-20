'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // CRITICAL: Check creation mode IMMEDIATELY
  const [isCreatingUser, setIsCreatingUser] = useState(() => {
    if (typeof window === 'undefined') return false;
    const creating = sessionStorage.getItem('creating_user') === 'true';
    console.log('🔍 Dashboard error boundary - creation mode:', creating);
    return creating;
  });

  useEffect(() => {
    // Check if we're in user creation mode
    const checkAndUpdate = () => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
      return creating;
    };

    const creating = checkAndUpdate();
    
    if (creating) {
      // During user creation, suppress the error completely
      console.log('🔒 Dashboard error suppressed during user creation:', error.message);
      
      // Poll for completion
      const checkInterval = setInterval(() => {
        const stillCreating = sessionStorage.getItem('creating_user') === 'true';
        if (!stillCreating) {
          clearInterval(checkInterval);
          console.log('✅ Creation complete - reloading from dashboard error boundary');
          window.location.reload();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    } else {
      // Normal error handling
      console.error('Dashboard error:', error);
    }
  }, [error]);

  // Continuously monitor creation mode
  useEffect(() => {
    const interval = setInterval(() => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // If in creation mode, show loading overlay
  if (isCreatingUser) {
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

  // Normal error page for dashboard errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Dashboard Error
          </h1>
          <p className="text-muted-foreground">
            {error.message || 'An error occurred in the dashboard'}
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
