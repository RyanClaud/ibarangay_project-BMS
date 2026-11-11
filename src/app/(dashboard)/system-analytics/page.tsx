'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Users,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
  Layers
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import type { Barangay, User, Resident, DocumentRequest } from "@/lib/types";

const PALETTE = ['#246BDE', '#10A875', '#FFA51E', '#EF4655', '#8B5CF6', '#0284C7', '#F59E0B', '#14B8A6'];

export default function SystemAnalyticsPage() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalBarangays: 0,
    activeBarangays: 0,
    totalUsers: 0,
    totalResidents: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    releasedRequests: 0,
    rejectedRequests: 0,
    barangayPerformance: [] as any[],
    requestsByType: {} as Record<string, number>,
    usersByRole: {} as Record<string, number>,
  });

  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  const statusData = [
    { name: 'Pending Review', value: analytics.pendingRequests, color: '#FFA51E' },
    { name: 'Approved', value: analytics.approvedRequests, color: '#246BDE' },
    { name: 'Released', value: analytics.releasedRequests, color: '#10A875' },
    { name: 'Rejected', value: analytics.rejectedRequests, color: '#EF4655' },
  ].filter(item => item.value > 0);

  useEffect(() => {
    if (!isSuperAdmin || !firestore) return;
    loadAnalytics();
  }, [isSuperAdmin, firestore]);

  const loadAnalytics = async () => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      const [barangaysSnap, usersSnap, residentsSnap, requestsSnap] = await Promise.all([
        getDocs(collection(firestore, 'barangays')),
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'residents')),
        getDocs(collection(firestore, 'documentRequests')),
      ]);

      const barangays = barangaysSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Barangay));
      const users = usersSnap.docs.map(doc => doc.data() as User);
      const residents = residentsSnap.docs.map(doc => doc.data() as Resident);
      const requests = requestsSnap.docs.map(doc => doc.data() as DocumentRequest);

      const requestsByType: Record<string, number> = {};
      const usersByRole: Record<string, number> = {};
      
      requests.forEach(req => {
        const type = req.documentType || 'General Request';
        requestsByType[type] = (requestsByType[type] || 0) + 1;
      });

      users.forEach(user => {
        const role = user.role || 'Unassigned';
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });

      const barangayPerformance = barangays.map(barangay => {
        const barangayRequests = requests.filter(r => r.barangayId === barangay.id);
        const barangayResidents = residents.filter(r => r.barangayId === barangay.id);
        const completed = barangayRequests.filter(r => r.status === 'Released').length;
        
        return {
          name: barangay.name,
          residents: barangayResidents.length,
          requests: barangayRequests.length,
          pending: barangayRequests.filter(r => r.status === 'Pending').length,
          completed,
          completionRate: barangayRequests.length > 0 
            ? Math.round((completed / barangayRequests.length) * 100)
            : 0,
        };
      });

      setAnalytics({
        totalBarangays: barangays.length,
        activeBarangays: barangays.filter(b => b.isActive !== false).length,
        totalUsers: users.length,
        totalResidents: residents.length,
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'Pending').length,
        approvedRequests: requests.filter(r => r.status === 'Approved').length,
        releasedRequests: requests.filter(r => r.status === 'Released').length,
        rejectedRequests: requests.filter(r => r.status === 'Rejected').length,
        barangayPerformance,
        requestsByType,
        usersByRole,
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
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
            System Analytics is restricted to Super Administrators with multi-barangay municipal oversight.
          </p>
        </div>
      </div>
    );
  }

  const completionRate = analytics.totalRequests > 0
    ? Math.round((analytics.releasedRequests / analytics.totalRequests) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-yellow-400/40 shrink-0 shadow-inner">
            <BarChart3 className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Cross-Barangay Municipal Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              System Analytics & Velocity
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Real-time multi-tenant request fulfillment rates, demographic concentrations, and cross-barangay compliance telemetry.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white backdrop-blur-xs">
            <Activity className="size-3.5 text-[#10A875]" />
            <span>Telemetry Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Total Clearances</span>
            <div className="size-10 rounded-xl bg-[#2474E8] flex items-center justify-center text-white shadow-xs">
              <FileText className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{analytics.totalRequests}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">{analytics.pendingRequests} Pending Review</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Completion Rate</span>
            <div className="size-10 rounded-xl bg-[#10A875] flex items-center justify-center text-white shadow-xs">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{completionRate}%</div>
            <p className="text-xs font-medium text-[#10A875] mt-1">{analytics.releasedRequests} Released to Citizens</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Active LGUs</span>
            <div className="size-10 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
              <Building2 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{analytics.activeBarangays}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">of {analytics.totalBarangays} Total Jurisdictions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Census Records</span>
            <div className="size-10 rounded-xl bg-[#FFA51E] flex items-center justify-center text-white shadow-xs">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#102D56]">{analytics.totalResidents.toLocaleString()}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">{analytics.totalUsers} Platform Users</p>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-white border border-[#E5EAF2] p-1 text-[#718096] gap-1 shadow-xs">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Executive Overview
            </TabsTrigger>
            <TabsTrigger
              value="barangays"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Barangay Performance
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              Document Clearances
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#718096] transition-all data-[state=active]:bg-[#246BDE] data-[state=active]:text-white data-[state=active]:shadow-xs"
            >
              User Demographics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <PieIcon className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Request Status Distribution</h3>
                  <p className="text-xs text-[#718096]">Breakdown across all municipal barangays</p>
                </div>
              </div>

              {analytics.totalRequests === 0 ? (
                <div className="flex items-center justify-center h-64 text-xs text-[#718096]">
                  No document requests recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-[#E5EAF2]">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#FFA51E]"></div>
                      <span className="font-medium text-[#172B4D]">Pending: {analytics.pendingRequests}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#246BDE]"></div>
                      <span className="font-medium text-[#172B4D]">Approved: {analytics.approvedRequests}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#10A875]"></div>
                      <span className="font-medium text-[#172B4D]">Released: {analytics.releasedRequests}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#EF4655]"></div>
                      <span className="font-medium text-[#172B4D]">Rejected: {analytics.rejectedRequests}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                  <TrendingUp className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">System Health & Adoption</h3>
                  <p className="text-xs text-[#718096]">Platform percentage indicators</p>
                </div>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Completion %', value: completionRate, fill: '#10A875' },
                      { name: 'Active LGUs %', value: analytics.totalBarangays > 0 ? Math.round((analytics.activeBarangays / analytics.totalBarangays) * 100) : 0, fill: '#246BDE' },
                      { name: 'Avg Pop Index', value: analytics.totalBarangays > 0 ? Math.min(Math.round(analytics.totalResidents / analytics.totalBarangays), 100) : 0, fill: '#8B5CF6' },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#718096' }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Barangay Performance Tab */}
        <TabsContent value="barangays" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Top Request Volume by Barangay</h3>
                  <p className="text-xs text-[#718096]">Top 10 highest-volume LGU jurisdictions</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.barangayPerformance.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#172B4D' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="requests" fill="#246BDE" name="Total Requests" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="completed" fill="#10A875" name="Completed" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pending" fill="#FFA51E" name="Pending" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Fulfillment Rate by Barangay</h3>
                  <p className="text-xs text-[#718096]">Completion efficiency percentage ranking</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.barangayPerformance
                      .sort((a, b) => b.completionRate - a.completionRate)
                      .slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#172B4D' }} />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill="#10A875" name="Completion Rate %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Document Types Tab */}
        <TabsContent value="documents" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#FFA51E]/10 text-[#FFA51E] flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Clearance Type Distribution</h3>
                  <p className="text-xs text-[#718096]">Proportion of requests by document category</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.requestsByType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => ({ name: type, value: count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics.requestsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#246BDE]/10 text-[#246BDE] flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Transaction Count by Type</h3>
                  <p className="text-xs text-[#718096]">Aggregate demand per clearance category</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(analytics.requestsByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => ({ name: type, count }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#246BDE" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                  <Users className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Role Distribution</h3>
                  <p className="text-xs text-[#718096]">Distribution of platform access roles</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.usersByRole)
                        .sort(([, a], [, b]) => b - a)
                        .map(([role, count]) => ({ name: role, value: count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                    >
                      {Object.entries(analytics.usersByRole).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5EAF2]">
                <div className="size-9 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102D56]">Account Volumes by Role</h3>
                  <p className="text-xs text-[#718096]">Total enrolled officers and residents</p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(analytics.usersByRole)
                      .sort(([, a], [, b]) => b - a)
                      .map(([role, count]) => ({ name: role, count }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#718096' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10A875" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
