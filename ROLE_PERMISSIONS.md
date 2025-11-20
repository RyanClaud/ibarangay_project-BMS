# Role-Based Permissions System

## Role Hierarchy

```
Super Admin (System-wide)
└── Admin (Per Barangay)
    ├── Barangay Captain (Per Barangay)
    ├── Secretary (Per Barangay)
    ├── Treasurer (Per Barangay)
    └── Resident (Per Barangay)
```

## Detailed Permissions

### Super Admin
**Can Do Everything:**
- View all barangays
- Create/edit/delete barangay admins
- View all users across all barangays
- View all residents across all barangays
- View all document requests across all barangays
- Access system analytics
- Configure system settings

**Cannot:**
- Nothing - has full access

### Admin (Barangay Level)
**Can:**
- Create/edit/delete staff (Captain, Secretary, Treasurer) for their barangay
- Create/edit/delete residents for their barangay
- View all users in their barangay
- View all residents in their barangay
- View all document requests in their barangay
- Approve/reject document requests
- Configure barangay settings (pricing, GCash, etc.)
- View barangay reports and analytics
- Manage payments

**Cannot:**
- Access other barangays' data
- Create other admins
- Access super admin features
- Delete their own account

### Barangay Captain
**Can:**
- **View residents** in their barangay (read-only)
- **View document requests** in their barangay
- **Approve/reject documents** (final approval authority)
- **View reports** and analytics for their barangay
- **View payments** status
- Change their own password

**Cannot:**
- Create/edit/delete users or residents
- Create/edit/delete staff
- Access staff management page
- Configure barangay settings
- Process payments
- Access other barangays' data
- View AI Insights (admin only)

### Secretary
**Can:**
- **View residents** in their barangay (read-only)
- **View document requests** in their barangay
- **Approve documents** (initial approval - requires captain's final approval)
- **Update document status** (processing, ready for pickup)
- **View payments** related to documents
- Change their own password

**Cannot:**
- Create/edit/delete users or residents
- Create/edit/delete staff
- Access staff management page
- Configure barangay settings
- Process payments (only view)
- Give final approval (captain only)
- Access other barangays' data
- View reports or analytics

### Treasurer
**Can:**
- **View residents** in their barangay (read-only)
- **View document requests** in their barangay
- **View payment details** for all documents
- **Verify payments** (mark as paid/verified)
- **Configure GCash payment settings**
- **View payment reports**
- Change their own password

**Cannot:**
- Create/edit/delete users or residents
- Create/edit/delete staff
- Access staff management page
- Approve/reject documents
- Configure other barangay settings
- Access other barangays' data
- View full analytics (only payment reports)

### Resident
**Can:**
- **View their own profile**
- **Edit their own profile** (limited fields)
- **Request documents** (certificates, clearances)
- **View their own document requests**
- **Upload payment proof** for their requests
- **Track request status**
- Change their own password

**Cannot:**
- View other residents' data
- View other residents' requests
- Approve/reject any documents
- Access staff features
- Configure any settings
- View reports or analytics
- Access other barangays' data

## Page Access Matrix

| Page | Super Admin | Admin | Captain | Secretary | Treasurer | Resident |
|------|-------------|-------|---------|-----------|-----------|----------|
| Dashboard | ✅ All | ✅ Own | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| Residents | ✅ All | ✅ CRUD | ✅ View | ✅ View | ✅ View | ❌ |
| Staff & Users | ✅ All | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Documents | ✅ All | ✅ Full | ✅ Approve | ✅ Process | ✅ View | ✅ Own |
| Payments | ✅ All | ✅ Full | ✅ View | ✅ View | ✅ Verify | ✅ Own |
| Reports | ✅ All | ✅ Own | ✅ Own | ❌ | ✅ Payment | ❌ |
| AI Insights | ✅ All | ✅ Own | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ All | ✅ Own | ❌ | ❌ | ✅ GCash | ✅ Profile |
| System Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Super Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Document Approval Workflow

### Standard Workflow:
```
1. Resident submits request → Status: "Pending"
2. Secretary reviews → Status: "Processing" (optional)
3. Secretary/Admin approves → Status: "Approved" → Resident pays
4. Resident uploads payment → Status: "Payment Submitted"
5. Treasurer verifies payment → Status: "Payment Verified"
6. Captain gives final approval → Status: "Ready for Pickup"
7. Admin/Secretary releases → Status: "Released"
```

### Quick Workflow (Admin/Captain):
```
1. Resident submits request → Status: "Pending"
2. Admin/Captain approves directly → Status: "Approved" → Resident pays
3. Treasurer verifies payment → Status: "Payment Verified"
4. Admin releases → Status: "Released"
```

## Implementation Notes

### User Creation
- **Super Admin** creates **Admins** (one per barangay)
- **Admin** creates **Staff** (Captain, Secretary, Treasurer) and **Residents**
- **No white error screens** during creation (uses isolated process)
- **BarangayId inheritance** ensures correct data isolation

### Data Isolation
- All queries filtered by `barangayId`
- Staff can only see their barangay's data
- Residents can only see their own data
- Super Admin sees all data

### Security
- Firestore rules enforce permissions
- Client-side checks for UI
- Server-side validation for operations
- Role-based access control (RBAC)

### Error Prevention
- User creation uses dedicated loading page
- No authentication switching on client
- Immediate page redirect after creation
- Multiple error suppression layers
