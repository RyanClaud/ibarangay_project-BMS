# Fix Secretary User Document - Quick Solution

## Problem

The secretary account exists in Firebase Authentication but the user document in Firestore is missing the `role` or `barangayId` field, causing permission errors.

## Quick Fix via Firebase Console (2 minutes)

### Step 1: Find the Secretary's User Document

1. **Open Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Go to Firestore Database**
4. **Open `users` collection**
5. **Find the secretary's document**:
   - Look for email: `secretary@ibarangayminadeoro.com`
   - Or look for UID: `YNHf4DcjkdaQNABytbgWCqZzSVu1`

### Step 2: Check Current Fields

The document should have these fields:
```javascript
{
  id: "YNHf4DcjkdaQNABytbgWCqZzSVu1",
  name: "Secretary Name",
  email: "secretary@ibarangayminadeoro.com",
  role: "Secretary",  // ← Check this!
  barangayId: "[barangay-id]",  // ← Check this!
  isSuperAdmin: false,
  avatarUrl: "..."
}
```

### Step 3: Fix Missing or Wrong Fields

If `role` is missing or wrong:
1. Click on the document
2. Click "Add field" or edit existing field
3. Field name: `role`
4. Field type: `string`
5. Field value: `Secretary` (exact spelling, capital S)
6. Click "Update"

If `barangayId` is missing:
1. Go back to `users` collection
2. Find the admin user document (email: `admin@ibarangayminadeoro.com`)
3. Copy the `barangayId` value
4. Go back to secretary's document
5. Click "Add field"
6. Field name: `barangayId`
7. Field type: `string`
8. Field value: [paste the barangayId from admin]
9. Click "Update"

### Step 4: Verify and Test

1. **Log out** from the secretary account (if logged in)
2. **Close all browser tabs**
3. **Clear browser cache**: `Ctrl + Shift + Delete`
4. **Open new tab** and go to your app
5. **Log in as secretary**:
   - Email: `secretary@ibarangayminadeoro.com`
   - Password: [the password you set]
6. ✅ **Should work now!**

## Alternative: Delete and Recreate

If the above doesn't work, delete and recreate the account:

### Step 1: Delete Old Account

**In Firebase Console:**

1. **Authentication** → **Users**
   - Find: `secretary@ibarangayminadeoro.com`
   - Click three dots → Delete
   - Confirm deletion

2. **Firestore Database** → **users** collection
   - Find the secretary's document
   - Click three dots → Delete document
   - Confirm deletion

### Step 2: Create New Account

**In your app:**

1. **Log in as admin**
2. **Go to Users page**
3. **Click "Add User"**
4. **Fill in**:
   - Name: `Maria Santos` (or secretary's name)
   - Email: `secretary@ibarangayminadeoro.com`
   - Role: `Secretary`
   - Password: `SecretaryMDO2024!` (or your chosen password)
5. **Click "Save User"**
6. **Verify success message**
7. **Log out as admin**
8. **Log in as secretary** with new credentials

## Verification Checklist

After fixing, verify the secretary's user document has:

- [ ] `id` field matches the document ID
- [ ] `name` field is set
- [ ] `email` is `secretary@ibarangayminadeoro.com`
- [ ] `role` is exactly `"Secretary"` (capital S)
- [ ] `barangayId` matches the admin's barangayId
- [ ] `isSuperAdmin` is `false`
- [ ] `avatarUrl` is set (can be empty string)

## Common Issues

### Issue 1: Role is "Resident" instead of "Secretary"
**Fix**: Edit the document, change `role` to `"Secretary"`

### Issue 2: barangayId is missing
**Fix**: Copy from admin user document and add to secretary document

### Issue 3: barangayId is "default"
**Fix**: Change to the actual Mina de Oro barangay ID (copy from admin)

### Issue 4: Document doesn't exist
**Fix**: Delete from Authentication and recreate via Add User dialog

## Expected Document Structure

```javascript
// Correct secretary user document
{
  id: "YNHf4DcjkdaQNABytbgWCqZzSVu1",
  name: "Maria Santos",
  email: "secretary@ibarangayminadeoro.com",
  role: "Secretary",  // Must be exactly "Secretary"
  barangayId: "abc123xyz",  // Must match admin's barangayId
  isSuperAdmin: false,
  avatarUrl: "https://picsum.photos/seed/YNHf4DcjkdaQNABytbgWCqZzSVu1/100/100"
}
```

## Why This Happens

The permission error occurs because:

1. Firestore rules check if user is staff by reading their `role` field
2. If `role` is missing or wrong, `isStaff()` returns false
3. If `isStaff()` is false, user can't list residents
4. Result: Permission denied error

## Prevention

To prevent this in the future:

1. **Always verify** user document after creating staff accounts
2. **Check Firebase Console** to ensure fields are set correctly
3. **Test login** immediately after creating account
4. **Document the barangayId** for your barangay for reference

## Quick Reference

**Secretary UID**: `YNHf4DcjkdaQNABytbgWCqZzSVu1`
**Email**: `secretary@ibarangayminadeoro.com`
**Required Role**: `"Secretary"` (exact spelling)
**Required barangayId**: [copy from admin user]

## Summary

1. ✅ Open Firebase Console
2. ✅ Go to Firestore → users collection
3. ✅ Find secretary's document (UID: YNHf4DcjkdaQNABytbgWCqZzSVu1)
4. ✅ Verify/add `role: "Secretary"`
5. ✅ Verify/add `barangayId: [admin's barangayId]`
6. ✅ Save changes
7. ✅ Clear browser cache
8. ✅ Log in as secretary
9. ✅ Should work!

If you follow these steps, the secretary account will work properly and have access to residents and documents from Mina de Oro barangay.
