'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  FileText, 
  Download, 
  Building2, 
  FileSpreadsheet, 
  Loader2, 
  RefreshCw, 
  Users, 
  FileCheck, 
  Clock, 
  TrendingUp, 
  Sparkles,
  Layers,
  CheckCircle2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Barangay, User, Resident, DocumentRequest } from "@/lib/types";
import * as XLSX from 'xlsx';

export default function SystemReportsPage() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('summary');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveStats, setLiveStats] = useState({
    totalBarangays: 0,
    totalUsers: 0,
    totalResidents: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    todayRequests: 0,
  });
  
  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  useEffect(() => {
    if (!isSuperAdmin || !firestore) return;
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isSuperAdmin, firestore]);

  const loadData = async () => {
    if (!firestore) return;
    try {
      await Promise.all([loadBarangays(), loadLiveStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadBarangays = async () => {
    if (!firestore) return;
    try {
      const snap = await getDocs(collection(firestore, 'barangays'));
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Barangay));
      setBarangays(data);
    } catch (error) {
      console.error('Error loading barangays:', error);
    }
  };

  const loadLiveStats = async () => {
    if (!firestore) return;
    setIsLoadingStats(true);
    try {
      const [barangaysSnap, usersSnap, residentsSnap, requestsSnap] = await Promise.all([
        getDocs(collection(firestore, 'barangays')),
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'residents')),
        getDocs(collection(firestore, 'documentRequests')),
      ]);

      const requests = requestsSnap.docs.map(doc => doc.data() as DocumentRequest);
      const today = new Date().toISOString().split('T')[0];
      const todayRequests = requests.filter(r => r.requestDate?.startsWith(today));

      setLiveStats({
        totalBarangays: barangaysSnap.size,
        totalUsers: usersSnap.size,
        totalResidents: residentsSnap.size,
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'Pending').length,
        completedRequests: requests.filter(r => r.status === 'Released').length,
        todayRequests: todayRequests.length,
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading live stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const generateExcelReport = async () => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      const [usersSnap, residentsSnap, requestsSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'residents')),
        getDocs(collection(firestore, 'documentRequests')),
      ]);

      const users = usersSnap.docs.map(doc => doc.data());
      const residents = residentsSnap.docs.map(doc => doc.data());
      const requests = requestsSnap.docs.map(doc => doc.data());

      const filteredUsers = selectedBarangay === 'all' ? users : users.filter((u: any) => u.barangayId === selectedBarangay);
      const filteredResidents = selectedBarangay === 'all' ? residents : residents.filter((r: any) => r.barangayId === selectedBarangay);
      const filteredRequests = selectedBarangay === 'all' ? requests : requests.filter((r: any) => r.barangayId === selectedBarangay);

      const wb = XLSX.utils.book_new();

      if (reportType === 'summary' || reportType === 'all') {
        const summaryData = barangays.map(b => ({
          'Barangay': b.name,
          'Municipality': b.municipality,
          'Province': b.province,
          'Active': b.isActive ? 'Yes' : 'No',
          'Total Users': users.filter((u: any) => u.barangayId === b.id).length,
          'Total Residents': residents.filter((r: any) => r.barangayId === b.id).length,
          'Total Requests': requests.filter((r: any) => r.barangayId === b.id).length,
          'Pending': requests.filter((r: any) => r.barangayId === b.id && r.status === 'Pending').length,
          'Completed': requests.filter((r: any) => r.barangayId === b.id && r.status === 'Released').length,
        }));
        const ws = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      }

      if (reportType === 'residents' || reportType === 'all') {
        const residentData = filteredResidents.map((r: any) => ({
          'Barangay': barangays.find(b => b.id === r.barangayId)?.name || r.barangayId,
          'First Name': r.firstName,
          'Last Name': r.lastName,
          'Email': r.email,
          'Purok': r.purok,
          'Household Number': r.householdNumber,
          'Birthdate': r.birthdate,
        }));
        const ws = XLSX.utils.json_to_sheet(residentData);
        XLSX.utils.book_append_sheet(wb, ws, 'Residents');
      }

      if (reportType === 'requests' || reportType === 'all') {
        const requestData = filteredRequests.map((r: any) => ({
          'Barangay': barangays.find(b => b.id === r.barangayId)?.name || r.barangayId,
          'Tracking Number': r.trackingNumber,
          'Resident': r.residentName,
          'Document Type': r.documentType,
          'Status': r.status,
          'Request Date': r.requestDate,
          'Amount': r.amount,
        }));
        const ws = XLSX.utils.json_to_sheet(requestData);
        XLSX.utils.book_append_sheet(wb, ws, 'Requests');
      }

      const fileName = `iBarangay_Audit_Report_${selectedBarangay}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Report Generated",
        description: `${fileName} has been exported to your downloads`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            You don't have permission to access System Reports. Only Super Administrators can export multi-barangay data workbooks.
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
            <FileSpreadsheet className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Multi-Barangay Institutional Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              System Audit & Export Reports
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Compile cross-barangay demographic census registers, document clearance audit logs, and municipal summaries in standard Excel format.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Badge variant="outline" className="rounded-xl border-white/20 bg-white/10 text-white text-xs px-3 py-1.5 backdrop-blur-xs">
            <Clock className="size-3 mr-1.5 text-yellow-400" />
            {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoadingStats}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs"
          >
            <RefreshCw className={`size-3.5 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Jurisdictions</span>
            <div className="size-10 rounded-xl bg-[#2474E8] flex items-center justify-center text-white shadow-xs">
              <Building2 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{liveStats.totalBarangays}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Active Multi-Tenant Units</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Enrolled Residents</span>
            <div className="size-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{liveStats.totalResidents.toLocaleString()}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">{liveStats.totalUsers} Portal Users</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Clearance Logs</span>
            <div className="size-10 rounded-xl bg-[#10A875] flex items-center justify-center text-white shadow-xs">
              <FileCheck className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{liveStats.totalRequests.toLocaleString()}</div>
            <p className="text-xs font-medium text-[#10A875] mt-1">{liveStats.completedRequests} Released Overall</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Today's Activity</span>
            <div className="size-10 rounded-xl bg-[#FFA51E] flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{liveStats.todayRequests}</div>
            <p className="text-xs font-medium text-[#FFA51E] mt-1">{liveStats.pendingRequests} Awaiting Action</p>
          </div>
        </div>
      </div>

      {/* Generator & Quick Actions Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs md:col-span-2 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAF2]">
            <div className="size-10 rounded-xl bg-[#2474E8]/10 text-[#246BDE] flex items-center justify-center">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102D56]">Generate Audit Workbook</h2>
              <p className="text-xs text-[#718096]">Select workbook scope and export directly to Microsoft Excel (.xlsx)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#172B4D]">Report Category</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5EAF2]">
                  <SelectItem value="summary">Municipal Summary Roster</SelectItem>
                  <SelectItem value="residents">Demographic Citizen Registry</SelectItem>
                  <SelectItem value="requests">Document Clearance Logs</SelectItem>
                  <SelectItem value="all">Complete Master Workbook (All Sheets)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#172B4D]">Barangay Tenant Scope</Label>
              <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5EAF2]">
                  <SelectItem value="all">All Barangays ({barangays.length} Units)</SelectItem>
                  {barangays.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={generateExcelReport} 
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold shadow-xs text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Compiling Excel Sheets...
                </>
              ) : (
                <>
                  <Download className="mr-2 size-4" />
                  Generate & Download Excel Workbook
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Report Presets */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
            <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
              <FileCheck className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102D56]">Instant Presets</h2>
              <p className="text-[11px] text-[#718096]">Quick multi-barangay downloads</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start h-10 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
              onClick={() => {
                setReportType('summary');
                setSelectedBarangay('all');
                setTimeout(() => generateExcelReport(), 100);
              }}
            >
              <FileSpreadsheet className="mr-2 size-4 text-[#246BDE]" />
              Multi-LGU Executive Summary
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-10 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
              onClick={() => {
                setReportType('residents');
                setSelectedBarangay('all');
                setTimeout(() => generateExcelReport(), 100);
              }}
            >
              <Users className="mr-2 size-4 text-[#8B5CF6]" />
              Consolidated Citizen Registry
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-10 rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC]"
              onClick={() => {
                setReportType('requests');
                setSelectedBarangay('all');
                setTimeout(() => generateExcelReport(), 100);
              }}
            >
              <FileCheck className="mr-2 size-4 text-[#10A875]" />
              Clearance Transaction Ledger
            </Button>
          </div>
        </div>
      </div>

      {/* Information & Schema Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
            <div className="size-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
              <Layers className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102D56]">Export Schema & Formats</h3>
              <p className="text-xs text-[#718096]">Structure of generated Excel files</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-[#E5EAF2] p-3.5 bg-[#F8FAFC]">
              <p className="font-bold text-[#102D56] flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5 text-[#246BDE]" />
                Summary Sheet
              </p>
              <p className="text-[#718096] mt-0.5">Barangay-by-barangay metric comparison with enrolled users, census count, clearance velocity, and fulfillment index.</p>
            </div>

            <div className="rounded-xl border border-[#E5EAF2] p-3.5 bg-[#F8FAFC]">
              <p className="font-bold text-[#102D56] flex items-center gap-1.5">
                <Users className="size-3.5 text-[#8B5CF6]" />
                Residents Directory Sheet
              </p>
              <p className="text-[#718096] mt-0.5">Citizen identification, address details, purok assignment, household number, and demographic records.</p>
            </div>

            <div className="rounded-xl border border-[#E5EAF2] p-3.5 bg-[#F8FAFC]">
              <p className="font-bold text-[#102D56] flex items-center gap-1.5">
                <FileCheck className="size-3.5 text-[#10A875]" />
                Clearance Ledger Sheet
              </p>
              <p className="text-[#718096] mt-0.5">Tracking codes, request timestamps, document types, release approvals, and statutory fee assessments.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
            <div className="size-9 rounded-xl bg-[#FFA51E]/10 text-[#FFA51E] flex items-center justify-center">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102D56]">Fulfillment Telemetry</h3>
              <p className="text-xs text-[#718096]">Live queue status across all barangays</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#FFA51E]" />
                <span className="text-xs font-bold text-[#172B4D]">Pending Review</span>
              </div>
              <Badge className="bg-[#FFA51E]/15 text-[#FFA51E] border-0 text-xs font-bold px-2.5 py-1">
                {liveStats.pendingRequests} Requests
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-[#10A875]" />
                <span className="text-xs font-bold text-[#172B4D]">Released Today</span>
              </div>
              <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-xs font-bold px-2.5 py-1">
                {liveStats.todayRequests} Clearances
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#246BDE]" />
                <span className="text-xs font-bold text-[#172B4D]">Overall Release Ratio</span>
              </div>
              <Badge className="bg-[#246BDE]/15 text-[#246BDE] border-0 text-xs font-bold px-2.5 py-1">
                {liveStats.totalRequests > 0 
                  ? Math.round((liveStats.completedRequests / liveStats.totalRequests) * 100)
                  : 0}%
              </Badge>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-[#718096]">
                Automatic background synchronization active • Interval 30s
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
