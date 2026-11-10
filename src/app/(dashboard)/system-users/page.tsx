'use client';

import { useAppContext } from "@/contexts/app-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  KeyRound
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
      // Load all users
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(usersData);

      // Load all barangays
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
    
    // Prevent deletion of super admin accounts
    if (isSuperAdmin) {
      toast({
        title: "Cannot Delete Super Admin",
        description: "Super admin accounts cannot be deleted for security reasons. Revoke super admin status first if needed.",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent deletion of the currently logged-in user
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
    return barangay?.name || barangayId;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = filterBarangay === 'all' || user.barangayId === filterBarangay;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesBarangay && matchesRole;
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.isSuperAdmin).length,
    admins: users.filter(u => u.role === 'Admin').length,
    staff: users.filter(u => u.role !== 'Admin' && u.role !== 'Resident').length,
    residents: users.filter(u => u.role === 'Resident').length,
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Access Denied</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>You don't have permission to access System Users.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            System Users
          </h1>
          <p className="text-muted-foreground">
            Manage users across all barangays
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Found duplicate users?</h3>
              <p className="text-sm text-muted-foreground">Click the delete button (🗑️) next to the duplicate entry to remove it</p>
            </div>
            <Button
              variant="outline"
              onClick={loadData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.superAdmins}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.staff}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residents</CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.residents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-t-4 border-t-blue-500 hover:shadow-xl transition-all">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Filter Users</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {barangays.map(barangay => (
                  <SelectItem key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-t-4 border-t-purple-500 hover:shadow-xl transition-all">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getBarangayName(user.barangayId)}
                      </TableCell>
                      <TableCell>
                        {user.isDeleted ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.role === 'Admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleSuperAdmin(user.id, user.isSuperAdmin || false)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              {user.isSuperAdmin ? 'Revoke' : 'Grant'} SA
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              title="Reset password"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name, user.email, user.isSuperAdmin || false)}
                            className={user.isSuperAdmin ? "opacity-50 cursor-not-allowed" : "text-destructive hover:text-destructive"}
                            title={user.isSuperAdmin ? "Super admin accounts cannot be deleted" : "Delete user"}
                            disabled={user.isSuperAdmin || user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
