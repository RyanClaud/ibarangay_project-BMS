"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, KeyRound, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  adminUid: string;
}

/** Generate a random 8-character temporary password (letters + digits) */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function ResetPasswordDialog({
  isOpen,
  onClose,
  targetUser,
  adminUid,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [hasReset, setHasReset] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setNewPassword(generateTempPassword());
      setHasReset(false);
      setCopied(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleReset = async () => {
    if (!targetUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUid: targetUser.id,
          newPassword,
          adminUid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setHasReset(true);
      toast({
        title: "Password Reset",
        description: `Temporary password set for ${targetUser.name}. Share it securely.`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "An error occurred while resetting the password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!isResetting) {
      onClose();
    }
  };

  if (!targetUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-500" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new temporary password for{" "}
            <strong>{targetUser.name}</strong> ({targetUser.email}). The user
            will use this to log in and should change it in Settings afterwards.
          </DialogDescription>
        </DialogHeader>

        {hasReset ? (
          /* ── Success state ── */
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Password reset successfully
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Share this temporary password with the user securely. They
                  should change it after logging in.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newPassword}
                  readOnly
                  className="font-mono text-lg bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Input state ── */
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="font-mono"
                  placeholder="Enter or generate a password"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewPassword(generateTempPassword())}
                  title="Generate new random password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Click the refresh icon to generate a
                random password.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={isResetting || newPassword.length < 6}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
