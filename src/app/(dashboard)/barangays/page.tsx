"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building2, Mail, AlertCircle, Upload, UserPlus, MapPin } from "lucide-react";
import type { Barangay } from "@/lib/types";
import { generateBarangayId, validateBarangay, formatBarangayName } from "@/lib/barangay-utils";

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
  const municipalities = Array.from(new Set(barangays.map(b => b.municipality))).sort();
  
  // Filter barangays based on search query and selected municipality
  const filteredBarangays = barangays.filter(barangay => {
    const matchesSearch = barangay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barangay.municipality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barangay.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barangay.address.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        // Find admins (not super admins) for each barangay
        if (userData.role === "Admin" && !userData.isSuperAdmin && userData.barangayId) {
          adminsMap[userData.barangayId] = {
            email: userData.email || "N/A",
            name: userData.name || "N/A"
          };
        }
      });
      
      console.log('Loaded admins:', adminsMap); // Debug log
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

    // Validate admin account fields if creating admin
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
        // Update existing barangay
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

        // Check if admin email changed
        const currentAdmin = barangayAdmins[editingBarangay.id];
        if (currentAdmin && formData.adminEmail && formData.adminEmail !== currentAdmin.email) {
          toast({
            title: "Important Notice",
            description: "Email changes only update the display. To change login email, you must update it in Firebase Console → Authentication → Users, or delete and recreate the admin account.",
            variant: "destructive",
          });
          
          try {
            // Find and update the admin user document (for display purposes only)
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
        // Create new barangay
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
        
        // Create admin account if requested
        if (formData.createAdminAccount) {
          try {
            // Create a secondary Firebase app instance to avoid signing out the super admin
            const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
            const secondaryAuth = initializeAuth(secondaryApp, {
              persistence: browserLocalPersistence
            });
            
            // Create new admin user in the secondary app (won't affect current session)
            const userCredential = await createUserWithEmailAndPassword(
              secondaryAuth,
              formData.adminEmail,
              formData.adminPassword
            );

            // Create user document in Firestore
            await setDoc(doc(firestore, "users", userCredential.user.uid), {
              id: userCredential.user.uid,
              name: formData.adminName,
              email: formData.adminEmail,
              role: "Admin",
              barangayId: barangayDoc.id,
              avatarUrl: "",
              isSuperAdmin: false,
            });

            // Delete the secondary app to clean up
            await deleteApp(secondaryApp);

            // Show credentials to super admin
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
    
    // Get the admin email for this barangay
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

  const handleDelete = async (barangayId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to delete this barangay? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(firestore, "barangays", barangayId));
      toast({
        title: "Success",
        description: "Barangay deleted successfully",
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

  // Generate email from barangay name
  const generateAdminEmail = (barangayName: string) => {
    if (!barangayName) return "";
    
    // Remove special characters, convert to lowercase, remove spaces
    const cleanName = barangayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '') // Remove spaces
      .replace(/^barangay/i, ''); // Remove "barangay" prefix if exists
    
    return `admin@ibarangay${cleanName}.com`;
  };

  // Handle barangay name change and auto-generate email
  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      // Only auto-generate email when creating new barangay
      adminEmail: editingBarangay ? formData.adminEmail : generateAdminEmail(name)
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedBarangayForAdmin) return;

    try {
      // Create a secondary Firebase app instance
      const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
      const secondaryAuth = initializeAuth(secondaryApp, {
        persistence: browserLocalPersistence
      });
      
      // Create admin user
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        adminFormData.email,
        adminFormData.password
      );

      // Create user document
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        id: userCredential.user.uid,
        name: adminFormData.name,
        email: adminFormData.email,
        role: "Admin",
        barangayId: selectedBarangayForAdmin.id,
        avatarUrl: "",
        isSuperAdmin: false,
      });

      // Clean up secondary app
      await deleteApp(secondaryApp);

      toast({
        title: "Success",
        description: "Admin account created successfully",
      });

      setCreateAdminDialogOpen(false);
      setAdminFormData({ name: "", email: "", password: "" });
      setSelectedBarangayForAdmin(null);
      loadBarangays(); // Refresh the list
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Barangay Management</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don't have permission to access this page. Only super administrators can manage barangays.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Barangay Management</h1>
          <p className="text-muted-foreground">Manage multiple barangays in the system</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/barangays/bulk-create'}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Barangay
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{editingBarangay ? "Edit Barangay" : "Add New Barangay"}</DialogTitle>
              <DialogDescription>
                {editingBarangay ? "Update barangay information" : "Create a new barangay in the system"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Barangay Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Mina De Oro"
                    required
                  />
                  {!editingBarangay && formData.name && (
                    <p className="text-xs text-muted-foreground">
                      Email will be: {generateAdminEmail(formData.name)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality *</Label>
                  <Input
                    id="municipality"
                    value={formData.municipality || ""}
                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    placeholder="e.g., Bongabong"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={formData.province || ""}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g., Oriental Mindoro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber || ""}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="e.g., +63 123 456 7890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Complete Address *</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sealLogoUrl">Seal/Logo URL</Label>
                  <Input
                    id="sealLogoUrl"
                    value={formData.sealLogoUrl || ""}
                    onChange={(e) => setFormData({ ...formData, sealLogoUrl: e.target.value })}
                    placeholder="https://example.com/seal.png"
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangayAdminEmail">
                    Barangay Admin Email
                    {!editingBarangay && <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>}
                    {editingBarangay && <span className="text-xs text-amber-600 ml-1">(Display Only)</span>}
                  </Label>
                  <Input
                    id="barangayAdminEmail"
                    type="email"
                    value={formData.adminEmail || ""}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder={editingBarangay ? "Current admin email" : "Will be auto-generated from barangay name"}
                  />
                  {!editingBarangay ? (
                    <p className="text-xs text-muted-foreground">
                      Auto-generated based on barangay name. You can edit if needed.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-600">
                        ⚠️ This only updates the display email, not the login email.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        To change login email: Go to Firebase Console → Authentication → Users → Edit user email, OR delete and recreate the admin account.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!editingBarangay && (
                <>
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createAdminAccount"
                        checked={formData.createAdminAccount}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, createAdminAccount: checked as boolean })
                        }
                      />
                      <Label htmlFor="createAdminAccount" className="cursor-pointer">
                        Create Barangay Admin Account
                      </Label>
                    </div>

                    {formData.createAdminAccount && (
                      <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p>An admin account will be created using the email above. Save the credentials to share with the admin.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="adminName">Admin Name *</Label>
                          <Input
                            id="adminName"
                            value={formData.adminName || ""}
                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                            placeholder="e.g., Juan Dela Cruz"
                            required={formData.createAdminAccount}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="adminPassword">Admin Password *</Label>
                          <Input
                            id="adminPassword"
                            type="password"
                            value={formData.adminPassword || ""}
                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                            placeholder="Minimum 6 characters"
                            required={formData.createAdminAccount}
                            minLength={6}
                          />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Email:</strong> {formData.adminEmail || "Please enter email above"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBarangay ? "Update" : "Create"} Barangay
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Admin Credentials Dialog */}
      <Dialog open={!!createdAdminCredentials} onOpenChange={(open) => {
        if (!open) setCreatedAdminCredentials(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Admin Account Created
            </DialogTitle>
            <DialogDescription>
              Save these credentials and share them with the barangay admin
            </DialogDescription>
          </DialogHeader>
          {createdAdminCredentials && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barangay</p>
                  <p className="font-semibold">{createdAdminCredentials.barangayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{createdAdminCredentials.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Password</p>
                  <p className="font-mono text-sm">{createdAdminCredentials.password}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Make sure to save these credentials. They won't be shown again.</p>
              </div>
              <Button 
                className="w-full" 
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create Admin Account
            </DialogTitle>
            <DialogDescription>
              Create an admin account for {selectedBarangayForAdmin?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNameCreate">Admin Name *</Label>
              <Input
                id="adminNameCreate"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmailCreate">Admin Email *</Label>
              <Input
                id="adminEmailCreate"
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                placeholder="admin@barangay.gov.ph"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPasswordCreate">Admin Password *</Label>
              <Input
                id="adminPasswordCreate"
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This will create a new admin account for this barangay. Save the credentials to share with the admin.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Admin Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-t-4 border-t-blue-500 hover:shadow-xl transition-all">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">All Barangays</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-semibold">
                    {barangays.length} total
                  </Badge>
                  {searchQuery && (
                    <Badge variant="outline" className="font-semibold">
                      {filteredBarangays.length} matching
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search barangays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-72 transition-all"
              />
              <svg
                className="absolute left-3 top-3 h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading barangays...</p>
          ) : filteredBarangays.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'No barangays found matching your search.' 
                  : 'No barangays found. Create one to get started.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                  <TableRow key={barangay.id} className="hover:bg-accent/50 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${barangay.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <Building2 className={`h-5 w-5 ${barangay.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-base group-hover:text-primary transition-colors">{barangay.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{barangay.municipality}, {barangay.province}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{barangay.address}</div>
                        {barangay.contactNumber && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {barangay.contactNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {admin ? (
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {admin.email}
                            </div>
                            <div className="text-xs text-muted-foreground">{admin.name}</div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">No admin assigned</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreateAdminDialog(barangay)}
                              className="h-8 text-xs w-fit"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Create Admin
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {createdDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={barangay.isActive ? "default" : "secondary"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleActive(barangay)}
                      >
                        {barangay.isActive ? "✓ Active" : "○ Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(barangay)}
                          className="hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit barangay"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(barangay.id)}
                          className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete barangay"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
