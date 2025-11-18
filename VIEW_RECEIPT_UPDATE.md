# View Receipt Update - Resident Dashboard

## What Changed

Replaced "View Certificate" button with "View Receipt" button in the resident dashboard.

## Before:
```
┌─────────────────────────────────────┐
│ Status: Payment Verified            │
│ [View Certificate] ← Navigated away │
└─────────────────────────────────────┘
```

## After:
```
┌─────────────────────────────────────┐
│ Status: Payment Verified            │
│ [🧾 View Receipt] ← Opens dialog    │
└─────────────────────────────────────┘
```

## Changes Made

### 1. Updated Button
**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Changed**:
- Button text: "View Certificate" → "View Receipt"
- Button icon: FileSearch → Receipt
- Action: Navigate to certificate page → Open receipt dialog

### 2. Added Receipt Dialog
Shows the official payment receipt in a modal dialog instead of navigating to a separate page.

### 3. When Button Appears
The "View Receipt" button shows when document status is:
- ✅ Payment Verified
- ✅ Ready for Pickup
- ✅ Released

## User Experience

### Resident Dashboard - Request History Table

**Payment Verified Status**:
```
┌──────────────────────────────────────────────────────┐
│ Tracking │ Document │ Date │ Amount │ Status │ Actions│
├──────────────────────────────────────────────────────┤
│ IBGY-001 │ Clearance│ Nov  │ ₱50.00 │ Payment│ [Pay  │
│          │          │ 15   │        │ Verified│ Now]  │
│          │          │      │        │        │ [🧾   │
│          │          │      │        │        │ View  │
│          │          │      │        │        │ Receipt]│
└──────────────────────────────────────────────────────┘
```

**Ready for Pickup Status**:
```
┌──────────────────────────────────────────────────────┐
│ Tracking │ Document │ Date │ Amount │ Status │ Actions│
├──────────────────────────────────────────────────────┤
│ IBGY-002 │ Residency│ Nov  │ ₱75.00 │ Ready  │ [🧾   │
│          │          │ 14   │        │ for    │ View  │
│          │          │      │        │ Pickup │ Receipt]│
└──────────────────────────────────────────────────────┘
```

**Released Status**:
```
┌──────────────────────────────────────────────────────┐
│ Tracking │ Document │ Date │ Amount │ Status │ Actions│
├──────────────────────────────────────────────────────┤
│ IBGY-003 │ Indigency│ Nov  │ ₱0.00  │ Released│[🧾   │
│          │          │ 13   │        │        │ View  │
│          │          │      │        │        │ Receipt]│
└──────────────────────────────────────────────────────┘
```

## Receipt Dialog

When resident clicks "View Receipt", a modal dialog opens showing:

```
┌─────────────────────────────────────────────────────┐
│ Official Receipt                              [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Barangay Seal]    BARANGAY MINA DE ORO          │
│                     Official Receipt               │
│                                                     │
│  Receipt No: OR-2025-001                           │
│  Date: November 16, 2025                           │
│                                                     │
│  Received from: Ryan Claud                         │
│  Address: Sitio Riverside, Mina de Oro            │
│                                                     │
│  For: Barangay Clearance                           │
│  Amount: ₱50.00                                    │
│                                                     │
│  Payment Method: GCash                             │
│  Transaction ID: APF12345XYZ                       │
│                                                     │
│  [Print Receipt] [Download PDF]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Benefits

### For Residents:
- ✅ Stay on the same page (no navigation)
- ✅ Quick access to receipt
- ✅ Can print or download receipt
- ✅ Better user experience

### For System:
- ✅ Consistent with Documents page behavior
- ✅ Reuses existing PaymentReceipt component
- ✅ Modal dialog is more modern UX pattern

## Technical Details

### Components Used:
- `PaymentReceipt` - Displays the official receipt
- `Dialog` - Modal dialog wrapper
- `Receipt` icon from lucide-react

### State Management:
```typescript
const [receiptRequest, setReceiptRequest] = useState<DocumentRequest | null>(null);

const handleViewReceipt = (request: DocumentRequest) => {
  setReceiptRequest(request);
};
```

### Dialog Control:
```typescript
<Dialog open={!!receiptRequest} onOpenChange={(open) => !open && setReceiptRequest(null)}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Official Receipt</DialogTitle>
    </DialogHeader>
    <PaymentReceipt request={receiptRequest} />
  </DialogContent>
</Dialog>
```

## Testing

### Test 1: View Receipt for Payment Verified
1. Login as Resident
2. Go to Dashboard
3. Find document with "Payment Verified" status
4. Click "View Receipt" button
5. Receipt dialog should open
6. Should show payment details
7. Can print or download

### Test 2: View Receipt for Ready for Pickup
1. Login as Resident
2. Go to Dashboard
3. Find document with "Ready for Pickup" status
4. Click "View Receipt" button
5. Receipt dialog should open
6. Should show all details

### Test 3: View Receipt for Released
1. Login as Resident
2. Go to Dashboard
3. Find document with "Released" status
4. Click "View Receipt" button
5. Receipt dialog should open
6. Should show completed transaction

### Test 4: Close Dialog
1. Open receipt dialog
2. Click X button or outside dialog
3. Dialog should close
4. Should return to dashboard

### Test 5: Print Receipt
1. Open receipt dialog
2. Click "Print Receipt" button
3. Browser print dialog should open
4. Can print or save as PDF

## Summary

**Changed**: "View Certificate" → "View Receipt"
**Behavior**: Navigate away → Open modal dialog
**When**: Payment Verified, Ready for Pickup, Released statuses
**Benefit**: Better UX, stays on same page, quick access to receipt

Residents can now easily view and print their payment receipts without leaving the dashboard!
