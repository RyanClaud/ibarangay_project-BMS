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
import {
  Loader2,
  Download,
  Upload,
  ScrollText,
  Eye,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Flame,
  HeartPulse,
  Radio,
  Building2,
  AlertTriangle,
  Phone,
  Check,
  Copy,
} from "lucide-react";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { useAppContext } from "@/contexts/app-context";
import { ResidentSettings } from "@/components/account/resident-settings";
import { DocumentPricingForm } from "@/components/settings/document-pricing-form";
import { PaymentSettingsForm } from "@/components/settings/payment-settings-form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";


function AdminSettings() {
  const { firestore, storage, areServicesAvailable } = useFirebase();
  const [barangayName, setBarangayName] = useState("Barangay Mina De Oro");
  const [address, setAddress] = useState("Bongabong, Oriental Mindoro, Philippines");
  const [sealLogoUrl, setSealLogoUrl] = useState<string | null>(null);

  // Emergency Responders Contact Hotlines
  const [dutyDesk, setDutyDesk] = useState("(043) 288-1234");
  const [mdrrmo, setMdrrmo] = useState("911 / 0917-123-4567");
  const [police, setPolice] = useState("166 / 0998-598-6321");
  const [fireStation, setFireStation] = useState("160 / (043) 288-1111");
  const [healthCenter, setHealthCenter] = useState("0919-876-5432");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");

  const { currentUser: contextUser } = useAppContext();
  
  // Check URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);
  
  // Check roles for permissions
  const canManageUsers = contextUser?.role === 'Admin' || contextUser?.role === 'Barangay Captain' || contextUser?.isSuperAdmin;
  const canEditBarangay = contextUser?.role === 'Admin' || contextUser?.role === 'Secretary' || contextUser?.role === 'Barangay Captain' || contextUser?.isSuperAdmin;

  useEffect(() => {
    const fetchConfig = async () => {
      if (!firestore || !contextUser?.barangayId) return;
      setIsLoading(true);
      try {
        // Load from barangays collection
        const configRef = doc(firestore, 'barangays', contextUser.barangayId);
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const configData = configSnap.data();
          setBarangayName(configData.name || "Barangay Mina De Oro");
          setAddress(configData.address || "Bongabong, Oriental Mindoro, Philippines");
          setSealLogoUrl(configData.sealLogoUrl || null);
          if (configData.emergencyHotlines) {
            setDutyDesk(configData.emergencyHotlines.dutyDesk ?? "(043) 288-1234");
            setMdrrmo(configData.emergencyHotlines.mdrrmo ?? "911 / 0917-123-4567");
            setPolice(configData.emergencyHotlines.police ?? "166 / 0998-598-6321");
            setFireStation(configData.emergencyHotlines.fireStation ?? "160 / (043) 288-1111");
            setHealthCenter(configData.emergencyHotlines.healthCenter ?? "0919-876-5432");
            setAdditionalNotes(configData.emergencyHotlines.additionalNotes ?? "");
          }
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
      // Save to barangays collection
      const configRef = doc(firestore, 'barangays', contextUser.barangayId);
      await setDoc(configRef, {
        name: barangayName.trim(),
        address: address.trim(),
        sealLogoUrl,
        emergencyHotlines: {
          dutyDesk: dutyDesk.trim(),
          mdrrmo: mdrrmo.trim(),
          police: police.trim(),
          fireStation: fireStation.trim(),
          healthCenter: healthCenter.trim(),
          additionalNotes: additionalNotes.trim(),
        },
      }, { merge: true });

      toast({
        title: "Settings Saved",
        description: "Barangay profile and emergency responder hotlines updated successfully.",
      });
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
      <TabsList className={`bg-white border border-[#E5EAF2] rounded-xl p-1 grid w-full grid-cols-2 sm:grid-cols-3 ${canManageUsers ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} h-auto gap-1 shadow-xs`}>
        <TabsTrigger value="account" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
          Account
        </TabsTrigger>
        <TabsTrigger value="barangay" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
          Barangay Info
        </TabsTrigger>
        <TabsTrigger value="pricing" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
          Document Pricing
        </TabsTrigger>
        <TabsTrigger value="payment" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
          Payment Settings
        </TabsTrigger>
        {canManageUsers && (
          <TabsTrigger value="users" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
            Staff Users
          </TabsTrigger>
        )}
        <TabsTrigger value="system" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#246BDE] data-[state=active]:text-white">
          System Status
        </TabsTrigger>
      </TabsList>
      <TabsContent value="barangay">
        {!canEditBarangay ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <h3 className="text-base font-bold text-[#172B4D]">Barangay Information</h3>
                <p className="text-xs text-[#718096]">Official profile of your barangay.</p>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-[#246BDE]" />
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#172B4D]">Barangay Name</Label>
                      <p className="text-sm text-[#4A5568] font-medium">{barangayName}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#172B4D]">Address</Label>
                      <p className="text-sm text-[#4A5568]">{address}</p>
                    </div>
                  </div>
                  {sealLogoUrl && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#172B4D]">Barangay Seal</Label>
                      <Image src={sealLogoUrl} alt="Barangay Seal" width={64} height={64} className="rounded-full bg-muted object-cover" unoptimized />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Read-only Emergency Responders Display */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <PhoneCall className="size-4.5 text-[#246BDE]" />
                  Official Emergency Responders &amp; Hotlines
                </h3>
                <p className="text-xs text-[#718096]">Emergency numbers registered for {barangayName}.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3.5 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60">
                  <p className="text-xs font-semibold text-[#246BDE]">Barangay Duty Desk</p>
                  <p className="text-sm font-bold text-[#102D56] font-mono mt-0.5">{dutyDesk || 'Not set'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#FED7AA] bg-[#FFF7ED]/60">
                  <p className="text-xs font-semibold text-[#EA580C]">MDRRMO Rescue &amp; Disaster</p>
                  <p className="text-sm font-bold text-[#EA580C] font-mono mt-0.5">{mdrrmo || 'Not set'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]/60">
                  <p className="text-xs font-semibold text-[#10A875]">PNP Police Station</p>
                  <p className="text-sm font-bold text-[#10A875] font-mono mt-0.5">{police || 'Not set'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/60">
                  <p className="text-xs font-semibold text-[#EF4655]">BFP Fire Department</p>
                  <p className="text-sm font-bold text-[#EF4655] font-mono mt-0.5">{fireStation || 'Not set'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E9D5FF] bg-[#F3E8FF]/60 sm:col-span-2">
                  <p className="text-xs font-semibold text-[#8B5CF6]">Rural Health Unit / Clinic</p>
                  <p className="text-sm font-bold text-[#8B5CF6] font-mono mt-0.5">{healthCenter || 'Not set'}</p>
                </div>
              </div>
              <div className="bg-[#EAF2FF] p-3 rounded-xl border border-[#BFDBFE]">
                <p className="text-xs text-[#246BDE]">
                  Only barangay administrators, secretaries, or captains can edit these hotlines.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Barangay Profile */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Building2 className="size-4.5 text-[#246BDE]" />
                  Barangay Profile
                </h3>
                <p className="text-xs text-[#718096]">Update official name, address, and seal logo.</p>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="animate-spin h-8 w-8 text-[#246BDE]" />
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="barangayName" className="text-xs font-semibold text-[#172B4D]">
                        Barangay Name <span className="text-[#EF4655]">*</span>
                      </Label>
                      <Input
                        id="barangayName"
                        value={barangayName}
                        onChange={(e) => setBarangayName(e.target.value)}
                        className="rounded-xl border-[#E2E8F0] text-sm"
                        placeholder="e.g. Barangay Mina De Oro"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-semibold text-[#172B4D]">
                        Complete Address <span className="text-[#EF4655]">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="rounded-xl border-[#E2E8F0] text-sm"
                        placeholder="e.g. Bongabong, Oriental Mindoro"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="logo" className="text-xs font-semibold text-[#172B4D]">
                      Barangay Seal / Logo URL
                    </Label>
                    <div className="flex items-center gap-3">
                      {sealLogoUrl && (
                        <Image
                          src={sealLogoUrl}
                          alt="Barangay Seal"
                          width={44}
                          height={44}
                          className="rounded-full bg-muted object-cover ring-2 ring-[#246BDE]/20 shrink-0"
                          unoptimized
                        />
                      )}
                      <Input
                        id="logo"
                        type="url"
                        value={sealLogoUrl || ""}
                        onChange={(e) => setSealLogoUrl(e.target.value)}
                        placeholder="https://example.com/barangay-seal.png"
                        className="rounded-xl border-[#E2E8F0] text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Emergency Responders & Hotlines Directory */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#EF4655]">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172B4D]">
                      24/7 Emergency Responders &amp; Public Safety Hotlines
                    </h3>
                    <p className="text-xs text-[#718096]">
                      Inputs for official emergency contact numbers. These numbers automatically display on all resident dashboards and emergency dialers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Barangay Duty Desk */}
                  <div className="p-3.5 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60 space-y-2">
                    <Label htmlFor="dutyDesk" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-[#246BDE] text-white shrink-0">
                        <PhoneCall className="size-3.5" />
                      </div>
                      <span>Barangay Duty Desk / Hall Hotline</span>
                    </Label>
                    <Input
                      id="dutyDesk"
                      value={dutyDesk}
                      onChange={(e) => setDutyDesk(e.target.value)}
                      placeholder="e.g. (043) 288-1234 or 0917-123-4567"
                      className="rounded-xl bg-white border-[#BFDBFE] text-sm font-medium"
                    />
                    <p className="text-[11px] text-[#718096]">Direct phone/mobile for on-duty Barangay Tanods &amp; Desk Officer.</p>
                  </div>

                  {/* 2. MDRRMO Rescue */}
                  <div className="p-3.5 rounded-xl border border-[#FED7AA] bg-[#FFF7ED]/60 space-y-2">
                    <Label htmlFor="mdrrmo" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-[#EA580C] text-white shrink-0">
                        <ShieldAlert className="size-3.5" />
                      </div>
                      <span>MDRRMO Rescue &amp; Disaster Team</span>
                    </Label>
                    <Input
                      id="mdrrmo"
                      value={mdrrmo}
                      onChange={(e) => setMdrrmo(e.target.value)}
                      placeholder="e.g. 911 / 0917-123-4567"
                      className="rounded-xl bg-white border-[#FED7AA] text-sm font-medium"
                    />
                    <p className="text-[11px] text-[#718096]">Municipal disaster risk command, ambulance dispatch &amp; medics.</p>
                  </div>

                  {/* 3. PNP Police */}
                  <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]/60 space-y-2">
                    <Label htmlFor="police" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-[#10A875] text-white shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <span>PNP Police Station / Patrol Desk</span>
                    </Label>
                    <Input
                      id="police"
                      value={police}
                      onChange={(e) => setPolice(e.target.value)}
                      placeholder="e.g. 166 / 0998-598-6321"
                      className="rounded-xl bg-white border-[#A7F3D0] text-sm font-medium"
                    />
                    <p className="text-[11px] text-[#718096]">Municipal police precinct, emergency peace patrol &amp; reports.</p>
                  </div>

                  {/* 4. BFP Fire Station */}
                  <div className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2]/60 space-y-2">
                    <Label htmlFor="fireStation" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-[#EF4655] text-white shrink-0">
                        <Flame className="size-3.5" />
                      </div>
                      <span>BFP Fire Department Station</span>
                    </Label>
                    <Input
                      id="fireStation"
                      value={fireStation}
                      onChange={(e) => setFireStation(e.target.value)}
                      placeholder="e.g. 160 / (043) 288-1111"
                      className="rounded-xl bg-white border-[#FECACA] text-sm font-medium"
                    />
                    <p className="text-[11px] text-[#718096]">Fire suppression, hazmat containment, and trapped rescue.</p>
                  </div>

                  {/* 5. Health Center */}
                  <div className="p-3.5 rounded-xl border border-[#E9D5FF] bg-[#F3E8FF]/60 space-y-2 sm:col-span-2">
                    <Label htmlFor="healthCenter" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-[#8B5CF6] text-white shrink-0">
                        <HeartPulse className="size-3.5" />
                      </div>
                      <span>Rural Health Unit (RHU) / Barangay Clinic</span>
                    </Label>
                    <Input
                      id="healthCenter"
                      value={healthCenter}
                      onChange={(e) => setHealthCenter(e.target.value)}
                      placeholder="e.g. 0919-876-5432 or (043) 288-2222"
                      className="rounded-xl bg-white border-[#E9D5FF] text-sm font-medium"
                    />
                    <p className="text-[11px] text-[#718096]">Emergency clinic duty nurse, maternal care, and clinic doctor.</p>
                  </div>
                </div>

                {/* Additional Advisory / Radio Channel Notes */}
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="additionalNotes" className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                    <Radio className="size-3.5 text-[#D97706]" />
                    <span>Emergency Advisory, Evacuation Sites &amp; Radio Channels (Optional)</span>
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Emergency VHF Radio Channel: 144.750 MHz. Designated primary evacuation center: Barangay Multi-Purpose Hall &amp; Central School."
                    className="rounded-xl border-[#E2E8F0] text-sm resize-none"
                    rows={2}
                  />
                  <p className="text-[11px] text-[#718096]">
                    These instructions will appear at the top of the resident emergency directory during typhoons or calamities.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E5EAF2] flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving || !areServicesAvailable}
                  className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl font-bold px-6 h-10 shadow-sm"
                >
                  {isSaving && <Loader2 className="mr-2 animate-spin size-4" />}
                  {isSaving ? 'Saving Changes...' : 'Save Barangay Information & Hotlines'}
                </Button>
              </div>
            </div>
          </div>
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
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-6">
              <div className="border-b border-[#E5EAF2] pb-3">
                  <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                    <span>System Maintenance &amp; Integrity</span>
                  </h3>
                  <p className="text-xs text-[#718096]">Manage system logs, database health, and recovery tools.</p>
              </div>
              <div className="space-y-6">
                  <div className="bg-[#EAF2FF] border border-[#BFDBFE] rounded-xl p-4">
                    <p className="text-xs text-[#246BDE]">
                      <strong>Notice:</strong> System maintenance and configuration features are restricted to authorized administrators only.
                    </p>
                  </div>
                  <div className="space-y-3">
                      <h4 className="font-bold text-sm text-[#172B4D]">
                        Database Backups &amp; Archive
                      </h4>
                      <p className="text-xs text-[#718096]">Create offline snapshots of residents and request records</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" className="h-10 text-xs font-semibold rounded-xl border-[#E5EAF2] text-[#172B4D] hover:bg-[#F8FAFC]">
                            <Download className="mr-2 size-4 text-[#246BDE]" />
                            Backup Database
                          </Button>
                          <Button variant="destructive" className="h-10 text-xs font-semibold rounded-xl">
                            <Upload className="mr-2 size-4 text-white" />
                            Restore Database
                          </Button>
                      </div>
                  </div>
                   <Separator />
                  <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2 text-[#172B4D]">
                        <ScrollText className="size-5 text-[#246BDE]" />
                        System Logs
                      </h4>
                      <p className="text-sm text-muted-foreground">View transaction logs, login attempts, and system errors</p>
                      <Button className="h-10 text-xs font-semibold rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white">
                        <Eye className="mr-2 size-4" />
                        View Logs
                      </Button>
                  </div>
              </div>
          </div>
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
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">Settings</h1>
                <p className="text-sm text-[#718096] mt-1">
                    {isResident 
                        ? "Manage your personal profile, credentials, and account settings." 
                        : "Manage official barangay configurations, document fees, and security credentials."
                    }
                </p>
            </div>
            {isResident ? <ResidentSettings /> : <AdminSettings />}
        </div>
    );
}
