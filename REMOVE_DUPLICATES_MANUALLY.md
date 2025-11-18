# Remove Duplicate Users Manually

## Quick Fix - No Script Needed!

You can now remove duplicate users directly from the System Users page.

### Steps:

1. **Go to System Users page** (you're already there!)

2. **Find the duplicate entry**
   - Look for users with the same name and email
   - Example: Two "Ryan Claud" entries with `ryanclaud4@gmail.com`

3. **Identify which one to delete**
   - The duplicate usually has the same email but might be missing some data
   - Keep the one that looks more complete

4. **Click the Delete button (🗑️)**
   - Click the trash icon next to the duplicate entry
   - Confirm the deletion

5. **Refresh the page**
   - Click the "Refresh" button at the top
   - Or press F5 to reload

## How to Identify Duplicates

Look for:
- ✅ Same email address
- ✅ Same name
- ✅ Usually one is a Resident role

**Which one to keep?**
- Keep the one that has complete information
- Keep the one that the resident is actually using to log in
- When in doubt, delete the one that appears second in the list

## Example

If you see:
```
Ryan Claud | ryanclaud4@gmail.com | Resident | Mina de Oro
Ryan Claud | ryanclaud4@gmail.com | Resident | Mina de Oro
```

Delete ONE of them (doesn't matter which, they're identical).

## After Deletion

1. The user count will decrease
2. The duplicate will disappear
3. The resident can still log in normally
4. No data is lost (the resident record is separate)

## If You're Unsure

You can also:
1. Check the Firebase Console → Firestore → `users` collection
2. Look for documents with the same email
3. Delete the duplicate document manually

## Prevention

The system now prevents creating duplicates, so this shouldn't happen again!

