'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Installation Not Available',
        description: 'This app is already installed or your browser does not support installation.',
        variant: 'default',
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: 'App Installed!',
        description: 'iBarangay has been installed successfully.',
      });
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4" />
        Installed
      </Button>
    );
  }

  if (!deferredPrompt) {
    return null;
  }

  return (
    <Button onClick={handleInstall} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
