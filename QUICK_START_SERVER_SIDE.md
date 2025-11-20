# Quick Start: Server-Side User Creation

## TL;DR - 3 Steps to Fix

### 1. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 2. Get Service Account Key
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download JSON file

### 3. Create `.env.local` file
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
```

Copy values from the downloaded JSON file.

### 4. Restart Server
```bash
npm run dev
```

## Done!

Now when you create staff:
- ✅ No white error screens
- ✅ Admin stays logged in
- ✅ Clean, professional experience

## Files Created:
- ✅ `src/app/api/admin/create-staff/route.ts` - Server-side API
- ✅ `.env.local.example` - Template for environment variables
- ✅ Updated `src/contexts/app-context.tsx` - Uses API instead of client SDK

## Test It:
1. Log in as admin
2. Create a staff member
3. Watch it work perfectly! 🎉

No more errors!
