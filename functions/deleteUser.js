/**
 * Firebase Cloud Function to delete user from Authentication
 * 
 * Deploy this function to enable complete user deletion including Auth account
 * 
 * Setup:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize functions: firebase init functions
 * 3. Deploy: firebase deploy --only functions
 * 
 * Usage:
 * Call this function from your app when admin deletes a user
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Callable function to delete a user
 * Can only be called by Admin or Super Admin
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete accounts'
    );
  }

  const callerUid = context.auth.uid;
  const userIdToDelete = data.userId;

  if (!userIdToDelete) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId is required'
    );
  }

  try {
    // Get caller's user document to check permissions
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Caller user document not found'
      );
    }

    const callerData = callerDoc.data();
    const isAdmin = callerData.role === 'Admin' || callerData.isSuperAdmin === true;

    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can delete user accounts'
      );
    }

    // Get the user to delete
    const userToDeleteDoc = await admin.firestore()
      .collection('users')
      .doc(userIdToDelete)
      .get();

    if (!userToDeleteDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User to delete not found'
      );
    }

    const userToDeleteData = userToDeleteDoc.data();

    // Prevent deleting super admins (unless caller is also super admin)
    if (userToDeleteData.isSuperAdmin && !callerData.isSuperAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete super admin accounts'
      );
    }

    // Prevent deleting users from different barangays (unless super admin)
    if (!callerData.isSuperAdmin && 
        userToDeleteData.barangayId !== callerData.barangayId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete users from other barangays'
      );
    }

    // Delete from Firebase Authentication
    await admin.auth().deleteUser(userIdToDelete);
    console.log(`Deleted auth account for user: ${userIdToDelete}`);

    // Delete from Firestore
    await admin.firestore()
      .collection('users')
      .doc(userIdToDelete)
      .delete();
    console.log(`Deleted Firestore document for user: ${userIdToDelete}`);

    // If user has a resident profile, delete that too
    if (userToDeleteData.residentId) {
      await admin.firestore()
        .collection('residents')
        .doc(userToDeleteData.residentId)
        .delete();
      console.log(`Deleted resident profile: ${userToDeleteData.residentId}`);
    }

    return {
      success: true,
      message: 'User account deleted successfully',
      deletedUserId: userIdToDelete,
    };

  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete user account',
      error.message
    );
  }
});

/**
 * Example usage from client:
 * 
 * import { getFunctions, httpsCallable } from 'firebase/functions';
 * 
 * const functions = getFunctions();
 * const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
 * 
 * try {
 *   const result = await deleteUserAccount({ userId: 'user-id-to-delete' });
 *   console.log(result.data.message);
 * } catch (error) {
 *   console.error('Error:', error.message);
 * }
 */
