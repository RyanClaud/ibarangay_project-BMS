# Fix Duplicate Users - Quick Guide

## The Problem
You're seeing duplicate users in the Super Admin → System Users page, but the barangay admin only sees one correct record. This means there are duplicate entries in the `users` collection.

## The Solution - Run This Command

Open your terminal and run:

```bash
npm run cleanup:duplicates
```

Or directly:

```bash
npx tsx src/scripts/remove-duplicate-now.ts
```

## What This Does

The script will:

1. ✅ Find all users with duplicate email addresses
2. ✅ Check which user has a corresponding resident record
3. ✅ **Keep** the user that has resident data (the real account)
4. ✅ **Delete** the duplicate user entries (ones without resident data)
5. ✅ Show you exactly what was removed

## Example Output

```
🔧 Starting duplicate removal...

📊 Total users in system: 8

📧 Email: ryanclaud4@gmail.com
   Found 2 users
   ✅ KEEP: abc123 - Ryan Claud (has resident record)
   ❌ DELETE: xyz789 - Ryan Claud (no resident record)
   🗑️  Deleted: xyz789

============================================================
✨ CLEANUP COMPLETE!
============================================================
📊 Duplicate users found: 1
🗑️  Users removed: 1
✅ Users remaining: 7

💡 Tip: Refresh your browser to see the changes
```

## After Running

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. Go to **System Users** page
3. Verify that each user appears only once
4. Check that the resident can still log in

## Why This Happened

The duplicate was likely created when:
- The resident creation process was interrupted
- The same resident was added twice by mistake
- A network error occurred during creation

## Prevention

The system has been updated to prevent this from happening again. It now checks for existing users before creating new ones.

## If You Still See Duplicates

1. Run the script again: `npm run cleanup:duplicates`
2. Check the Firebase Console → Firestore → `users` collection
3. Manually verify the email addresses
4. Contact support if the issue persists

## Safe to Run Multiple Times

✅ This script is safe to run multiple times
✅ It only deletes true duplicates
✅ It preserves the correct user data
✅ It won't affect Firebase Authentication accounts

