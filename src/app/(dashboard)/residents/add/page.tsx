'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import { doc, setDoc, collection } from 'firebase/firestore';

export default function AddResidentPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { currentUser: user } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
    userId: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    purok: '',
    birthdate: '',
    householdNumber: '',
    contactNumber: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateUserId = () => {
    const prefix = 'R';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firestore || !user?.barangayId) {
      alert('System error: Missing required data');
      return;
    }

    setIsLoading(true);

    try {
      // Generate user ID
      const userId = generateUserId();
      const defaultPassword = 'password';

      // Create resident document
      const residentRef = doc(collection(firestore, 'residents'));
      await setDoc(residentRef, {
        id: residentRef.id,
        userId: userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || '',
        email: formData.email,
        purok: formData.purok,
        birthdate: formData.birthdate,
        householdNumber: formData.householdNumber,
        contactNumber: formData.contactNumber,
        barangayId: user.barangayId,
        status: 'Active',
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      });

      // Create user account document (for login)
      const userRef = doc(firestore, 'users', residentRef.id);
      await setDoc(userRef, {
        id: residentRef.id,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: 'Resident',
        barangayId: user.barangayId,
        isSuperAdmin: false,
        avatarUrl: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`,
        residentId: residentRef.id,
      });

      // Store credentials for display
      setGeneratedCredentials({
        email: formData.email,
        password: defaultPassword,
        userId: userId,
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error adding resident:', error);
      alert('Failed to add resident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success && generatedCredentials) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Resident Added Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Share these credentials with the resident
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-6 rounded-lg border-2 border-green-200 space-y-4">
              <h3 className="font-semibold text-lg text-center">Login Credentials</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">User ID</p>
                  <p className="font-mono font-bold text-lg">{generatedCredentials.userId}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-mono">{generatedCredentials.email}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <p className="font-mono font-bold">{generatedCredentials.password}</p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>Important:</strong> Advise the resident to change their password after first login.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/residents')}
                className="flex-1"
                variant="outline"
              >
                Back to Residents
              </Button>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setGeneratedCredentials(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    middleName: '',
                    email: '',
                    purok: '',
                    birthdate: '',
                    householdNumber: '',
                    contactNumber: '',
                  });
                }}
                className="flex-1"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Another Resident
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Resident</h1>
        <p className="text-muted-foreground mt-2">
          Create a new resident account. A default password will be generated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
          <CardDescription>
            Fill in the resident's details. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="Juan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="Dela Cruz"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  placeholder="Santos (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="juan.delacruz@email.com"
                />
                <p className="text-sm text-muted-foreground">
                  This will be used for login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  required
                  placeholder="09123456789"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Address Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purok">Purok/Street *</Label>
                  <Input
                    id="purok"
                    value={formData.purok}
                    onChange={(e) => handleInputChange('purok', e.target.value)}
                    required
                    placeholder="Purok 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="householdNumber">Household Number *</Label>
                  <Input
                    id="householdNumber"
                    value={formData.householdNumber}
                    onChange={(e) => handleInputChange('householdNumber', e.target.value)}
                    required
                    placeholder="HH-001"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ A user account will be automatically created with:
              </p>
              <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                <li>Default password: <strong>password</strong></li>
                <li>Role: Resident</li>
                <li>Auto-generated User ID</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Resident...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Resident
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
