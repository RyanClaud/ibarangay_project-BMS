'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Eye,
  MoreHorizontal,
  PlusCircle,
  KeyRound,
  UserCheck,
  UserX,
  Users,
  ShieldCheck,
  Search,
  Filter,
  UserPlus,
  BadgeCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User, Resident, Role } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AddUserDialog } from './add-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { ActivateResidentDialog } from './activate-resident-dialog';
import { useAppContext } from '@/contexts/app-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControl } from '@/components/ui/pagination-control';
import { useToast } from '@/hooks/use-toast';

export interface ResidentAccountItem {
  id: string;
  residentId?: string;
  userId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  purok?: string;
  address?: string;
  householdNumber?: string;
  contactNumber?: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive' | 'Unregistered';
  hasPortalAccount: boolean;
  isDeleted?: boolean;
  userDoc?: User;
  residentDoc?: Resident;
}

export type ManageableAccountItem = User | ResidentAccountItem;

export function UserManagementClientPage() {
  const router = useRouter();
  const { users, residents, addUser, updateUser, deleteUser, currentUser } = useAppContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'staff' | 'residents'>('staff');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState('All');

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [userToView, setUserToView] = React.useState<ManageableAccountItem | null>(null);
  const [userToResetPassword, setUserToResetPassword] = React.useState<User | null>(null);
  const [residentToActivate, setResidentToActivate] = React.useState<ResidentAccountItem | null>(null);

  const allUsers = React.useMemo(() => users || [], [users]);
  const allResidents = React.useMemo(() => residents || [], [residents]);

  // Separate staff list
  const staffList = React.useMemo(() => {
    return allUsers.filter((u) => u.role !== 'Resident');
  }, [allUsers]);

  // Unified resident accounts list: combines demographic profiles and portal auth accounts
  const residentList = React.useMemo(() => {
    const list: ResidentAccountItem[] = [];
    const matchedUserIds = new Set<string>();

    // 1. Map all residents registered in the barangay registry
    for (const res of allResidents) {
      // Find matching user in users collection
      const matchedUser = allUsers.find((u) => {
        if (u.role !== 'Resident') return false;
        if (u.residentId && u.residentId === res.id) return true;
        if (u.id === res.id || u.id === res.userId) return true;
        if (res.userId && u.id === res.userId) return true;
        if (
          res.email &&
          res.email !== 'NONE' &&
          u.email &&
          res.email.trim().toLowerCase() === u.email.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      if (matchedUser) {
        matchedUserIds.add(matchedUser.id);
        const isInactive = matchedUser.isDeleted || matchedUser.status === 'Inactive';
        list.push({
          id: matchedUser.id,
          residentId: res.id,
          userId: matchedUser.id,
          name: matchedUser.name || `${res.firstName} ${res.lastName}`,
          firstName: res.firstName,
          lastName: res.lastName,
          email: matchedUser.email || (res.email !== 'NONE' ? res.email : ''),
          role: 'Resident',
          purok: res.purok,
          address: res.address,
          householdNumber: res.householdNumber,
          contactNumber: (res as any).contactNumber,
          avatarUrl: matchedUser.avatarUrl || res.avatarUrl,
          status: isInactive ? 'Inactive' : 'Active',
          hasPortalAccount: true,
          isDeleted: matchedUser.isDeleted,
          userDoc: matchedUser,
          residentDoc: res,
        });
      } else {
        // Resident record in demographic census without active portal login account
        list.push({
          id: res.id,
          residentId: res.id,
          userId: undefined,
          name: `${res.firstName} ${res.lastName}`,
          firstName: res.firstName,
          lastName: res.lastName,
          email: res.email && res.email !== 'NONE' ? res.email : '',
          role: 'Resident',
          purok: res.purok,
          address: res.address,
          householdNumber: res.householdNumber,
          contactNumber: (res as any).contactNumber,
          avatarUrl: res.avatarUrl,
          status: 'Unregistered',
          hasPortalAccount: false,
          isDeleted: false,
          userDoc: undefined,
          residentDoc: res,
        });
      }
    }

    // 2. Also append any user with role 'Resident' in allUsers that wasn't in residents
    for (const u of allUsers) {
      if (u.role === 'Resident' && !matchedUserIds.has(u.id)) {
        const isInactive = u.isDeleted || u.status === 'Inactive';
        list.push({
          id: u.id,
          residentId: u.residentId,
          userId: u.id,
          name: u.name,
          email: u.email || '',
          role: 'Resident',
          status: isInactive ? 'Inactive' : 'Active',
          hasPortalAccount: true,
          isDeleted: u.isDeleted,
          userDoc: u,
        });
      }
    }

    // Sort alphabetically by resident name
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [allResidents, allUsers]);

  // Current active list based on selected tab
  const activeList = activeTab === 'staff' ? staffList : residentList;

  // Filter based on search, role, and status
  const filteredItems = React.useMemo(() => {
    return (activeList as ManageableAccountItem[]).filter((item) => {
      const name = item.name || '';
      const email = item.email || '';
      const purok = (item as ResidentAccountItem).purok || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        purok.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'All' || item.role === roleFilter;

      // Status check
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if ('hasPortalAccount' in item) {
          const resItem = item as ResidentAccountItem;
          if (statusFilter === 'Active') {
            matchesStatus = resItem.hasPortalAccount && resItem.status === 'Active';
          } else if (statusFilter === 'Inactive') {
            matchesStatus = resItem.hasPortalAccount && resItem.status === 'Inactive';
          } else if (statusFilter === 'Unregistered') {
            matchesStatus = !resItem.hasPortalAccount || resItem.status === 'Unregistered';
          }
        } else {
          const isInactive = item.isDeleted || item.status === 'Inactive';
          if (statusFilter === 'Active') {
            matchesStatus = !isInactive;
          } else if (statusFilter === 'Inactive') {
            matchesStatus = isInactive;
          } else if (statusFilter === 'Unregistered') {
            matchesStatus = false;
          }
        }
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeList, searchQuery, roleFilter, statusFilter]);

  // Table pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredItems, { initialPageSize: 10 });

  const handleToggleStatus = async (user: User) => {
    const isCurrentlyInactive = user.isDeleted || user.status === 'Inactive';
    const newStatus = isCurrentlyInactive ? 'Active' : 'Inactive';
    const newIsDeleted = !isCurrentlyInactive;

    try {
      await updateUser({
        id: user.id,
        isDeleted: newIsDeleted,
        status: newStatus,
        ...(newIsDeleted ? { deletedAt: new Date().toISOString() } : { deletedAt: undefined }),
      });

      toast({
        title: isCurrentlyInactive ? 'Account Activated' : 'Account Deactivated',
        description: `${user.name}'s account status has been changed to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Action Failed',
        description: error.message || 'Could not update account status.',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async (newUser: Omit<User, 'id' | 'avatarUrl' | 'residentId'>) => {
    await addUser(newUser);
  };

  const handleUpdateUser = (updatedUser: Partial<User> & { id: string }) => {
    updateUser(updatedUser);
    setUserToEdit(null);
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    setUserToDelete(null);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
            Administrator
          </span>
        );
      case 'Barangay Captain':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
            Punong Barangay
          </span>
        );
      case 'Secretary':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]">
            Secretary
          </span>
        );
      case 'Treasurer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#8B5CF6] border border-[#DDD6FE]">
            Treasurer
          </span>
        );
      case 'Resident':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
            Resident
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F4FA] text-[#718096]">
            {role}
          </span>
        );
    }
  };

  // Quick statistics for resident accounts
  const residentStats = React.useMemo(() => {
    const active = residentList.filter((r) => r.hasPortalAccount && r.status === 'Active').length;
    const unregistered = residentList.filter((r) => !r.hasPortalAccount).length;
    return { active, unregistered, total: residentList.length };
  }, [residentList]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
            User &amp; Account Management
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Complete account controls, role assignments, activation status, and password resets.
          </p>
        </div>

        {activeTab === 'staff' ? (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl shadow-xs font-semibold text-xs h-10 px-4 gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="size-4" />
            <span>Add Staff Account</span>
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/residents')}
            className="bg-[#10A875] hover:bg-[#0E9366] text-white rounded-xl shadow-xs font-semibold text-xs h-10 px-4 gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="size-4" />
            <span>Register New Resident</span>
          </Button>
        )}
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-4 sm:p-5 border-b border-[#E5EAF2] bg-[#F8FAFC]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-[#E9EEF5] p-1 rounded-xl">
                <button
                  onClick={() => {
                    setActiveTab('staff');
                    setCurrentPage(1);
                    setRoleFilter('All');
                    setStatusFilter('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'staff'
                      ? 'bg-[#246BDE] text-white shadow-xs'
                      : 'text-[#718096] hover:text-[#172B4D]'
                  }`}
                >
                  <ShieldCheck className="size-4" />
                  <span>Staff &amp; Officials</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'staff'
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-[#718096]'
                    }`}
                  >
                    {staffList.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('residents');
                    setCurrentPage(1);
                    setRoleFilter('All');
                    setStatusFilter('All');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'residents'
                      ? 'bg-[#246BDE] text-white shadow-xs'
                      : 'text-[#718096] hover:text-[#172B4D]'
                  }`}
                >
                  <Users className="size-4" />
                  <span>Resident Accounts</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'residents'
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-[#718096]'
                    }`}
                  >
                    {residentList.length}
                  </span>
                </button>
              </div>

              {/* Sub-pills for resident accounts */}
              {activeTab === 'residents' && (
                <div className="hidden sm:flex items-center gap-2 text-xs pl-2 text-[#718096]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#10A875] font-semibold border border-[#A7F3D0]">
                    <BadgeCheck className="size-3.5" />
                    {residentStats.active} Active Logins
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFBEB] text-[#D97706] font-semibold border border-[#FDE68A]">
                    <UserPlus className="size-3.5" />
                    {residentStats.unregistered} Profile Only
                  </span>
                </div>
              )}
            </div>

            {/* Account Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#718096]" />
                <Input
                  placeholder={
                    activeTab === 'staff'
                      ? 'Search staff name or email...'
                      : 'Search name, email, or purok...'
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 pl-9 pr-3 rounded-xl border-[#E2E8F0] bg-white text-xs text-[#172B4D] placeholder-[#718096] focus:border-[#246BDE]"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[150px] rounded-xl border-[#E2E8F0] bg-white text-xs font-semibold text-[#172B4D]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5EAF2]">
                  <SelectItem value="All" className="text-xs">
                    All Status ({activeList.length})
                  </SelectItem>
                  <SelectItem value="Active" className="text-xs text-[#10A875] font-semibold">
                    Active
                  </SelectItem>
                  <SelectItem value="Inactive" className="text-xs text-[#EF4655] font-semibold">
                    Inactive
                  </SelectItem>
                  {activeTab === 'residents' && (
                    <SelectItem value="Unregistered" className="text-xs text-[#D97706] font-semibold">
                      Profile Only ({residentStats.unregistered})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#E5EAF2] bg-[#F8FAFC] text-xs font-semibold text-[#718096]">
                <TableHead className="font-semibold py-3 px-4">Account Holder</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold py-3 px-4">
                  {activeTab === 'staff' ? 'Email Address' : 'Portal Email / Address'}
                </TableHead>
                <TableHead className="hidden md:table-cell font-semibold py-3 px-4">Role</TableHead>
                <TableHead className="font-semibold py-3 px-4">Account Status</TableHead>
                <TableHead className="text-right font-semibold py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#F1F5F9]">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => {
                  const isResidentItem = 'hasPortalAccount' in item;
                  const resItem = isResidentItem ? (item as ResidentAccountItem) : null;
                  const userDoc = resItem?.userDoc || (!isResidentItem ? (item as User) : null);
                  const isInactive = userDoc
                    ? userDoc.isDeleted || userDoc.status === 'Inactive'
                    : false;
                  const isUnregistered = resItem ? !resItem.hasPortalAccount : false;

                  return (
                    <TableRow key={item.id} className="hover:bg-[#F9FAFC] transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-[#E5EAF2]">
                            <AvatarImage src={item.avatarUrl || undefined} alt={item.name} />
                            <AvatarFallback
                              className={`font-bold text-xs ${
                                isUnregistered
                                  ? 'bg-[#FEF3C7] text-[#D97706]'
                                  : 'bg-[#EAF2FF] text-[#246BDE]'
                              }`}
                            >
                              {item.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm text-[#172B4D]">{item.name}</div>
                            {resItem?.purok && (
                              <div className="text-[11px] text-[#718096] font-medium">
                                {resItem.purok}
                              </div>
                            )}
                            <div className="text-[11px] text-[#718096] sm:hidden">
                              {item.email || 'No portal email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-xs text-[#718096] py-3 px-4 font-mono">
                        {item.email ? (
                          <span>{item.email}</span>
                        ) : (
                          <span className="italic text-[#94A3B8]">No portal email linked</span>
                        )}
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-3 px-4">
                        {getRoleBadge(item.role)}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {isUnregistered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                            Profile Only
                          </span>
                        ) : isInactive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#EF4655] border border-[#FECACA]">
                            Inactive / Deactivated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10A875] border border-[#A7F3D0]">
                            Active
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Case A: Unregistered resident record -> Quick Activate button */}
                          {isUnregistered && resItem ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setResidentToActivate(resItem)}
                              className="h-8 rounded-lg text-xs font-semibold bg-[#10A875] hover:bg-[#0E9366] text-white shadow-xs gap-1.5 px-3"
                            >
                              <UserPlus className="size-3.5" />
                              <span className="hidden sm:inline">Activate Login</span>
                            </Button>
                          ) : (
                            /* Case B: User has portal account -> Reset password button */
                            userDoc && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToResetPassword(userDoc)}
                                aria-label={`Reset password for ${item.name}`}
                                className="h-8 rounded-lg text-xs font-semibold text-[#FFA51E] hover:bg-[#FFF7ED]"
                              >
                                <KeyRound className="mr-1 size-3.5" />
                                <span className="hidden sm:inline">Reset Password</span>
                              </Button>
                            )
                          )}

                          {/* Quick View Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToView(item)}
                            className="h-8 rounded-lg text-xs font-semibold text-[#246BDE] hover:bg-[#EAF2FF]"
                          >
                            <Eye className="mr-1 size-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Button>

                          {/* Action Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-lg text-[#718096] hover:bg-[#F0F4FA]"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-52 rounded-xl border-[#E5EAF2] p-1.5 shadow-lg"
                            >
                              <DropdownMenuLabel className="text-xs font-semibold text-[#718096]">
                                Account Controls
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setUserToView(item)}
                                className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#172B4D]"
                              >
                                <Eye className="mr-2 size-4 text-[#246BDE]" /> View full profile
                              </DropdownMenuItem>

                              {isUnregistered && resItem ? (
                                <DropdownMenuItem
                                  onClick={() => setResidentToActivate(resItem)}
                                  className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#10A875] font-semibold hover:bg-[#ECFDF5]"
                                >
                                  <UserPlus className="mr-2 size-4 text-[#10A875]" /> Provision
                                  portal login
                                </DropdownMenuItem>
                              ) : null}

                              {userDoc && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setUserToEdit(userDoc)}
                                    className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#172B4D]"
                                  >
                                    Edit role &amp; permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setUserToResetPassword(userDoc)}
                                    className="cursor-pointer text-xs rounded-lg px-2.5 py-2 text-[#FFA51E] hover:bg-[#FFF7ED]"
                                  >
                                    <KeyRound className="mr-2 size-4 text-[#FFA51E]" /> Reset password
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="my-1 border-[#F1F5F9]" />

                                  {/* Activate / Deactivate Toggle */}
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(userDoc)}
                                    className={`cursor-pointer text-xs rounded-lg px-2.5 py-2 font-medium ${
                                      isInactive
                                        ? 'text-[#10A875] hover:bg-[#ECFDF5]'
                                        : 'text-[#EA580C] hover:bg-[#FFF7ED]'
                                    }`}
                                  >
                                    {isInactive ? (
                                      <>
                                        <UserCheck className="mr-2 size-4 text-[#10A875]" /> Activate
                                        account
                                      </>
                                    ) : (
                                      <>
                                        <UserX className="mr-2 size-4 text-[#EA580C]" /> Deactivate
                                        account
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => setUserToDelete(userDoc)}
                                    className="text-[#EF4655] hover:bg-[#FEF2F2] cursor-pointer text-xs rounded-lg px-2.5 py-2 font-medium"
                                  >
                                    Delete account
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs text-[#718096]">
                    No accounts found matching your search and filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination */}
        {filteredItems.length > 0 && (
          <div className="border-t border-[#E5EAF2] px-4 py-2 bg-[#F8FAFC]">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel={activeTab === 'staff' ? 'staff members' : 'resident records'}
            />
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <AddUserDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddUser={handleAddUser}
        existingUsers={staffList}
      />

      {userToEdit && (
        <EditUserDialog
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
          onUpdateUser={handleUpdateUser}
          user={userToEdit}
        />
      )}

      {userToView && (
        <AccountDetailsDialog item={userToView} onClose={() => setUserToView(null)} />
      )}

      {userToResetPassword && (
        <ResetPasswordDialog
          user={userToResetPassword}
          isOpen={!!userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
        />
      )}

      {residentToActivate && (
        <ActivateResidentDialog
          isOpen={!!residentToActivate}
          onClose={() => setResidentToActivate(null)}
          resident={residentToActivate}
        />
      )}

      {userToDelete && (
        <DeleteUserDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => handleDeleteUser(userToDelete.id)}
          userName={userToDelete.name}
        />
      )}
    </div>
  );
}

function AccountDetailsDialog({
  item,
  onClose,
}: {
  item: ManageableAccountItem;
  onClose: () => void;
}) {
  const isResident = 'hasPortalAccount' in item;
  const resItem = isResident ? (item as ResidentAccountItem) : null;
  const isInactive = !isResident && (item.isDeleted || item.status === 'Inactive');

  const details: [string, string][] = [
    ['Full Name', item.name],
    ['Portal Login Email', item.email || 'Not configured / Profile only'],
    ['System Role', item.role],
    [
      'Account Status',
      isResident
        ? resItem?.hasPortalAccount
          ? resItem.status === 'Inactive'
            ? 'Inactive / Deactivated'
            : 'Active'
          : 'Profile Only (No Online Login Yet)'
        : isInactive
        ? 'Inactive / Deactivated'
        : 'Active',
    ],
    ['Barangay Assigned', 'Mina de Oro, Bongabong'],
  ];

  if (resItem?.purok) {
    details.push(['Purok / Sitio', resItem.purok]);
  }
  if (resItem?.householdNumber) {
    details.push(['Household Number', resItem.householdNumber]);
  }
  if (resItem?.contactNumber) {
    details.push(['Contact Number', resItem.contactNumber]);
  }
  details.push(['System Record ID', item.id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#172B4D]">
            Account &amp; Resident Details
          </DialogTitle>
          <DialogDescription className="text-xs text-[#718096]">
            System credentials, residency verification, and status.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 pt-2 text-xs">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0"
            >
              <dt className="font-semibold text-[#718096]">{label}</dt>
              <dd className="font-medium text-[#172B4D] font-mono">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
