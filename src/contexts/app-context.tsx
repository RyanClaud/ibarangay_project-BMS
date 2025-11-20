'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Resident, DocumentRequest, DocumentRequestStatus, Role, BarangayConfig, DocumentPricing } from '@/lib/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc,
  useUser,
} from '@/firebase';
import { collection, doc, writeBatch, getDoc, setDoc, query, where, getDocs, limit, updateDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  barangayConfig: BarangayConfig | null;
  documentPricing: DocumentPricing | null;
  logout: () => void;
  residents: Resident[] | null;
  addResident: (resident: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => Promise<void>;
  updateResident: (residentId: string, dataToUpdate: Partial<Resident>) => Promise<void>;
  deleteResident: (residentId: string) => void;
  documentRequests: DocumentRequest[] | null;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status' | 'referenceNumber'>) => void;
  updateDocumentRequestStatus: (id: string, status: DocumentRequestStatus, paymentDetails?: DocumentRequest['paymentDetails']) => void;
  deleteDocumentRequest: (id: string) => void;
  users: User[] | null;
  addUser: (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'> & { password?: string }) => Promise<void>;
  updateUser: (dataToUpdate: Partial<User> & { id: string }) => Promise<void>;
  deleteUser: (userId: string) => void;
  isDataLoading: boolean;
  login: (credential: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Store admin credentials in memory ONLY. This is not secure for production but works for this dev environment.
let adminCredentials: { email: string; password: string } | null = null;

// Helper to get admin credentials (checks both memory and sessionStorage)
const getAdminCredentials = () => {
  if (adminCredentials) return adminCredentials;
  
  // Try to recover from sessionStorage
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('admin_creds');
    if (stored) {
      try {
        adminCredentials = JSON.parse(stored);
        return adminCredentials;
      } catch (e) {
        console.error('Failed to parse stored credentials');
      }
    }
  }
  return null;
};

// Lock to prevent auth state changes during user creation
let isCreatingUser = false;

// Helper to check if we're in user creation mode (persists across re-renders)
const isInUserCreationMode = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('creating_user') === 'true' || isCreatingUser;
};


function AppProviderContent({ children }: { children: ReactNode }) {
  const { firestore, auth } = useFirebase();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  // CRITICAL: Disable Firebase Auth persistence on mount
  useEffect(() => {
    if (auth) {
      setPersistence(auth, browserSessionPersistence)
        .then(() => {
          console.log('✅ Firebase Auth persistence set to SESSION only (no auto-login on restart)');
        })
        .catch((error) => {
          console.error('Failed to set auth persistence:', error);
        });
    }
  }, [auth]);
  
  // Restore admin credentials from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !adminCredentials) {
      const stored = sessionStorage.getItem('admin_creds');
      if (stored) {
        try {
          adminCredentials = JSON.parse(stored);
          console.log('✅ Admin credentials restored from sessionStorage');
        } catch (e) {
          console.error('Failed to restore credentials:', e);
        }
      }
    }
  }, []);

  // --- Barangay Config Query ---
  const barangayConfigDocRef = useMemoFirebase(() => {
    // CRITICAL: Don't create queries during user creation
    if (isInUserCreationMode()) {
      console.log('🔒 Barangay config query blocked - user creation in progress');
      return null;
    }
    if (!firestore || !currentUser?.barangayId) return null;
    return doc(firestore, 'barangays', currentUser.barangayId);
  }, [firestore, currentUser?.barangayId]);
  const { data: barangayConfig, isLoading: isConfigLoading } = useDoc<BarangayConfig>(barangayConfigDocRef);

  // --- Role-based Data Fetching ---
  const isStaff = currentUser?.role !== 'Resident';

  // Queries for staff members
  // Only Admin and Super Admin can see all users
  const isAdminOrSuperAdmin = currentUser?.role === 'Admin' || currentUser?.isSuperAdmin;
  
  const allUsersQuery = useMemoFirebase(() => {
    // CRITICAL: Don't create queries during user creation
    if (isInUserCreationMode()) {
      console.log('🔒 Users query blocked - user creation in progress');
      return null;
    }
    if (!firestore || !currentUser?.id || !isAdminOrSuperAdmin) return null;
    // Super admins see all users, regular admins see only their barangay
    if (currentUser.isSuperAdmin) {
      return collection(firestore, 'users');
    }
    // Only create query if barangayId is defined
    if (!currentUser.barangayId) return null;
    return query(collection(firestore, 'users'), where('barangayId', '==', currentUser.barangayId));
  }, [firestore, currentUser?.id, currentUser?.barangayId, currentUser?.isSuperAdmin, isAdminOrSuperAdmin]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection<User>(allUsersQuery);

  const allResidentsQuery = useMemoFirebase(() => {
    // CRITICAL: Don't create queries during user creation
    if (isInUserCreationMode()) {
      console.log('🔒 Residents query blocked - user creation in progress');
      return null;
    }
    // Only staff should query all residents, NOT residents themselves
    if (!firestore || !currentUser?.id || !currentUser?.role || !isStaff || currentUser.role === 'Resident') return null;
    // Super admins see all residents, regular staff see only their barangay
    if (currentUser.isSuperAdmin) {
      return collection(firestore, 'residents');
    }
    // Only create query if barangayId is defined
    if (!currentUser.barangayId) return null;
    return query(collection(firestore, 'residents'), where('barangayId', '==', currentUser.barangayId));
  }, [firestore, currentUser?.id, currentUser?.role, currentUser?.barangayId, currentUser?.isSuperAdmin, isStaff]);
  const { data: allResidents, isLoading: isAllResidentsLoading } = useCollection<Resident>(allResidentsQuery);
  
  // Query for a single resident's own profile
  const singleResidentDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id || isStaff || !currentUser?.residentId) return null;
    return doc(firestore, 'residents', currentUser.residentId);
  }, [firestore, currentUser, isStaff]);
  const { data: singleResident, isLoading: isSingleResidentLoading } = useDoc<Resident>(singleResidentDocRef);
  
  // --- Combined Data Logic ---
  const users = useMemo(() => {
    if (!currentUser) return null;
    // Only Admin and Super Admin can see all users
    // Other staff (Secretary, Treasurer, Captain) only see their own user document
    if (isAdminOrSuperAdmin) {
      // Filter out deleted users
      return allUsers?.filter(user => !user.isDeleted) || null;
    }
    // Non-admin staff and residents only see their own user document
    return currentUser ? [currentUser] : [];
  }, [currentUser, allUsers, isAdminOrSuperAdmin]);

  const residents = useMemo(() => {
    if (!currentUser) return null;
    return isStaff ? allResidents : (singleResident ? [singleResident] : []);
  }, [isStaff, allResidents, singleResident]);


  // --- Document Requests Query (works for both roles) ---
  const documentRequestsQuery = useMemoFirebase(() => {
    // CRITICAL: Don't create queries during user creation
    if (isInUserCreationMode()) {
      console.log('🔒 Document requests query blocked - user creation in progress');
      return null;
    }
    if (!firestore || !currentUser) return null;
    if (currentUser.role === 'Resident' && currentUser.id) {
      // Residents see only their own requests
      return query(collection(firestore, 'documentRequests'), where('residentId', '==', currentUser.id));
    }
    if (currentUser.role !== 'Resident') {
      // Super admins see all requests, regular staff see only their barangay
      if (currentUser.isSuperAdmin) {
        return collection(firestore, 'documentRequests');
      }
      // Only create query if barangayId is defined
      if (!currentUser.barangayId) return null;
      return query(collection(firestore, 'documentRequests'), where('barangayId', '==', currentUser.barangayId));
    }
    return null;
  }, [firestore, currentUser]);
  const { data: documentRequests, isLoading: isRequestsLoading } = useCollection<DocumentRequest>(documentRequestsQuery);

  const isDataLoading = useMemo(() => {
    if (!currentUser) return true; // Still loading if no user is authenticated yet.
    if (isConfigLoading || isRequestsLoading) return true; // Always wait for these.
    return isStaff ? (isAllUsersLoading || isAllResidentsLoading) : isSingleResidentLoading;
  }, [currentUser, isConfigLoading, isRequestsLoading, isStaff, isAllUsersLoading, isAllResidentsLoading, isSingleResidentLoading]);

  const logout = useCallback(async () => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      setCurrentUser(null);
      adminCredentials = null; // Clear credentials on logout
      sessionStorage.clear(); // Clear ALL sessionStorage
      localStorage.clear(); // Clear ALL localStorage (Firebase uses this for persistence)
      console.log('✅ Logged out and cleared all stored data');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [auth]);

  // --- Auth Effect: The new, stable core of authentication ---
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for Firebase Auth to be ready
    }

    // CRITICAL: Don't process auth changes during user creation
    if (isInUserCreationMode()) {
      console.log('🔒 Auth state change blocked - user creation in progress');
      return;
    }

    const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/forgot-password' || pathname === '/register' || pathname === '/initial-setup';

    if (!firebaseUser) {
      // User is logged out
      setCurrentUser(null);
      if (!isPublicPage) {
        router.push('/login');
      }
      return;
    }

    // User is logged in, get their Firestore document
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      // CRITICAL: Check lock inside snapshot callback too
      if (isInUserCreationMode()) {
        console.log('🔒 Snapshot callback blocked - user creation in progress');
        return;
      }
      
      if (docSnap.exists()) { // If the user document exists, use it.
        const appUser = docSnap.data() as User;
        
        // Check if user is deleted
        if (appUser.isDeleted) {
          console.warn(`User ${firebaseUser.uid} is marked as deleted. Forcing logout.`);
          toast({
            title: 'Account Disabled',
            description: 'Your account has been disabled by an administrator.',
            variant: 'destructive',
          });
          logout();
          return;
        }
        
        if (!appUser.role) {
          console.error(`User document for ${firebaseUser.uid} is missing a role. Forcing logout.`);
          logout();
        } else {
          setCurrentUser(appUser);
          if (isPublicPage && appUser) { // Check appUser to be safe
            // Redirect Super Admins to their specific dashboard
            if (appUser.isSuperAdmin) {
              router.push('/super-admin');
            } else {
              router.push('/dashboard');
            }
          }
        }
      } else {
        // CRITICAL: Don't create default user during user creation
        if (isInUserCreationMode()) {
          console.log('🔒 Skipping default user creation - user creation in progress');
          return;
        }
        
        // If the user document does NOT exist, create a default one.
        // This ensures every authenticated user is represented in Firestore.
        console.warn(`No user document for ${firebaseUser.uid}. Creating default 'Resident' user.`);
        const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || 'New User',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            role: 'Resident', // All auto-created users default to 'Resident'
            residentId: firebaseUser.uid,
            barangayId: 'default', // Assign to default barangay
        };
        setDoc(userDocRef, newUser).catch(err => {
            console.error("Failed to create default user document:", err);
            logout(); // If we can't create the doc, log them out to be safe.
        });
        // The onSnapshot listener will fire again once the document is created, setting the user correctly.
      }
    }, (error) => {
      // Don't show errors during user creation
      if (isInUserCreationMode()) {
        console.log('🔒 Suppressing error during user creation:', error.code);
        return;
      }
      console.error("Error fetching user document:", error);
      logout();
    });

    return () => unsubscribe();
  }, [firebaseUser, isAuthLoading, firestore, pathname, router, logout]);

  const login = async (credential: string, password: string) => {
    if (!auth || !firestore) throw new Error("Auth/Firestore service not available.");

    const email = credential;
    // Store credentials in memory AND sessionStorage for re-login if admin creates a user
    adminCredentials = { email, password };
    sessionStorage.setItem('admin_creds', JSON.stringify({ email, password }));
    console.log('✅ Admin credentials stored for user creation (memory + sessionStorage)');
    
    // Ensure session-only persistence before login
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  };
  
  const signInWithGoogle = async () => {
    if (!auth || !firestore) throw new Error("Authentication service not available.");

    // Ensure session-only persistence before Google sign-in
    await setPersistence(auth, browserSessionPersistence);
    
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const authUser = result.user;

        // After successful sign-in, check if a user document exists.
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // If the user is new, create both a user and a resident document.
            console.log(`New Google user ${authUser.uid}. Creating user and resident documents.`);
            const batch = writeBatch(firestore);

            const residentId = authUser.uid;
            const userId = `R-${authUser.uid.slice(0,6).toUpperCase()}`;

            const newResident: Resident = {
                id: residentId,
                userId: userId,
                firstName: authUser.displayName?.split(' ')[0] || 'New',
                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || 'Resident',
                purok: 'Not specified',
                address: 'Not specified',
                birthdate: new Date().toISOString().split('T')[0], // Placeholder
                householdNumber: 'N/A',
                email: authUser.email || '',
                avatarUrl: authUser.photoURL || `https://picsum.photos/seed/${residentId}/100/100`,
                barangayId: 'default', // Assign to default barangay
            };
            const residentRef = doc(firestore, 'residents', residentId);
            batch.set(residentRef, newResident);

            const newUser: User = {
                id: residentId,
                name: authUser.displayName || 'New User',
                email: authUser.email || '',
                avatarUrl: newResident.avatarUrl,
                role: 'Resident',
                residentId: residentId,
                barangayId: 'default', // Assign to default barangay
            };
            batch.set(userDocRef, newUser);

            await batch.commit();
        }
        // The onSnapshot listener in the main useEffect will handle setting the currentUser
        // and redirecting to the dashboard automatically for both new and existing users.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: 'Google Sign-In Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      }
    }
  };

  const reSignInAdmin = async () => {
    if (!auth || !adminCredentials) return;
    try {
        await setPersistence(auth, browserSessionPersistence);
        await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
    } catch (error) {
        console.error("Failed to re-sign in admin", error);
        // If re-sign-in fails, clear credentials and log out completely
        adminCredentials = null;
        logout();
    }
  };


  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth?.currentUser) throw new Error("You must be logged in to change your password.");

    const user = auth.currentUser;
    const providerId = user.providerData[0]?.providerId;

    // Prevent password change for users who signed in with a social provider
    if (providerId !== 'password') {
      throw new Error(`You cannot change your password because you signed in with ${providerId.replace('.com', '')}.`);
    }

    if (!user.email) throw new Error("Cannot re-authenticate user without an email.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        // We log out the user for security, forcing them to log in with the new password.
        logout();
    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("The current password you entered is incorrect.");
        }
        throw new Error("Failed to change password. Please try again.");
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!auth) throw new Error("Authentication service not available.");
    await sendPasswordResetEmail(auth, email);
  };

  const addResident = async (newResidentData: Omit<Resident, 'id' | 'userId' | 'avatarUrl' | 'address'> & { email: string }) => {
    if (!firestore || !auth) throw new Error("Firebase services are not available.");
    if (!currentUser) throw new Error("You must be logged in to create residents.");
    
    // CRITICAL: Verify admin credentials are stored
    const creds = getAdminCredentials();
    if (!creds?.email || !creds?.password) {
      console.error('❌ Admin credentials not found');
      throw new Error("Session expired. Please log out and log back in to create residents.");
    }
    
    // Update the global variable
    adminCredentials = creds;
    console.log('✅ Admin credentials verified:', creds.email);
    
    // Check if user already exists in Firestore
    const existingUsersQuery = query(collection(firestore, 'users'), where('email', '==', newResidentData.email), limit(1));
    const existingUsersSnap = await getDocs(existingUsersQuery);
    
    if (!existingUsersSnap.empty) {
      throw new Error("A user with this email already exists in the system.");
    }
    
    // CRITICAL: Set lock to prevent auth state changes
    isCreatingUser = true;
    sessionStorage.setItem('creating_user', 'true');
    console.log('🔒 Resident creation lock ENABLED (memory + sessionStorage)');
    
    const defaultPassword = 'password';
    const barangayId = currentUser.barangayId || 'default';
    
    console.log('=== Creating Resident ===');
    console.log('Admin creating resident:', currentUser.email);
    console.log('Admin barangayId:', currentUser.barangayId);
    console.log('New resident email:', newResidentData.email);
    console.log('New resident barangayId (MUST match admin):', barangayId);

    try {
        // Step 1: Create the authentication account
        const userCredential = await createUserWithEmailAndPassword(auth, newResidentData.email, defaultPassword);
        const authUser = userCredential.user;
        console.log('✅ Auth account created:', authUser.uid);
        
        // Step 2: IMMEDIATELY create documents BEFORE any auth state changes
        const batch = writeBatch(firestore);

        const residentId = authUser.uid;
        const userId = `R-${authUser.uid.slice(0,6).toUpperCase()}`;
        
        const newResident: Resident = {
          ...newResidentData,
          id: residentId, 
          userId: userId, 
          address: `${newResidentData.purok}, Brgy. Mina De Oro, Bongabong, Oriental Mindoro`,
          avatarUrl: `https://picsum.photos/seed/${residentId}/100/100`,
          email: newResidentData.email,
          barangayId: barangayId,
        };
        const residentRef = doc(firestore, 'residents', residentId);
        batch.set(residentRef, newResident);

        const newUser: User = {
          id: residentId,
          name: `${newResidentData.firstName} ${newResidentData.lastName}`,
          email: newResidentData.email,
          avatarUrl: newResident.avatarUrl,
          role: 'Resident',
          residentId: residentId,
          barangayId: barangayId,
        };
        const userRef = doc(firestore, 'users', residentId);
        batch.set(userRef, newUser);

        await batch.commit();
        console.log('✅ Resident documents created');
        
        // Step 3: Wait for Firestore write to propagate
        console.log('⏳ Waiting for Firestore write to propagate...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 4: Sign out the new resident IMMEDIATELY
        await signOut(auth);
        console.log('✅ New resident signed out');
        
        // Step 5: Wait before re-auth
        console.log('⏳ Preparing to re-authenticate admin...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Re-authenticate as admin with session persistence
        await setPersistence(auth, browserSessionPersistence);
        await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
        console.log('✅ Admin re-authenticated with session persistence');
        
        // Step 7: Wait for auth state to stabilize
        console.log('⏳ Stabilizing auth state...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Step 8: Verify admin is properly authenticated before releasing lock
        const currentAuthUser = auth.currentUser;
        if (!currentAuthUser || currentAuthUser.email !== adminCredentials.email) {
          console.error('❌ Admin not properly authenticated after resident creation');
          throw new Error('Admin session not properly restored');
        }
        console.log('✅ Admin session verified:', currentAuthUser.email);
        
        // Step 9: Release the lock
        isCreatingUser = false;
        sessionStorage.removeItem('creating_user');
        console.log('🔓 Resident creation lock RELEASED');
        
        // Step 10: Force immediate reload to prevent any error pages
        console.log('🔄 Forcing immediate page reload');
        setTimeout(() => {
          window.location.href = '/residents';
        }, 100);

    } catch (error: any) {
        console.error('❌ Error creating resident:', error);
        
        // CRITICAL: Always release the lock, even on error
        isCreatingUser = false;
        sessionStorage.removeItem('creating_user');
        console.log('🔓 Resident creation lock RELEASED (error recovery - memory + sessionStorage)');
        
        // Emergency recovery: Force admin back in
        try {
          await signOut(auth);
          await new Promise(resolve => setTimeout(resolve, 500));
          await setPersistence(auth, browserSessionPersistence);
          await signInWithEmailAndPassword(auth, adminCredentials.email, adminCredentials.password);
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Admin session recovered');
        } catch (reAuthError) {
          console.error('❌ Failed to recover admin session:', reAuthError);
          // Last resort: reload page and force login
          sessionStorage.removeItem('creating_user');
          window.location.href = '/login';
        }

        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account for this email already exists.");
        }
        throw new Error(error.message || 'Failed to create resident account');
    }
  };

  const updateResident = async (residentId: string, dataToUpdate: Partial<Resident>) => {
    if (!firestore) return;
  
    const residentRef = doc(firestore, 'residents', residentId);
    await updateDoc(residentRef, dataToUpdate);
  
    // Also update the associated user document if needed
    const dataForUser: Partial<User> = {};
    if (dataToUpdate.firstName || dataToUpdate.lastName) {
       // To get the full name, we need the full document
       const residentSnap = await getDoc(residentRef);
       if (residentSnap.exists()) {
           const residentData = residentSnap.data() as Resident;
           // Construct name from potentially partial data
           const newFirstName = dataToUpdate.firstName || residentData.firstName;
           const newLastName = dataToUpdate.lastName || residentData.lastName;
           dataForUser.name = `${newFirstName} ${newLastName}`;
       }
    }
  
    if (Object.keys(dataForUser).length > 0) {
      const userRef = doc(firestore, 'users', residentId);
      await updateDoc(userRef, dataForUser);
    }
  };

  const deleteResident = async (residentId: string) => {
    if (!firestore || !auth) return;
    console.warn("Warning: Deleting Firestore documents only. The Firebase Auth user must be deleted manually from the Firebase Console or via a backend function.");
    
    const batch = writeBatch(firestore);
    const residentRef = doc(firestore, 'residents', residentId);
    const userRef = doc(firestore, 'users', residentId);

    batch.delete(residentRef);
    batch.delete(userRef);
    
    await batch.commit();
  };

  const addDocumentRequest = (request: Omit<DocumentRequest, 'id' | 'trackingNumber' | 'requestDate' | 'status' | 'referenceNumber' | 'barangayId'>) => {
    if (!firestore || !currentUser?.residentId || !currentUser.name || !currentUser.barangayId) {
       toast({
          title: 'Error',
          description: 'Could not identify the current resident. Please log in again.',
          variant: 'destructive',
       });
       return;
    }

    const newId = doc(collection(firestore, 'documentRequests')).id;
    const newIdNumber = (documentRequests?.length ?? 0) + 1;
    const trackingNumber = `IBGY-${new Date().getFullYear().toString().slice(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${String(newIdNumber).padStart(3, '0')}`;
    const newRequest: DocumentRequest = {
        ...request,
        residentId: currentUser.residentId,
        residentName: currentUser.name,
        barangayId: currentUser.barangayId, // Assign to user's barangay
        id: newId,
        requestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Pending',
        trackingNumber: trackingNumber,
        referenceNumber: trackingNumber, // Use tracking number as reference number
    };
    const requestRef = doc(firestore, 'documentRequests', newId);
    setDocumentNonBlocking(requestRef, newRequest, { merge: true });
     toast({
      title: "Request Submitted!",
      description: `Your request for a ${newRequest.documentType} has been received.`,
    });
  };

  const updateDocumentRequestStatus = async (id: string, status: DocumentRequestStatus, paymentDetails?: DocumentRequest['paymentDetails']) => {
    if (!firestore) {
      console.error('Firestore not initialized');
      throw new Error('Firestore not initialized');
    }

    try {
      console.log('updateDocumentRequestStatus called:', { id, status, paymentDetails });
      
      const requestRef = doc(firestore, 'documentRequests', id);
      const updateData: { [key: string]: any } = { status };

      // If status is 'Approved', snapshot the resident's current data
      if (status === 'Approved') {
          const requestSnap = await getDoc(requestRef);
          if (requestSnap.exists()) {
              const requestData = requestSnap.data() as DocumentRequest;
              const residentRef = doc(firestore, 'residents', requestData.residentId);
              const residentSnap = await getDoc(residentRef);
              if (residentSnap.exists()) {
                  const residentData = residentSnap.data() as Resident;
                  // Add a snapshot of resident data to the request document
                  updateData.residentSnapshot = {
                      firstName: residentData.firstName,
                      lastName: residentData.lastName,
                      address: residentData.address,
                      birthdate: residentData.birthdate,
                  };
              }

              // For free documents (amount = 0), automatically skip payment steps
              if (requestData.amount === 0) {
                  updateData.status = 'Payment Verified';
                  updateData.paymentDetails = {
                      method: 'Free',
                      transactionId: 'N/A - Free Document',
                      paymentDate: new Date().toISOString(),
                      screenshotUrl: null,
                  };
                  toast({
                      title: "Free Document Approved",
                      description: "This document is free. Payment steps have been skipped automatically.",
                  });
              }
          }
          updateData.approvalDate = new Date().toISOString();
      }
      
      if (status === 'Released') {
        updateData.releaseDate = new Date().toISOString();
      }
      
      if (status === 'Payment Submitted' && paymentDetails) {
          updateData.paymentDetails = paymentDetails;
          console.log('Adding payment details to update:', paymentDetails);
      }

      console.log('Updating document with data:', updateData);
      await updateDoc(requestRef, updateData);
      console.log('Document updated successfully');
      
    } catch (error) {
      console.error('Error in updateDocumentRequestStatus:', error);
      throw error;
    }
  };
  
  const deleteDocumentRequest = (id: string) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'documentRequests', id);
    deleteDocumentNonBlocking(requestRef);
  };

  const addUser = async (user: Omit<User, 'id' | 'avatarUrl' | 'residentId'> & { password?: string }) => {
    if (!currentUser) throw new Error("You must be logged in to create users.");
    
    const password = user.password || 'password';
    const barangayId = user.barangayId || currentUser.barangayId || 'default';
    
    console.log('=== Creating Staff User (Server-Side) ===');
    console.log('Admin:', currentUser.email);
    console.log('New user:', user.email, user.role);
    
    // Verify barangayId matches admin
    if (barangayId !== currentUser.barangayId) {
      throw new Error('BarangayId mismatch');
    }
    
    try {
        // Call server-side API to create user (NO client auth switching!)
        const response = await fetch('/api/admin/create-staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            password,
            name: user.name,
            role: user.role,
            barangayId,
            adminUid: currentUser.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create staff account');
        }

        console.log('✅ Staff created successfully:', data.userId);
        
        // Show success message
        toast({
          title: 'Staff Account Created',
          description: `${user.name} has been added successfully.`,
        });
        
        // Reload to show new staff
        setTimeout(() => {
          window.location.href = '/users';
        }, 500);

    } catch (error: any) {
        console.error('❌ Error:', error);
        throw new Error(error.message || 'Failed to create user account');
    }
  };

  const updateUser = async (dataToUpdate: Partial<User> & { id: string }) => {
    if (!firestore || !dataToUpdate.id) return;
    const { id, ...updateData } = dataToUpdate;
    const userRef = doc(firestore, 'users', id);
    await updateDoc(userRef, updateData);
  
    // If it's a resident user, update the resident doc too
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().role === 'Resident' && userSnap.data().residentId) {
      const residentRef = doc(firestore, 'residents', userSnap.data().residentId);
      const dataForResident: Partial<Resident> = {};
      if (updateData.name) {
        // Attempt to split name, this is a bit fragile
        const nameParts = updateData.name.split(' ');
        dataForResident.firstName = nameParts[0];
        dataForResident.lastName = nameParts.slice(1).join(' ');
      }
      if (Object.keys(dataForResident).length > 0) {
        await updateDoc(residentRef, dataForResident);
      }
    }
  };
  

  const deleteUser = async (userId: string) => {
    if (!firestore || !currentUser) return;
    
    try {
      const userRef = doc(firestore, 'users', userId);
      
      // Soft delete: Mark as deleted instead of removing
      await updateDoc(userRef, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.id,
        // Disable login by changing role
        role: 'Resident', // Demote to resident to remove staff permissions
      });
      
      console.log('✅ User marked as deleted in Firestore');
      
      toast({
        title: 'User Account Disabled',
        description: 'The user account has been disabled. They can no longer log in with staff permissions.',
      });
      
      // Note: Firebase Auth account remains but user cannot access staff features
      console.warn('Note: Firebase Auth account still exists but user is marked as deleted and demoted to Resident role.');
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete user account.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      barangayConfig,
      documentPricing: barangayConfig?.documentPricing || null,
      logout,
      residents,
      addResident,
      updateResident,
      deleteResident,
      documentRequests,
      addDocumentRequest,
      updateDocumentRequestStatus,
      deleteDocumentRequest,
      users,
      addUser,
      updateUser,
      deleteUser,
      isDataLoading,
      login,
      changePassword,
      sendPasswordReset,
      signInWithGoogle,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppProviderContent>{children}</AppProviderContent>
    </FirebaseClientProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
