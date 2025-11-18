# Resident Notifications - Quick Guide

## What's New?

Residents now see **visual notifications** on their dashboard for important document status changes!

## Visual Overview

### Dashboard with Notifications

```
┌─────────────────────────────────────────────────────────┐
│ My Dashboard                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📦 2 Documents Ready for Pickup! 🎉                 │ │ ← GREEN ALERT
│ │                                                     │ │
│ │ • Barangay Clearance (IBGY-123456)                 │ │
│ │ • Certificate of Residency (IBGY-123457)           │ │
│ │                                                     │ │
│ │ 📍 Visit barangay office during office hours       │ │
│ │ ⏰ Monday-Friday, 8:00 AM - 5:00 PM                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔔 Action Required: Upload Payment Proof           │ │ ← AMBER ALERT
│ │                                                     │ │
│ │ • Business Permit - ₱100.00         [Pay Now]      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Stats Cards]                                           │
│ [Request Form]                                          │
│ [Request History Table]                                 │
└─────────────────────────────────────────────────────────┘
```

### Sidebar with Badge

```
┌─────────────────────────┐
│ iBarangay               │
│ Barangay Mina de Oro    │
├─────────────────────────┤
│                         │
│ 🏠 My Dashboard    [3]  │ ← RED BADGE (notification count)
│ ⚙️  Settings            │
│                         │
├─────────────────────────┤
│ 🚪 Logout               │
└─────────────────────────┘
```

## Notification Types

### 1. Ready for Pickup (🟢 Green - Highest Priority)

**When**: Document is ready to claim
**What to do**: Visit barangay office
**Looks like**:
```
┌─────────────────────────────────────┐
│ 📦 Ready for Pickup! 🎉             │
│ • Barangay Clearance                │
│ 📍 Visit office during office hours │
│ ⏰ Mon-Fri, 8:00 AM - 5:00 PM       │
└─────────────────────────────────────┘
```

### 2. Being Prepared (🔵 Blue)

**When**: Payment verified, document being prepared
**What to do**: Wait for ready notification
**Looks like**:
```
┌─────────────────────────────────────┐
│ ⏰ Document Being Prepared          │
│ • Certificate of Residency          │
│ Payment verified. Will be ready soon│
└─────────────────────────────────────┘
```

### 3. Needs Payment (🟡 Amber)

**When**: Request approved, payment needed
**What to do**: Click "Pay Now" to upload proof
**Looks like**:
```
┌─────────────────────────────────────┐
│ 🔔 Action Required: Upload Payment  │
│ • Business Permit - ₱100.00         │
│                        [Pay Now]    │
└─────────────────────────────────────┘
```

### 4. Rejected (🔴 Red)

**When**: Request was rejected
**What to do**: Contact barangay office
**Looks like**:
```
┌─────────────────────────────────────┐
│ ❌ Request Rejected                 │
│ • Good Moral Certificate            │
│ Contact office for more information │
└─────────────────────────────────────┘
```

## How It Works

### Status Flow with Notifications

```
Pending
  ↓
  (no notification - waiting)
  ↓
Approved (if paid document)
  ↓
  🟡 NOTIFICATION: "Upload Payment"
  ↓
Payment Submitted
  ↓
  (no notification - being verified)
  ↓
Payment Verified
  ↓
  🔵 NOTIFICATION: "Being Prepared"
  ↓
Ready for Pickup
  ↓
  🟢 NOTIFICATION: "Ready for Pickup!" ⭐
  ↓
Released
  ↓
  (notification removed - completed)
```

### Free Documents (Certificate of Indigency)

```
Pending
  ↓
Approved (auto-skip to Payment Verified)
  ↓
  🔵 NOTIFICATION: "Being Prepared"
  ↓
Ready for Pickup
  ↓
  🟢 NOTIFICATION: "Ready for Pickup!" ⭐
```

## Notification Badge Count

**Counts these statuses**:
- ✅ Ready for Pickup
- ✅ Approved (needs payment)
- ✅ Rejected

**Does NOT count**:
- ❌ Pending (waiting)
- ❌ Payment Submitted (being verified)
- ❌ Payment Verified (being prepared - shown in alert but not badge)
- ❌ Released (completed)

## Key Features

### 1. Priority Display
Notifications appear in order of importance:
1. 🟢 Ready for Pickup (most important)
2. 🔵 Being Prepared
3. 🟡 Needs Payment
4. 🔴 Rejected

### 2. Action Buttons
- "Pay Now" button for approved documents
- Direct links to required actions
- One-click navigation

### 3. Clear Information
- Document type and tracking number
- Office hours for pickup
- Next steps explained
- Contact information

### 4. Real-time Updates
- Notifications update automatically
- No page refresh needed
- Badge count updates instantly

## For Residents

### What You'll See:

**When document is ready**:
- 🟢 Big green alert at top of dashboard
- 📦 "Ready for Pickup!" message
- 📍 Office location and hours
- [3] Red badge on sidebar

**When payment is needed**:
- 🟡 Amber alert with "Action Required"
- 💰 Amount to pay
- [Pay Now] button
- Badge count increases

**When document is being prepared**:
- 🔵 Blue alert "Being Prepared"
- ⏰ "Will be ready soon" message
- No action needed

### What to Do:

1. **See green "Ready for Pickup" alert**
   → Visit barangay office during office hours

2. **See amber "Upload Payment" alert**
   → Click "Pay Now" and upload proof

3. **See blue "Being Prepared" alert**
   → Just wait, no action needed

4. **See red "Rejected" alert**
   → Contact barangay office for details

## Benefits

### Clear Communication
- ✅ Know exactly when to pick up documents
- ✅ See what action is needed
- ✅ No more guessing about status

### No Missed Pickups
- ✅ Prominent visual alerts
- ✅ Office hours displayed
- ✅ Multiple indicators (alert + badge)

### Reduced Confusion
- ✅ Priority-based display
- ✅ Clear instructions
- ✅ Action buttons where needed

### Time Savings
- ✅ No need to call office for status
- ✅ Know when to visit
- ✅ Self-service information

## Summary

**Before**: Residents had to check status table manually
**After**: Prominent notifications show important updates

**Key Improvements**:
- 🎯 Visual alerts for important statuses
- 🔔 Sidebar badge with notification count
- 📍 Office hours and pickup information
- 🔘 Action buttons for required steps
- ⚡ Real-time updates

Residents now have a clear, visual way to stay informed about their document requests!
