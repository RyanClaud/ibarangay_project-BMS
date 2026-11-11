'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isCreatingUser, setIsCreatingUser] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('creating_user') === 'true';
  });

  const isChunkError = 
    error?.name === 'ChunkLoadError' || 
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('ChunkLoadError') ||
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('no-response');

  useEffect(() => {
    // If a chunk load error occurred (new deployment hash mismatch), auto-reload once
    if (isChunkError) {
      const reloadKey = 'chunk_error_reload_ts';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, now.toString());
        console.warn('🔄 Auto-refreshing on ChunkLoadError to fetch latest deployment...');
        handleHardRefresh();
        return;
      }
    }

    const checkCreationMode = () => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
      return creating;
    };

    const creating = checkCreationMode();
    
    if (creating) {
      console.log('🔒 Error suppressed during user creation:', error.message);
      
      const checkInterval = setInterval(() => {
        const stillCreating = sessionStorage.getItem('creating_user') === 'true';
        if (!stillCreating) {
          clearInterval(checkInterval);
          console.log('✅ Creation complete - reloading immediately');
          window.location.reload();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    } else {
      console.error('Application error:', error);
    }
  }, [error, isChunkError]);

  useEffect(() => {
    const interval = setInterval(() => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const handleHardRefresh = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
    } catch (e) {
      console.error('Failed to unregister service worker:', e);
    } finally {
      window.location.reload();
    }
  };

  const isCurrentlyCreating = typeof window !== 'undefined' && sessionStorage.getItem('creating_user') === 'true';
  
  if (isCreatingUser || isCurrentlyCreating) {
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

  // If this is a chunk load error (new deployment happened), show a friendly update banner
  if (isChunkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="text-center space-y-6 p-8 max-w-md bg-white border border-[#E5EAF2] rounded-2xl shadow-sm">
          <div className="size-14 mx-auto rounded-2xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
            <Sparkles className="size-7 text-[#246BDE]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#102D56]">
              System Update Available
            </h1>
            <p className="text-xs text-[#718096] leading-relaxed">
              A newer version of the platform was recently deployed. Refresh your browser to load the latest application assets.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <button
              onClick={handleHardRefresh}
              className="px-5 py-2.5 bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh Application</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-5 py-2.5 bg-white border border-[#E5EAF2] hover:bg-[#F8FAFC] text-[#172B4D] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Home className="size-3.5 text-[#718096]" />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal error page for non-creation errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="text-center space-y-6 p-8 max-w-md bg-white border border-[#E5EAF2] rounded-2xl shadow-sm">
        <div className="size-14 mx-auto rounded-2xl bg-[#EF4655]/10 text-[#EF4655] flex items-center justify-center">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#102D56]">
            Something went wrong
          </h1>
          <p className="text-xs text-[#718096] break-words">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            onClick={() => handleHardRefresh()}
            className="px-5 py-2.5 bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 bg-white border border-[#E5EAF2] hover:bg-[#F8FAFC] text-[#172B4D] rounded-xl text-xs font-semibold transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
