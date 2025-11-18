# 🏢 Multi-Barangay Data Isolation Guide

## How Multiple Barangays Use the System Without Conflicts

The iBarangay system uses a **multi-tenant architecture** with strict data isolation to ensure that multiple barangays can safely use the same application without any data conflicts or cross-contamination.

---

## 🔐 Core Isolation Mechanism

### 1. Barangay ID Scoping

Every piece of data in the system is tagged with a `barangayId`:

```typescript
// Example: User Document
{
  id: "user123",
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  role: "Secretary",
  barangayId: "mina-de-oro"  // ← Identifies which barangay
}

// Example: Resident Document
{
  id: "resident456",
  firstName: "Maria",
  lastName: "Santos",
  barangayId: "mina-de-oro"  // ← Same barangay
}

// Example: Document Request
{
  id: "request789",
  residentId: "resident456",
  documentType: "Barangay Clearance",
  barangayId: "mina-de-oro"  // ← Same barangay
}
```

**Key Point:** Every document in every collection has a `barangayId` field that acts as a "namespace" for that barangay's data.

---

## 🛡️ Security Rules Enforcement

### Firestore Security Rules

The system uses Firestore security rules to enforce data isolation at the database level:

```javascript
// Users can only access data from their barangay
match /residents/{residentId} {
  allow read: if isStaff() && 
    resource.data.barangayId == getUserBarangayId(request.auth.uid);
}

match /documentRequests/{requestId} {
  allow read: if isStaff() && 
    resource.data.barangayId == getUserBarangayId(request.auth.uid);
}
```

**What This Means:**
- A user 