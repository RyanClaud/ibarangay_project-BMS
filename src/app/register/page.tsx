'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allBarangays, setAllBarangays] = useState<Array<{ id: string; name: string; municipality: string }>>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [filteredBarangays, setFilteredBarangays] = useState<Array<{ id: string; name: string; municipality: string }>>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(true);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    municipality: '',
    barangayId: '',
    purok: '',
    birthdate: '',
    contactNumber: '',
  });

  // Load active barangays on mount
  useEffect(() => {
    loadBarangays();
  }, []);

  const loadBarangays = async () => {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const firestore = getFirestore(app);

      const barangaysQuery = query(
        collection(firestore, 'barangays'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(barangaysQuery);
      let barangayList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        municipality: doc.data().municipality || 'Bongabong',
      }));

      // Fallback if no active barangays found in DB
      if (barangayList.length === 0) {
        barangayList = [
          { id: 'mina-de-oro', name: 'Barangay Mina De Oro', municipality: 'Bongabong' },
          { id: 'poblacion', name: 'Barangay Poblacion', municipality: 'Bongabong' },
          { id: 'malitbog', name: 'Barangay Malitbog', municipality: 'Bongabong' },
        ];
      }

      // Sort barangays by municipality then name
      barangayList.sort((a, b) => {
        if (a.municipality !== b.municipality) {
          return a.municipality.localeCompare(b.municipality);
        }
        return a.name.localeCompare(b.name);
      });

      setAllBarangays(barangayList);

      // Extract unique municipalities
      const uniqueMunicipalities = [...new Set(barangayList.map((b) => b.municipality))].filter(Boolean).sort();
      setMunicipalities(uniqueMunicipalities.length > 0 ? uniqueMunicipalities : ['Bongabong']);

      // Pre-select Bongabong if present
      if (uniqueMunicipalities.includes('Bongabong')) {
        handleInputChange('municipality', 'Bongabong');
      }
    } catch (err) {
      console.error('Error loading barangays:', err);
      // Fallback list
      const fallback = [
        { id: 'mina-de-oro', name: 'Barangay Mina De Oro', municipality: 'Bongabong' },
      ];
      setAllBarangays(fallback);
      setMunicipalities(['Bongabong']);
      setFilteredBarangays(fallback);
      setFormData((prev) => ({ ...prev, municipality: 'Bongabong', barangayId: 'mina-de-oro' }));
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // When municipality changes, filter barangays and reset barangay selection
    if (field === 'municipality') {
      const filtered = allBarangays.filter((b) => b.municipality === value);
      setFilteredBarangays(filtered);
      // Auto-select first barangay if available
      if (filtered.length > 0) {
        setFormData((prev) => ({ ...prev, barangayId: filtered[0].id }));
      } else {
        setFormData((prev) => ({ ...prev, barangayId: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please provide your full legal name.');
      setIsLoading(false);
      return;
    }

    if (!formData.barangayId) {
      setError('Please select your registered barangay.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      setIsLoading(false);
      return;
    }

    if (!privacyAgreed) {
      setError('Please accept the Data Privacy declaration to continue.');
      setIsLoading(false);
      return;
    }

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const firestore = getFirestore(app);
      const auth = getAuth(app);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password
      );

      // Get selected barangay name
      const selectedBarangay = allBarangays.find((b) => b.id === formData.barangayId);
      const barangayName = selectedBarangay?.name || 'Barangay Mina De Oro';

      // Create resident demographic record with the same UID
      await setDoc(doc(firestore, 'residents', userCredential.user.uid), {
        id: userCredential.user.uid,
        userId: userCredential.user.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName?.trim() || '',
        email: formData.email.trim().toLowerCase(),
        barangayId: formData.barangayId,
        barangayName: barangayName,
        municipality: formData.municipality || 'Bongabong',
        province: 'Oriental Mindoro',
        region: 'MIMAROPA',
        purok: formData.purok.trim(),
        address: `${formData.purok.trim()}, ${barangayName}, ${formData.municipality || 'Bongabong'}, Oriental Mindoro`,
        birthdate: formData.birthdate,
        contactNumber: formData.contactNumber.trim(),
        householdNumber: '',
        avatarUrl: `https://picsum.photos/seed/${userCredential.user.uid}/100/100`,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });

      // Create user auth profile doc with role 'Resident'
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        role: 'Resident',
        barangayId: formData.barangayId,
        residentId: userCredential.user.uid,
        avatarUrl: `https://picsum.photos/seed/${userCredential.user.uid}/100/100`,
        status: 'Active',
        isSuperAdmin: false,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please provide a valid email address.');
      } else {
        console.warn('Registration failed:', err?.message || err);
        setError(err?.message || 'Registration failed. Please check your network and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-between selection:bg-[#246BDE] selection:text-white">
        {/* Header */}
        <header className="bg-[#102D56] text-white border-b border-white/10 py-3.5 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex size-10 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/50 shrink-0">
                <img
                  src="/images/barangay-seal.png"
                  alt="Seal"
                  className="size-10 object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white leading-none">
                  iBarangay
                </span>
                <p className="text-[11px] text-white/70 leading-tight">
                  DICT MIMAROPA • Municipality of Bongabong
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-lg bg-white border border-[#E5EAF2] rounded-3xl shadow-xl overflow-hidden text-center p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="size-20 rounded-full bg-[#ECFDF5] text-[#10A875] border-4 border-[#A7F3D0] mx-auto flex items-center justify-center shadow-sm">
              <CheckCircle2 className="size-10 text-[#10A875]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
                Registration Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
                Mabuhay! Welcome to iBarangay
              </h2>
              <p className="text-xs sm:text-sm text-[#718096] max-w-sm mx-auto leading-relaxed">
                Your resident account for <strong className="text-[#172B4D]">{formData.firstName} {formData.lastName}</strong> has been created and linked to your barangay registry.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-2xl p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#718096]">Registered Email:</span>
                <span className="font-semibold text-[#172B4D]">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Purok &amp; Barangay:</span>
                <span className="font-semibold text-[#172B4D]">{formData.purok}, {formData.municipality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Services Available:</span>
                <span className="font-semibold text-[#10A875]">Online Clearances, Blotters &amp; Hotlines</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/login?email=${encodeURIComponent(formData.email)}`}>
                <Button className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] gap-2">
                  <span>Sign In to Your Dashboard</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-[#718096] border-t border-[#E5EAF2] bg-white">
          <p>© 2026 iBarangay System • Republic Act No. 10173 Protected</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col justify-between selection:bg-[#246BDE] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#102D56] text-white border-b border-white/10 py-3.5 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
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
                  Registration
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                DICT MIMAROPA • Municipality of Bongabong
              </p>
            </div>
          </Link>

          <Link href="/login" className="text-xs text-white/80 hover:text-white font-medium flex items-center gap-1 transition-colors">
            <span>Already have an account?</span>
            <span className="text-yellow-400 font-bold ml-1">Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Registration Form Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5EAF2] shadow-xl overflow-hidden">
          
          {/* Top Banner with Civic Branding */}
          <div className="bg-[#102D56] text-white p-6 sm:p-8 border-b border-white/10 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 size-48 rounded-full border-[24px] border-white/10 pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white/90 mb-2">
                  <UserPlus className="size-3.5 text-yellow-400" />
                  Resident Enrollment Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Create Your Resident Account
                </h1>
                <p className="text-xs sm:text-sm text-white/75 mt-1">
                  Access official barangay certificates, clearances, complaint filings, and community announcements online.
                </p>
              </div>

              <div className="hidden sm:flex size-14 rounded-2xl bg-white/10 border border-white/20 items-center justify-center shrink-0">
                <ShieldCheck className="size-7 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm animate-in fade-in duration-300">
                <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-900">Registration Notice</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                  {error.includes('already registered') && (
                    <Link
                      href={`/login?email=${encodeURIComponent(formData.email)}`}
                      className="inline-block mt-2 font-bold text-blue-700 hover:underline"
                    >
                      Click here to Sign In →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
                <div className="size-6 rounded-full bg-[#EAF2FF] text-[#246BDE] text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-[#172B4D] tracking-tight">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-bold text-[#172B4D]">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Juan"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="middleName" className="text-xs font-bold text-[#172B4D]">
                    Middle Name <span className="text-[#718096] text-[11px]">(Optional)</span>
                  </Label>
                  <Input
                    id="middleName"
                    placeholder="e.g. Santos"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-bold text-[#172B4D]">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Dela Cruz"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      value={formData.birthdate}
                      onChange={(e) => handleInputChange('birthdate', e.target.value)}
                      disabled={isLoading}
                      className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactNumber" className="text-xs font-bold text-[#172B4D]">
                    Mobile / Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="e.g. 09171234567"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      disabled={isLoading}
                      className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Barangay Residence */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
                <div className="size-6 rounded-full bg-[#ECFDF5] text-[#10A875] text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-[#172B4D] tracking-tight">
                  Barangay Jurisdiction &amp; Address
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#172B4D]">
                    Municipality <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.municipality}
                    onValueChange={(val) => handleInputChange('municipality', val)}
                    disabled={isLoading || loadingBarangays}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E5EAF2]">
                      {municipalities.map((mun) => (
                        <SelectItem key={mun} value={mun}>
                          {mun}
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
                    value={formData.barangayId}
                    onValueChange={(val) => handleInputChange('barangayId', val)}
                    disabled={isLoading || loadingBarangays || !formData.municipality}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                      <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E5EAF2]">
                      {filteredBarangays.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purok" className="text-xs font-bold text-[#172B4D]">
                    Purok / Sitio <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="purok"
                    placeholder="e.g. Purok 2, Centro"
                    required
                    value={formData.purok}
                    onChange={(e) => handleInputChange('purok', e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Credentials & Account Security */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EAF2]">
                <div className="size-6 rounded-full bg-[#FFF7ED] text-[#EA580C] text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h3 className="text-sm font-bold text-[#172B4D] tracking-tight">
                  Account Credentials
                </h3>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-[#172B4D]">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. resident@gmail.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    className="h-10 pl-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                  />
                </div>
                <p className="text-[11px] text-[#718096]">
                  Your clearance tracking updates and account reset links will be delivered to this email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-[#172B4D]">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                      className="h-10 pl-10 pr-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#172B4D]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#172B4D]">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className="h-10 pl-10 pr-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#172B4D]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
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

            {/* Submit Action */}
            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating Resident Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Resident Registration</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-[#718096]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-[#246BDE] hover:text-[#1E5CC0] hover:underline"
                >
                  Sign in here
                </Link>
              </p>
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
