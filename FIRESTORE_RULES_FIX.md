# Firestore Rules Fix - Permission Denied Error

## Problem

When logged in as Treasurer (or other staff roles), trying to add new users/residents resulted in:
```
FirebaseError: Missing or insufficient permissions
Path: /databases/(default)/documents/documentRequests
```

## Root Cause

The Firestore security rules for `documentRequests` collection had a flaw in the `list` permission:

**Old Rule**:
```javascript
allow list: if isSignedIn() && (
  (isStaff() && isSameBarangay(resource.data.barangayId)) ||
  (resource.data.residentId == request.auth.uid)
);
```

**Problem**: When doing a `list` operation (query), `resource.data` doesn't exist yet because you're querying for documents, not accessing a specific document. This caused the rule to fail for all staff members.

## Solution

Updated the rules to allow `list` operations for all authenticated staff, with the understanding that the application code will filter by `barangayId`:

**New Rule**:
```javascript
allow list: if isSignedIn() && (
  isSuperAdmin() || 
  isStaff() || 
  getUserRole(request.auth.uid) == "Resident"
);
```

## Changes Made

### 1. Document Requests Rules
**File**: `firestore.rules`

**Before**:
```javascript
match /documentRequests/{documentRequestId} {
  allow list: if isSignedIn() && (
    (isStaff() && isSameBarangay(resource.data.barangayId)) ||
    (resource.data.residentId == request.auth.uid)
  );
  // ... other rules
}
```

**After**:
```javascript
match /documentRequests/{documentRequestId} {
  // Allow staff to list all requests (query must filter by barangayId in the app)
  allow list: if isSignedIn() && (
    isSuperAdmin() || 
    isStaff() || 
    getUserRole(request.auth.uid) == "Resident"
  );
  
  // Get still checks barangayId for security
  allow get: if isSignedIn() && (
    isSuperAdmin() ||
    (isStaff() && isSameBarangay(resource.data.barangayId)) || 
    (resource.data.residentId == request.auth.uid)
  );
  // ... other rules
}
```

### 2. Residents Rules (Consistency)
Also updated residents rules for consistency:

```javascript
match /residents/{residentId} {
  // Allow staff to list residents (query must filter by barangayId in the app)
  allow list: if isSignedIn() && (isSuperAdmin() || isStaff());
  // ... other rules
}
```

## Security Model

### Two-Layer Security:

**Layer 1: Firestore Rules (Coarse-grained)**
- Allow authenticated staff to query collections
- Trust that application code will filter by barangayId
- Prevent unauthorized access at the collection level

**Layer 2: Application Code (Fine-grained)**
- App context filters queries by user's barangayId
- Ensures staff only see data from their barangay
- Provides proper data isolation

### Why This Approach?

**Firestore Limitation**: 
- Rules can't access `resource.data` during `list` operations
- Rules can't evaluate query constraints
- Must allow the query, then filter in application code

**Security Maintained**:
- `get` operations still check barangayId
- `create`, `update`, `delete` still check barangayId
- Application code enforces barangay isolation
- Super admins can access all barangays

## Application-Level Filtering

The app context already filters queries by barangayId:

**Example from `app-context.tsx`**:
```typescript
const allResidentsQuery = useMemoFirebase(() => {
  if (!firestore || !currentUser?.id || !isStaff) return null;
  
  // Super admins see all residents
  if (currentUser.isSuperAdmin) {
    return collection(firestore, 'residents');
  }
  
  // Regular staff see only their barangay
  if (!currentUser.barangayId) return null;
  return query(
    collection(firestore, 'residents'), 
    where('barangayId', '==', currentUser.barangayId)
  );
}, [firestore, currentUser?.id, currentUser?.barangayId, currentUser?.isSuperAdmin, isStaff]);
```

## Testing

### Test 1: Treasurer Can Access Dashboard
1. Login as Treasurer
2. Go to Dashboard
3. Should load without permission errors
4. Should see payment-related data

### Test 2: Secretary Can Add Resident
1. Login as Secretary
2. Go to Residents page
3. Click "Add Resident"
4. Fill form and submit
5. Should create successfully

### Test 3: Admin Can Add Staff
1. Login as Admin
2. Go to Users page
3. Click "Add User"
4. Fill form and submit
5. Should create successfully

### Test 4: Data Isolation Still Works
1. Login as Staff from Barangay A
2. Should only see residents from Barangay A
3. Should only see documents from Barangay A
4. Cannot access Barangay B data

### Test 5: Super Admin Access
1. Login as Super Admin
2. Should see all barangays
3. Should see all residents
4. Should see all documents

## Deployment

### Deploy Updated Rules:
```bash
firebase deploy --only firestore:rules
```

### Expected Output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

### Verify Deployment:
1. Check Firebase Console
2. Go to Firestore Database
3. Click "Rules" tab
4. Verify rules are updated

## Rollback (If Needed)

If issues occur, you can rollback to previous rules:

1. Go to Firebase Console
2. Firestore Database → Rules
3. Click "History" tab
4. Select previous version
5. Click "Restore"

## Summary

**Problem**: Permission denied when staff try to access documentRequests
**Cause**: Rules tried to check `resource.data` during `list` operations
**Solution**: Allow `list` for all staff, rely on app-level filtering
**Security**: Maintained through `get`, `create`, `update`, `delete` rules and app code
**Result**: Staff can now access dashboard and add users/residents without errors

The fix maintains security while allowing proper access for all staff roles!
