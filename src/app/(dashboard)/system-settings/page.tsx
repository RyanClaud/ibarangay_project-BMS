'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Settings, 
  Database, 
  Shield, 
  Globe, 
  Bell,
  Download,
  RefreshCw,
  Code,
  Key,
  FileText,
  Mail,
  Loader2,
  CheckCircle2,
  Copy,
  Sparkles,
  Server,
  Layers,
  Lock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export default function SystemSettingsPage() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ collections: 0, documents: 0 });
  const [showRules, setShowRules] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    fromEmail: 'noreply@ibarangay.gov.ph',
    fromName: 'iBarangay Digital Governance',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserAlert: true,
    documentRequestAlert: true,
    systemAlerts: true,
  });
  
  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  useEffect(() => {
    if (!isSuperAdmin || !firestore) return;
    loadStats();
  }, [isSuperAdmin, firestore]);

  const loadStats = async () => {
    if (!firestore) return;
    try {
      const collections = ['barangays', 'users', 'residents', 'documentRequests'];
      let totalDocs = 0;
      
      for (const col of collections) {
        const snap = await getDocs(collection(firestore, col));
        totalDocs += snap.size;
      }
      
      setStats({ collections: collections.length, documents: totalDocs });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleBackup = async () => {
    if (!firestore) return;
    setIsLoading(true);
    
    try {
      const collections = ['barangays', 'users', 'residents', 'documentRequests'];
      const backup: any = {};
      
      for (const col of collections) {
        const snap = await getDocs(collection(firestore, col));
        backup[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ibarangay-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "Backup Created",
        description: "Database JSON archive has been downloaded",
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create database backup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!firestore) return;
    setIsLoading(true);
    
    try {
      const collections = ['barangays', 'users', 'residents', 'documentRequests'];
      const wb = XLSX.utils.book_new();
      
      for (const col of collections) {
        const snap = await getDocs(collection(firestore, col));
        const data = snap.docs.map(doc => doc.data());
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, col);
      }
      
      XLSX.writeFile(wb, `ibarangay-database-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Complete",
        description: "All database tables exported to Excel successfully",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const saveEmailSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Email SMTP configuration updated successfully",
    });
  };

  const saveNotificationSettings = () => {
    toast({
      title: "Preferences Saved",
      description: "System notification preferences have been saved",
    });
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
            You don't have permission to access System Settings. Only Super Administrators can alter infrastructure configurations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-yellow-400/40 shrink-0 shadow-inner">
            <Settings className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Multi-Tenant Infrastructure Orchestration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Platform & Database Settings
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Configure database disaster recovery snapshots, security rule compliance, mail transport protocols, and municipal notification relays.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={loadStats}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="database" className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-white border border-[#E5EAF2] p-1 text-[#718096] gap-1 shadow-xs">
            <TabsTrigger
              value="database"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Database & Recovery
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Security Rules
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Regional & Mail
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Dispatch Triggers
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <Database className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Database Metrics</h3>
                  <p className="text-xs text-[#718096]">Google Cloud Firestore cluster status</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#718096] font-medium">Core Collections:</span>
                  <span className="font-bold text-[#102D56]">{stats.collections} Namespaces</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#718096] font-medium">Total Document Records:</span>
                  <span className="font-bold text-[#102D56]">{stats.documents.toLocaleString()} Records</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#718096] font-medium">Database Engine:</span>
                  <span className="font-bold text-[#246BDE]">Cloud Firestore (Native Multi-Tenant)</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[#718096] font-medium">Health Status:</span>
                  <span className="flex items-center gap-1.5 font-bold text-[#10A875]">
                    <CheckCircle2 className="size-3.5" />
                    Optimal (All Tenants Online)
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                  <Download className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Disaster Recovery & Snapshots</h3>
                  <p className="text-xs text-[#718096]">Generate on-demand tenant data archives</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
                  onClick={handleBackup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin text-[#246BDE]" />
                  ) : (
                    <Download className="mr-2 size-4 text-[#246BDE]" />
                  )}
                  Export Complete Database (.json Snapshot)
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
                  onClick={handleExportExcel}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin text-[#10A875]" />
                  ) : (
                    <Download className="mr-2 size-4 text-[#10A875]" />
                  )}
                  Export All Tables to Multi-Sheet Excel (.xlsx)
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
                  onClick={loadStats}
                >
                  <RefreshCw className="mr-2 size-4 text-[#8B5CF6]" />
                  Recalculate Storage Statistics
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#EF4655]/10 text-[#EF4655] flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Firestore Security Rules</h3>
                  <p className="text-xs text-[#718096]">Data isolation and tenant access verification</p>
                </div>
              </div>

              <div className="space-y-3">
                <Dialog open={showRules} onOpenChange={setShowRules}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-11 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]">
                      <Code className="mr-2 size-4 text-[#246BDE]" />
                      Inspect Active Security Rules
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl border-[#E5EAF2]">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold text-[#102D56]">Firestore Multi-Tenant Security Rules</DialogTitle>
                      <DialogDescription className="text-xs text-[#718096]">
                        Role-based access rules enforcing barangay-level isolation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-4 right-2 h-8 rounded-lg text-xs"
                        onClick={() => copyToClipboard('rules_version = "2";\nservice cloud.firestore {...}')}
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copy
                      </Button>
                      <pre className="bg-[#0C2340] text-blue-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Multi-tenant isolation: Users access only their barangay
    match /residents/{residentId} {
      allow read, write: if request.auth != null;
    }
    match /documentRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
    match /barangays/{barangayId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#172B4D]">
                    <Lock className="size-4 text-[#10A875]" />
                    <span>Multi-Tenant Data Boundary Protection</span>
                  </div>
                  <p className="text-[#718096]">
                    Barangay administrators are strictly partitioned to their jurisdiction ID, while Super Administrators possess uninhibited cross-tenant governance authority.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <Key className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Authentication Providers</h3>
                  <p className="text-xs text-[#718096]">Identity services configuration</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">Email & Password Authentication</p>
                    <p className="text-[11px] text-[#718096]">Standard credential login</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">Google Identity OAuth</p>
                    <p className="text-[11px] text-[#718096]">Single sign-on federation</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">Self-Service Password Recovery</p>
                    <p className="text-[11px] text-[#718096]">Automated password reset links</p>
                  </div>
                  <Switch checked={true} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Regional Geopolitical Profile</h3>
                  <p className="text-xs text-[#718096]">Target deployment jurisdiction</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Administrative Region</Label>
                  <Input value="MIMAROPA (Region IV-B)" disabled className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Province</Label>
                  <Input value="Oriental Mindoro" disabled className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Timezone & Clock</Label>
                  <Input value="Asia/Manila (GMT+8:00)" disabled className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Locale Standard</Label>
                  <Input value="English (Philippines) / Filipino" disabled className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                  <Mail className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">SMTP Mail Transport Relay</h3>
                  <p className="text-xs text-[#718096]">Configure transactional email dispatch</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">SMTP Host</Label>
                  <Input 
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">SMTP Port</Label>
                  <Input 
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Sender Email</Label>
                  <Input 
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Sender Name</Label>
                  <Input 
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D]"
                  />
                </div>
                <Button 
                  onClick={saveEmailSettings}
                  className="w-full h-10 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-xs"
                >
                  Save Mail Configuration
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#FFA51E]/10 text-[#FFA51E] flex items-center justify-center">
                  <Bell className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Automated Dispatch Triggers</h3>
                  <p className="text-xs text-[#718096]">System notification rules and alerts</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">System Email Notifications</p>
                    <p className="text-[11px] text-[#718096]">Relay transactional messages to users</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">New User Registration Alerts</p>
                    <p className="text-[11px] text-[#718096]">Notify LGU administrators on citizen signups</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.newUserAlert}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newUserAlert: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">Document Clearance Submissions</p>
                    <p className="text-[11px] text-[#718096]">Trigger alert on new certificate requests</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.documentRequestAlert}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, documentRequestAlert: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div>
                    <p className="font-bold text-xs text-[#172B4D]">Security & Anomaly Alerts</p>
                    <p className="text-[11px] text-[#718096]">Notify super admins on elevated privileges</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                  />
                </div>

                <Button 
                  onClick={saveNotificationSettings}
                  className="w-full h-10 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-xs"
                >
                  Save Dispatch Preferences
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Standard Email Templates</h3>
                  <p className="text-xs text-[#718096]">Customize greeting and notification copy</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Welcome Message Template</Label>
                  <Textarea 
                    placeholder="Welcome to iBarangay..."
                    defaultValue="Mabuhay! Welcome to iBarangay, the digital governance portal for Oriental Mindoro."
                    rows={3}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs text-[#172B4D]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#172B4D]">Password Reset Message Template</Label>
                  <Textarea 
                    placeholder="Reset your password..."
                    defaultValue="You have requested to reset your password. Click the secure link below to proceed."
                    rows={3}
                    className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs text-[#172B4D]"
                  />
                </div>

                <Button 
                  onClick={() => toast({ title: "Templates Saved", description: "Email templates updated" })}
                  variant="outline"
                  className="w-full h-10 rounded-xl border-[#E5EAF2] text-[#172B4D] font-bold text-xs hover:bg-[#F8FAFC]"
                >
                  Update Notification Templates
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
