# 🔧 Fix: Barangay Admin Cannot Create Staff

## Problem

Barangay admins are getting a "Server configuration error" when trying to create new staff accounts. The error occurs because Firebase Admin SDK is not properly initialized on Vercel.

**Error Message:**
```
Firebase: Need to provide options, when not being deployed to hosting via source. (app/no-options)
POST /api/admin/create-staff 500 (Internal Server Error)
Error: Server configuration error. Please contact administrator.
```

---

## Root Cause

The Firebase Admin SDK requires environment variables that are **missing on Vercel**:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These variables exist in your local `.env.local` file but are not configured on Vercel.

---

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: **ibarangay-project-bms**
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in the left sidebar

### Step 2: Add Required Environment Variables

Add these **3 environment variables** one by one:

#### Variable 1: NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: studio-1858135779-a881a
Environment: Production, Preview, Development (select all)
```

#### Variable 2: FIREBASE_CLIENT_EMAIL
```
Name: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-fbsvc@studio-1858135779-a881a.iam.gserviceaccount.com
Environment: Production, Preview, Development (select all)
```

#### Variable 3: FIREBASE_PRIVATE_KEY
```
Name: FIREBASE_PRIVATE_KEY
Value: [GET FROM FIREBASE CONSOLE - See instructions below]
Environment: Production, Preview, Development (select all)
```

**How to get your Firebase Private Key:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Copy the "private_key" value from the JSON
7. Paste it in Vercel (include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)

**IMPORTANT:** Never share or commit your private key!

**IMPORTANT for FIREBASE_PRIVATE_KEY:**
- Copy the ENTIRE private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Include all the newlines (the key should be multi-line)
- Vercel will handle the formatting automatically

### Step 3: Save and Redeploy

1. Click **"Save"** for each environment variable
2. Go to **"Deployments"** tab
3. Click the **"..."** menu on the latest deployment
4. Select **"Redeploy"**
5. Wait for deployment to complete (2-3 minutes)

---

## Alternative: Add via Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Enter value: studio-1858135779-a881a
# Select: Production, Preview, Development

vercel env add FIREBASE_CLIENT_EMAIL
# Enter value: firebase-adminsdk-fbsvc@studio-1858135779-a881a.iam.gserviceaccount.com
# Select: Production, Preview, Development

vercel env add FIREBASE_PRIVATE_KEY
# Paste the entire private key (multi-line)
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

---

## Verification Steps

After adding environment variables and redeploying:

### 1. Check Vercel Logs
1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check the **"Functions"** logs
4. Look for: `✅ Firebase Admin SDK initialized`

### 2. Test Staff Creation
1. Login as barangay admin
2. Go to Users page
3. Click "Add User"
4. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Role: Secretary
   - Password: testpassword
5. Click "Create User"
6. Should see: ✅ "Staff account created successfully"

### 3. Check Browser Console
- Should NOT see: `Firebase: Need to provide options`
- Should see: `✅ Firebase Auth user created`

---

## Troubleshooting

### Issue 1: Still Getting "Server configuration error"

**Solution:**
1. Verify all 3 environment variables are added
2. Check that you selected all environments (Production, Preview, Development)
3. Make sure FIREBASE_PRIVATE_KEY includes the full key with headers
4. Redeploy the application

### Issue 2: "Invalid private key"

**Solution:**
1. The private key must be in the correct format
2. Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. Preserve all newlines in the key
4. Don't add extra quotes or escape characters

### Issue 3: Environment variables not loading

**Solution:**
1. Clear Vercel build cache:
   - Settings → Build & Development Settings
   - Click "Clear Build Cache"
2. Redeploy with cache cleared
3. Wait for fresh build to complete

---

## Security Notes

### ⚠️ Important Security Considerations:

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore` ✅
   - Contains sensitive credentials

2. **Rotate keys if exposed**
   - If private key is accidentally exposed, generate new one
   - Update in Firebase Console and Vercel

3. **Limit Firebase Admin permissions**
   - Service account should have minimum required permissions
   - Review Firebase IAM settings

4. **Monitor usage**
   - Check Firebase Console for unusual activity
   - Set up billing alerts

---

## How It Works

### Firebase Admin SDK Initialization

```typescript
// src/firebase/admin.ts
function initializeAdmin() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // These must be set on Vercel!
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ Firebase Admin SDK not initialized');
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}
```

### Staff Creation Flow

1. **Admin clicks "Add User"** in dashboard
2. **Form submitted** to `/api/admin/create-staff`
3. **Server-side API route** uses Firebase Admin SDK
4. **Creates Firebase Auth user** with email/password
5. **Creates Firestore document** with user details
6. **Returns success** to client

---

## Expected Behavior After Fix

### ✅ Success Indicators:

1. **No console errors** about Firebase options
2. **Staff creation succeeds** without errors
3. **New user appears** in Users list
4. **User can login** with created credentials
5. **Firestore document** created correctly

### 📊 Logs You Should See:

```
✅ Firebase Admin SDK initialized
✅ Firebase Auth user created: abc123xyz
✅ Firestore user document created
✅ Staff account created successfully
```

---

## Quick Reference

### Environment Variables Needed:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `studio-1858135779-a881a` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@...` | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` | Firebase Console → Service Accounts → Generate Key |

### Vercel Dashboard Path:
```
Dashboard → Project → Settings → Environment Variables
```

### Redeploy Command:
```bash
vercel --prod
```

---

## Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## Summary

**Problem:** Firebase Admin SDK not initialized on Vercel
**Cause:** Missing environment variables
**Solution:** Add 3 environment variables to Vercel
**Time to Fix:** 5 minutes
**Result:** Staff creation works perfectly ✅

---

**After following this guide, barangay admins will be able to create staff accounts successfully!** 🎉

*Last updated: February 2026*
