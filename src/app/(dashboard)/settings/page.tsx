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
  Users,
  UserCheck,
  Plus,
  Trash2,
  RefreshCw,
  Award,
  FileSignature,
  Shield,
  CheckCircle2,
  UserCog,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { useAppContext } from "@/contexts/app-context";
import { ResidentSettings } from "@/components/account/resident-settings";
import { DocumentPricingForm } from "@/components/settings/document-pricing-form";
import { PaymentSettingsForm } from "@/components/settings/payment-settings-form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { BarangayOfficial } from "@/lib/types";

const DEFAULT_OFFICIALS: BarangayOfficial[] = [
  { id: 'off-captain', name: 'Hon. Amado Magtibay', position: 'Punong Barangay / Barangay Captain', committee: 'Executive / Council Presiding Officer', contactNumber: '', term: '2023 - 2026', order: 1 },
  { id: 'off-kag-1', name: 'Hon. Roberto Santos', position: 'Barangay Kagawad', committee: 'Committee on Peace and Order & Public Safety', contactNumber: '', term: '2023 - 2026', order: 2 },
  { id: 'off-kag-2', name: 'Hon. Elena Ramos', position: 'Barangay Kagawad', committee: 'Committee on Health, Nutrition & Sanitation', contactNumber: '', term: '2023 - 2026', order: 3 },
  { id: 'off-kag-3', name: 'Hon. Carlos Mendoza', position: 'Barangay Kagawad', committee: 'Committee on Education, Culture & Heritage', contactNumber: '', term: '2023 - 2026', order: 4 },
  { id: 'off-kag-4', name: 'Hon. Maria Garcia', position: 'Barangay Kagawad', committee: 'Committee on Public Works & Infrastructure', contactNumber: '', term: '2023 - 2026', order: 5 },
  { id: 'off-kag-5', name: 'Hon. Danilo Cruz', position: 'Barangay Kagawad', committee: 'Committee on Agriculture, Trade & Livelihood', contactNumber: '', term: '2023 - 2026', order: 6 },
  { id: 'off-kag-6', name: 'Hon. Teresa Reyes', position: 'Barangay Kagawad', committee: 'Committee on Appropriations, Finance & Budget', contactNumber: '', term: '2023 - 2026', order: 7 },
  { id: 'off-kag-7', name: 'Hon. Fernando Morales', position: 'Barangay Kagawad', committee: 'Committee on Environment & Disaster Response', contactNumber: '', term: '2023 - 2026', order: 8 },
  { id: 'off-sk', name: 'Hon. John Paul Dela Cruz', position: 'SK Chairperson', committee: 'Committee on Youth & Sports Development', contactNumber: '', term: '2023 - 2026', order: 9 },
  { id: 'off-secretary', name: 'Barangay Secretary', position: 'Barangay Secretary', committee: 'Records, Certifications & Attestation', contactNumber: '', term: '2023 - 2026', order: 10 },
  { id: 'off-treasurer', name: 'Barangay Treasurer', position: 'Barangay Treasurer', committee: 'Revenue Collection, Disbursement & Custody', contactNumber: '', term: '2023 - 2026', order: 11 },
];

function AdminSettings() {
  const { firestore, storage, areServicesAvailable } = useFirebase();
  const [barangayName, setBarangayName] = useState("Barangay Mina De Oro");
  const [address, setAddress] = useState("Bongabong, Oriental Mindoro, Philippines");
  const [sealLogoUrl, setSealLogoUrl] = useState<string | null>(null);

  // Barangay Leadership & Signatories (dynamically populate PDF exports)
  const [captainName, setCaptainName] = useState("Hon. Amado Magtibay");
  const [captainContact, setCaptainContact] = useState("");
  const [secretaryName, setSecretaryName] = useState("Barangay Secretary");
  const [secretaryContact, setSecretaryContact] = useState("");
  const [treasurerName, setTreasurerName] = useState("Barangay Treasurer");
  const [treasurerContact, setTreasurerContact] = useState("");
  const [officialsList, setOfficialsList] = useState<BarangayOfficial[]>(DEFAULT_OFFICIALS);

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

          // Barangay Leadership & Signatories
          const loadedCaptain = configData.captainName || "";
          const loadedSecretary = configData.secretaryName || "";
          const loadedTreasurer = configData.treasurerName || "";

          setCaptainName(loadedCaptain || "Hon. Amado Magtibay");
          setCaptainContact(configData.captainContact || "");
          setSecretaryName(loadedSecretary || "Barangay Secretary");
          setSecretaryContact(configData.secretaryContact || "");
          setTreasurerName(loadedTreasurer || "Barangay Treasurer");
          setTreasurerContact(configData.treasurerContact || "");

          if (Array.isArray(configData.officials) && configData.officials.length > 0) {
            setOfficialsList(configData.officials);
          } else {
            // Seed defaults with loaded leadership if available
            setOfficialsList(
              DEFAULT_OFFICIALS.map((off) => {
                if (off.id === 'off-captain' && loadedCaptain) return { ...off, name: loadedCaptain };
                if (off.id === 'off-secretary' && loadedSecretary) return { ...off, name: loadedSecretary };
                if (off.id === 'off-treasurer' && loadedTreasurer) return { ...off, name: loadedTreasurer };
                return off;
              })
            );
          }

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

  // Synchronize top-level signatories with the council roster
  const handleCaptainChange = (newName: string) => {
    setCaptainName(newName);
    setOfficialsList((prev) =>
      prev.map((off) => {
        if (
          off.id === 'off-captain' ||
          off.position.toLowerCase().includes('captain') ||
          off.position.toLowerCase().includes('punong')
        ) {
          return { ...off, name: newName };
        }
        return off;
      })
    );
  };

  const handleSecretaryChange = (newName: string) => {
    setSecretaryName(newName);
    setOfficialsList((prev) =>
      prev.map((off) => {
        if (off.id === 'off-secretary' || off.position.toLowerCase().includes('secretary')) {
          return { ...off, name: newName };
        }
        return off;
      })
    );
  };

  const handleTreasurerChange = (newName: string) => {
    setTreasurerName(newName);
    setOfficialsList((prev) =>
      prev.map((off) => {
        if (off.id === 'off-treasurer' || off.position.toLowerCase().includes('treasurer')) {
          return { ...off, name: newName };
        }
        return off;
      })
    );
  };

  const handleOfficialFieldChange = (id: string, field: keyof BarangayOfficial, value: string) => {
    setOfficialsList((prev) =>
      prev.map((off) => {
        if (off.id === id) {
          const updated = { ...off, [field]: value };
          if (field === 'name') {
            if (
              updated.id === 'off-captain' ||
              updated.position.toLowerCase().includes('captain') ||
              updated.position.toLowerCase().includes('punong')
            ) {
              setCaptainName(value);
            } else if (
              updated.id === 'off-secretary' ||
              updated.position.toLowerCase().includes('secretary')
            ) {
              setSecretaryName(value);
            } else if (
              updated.id === 'off-treasurer' ||
              updated.position.toLowerCase().includes('treasurer')
            ) {
              setTreasurerName(value);
            }
          }
          return updated;
        }
        return off;
      })
    );
  };

  const handleAddOfficial = () => {
    const newId = `off-${Date.now()}`;
    const nextOrder = officialsList.length + 1;
    setOfficialsList((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        position: 'Barangay Kagawad',
        committee: '',
        contactNumber: '',
        term: '2023 - 2026',
        order: nextOrder,
      },
    ]);
  };

  const handleRemoveOfficial = (id: string) => {
    setOfficialsList((prev) => prev.filter((off) => off.id !== id));
  };

  const handleResetOfficials = () => {
    setOfficialsList(DEFAULT_OFFICIALS);
    setCaptainName('Hon. Amado Magtibay');
    setSecretaryName('Barangay Secretary');
    setTreasurerName('Barangay Treasurer');
    toast({
      title: 'Officials Template Restored',
      description: 'Standard Sangguniang Barangay template loaded. Remember to click Save Changes.',
    });
  };

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
        captainName: captainName.trim(),
        captainContact: captainContact.trim(),
        secretaryName: secretaryName.trim(),
        secretaryContact: secretaryContact.trim(),
        treasurerName: treasurerName.trim(),
        treasurerContact: treasurerContact.trim(),
        officials: officialsList.map((o, idx) => ({
          id: o.id || `off-${Date.now()}-${idx}`,
          name: o.name.trim(),
          position: o.position.trim(),
          committee: (o.committee || '').trim(),
          contactNumber: (o.contactNumber || '').trim(),
          term: (o.term || '').trim(),
          order: o.order ?? idx + 1,
        })),
        emergencyHotlines: {
          dutyDesk: dutyDesk.trim(),
          mdrrmo: mdrrmo.trim(),
          police: police.trim(),
          fireStation: fireStation.trim(),
          healthCenter: healthCenter.trim(),
          additionalNotes: additionalNotes.trim(),
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: "Settings Saved",
        description: "Barangay profile, council leadership, and emergency hotlines updated successfully.",
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
            {/* Read-Only Profile */}
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

            {/* Read-Only Leadership & Signatories */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Award className="size-4.5 text-[#246BDE]" />
                  Barangay Leadership &amp; Official Signatories
                </h3>
                <p className="text-xs text-[#718096]">Elected and appointed signatories on official certificates and masterlists.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60 space-y-1">
                  <Badge className="bg-[#246BDE] text-white text-[10px]">Punong Barangay</Badge>
                  <p className="text-sm font-bold text-[#102D56] mt-1">{captainName || 'Not configured'}</p>
                  <p className="text-xs text-[#718096]">{captainContact || 'No contact number'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60 space-y-1">
                  <Badge className="bg-[#10A875] text-white text-[10px]">Barangay Secretary</Badge>
                  <p className="text-sm font-bold text-[#102D56] mt-1">{secretaryName || 'Not configured'}</p>
                  <p className="text-xs text-[#718096]">{secretaryContact || 'No contact number'}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60 space-y-1">
                  <Badge className="bg-[#D97706] text-white text-[10px]">Barangay Treasurer</Badge>
                  <p className="text-sm font-bold text-[#102D56] mt-1">{treasurerName || 'Not configured'}</p>
                  <p className="text-xs text-[#718096]">{treasurerContact || 'No contact number'}</p>
                </div>
              </div>
            </div>

            {/* Read-Only Council Roster */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                  <Users className="size-4.5 text-[#246BDE]" />
                  Sangguniang Barangay Council Roster
                </h3>
                <p className="text-xs text-[#718096]">Registered council members, Kagawads, and committee assignments.</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {officialsList.map((off) => (
                  <div key={off.id} className="p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#172B4D] truncate">{off.name || 'Unnamed Official'}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0 border-[#CBD5E1] text-[#475569]">
                        {off.position}
                      </Badge>
                    </div>
                    {off.committee && (
                      <p className="text-[11px] text-[#246BDE] font-medium truncate">{off.committee}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-[#718096]">
                      <span>{off.contactNumber || '—'}</span>
                      <span>{off.term || '2023 - 2026'}</span>
                    </div>
                  </div>
                ))}
              </div>
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

            {/* Section 2: Key Barangay Leadership & PDF Signatories */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE]">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172B4D]">
                        Key Barangay Leadership &amp; PDF Signatories
                      </h3>
                      <p className="text-xs text-[#718096]">
                        These names dynamically print on all official PDF Masterlists, Barangay Clearances, Certificates, and Indigency documents.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-[11px] font-bold w-fit">
                    <CheckCircle2 className="size-3 mr-1" /> Dynamic PDF Sync Active
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Punong Barangay / Captain */}
                  <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#F0F6FF]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="captainName" className="flex items-center gap-1.5 text-xs font-bold text-[#102D56]">
                        <Award className="size-3.5 text-[#246BDE]" />
                        <span>Punong Barangay (Captain)</span>
                      </Label>
                      <Badge className="bg-[#246BDE] text-white text-[10px]">Head of Council</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Full Official Name <span className="text-[#EF4655]">*</span></Label>
                      <Input
                        id="captainName"
                        value={captainName}
                        onChange={(e) => handleCaptainChange(e.target.value)}
                        placeholder="e.g. Hon. Juan Dela Cruz"
                        className="rounded-xl bg-white border-[#BFDBFE] text-sm font-semibold text-[#102D56]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Official Mobile / Hotline</Label>
                      <Input
                        value={captainContact}
                        onChange={(e) => setCaptainContact(e.target.value)}
                        placeholder="e.g. 0917-123-4567"
                        className="rounded-xl bg-white border-[#BFDBFE] text-xs font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-[#246BDE] leading-snug">
                      Attests &amp; approves all resident masterlists, clearances, and certificates.
                    </p>
                  </div>

                  {/* 2. Barangay Secretary */}
                  <div className="p-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="secretaryName" className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
                        <FileSignature className="size-3.5 text-[#10A875]" />
                        <span>Barangay Secretary</span>
                      </Label>
                      <Badge className="bg-[#10A875] text-white text-[10px]">Certifying Officer</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Full Official Name <span className="text-[#EF4655]">*</span></Label>
                      <Input
                        id="secretaryName"
                        value={secretaryName}
                        onChange={(e) => handleSecretaryChange(e.target.value)}
                        placeholder="e.g. Maria Santos"
                        className="rounded-xl bg-white border-[#A7F3D0] text-sm font-semibold text-[#065F46]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Official Mobile / Office Phone</Label>
                      <Input
                        value={secretaryContact}
                        onChange={(e) => setSecretaryContact(e.target.value)}
                        placeholder="e.g. 0918-234-5678"
                        className="rounded-xl bg-white border-[#A7F3D0] text-xs font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-[#065F46] leading-snug">
                      Prepares and certifies resident masterlists, residency records, and minutes.
                    </p>
                  </div>

                  {/* 3. Barangay Treasurer */}
                  <div className="p-4 rounded-xl border border-[#FED7AA] bg-[#FFF7ED]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="treasurerName" className="flex items-center gap-1.5 text-xs font-bold text-[#9A3412]">
                        <ShieldCheck className="size-3.5 text-[#EA580C]" />
                        <span>Barangay Treasurer</span>
                      </Label>
                      <Badge className="bg-[#EA580C] text-white text-[10px]">Financial Custodian</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Full Official Name <span className="text-[#EF4655]">*</span></Label>
                      <Input
                        id="treasurerName"
                        value={treasurerName}
                        onChange={(e) => handleTreasurerChange(e.target.value)}
                        placeholder="e.g. Roberto Gomez"
                        className="rounded-xl bg-white border-[#FED7AA] text-sm font-semibold text-[#9A3412]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#718096]">Official Mobile / Office Phone</Label>
                      <Input
                        value={treasurerContact}
                        onChange={(e) => setTreasurerContact(e.target.value)}
                        placeholder="e.g. 0919-345-6789"
                        className="rounded-xl bg-white border-[#FED7AA] text-xs font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-[#9A3412] leading-snug">
                      Oversees document tariff collection, GCash verification, and revenue ledgers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Sangguniang Barangay Council Roster (Future Officials Management) */}
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E5EAF2] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FA] text-[#172B4D]">
                      <Users className="size-5 text-[#246BDE]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
                        Sangguniang Barangay Council Roster
                        <Badge variant="outline" className="text-xs font-normal border-[#CBD5E1]">
                          {officialsList.length} Officials
                        </Badge>
                      </h3>
                      <p className="text-xs text-[#718096]">
                        Rename, update, or assign committees to all council members (Kagawads, SK Chairperson, Secretary, Treasurer).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetOfficials}
                      className="rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#4A5568] hover:bg-[#F8FAFC] h-9 gap-1.5"
                    >
                      <RefreshCw className="size-3.5 text-[#718096]" />
                      <span>Reset Template</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddOfficial}
                      className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white text-xs font-bold h-9 gap-1.5 shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Official</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="bg-[#EAF2FF]/60 border border-[#BFDBFE] p-3 rounded-xl flex items-center gap-2.5 text-xs text-[#172B4D]">
                  <UserCog className="size-4 text-[#246BDE] shrink-0" />
                  <span>
                    <strong>Council Composition Tip:</strong> When elections or appointments take place, rename the officials below. The system automatically preserves council history while updating all active document templates and directories.
                  </span>
                </div>

                <div className="space-y-2.5">
                  {officialsList.map((official, index) => {
                    const isCaptainRow =
                      official.id === 'off-captain' ||
                      official.position.toLowerCase().includes('captain') ||
                      official.position.toLowerCase().includes('punong');
                    const isSecRow =
                      official.id === 'off-secretary' ||
                      official.position.toLowerCase().includes('secretary');
                    const isTreasRow =
                      official.id === 'off-treasurer' ||
                      official.position.toLowerCase().includes('treasurer');

                    return (
                      <div
                        key={official.id}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          isCaptainRow
                            ? 'border-[#BFDBFE] bg-[#F0F6FF]/40'
                            : isSecRow
                            ? 'border-[#A7F3D0] bg-[#ECFDF5]/40'
                            : isTreasRow
                            ? 'border-[#FED7AA] bg-[#FFF7ED]/40'
                            : 'border-[#E5EAF2] bg-[#F8FAFC]/80 hover:bg-white'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Row Indicator & Position */}
                          <div className="sm:col-span-3 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-[#718096] font-mono">
                                #{index + 1}
                              </span>
                              <Input
                                value={official.position}
                                onChange={(e) =>
                                  handleOfficialFieldChange(official.id, 'position', e.target.value)
                                }
                                placeholder="Position Title"
                                className="h-8 text-xs font-semibold rounded-lg bg-white border-[#E2E8F0]"
                              />
                            </div>
                          </div>

                          {/* Full Name */}
                          <div className="sm:col-span-4 space-y-1">
                            <Input
                              value={official.name}
                              onChange={(e) =>
                                handleOfficialFieldChange(official.id, 'name', e.target.value)
                              }
                              placeholder="Official Full Name (e.g. Hon. Juan Dela Cruz)"
                              className="h-8 text-xs font-medium rounded-lg bg-white border-[#E2E8F0]"
                            />
                          </div>

                          {/* Committee Assignment */}
                          <div className="sm:col-span-3 space-y-1">
                            <Input
                              value={official.committee || ''}
                              onChange={(e) =>
                                handleOfficialFieldChange(official.id, 'committee', e.target.value)
                              }
                              placeholder="Committee / Responsibility"
                              className="h-8 text-xs rounded-lg bg-white border-[#E2E8F0]"
                            />
                          </div>

                          {/* Contact & Term / Delete */}
                          <div className="sm:col-span-2 flex items-center gap-1.5 justify-end">
                            <Input
                              value={official.contactNumber || ''}
                              onChange={(e) =>
                                handleOfficialFieldChange(official.id, 'contactNumber', e.target.value)
                              }
                              placeholder="Contact #"
                              className="h-8 text-xs font-mono rounded-lg bg-white border-[#E2E8F0] w-24"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOfficial(official.id)}
                              className="h-8 w-8 p-0 text-[#EF4655] hover:bg-[#FEF2F2] rounded-lg shrink-0"
                              title="Remove Official"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Responders & Hotlines Directory */}
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
                  {isSaving ? 'Saving Changes...' : 'Save Barangay Profile & Officials'}
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
