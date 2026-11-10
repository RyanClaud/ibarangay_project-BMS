'use client';

import { useEffect, useState } from 'react';
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
import { useMemo } from 'react';
import { Loader2, User, Mail, MapPin, Home, Hash, Calendar } from 'lucide-react';
import type { Resident } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';


const profileSchema = z.object({
  purok: z.string().min(1, 'Purok / Sitio is required'),
  householdNumber: z.string().min(1, 'Household number is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfileForm() {
  const { currentUser, residents, updateResident } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);

  const resident = useMemo(() => {
    if (currentUser?.residentId && residents) {
      return residents.find(res => res.id === currentUser.residentId);
    }
    return null;
  }, [currentUser, residents]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      purok: '',
      householdNumber: '',
    },
  });

  useEffect(() => {
    if (resident) {
      form.reset({
        purok: resident.purok,
        householdNumber: resident.householdNumber,
      });
    }
  }, [resident, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!resident) {
        toast({ title: "Error", description: "Resident profile not found.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const dataToUpdate: Partial<Resident> = { 
        ...data,
        address: `${data.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
      };

      await updateResident(resident.id, dataToUpdate);
      toast({
        title: 'Profile Updated',
        description: 'Your personal information has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Update Profile',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (!resident) {
    return (
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-8 shadow-sm flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#246BDE]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-[#172B4D]">
              <User className="size-5 text-[#246BDE]" />
              Resident Profile Information
            </h3>
            <p className="text-xs sm:text-sm text-[#718096] mt-1">
              View your registered constituent details and update your contact location.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Profile Header with Avatar */}
            <div className="flex items-center gap-4 p-4 bg-[#EAF2FF] rounded-2xl border border-[#BFDBFE]">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarImage src={resident.avatarUrl || undefined} alt={resident.firstName} />
                <AvatarFallback className="bg-white text-[#246BDE] text-xl font-bold">
                  {resident.firstName?.[0]}
                  {resident.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#172B4D] leading-tight truncate">{resident.firstName} {resident.lastName}</h3>
                <p className="text-xs text-[#718096] flex items-center gap-1.5 mt-1 truncate">
                  <Mail className="size-3.5 text-[#246BDE] shrink-0" />
                  {resident.email}
                </p>
                <p className="text-xs text-[#718096] mt-1">
                  User ID: <span className="font-mono font-semibold text-[#246BDE]">{resident.userId}</span>
                </p>
              </div>
            </div>

            <Separator className="bg-[#E5EAF2]" />

            {/* Editable Fields Section */}
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
                  name="householdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-[#172B4D]">
                        <Hash className="size-3.5 text-[#246BDE]" />
                        Household Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., HH-001" 
                          className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-[#E5EAF2]" />

            {/* Read-Only Information */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-[#172B4D] flex items-center gap-2">
                <User className="size-4 text-[#246BDE]" />
                Personal Verification Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]">
                  <span className="text-[#718096]">Full Name</span>
                  <p className="font-semibold text-sm text-[#172B4D]">{resident.firstName} {resident.lastName}</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]">
                  <span className="text-[#718096]">Email Address</span>
                  <p className="font-semibold text-sm text-[#172B4D]">{resident.email}</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]">
                  <span className="text-[#718096]">Date of Birth</span>
                  <p className="font-semibold text-sm text-[#172B4D]">{resident.birthdate}</p>
                </div>

                <div className="space-y-1 p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]">
                  <span className="text-[#718096]">Complete Address</span>
                  <p className="font-semibold text-sm text-[#172B4D]">{resident.address}</p>
                </div>
              </div>

              <div className="bg-[#EAF2FF] border border-[#BFDBFE] rounded-xl p-3.5">
                <p className="text-xs text-[#246BDE]">
                  <strong>ℹ️ Note:</strong> Core demographic fields are verified against the masterlist. Contact the barangay secretary if your personal name or birthdate requires correction.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2] flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#718096]">
              Changes will take effect immediately upon saving
            </p>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-semibold text-xs h-10 px-5 shadow-xs"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
