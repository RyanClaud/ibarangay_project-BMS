# IMMEDIATE FIX: Resident Document Request Error

## Problem
You're getting this error when trying to request a certificate:
> "Could not identify the current resident. Please log in again."

## Quick Fix (Choose One)

### Option 1: Firebase Console (Fastest - 2 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project
   - Click "Firestore Database"

2. **Find Your Resident Document**
   - Click on `residents` collection
   - Look for your document (search for "Mina de Oro" or your name)
   - Click on the document to open it

3. **Note These Values**
   - Document ID (shown at the top): `_____________` (OLD_ID)
   - `userId` field value: `_____________` (USER_UID)

4. **Create New Document**
   - Go back to `residents` collection
   - Click "Add document"
   - **Document ID**: Paste the USER_UID value (from step 3)
   - Click "Add field" for each field and copy from old document:
     ```
     id: [paste USER_UID]
     userId: [paste USER_UID]
     firstName: [your first name]
     lastName: [your last name]
     middleName: [your middle name]
     email: [your email]
     barangayId: [copy from old doc]
     barangayName: "Mina de Oro"
     municipality: "Bongabong"
     province: "Oriental Mindoro"
     region: "MIMAROPA"
     purok: [your purok]
     address: [your full address]
     birthdate: [your birthdate]
     contactNumber: [your contact number]
     householdNumber: ""
     avatarUrl: ""
     createdAt: [copy from old doc]
     ```
   - Click "Save"

5. **Delete Old Document**
   - Go back to the old document (with OLD_ID)
   - Click the three dots (⋮) at the top
   - Click "Delete document"
   - Confirm deletion

6. **Test**
   - Go back to your app
   - Log out
   - Log back in
   - Try requesting a certificate
   - ✅ Should work now!

### Option 2: Use Fix Tool (Automated)

1. **Navigate to the fix page**
   ```
   http://localhost:9002/fix-resident-id.html
   ```

2. **Make sure you're logged in**
   - If not, log in first at `/login`

3. **Click "Fix My Resident Document"**
   - The tool will automatically:
     - Find your resident document
     - Create a new one with correct ID
     - Delete the old one
     - Prompt you to log out

4. **Log out and back in**
   - Click "Yes" when prompted
   - Or manually log out and log back in

5. **Test**
   - Try requesting a certificate
   - ✅ Should work now!

### Option 3: Re-register (If Just Registered)

If you just registered and have no important data:

1. **Delete your account** (via Firebase Console):
   - Authentication → Users → Find your email → Delete
   - Firestore → residents → Find your doc → Delete
   - Firestore → users → Find your doc → Delete

2. **Register again**
   - Go to `/register`
   - Fill in your information
   - Submit
   - ✅ Will work correctly now!

## Why This Happened

The registration system was using auto-generated IDs for resident documents instead of using your user ID. This has been fixed in the code, so new registrations won't have this issue.

## Verification

After fixing, verify it worked:

1. **Check Firestore**:
   - Go to `residents` collection
   - Find document with ID matching your user ID
   - Verify the `id` field matches the document ID

2. **Test in App**:
   - Log out
   - Log back in
   - Go to "Request Document"
   - You should see your information auto-filled
   - Submit a request
   - ✅ Should work without errors!

## Still Having Issues?

If the error persists:

1. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear all data
   - Refresh page

2. **Check browser console**
   - Press F12
   - Look for errors in Console tab
   - Share error messages if asking for help

3. **Verify Firestore structure**:
   ```
   residents/
     └── [your-user-uid]/
         ├── id: [your-user-uid]  ← Must match!
         ├── userId: [your-user-uid]
         └── ... other fields
   
   users/
     └── [your-user-uid]/
         ├── residentId: [your-user-uid]  ← Must match!
         └── ... other fields
   ```

## Prevention

This issue is now fixed in the code. All new residents who register will automatically have the correct document structure.

## Summary

- ✅ Code fixed (new users won't have this issue)
- 🔧 Existing users need one-time fix
- ⏱️ Takes 2-5 minutes to fix
- 🎯 Choose Option 1 (Firebase Console) for most reliable fix
- ✨ After fix, document requests will work perfectly

## Need Help?

If you're still stuck:
1. Take screenshots of the error
2. Check the browser console (F12)
3. Verify you completed all steps
4. Try Option 1 (Firebase Console) if other options didn't work
