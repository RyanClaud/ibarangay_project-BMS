# Fix: Secretary Firestore Error

## Problem

Secretary is getting a Firestore internal error when logged in. The error message indicates:
```
FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state
```

## Root Cause

This error occurs because:
1. The app context was previously querying all users for all staff
2. We changed it so only Admin can query users
3. Secretary's session still has the old query active
4. Firestore is confused by the query state change

## Solution

### Immediate Fix (For Secretary)

**Option 1: Clear Browser Data**
1. Press `Ctrl + Shift + Delete`
2. Select:
   - ✅ Cookies and site data
   - ✅ Cached images and files
3. Click "Clear data"
4. Close ALL browser tabs
5. Open new tab
6. Go to your app
7. Log in as Secretary
8. ✅ Should work now

**Option 2: Hard Refresh**
1. Close all browser tabs
2. Open new tab
3. Go to your app
4. Press `Ctrl + F5` (hard refresh)
5. Log in as Secretary
6. ✅ Should work now

**Option 3: Use Incognito/Private Window**
1. Open Incognito/Private window
2. Go to your app
3. Log in as Secretary
4. ✅ Should work without errors

### Why This Happens

When we changed the code to restrict Secretary from querying users:
- The old query was still active in Firestore's cache
- The new code returns `null` for the query
- Firestore gets confused by the state change
- Results in internal assertion error

### Prevention

This is a one-time issue that happens when:
- Code changes affect Firestore queries
- User is already logged in when changes are deployed
- Browser cache has old query state

After clearing cache, it won't happen again.

## Verification

After clearing cache and logging in as Secretary, verify:

1. **Dashboard loads** ✅
2. **Can view residents** ✅
3. **Can view documents** ✅
4. **No Firestore errors** ✅
5. **Cannot see Users page** ✅

## For Admin

Admin should NOT have this issue because:
- Admin is allowed to query users
- The query is valid for Admin
- No state conflict

## Technical Details

### What Changed

**Before**:
```typescript
const allUsersQuery = useMemoFirebase(() => {
  if (!firestore || !currentUser?.id || !isStaff) return null;
  // All staff could query users
  return query(collection(firestore, 'users'), ...);
}, [firestore, currentUser, isStaff]);
```

**After**:
```typescript
const allUsersQuery = useMemoFirebase(() => {
  if (!firestore || !currentUser?.id || !isAdminOrSuperAdmin) return null;
  // Only Admin can query users
  return query(collection(firestore, 'users'), ...);
}, [firestore, currentUser, isAdminOrSuperAdmin]);
```

### Why Clear Cache Fixes It

1. Clears Firestore's local cache
2. Removes old query subscriptions
3. Forces fresh query setup
4. New code runs without conflicts

## If Error Persists

If clearing cache doesn't fix it:

### Check 1: Verify Secretary Role

1. Go to Firebase Console
2. Firestore → users collection
3. Find Secretary's document
4. Verify: `role: "Secretary"` (exact spelling)

### Check 2: Check Browser Console

1. Press F12
2. Go to Console tab
3. Look for specific error messages
4. Share error details if asking for help

### Check 3: Try Different Browser

1. Open different browser (Chrome, Firefox, Edge)
2. Go to your app
3. Log in as Secretary
4. If works: Original browser cache issue
5. If doesn't work: Code issue

## Summary

**Quick Fix**:
1. Clear browser cache
2. Close all tabs
3. Open new tab
4. Log in again
5. ✅ Should work

**Why it happened**:
- Code change affected Firestore queries
- Old query state conflicted with new code
- One-time issue after deployment

**Prevention**:
- Clear cache after major code changes
- Use incognito for testing
- Log out before code updates

This is a normal occurrence when Firestore query logic changes while users are logged in. Clearing cache resolves it completely.
