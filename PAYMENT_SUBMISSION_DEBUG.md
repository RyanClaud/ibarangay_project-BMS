# Payment Submission Debug Guide

## Issue
Payment submission gets stuck on "Uploading..." and never completes.

## Changes Made

### 1. Added Detailed Console Logging

**Payment Dialog** (`src/components/requests/payment-dialog.tsx`):
- Added console.log at each step of the submission process
- Logs when starting, uploading, getting URL, and updating status
- Logs detailed error information

**App Context** (`src/contexts/app-context.tsx`):
- Added console.log in updateDocumentRequestStatus function
- Logs when function is called with parameters
- Logs when document is being updated
- Logs when update is successful
- Throws proper errors instead of silent failures

### 2. Improved Error Handling

**Before**:
```typescript
if (!firestore) return; // Silent failure
```

**After**:
```typescript
if (!firestore) {
  console.error('Firestore not initialized');
  throw new Error('Firestore not initialized');
}
```

## How to Debug

### Step 1: Open Browser Console
1. Open your browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Clear console (trash icon)

### Step 2: Try Payment Submission
1. Login as Resident
2. Find approved document
3. Click "Pay Now"
4. Fill in transaction ID
5. Upload screenshot
6. Click "Submit Payment"

### Step 3: Watch Console Output

**Expected Console Output (Success)**:
```
Starting payment submission...
Uploading screenshot to Firebase Storage...
Screenshot uploaded successfully
Screenshot URL obtained: https://firebasestorage.googleapis.com/...
Updating document request status... {method: "GCash", transactionId: "...", ...}
updateDocumentRequestStatus called: {id: "...", status: "Payment Submitted", ...}
Adding payment details to update: {method: "GCash", ...}
Updating document with data: {status: "Payment Submitted", paymentDetails: {...}}
Document updated successfully
```

**If It Fails, Look For**:
- Error messages in red
- Which step it fails at
- Specific error codes (permission-denied, not-found, etc.)

## Common Issues & Solutions

### Issue 1: Permission Denied Error
**Console Shows**:
```
FirebaseError: Missing or insufficient permissions
```

**Solution**:
```bash
# Deploy updated Firestore rules
firebase deploy --only firestore:rules
```

### Issue 2: Storage Upload Fails
**Console Shows**:
```
Error uploading screenshot
FirebaseError: storage/unauthorized
```

**Solution**:
```bash
# Deploy storage rules
firebase deploy --only storage
```

**Check storage.rules has**:
```
match /payment-proofs/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
               && request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

### Issue 3: Firestore Not Initialized
**Console Shows**:
```
Firestore not initialized
```

**Solution**:
- Refresh the page
- Check Firebase configuration
- Verify user is logged in

### Issue 4: Document Not Found
**Console Shows**:
```
Document not found: documentRequests/...
```

**Solution**:
- Verify document ID is correct
- Check if document exists in Firestore console
- Verify user has permission to access document

### Issue 5: Network Error
**Console Shows**:
```
Failed to fetch
Network request failed
```

**Solution**:
- Check internet connection
- Check if Firebase services are running
- Try refreshing the page

## Testing Checklist

### Test 1: Successful Payment Submission
- [ ] Open browser console
- [ ] Login as Resident
- [ ] Find approved document (amount > 0)
- [ ] Click "Pay Now"
- [ ] Enter transaction ID: "TEST123"
- [ ] Upload test screenshot
- [ ] Click "Submit Payment"
- [ ] Watch console for logs
- [ ] Verify "Document updated successfully" appears
- [ ] Verify toast notification appears
- [ ] Verify dialog closes
- [ ] Verify status changes to "Payment Submitted"

### Test 2: Validation Errors
- [ ] Try submitting without transaction ID
- [ ] Should show error toast
- [ ] Try submitting without screenshot
- [ ] Should show error toast
- [ ] Try uploading non-image file
- [ ] Should show error toast
- [ ] Try uploading file > 5MB
- [ ] Should show error toast

### Test 3: Network Resilience
- [ ] Start payment submission
- [ ] Disconnect internet mid-upload
- [ ] Should show error message
- [ ] Reconnect internet
- [ ] Try again
- [ ] Should work

## Firestore Rules Check

### Verify Document Requests Rules:
```javascript
match /documentRequests/{documentRequestId} {
  allow list: if isSignedIn();
  
  allow get: if isSignedIn() && (
    isSuperAdmin() ||
    (isStaff() && isSameBarangay(resource.data.barangayId)) || 
    (resource.data.residentId == request.auth.uid)
  );
  
  allow create: if isSignedIn() && (
    request.resource.data.residentId == request.auth.uid ||
    (isStaff() && hasValidBarangayId())
  );
  
  allow update: if isSignedIn() && (
    isSuperAdmin() ||
    (isStaff() && isSameBarangay(resource.data.barangayId)) || 
    (resource.data.residentId == request.auth.uid)
  );
  
  allow delete: if isSuperAdmin() || 
                   (isStaff() && isSameBarangay(resource.data.barangayId));
}
```

**Key Point**: Residents must be able to `update` their own document requests to add payment details.

## Storage Rules Check

### Verify Payment Proofs Rules:
```
match /payment-proofs/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
               && request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*');
}
```

## Manual Testing Steps

### Step 1: Check Firestore Console
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find `documentRequests` collection
4. Find the test document
5. Note the document ID

### Step 2: Check Storage Console
1. Go to Firebase Console
2. Navigate to Storage
3. Check if `payment-proofs` folder exists
4. Try uploading a test file manually

### Step 3: Check Rules
1. Go to Firebase Console
2. Firestore Database → Rules tab
3. Verify rules are deployed
4. Check last deployment time
5. Storage → Rules tab
6. Verify storage rules are deployed

## If Still Stuck

### Collect Debug Information:

1. **Console Logs**:
   - Copy all console output
   - Include error messages
   - Note which step fails

2. **Network Tab**:
   - Open DevTools → Network tab
   - Try submission again
   - Look for failed requests (red)
   - Check request/response details

3. **Firestore Rules Simulator**:
   - Go to Firebase Console
   - Firestore → Rules → Simulator
   - Test update operation
   - Use actual document path
   - Use actual user UID

4. **Storage Rules Simulator**:
   - Go to Firebase Console
   - Storage → Rules → Simulator
   - Test write operation
   - Use path: `payment-proofs/test.jpg`
   - Use actual user UID

## Summary

**Added**:
- ✅ Detailed console logging at each step
- ✅ Proper error handling and throwing
- ✅ Error details logging
- ✅ Success confirmation logging

**Next Steps**:
1. Open browser console
2. Try payment submission
3. Watch console output
4. Share console logs if still stuck

The console logs will show exactly where the process is failing!
