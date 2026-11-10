'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, KeyRound, Check, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

interface ResetPasswordDialogProps {
  user?: User | null;
  targetUser?: User | null;
  adminUid?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({
  user,
  targetUser,
  adminUid,
  isOpen,
  onClose,
}: ResetPasswordDialogProps) {
  const effectiveUser = user || targetUser;
  const { sendPasswordReset, currentUser } = useAppContext();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSettingTemp, setIsSettingTemp] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!effectiveUser) return null;

  const handleSendEmailReset = async () => {
    if (!effectiveUser.email) {
      toast({
        title: 'Missing Email',
        description: 'This user account does not have a valid email address on file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      await sendPasswordReset(effectiveUser.email);
      toast({
        title: 'Password Reset Dispatched',
        description: `A secure password reset link was sent to ${effectiveUser.email}. The resident can create a new password without exposing their credentials.`,
      });
      onClose();
    } catch (error: any) {
      console.error('Password reset email error:', error);
      toast({
        title: 'Reset Failed',
        description: error.message || 'Could not send password reset email.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateTemporaryPassword = async () => {
    const callerId = adminUid || currentUser?.id;
    if (!callerId) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in as an administrator to reset user passwords.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a secure, user-friendly temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `MinaDeOro@${code}!`;

    try {
      setIsSettingTemp(true);
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUid: effectiveUser.id,
          newPassword: generated,
          adminUid: callerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user password in authentication service.');
      }

      setTempPassword(generated);
      toast({
        title: 'Temporary Password Set & Activated',
        description: `New password updated in Firebase Auth. Provide it securely to ${effectiveUser.name}.`,
      });
    } catch (err: any) {
      console.error('Failed to set temporary password:', err);
      toast({
        title: 'Password Reset Failed',
        description: err.message || 'Could not update password in authentication service.',
        variant: 'destructive',
      });
    } finally {
      setIsSettingTemp(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied to Clipboard',
        description: 'Temporary password copied. Please provide it securely to the resident.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#FFA51E]">
              <KeyRound className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#172B4D]">
                Reset Resident Password
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Secure administrative reset workflow for {effectiveUser.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* User Summary */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#718096]">Account Holder:</span>
              <span className="font-semibold text-[#172B4D]">{effectiveUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Email Address:</span>
              <span className="font-mono text-[#246BDE]">{effectiveUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Account Role:</span>
              <span className="font-medium text-[#172B4D]">{effectiveUser.role}</span>
            </div>
          </div>

          {/* Method 1: Email Reset Link (Recommended) */}
          <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#EAF2FF]/50 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Mail className="size-4.5 text-[#246BDE] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#172B4D]">Email Password Reset Link (Recommended)</p>
                <p className="text-[11px] text-[#718096] leading-relaxed">
                  Sends an encrypted link directly to the resident&apos;s email address. The resident creates their own new password securely without exposing credentials to staff.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSendEmailReset}
              disabled={isSending}
              className="w-full bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl text-xs font-semibold h-9 gap-2 shadow-xs"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  <span>Send Reset Email to Resident</span>
                </>
              )}
            </Button>
          </div>

          {/* Method 2: Temporary Access Token */}
          <div className="p-4 rounded-xl border border-[#E5EAF2] bg-white space-y-2.5">
            <div className="flex items-start gap-2.5">
              <KeyRound className="size-4.5 text-[#718096] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#172B4D]">Generate Temporary Access Password</p>
                <p className="text-[11px] text-[#718096] leading-relaxed">
                  For residents who cannot access their email or are visiting the Barangay Hall in person.
                </p>
              </div>
            </div>

            {tempPassword ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F4FA] border border-[#E2E8F0]">
                  <span className="font-mono text-sm font-bold text-[#172B4D]">
                    {tempPassword}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="h-7 text-xs rounded-lg gap-1 border-[#246BDE] text-[#246BDE] hover:bg-[#EAF2FF]"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="text-[10px] text-[#718096]">
                  Advise the resident to log in and immediately update their password under Account Settings.
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleGenerateTemporaryPassword}
                disabled={isSettingTemp}
                className="w-full text-xs rounded-xl font-semibold h-9 text-[#172B4D] border-[#E5EAF2] hover:bg-[#F8FAFC] gap-2"
              >
                {isSettingTemp ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-[#246BDE]" />
                    <span>Setting Password in Firebase Auth...</span>
                  </>
                ) : (
                  <span>Generate &amp; Set One-Time Temporary Password</span>
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs text-[#718096]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
