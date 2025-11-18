# Notification System - Debug Guide

## Why You're Not Seeing Notifications

### Current Situation:
```
Document: Certificate of Indigency
Tracking: IBGY-251116001
Status: "Approved" ← PROBLEM!
Amount: ₱0.00
```

### What Should Happen:
```
Document: Certificate of Indigency
Tracking: IBGY-251116001
Status: "Payment Verified" ← CORRECT!
Amount: ₱0.00
```

## Notification Logic Explained

### The Code (from document-status-alert.tsx):
```typescript
// Filter requests by status
const readyForPickup = requests.filter(r => r.status === 'Ready for Pickup');
const paymentVerified = requests.filter(r => r.status === 'Payment Verified');
const approved = requests.filter(r => r.status === 'Approved' && r.amount > 0);
const rejected = requests.filter(r => r.status === 'Rejected');

// Don't show anything if no important notifications
if (readyForPickup.length === 0 && 
    paymentVerified.length === 0 && 
    approved.length === 0 && 
    rejected.length === 0) {
  return null; // No notifications shown
}
```

### Your Document Check:
```
✅ readyForPickup? NO (status is "Approved", not "Ready for Pickup")
✅ paymentVerified? NO (status is "Approved", not "Payment Verified")
✅ approved with amount > 0? NO (status is "Approved" BUT amount = 0)
✅ rejected? NO (status is "Approved", not "Rejected")

Result: All checks fail → return null → No notification shown
```

### If Status Was "Payment Verified":
```
✅ readyForPickup? NO
✅ paymentVerified? YES! ← This would match
✅ approved with amount > 0? NO
✅ rejected? NO

Result: paymentVerified.length = 1 → Show blue notification
```

## Badge Logic Explained

### The Code (from use-notification-count.ts):
```typescript
const readyForPickup = requests.filter(r => r.status === 'Ready for Pickup').length;
const approved = requests.filter(r => r.status === 'Approved' && r.amount > 0).length;
const rejected = requests.filter(r => r.status === 'Rejected').length;

return readyForPickup + approved + rejected;
```

### Your Document Check:
```
✅ readyForPickup? NO (status is "Approved")
✅ approved with amount > 0? NO (amount = 0)
✅ rejected? NO (status is "Approved")

Result: 0 + 0 + 0 = 0 → No badge shown
```

### Note:
"Payment Verified" is NOT counted in the badge because it's shown in the alert notification instead. The badge only counts:
- Ready for Pickup (action needed: visit office)
- Approved with payment (action needed: upload payment)
- Rejected (action needed: contact office)

## Status Flow Visualization

### What Happened to Your Document:
```
1. Resident submitted request
   Status: "Pending"
   ↓
2. Captain approved BEFORE auto-skip was implemented
   Status: "Approved" ← STUCK HERE!
   ↓
3. Should have auto-skipped to "Payment Verified"
   Status: Still "Approved" ← PROBLEM!
```

### What Should Happen (After Fix):
```
1. Resident submits request
   Status: "Pending"
   ↓
2. Captain approves
   Status: "Approved" (for 1 millisecond)
   ↓
3. System detects amount = 0
   Auto-skip triggered!
   ↓
4. Status automatically changes
   Status: "Payment Verified" ← CORRECT!
   ↓
5. Notification shows
   Blue alert: "Document Being Prepared"
```

## Testing Notifications

### Test Case 1: Free Document (Your Case)
```
Status: "Payment Verified"
Amount: ₱0.00
Expected: Blue notification "Document Being Prepared"
Badge: NO (not counted)
```

### Test Case 2: Paid Document Approved
```
Status: "Approved"
Amount: ₱50.00
Expected: Amber notification "Upload Payment"
Badge: YES [1]
```

### Test Case 3: Ready for Pickup
```
Status: "Ready for Pickup"
Amount: Any
Expected: Green notification "Ready for Pickup!"
Badge: YES [1]
```

### Test Case 4: Rejected
```
Status: "Rejected"
Amount: Any
Expected: Red notification "Request Rejected"
Badge: YES [1]
```

### Test Case 5: Payment Submitted
```
Status: "Payment Submitted"
Amount: ₱50.00
Expected: NO notification (waiting for treasurer)
Badge: NO
```

### Test Case 6: Released
```
Status: "Released"
Amount: Any
Expected: NO notification (completed)
Badge: NO
```

## How to Verify Notifications Work

### Step 1: Fix Your Document
Use any method from MANUAL_FIX_DOCUMENT_STATUS.md

### Step 2: Check Notification Alert
```
Login as Resident → Go to Dashboard

Should see:
┌─────────────────────────────────────────┐
│ 🔵 1 Document Being Prepared            │
│ • Certificate of Indigency              │
└─────────────────────────────────────────┘
```

### Step 3: Check Badge
```
Look at sidebar:
🏠 My Dashboard [1] ← Should NOT show badge yet
                      (Payment Verified doesn't count in badge)
```

### Step 4: Secretary Marks Ready
```
Login as Secretary
Go to Documents → Verified tab
Click "Mark Ready" button
Status changes to "Ready for Pickup"
```

### Step 5: Check Notification Again
```
Login as Resident → Go to Dashboard

Should see:
┌─────────────────────────────────────────┐
│ 📦 1 Document Ready for Pickup! 🎉      │
│ • Certificate of Indigency              │
│ 📍 Visit office: Mon-Fri 8AM-5PM        │
└─────────────────────────────────────────┘
```

### Step 6: Check Badge Again
```
Look at sidebar:
🏠 My Dashboard [1] ← NOW shows badge!
                      (Ready for Pickup counts in badge)
```

## Common Issues

### Issue 1: "I fixed the status but still no notification"
**Check**:
- Did you refresh the page? (F5)
- Are you logged in as the correct resident?
- Is the document actually in "Payment Verified" status?
- Check browser console for errors (F12)

### Issue 2: "Badge shows wrong number"
**Check**:
- Badge counts: Ready for Pickup + Approved (paid) + Rejected
- Badge does NOT count: Payment Verified, Payment Submitted, Pending
- Multiple documents can add to the count

### Issue 3: "Notification shows but badge doesn't"
**This is correct!**
- "Payment Verified" shows notification but NOT badge
- "Ready for Pickup" shows BOTH notification AND badge

### Issue 4: "Auto-skip not working for new documents"
**Check**:
- Is the document amount exactly 0?
- Did Captain approve it (not just pending)?
- Check browser console for errors
- Try logging out and back in

## Summary

**Your Issue**: Document status is "Approved" (should be "Payment Verified")
**Why No Notification**: "Approved" with amount = 0 doesn't match any notification filter
**Why No Badge**: "Approved" with amount = 0 doesn't count in badge
**Fix**: Update status to "Payment Verified" (see MANUAL_FIX_DOCUMENT_STATUS.md)
**After Fix**: Blue notification will appear, but badge won't (until "Ready for Pickup")

The notification system is working correctly - it just needs the document to have the correct status!
