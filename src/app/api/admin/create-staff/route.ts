import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, barangayId, adminUid } = body;

    // Validate required fields
    if (!email || !password || !name || !role || !barangayId || !adminUid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the admin user exists and has permission
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    if (!adminData?.role || (adminData.role !== 'Admin' && !adminData.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create the Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);

    // Create the Firestore user document
    const newUser = {
      id: userRecord.uid,
      name,
      email,
      role,
      barangayId,
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newUser);
    console.log('✅ Firestore user document created');

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'Staff account created successfully',
    });

  } catch (error: any) {
    console.error('❌ Error creating staff:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create staff account' },
      { status: 500 }
    );
  }
}
