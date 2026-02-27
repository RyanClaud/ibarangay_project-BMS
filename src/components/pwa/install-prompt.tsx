'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-500">
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Install iBarangay</CardTitle>
                <CardDescription className="text-xs">
                  Get the app experience
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Works offline</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Faster loading</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Home screen access</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Native app feel</span>
            </li>
          </ul>
        </CardContent>

        <CardFooter className="flex gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Not Now
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Install
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
