'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, KeyRound, Mail, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import type { ResidentAccountItem } from './user-management-client-page';

interface ActivateResidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resident: ResidentAccountItem | null;
  onSuccess?: () => void;
}

export function ActivateResidentDialog({
  isOpen,
  onClose,
  resident,
  onSuccess,
}: ActivateResidentDialogProps) {
  const { currentUser } = useAppContext();
  const { toast } = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('password123');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-fill sensible default email whenever resident opens
  React.useEffect(() => {
    if (resident) {
      if (resident.email && resident.email.trim() && resident.email !== 'NONE') {
        setEmail(resident.email.trim());
      } else {
        const cleanFirst = (resident.firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLast = (resident.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanPurok = (resident.purok || 'minadeoro').toLowerCase().replace(/[^a-z0-9]/g, '');
        setEmail(`${cleanFirst || 'resident'}.${cleanLast || 'user'}@ibarangay.${cleanPurok}.ph`);
      }
      setPassword('password123');
    }
  }, [resident]);

  if (!resident) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`MinaDeOro@${code}!`);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in as an administrator to activate accounts.',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please provide a valid email address for the resident login account.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const targetResidentId = resident.residentId || resident.id;

      const response = await fetch('/api/admin/create-resident-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: targetResidentId,
          email: email.trim().toLowerCase(),
          password,
          adminUid: currentUser.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create resident login credentials.');
      }

      toast({
        title: 'Resident Portal Account Activated!',
        description: `${resident.name} can now sign in using ${email} (Password: ${password}).`,
        duration: 9000,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Activation error:', err);
      toast({
        title: 'Activation Failed',
        description: err.message || 'Could not provision resident account.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#10A875]">
              <UserCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#172B4D]">
                Activate Resident Portal Access
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Provision online authentication credentials for this registered resident.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleActivate} className="space-y-4 py-2 text-xs">
          {/* Resident Overview Badge */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[#718096]">Resident Name:</span>
              <span className="font-bold text-sm text-[#172B4D]">{resident.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#718096]">Barangay &amp; Purok:</span>
              <span className="font-medium text-[#246BDE]">
                {resident.purok || 'Main Barangay Area'}, Mina de Oro
              </span>
            </div>
            {resident.householdNumber && (
              <div className="flex justify-between items-center">
                <span className="text-[#718096]">Household No:</span>
                <span className="font-mono text-[#172B4D]">{resident.householdNumber}</span>
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <Label htmlFor="res-email" className="text-xs font-semibold text-[#172B4D]">
              Portal Login Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
              <Input
                id="res-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                required
                className="h-9 pl-9 rounded-xl border-[#E2E8F0] text-xs font-medium focus:border-[#246BDE]"
              />
            </div>
            <p className="text-[10px] text-[#718096]">
              This email will be used by the resident to sign into the iBarangay portal.
            </p>
          </div>

          {/* Initial Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="res-password" className="text-xs font-semibold text-[#172B4D]">
                Initial Temporary Password
              </Label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-semibold text-[#246BDE] hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Generate Secure
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
              <Input
                id="res-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                required
                className="h-9 pl-9 rounded-xl border-[#E2E8F0] font-mono text-xs focus:border-[#246BDE]"
              />
            </div>
            <p className="text-[10px] text-[#718096]">
              Advise the resident to update their password after their first successful login.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#EAF2FF] border border-[#BFDBFE] flex items-start gap-2 text-[11px] text-[#1E5CC0]">
            <ShieldCheck className="size-4 shrink-0 mt-0.5" />
            <span>
              This safely creates their Firebase Auth credentials and links their official resident census profile directly to their new portal login account.
            </span>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs text-[#718096]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#10A875] hover:bg-[#0E9366] text-white rounded-xl text-xs font-semibold h-9 px-4 gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <UserCheck className="size-4" />
                  <span>Activate Portal Account</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

