# Manual Fix: Update Document Status

## Problem
Your Certificate of Indigency is stuck in "Approved" status and should be "Payment Verified" to show notifications and allow Secretary to process it.

## Quick Fix Options

### Option 1: Re-Approve the Document (Easiest)

**Step 1: Login as Admin**
- Use your admin account

**Step 2: Go to Documents Page**
- Click "Documents" in the sidebar

**Step 3: Find the Document**
- Look for tracking number: `IBGY-251116001`
- Or search for resident: "Ryan Claud"
- Or click "Approved" tab

**Step 4: Reject It First**
- Click the three dots (⋮) in Actions column
- Click "Reject Request"
- Status changes to "Rejected"

**Step 5: Approve It Again**
- Click the three dots (⋮) again
- Click "Approve Request"
- **The system will now auto-skip to "Payment Verified"** (because amount = 0)
- You'll see a toast notification: "Free Document Approved - Payment steps skipped"

**Step 6: Verify**
- Status should now be "Payment Verified"
- Document should appear in "Verified" tab
- Secretary can now see green "Mark Ready" button

### Option 2: Use Firebase Console

**Step 1: Open Firebase Console**
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click "Firestore Database" in left menu

**Step 2: Navigate to Document**
1. Click `documentRequests` collection
2. Find document with ID matching tracking `IBGY-251116001`
3. Click to open the document

**Step 3: Edit the Document**

**Change the `status` field**:
```
Current value: "Approved"
New value: "Payment Verified"
```

**Add/Update `paymentDetails` field**:
Click "Add field" or edit existing, then add this object:
```
Field name: paymentDetails
Type: map

Inside the map, add these fields:
  - method (string): "Free"
  - transactionId (string): "N/A - Free Document"  
  - paymentDate (string): "2025-11-16T10:00:00.000Z"
  - screenshotUrl (null): null
```

**Step 4: Save**
- Click "Update" button at the bottom

**Step 5: Refresh Your App**
- Go back to your app
- Refresh the page (F5)
- Status should now show "Payment Verified"

### Option 3: Create New Request (Fresh Start)

**Step 1: Login as Resident**
- Use Ryan Claud's account

**Step 2: Delete Old Request** (Optional)
- Admin can delete the old request from Documents page

**Step 3: Submit New Request**
- Go to Dashboard
- Fill out form for Certificate of Indigency
- Submit

**Step 4: Login as Admin/Captain**
- Approve the new request
- System will auto-skip to "Payment Verified"

## After Fixing - What You'll See

### As Resident (Ryan Claud):

**Dashboard will show**:
```
┌─────────────────────────────────────────┐
│ 🔵 1 Document Being Prepared            │
│                                         │
│ • Certificate of Indigency              │
│   Tracking: IBGY-251116001              │
│   Status: In Progress                   │
│                                         │
│ Your payment has been verified.         │
│ The document is being prepared.         │
└─────────────────────────────────────────┘
```

**Sidebar will show**:
```
🏠 My Dashboard [1] ← Red badge with count
⚙️  Settings
```

### As Secretary:

**Documents Page → Verified Tab**:
```
┌──────────────────────────────────────────┐
│ Tracking: IBGY-251116001                 │
│ Resident: Ryan Claud                     │
│ Document: Certificate of Indigency       │
│ Status: Payment Verified                 │
│ ┌──────────────────────────────────────┐ │
│ │ ✓ Mark Ready                         │ │ ← Green button
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ View Receipt                         │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### After Secretary Marks Ready:

**Resident Dashboard**:
```
┌─────────────────────────────────────────┐
│ 📦 1 Document Ready for Pickup! 🎉      │
│                                         │
│ • Certificate of Indigency              │
│   Tracking: IBGY-251116001              │
│   Status: Ready                         │
│                                         │
│ 📍 Visit barangay office                │
│ ⏰ Mon-Fri, 8:00 AM - 5:00 PM           │
└─────────────────────────────────────────┘
```

**Sidebar badge**:
```
🏠 My Dashboard [1] ← Still shows badge
```

## Why Notifications Weren't Showing

The notification system only shows alerts for:

1. ✅ **Ready for Pickup** - Green alert (highest priority)
2. ✅ **Payment Verified** - Blue alert (being prepared)
3. ✅ **Approved** (amount > 0) - Amber alert (needs payment)
4. ✅ **Rejected** - Red alert

Your document was:
- ❌ Status: "Approved"
- ❌ Amount: 0 (free)

This combination doesn't trigger notifications because free documents should automatically skip to "Payment Verified" when approved.

## Testing the Fix

### Test 1: Notification Appears
1. Fix the document status (use Option 1 above)
2. Login as Resident
3. Go to Dashboard
4. Should see blue notification: "Document Being Prepared"
5. Should see badge [1] on sidebar

### Test 2: Secretary Can Process
1. Login as Secretary
2. Go to Documents page
3. Click "Verified" tab
4. Should see the document
5. Should see green "Mark Ready" button
6. Click button
7. Status changes to "Ready for Pickup"

### Test 3: Ready Notification
1. Login as Resident
2. Go to Dashboard
3. Should see green notification: "Ready for Pickup!"
4. Should see office hours
5. Badge still shows [1]

### Test 4: Release Document
1. Login as Secretary
2. Go to Documents page
3. Click "Ready" tab
4. Should see blue "Mark Released" button
5. Click button
6. Status changes to "Released"

### Test 5: Notification Clears
1. Login as Resident
2. Go to Dashboard
3. Notification should be gone
4. Badge should be gone
5. Document shows "Released" status

## Summary

**Current State**: Document stuck in "Approved" status
**Fix**: Re-approve the document (Option 1 - easiest)
**Result**: Status becomes "Payment Verified"
**Then**: Notifications will appear for resident
**Finally**: Secretary can mark as ready for pickup

**Recommended**: Use Option 1 (Re-approve) - it's the quickest and tests the auto-skip feature!
