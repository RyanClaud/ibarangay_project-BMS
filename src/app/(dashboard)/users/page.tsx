'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { UserManagementClientPage } from '@/components/users/user-management-client-page';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { currentUser, isDataLoading } = useAppContext();
  const router = useRouter();

  // Security: Only Admin, Barangay Captain, and Super Admin can access user management
  useEffect(() => {
    if (!isDataLoading && currentUser) {
      const canAccessUserManagement =
        currentUser.role === 'Admin' ||
        currentUser.role === 'Barangay Captain' ||
        currentUser.isSuperAdmin;

      if (!canAccessUserManagement) {
        toast({
          title: 'Access Denied',
          description: 'Only administrators and barangay captains can access the user management console.',
          variant: 'destructive',
        });
        router.push('/dashboard');
      }
    }
  }, [currentUser, isDataLoading, router]);

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#246BDE]" />
      </div>
    );
  }

  // Security check: Don't render if not authorized
  const isAuthorized =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Barangay Captain' ||
    currentUser?.isSuperAdmin;

  if (!isAuthorized) {
    return null;
  }

  return <UserManagementClientPage />;
}
