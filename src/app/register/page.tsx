'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
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
  const [allBarangays, setAllBarangays] = useState<Array<{ id: string; name: string; municipality: string }>>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [filteredBarangays, setFilteredBarangays] = useState<Array<{ id: string; name: string; municipality: string }>>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    municipality: '',
    barangayId: '',
    purok: '',
    birthdate: '',
    contactNumber: '',
  });

  // Load barangays on mount
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
      const barangayList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        municipality: doc.data().municipality || ''
      }));
      
      // Sort barangays by municipality then name
      barangayList.sort((a, b) => {
        if (a.municipality !== b.municipality) {
          return a.municipality.localeCompare(b.municipality);
        }
        return a.name.localeCompare(b.name);
      });
      
      setAllBarangays(barangayList);
      
      // Extract unique municipalities
      const uniqueMunicipalities = [...new Set(barangayList.map(b => b.municipality))].filter(Boolean).sort();
      setMunicipalities(uniqueMunicipalities);
      
    } catch (err) {
      console.error('Error loading barangays:', err);
      setError('Failed to load barangays. Please refresh the page.');
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // When municipality changes, filter barangays and reset barangay selection
    if (field === 'municipality') {
      const filtered = allBarangays.filter(b => b.municipality === value);
      setFilteredBarangays(filtered);
      setFormData(prev => ({ ...prev, barangayId: '' })); // Reset barangay selection
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const firestore = getFirestore(app);
      const auth = getAuth(app);

      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get selected barangay details
      const selectedBarangay = allBarangays.find(b => b.id === formData.barangayId);
      
      // Create resident document with user UID as document ID
      await setDoc(doc(firestore, 'residents', userCredential.user.uid), {
        id: userCredential.user.uid,
        userId: userCredential.user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || '',
        email: formData.email,
        barangayId: formData.barangayId,
        barangayName: selectedBarangay?.name || '',
        municipality: formData.municipality,
        province: 'Oriental Mindoro',
        region: 'MIMAROPA',
        purok: formData.purok,
        address: `${formData.purok}, ${selectedBarangay?.name || ''}, ${formData.municipality}, Oriental Mindoro`,
        birthdate: formData.birthdate,
        contactNumber: formData.contactNumber,
        householdNumber: '',
        avatarUrl: '',
        createdAt: new Date().toISOString(),
      });

      // Create user document with the user's UID as the document ID
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: 'Resident',
        barangayId: formData.barangayId,
        residentId: userCredential.user.uid,
        avatarUrl: '',
        isSuperAdmin: false,
      });

      setSuccess(true);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('auth/email-already-in-use');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please provide a valid email address.');
      } else {
        console.warn('Registration failed:', err?.message || err);
        setError(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-blue-700 to-orange-600">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-2xl border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Registration Submitted!</CardTitle>
            <CardDescription className="text-white/70">
              You can now login to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/10 p-4 rounded-lg border border-white/20">
              <p className="text-white text-sm text-center">
                Your account has been created successfully! You can now login and access barangay services.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-blue-700 to-orange-600">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex justify-center group cursor-pointer">
            <div className="relative bg-white/95 backdrop-blur-xl p-4 rounded-full border-4 border-white/50 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <Image 
                src="/icon.png" 
                alt="iBarangay Logo" 
                width={60} 
                height={60} 
                className="object-contain"
              />
            </div>
          </Link>
          <div>
            <CardTitle className="text-2xl text-white">Resident Registration</CardTitle>
            <CardDescription className="text-white/70">
              Register to access barangay services
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white/90">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  placeholder="Juan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white/90">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-white/90">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                placeholder="Santos (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  placeholder="juan.delacruz@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality" className="text-white/90">Municipality/City *</Label>
              <Select 
                value={formData.municipality} 
                onValueChange={(value) => handleInputChange('municipality', value)}
                disabled={loadingBarangays}
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue placeholder={loadingBarangays ? "Loading municipalities..." : "Choose your municipality"} />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality} value={municipality}>
                      {municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {municipalities.length === 0 && !loadingBarangays && (
                <p className="text-xs text-amber-300">No municipalities available. Please contact support.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barangay" className="text-white/90">
                Select Your Barangay *
                {formData.municipality && filteredBarangays.length > 0 && (
                  <span className="ml-2 text-xs text-white/60">
                    ({filteredBarangays.length} barangays available)
                  </span>
                )}
              </Label>
              <Select 
                value={formData.barangayId} 
                onValueChange={(value) => handleInputChange('barangayId', value)}
                disabled={loadingBarangays || !formData.municipality}
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue placeholder={
                    !formData.municipality 
                      ? "Select municipality first" 
                      : filteredBarangays.length === 0 
                      ? "No barangays available" 
                      : "Choose your barangay"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredBarangays.map((barangay) => (
                    <SelectItem key={barangay.id} value={barangay.id}>
                      {barangay.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.municipality && filteredBarangays.length === 0 && (
                <p className="text-xs text-amber-300">No barangays available in this municipality.</p>
              )}
              {!formData.municipality && (
                <p className="text-xs text-white/50">Please select a municipality first</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purok" className="text-white/90">Purok/Street *</Label>
                <Input
                  id="purok"
                  value={formData.purok}
                  onChange={(e) => handleInputChange('purok', e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                  placeholder="Purok 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-white/90">Birthdate *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-white/90">Contact Number *</Label>
              <Input
                id="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
                placeholder="09123456789"
              />
            </div>

            {error === 'auth/email-already-in-use' ? (
              <div className="bg-amber-500/25 border border-amber-400/60 p-4 rounded-xl space-y-3 backdrop-blur-md shadow-lg">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-100">Email Address Already Registered</h4>
                    <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                      The email <strong className="text-white underline">{formData.email}</strong> is already associated with an account in iBarangay.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Link
                    href={`/login?email=${encodeURIComponent(formData.email)}`}
                    className="flex-1 inline-flex items-center justify-center h-9 px-3 text-xs font-bold rounded-lg bg-white text-[#102D56] hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    Log In to Your Account &rarr;
                  </Link>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(formData.email)}`}
                    className="inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-colors"
                  >
                    Reset Password
                  </Link>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            ) : null}

            {formData.municipality && formData.barangayId && (
              <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
                <p className="text-xs text-green-200 text-center">
                  📍 Registering for: <strong>{allBarangays.find(b => b.id === formData.barangayId)?.name}, {formData.municipality}, Oriental Mindoro</strong>
                </p>
              </div>
            )}

            <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded-lg">
              <p className="text-xs text-blue-200 text-center">
                ℹ️ After registration, you can immediately login and access barangay services.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
