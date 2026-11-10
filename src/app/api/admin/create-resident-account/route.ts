import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';

/**
 * POST /api/admin/create-resident-account
 * 
 * Provisions or activates a login user account in Firebase Auth and /users
 * for an existing demographic resident record in /residents.
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const body = await request.json();
    const { residentId, email, password, adminUid } = body;

    // Validate required fields
    if (!residentId || !email || !password || !adminUid) {
      return NextResponse.json(
        { error: 'Missing required fields: residentId, email, password, adminUid' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 1. Verify caller permission
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 403 });
    }

    const adminData = adminDoc.data();
    const isCallerSuperAdmin = adminData?.isSuperAdmin === true;
    const isCallerAdmin =
      adminData?.role === 'Admin' ||
      adminData?.role === 'Barangay Captain' ||
      adminData?.role === 'Secretary';

    if (!isCallerAdmin && !isCallerSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Admin or Captain can activate resident accounts.' },
        { status: 403 }
      );
    }

    // 2. Fetch resident
    const residentDoc = await adminDb.collection('residents').doc(residentId).get();
    if (!residentDoc.exists) {
      return NextResponse.json({ error: 'Resident record not found' }, { status: 404 });
    }

    const residentData = residentDoc.data()!;

    // Scoping check: non-super-admins can only activate residents in their own barangay
    if (!isCallerSuperAdmin && adminData?.barangayId !== residentData.barangayId) {
      return NextResponse.json(
        { error: 'You can only manage residents registered in your own barangay' },
        { status: 403 }
      );
    }

    const residentFullName =
      `${residentData.firstName || ''} ${residentData.lastName || ''}`.trim() || 'Resident';

    // 3. Create or retrieve Firebase Auth user
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      // Update password for existing user account
      await adminAuth.updateUser(userRecord.uid, {
        password: password,
        displayName: residentFullName,
      });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: residentFullName,
        });
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;

    // 4. Create or update user doc in /users
    const userPayload = {
      id: uid,
      name: residentFullName,
      email: email,
      role: 'Resident',
      residentId: residentId,
      barangayId: residentData.barangayId || adminData?.barangayId || 'default',
      status: 'Active',
      isDeleted: false,
      avatarUrl: residentData.avatarUrl || `https://picsum.photos/seed/${uid}/100/100`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(uid).set(userPayload, { merge: true });

    // 5. Update /residents doc with userId and email
    await adminDb.collection('residents').doc(residentId).set(
      {
        userId: uid,
        email: email,
        hasLoginAccount: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ Activated portal account for resident ${residentFullName} (${uid})`);

    return NextResponse.json({
      success: true,
      message: `Login account activated for ${residentFullName}`,
      userId: uid,
      email,
    });
  } catch (error: any) {
    console.error('❌ Error creating resident account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate resident account' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

