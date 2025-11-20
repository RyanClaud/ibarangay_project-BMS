'use client';

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Monitor user creation mode
  useEffect(() => {
    const checkCreationMode = () => {
      const creating = sessionStorage.getItem('creating_user') === 'true';
      setIsCreatingUser(creating);
    };

    checkCreationMode();
    const interval = setInterval(checkCreationMode, 100);
    
    return () => clearInterval(interval);
  }, []);

  // If creating user, show loading overlay
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

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar className="no-print">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
          <Header className="no-print" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
