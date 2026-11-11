'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Shield,
  Settings,
  Database,
  Globe,
  Upload,
  Search,
  ArrowUpRight,
  UserCog,
  ShieldCheck,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Barangay, User, Resident, DocumentRequest } from "@/lib/types";

interface BarangayStats {
  id: string;
  name: string;
  municipality?: string;
  province?: string;
  totalUsers: number;
  totalResidents: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  releasedRequests: number;
  isActive: boolean;
}

export default function SuperAdminDashboard() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [barangayStats, setBarangayStats] = useState<BarangayStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemStats, setSystemStats] = useState({
    totalBarangays: 0,
    activeBarangays: 0,
    totalUsers: 0,
    totalResidents: 0,
    totalRequests: 0,
    pendingRequests: 0,
  });

  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  const filteredBarangayStats = barangayStats.filter(stat => 
    stat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stat.municipality && stat.municipality.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (!isSuperAdmin || !firestore) return;
    loadDashboardData();
  }, [isSuperAdmin, firestore]);

  const loadDashboardData = async () => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      // Load all barangays
      const barangaysSnap = await getDocs(collection(firestore, 'barangays'));
      const barangaysData = barangaysSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Barangay));
      setBarangays(barangaysData);

      // Load all users
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const allUsers = usersSnap.docs.map(doc => doc.data() as User);

      // Load all residents
      const residentsSnap = await getDocs(collection(firestore, 'residents'));
      const allResidents = residentsSnap.docs.map(doc => doc.data() as Resident);

      // Load all document requests
      const requestsSnap = await getDocs(collection(firestore, 'documentRequests'));
      const allRequests = requestsSnap.docs.map(doc => doc.data() as DocumentRequest);

      // Calculate stats per barangay
      const stats: BarangayStats[] = barangaysData.map(barangay => {
        const barangayUsers = allUsers.filter(u => u.barangayId === barangay.id);
        const barangayResidents = allResidents.filter(r => r.barangayId === barangay.id);
        const barangayRequests = allRequests.filter(r => r.barangayId === barangay.id);

        return {
          id: barangay.id,
          name: barangay.name,
          municipality: barangay.municipality,
          province: barangay.province,
          totalUsers: barangayUsers.length,
          totalResidents: barangayResidents.length,
          totalRequests: barangayRequests.length,
          pendingRequests: barangayRequests.filter(r => r.status === 'Pending').length,
          approvedRequests: barangayRequests.filter(r => r.status === 'Approved').length,
          releasedRequests: barangayRequests.filter(r => r.status === 'Released').length,
          isActive: barangay.isActive ?? true,
        };
      });
      setBarangayStats(stats);

      // Calculate system-wide stats
      setSystemStats({
        totalBarangays: barangaysData.length,
        activeBarangays: barangaysData.filter(b => b.isActive !== false).length,
        totalUsers: allUsers.length,
        totalResidents: allResidents.length,
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(r => r.status === 'Pending').length,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
            This module is reserved for authorized Super Administrators with multi-barangay municipal oversight privileges.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="rounded-xl bg-[#246BDE] text-white">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Skeleton Header */}
        <div className="rounded-2xl bg-slate-200 h-44 animate-pulse" />
        {/* Skeleton KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-[#E5EAF2]" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Barangays',
      value: systemStats.totalBarangays.toString(),
      subtext: `${systemStats.activeBarangays} Active LGUs`,
      icon: Building2,
      iconBg: 'bg-[#2474E8]',
      trend: 'Multi-Tenant Network',
      trendColor: 'text-[#2474E8]',
    },
    {
      title: 'Platform Users',
      value: systemStats.totalUsers.toLocaleString(),
      subtext: 'Staff & Admin Accounts',
      icon: Users,
      iconBg: 'bg-[#8B5CF6]',
      trend: 'All Roles Enrolled',
      trendColor: 'text-[#8B5CF6]',
    },
    {
      title: 'Total Residents',
      value: systemStats.totalResidents.toLocaleString(),
      subtext: 'Verified Profiling Records',
      icon: ShieldCheck,
      iconBg: 'bg-[#10A875]',
      trend: 'Citizen Directory',
      trendColor: 'text-[#10A875]',
    },
    {
      title: 'Document Transactions',
      value: systemStats.totalRequests.toLocaleString(),
      subtext: `${systemStats.pendingRequests} Pending Review`,
      icon: FileText,
      iconBg: 'bg-[#FFA51E]',
      trend: systemStats.pendingRequests > 0 ? `${systemStats.pendingRequests} Needs Action` : 'All Processed',
      trendColor: systemStats.pendingRequests > 0 ? 'text-[#FFA51E]' : 'text-[#10A875]',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Super Admin Executive Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-yellow-400/40 shrink-0 shadow-inner">
            <Shield className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Super Administrator Command • Region IV-B</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              iBarangay Multi-Barangay Administration
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Centralized municipal platform oversight, cross-barangay demographic analytics, and institutional database administration.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Button
            onClick={() => router.push('/barangays')}
            className="rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white text-xs sm:text-sm font-semibold h-10 px-4 shadow-sm"
          >
            <Building2 className="mr-2 size-4" />
            <span>Manage Barangays</span>
          </Button>
          <Button
            onClick={() => router.push('/system-analytics')}
            variant="outline"
            className="rounded-xl bg-white/10 border-white/20 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold h-10 px-4"
          >
            <BarChart3 className="mr-2 size-4 text-blue-200" />
            <span>Analytics</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-13 items-center justify-center rounded-2xl text-white shadow-xs shrink-0 ${kpi.iconBg}`}
                >
                  <Icon className="size-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-[#718096] truncate">
                    {kpi.title}
                  </p>
                  <h3 className="text-2xl font-bold text-[#172B4D] tracking-tight">
                    {kpi.value}
                  </h3>
                  <p className={`text-[11px] font-semibold ${kpi.trendColor}`}>
                    {kpi.subtext}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-white border border-[#E5EAF2] rounded-xl p-1 grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 shadow-xs">
          <TabsTrigger
            value="overview"
            className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            Overview &amp; Health
          </TabsTrigger>
          <TabsTrigger
            value="barangays"
            className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            Barangay Directory
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            Municipal Trends
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-[#246BDE] data-[state=active]:text-white"
          >
            Platform Specs
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: OVERVIEW & HEALTH ── */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 cols: Barangay Performance Roster */}
            <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
                        Barangay Operations &amp; Adoption
                      </h2>
                      <p className="text-xs text-[#718096]">
                        Operational metrics for registered LGUs
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/barangays"
                    className="text-xs sm:text-sm font-semibold text-[#246BDE] hover:underline flex items-center gap-1"
                  >
                    View All LGUs →
                  </Link>
                </div>

                <div className="divide-y divide-[#F1F5F9] pt-1">
                  {barangayStats.length === 0 ? (
                    <div className="text-center py-10 text-[#718096]">
                      <Building2 className="size-10 mx-auto mb-2 text-[#CBD5E1]" />
                      <p className="text-xs font-medium">No barangays enrolled yet.</p>
                    </div>
                  ) : (
                    barangayStats.slice(0, 5).map((stat) => {
                      const completion = stat.totalRequests > 0
                        ? Math.round(((stat.totalRequests - stat.pendingRequests) / stat.totalRequests) * 100)
                        : 100;
                      return (
                        <div
                          key={stat.id}
                          onClick={() => router.push('/barangays')}
                          className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer gap-3 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE] shrink-0 font-bold text-xs border border-[#BFDBFE]">
                              {stat.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-[#172B4D] group-hover:text-[#246BDE] transition-colors">
                                  {stat.name}
                                </h4>
                                <Badge
                                  className={
                                    stat.isActive
                                      ? 'bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold'
                                      : 'bg-[#718096]/15 text-[#718096] border-0 text-[10px]'
                                  }
                                >
                                  {stat.isActive ? 'Active LGU' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#718096] mt-0.5">
                                {stat.totalResidents.toLocaleString()} residents • {stat.totalUsers} staff accounts
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 self-end sm:self-center shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-[#172B4D]">{stat.totalRequests} reqs</p>
                              <p className="text-[11px] text-[#FFA51E] font-medium">{stat.pendingRequests} pending</p>
                            </div>
                            <div className="text-right min-w-[55px]">
                              <p className="text-xs font-bold text-[#10A875]">{completion}%</p>
                              <p className="text-[11px] text-[#718096]">Clear rate</p>
                            </div>
                            <ChevronRight className="size-4 text-[#CBD5E1] group-hover:text-[#246BDE] transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {barangayStats.length > 5 && (
                <div className="pt-3 border-t border-[#E5EAF2]">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/barangays')}
                    className="w-full rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F8FAFC] h-9"
                  >
                    View All {barangayStats.length} Barangays
                  </Button>
                </div>
              )}
            </div>

            {/* Right 5 cols: Actions & Health */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              {/* Quick Actions Card */}
              <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172B4D]">Platform Utilities</h3>
                    <p className="text-xs text-[#718096]">Rapid administrative navigation</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/barangays/import')}
                    className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F0F6FF] hover:border-[#BFDBFE] hover:text-[#246BDE] h-10 transition-colors"
                  >
                    <Upload className="mr-2.5 size-4 text-[#246BDE]" />
                    <span>Import Barangays via CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/system-users')}
                    className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F0F6FF] hover:border-[#BFDBFE] hover:text-[#246BDE] h-10 transition-colors"
                  >
                    <Users className="mr-2.5 size-4 text-[#8B5CF6]" />
                    <span>Manage System Users</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/system-analytics')}
                    className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F0F6FF] hover:border-[#BFDBFE] hover:text-[#246BDE] h-10 transition-colors"
                  >
                    <BarChart3 className="mr-2.5 size-4 text-[#10A875]" />
                    <span>Platform Analytics &amp; Trends</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/system-settings')}
                    className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F0F6FF] hover:border-[#BFDBFE] hover:text-[#246BDE] h-10 transition-colors"
                  >
                    <Settings className="mr-2.5 size-4 text-[#FFA51E]" />
                    <span>Platform System Settings</span>
                  </Button>
                </div>
              </div>

              {/* System Infrastructure Health Card */}
              <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#10A875]">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172B4D]">Cloud Infrastructure</h3>
                    <p className="text-xs text-[#718096]">Service availability &amp; cluster integrity</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B4D] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#10A875] animate-ping" />
                      Google Cloud Firestore
                    </span>
                    <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B4D] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#10A875]" />
                      Firebase Auth &amp; RBAC
                    </span>
                    <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B4D] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#10A875]" />
                      Cloud Storage &amp; Seals
                    </span>
                    <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B4D] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#246BDE]" />
                      Multi-Tenant Isolation
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#246BDE]">
                      {systemStats.activeBarangays} Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: BARANGAY DIRECTORY ── */}
        <TabsContent value="barangays" className="space-y-4">
          <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5EAF2]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#172B4D]">
                  All Enrolled Barangays
                </h3>
                <p className="text-xs text-[#718096]">
                  {filteredBarangayStats.length} barangay records in the municipal network
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
                <Input
                  placeholder="Search barangay name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]"
                />
              </div>
            </div>

            {filteredBarangayStats.length === 0 ? (
              <div className="text-center py-14 space-y-3">
                <Building2 className="size-12 mx-auto text-[#CBD5E1]" />
                <p className="text-sm font-medium text-[#718096]">
                  {searchQuery ? `No barangays match "${searchQuery}"` : 'No barangays configured yet.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBarangayStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="rounded-xl border border-[#E5EAF2] bg-[#F8FAFC]/60 p-4 space-y-3.5 hover:bg-white hover:border-[#BFDBFE] transition-all shadow-2xs group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-[#172B4D] group-hover:text-[#246BDE] transition-colors">
                          {stat.name}
                        </h4>
                        <p className="text-xs text-[#718096]">
                          {stat.municipality || 'Bongabong'}, {stat.province || 'Oriental Mindoro'}
                        </p>
                      </div>
                      <Badge
                        className={
                          stat.isActive
                            ? 'bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold'
                            : 'bg-[#718096]/15 text-[#718096] border-0 text-[10px]'
                        }
                      >
                        {stat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-[#E5EAF2] text-xs">
                      <div>
                        <p className="text-[11px] text-[#718096]">Residents</p>
                        <p className="font-bold text-[#172B4D]">{stat.totalResidents.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#718096]">Staff Accounts</p>
                        <p className="font-bold text-[#172B4D]">{stat.totalUsers}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#718096]">Total Reqs</p>
                        <p className="font-bold text-[#172B4D]">{stat.totalRequests}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#718096]">Pending</p>
                        <p className="font-bold text-[#FFA51E]">{stat.pendingRequests}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/barangays')}
                      className="w-full rounded-xl border-[#E5EAF2] text-xs font-bold text-[#172B4D] hover:bg-[#F0F6FF] hover:text-[#246BDE] h-9 gap-1.5"
                    >
                      <span>Manage LGU Profile</span>
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 3: MUNICIPAL TRENDS ── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">Transaction Summary</h3>
                  <p className="text-xs text-[#718096]">Multi-barangay clearance workload</p>
                </div>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Total Recorded Requests</span>
                  <span className="font-bold text-[#172B4D]">{systemStats.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#FFA51E] font-medium">Pending Processing</span>
                  <span className="font-bold text-[#FFA51E]">{systemStats.pendingRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2">
                  <span className="text-[#10A875] font-medium">Municipal Clearance Rate</span>
                  <span className="font-bold text-[#10A875]">
                    {systemStats.totalRequests > 0
                      ? Math.round(((systemStats.totalRequests - systemStats.pendingRequests) / systemStats.totalRequests) * 100)
                      : 100}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#8B5CF6]">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">Demographic Enrollment</h3>
                  <p className="text-xs text-[#718096]">Inhabitant profiling distribution</p>
                </div>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Total Enrolled Residents</span>
                  <span className="font-bold text-[#172B4D]">{systemStats.totalResidents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Total Staff Users</span>
                  <span className="font-bold text-[#172B4D]">{systemStats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2">
                  <span className="text-[#718096]">Average Inhabitants per Barangay</span>
                  <span className="font-bold text-[#246BDE]">
                    {systemStats.totalBarangays > 0
                      ? Math.round(systemStats.totalResidents / systemStats.totalBarangays).toLocaleString()
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 4: PLATFORM SPECS ── */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
                  <Server className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">System Architecture</h3>
                  <p className="text-xs text-[#718096]">Runtime stack and environmental specs</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Framework</span>
                  <span className="font-semibold text-[#172B4D]">Next.js 15 (App Router, Turbopack)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Database Layer</span>
                  <span className="font-semibold text-[#172B4D]">Google Cloud Firestore (Multi-tenant)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                  <span className="text-[#718096]">Auth &amp; RBAC</span>
                  <span className="font-semibold text-[#172B4D]">Firebase Auth with Sliding Rate Limiter</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#718096]">Regulatory Compliance</span>
                  <Badge className="bg-[#10A875]/15 text-[#10A875] border-0 text-[10px] font-bold">
                    R.A. 10173 &amp; R.A. 7160
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF2]">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#EA580C]">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B4D]">Administration Tools</h3>
                  <p className="text-xs text-[#718096]">Deep system management shortcuts</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/system-reports')}
                  className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F8FAFC] h-10"
                >
                  <FileText className="mr-2.5 size-4 text-[#246BDE]" />
                  <span>Generate Municipal Executive Reports</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/system-settings')}
                  className="w-full justify-start rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D] hover:bg-[#F8FAFC] h-10"
                >
                  <Settings className="mr-2.5 size-4 text-[#8B5CF6]" />
                  <span>Inspect Database &amp; System Configuration</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
