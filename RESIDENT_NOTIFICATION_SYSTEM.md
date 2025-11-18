# Resident Notification System

## Overview
Residents now receive visual notifications on their dashboard for important document status changes, especially when documents are **Ready for Pickup**.

## Features Implemented

### 1. Dashboard Status Alerts
**File**: `src/components/notifications/document-status-alert.tsx`

Visual alert cards that appear at the top of the resident dashboard showing:

#### Priority 1: Ready for Pickup (Green Alert)
```
┌─────────────────────────────────────────────────────┐
│ 📦 2 Documents Ready for Pickup! 🎉                 │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Barangay Clearance                              │ │
│ │ Tracking: IBGY-123456                  [Ready]  │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Certificate of Residency                        │ │
│ │ Tracking: IBGY-123457                  [Ready]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📍 Visit the barangay office during office hours   │
│ ⏰ Office Hours: Monday-Friday, 8:00 AM - 5:00 PM  │
└─────────────────────────────────────────────────────┘
```

#### Priority 2: Payment Verified / Being Prepared (Blue Alert)
```
┌─────────────────────────────────────────────────────┐
│ ⏰ 1 Document Being Prepared                        │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Barangay Clearance                              │ │
│ │ Tracking: IBGY-123458            [In Progress]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Your payment has been verified. The document is    │
│ being prepared and will be ready soon.             │
└─────────────────────────────────────────────────────┘
```

#### Priority 3: Approved / Needs Payment (Amber Alert)
```
┌─────────────────────────────────────────────────────┐
│ 🔔 Action Required: Upload Payment Proof           │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Certificate of Residency                        │ │
│ │ Amount: ₱75.00                      [Pay Now]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Your request has been approved. Please upload your │
│ payment proof to continue processing.              │
└─────────────────────────────────────────────────────┘
```

#### Priority 4: Rejected (Red Alert)
```
┌─────────────────────────────────────────────────────┐
│ ❌ 1 Request Rejected                               │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Business Permit                                 │ │
│ │ Tracking: IBGY-123459                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Please contact the barangay office for more        │
│ information about the rejection.                   │
└─────────────────────────────────────────────────────┘
```

### 2. Sidebar Notification Badge
**File**: `src/components/layout/sidebar-nav.tsx`

A red badge appears on the "My Dashboard" menu item showing the count of important notifications:

```
Sidebar Menu:
┌─────────────────────────┐
│ 🏠 My Dashboard    [3]  │ ← Red badge with count
│ ⚙️  Settings            │
└─────────────────────────┘
```

**Badge counts**:
- Ready for Pickup documents
- Approved documents needing payment
- Rejected documents

### 3. Notification Count Hook
**File**: `src/hooks/use-notification-count.ts`

Reusable hook that calculates the number of important notifications:

```typescript
const notificationCount = useNotificationCount(documentRequests);
// Returns: number of important notifications
```

## User Experience

### Resident Dashboard Flow

#### Step 1: Login
```
Resident logs in → Redirected to Dashboard
```

#### Step 2: See Notifications
```
Dashboard loads → Notifications appear at top
                → Badge shows count in sidebar
```

#### Step 3: Take Action
```
Ready for Pickup → Visit barangay office
Needs Payment → Click "Pay Now" button
Being Prepared → Wait for ready notification
Rejected → Contact barangay office
```

### Visual Hierarchy

**Most Important (Top)**:
1. 🟢 Ready for Pickup (Green)
2. 🔵 Being Prepared (Blue)
3. 🟡 Needs Payment (Amber)
4. 🔴 Rejected (Red)

**Least Important (Bottom)**:
- Regular status table

## Status Notification Triggers

### When Notifications Appear:

| Status | Notification | Priority | Action Required |
|--------|-------------|----------|-----------------|
| **Ready for Pickup** | ✅ Yes | Highest | Visit office |
| **Payment Verified** | ✅ Yes | High | Wait |
| **Approved** (paid docs) | ✅ Yes | Medium | Upload payment |
| **Rejected** | ✅ Yes | Medium | Contact office |
| Pending | ❌ No | - | Wait |
| Payment Submitted | ❌ No | - | Wait |
| Released | ❌ No | - | None |

### Notification Lifecycle:

```
Document Created (Pending)
  ↓
No notification (waiting for approval)
  ↓
Approved (if amount > 0)
  ↓
🟡 NOTIFICATION: "Upload Payment Proof"
  ↓
Payment Submitted
  ↓
Notification removed (waiting for verification)
  ↓
Payment Verified
  ↓
🔵 NOTIFICATION: "Document Being Prepared"
  ↓
Ready for Pickup
  ↓
🟢 NOTIFICATION: "Ready for Pickup!" (HIGHEST PRIORITY)
  ↓
Released
  ↓
Notification removed (completed)
```

## Implementation Details

### Alert Component Structure

```typescript
<DocumentStatusAlert requests={residentRequests} />
```

**Props**:
- `requests`: Array of DocumentRequest objects

**Behavior**:
- Automatically filters requests by status
- Shows only relevant notifications
- Returns null if no notifications
- Responsive design (mobile-friendly)

### Notification Badge Logic

```typescript
const notificationCount = useMemo(() => {
  if (!requests) return 0;
  
  const readyForPickup = requests.filter(r => r.status === 'Ready for Pickup').length;
  const approved = requests.filter(r => r.status === 'Approved' && r.amount > 0).length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;
  
  return readyForPickup + approved + rejected;
}, [requests]);
```

**Counts**:
- ✅ Ready for Pickup
- ✅ Approved (only paid documents)
- ✅ Rejected
- ❌ Not counted: Pending, Payment Submitted, Payment Verified, Released

### Color Coding

| Status | Color | Tailwind Classes |
|--------|-------|------------------|
| Ready for Pickup | Green | `border-green-500 bg-green-50` |
| Being Prepared | Blue | `border-blue-500 bg-blue-50` |
| Needs Payment | Amber | `border-amber-500 bg-amber-50` |
| Rejected | Red | `border-red-500 bg-red-50` |

## Benefits

### For Residents

✅ **Clear Communication**
- Know exactly when to pick up documents
- See what action is needed
- Understand document status at a glance

✅ **No Missed Pickups**
- Prominent "Ready for Pickup" alerts
- Office hours displayed
- Multiple visual indicators

✅ **Reduced Confusion**
- Clear status explanations
- Action buttons where needed
- Priority-based display

### For Barangay Staff

✅ **Fewer Inquiries**
- Residents self-serve status information
- Clear instructions reduce questions
- Less phone calls about status

✅ **Better Service**
- Residents know when to visit
- Reduced wait times
- Improved satisfaction

### For System

✅ **Real-time Updates**
- Notifications update automatically
- No page refresh needed
- Reactive to status changes

✅ **Scalable**
- Works with any number of requests
- Efficient filtering
- Minimal performance impact

## Testing Checklist

### Test Ready for Pickup Notification

- [ ] Secretary marks document as "Ready for Pickup"
- [ ] Resident logs in
- [ ] Green alert appears at top of dashboard
- [ ] Badge shows count in sidebar
- [ ] Alert shows document details
- [ ] Office hours displayed
- [ ] Alert disappears when document is released

### Test Payment Needed Notification

- [ ] Captain approves paid document
- [ ] Resident logs in
- [ ] Amber alert appears
- [ ] "Pay Now" button visible
- [ ] Badge count increases
- [ ] Alert disappears after payment upload

### Test Being Prepared Notification

- [ ] Treasurer verifies payment
- [ ] Resident logs in
- [ ] Blue alert appears
- [ ] Shows "In Progress" status
- [ ] Alert updates when ready for pickup

### Test Rejected Notification

- [ ] Staff rejects document
- [ ] Resident logs in
- [ ] Red alert appears
- [ ] Shows rejection message
- [ ] Badge count increases

### Test Multiple Notifications

- [ ] Create multiple documents in different statuses
- [ ] Verify all relevant alerts appear
- [ ] Verify correct priority order
- [ ] Verify badge shows total count
- [ ] Verify no duplicate alerts

## Future Enhancements

### Possible Additions:

1. **Email Notifications**
   - Send email when document is ready
   - Configurable in settings
   - Include tracking number and office hours

2. **SMS Notifications**
   - Text message for ready documents
   - Requires SMS service integration
   - Optional opt-in

3. **Push Notifications**
   - Browser push notifications
   - Mobile app notifications
   - Real-time alerts

4. **Notification History**
   - View past notifications
   - Mark as read/unread
   - Notification archive

5. **Custom Notification Preferences**
   - Choose which notifications to receive
   - Set notification frequency
   - Quiet hours

## Troubleshooting

### Notifications Not Showing

**Check**:
1. Is user logged in as Resident?
2. Are there documents in relevant statuses?
3. Is DocumentStatusAlert component imported?
4. Are requests being passed correctly?

### Badge Count Wrong

**Check**:
1. Is useNotificationCount hook imported?
2. Are documentRequests available in context?
3. Is filtering logic correct?
4. Check browser console for errors

### Alerts Not Updating

**Check**:
1. Is component re-rendering on status change?
2. Are requests reactive (from context)?
3. Is useMemo working correctly?
4. Try refreshing the page

## Summary

The resident notification system provides:

✅ **Visual Alerts**: Prominent cards showing important status changes
✅ **Sidebar Badge**: Quick notification count indicator
✅ **Priority System**: Most important notifications shown first
✅ **Action Buttons**: Direct links to required actions
✅ **Clear Instructions**: Office hours, next steps, contact info
✅ **Real-time Updates**: Automatic updates when status changes

Residents now have a clear, visual way to know when their documents are ready for pickup!
