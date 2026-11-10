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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Mail, MapPin, Home, Hash } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Resident } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const residentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  purok: z.string().min(1, 'Purok / Sitio is required'),
  birthdate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Please use MM-dd-yyyy.',
  }),
  householdNumber: z.string().min(1, 'Household number is required'),
});

type ResidentFormData = z.infer<typeof residentSchema>;

interface EditResidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateResident: (residentId: string, dataToUpdate: Partial<Resident>) => void;
  resident: Resident;
}

export function EditResidentDialog({ isOpen, onClose, onUpdateResident, resident }: EditResidentDialogProps) {
  const form = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      purok: '',
      birthdate: '',
      householdNumber: '',
    },
  });

  useEffect(() => {
    if (resident) {
      form.reset({
        firstName: resident.firstName,
        lastName: resident.lastName,
        email: resident.email,
        purok: resident.purok,
        birthdate: resident.birthdate,
        householdNumber: resident.householdNumber,
      });
    }
  }, [resident, form]);

  const onSubmit = (data: ResidentFormData) => {
    const dataToUpdate: Partial<Resident> = {
      ...data,
      address: `${data.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
    }
    onUpdateResident(resident.id, dataToUpdate);
    toast({
        title: 'Resident Updated',
        description: `${data.firstName} ${data.lastName}'s information has been updated.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E5EAF2] p-6">
        <DialogHeader className="bg-[#F8FAFC] border-b border-[#E5EAF2] p-6 -m-6 mb-0">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-[#172B4D]">
            <User className="size-5 text-[#246BDE]" />
            Edit Resident Record
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#718096] mt-1">
            Update the official resident details below. All changes will be saved to the database.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-[#172B4D] flex items-center gap-2">
                <User className="size-4 text-[#246BDE]" />
                Personal Demographics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-[#172B4D]">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-[#172B4D]">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Dela Cruz" className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="juan.cruz@example.com" 
                        className="h-10 rounded-xl border-[#E2E8F0] bg-gray-100 text-sm text-[#718096] cursor-not-allowed" 
                        {...field} 
                        disabled 
                      />
                    </FormControl>
                    <div className="text-xs bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-2.5 text-[#FFA51E]">
                      <strong className="text-[#172B4D]">⚠️ Security:</strong> Email addresses cannot be changed directly to protect account security.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <CalendarIcon className="size-3.5 text-[#246BDE]" />
                      Date of Birth
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="MM-dd-yyyy" className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]" {...field} />
                      </FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-10 hover:bg-[#F0F4FA]"
                          >
                            <CalendarIcon className="size-4 text-[#246BDE]" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl border-[#E5EAF2]" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={new Date().getFullYear() - 100}
                            toYear={new Date().getFullYear()}
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'MM-dd-yyyy') : '')}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-[#E5EAF2]" />

            {/* Location Information Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-[#172B4D] flex items-center gap-2">
                <MapPin className="size-4 text-[#246BDE]" />
                Location &amp; Household Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-[#172B4D]">
                        <Home className="size-3.5 text-[#246BDE]" />
                        Purok / Sitio
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Purok 1, Sitio Riverside" 
                          className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="householdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-[#172B4D]">
                        <Hash className="size-3.5 text-[#246BDE]" />
                        Household Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="HH-001" className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-[#E5EAF2]">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl border-[#E5EAF2] text-[#172B4D] hover:bg-[#F8FAFC] text-xs font-semibold h-10 px-4">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl shadow-xs font-semibold text-xs h-10 px-5">
                <User className="mr-2 size-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
