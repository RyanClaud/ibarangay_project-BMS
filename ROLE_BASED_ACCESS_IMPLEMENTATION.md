# Role-Based Access Control Implementation

## Current Implementation Status

### ✅ What's Working

1. **Firestore Security Rules**
   - Users can only access data from their barangay
   - Super admins can access all barangays
   - Residents can only see their own data

2. **Document Request Permissions**
   - **Approve**: Admin, Barangay Captain
   - **Mark as Paid**: Admin, Treasurer
   - **Release**: Admin, Secretary
   - **Delete**: Admin, Barangay Captain

3. **User Management**
   - Only Admin can add/edit/delete staff
   - Staff can view users in their barangay

### 🔧 What Needs Fixing

Based on proper barangay roles, here's what should be implemented:

---

## Correct Role Permissions

### Document Request Workflow

```
Pending → Processing → Approved → Paid → Released
   ↓          ↓           ↓         ↓        ↓
Secretary  Secretary   Captain  Treasurer Secretary
```

#### Status Transitions:

**1. Pending → Processing**
- **Who**: Secretary, Admin
- **Action**: Secretary reviews and starts processing
- **Button**: "Start Processing"

**2. Processing → Approved/Rejected**
- **Who**: Barangay Captain, Admin
- **Action**: Captain reviews and makes decision
- **Buttons**: "Approve" or "Reject"

**3. Approved → Paid**
- **Who**: Treasurer, Admin
- **Action**: Treasurer confirms payment received
- **Button**: "Mark as Paid"

**4. Paid → Released**
- **Who**: Secretary, Admin
- **Action**: Secretary releases document to resident
- **Button**: "Release Document"

---

## Detailed Permissions by Role

### Super Admin
```javascript
{
  residents: {
    view: 'all',      // All barangays
    add: true,
    edit: true,
    delete: true
  },
  documents: {
    view: 'all',      // All barangays
    process: true,
    approve: true,
    markPaid: true,
    release: true,
    delete: true
  },
  users: {
    view: 'all',      // All barangays
    add: true,
    edit: true,
    delete: true
  },
  barangays: {
    view: 'all',
    create: true,
    edit: true,
    delete: true
  },
  reports: {
    view: 'all',      // System-wide
    export: true
  }
}
```

### Admin (Barangay)
```javascript
{
  residents: {
    view: 'own',      // Own barangay only
    add: true,
    edit: true,
    delete: true
  },
  documents: {
    view: 'own',      // Own barangay only
    process: true,
    approve: true,
    markPaid: true,
    release: true,
    delete: true
  },
  users: {
    view: 'own',      // Own barangay only
    add: true,        // Can add staff
    edit: true,
    delete: true
  },
  barangays: {
    view: 'own',
    create: false,
    edit: true,       // Can edit own barangay info
    delete: false
  },
  reports: {
    view: 'own',      // Own barangay only
    export: true
  }
}
```

### Barangay Captain
```javascript
{
  residents: {
    view: 'own',      // Own barangay only
    add: false,
    edit: false,
    delete: false
  },
  documents: {
    view: 'own',      // Own barangay only
    process: false,
    approve: true,    // ✅ Main responsibility
    markPaid: false,
    release: false,
    delete: true      // Can delete if needed
  },
  users: {
    view: false,
    add: false,
    edit: false,
    delete: false
  },
  barangays: {
    view: 'own',
    create: false,
    edit: false,
    delete: false
  },
  reports: {
    view: 'own',      // Can view reports
    export: true
  }
}
```

### Secretary
```javascript
{
  residents: {
    view: 'own',      // Own barangay only
    add: true,        // ✅ Can add residents
    edit: true,       // ✅ Can edit resident info
    delete: false
  },
  documents: {
    view: 'own',      // Own barangay only
    process: true,    // ✅ Can process requests
    approve: false,   // ❌ Cannot approve (Captain does)
    markPaid: false,  // ❌ Cannot mark paid (Treasurer does)
    release: true,    // ✅ Can release documents
    delete: false
  },
  users: {
    view: false,
    add: false,
    edit: false,
    delete: false
  },
  barangays: {
    view: 'own',
    create: false,
    edit: false,
    delete: false
  },
  reports: {
    view: 'own',      // Can view reports
    export: true
  }
}
```

### Treasurer
```javascript
{
  residents: {
    view: 'own',      // Own barangay only (for payment verification)
    add: false,
    edit: false,
    delete: false
  },
  documents: {
    view: 'own',      // Own barangay only
    process: false,
    approve: false,
    markPaid: true,   // ✅ Main responsibility
    release: false,
    delete: false
  },
  users: {
    view: false,
    add: false,
    edit: false,
    delete: false
  },
  barangays: {
    view: 'own',
    create: false,
    edit: false,
    delete: false
  },
  reports: {
    view: 'own',      // Can view financial reports
    export: true
  }
}
```

### Resident
```javascript
{
  residents: {
    view: 'self',     // Only own profile
    add: false,
    edit: 'self',     // Can edit own profile
    delete: false
  },
  documents: {
    view: 'self',     // Only own requests
    process: false,
    approve: false,
    markPaid: false,
    release: false,
    delete: false,
    create: true      // ✅ Can create requests
  },
  users: {
    view: false,
    add: false,
    edit: false,
    delete: false
  },
  barangays: {
    view: 'own',      // Can view barangay info
    create: false,
    edit: false,
    delete: false
  },
  reports: {
    view: false,
    export: false
  }
}
```

---

## Implementation Checklist

### ✅ Already Implemented

- [x] Firestore security rules for data isolation
- [x] Basic role checking in document actions
- [x] User management by Admin
- [x] Barangay-specific data filtering

### 🔧 Needs Implementation

- [ ] **Process button** for Secretary (Pending → Processing)
- [ ] **Reject button** for Captain (with reason)
- [ ] **Resident management** permissions (Secretary can add/edit)
- [ ] **Dashboard customization** per role
- [ ] **Navigation menu** based on role
- [ ] **Reports access** based on role
- [ ] **Payment tracking** for Treasurer
- [ ] **Audit logs** for actions

---

## Code Examples

### Check if user can approve documents:

```typescript
const canApprove = (user: User) => {
  return user.role === 'Admin' || user.role === 'Barangay Captain';
};
```

### Check if user can manage residents:

```typescript
const canManageResidents = (user: User) => {
  return user.role === 'Admin' || user.role === 'Secretary';
};
```

### Check if user can mark payments:

```typescript
const canMarkPaid = (user: User) => {
  return user.role === 'Admin' || user.role === 'Treasurer';
};
```

### Check if user can release documents:

```typescript
const canRelease = (user: User) => {
  return user.role === 'Admin' || user.role === 'Secretary';
};
```

---

## Navigation Menu by Role

### Super Admin
- Dashboard
- Barangays (all)
- System Analytics
- Users (all)
- Settings

### Admin
- Dashboard
- Residents
- Documents
- Users (own barangay)
- Reports
- Settings

### Barangay Captain
- Dashboard
- Residents (view only)
- Documents (approve/reject)
- Reports
- Profile

### Secretary
- Dashboard
- Residents (add/edit)
- Documents (process/release)
- Reports
- Profile

### Treasurer
- Dashboard
- Documents (payments)
- Financial Reports
- Profile

### Resident
- Dashboard
- My Profile
- Request Document
- My Requests
- Announcements

---

## Dashboard Widgets by Role

### Super Admin
- Total barangays
- Total residents (all)
- Total documents (all)
- System health
- Recent activity (all)

### Admin
- Total residents (own)
- Pending documents
- Revenue this month
- Recent activity (own)

### Barangay Captain
- Pending approvals
- Approved this month
- Total residents
- Recent requests

### Secretary
- Pending processing
- To be released
- New residents
- Recent activity

### Treasurer
- Pending payments
- Revenue today
- Revenue this month
- Payment history

### Resident
- My pending requests
- My completed requests
- Barangay announcements
- Quick request button

---

## Summary

The role-based access control is designed to match real-world barangay operations:

1. **Admin** = Full control of their barangay
2. **Captain** = Approves/rejects documents (decision maker)
3. **Secretary** = Processes and releases documents (operations)
4. **Treasurer** = Manages payments (financial)
5. **Resident** = Requests services (end user)

Each role has specific permissions that reflect their real-world responsibilities in a Philippine barangay office.
