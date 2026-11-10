import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';

/**
 * POST /api/admin/reset-password
 *
 * Resets a user's Firebase Auth password. Only Admin and Super Admin
 * can call this. Non-super-admins can only reset passwords for users
 * in their own barangay.
 *
 * Request body:
 *   { targetUid, newPassword, adminUid }
 *
 * Response:
 *   200 { success: true, message, temporaryPassword }
 *   400 { error: "..." }
 *   403 { error: "Insufficient permissions" }
 *   404 { error: "User not found in Firebase Auth" }
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const body = await request.json();
    const { targetUid, newPassword, adminUid } = body;

    // ── Validate required fields ──
    if (!targetUid || !newPassword || !adminUid) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUid, newPassword, adminUid' },
        { status: 400 },
      );
    }

    // Firebase Auth requires passwords to be at least 6 characters
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 },
      );
    }

    // ── Verify the caller has permission ──
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 403 },
      );
    }

    const adminData = adminDoc.data();
    const isCallerSuperAdmin = adminData?.isSuperAdmin === true;
    const isCallerAdmin = adminData?.role === 'Admin';

    if (!isCallerAdmin && !isCallerSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Admin or Super Admin can reset passwords.' },
        { status: 403 },
      );
    }

    // ── Verify the target user exists and check barangay scoping ──
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      return NextResponse.json(
        { error: 'Target user not found in database' },
        { status: 404 },
      );
    }

    const targetData = targetDoc.data();

    // Non-super-admins can only reset passwords for users in their own barangay
    if (!isCallerSuperAdmin) {
      const adminBarangayId = adminData?.barangayId;
      const targetBarangayId = targetData?.barangayId;

      if (adminBarangayId !== targetBarangayId) {
        return NextResponse.json(
          { error: 'You can only reset passwords for users in your own barangay' },
          { status: 403 },
        );
      }
    }

    // Prevent resetting your own password through this route
    // (use the Change Password feature in Settings instead)
    if (targetUid === adminUid) {
      return NextResponse.json(
        { error: 'Use the Change Password feature in Settings to change your own password' },
        { status: 400 },
      );
    }

    // ── Reset the password via Firebase Admin SDK ──
    await adminAuth.updateUser(targetUid, {
      password: newPassword,
    });

    console.log(`✅ Password reset for user ${targetUid} by admin ${adminUid}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: newPassword,
    });
  } catch (error: any) {
    console.error('❌ Error resetting password:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found in Firebase Authentication. This account may not have an Auth record.' },
        { status: 404 },
      );
    }

    if (error.code === 'auth/invalid-password') {
      return NextResponse.json(
        { error: 'Password does not meet Firebase requirements (minimum 6 characters)' },
        { status: 400 },
      );
    }

    if (error.message?.includes('not initialized')) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact the administrator.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 },
    );
  }
}

// Disable static generation for this API route
export const dynamic = 'force-dynamic';
