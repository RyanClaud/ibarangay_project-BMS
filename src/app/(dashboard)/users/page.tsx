'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Shield, UserCog } from 'lucide-react';
import { AddUserDialog } from '@/components/users/add-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import type { User } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function UsersPage() {
  const { currentUser, users, addUser, updateUser, deleteUser, isDataLoading } = useAppContext();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [lastCreationTime, setLastCreationTime] = useState<number>(0);

  // Security: Only Admin and Barangay Captain can access this page
  useEffect(() => {
    if (!isDataLoading && currentUser) {
      const canAccessUserManagement = 
        currentUser.role === 'Admin' || 
        currentUser.role === 'Barangay Captain' ||
        currentUser.isSuperAdmin;
        
      if (!canAccessUserManagement) {
        toast({
          title: 'Access Denied',
          description: 'Only administrators and barangay captains can access the staff management page.',
          variant: 'destructive',
        });
        router.push('/dashboard');
      }
    }
  }, [currentUser, isDataLoading, router]);

  // Filter out Admin users from the list (only show staff)
  const staffUsers = users?.filter(user => 
    user.role !== 'Resident' && 
    user.barangayId === currentUser?.barangayId
  ) || [];

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const confirmMessage = 
      'Are you sure you want to disable this user account?\n\n' +
      '⚠️ Note: The user will be blocked from logging in, but their Firebase Authentication account will remain in the system.\n\n' +
      'To completely remove the auth account, you need to delete it manually from Firebase Console → Authentication.';
    
    if (confirm(confirmMessage)) {
      try {
        await deleteUser(userId);
        toast({
          title: 'User Account Disabled',
          description: 'The user has been disabled and cannot log in. Their auth account remains in Firebase Console.',
          duration: 5000,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to disable user account.',
          variant: 'destructive',
        });
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Barangay Captain':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Secretary':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Treasurer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  // Security check: Don't render if not admin
  if (currentUser?.role !== 'Admin' && !currentUser?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Staff & Users</h1>
          <p className="text-muted-foreground">Manage barangay staff and officials</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            title="Refresh user list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Barangay Staff
          </CardTitle>
          <CardDescription>
            Manage staff members and officials for your barangay
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No staff members yet</h3>
              <p className="text-muted-foreground mt-2">
                Add your first staff member to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.name}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Shield className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-2">
            <li>• Only administrators can view and manage staff accounts</li>
            <li>• Staff members (Secretary, Treasurer, Captain) cannot access this page</li>
            <li>• Set strong passwords for all staff accounts</li>
            <li>• Advise staff to change their password after first login</li>
            <li>• You cannot delete your own account</li>
          </ul>
        </CardContent>
      </Card>

      <AddUserDialog
        isOpen={isAddDialogOpen}
        onClose={() => !isCreatingUser && setIsAddDialogOpen(false)}
        existingUsers={staffUsers}
        onAddUser={async (userData) => {
          // Prevent rapid successive creations
          const now = Date.now();
          const timeSinceLastCreation = now - lastCreationTime;
          if (timeSinceLastCreation < 3000) {
            toast({
              title: 'Please Wait',
              description: `Please wait ${Math.ceil((3000 - timeSinceLastCreation) / 1000)} more seconds before creating another user.`,
              variant: 'default',
            });
            throw new Error('Please wait before creating another user');
          }
          
          setIsCreatingUser(true);
          setIsAddDialogOpen(false);
          
          try {
            // Start the user creation process (this will set the lock)
            // Don't await yet - let it run in background
            const userCreationPromise = addUser(userData);
            
            // CRITICAL: Redirect to isolated loading page immediately
            // This prevents queries from running while user is being created
            router.push('/creating-user');
            
            // Now wait for user creation to complete
            await userCreationPromise;
            setLastCreationTime(Date.now());
            
            // Success - the loading page will redirect back automatically
            console.log('✅ User creation complete');
          } catch (error: any) {
            // On error, clear the lock and go back
            sessionStorage.removeItem('creating_user');
            router.push('/settings?tab=users');
            
            toast({
              title: 'Failed to Create User',
              description: error.message || 'An error occurred while creating the user.',
              variant: 'destructive',
            });
          } finally {
            setIsCreatingUser(false);
          }
        }}
        isCreating={isCreatingUser}
      />

      {selectedUser && (
        <EditUserDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedUser(null);
          }}
          onUpdateUser={updateUser}
          user={selectedUser}
        />
      )}
    </div>
  );
}
