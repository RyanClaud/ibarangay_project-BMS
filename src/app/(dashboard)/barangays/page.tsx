"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Mail, 
  AlertCircle, 
  Upload, 
  UserPlus, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Phone, 
  Calendar, 
  Sparkles,
  ExternalLink,
  Settings,
  Shield,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import type { Barangay } from "@/lib/types";
import { validateBarangay } from "@/lib/barangay-utils";

export default function BarangaysPage() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [barangayAdmins, setBarangayAdmins] = useState<Record<string, { email: string; name: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState<Barangay | null>(null);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [selectedBarangayForAdmin, setSelectedBarangayForAdmin] = useState<Barangay | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [adminFormData, setAdminFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    municipality: "",
    province: "",
    contactNumber: "",
    sealLogoUrl: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
    createAdminAccount: false,
  });
  const [createdAdminCredentials, setCreatedAdminCredentials] = useState<{
    email: string;
    password: string;
    barangayName: string;
  } | null>(null);

  // Check if user is super admin
  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  // Get unique municipalities
  const municipalities = Array.from(new Set(barangays.map(b => b.municipality).filter(Boolean))).sort();
  
  // Filter barangays based on search query and selected municipality
  const filteredBarangays = barangays.filter(barangay => {
    const matchesSearch = 
      barangay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barangay.municipality && barangay.municipality.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (barangay.province && barangay.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (barangay.address && barangay.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMunicipality = selectedMunicipality === 'all' || barangay.municipality === selectedMunicipality;
    
    return matchesSearch && matchesMunicipality;
  });

  useEffect(() => {
    loadBarangays();
  }, [firestore]);

  const loadBarangays = async () => {
    if (!firestore) return;
    
    try {
      // Load barangays
      const snapshot = await getDocs(collection(firestore, "barangays"));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Barangay));
      setBarangays(data);

      // Load admin users for each barangay
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const adminsMap: Record<string, { email: string; name: string }> = {};
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.role === "Admin" && !userData.isSuperAdmin && userData.barangayId) {
          adminsMap[userData.barangayId] = {
            email: userData.email || "N/A",
            name: userData.name || "N/A"
          };
        }
      });
      
      setBarangayAdmins(adminsMap);
    } catch (error) {
      console.error("Error loading barangays:", error);
      toast({
        title: "Error",
        description: "Failed to load barangays",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    const errors = validateBarangay(formData);
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (!editingBarangay && formData.createAdminAccount) {
      if (!formData.adminEmail || !formData.adminName || !formData.adminPassword) {
        toast({
          title: "Validation Error",
          description: "Admin email, name, and password are required when creating an admin account",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (editingBarangay) {
        const barangayRef = doc(firestore, "barangays", editingBarangay.id);
        await updateDoc(barangayRef, {
          name: formData.name,
          address: formData.address,
          municipality: formData.municipality,
          province: formData.province,
          contactNumber: formData.contactNumber,
          sealLogoUrl: formData.sealLogoUrl,
          isActive: editingBarangay.isActive,
        });

        const currentAdmin = barangayAdmins[editingBarangay.id];
        if (currentAdmin && formData.adminEmail && formData.adminEmail !== currentAdmin.email) {
          toast({
            title: "Important Notice",
            description: "Email changes only update the display. To change login email, update in Firebase Console or recreate the admin.",
            variant: "destructive",
          });
          
          try {
            const usersSnapshot = await getDocs(collection(firestore, "users"));
            const adminDoc = usersSnapshot.docs.find(doc => {
              const data = doc.data();
              return data.barangayId === editingBarangay.id && 
                     data.role === "Admin" && 
                     !data.isSuperAdmin;
            });

            if (adminDoc) {
              await updateDoc(doc(firestore, "users", adminDoc.id), {
                email: formData.adminEmail,
              });
            }
          } catch (emailError) {
            console.error("Error updating admin email:", emailError);
          }
        }
        
        toast({
          title: "Success",
          description: "Barangay information updated successfully",
        });
      } else {
        const newBarangay: Omit<Barangay, "id"> = {
          name: formData.name,
          address: formData.address,
          municipality: formData.municipality,
          province: formData.province,
          contactNumber: formData.contactNumber,
          sealLogoUrl: formData.sealLogoUrl,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const barangayDoc = await addDoc(collection(firestore, "barangays"), newBarangay);
        
        if (formData.createAdminAccount) {
          try {
            const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
            const secondaryAuth = initializeAuth(secondaryApp, {
              persistence: browserLocalPersistence
            });
            
            const userCredential = await createUserWithEmailAndPassword(
              secondaryAuth,
              formData.adminEmail,
              formData.adminPassword
            );

            await setDoc(doc(firestore, "users", userCredential.user.uid), {
              id: userCredential.user.uid,
              name: formData.adminName,
              email: formData.adminEmail,
              role: "Admin",
              barangayId: barangayDoc.id,
              avatarUrl: "",
              isSuperAdmin: false,
            });

            await deleteApp(secondaryApp);

            setCreatedAdminCredentials({
              email: formData.adminEmail,
              password: formData.adminPassword,
              barangayName: formData.name,
            });

            toast({
              title: "Success",
              description: "Barangay and admin account created successfully",
            });
          } catch (authError: any) {
            console.error("Error creating admin account:", authError);
            toast({
              title: "Warning",
              description: `Barangay created but admin account failed: ${authError.message}`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Barangay created successfully",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadBarangays();
    } catch (error) {
      console.error("Error saving barangay:", error);
      toast({
        title: "Error",
        description: "Failed to save barangay",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (barangay: Barangay) => {
    setEditingBarangay(barangay);
    const admin = barangayAdmins[barangay.id];
    
    setFormData({
      name: barangay.name,
      address: barangay.address,
      municipality: barangay.municipality,
      province: barangay.province,
      contactNumber: barangay.contactNumber || "",
      sealLogoUrl: barangay.sealLogoUrl || "",
      adminEmail: admin?.email || "",
      adminPassword: "",
      adminName: admin?.name || "",
      createAdminAccount: false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (barangayId: string, name: string) => {
    if (!firestore) return;
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(firestore, "barangays", barangayId));
      toast({
        title: "Success",
        description: `Barangay "${name}" deleted successfully`,
      });
      loadBarangays();
    } catch (error) {
      console.error("Error deleting barangay:", error);
      toast({
        title: "Error",
        description: "Failed to delete barangay",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (barangay: Barangay) => {
    if (!firestore) return;

    try {
      const barangayRef = doc(firestore, "barangays", barangay.id);
      await updateDoc(barangayRef, { isActive: !barangay.isActive });
      toast({
        title: "Success",
        description: `Barangay ${barangay.isActive ? "deactivated" : "activated"}`,
      });
      loadBarangays();
    } catch (error) {
      console.error("Error toggling barangay status:", error);
      toast({
        title: "Error",
        description: "Failed to update barangay status",
        variant: "destructive",
      });
    }
  };

  const generateAdminEmail = (barangayName: string) => {
    if (!barangayName) return "";
    const cleanName = barangayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/^barangay/i, '');
    
    return `admin@ibarangay${cleanName}.com`;
  };

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      adminEmail: editingBarangay ? formData.adminEmail : generateAdminEmail(name)
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedBarangayForAdmin) return;

    try {
      const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
      const secondaryAuth = initializeAuth(secondaryApp, {
        persistence: browserLocalPersistence
      });
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        adminFormData.email,
        adminFormData.password
      );

      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        id: userCredential.user.uid,
        name: adminFormData.name,
        email: adminFormData.email,
        role: "Admin",
        barangayId: selectedBarangayForAdmin.id,
        avatarUrl: "",
        isSuperAdmin: false,
      });

      await deleteApp(secondaryApp);

      toast({
        title: "Success",
        description: "Admin account created successfully",
      });

      setCreateAdminDialogOpen(false);
      setAdminFormData({ name: "", email: "", password: "" });
      setSelectedBarangayForAdmin(null);
      loadBarangays();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    }
  };

  const openCreateAdminDialog = (barangay: Barangay) => {
    setSelectedBarangayForAdmin(barangay);
    setAdminFormData({
      name: "",
      email: generateAdminEmail(barangay.name),
      password: "",
    });
    setCreateAdminDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      municipality: "",
      province: "",
      contactNumber: "",
      sealLogoUrl: "",
      adminEmail: "",
      adminPassword: "",
      adminName: "",
      createAdminAccount: false,
    });
    setEditingBarangay(null);
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-8 text-center space-y-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EF4655]/10 text-[#EF4655] mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-[#172B4D]">Access Restricted</h2>
          <p className="text-sm text-[#718096] max-w-md mx-auto">
            You don't have permission to access Barangay Management. Only Super Administrators can configure barangay tenants.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = barangays.filter(b => b.isActive !== false).length;
  const configuredAdminCount = Object.keys(barangayAdmins).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-yellow-400/40 shrink-0 shadow-inner">
            <Building2 className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Multi-Tenant Network • Oriental Mindoro</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Barangay Jurisdiction Management
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Register, configure, and monitor multi-barangay municipal tenants, designated administrators, and institutional seals.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/barangays/bulk-create">
            <Button
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
            >
              <Layers className="mr-2 h-4 w-4" />
              Bulk Create
            </Button>
          </Link>
          <Link href="/barangays/import">
            <Button
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </Link>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold h-10 px-4 shadow-sm text-xs sm:text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Barangay
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-[#E5EAF2]">
              <DialogHeader className="flex-shrink-0 border-b border-[#E5EAF2] pb-4">
                <DialogTitle className="text-lg font-bold text-[#102D56]">
                  {editingBarangay ? "Edit Barangay Jurisdiction" : "Add New Barangay Jurisdiction"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#718096]">
                  {editingBarangay ? "Update official jurisdiction profile, address, and contact details." : "Register a new barangay unit to activate its municipal tenant workspace."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-bold text-[#172B4D]">Barangay Name *</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Mina De Oro"
                        required
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                      {!editingBarangay && formData.name && (
                        <p className="text-[11px] text-[#246BDE]">
                          Suggested Admin Email: {generateAdminEmail(formData.name)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="municipality" className="text-xs font-bold text-[#172B4D]">Municipality *</Label>
                      <Input
                        id="municipality"
                        value={formData.municipality || ""}
                        onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                        placeholder="e.g., Bongabong"
                        required
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="province" className="text-xs font-bold text-[#172B4D]">Province *</Label>
                      <Input
                        id="province"
                        value={formData.province || ""}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        placeholder="e.g., Oriental Mindoro"
                        required
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactNumber" className="text-xs font-bold text-[#172B4D]">Official Hotline</Label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber || ""}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        placeholder="e.g., +63 912 345 6789"
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-bold text-[#172B4D]">Barangay Hall Complete Address *</Label>
                    <Input
                      id="address"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., Barangay Hall, Purok 1, Bongabong, Oriental Mindoro"
                      required
                      className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sealLogoUrl" className="text-xs font-bold text-[#172B4D]">Seal/Logo URL</Label>
                      <Input
                        id="sealLogoUrl"
                        value={formData.sealLogoUrl || ""}
                        onChange={(e) => setFormData({ ...formData, sealLogoUrl: e.target.value })}
                        placeholder="https://.../seal.png"
                        type="url"
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="barangayAdminEmail" className="text-xs font-bold text-[#172B4D]">
                        Barangay Admin Email
                        {!editingBarangay && <span className="text-[11px] text-[#10A875] ml-1">(Auto-suggested)</span>}
                        {editingBarangay && <span className="text-[11px] text-[#FFA51E] ml-1">(Display Only)</span>}
                      </Label>
                      <Input
                        id="barangayAdminEmail"
                        type="email"
                        value={formData.adminEmail || ""}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder={editingBarangay ? "Current admin email" : "Auto-generated from name"}
                        className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                      />
                    </div>
                  </div>

                  {!editingBarangay && (
                    <div className="rounded-xl border border-[#E5EAF2] bg-[#F8FAFC] p-4 space-y-3">
                      <div className="flex items-center space-x-2.5">
                        <Checkbox
                          id="createAdminAccount"
                          checked={formData.createAdminAccount}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, createAdminAccount: checked as boolean })
                          }
                          className="border-[#CBD5E1] data-[state=checked]:bg-[#246BDE]"
                        />
                        <Label htmlFor="createAdminAccount" className="cursor-pointer text-xs font-bold text-[#172B4D]">
                          Automatically Provision Barangay Administrator Account
                        </Label>
                      </div>

                      {formData.createAdminAccount && (
                        <div className="space-y-3 pl-6 pt-2 border-l-2 border-[#246BDE]">
                          <div className="space-y-1.5">
                            <Label htmlFor="adminName" className="text-xs font-semibold text-[#172B4D]">Admin Full Name *</Label>
                            <Input
                              id="adminName"
                              value={formData.adminName || ""}
                              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                              placeholder="e.g., Juan Dela Cruz"
                              required={formData.createAdminAccount}
                              className="rounded-xl bg-white border-[#E2E8F0] text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="adminPassword" className="text-xs font-semibold text-[#172B4D]">Admin Password *</Label>
                            <Input
                              id="adminPassword"
                              type="password"
                              value={formData.adminPassword || ""}
                              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                              placeholder="Minimum 6 characters"
                              required={formData.createAdminAccount}
                              minLength={6}
                              className="rounded-xl bg-white border-[#E2E8F0] text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5EAF2] flex-shrink-0 bg-white">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold">
                    {editingBarangay ? "Update Jurisdiction" : "Create Jurisdiction"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Registered LGUs</span>
            <div className="size-10 rounded-xl bg-[#2474E8] flex items-center justify-center text-white shadow-xs">
              <Building2 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{barangays.length}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Multi-Tenant Units</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Active Status</span>
            <div className="size-10 rounded-xl bg-[#10A875] flex items-center justify-center text-white shadow-xs">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{activeCount}</div>
            <p className="text-xs font-medium text-[#10A875] mt-1">Operational Jurisdictions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Assigned Admins</span>
            <div className="size-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{configuredAdminCount}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Lead Officers Enrolled</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Municipalities</span>
            <div className="size-10 rounded-xl bg-[#FFA51E] flex items-center justify-center text-white shadow-xs">
              <MapPin className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{municipalities.length}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Geographic Clusters</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
          <Input
            placeholder="Search barangay, municipality, province..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
            <SelectTrigger className="h-10 w-full sm:w-52 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs font-semibold text-[#172B4D]">
              <SelectValue placeholder="All Municipalities" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E5EAF2]">
              <SelectItem value="all">All Municipalities ({barangays.length})</SelectItem>
              {municipalities.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="h-10 rounded-xl text-xs text-[#718096] hover:text-[#102D56]"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Barangays Directory Table */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E5EAF2] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#102D56]">Barangay Roster</h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Showing {filteredBarangays.length} of {barangays.length} registered jurisdictions
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[#E5EAF2] text-[#246BDE] font-semibold text-xs px-3 py-1">
            {filteredBarangays.length} Loaded
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#718096]">
            <Building2 className="size-8 mx-auto mb-2 text-[#CBD5E1] animate-pulse" />
            Loading registered barangay jurisdictions...
          </div>
        ) : filteredBarangays.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#718096] space-y-2">
            <Building2 className="size-10 mx-auto text-[#CBD5E1]" />
            <p className="font-semibold text-[#172B4D]">No barangays found</p>
            <p className="text-xs text-[#718096]">Try adjusting your search query or municipality filter.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] border-b border-[#E5EAF2] hover:bg-[#F8FAFC]">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5 pl-6">Barangay & LGU</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Address & Hotline</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Designated Admin</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Created</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5 pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBarangays.map((barangay) => {
                const admin = barangayAdmins[barangay.id];
                const createdDate = barangay.createdAt 
                  ? new Date(barangay.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : "—";
                
                return (
                  <TableRow key={barangay.id} className="hover:bg-[#F8FAFC]/80 transition-colors border-b border-[#F0F4FA]">
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${barangay.isActive ? 'bg-[#246BDE]/10 text-[#246BDE]' : 'bg-slate-100 text-slate-400'}`}>
                          {barangay.sealLogoUrl ? (
                            <img src={barangay.sealLogoUrl} alt={barangay.name} className="size-7 rounded-full object-cover" />
                          ) : (
                            <Building2 className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#102D56]">{barangay.name}</div>
                          <div className="text-xs text-[#718096] flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 text-[#246BDE]" />
                            <span>{barangay.municipality}, {barangay.province}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <div className="text-xs">
                        <div className="font-medium text-[#172B4D] max-w-xs truncate">{barangay.address}</div>
                        {barangay.contactNumber && (
                          <div className="text-[#718096] flex items-center gap-1 mt-1">
                            <Phone className="size-3" />
                            {barangay.contactNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <div className="text-xs">
                        {admin ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#172B4D]">{admin.name}</div>
                            <div className="text-[#718096] flex items-center gap-1">
                              <Mail className="size-3 text-[#246BDE]" />
                              {admin.email}
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCreateAdminDialog(barangay)}
                            className="h-7 text-xs rounded-lg border-[#E5EAF2] text-[#246BDE] hover:bg-[#246BDE]/10"
                          >
                            <UserPlus className="size-3 mr-1" />
                            Provision Admin
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs text-[#718096]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-[#718096]" />
                        {createdDate}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <Badge
                        onClick={() => toggleActive(barangay)}
                        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
                          barangay.isActive 
                            ? "bg-[#10A875]/15 text-[#10A875] hover:bg-[#10A875]/25 border-transparent" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"
                        }`}
                      >
                        {barangay.isActive ? "● Active" : "○ Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3.5 pr-6 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Link href={`/barangays/${barangay.id}/settings`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-[#718096] hover:text-[#246BDE] hover:bg-[#F0F4FA]"
                            title="Manage Roster & Settings"
                          >
                            <Settings className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(barangay)}
                          className="size-8 rounded-lg text-[#718096] hover:text-[#246BDE] hover:bg-[#F0F4FA]"
                          title="Edit barangay details"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(barangay.id, barangay.name)}
                          className="size-8 rounded-lg text-[#718096] hover:text-[#EF4655] hover:bg-[#FEF2F2]"
                          title="Delete barangay"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Admin Credentials Dialog */}
      <Dialog open={!!createdAdminCredentials} onOpenChange={(open) => {
        if (!open) setCreatedAdminCredentials(null);
      }}>
        <DialogContent className="max-w-md rounded-2xl border-[#E5EAF2]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#102D56]">
              <ShieldCheck className="size-5 text-[#10A875]" />
              Admin Account Provisioned
            </DialogTitle>
            <DialogDescription className="text-xs text-[#718096]">
              Copy and safely store these credentials. Share them directly with the barangay administrator.
            </DialogDescription>
          </DialogHeader>
          {createdAdminCredentials && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#F8FAFC] border border-[#E5EAF2] p-4 rounded-xl space-y-2.5 text-xs">
                <div>
                  <p className="font-semibold text-[#718096]">Barangay Jurisdiction</p>
                  <p className="font-bold text-sm text-[#102D56]">{createdAdminCredentials.barangayName}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#718096]">Login Email</p>
                  <p className="font-mono font-bold text-sm text-[#246BDE]">{createdAdminCredentials.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#718096]">Temporary Password</p>
                  <p className="font-mono font-bold text-sm text-[#172B4D]">{createdAdminCredentials.password}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-[#FFA51E] bg-[#FFFBEB] p-3 rounded-xl border border-[#FDE68A]">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>This credentials card will only be displayed once. Copy them now to prevent lockout.</p>
              </div>
              <Button 
                className="w-full rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold h-10 shadow-xs" 
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Barangay: ${createdAdminCredentials.barangayName}\nEmail: ${createdAdminCredentials.email}\nPassword: ${createdAdminCredentials.password}`
                  );
                  toast({
                    title: "Copied",
                    description: "Credentials copied to clipboard",
                  });
                }}
              >
                Copy Credentials
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#E5EAF2]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#102D56]">
              <UserPlus className="size-5 text-[#246BDE]" />
              Provision Admin Account
            </DialogTitle>
            <DialogDescription className="text-xs text-[#718096]">
              Assign an administrative account for {selectedBarangayForAdmin?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="adminNameCreate" className="text-xs font-bold text-[#172B4D]">Admin Full Name *</Label>
              <Input
                id="adminNameCreate"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
                required
                className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminEmailCreate" className="text-xs font-bold text-[#172B4D]">Admin Email *</Label>
              <Input
                id="adminEmailCreate"
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                placeholder="admin@ibarangay.gov.ph"
                required
                className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminPasswordCreate" className="text-xs font-bold text-[#172B4D]">Password *</Label>
              <Input
                id="adminPasswordCreate"
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm"
              />
            </div>

            <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#BFDBFE]">
              <p className="text-xs text-[#1E40AF]">
                This will enroll a new Admin role profile bound to this jurisdiction.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateAdminDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold">
                Provision Admin
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
