'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import { useFirebase } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  MapPin,
  Building2,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  LogOut,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';

interface BarangayOption {
  id: string;
  name: string;
  municipality: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, logout } = useAppContext();
  const { firestore } = useFirebase();

  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [allBarangays, setAllBarangays] = useState<BarangayOption[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [filteredBarangays, setFilteredBarangays] = useState<BarangayOption[]>([]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [municipality, setMunicipality] = useState('Bongabong');
  const [barangayId, setBarangayId] = useState('');
  const [purok, setPurok] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  // Initialize pre-filled names from currentUser
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && currentUser.name !== 'New User' && currentUser.name !== 'Resident User') {
        const parts = currentUser.name.trim().split(/\s+/);
        if (parts.length > 0 && !firstName) {
          setFirstName(parts[0]);
        }
        if (parts.length > 1 && !lastName) {
          setLastName(parts.slice(1).join(' '));
        }
      }
    }
  }, [currentUser]);

  // Load active barangays from Firestore
  useEffect(() => {
    const loadBarangayData = async () => {
      if (!firestore) return;

      try {
        const barangaysQuery = query(
          collection(firestore, 'barangays'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(barangaysQuery);
        let list: BarangayOption[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name || docSnap.id,
          municipality: docSnap.data().municipality || 'Bongabong',
        }));

        if (list.length === 0) {
          list = [
            { id: 'mina-de-oro', name: 'Barangay Mina De Oro', municipality: 'Bongabong' },
            { id: 'poblacion', name: 'Barangay Poblacion', municipality: 'Bongabong' },
            { id: 'malitbog', name: 'Barangay Malitbog', municipality: 'Bongabong' },
          ];
        }

        list.sort((a, b) => {
          if (a.municipality !== b.municipality) {
            return a.municipality.localeCompare(b.municipality);
          }
          return a.name.localeCompare(b.name);
        });

        setAllBarangays(list);

        const uniqueMunis = Array.from(new Set(list.map((b) => b.municipality))).filter(Boolean).sort();
        setMunicipalities(uniqueMunis.length > 0 ? uniqueMunis : ['Bongabong']);

        const initialMuni = uniqueMunis.includes('Bongabong') ? 'Bongabong' : uniqueMunis[0] || 'Bongabong';
        setMunicipality(initialMuni);

        const filtered = list.filter((b) => b.municipality === initialMuni);
        setFilteredBarangays(filtered);
        if (filtered.length > 0) {
          setBarangayId(filtered[0].id);
        }
      } catch (err) {
        console.error('Error fetching barangay list for profile completion:', err);
        const fallback: BarangayOption[] = [
          { id: 'mina-de-oro', name: 'Barangay Mina De Oro', municipality: 'Bongabong' },
        ];
        setAllBarangays(fallback);
        setMunicipalities(['Bongabong']);
        setFilteredBarangays(fallback);
        setBarangayId('mina-de-oro');
      } finally {
        setIsLoadingBarangays(false);
      }
    };

    loadBarangayData();
  }, [firestore]);

  const handleMunicipalityChange = (selectedMuni: string) => {
    setMunicipality(selectedMuni);
    const filtered = allBarangays.filter((b) => b.municipality === selectedMuni);
    setFilteredBarangays(filtered);
    if (filtered.length > 0) {
      setBarangayId(filtered[0].id);
    } else {
      setBarangayId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser || !firestore) {
      setError('Session not ready. Please refresh or sign in again.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide your complete legal name.');
      return;
    }

    if (!barangayId) {
      setError('Please select your residential barangay.');
      return;
    }

    if (!purok.trim()) {
      setError('Please specify your Purok, Sitio, or Street address.');
      return;
    }

    if (!birthdate) {
      setError('Please provide your date of birth.');
      return;
    }

    if (!contactNumber.trim()) {
      setError('Please provide an active mobile contact number.');
      return;
    }

    if (!privacyAgreed) {
      setError('You must consent to the Data Privacy Act declaration to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedBarangay = allBarangays.find((b) => b.id === barangayId);
      const barangayName = selectedBarangay?.name || 'Barangay Mina De Oro';
      const cleanFirst = firstName.trim();
      const cleanMiddle = middleName.trim();
      const cleanLast = lastName.trim();
      const fullName = cleanMiddle ? `${cleanFirst} ${cleanMiddle} ${cleanLast}` : `${cleanFirst} ${cleanLast}`;
      const fullAddress = `${purok.trim()}, ${barangayName}, ${municipality}, Oriental Mindoro`;

      // 1. Update/set Resident demographic document in Firestore
      const residentRef = doc(firestore, 'residents', currentUser.id);
      await setDoc(
        residentRef,
        {
          id: currentUser.id,
          userId: currentUser.residentId || `R-${currentUser.id.slice(0, 6).toUpperCase()}`,
          firstName: cleanFirst,
          middleName: cleanMiddle,
          lastName: cleanLast,
          email: currentUser.email || '',
          contactNumber: contactNumber.trim(),
          birthdate: birthdate,
          municipality: municipality,
          province: 'Oriental Mindoro',
          region: 'MIMAROPA',
          barangayId: barangayId,
          barangayName: barangayName,
          purok: purok.trim(),
          address: fullAddress,
          avatarUrl: currentUser.avatarUrl || `https://picsum.photos/seed/${currentUser.id}/100/100`,
          status: 'Active',
          householdNumber: 'N/A',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Update User authentication profile document in Firestore
      const userRef = doc(firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        name: fullName,
        barangayId: barangayId,
        barangayName: barangayName,
        isProfileComplete: true,
        status: 'Active',
      });

      // 3. Update context state
      setCurrentUser({
        ...currentUser,
        name: fullName,
        barangayId: barangayId,
        barangayName: barangayName,
        isProfileComplete: true,
      });

      toast({
        title: 'Profile Completed!',
        description: `Welcome to ${barangayName}! Your resident account is now active.`,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Failed to complete resident profile:', err);
      setError(err?.message || 'Failed to save resident information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-between selection:bg-[#246BDE] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#102D56] text-white border-b border-white/10 py-3.5 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/50 shrink-0 overflow-hidden shadow-sm">
              <img
                src="/images/barangay-seal.png"
                alt="iBarangay Official Seal"
                className="size-10 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white leading-none">
                  iBarangay
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#246BDE] text-white uppercase tracking-wider">
                  Verification
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                DICT MIMAROPA • Municipality of Bongabong
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-white/80 hover:text-white hover:bg-white/10 gap-1.5 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E5EAF2] shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#102D56] text-white p-6 sm:p-8 border-b border-white/10 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 size-48 rounded-full border-[24px] border-white/10 pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Barangay Identification Required
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Complete Your Resident Profile
              </h1>
              <p className="text-xs sm:text-sm text-white/75 max-w-lg leading-relaxed">
                You successfully authenticated with Google. To link you with your local barangay services and clearances, please provide your residential address and contact details.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Connected Google Account Banner */}
            {currentUser && (
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center shadow-sm shrink-0">
                    <FcGoogle className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#172B4D]">Signed in with Google</p>
                    <p className="text-[11px] text-[#718096] truncate max-w-[200px] sm:max-w-xs">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Verified Email
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm animate-in fade-in">
                <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-900">Please Review</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Section 1: Legal Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
                <div className="size-6 rounded-full bg-[#EAF2FF] text-[#246BDE] text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-[#172B4D] tracking-tight">
                  Legal Name &amp; Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-bold text-[#172B4D]">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="e.g. Juan"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="middleName" className="text-xs font-bold text-[#172B4D]">
                    Middle Name <span className="text-xs text-[#718096] font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="middleName"
                    type="text"
                    placeholder="e.g. Santos"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-bold text-[#172B4D]">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="e.g. Dela Cruz"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="contactNumber" className="text-xs font-bold text-[#172B4D]">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="e.g. 09171234567"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthdate" className="text-xs font-bold text-[#172B4D]">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="birthdate"
                      type="date"
                      required
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      disabled={isSubmitting}
                      className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Barangay & Residency */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
                <div className="size-6 rounded-full bg-[#EAF2FF] text-[#246BDE] text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-[#172B4D] tracking-tight">
                  Barangay &amp; Residential Address
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#172B4D]">
                    Municipality <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={municipality}
                    onValueChange={handleMunicipalityChange}
                    disabled={isSubmitting || municipalities.length <= 1}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((muni) => (
                        <SelectItem key={muni} value={muni}>
                          {muni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#172B4D]">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={barangayId}
                    onValueChange={setBarangayId}
                    disabled={isSubmitting || isLoadingBarangays || filteredBarangays.length === 0}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                      <SelectValue
                        placeholder={isLoadingBarangays ? 'Loading barangays...' : 'Select Barangay'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBarangays.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purok" className="text-xs font-bold text-[#172B4D]">
                  Purok / Sitio / Zone / Street <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                  <Input
                    id="purok"
                    type="text"
                    placeholder="e.g. Purok 1 or Sitio Riverside"
                    required
                    value={purok}
                    onChange={(e) => setPurok(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
              </div>
            </div>

            {/* Data Privacy Agreement Checkbox */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-[#246BDE] border-[#CBD5E1] focus:ring-[#246BDE]"
                />
                <span className="text-xs text-[#718096] leading-relaxed">
                  I certify that all information submitted is true, accurate, and correct. I consent to the collection and processing of my personal data by the Local Government Unit of Bongabong in accordance with{' '}
                  <strong className="text-[#172B4D]">Republic Act No. 10173 (Data Privacy Act of 2012)</strong>.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Resident Details...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Barangay &amp; Enter Portal</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-[#718096] hover:text-[#172B4D] hover:underline cursor-pointer"
                >
                  Cancel and use a different account
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Attribution */}
      <footer className="py-4 text-center text-xs text-[#718096] border-t border-[#E5EAF2] bg-white">
        <p>© 2026 iBarangay System • Developed by Ryan Claud • DICT MIMAROPA Region IV-B</p>
      </footer>
    </div>
  );
}
