'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  // Check if we're in user creation mode
  const isCreatingUser = typeof window !== 'undefined' && sessionStorage.getItem('creating_user') === 'true';

  if (isCreatingUser) {
    // Show user creation specific loading
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
        </div>
      </div>
    );
  }

  // Normal loading state
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
