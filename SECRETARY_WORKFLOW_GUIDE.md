# Secretary Workflow Guide

## Overview
The Secretary is responsible for preparing documents and managing the final stages of document requests.

## Secretary Responsibilities

### 1. Manage Residents
- Add new residents
- Update resident information
- View resident profiles

### 2. Process Documents
- Mark documents as "Ready for Pickup"
- Mark documents as "Released" when picked up
- View and print receipts

### 3. Cannot Do
- ❌ Approve/Reject requests (Captain only)
- ❌ Verify payments (Treasurer only)
- ❌ View staff accounts (Admin only)

## Document Status Workflow

### Secretary's Role in the Workflow

```
Pending
  ↓ (Captain approves)
Approved
  ↓ (Resident uploads payment OR auto-skip if free)
Payment Submitted
  ↓ (Treasurer verifies)
Payment Verified ← SECRETARY STARTS HERE
  ↓ (Secretary marks ready)
Ready for Pickup
  ↓ (Secretary marks released when resident picks up)
Released ← SECRETARY ENDS HERE
```

## What Secretary Sees on Documents Page

### Status Column with Action Buttons

#### When Status is "Payment Verified":
```
┌─────────────────────────────────────┐
│ Status: Payment Verified            │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Mark Ready                    │ │ ← GREEN BUTTON
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ View Receipt                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Action**: Click "Mark Ready" when document is prepared and ready for pickup

#### When Status is "Ready for Pickup":
```
┌─────────────────────────────────────┐
│ Status: Ready for Pickup            │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Mark Released                 │ │ ← BLUE BUTTON
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ View Receipt                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Action**: Click "Mark Released" when resident picks up the document

### Dropdown Menu Actions

#### For "Payment Verified" Documents:
```
Actions (⋮)
├─ View Resident
├─ View Receipt
├─────────────────
└─ ✓ Mark as Ready for Pickup ← GREEN OPTION
```

#### For "Ready for Pickup" Documents:
```
Actions (⋮)
├─ View Resident
├─ View Receipt
├─────────────────
└─ ✓ Mark as Released ← BLUE OPTION
```

## Step-by-Step: Processing a Document

### Step 1: Find Documents to Process

**Go to Documents Page**:
```
Navigation: Documents
```

**Use Tabs to Filter**:
```
Tabs:
[All] [Pending] [Approved] [Payment] [Verified] [Ready] [Released] [Rejected]
                                         ↑
                                    Click here
```

**Look for "Payment Verified" status**:
- These documents need to be prepared
- Payment has been verified by Treasurer
- Ready for you to process

### Step 2: Prepare the Document

**Physical Steps**:
1. Print the certificate/clearance
2. Have Barangay Captain sign it
3. Affix barangay seal
4. Place in envelope (optional)
5. Label with resident's name

**System Steps**:
1. Click "View Receipt" to see payment details
2. Verify payment amount matches
3. Print receipt if needed

### Step 3: Mark as Ready for Pickup

**When document is physically ready**:

**Option A: Click Button in Status Column**
```
Status: Payment Verified
[✓ Mark Ready] ← Click this green button
```

**Option B: Use Dropdown Menu**
```
Actions (⋮) → ✓ Mark as Ready for Pickup
```

**Result**:
- Status changes to "Ready for Pickup"
- Resident receives notification on their dashboard
- Document appears in "Ready" tab

### Step 4: Wait for Resident to Pick Up

**Resident will**:
- See green "Ready for Pickup" notification
- Visit barangay office during office hours
- Bring valid ID

**You should**:
- Keep document in safe place
- Have it ready for quick retrieval
- Verify resident's identity

### Step 5: Mark as Released

**When resident picks up document**:

**Verify Identity**:
1. Ask for valid ID
2. Confirm name matches request
3. Check tracking number if needed

**Release Document**:
1. Hand over document to resident
2. Ask resident to sign logbook (optional)

**Update System**:

**Option A: Click Button in Status Column**
```
Status: Ready for Pickup
[✓ Mark Released] ← Click this blue button
```

**Option B: Use Dropdown Menu**
```
Actions (⋮) → ✓ Mark as Released
```

**Result**:
- Status changes to "Released"
- Request is completed
- Document moves to "Released" tab

## Visual Guide: Secretary's View

### Documents Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Document Verification                                       │
│ Review, approve, or reject document requests from residents │
├─────────────────────────────────────────────────────────────┤
│ [Filter by name or tracking no...]                          │
├─────────────────────────────────────────────────────────────┤
│ [All][Pending][Approved][Payment][Verified][Ready][Released]│
│                                      ↑                       │
│                              Click to see your work          │
├─────────────────────────────────────────────────────────────┤
│ Tracking │ Resident │ Document │ Date │ Status │ Actions    │
├─────────────────────────────────────────────────────────────┤
│ IBGY-001 │ Juan     │ Clearance│ Nov  │ Payment│ [✓ Mark   │
│          │ Dela Cruz│          │ 15   │ Verified│  Ready]   │
│          │          │          │      │        │ [Receipt] │
│          │          │          │      │        │ [⋮]       │
├─────────────────────────────────────────────────────────────┤
│ IBGY-002 │ Maria    │ Residency│ Nov  │ Ready  │ [✓ Mark   │
│          │ Santos   │          │ 14   │ for    │  Released]│
│          │          │          │      │ Pickup │ [Receipt] │
│          │          │          │      │        │ [⋮]       │
└─────────────────────────────────────────────────────────────┘
```

## Common Scenarios

### Scenario 1: Free Document (Certificate of Indigency)

**Workflow**:
```
1. Captain approves
   ↓ (auto-skip to Payment Verified)
2. Status: Payment Verified
   ↓ (Secretary prepares document)
3. Click "Mark Ready"
   ↓
4. Status: Ready for Pickup
   ↓ (Resident picks up)
5. Click "Mark Released"
   ↓
6. Status: Released ✓
```

**Note**: No payment step for free documents!

### Scenario 2: Paid Document (Barangay Clearance)

**Workflow**:
```
1. Captain approves
   ↓
2. Resident uploads payment
   ↓
3. Treasurer verifies payment
   ↓
4. Status: Payment Verified
   ↓ (Secretary prepares document)
5. Click "Mark Ready"
   ↓
6. Status: Ready for Pickup
   ↓ (Resident picks up)
7. Click "Mark Released"
   ↓
8. Status: Released ✓
```

### Scenario 3: Resident Doesn't Pick Up

**If document is ready but not picked up**:

1. Status remains "Ready for Pickup"
2. Resident sees notification on dashboard
3. You can:
   - Wait (no time limit in system)
   - Call resident to remind them
   - Keep document in safe place

**Do NOT**:
- ❌ Mark as Released if not picked up
- ❌ Delete the request
- ❌ Change status back

## Tabs Explained

### "Verified" Tab
- Documents with "Payment Verified" status
- **Your action needed**: Prepare and mark as ready
- These are your primary work queue

### "Ready" Tab
- Documents with "Ready for Pickup" status
- **Your action needed**: Wait for pickup, then mark as released
- Check this tab when residents come to pick up

### "Released" Tab
- Completed documents
- No action needed
- For reference only

## Tips for Efficiency

### 1. Process in Batches
```
Morning:
- Check "Verified" tab
- Prepare all documents
- Mark all as "Ready" at once

Afternoon:
- Check "Ready" tab
- Release documents as residents arrive
```

### 2. Use Filters
```
Search by:
- Resident name
- Tracking number
- Document type
```

### 3. Print Receipts
```
Before marking as ready:
1. Click "View Receipt"
2. Print receipt
3. Attach to document
```

### 4. Keep Organized
```
Physical Organization:
- Separate folder for "Ready" documents
- Alphabetical order
- Label with tracking number
```

## Troubleshooting

### "I don't see Mark Ready button"

**Check**:
1. Is status "Payment Verified"?
2. Are you logged in as Secretary?
3. Try refreshing the page
4. Check the dropdown menu (⋮)

### "I accidentally marked as Released"

**Solution**:
1. Contact Admin
2. Admin can change status back
3. Or delete and recreate request

### "Resident lost their document"

**Solution**:
1. Check if status is "Released"
2. If yes, document was already given
3. Resident may need to request new one
4. Contact Admin for guidance

### "Can't find a document"

**Check**:
1. Use search/filter
2. Check all tabs
3. Ask resident for tracking number
4. Verify resident name spelling

## Summary

**Secretary's Main Tasks**:
1. ✅ Prepare documents after payment verification
2. ✅ Mark documents as "Ready for Pickup"
3. ✅ Release documents to residents
4. ✅ Manage resident information

**Key Buttons**:
- 🟢 **"Mark Ready"** - When document is prepared
- 🔵 **"Mark Released"** - When resident picks up
- 📄 **"View Receipt"** - To see payment details

**Remember**:
- Only mark as "Released" when physically handed to resident
- Verify resident identity before releasing
- Keep documents secure while "Ready for Pickup"
- Use tabs to organize your workflow

The system makes it easy to track and manage document requests from preparation to release!
