'use client';

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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { User, Role } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(["Admin", "Barangay Captain", "Secretary", "Treasurer"]),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => Promise<void>;
  isCreating?: boolean;
  existingUsers?: User[]; // List of existing users to check for taken roles
}

const ROLES: Role[] = ["Admin", "Barangay Captain", "Secretary", "Treasurer"];

// Roles that should only have one person
const UNIQUE_ROLES: Role[] = ["Barangay Captain", "Secretary", "Treasurer"];

export function AddUserDialog({ isOpen, onClose, onAddUser, isCreating = false, existingUsers = [] }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check which roles are already taken
  const takenRoles = new Set(
    existingUsers
      .filter(user => !user.isDeleted && UNIQUE_ROLES.includes(user.role as Role))
      .map(user => user.role)
  );
  
  // Filter available roles
  const availableRoles = ROLES.filter(role => !takenRoles.has(role));
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Secretary',
      password: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    console.log('=== Add User Dialog Submit ===');
    console.log('Form data:', data);
    console.log('Role from form:', data.role);
    
    setIsSubmitting(true);
    try {
        await onAddUser(data);
        
        // Show success message with password
        toast({
            title: 'Staff Account Created Successfully',
            description: `${data.name} can now log in with email: ${data.email} and password: ${data.password}`,
            duration: 8000, // Show longer so they can copy the password
        });
        
        form.reset();
        onClose();
    } catch (error: any) {
        console.error('Error in dialog:', error);
        toast({
            title: 'Failed to Create Staff Account',
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Enter the details of the new staff or official. Set a secure password for their account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (for login)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan.cruz@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map(role => {
                        const isTaken = takenRoles.has(role);
                        return (
                          <SelectItem 
                            key={role} 
                            value={role}
                            disabled={isTaken}
                          >
                            {role} {isTaken && '(Already assigned)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Minimum 6 characters" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    User can change this password after logging in
                  </p>
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isSubmitting || isCreating}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting || isCreating}>
                  {(isSubmitting || isCreating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreating ? 'Creating Account...' : isSubmitting ? 'Saving...' : 'Create Staff Account'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
