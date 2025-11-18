# Cleanup Duplicate Users

## Problem
Duplicate user entries exist in the Firestore `users` collection with the same email addresses.

## Solution

### Step 1: Run the Cleanup Script

This script will:
- Find all users with duplicate email addresses
- Keep the most complete user record (one with residentId)
- Delete the duplicate entries

**To run the script:**

```bash
npx tsx src/scripts/cleanup-duplicate-users.ts
```

### Step 2: Prevention

The system has been updated to prevent future duplicates:

1. **Email Check**: Before creating a new resident, the system now checks if a user with that email already exists
2. **Error Handling**: If a duplicate is detected, an error message is shown: "A user with this email already exists in the system."

### Step 3: Verify

After running the cleanup script:

1. Go to System Users page
2. Check that each email appears only once
3. Verify that resident accounts still work correctly

## Technical Details

### What the Script Does:

1. Loads all users from Firestore
2. Groups users by email address
3. For each duplicate group:
   - Keeps the user with `residentId` (the actual resident account)
   - Deletes other duplicates
4. Reports the number of duplicates found and removed

### Why Duplicates Occurred:

The system creates both:
- A `users` document (for authentication/login)
- A `residents` document (for resident profile data)

Both use the same ID (the Firebase Auth UID). This is correct and by design.

However, if the creation process was interrupted or run multiple times, duplicate `users` documents could be created.

### Prevention Measures Added:

```typescript
// Check if user already exists before creating
const existingUsersQuery = query(
  collection(firestore, 'users'), 
  where('email', '==', newResidentData.email), 
  limit(1)
);
const existingUsersSnap = await getDocs(existingUsersQuery);

if (!existingUsersSnap.empty) {
  throw new Error("A user with this email already exists in the system.");
}
```

## Notes

- The cleanup script is safe to run multiple times
- It will only delete true duplicates (same email)
- The original user data is preserved
- Firebase Auth accounts are NOT deleted (only Firestore documents)

## If Issues Persist

If you still see duplicates after running the script:

1. Check the Firebase Console → Firestore → `users` collection
2. Manually verify which documents are duplicates
3. Check if the email addresses are exactly the same (case-sensitive)
4. Run the script again

