'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementClientPage } from "@/components/users/user-management-client-page";
import { useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { useAppContext } from "@/contexts/app-context";
import { ResidentSettings } from "@/components/account/resident-settings";
import { DocumentPricingForm } from "@/components/settings/document-pricing-form";
import { PaymentSettingsForm } from "@/components/settings/payment-settings-form";


function AdminSettings() {
  const { firestore, storage, areServicesAvailable } = useFirebase();
  const [barangayName, setBarangayName] = useState("Barangay Mina De Oro");
  const [address, setAddress] = useState("Bongabong, Oriental Mindoro, Philippines");
  const [sealLogoUrl, setSealLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { currentUser: contextUser } = useAppContext();
  
  // Check if user is Admin, Barangay Captain, or Super Admin (they can manage users)
  const canManageUsers = contextUser?.role === 'Admin' || contextUser?.role === 'Barangay Captain' || contextUser?.isSuperAdmin;

  useEffect(() => {
    const fetchConfig = async () => {
      if (!firestore || !contextUser?.barangayId) return;
      setIsLoading(true);
      try {
        // Load from new barangays collection
        const configRef = doc(firestore, 'barangays', contextUser.barangayId);
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const configData = configSnap.data();
          setBarangayName(configData.name);
          setAddress(configData.address);
          setSealLogoUrl(configData.sealLogoUrl);
        }
      } catch (e) {
        console.error("Failed to fetch barangay config:", e);
        toast({ title: "Error", description: "Could not fetch barangay settings.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    if (areServicesAvailable) {
        fetchConfig();
    } else {
        setIsLoading(false);
    }
  }, [firestore, areServicesAvailable, contextUser?.barangayId]);

  const handleSaveChanges = async () => {
    if (!firestore || !storage || !contextUser?.barangayId) {
        toast({ title: "Firebase not initialized.", description: "Please try again later.", variant: "destructive"});
        return;
    };
    setIsSaving(true);
    
    try {
      // Save to new barangays collection
      const configRef = doc(firestore, 'barangays', contextUser.barangayId);
      await setDoc(configRef, {
        name: barangayName,
        address,
        sealLogoUrl,
      }, { merge: true });

      toast({ title: "Settings Saved", description: "Barangay details have been updated." });
    } catch (error: any) {
      console.error("Error saving settings: ", error);
      toast({ title: "Save Failed", description: error.message || "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user can manage payment settings (Treasurer or Admin)
  const canManagePayments = contextUser?.role === 'Treasurer' || contextUser?.role === 'Admin' || contextUser?.isSuperAdmin;

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className={`grid w-full grid-cols-2 sm:grid-cols-3 ${canManageUsers ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} h-auto p-1 gap-1`}>
        <TabsTrigger value="account" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
          🔐 Account
        </TabsTrigger>
        <TabsTrigger value="barangay" className="data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900">
          🏛️ Barangay
        </TabsTrigger>
        <TabsTrigger value="pricing" className="data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900">
          💰 Pricing
        </TabsTrigger>
        <TabsTrigger value="payment" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900">
          💳 Payment
        </TabsTrigger>
        {canManageUsers && (
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900">
            👥 Users
          </TabsTrigger>
        )}
        <TabsTrigger value="system" className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900">
          ⚙️ System
        </TabsTrigger>
      </TabsList>
      <TabsContent value="barangay">
        {!canManageUsers ? (
          <Card className="border-t-4 border-t-blue-500 hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
              <CardTitle>Barangay Information</CardTitle>
              <CardDescription>View the official details of your barangay.</CardDescription>
            </CardHeader>
            {isLoading ? (
              <CardContent>
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
              </CardContent>
            ) : (
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Barangay Name</Label>
                  <p className="text-sm text-muted-foreground">{barangayName}</p>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <p className="text-sm text-muted-foreground">{address}</p>
                </div>
                {sealLogoUrl && (
                  <div className="space-y-2">
                    <Label>Barangay Seal/Logo</Label>
                    <Image src={sealLogoUrl} alt="Barangay Seal" width={64} height={64} className="rounded-full bg-muted object-cover" unoptimized />
                  </div>
                )}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Only administrators can edit barangay information.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="border-t-4 border-t-green-500 hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
              <CardTitle>Barangay Information</CardTitle>
              <CardDescription>Update the official details of your barangay.</CardDescription>
            </CardHeader>
          {isLoading ? (
            <CardContent>
              <div className="flex justify-center items-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="barangayName">Barangay Name</Label>
                  <Input id="barangayName" value={barangayName} onChange={(e) => setBarangayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Barangay Seal/Logo URL</Label>
                  <div className="flex items-center gap-4">
                    {sealLogoUrl && <Image src={sealLogoUrl} alt="Barangay Seal" width={64} height={64} className="rounded-full bg-muted object-cover" unoptimized />}
                    <Input id="logo" type="url" value={sealLogoUrl || ""} onChange={(e) => setSealLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving || !areServicesAvailable}>
                  {isSaving && <Loader2 className="mr-2 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </>
          )}
          </Card>
        )}
      </TabsContent>
      <TabsContent value="account">
          <div className="grid gap-6">
            <ChangePasswordForm />
          </div>
      </TabsContent>
      <TabsContent value="pricing">
        <DocumentPricingForm />
      </TabsContent>
      <TabsContent value="payment">
        <PaymentSettingsForm />
      </TabsContent>
      {canManageUsers && (
        <TabsContent value="users">
          <UserManagementClientPage />
        </TabsContent>
      )}
      <TabsContent value="system">
          <Card className="border-t-4 border-t-purple-500 hover:shadow-xl transition-all">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    System Maintenance
                  </CardTitle>
                  <CardDescription>Manage system logs, backups, and restores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> System maintenance features are available for administrators only.
                    </p>
                  </div>
                  <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        💾 Database Management
                      </h4>
                      <p className="text-sm text-muted-foreground">Create backups and restore your database</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" className="h-11">
                            <span className="mr-2">📥</span>
                            Backup Database
                          </Button>
                          <Button variant="destructive" className="h-11">
                            <span className="mr-2">📤</span>
                            Restore Database
                          </Button>
                      </div>
                  </div>
                   <Separator />
                  <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        📋 System Logs
                      </h4>
                      <p className="text-sm text-muted-foreground">View transaction logs, login attempts, and system errors</p>
                      <Button className="h-11">
                        <span className="mr-2">👁️</span>
                        View Logs
                      </Button>
                  </div>
              </CardContent>
          </Card>
      </TabsContent>
    </Tabs>
  );
}


export default function SettingsPage() {
    const { currentUser, isDataLoading } = useAppContext();

    if (isDataLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const isResident = currentUser?.role === 'Resident';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    {isResident 
                        ? "Manage your personal information and account settings." 
                        : "Manage your barangay's information and system settings."
                    }
                </p>
            </div>
            {isResident ? <ResidentSettings /> : <AdminSettings />}
        </div>
    );
}
