# 🔧 Fix Barangay Captain & Document Request Issues

## Problems Identified

1. ❌ **Barangay Captain role saved as "Resident"** when created via User Management
2. ❌ **Barangay Captain can't login** (Invalid credentials)
3. ❌ **Document requests not showing in correct barangay**

## Solutions

### Quick Fix (Immediate)

#### Option 1: Run the Fix Script

```bash
# Run the automated fix script
npx tsx src/scripts/fix-barangay-captain.ts
```

This will:
- Find users with "captain" in their email
- Update their role from "Resident" to "Barangay Captain"
- Remove the `residentId` field

#### Option 2: Manual Fix in Firestore

1. **Go to Firestore Console**
2. **Navigate to `users` collection**
3. **Find the Barangay Captain document** (e.g., `brgycaptain@ibarangaycarmundo.com`)
4. **Edit the document:**
   - Change `role` from `"Resident"` to `"Barangay Captain"`
   - **Delete** the `residentId` field (click the X next to it)
   - Verify `barangayId` is set correctly
5. **Save changes**

### Fix Login Issues

If Barangay Captain still can't login after fixing the role:

1. **Reset Password:**
   ```bash
   # In Firebase Console
   Authentication → Users → Find the user → Reset Password
   ```

2. **Or use Forgot Password:**
   - Go to `/forgot-password` page
   - Enter the Barangay Captain's email
   - Follow the reset link sent to email

### Fix Document Requests Not Showing

**Problem:** Resident registers and requests documents, but they don't appear in the barangay's dashboard.

**Root Cause:** The `barangayId` might not be set correctly on the document request.

**Solution:**

1. **Check the resident's barangayId:**
   - Go to Firestore → `residents` collection
   - Find the resident document
   - Verify `barangayId` matches the barangay ID

2. **Check document request barangayId:**
   - Go to Firestore → `documentRequests` collection
   - Find the request
   - Verify `barangayId` matches

3. **If mismatched, update manually:**
   - Edit the document request
   - Set correct `barangayId`
   - Save

## Prevention (For Future)

The code has been updated to prevent these issues:

### Changes Made:

1. **`src/contexts/app-context.tsx`:**
   - `addUser` function now explicitly sets `residentId: undefined` for staff
   - Uses `setDoc` instead of `setDoc(..., { merge: true })` to prevent field carryover

2. **User Creation Flow:**
   - Staff members (Captain, Secretary, Treasurer, Admin) will NOT have `residentId`
   - Only Residents will have `residentId`

### Testing the Fix:

1. **Create a new Barangay Captain:**
   ```
   Go to Users → Add User
   Name: Test Captain
   Email: testcaptain@test.com
   Role: Barangay Captain
   Password: password123
   ```

2. **Check in Firestore:**
   - Role should be "Barangay Captain"
   - Should NOT have `residentId` field
   - Should have correct `barangayId`

3. **Test Login:**
   - Go to `/login`
   - Use the email and password
   - Should successfully login
   - Should see Captain's dashboard

## Verification Checklist

After applying fixes:

- [ ] Barangay Captain role is correct in Firestore
- [ ] Barangay Captain does NOT have `residentId` field
- [ ] Barangay Captain has correct `barangayId`
- [ ] Barangay Captain can login successfully
- [ ] Barangay Captain sees their dashboard
- [ ] New residents register with correct `barangayId`
- [ ] Document requests have correct `barangayId`
- [ ] Document requests appear in correct barangay dashboard

## Common Issues & Solutions

### Issue: "Invalid credentials" when logging in

**Solutions:**
1. Reset password in Firebase Console
2. Use Forgot Password feature
3. Verify email is correct (no typos)
4. Check if account exists in Firebase Authentication

### Issue: User created but can't see in User Management

**Cause:** User might be in different barangay

**Solution:**
1. Check user's `barangayId` in Firestore
2. Login as admin of that barangay to see the user
3. Or login as Super Admin to see all users

### Issue: Document requests not appearing

**Cause:** `barangayId` mismatch

**Solution:**
1. Check resident's `barangayId`
2. Check document request's `barangayId`
3. Update to match if different

## Need More Help?

If issues persist:

1. **Check Firestore Console:**
   - Verify all `barangayId` fields match
   - Check for typos in email addresses
   - Verify roles are spelled correctly

2. **Check Browser Console:**
   - Look for error messages
   - Check network tab for failed requests

3. **Contact Support:**
   - Email: ibarangays@gmail.com
   - Developer: ryanclaud4@gmail.com

---

**Last Updated:** November 2024
