# Fix: "Could not identify the current resident" Error

## Problem

When residents try to request documents, they get the error:
> "Could not identify the current resident. Please log in again."

## Root Cause

The resident document was created with an **auto-generated ID** instead of using the **user's UID** as the document ID. This causes a mismatch when the system tries to find the resident record.

### What Happened:
1. During registration, `addDoc()` was used → Created document with random ID (e.g., `abc123xyz`)
2. User document has `residentId: [user-uid]`
3. System looks for resident document with ID = `[user-uid]`
4. ❌ Document not found because ID is `abc123xyz`, not `[user-uid]`

## Solution

### Option 1: Fix via Firebase Console (Recommended - Immediate Fix)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project
   - Navigate to Firestore Database

2. **Find the Resident Document**
   - Go to `residents` collection
   - Find the document for the affected user (search by name or email)
   - Note the current document ID (e.g., `abc123xyz`)
   - Note the `userId` field value (this is the correct ID)

3. **Copy the Document**
   - Click on the document
   - Copy all field values
   - Click "Add document" in the `residents` collection
   - **Document ID**: Paste the `userId` value (the user's UID)
   - Add all the same fields with their values
   - Make sure to add/update the `id` field to match the document ID
   - Click "Save"

4. **Delete the Old Document**
   - Go back to the old document (with the wrong ID)
   - Click the three dots → Delete
   - Confirm deletion

5. **Test**
   - Log out and log back in as the resident
   - Try requesting a document
   - ✅ Should work now!

### Option 2: Fix via Script (For Multiple Residents)

If you have many residents with this issue, use the migration script:

```bash
# This requires Firebase Admin SDK credentials
npx tsx src/scripts/fix-resident-ids.ts
```

**Note**: This script needs proper Firebase Admin permissions.

### Option 3: Re-register (Quick but loses data)

If the resident just registered and has no important data:

1. Delete the user from Firebase Authentication
2. Delete the resident document from Firestore
3. Delete the user document from Firestore
4. Register again (the fix is now in place)

## Prevention (Already Fixed)

The registration code has been updated to prevent this issue:

**Before** (caused the problem):
```typescript
await addDoc(collection(firestore, 'residents'), {
  userId: userCredential.user.uid,
  // ... other fields
});
```

**After** (fixed):
```typescript
await setDoc(doc(firestore, 'residents', userCredential.user.uid), {
  id: userCredential.user.uid,
  userId: userCredential.user.uid,
  // ... other fields
});
```

Now the resident document ID will always match the user's UID.

## Step-by-Step Fix for Your Current Issue

Since you're registered as a resident of "Mina de Oro", here's what to do:

### Quick Fix Steps:

1. **Get Your User ID**:
   - Open browser console (F12)
   - Go to Application → Local Storage
   - Find your Firebase auth token
   - Or check the `users` collection in Firestore for your email

2. **In Firebase Console**:
   ```
   Firestore → residents collection
   → Find document with your name/email
   → Note the document ID (let's call it OLD_ID)
   → Note the userId field (let's call it USER_UID)
   ```

3. **Create New Document**:
   ```
   Click "Add document"
   Document ID: [paste USER_UID]
   
   Copy all fields from the old document:
   - id: [USER_UID]
   - userId: [USER_UID]
   - firstName: [your first name]
   - lastName: [your last name]
   - email: [your email]
   - barangayId: [barangay ID]
   - barangayName: "Mina de Oro"
   - municipality: "Bongabong"
   - province: "Oriental Mindoro"
   - region: "MIMAROPA"
   - purok: [your purok]
   - address: [your address]
   - birthdate: [your birthdate]
   - contactNumber: [your contact]
   - householdNumber: ""
   - avatarUrl: ""
   - createdAt: [timestamp]
   
   Click Save
   ```

4. **Delete Old Document**:
   ```
   Go to the old document (with OLD_ID)
   Click three dots → Delete
   ```

5. **Test**:
   ```
   Log out
   Log back in
   Try requesting a certificate
   ✅ Should work!
   ```

## Verification

After fixing, verify the structure is correct:

### Correct Structure:
```
residents/
  └── [user-uid]/          ← Document ID matches user UID
      ├── id: [user-uid]   ← Field matches document ID
      ├── userId: [user-uid]
      ├── firstName: "Juan"
      ├── lastName: "Dela Cruz"
      └── ... other fields

users/
  └── [user-uid]/          ← Same UID
      ├── id: [user-uid]
      ├── residentId: [user-uid]  ← Points to resident doc
      └── ... other fields
```

### How to Verify:
1. Check that `residents/[user-uid]` exists
2. Check that `residents/[user-uid]/id` equals `[user-uid]`
3. Check that `users/[user-uid]/residentId` equals `[user-uid]`
4. All three should be the same value

## Future Registrations

All new registrations will automatically use the correct structure. This fix only needs to be applied to existing residents who registered before the code was updated.

## Need Help?

If you're still having issues:

1. Check browser console for errors
2. Verify you're logged in
3. Check that the resident document exists with correct ID
4. Verify Firestore rules allow reading resident documents
5. Try logging out and back in

## Summary

- ✅ Registration code fixed (new users won't have this issue)
- 🔧 Existing users need document ID migration
- 📝 Use Firebase Console for quick manual fix
- 🤖 Use migration script for bulk fixes
- ✨ After fix, document requests will work properly
