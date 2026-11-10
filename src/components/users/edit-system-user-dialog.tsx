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

  // Reset form whenever the user prop changes
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
        title: 'User updated successfully',
        description: `${data.name}'s information has been updated.`,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Email — read-only */}
            <div className="space-y-2">
              <FormLabel>Email Address</FormLabel>
              <Input
                value={user?.email ?? ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Barangay */}
            <FormField
              control={form.control}
              name="barangayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a barangay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barangays.map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
