'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/app-context';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const { changePassword } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Failed to Change Password',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-[#172B4D]">
              <span className="text-xl">🔐</span>
              Change Account Password
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] mt-1">
              Update your password here. After saving, you will be logged out and will need to sign in again.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3.5">
              <p className="text-xs text-[#FFA51E]">
                <strong className="text-[#172B4D]">Security Tip:</strong> Use a strong password with at least 6 characters, including letters, numbers, and symbols.
              </p>
            </div>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">Current Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your current password" 
                      className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your new password (min. 6 characters)" 
                      className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Re-enter your new password" 
                      className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#718096]">
              You will be automatically logged out after changing your password
            </p>
            <Button 
              type="submit" 
              disabled={isSaving} 
              className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-semibold text-xs h-10 px-5 shadow-xs"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
