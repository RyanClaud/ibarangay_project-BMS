'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CreatingUserPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if we're still in user creation mode
    const checkStatus = setInterval(() => {
      const isCreating = sessionStorage.getItem('creating_user') === 'true';
      
      if (!isCreating) {
        // User creation complete, redirect back
        clearInterval(checkStatus);
        router.push('/settings?tab=users');
      }
    }, 500);

    // Timeout after 15 seconds (safety)
    const timeout = setTimeout(() => {
      clearInterval(checkStatus);
      sessionStorage.removeItem('creating_user');
      router.push('/settings?tab=users');
    }, 15000);

    return () => {
      clearInterval(checkStatus);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
            <span>Setting up user profile</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
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
