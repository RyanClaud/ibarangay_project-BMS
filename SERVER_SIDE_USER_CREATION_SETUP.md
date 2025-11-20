# Server-Side User Creation Setup Guide

## Why This Solution?

The **ONLY** way to create Firebase Auth users without affecting the client's authentication state is to use **Firebase Admin SDK on the server side**.

### Previous Approach (Client-Side):
- ❌ `createUserWithEmailAndPassword()` automatically signs in the new user
- ❌ Admin gets signed out
- ❌ Causes permission errors
- ❌ Shows white error screens
- ❌ Complex lock mechanisms needed
- ❌ Unreliable and error-prone

### New Approach (Server-Side):
- ✅ Admin SDK creates users without affecting client session
- ✅ Admin stays logged in
- ✅ No permission errors
- ✅ No white error screens
- ✅ No lock mechanisms needed
- ✅ Clean, reliable, professional solution

## Setup Instructions

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. **IMPORTANT**: Keep this file secure! Never commit it to git!

### Step 3: Create Environment Variables

Create a `.env.local` file in your project root:

```env
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Get these values from the downloaded JSON file:**
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

**IMPORTANT**: 
- The private key must be wrapped in quotes
- Keep the `\n` characters (they represent newlines)
- Never commit `.env.local` to git (it's in `.gitignore`)

### Step 4: Update .gitignore

Make sure `.env.local` is in your `.gitignore`:

```
.env.local
.env*.local
```

### Step 5: Restart Development Server

```bash
npm run dev
```

## How It Works

### Old Flow (Client-Side):
```
1. Admin clicks "Create Staff"
2. Client calls createUserWithEmailAndPassword()
3. New staff is automatically signed in ❌
4. Admin is signed out ❌
5. Permission errors occur ❌
6. Complex re-authentication needed ❌
7. White error screens appear ❌
```

### New Flow (Server-Side):
```
1. Admin clicks "Create Staff"
2. Client calls API route /api/admin/create-staff
3. Server uses Admin SDK to create user ✅
4. Admin stays logged in ✅
5. No permission errors ✅
6. No re-authentication needed ✅
7. Clean success message ✅
```

## API Route Details

**Endpoint**: `POST /api/admin/create-staff`

**Request Body**:
```json
{
  "email": "staff@example.com",
  "password": "password123",
  "name": "Staff Name",
  "role": "Secretary",
  "barangayId": "ABC123",
  "adminUid": "admin-user-id"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Staff account created successfully",
  "userId": "new-user-id"
}
```

**Response (Error)**:
```json
{
  "error": "Error message here"
}
```

## Security

### Server-Side Validation:
1. ✅ Verifies requesting user is an admin
2. ✅ Checks admin has proper role
3. ✅ Validates all required fields
4. ✅ Handles duplicate email errors
5. ✅ Logs all operations

### Environment Variables:
- ✅ Stored in `.env.local` (not committed to git)
- ✅ Only accessible on server side
- ✅ Never exposed to client
- ✅ Secure credential management

## Testing

### Test Staff Creation:
```
1. Log in as admin
2. Go to Staff & Users page
3. Click "Add Staff"
4. Fill in details:
   - Name: "Test Secretary"
   - Email: "secretary@test.com"
   - Role: "Secretary"
   - Password: "password123"
5. Click "Create Staff Account"
6. EXPECTED: Success message
7. EXPECTED: Admin stays logged in
8. EXPECTED: No error screens
9. EXPECTED: Page reloads showing new staff
10. EXPECTED: New staff can log in with their credentials
```

### Verify in Firebase Console:
```
1. Go to Firebase Console
2. Authentication > Users
3. EXPECTED: New user appears in list
4. Firestore > users collection
5. EXPECTED: User document exists with correct role and barangayId
```

## Troubleshooting

### Error: "Missing environment variables"
- Check `.env.local` file exists
- Verify all three variables are set
- Restart development server

### Error: "Unauthorized: Only admins can create staff"
- Verify you're logged in as admin
- Check your user document has role: "Admin"
- Check adminUid is being sent correctly

### Error: "An account with this email already exists"
- Email is already in use
- Check Firebase Console > Authentication
- Use a different email

### Error: "Failed to initialize Firebase Admin"
- Check private key format (must have `\n` characters)
- Verify project ID is correct
- Check client email is correct
- Restart development server

## Production Deployment

### Vercel:
1. Go to project settings
2. Environment Variables section
3. Add all three variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Redeploy

### Other Platforms:
- Add environment variables in platform settings
- Ensure they're available at build time
- Restart/redeploy application

## Benefits

### For Development:
- ✅ No more white error screens
- ✅ No complex debugging
- ✅ Clean, predictable behavior
- ✅ Professional solution

### For Users:
- ✅ Smooth staff creation
- ✅ No confusing errors
- ✅ Fast and reliable
- ✅ Admin stays logged in

### For Maintenance:
- ✅ Less code complexity
- ✅ Easier to understand
- ✅ Standard Firebase pattern
- ✅ Well-documented approach

## Alternative: Keep Client-Side for Residents

Since residents now register themselves, you can keep the client-side approach for resident registration (it's fine because they're creating their own account, not someone else's).

**Staff Creation**: Server-side (Admin SDK) ✅
**Resident Registration**: Client-side (self-registration) ✅

This is the best of both worlds!

## Summary

Server-side user creation using Firebase Admin SDK is:
- ✅ The **ONLY** reliable solution
- ✅ Industry standard approach
- ✅ Eliminates all authentication issues
- ✅ Professional and maintainable
- ✅ Secure and scalable

**This is how it should be done!**
