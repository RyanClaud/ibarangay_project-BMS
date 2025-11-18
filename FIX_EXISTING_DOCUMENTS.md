# Fix Existing Documents - Status Update Guide

## Problem

Existing documents with "Approved" status are not showing the new workflow statuses because they were created before the new status system was implemented.

## Solution

We need to update existing documents to use the new status workflow.

## Option 1: Run Migration Script (Recommended)

### Step 1: Run the Script

```bash
npx tsx src/scripts/fix-free-document-statuses.ts
```

### What It Does:
- Finds all documents with status "Approved" and amount = 0 (free documents)
- Updates them to "Payment Verified" status
- Adds free payment details
- Shows progress and summary

### Expected Output:
```
🔧 Fixing free document statuses...

📋 Found 1 free document(s) with "Approved" status

✅ Updated: IBGY-251116001 - Certificate of Indigency
   Resident: Ryan Claud
   Status: Approved → Payment Verified

📊 Summary:
   ✅ Updated: 1
   ❌ Failed: 0
   📝 Total: 1

🎉 Free documents have been updated!
   Residents will now see these documents as "Payment Verified"
   Secretary can now mark them as "Ready for Pickup"

✅ Script completed successfully
```

## Option 2: Manual Update via Firebase Console

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database

### Step 2: Find the Document
1. Navigate to `documentRequests` collection
2. Find document with tracking number `IBGY-251116001`
3. Click to open

### Step 3: Update Fields

**Change `status` field**:
```
From: "Approved"
To: "Payment Verified"
```

**Add `paymentDetails` field** (if not exists):
```json
{
  "method": "Free",
  "transactionId": "N/A - Free Document",
  "paymentDate": "2025-11-16T10:00:00.000Z",
  "screenshotUrl": null
}
```

### Step 4: Save Changes
Click "Update" button

## Option 3: Re-approve the Document

### Step 1: Login as Admin or Captain

### Step 2: Go to Documents Page

### Step 3: Find the Document
- Use filter or search for "IBGY-251116001"
- Or search for "Ryan Claud"

### Step 4: Reject the Document
- Click Actions (⋮)
- Click "Reject Request"

### Step 5: Re-approve the Document
- Status is now "Rejected"
- Click Actions (⋮)
- Click "Approve Request"
- System will auto-skip to "Payment Verified" for free documents

## Verification

After fixing, verify the changes:

### As Admin/Secretary:
1. Go to Documents page
2. Click "Verified" tab
3. Document should appear there
4. Status should show "Payment Verified"
5. Green "Mark Ready" button should be visible

### As Resident:
1. Go to Dashboard
2. Document should show "Payment Verified" status
3. Blue notification: "Document Being Prepared"
4. No "Pay Now" button (it's free)

## What Changed in the System

### Old Status Flow:
```
Pending → Approved → Paid → Released → Rejected
```

### New Status Flow:
```
Pending
  ↓
Approved
  ↓
Payment Submitted (resident uploads proof)
  ↓
Payment Verified (treasurer verifies)
  ↓
Ready for Pickup (secretary marks ready)
  ↓
Released (secretary marks released)
  ↓
Rejected (can happen at any stage)
```

### For Free Documents:
```
Pending
  ↓
Approved (auto-skip to Payment Verified)
  ↓
Payment Verified
  ↓
Ready for Pickup
  ↓
Released
```

## Files Updated

### Status Type Definition:
- `src/lib/types.ts` - DocumentRequestStatus type

### Status Colors:
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/documents/document-request-client-page.tsx`

### Status Logic:
- `src/contexts/app-context.tsx` - Auto-skip for free documents
- `src/components/requests/payment-dialog.tsx` - Payment submission
- `src/components/payments/payments-client-page.tsx` - Payment display

### All References Updated:
- ✅ "Paid" → "Payment Submitted" / "Payment Verified"
- ✅ Status colors added for all new statuses
- ✅ Tabs updated with new statuses
- ✅ Action buttons for new statuses

## Testing After Fix

### Test 1: Secretary Can Mark Ready
1. Login as Secretary
2. Go to Documents page
3. Click "Verified" tab
4. Find the Certificate of Indigency
5. Verify green "Mark Ready" button appears
6. Click button
7. Status should change to "Ready for Pickup"

### Test 2: Resident Sees Notification
1. Login as Resident (Ryan Claud)
2. Go to Dashboard
3. Should see blue notification: "Document Being Prepared"
4. After secretary marks ready, should see green notification: "Ready for Pickup!"

### Test 3: Secretary Can Mark Released
1. Login as Secretary
2. Go to Documents page
3. Click "Ready" tab
4. Find the document
5. Verify blue "Mark Released" button appears
6. Click button
7. Status should change to "Released"

### Test 4: New Free Document
1. Login as Resident
2. Request new Certificate of Indigency
3. Login as Captain
4. Approve the request
5. Verify status auto-changes to "Payment Verified"
6. Verify toast notification appears
7. Login as Secretary
8. Verify document appears in "Verified" tab

## Summary

**Problem**: Old "Paid" status doesn't exist in new workflow
**Solution**: Update to new status names and workflow
**Fix**: Run migration script or manually update documents
**Result**: All statuses work correctly with proper colors and actions

After fixing, the complete workflow will be functional:
- ✅ Proper status progression
- ✅ Color-coded status badges
- ✅ Action buttons for each role
- ✅ Notifications for residents
- ✅ Auto-skip for free documents
