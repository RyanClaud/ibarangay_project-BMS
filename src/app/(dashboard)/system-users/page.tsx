'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  UserCog,
  Sparkles,
  Building2,
  Mail,
  CheckCircle2
} from "lucide-react";
import type { User, Barangay } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { EditSystemUserDialog } from "@/components/users/edit-system-user-dialog";

export default function SystemUsersPage() {
  const { currentUser } = useAppContext();
  const { firestore } = useFirebase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBarangay, setFilterBarangay] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  useEffect(() => {
    if (!isSuperAdmin || !firestore) return;
    loadData();
  }, [isSuperAdmin, firestore]);

  const loadData = async () => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(usersData);

      const barangaysSnap = await getDocs(collection(firestore, 'barangays'));
      const barangaysData = barangaysSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Barangay));
      setBarangays(barangaysData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setUserToReset(user);
    setIsResetDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string, userName: string, userEmail: string, isSuperAdmin: boolean) => {
    if (!firestore) return;
    
    if (isSuperAdmin) {
      toast({
        title: "Cannot Delete Super Admin",
        description: "Super admin accounts cannot be deleted for security reasons. Revoke super admin status first if needed.",
        variant: "destructive",
      });
      return;
    }
    
    if (userId === currentUser?.id) {
      toast({
        title: "Cannot Delete Your Own Account",
        description: "You cannot delete your own account while logged in.",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${userName}" (${userEmail})?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      
      toast({
        title: "Success",
        description: `User "${userName}" has been deleted successfully`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        isSuperAdmin: !currentStatus
      });
      
      toast({
        title: "Success",
        description: `Super admin status ${!currentStatus ? 'granted' : 'revoked'}`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const getBarangayName = (barangayId: string) => {
    const barangay = barangays.find(b => b.id === barangayId);
    return barangay?.name || barangayId || "—";
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = filterBarangay === 'all' || user.barangayId === filterBarangay;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesBarangay && matchesRole;
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.isSuperAdmin).length,
    admins: users.filter(u => u.role === 'Admin' && !u.isSuperAdmin).length,
    staff: users.filter(u => u.role !== 'Admin' && u.role !== 'Resident').length,
    residents: users.filter(u => u.role === 'Resident').length,
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
            You don't have permission to access System Users. Only Super Administrators can manage multi-barangay user identities.
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
            <UserCog className="size-8 text-yellow-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Multi-Barangay Identity & Access Management (IAM)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              System User Directory & Roles
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Audit user credentials, assign municipal role authorizations, manage password resets, and grant super admin privileges.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Accounts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Total Accounts</span>
            <div className="size-9 rounded-xl bg-[#2474E8] flex items-center justify-center text-white shadow-xs">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#102D56]">{stats.total}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Platform-Wide</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Super Admins</span>
            <div className="size-9 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-xs">
              <Shield className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#102D56]">{stats.superAdmins}</div>
            <p className="text-xs font-medium text-[#8B5CF6] mt-1">Full Oversight</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Barangay Admins</span>
            <div className="size-9 rounded-xl bg-[#10A875] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#102D56]">{stats.admins}</div>
            <p className="text-xs font-medium text-[#10A875] mt-1">LGU Leadership</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Barangay Staff</span>
            <div className="size-9 rounded-xl bg-[#FFA51E] flex items-center justify-center text-white shadow-xs">
              <UserCog className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#102D56]">{stats.staff}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Desk & Encoders</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096]">Residents</span>
            <div className="size-9 rounded-xl bg-[#0284C7] flex items-center justify-center text-white shadow-xs">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#102D56]">{stats.residents}</div>
            <p className="text-xs font-medium text-[#718096] mt-1">Portal Registered</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
          <Input
            placeholder="Search by full name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] placeholder-[#718096]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Select value={filterBarangay} onValueChange={setFilterBarangay}>
            <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs font-semibold text-[#172B4D]">
              <SelectValue placeholder="All Barangays" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E5EAF2]">
              <SelectItem value="all">All Barangays</SelectItem>
              {barangays.map(barangay => (
                <SelectItem key={barangay.id} value={barangay.id}>
                  {barangay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-xs font-semibold text-[#172B4D]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E5EAF2]">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Barangay Captain">Barangay Captain</SelectItem>
              <SelectItem value="Secretary">Secretary</SelectItem>
              <SelectItem value="Treasurer">Treasurer</SelectItem>
              <SelectItem value="BHW">BHW</SelectItem>
              <SelectItem value="Encoder">Encoder</SelectItem>
              <SelectItem value="Resident">Resident</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || filterBarangay !== 'all' || filterRole !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterBarangay('all');
                setFilterRole('all');
              }}
              className="h-10 rounded-xl text-xs text-[#718096] hover:text-[#102D56]"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E5EAF2] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#102D56]">Registered Accounts Directory</h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Showing {filteredUsers.length} of {users.length} enrolled system users
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[#E5EAF2] text-[#246BDE] font-semibold text-xs px-3 py-1">
            {filteredUsers.length} Filtered
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#718096]">
            <Users className="size-8 mx-auto mb-2 text-[#CBD5E1] animate-pulse" />
            Loading accounts database...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#718096] space-y-2">
            <Users className="size-10 mx-auto text-[#CBD5E1]" />
            <p className="font-semibold text-[#172B4D]">No users matching criteria</p>
            <p className="text-xs text-[#718096]">Try adjusting search filters or clearing queries.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] border-b border-[#E5EAF2] hover:bg-[#F8FAFC]">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5 pl-6">User & Identity</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Assigned Role</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Assigned Barangay</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-[#718096] py-3.5 pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                
                return (
                  <TableRow key={user.id} className="hover:bg-[#F8FAFC]/80 transition-colors border-b border-[#F0F4FA]">
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          user.isSuperAdmin 
                            ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' 
                            : user.role === 'Admin'
                            ? 'bg-[#246BDE]/15 text-[#246BDE]'
                            : user.role === 'Resident'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-[#10A875]/15 text-[#10A875]'
                        }`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#102D56] flex items-center gap-1.5">
                            {user.name}
                            {user.isSuperAdmin && (
                              <Badge className="bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] px-2 py-0 border-0 font-bold">
                                Super Admin
                              </Badge>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-[#718096]">(You)</span>
                            )}
                          </div>
                          <div className="text-xs text-[#718096] flex items-center gap-1 mt-0.5">
                            <Mail className="size-3 text-[#246BDE]" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'Admin' 
                          ? 'border-[#246BDE]/30 text-[#246BDE] bg-[#246BDE]/5'
                          : user.role === 'Resident'
                          ? 'border-slate-200 text-slate-600 bg-slate-50'
                          : 'border-[#10A875]/30 text-[#10A875] bg-[#10A875]/5'
                      }`}>
                        {user.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs font-medium text-[#172B4D]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-[#718096]" />
                        <span>{getBarangayName(user.barangayId)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.isDeleted 
                          ? 'bg-[#EF4655]/15 text-[#EF4655] border-transparent' 
                          : 'bg-[#10A875]/15 text-[#10A875] border-transparent'
                      }`}>
                        {user.isDeleted ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3.5 pr-6 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {user.role === 'Admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleSuperAdmin(user.id, user.isSuperAdmin || false)}
                            className="h-8 rounded-lg border-[#E5EAF2] text-xs font-semibold text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                            title="Toggle Super Admin privileges"
                          >
                            <Shield className="size-3.5 mr-1" />
                            {user.isSuperAdmin ? 'Revoke SA' : 'Grant SA'}
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          className="size-8 rounded-lg text-[#718096] hover:text-[#246BDE] hover:bg-[#F0F4FA]"
                          title="Edit user assignment"
                        >
                          <Edit className="size-4" />
                        </Button>

                        {!isCurrent && (
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleResetPassword(user)}
                            className="size-8 rounded-lg text-[#718096] hover:text-[#FFA51E] hover:bg-[#FFFBEB]"
                            title="Reset password"
                          >
                            <KeyRound className="size-4" />
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteUser(user.id, user.name, user.email, user.isSuperAdmin || false)}
                          disabled={user.isSuperAdmin || isCurrent}
                          className={user.isSuperAdmin || isCurrent 
                            ? "size-8 opacity-40 cursor-not-allowed" 
                            : "size-8 rounded-lg text-[#718096] hover:text-[#EF4655] hover:bg-[#FEF2F2]"
                          }
                          title={user.isSuperAdmin ? "Super Admin accounts cannot be deleted" : "Delete user"}
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

      <ResetPasswordDialog
        isOpen={isResetDialogOpen}
        onClose={() => {
          setIsResetDialogOpen(false);
          setUserToReset(null);
        }}
        targetUser={userToReset}
        adminUid={currentUser?.id ?? ""}
      />

      <EditSystemUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => { setIsEditDialogOpen(false); setEditingUser(null); }}
        user={editingUser}
        barangays={barangays}
        onSaved={loadData}
      />
    </div>
  );
}
