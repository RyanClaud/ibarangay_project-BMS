'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as FormHelperText,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, Role } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'Admin',
    'Barangay Captain',
    'Secretary',
    'Treasurer',
    'BHW',
    'Encoder',
    'Resident',
  ]),
  status: z.enum(['Active', 'Inactive']),
});

type UserFormData = z.infer<typeof userSchema>;

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: Partial<User> & { id: string }) => void;
  user: User;
}

const ROLES: Role[] = [
  'Admin',
  'Barangay Captain',
  'Secretary',
  'Treasurer',
  'BHW',
  'Encoder',
  'Resident',
];

export function EditUserDialog({ isOpen, onClose, onUpdateUser, user }: EditUserDialogProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Staff' as any,
      status: 'Active',
    },
  });

  useEffect(() => {
    if (user) {
      const isUserInactive = user.isDeleted || user.status === 'Inactive';
      form.reset({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'Resident',
        status: isUserInactive ? 'Inactive' : 'Active',
      });
    }
  }, [user, form]);

  const onSubmit = (data: UserFormData) => {
    const isInactive = data.status === 'Inactive';
    onUpdateUser({
      id: user.id,
      name: data.name,
      role: data.role,
      status: data.status,
      isDeleted: isInactive,
      ...(isInactive ? { deletedAt: new Date().toISOString() } : { deletedAt: undefined }),
    });
    toast({
      title: 'User Account Updated',
      description: `${data.name}'s information and account status have been saved.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#172B4D]">
            Edit User Profile &amp; Role
          </DialogTitle>
          <DialogDescription className="text-xs text-[#718096]">
            Configure name, administrative role, and system account status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Dela Cruz" className="rounded-xl border-[#E2E8F0]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-[#172B4D]">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      className="rounded-xl border-[#E2E8F0] bg-[#F8FAFC]"
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormHelperText className="text-[11px] text-[#718096]">
                    Email is linked to authentication credentials and cannot be changed directly.
                  </FormHelperText>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">System Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-[#E2E8F0]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role} className="text-xs">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">Account Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-[#E2E8F0]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Active" className="text-xs text-[#10A875] font-semibold">
                          Active
                        </SelectItem>
                        <SelectItem value="Inactive" className="text-xs text-[#EF4655] font-semibold">
                          Inactive / Deactivated
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl text-xs">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl text-xs font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
