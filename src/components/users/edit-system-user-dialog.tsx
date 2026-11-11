'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog } from 'lucide-react';
import type { User, Barangay } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum([
    'Admin',
    'Barangay Captain',
    'Secretary',
    'Treasurer',
    'BHW',
    'Encoder',
    'Resident',
  ]),
  barangayId: z.string().min(1, 'Barangay is required'),
});

type EditFormData = z.infer<typeof editSchema>;

const ALL_ROLES: EditFormData['role'][] = [
  'Admin',
  'Barangay Captain',
  'Secretary',
  'Treasurer',
  'BHW',
  'Encoder',
  'Resident',
];

interface EditSystemUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  barangays: Barangay[];
  onSaved: () => void;
}

export function EditSystemUserDialog({
  isOpen,
  onClose,
  user,
  barangays,
  onSaved,
}: EditSystemUserDialogProps) {
  const { firestore } = useFirebase();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      role: 'Resident',
      barangayId: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: (user.role as EditFormData['role']) ?? 'Resident',
        barangayId: user.barangayId ?? '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditFormData) => {
    if (!user || !firestore) return;

    try {
      await updateDoc(doc(firestore, 'users', user.id), {
        name: data.name,
        role: data.role,
        barangayId: data.barangayId,
      });

      toast({
        title: 'User Updated',
        description: `${data.name}'s account details have been saved.`,
      });

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-[#E5EAF2] p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#246BDE]/10 text-[#246BDE]">
              <UserCog className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#102D56]">
                Modify Account Attributes
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Update identity name, organizational role, and barangay jurisdiction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Email — read-only */}
            <div className="space-y-1.5">
              <FormLabel className="text-xs font-bold text-[#172B4D]">Account Email</FormLabel>
              <Input
                value={user?.email ?? ''}
                disabled
                className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs font-mono text-[#718096]"
              />
              <p className="text-[11px] text-[#718096]">
                System login emails are managed through authentication credentials.
              </p>
            </div>

            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-[#172B4D]">Full Legal Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Juan Dela Cruz" 
                      {...field} 
                      className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-[#EF4655]" />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-[#172B4D]">Authorized System Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm font-medium text-[#172B4D]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-[#E5EAF2]">
                      {ALL_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-[#EF4655]" />
                </FormItem>
              )}
            />

            {/* Barangay */}
            <FormField
              control={form.control}
              name="barangayId"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-[#172B4D]">Assigned Barangay Jurisdiction</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm font-medium text-[#172B4D]">
                        <SelectValue placeholder="Select a barangay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-[#E5EAF2]">
                      {barangays.map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-[#EF4655]" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
                className="rounded-xl border-[#E5EAF2] text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-xs"
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Account Updates'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
