# iBarangay: Digital Barangay Management System
## System Integration and Architecture — Technical Detail
### Sections IX–XXVI

---

## IX. SYSTEM ARCHITECTURE DESIGN (continued)

### E. Infrastructure Layer

The infrastructure layer is entirely cloud-hosted with no on-premises components required.

- **Vercel (Hosting & CDN)** — Deploys the Next.js 14 application globally via Vercel's edge network. Provides automatic HTTPS/TLS, CI/CD triggered by GitHub pushes, serverless function execution for API routes, and instant rollback to any prior deployment. Configuration defined in `vercel.json`.

- **Firebase App Hosting** — Configured via `apphosting.yaml` with `maxInstances: 1` for cost-controlled scaling during the pilot phase. Can be scaled to higher instances as user load increases.

- **Google Cloud Platform (GCP)** — Underlying infrastructure for all Firebase services. Provides multi-region redundancy, AES-256 encryption at rest, and managed service-level availability guarantees for Firestore, Authentication, Storage, and Cloud Functions.

- **Workbox via next-pwa (`@ducanh2912/next-pwa@^10.2.9`)** — Build-time service worker generation. Produces `public/sw.js` at build, managing:
  - **Cache-first strategy** — Static assets (JS bundles, CSS, fonts, images)
  - **Network-first strategy** — Dynamic API responses and Firestore data
  - **Stale-while-revalidate** — Dashboard pages and resident lists
  - PWA is disabled in development (`NODE_ENV === 'development'`) and enabled in production builds only

- **GitHub** — Source code repository with full commit history. Acts as the trigger for Vercel deployments and the authoritative backup of all application code.

---

## X. INTEGRATION ARCHITECTURE

### API Architecture

iBarangay implements a **dual API pattern** that separates concerns between client-facing real-time data access and server-side privileged operations:

**Pattern 1 — Firebase SDK (Client-side Direct Access)**
- Used for all standard CRUD operations: resident management, document requests, payment records
- The Firebase JavaScript SDK (`firebase@^11.9.1`) communicates directly with Firestore and Storage from the browser
- Security is enforced entirely by declarative Firestore and Storage rules — no custom endpoint needed
- Real-time updates via `onSnapshot()` listeners eliminate polling

**Pattern 2 — Next.js API Routes (Server-side Privileged Operations)**
- Used exclusively when the Firebase Admin SDK is required (user creation, deletion, custom claim assignment)
- All routes under `src/app/api/` execute as Vercel serverless functions
- Every route verifies the caller's Firebase JWT before executing any Admin SDK operation
- Keeps Admin SDK service account credentials server-side, never exposed to the browser

### API Gateway

Vercel's edge network acts as the implicit API gateway for all Next.js API routes:

| Capability | Implementation |
|---|---|
| HTTPS/TLS termination | Automatic on all Vercel deployments |
| Request routing | `/api/*` mapped to serverless functions |
| Edge caching | Static responses cached at edge nodes |
| DDoS protection | Vercel platform-level protection |
| Rate limiting | Vercel platform controls + Firebase Auth built-in |
| Logging | Vercel dashboard with function invocation logs |
| CI/CD trigger | GitHub webhook on push to main branch |

### Web Services

| Service | Provider | Integration Method | Purpose |
|---|---|---|---|
| AI Analytics & Reports | Google Gemini | Genkit SDK server-side | Natural language report generation, trend analysis |
| Authentication | Firebase Auth | Firebase SDK client + Admin SDK server | User identity, JWT token issuance |
| Database | Cloud Firestore | Firebase SDK | Real-time NoSQL data operations |
| File Storage | Firebase Storage | Firebase SDK | Barangay seals, payment proof images |
| Hosting & CDN | Vercel | GitHub CI/CD + Vercel CLI | Application delivery |
| PDF Generation | jsPDF + html2canvas | npm library client-side | Barangay certificate generation |
| Address Data | ph-geo-admin-divisions | npm library | PSGC-compliant address dropdowns |

### Database Integration

Cloud Firestore integration via Firebase JavaScript SDK v11 uses the following access patterns:

| Operation | SDK Method | Use Case |
|---|---|---|
| Real-time listen | `onSnapshot()` | Live dashboard updates, document status tracking |
| One-time read (single) | `getDoc()` | Fetch specific resident or request |
| One-time read (query) | `getDocs()` with `where()` | Filtered lists by barangayId |
| Create | `setDoc()` / `addDoc()` | New resident, new document request |
| Update | `updateDoc()` | Status change, payment verification |
| Delete | `deleteDoc()` | Remove resident or document record |
| Batch write | `writeBatch()` | Multi-document atomic updates |
| Increment | `increment()` | Counter fields (e.g., request counts) |

All queries include a `where('barangayId', '==', userBarangayId)` filter to enforce tenant data isolation. Super Admin queries omit this filter to access all barangays.

### Authentication/SSO

Firebase Authentication is the sole identity provider for iBarangay. It manages the complete authentication lifecycle:

**Login Flow:**
1. User submits email and password on `/login`
2. `signInWithEmailAndPassword()` authenticates against Firebase Auth
3. Firebase issues a signed JWT (ID token) valid for 1 hour
4. Token is stored in the browser by the Firebase SDK and auto-refreshed before expiry
5. All subsequent Firestore and Storage requests include the token in the Authorization header
6. Firestore rules call `request.auth` to read the token and evaluate access

**Super Admin Flow:**
- `isSuperAdmin: true` custom claim is set via Firebase Admin SDK on the user's token
- Rules check `request.auth.token.isSuperAdmin == true` for cross-barangay access
- Custom claims persist until explicitly revoked or the user's token is refreshed

**Password Reset:**
- Firebase built-in `sendPasswordResetEmail()` dispatches a time-limited reset link to the user's email
- No custom password reset endpoint is needed

**Session Management:**
- Firebase persistence is set to `browserLocalStorage` so sessions survive page refreshes
- Logout calls `signOut()` which clears the local token and terminates all active listeners

### Notification Services

| Channel | Trigger | Implementation | Status |
|---|---|---|---|
| In-app Toast | Any user action (save, approve, error) | Radix UI Toast (`@radix-ui/react-toast`) | Implemented |
| Email (status update) | Document request status change | Firebase email triggers / SMTP API route | Implemented |
| PWA Push Notification | Future: status change while app is closed | Workbox Push API (service worker ready) | Roadmap |
| SMS | Future: OTP or status alerts | Semaphore API (defined in subscription model) | Roadmap |

In-app toasts are the primary real-time feedback mechanism. They appear for all create, update, delete, and error events, providing immediate confirmation to the user without requiring a page refresh.

### External System Integration

| System | Package / Method | Auth | Data Direction | Purpose |
|---|---|---|---|---|
| Google Gemini AI | `@genkit-ai/google-genai@^1.20.0` | `GEMINI_API_KEY` env var | Outbound (prompt) / Inbound (response) | AI report generation |
| Firebase Auth | `firebase@^11.9.1` | Firebase project config | Bidirectional | User authentication |
| Cloud Firestore | `firebase@^11.9.1` | JWT token | Bidirectional | Primary database |
| Firebase Storage | `firebase@^11.9.1` | JWT token | Bidirectional | File storage |
| Firebase Admin | `firebase-admin@^13.6.0` | Service account private key | Outbound (Admin ops) | User management |
| Vercel Build API | GitHub webhook | GitHub token | Outbound (trigger) | CI/CD deployment |
| PSGC Data | `ph-geo-admin-divisions@^1.0.8` | None (local npm package) | Inbound (static data) | Address selection |

No direct integration with national government systems (PSA, DILG, PhilSys) exists in the current version. These are planned for future phases.

### Middleware/Integration Services

| Middleware | Package | Role |
|---|---|---|
| AI Orchestration | `genkit@^1.20.0` + `@genkit-ai/next@^1.20.0` | Structures Gemini prompts, handles streaming responses, abstracts AI provider |
| Firebase Admin SDK | `firebase-admin@^13.6.0` | Server-side token verification, user creation/deletion, custom claim management |
| PWA Builder | `@ducanh2912/next-pwa@^10.2.9` | Generates Workbox service worker and manifest at build time |
| Form Validation | `react-hook-form@^7.54.2` + `zod@^3.24.2` | Client-side schema-based validation middleware for all form submissions |
| Auth Resolver | `@hookform/resolvers@^4.1.3` | Bridges Zod schemas with React Hook Form validation engine |
| Theme Provider | `next-themes@^0.3.0` | Dark/light mode middleware injected at layout level |
| Date Utilities | `date-fns@^3.6.0` | Date formatting and manipulation throughout the application |

---

## XI. DATA ARCHITECTURE

### Data Sources

| Source Type | Description | Examples |
|---|---|---|
| User Input | Form data submitted by staff and residents | Resident registration, document request forms, payment details |
| File Uploads | Binary files sent to Firebase Storage | Barangay seal images (PNG/JPG), payment proof screenshots |
| System-Generated | Automatically created by application logic | Firestore document IDs, `serverTimestamp()` fields, status transitions |
| AI-Generated | Outputs from Google Gemini analytics | Report summaries, trend descriptions, statistical narratives |
| External Static | Pre-packaged geographic reference data | PSGC barangay/municipality/province data via `ph-geo-admin-divisions` |

### Database Architecture

Cloud Firestore is a **schema-less, NoSQL document database** with the following structural characteristics relevant to iBarangay:

- **Document-collection model**: Data is organized into top-level collections, each containing documents identified by auto-generated or user-defined IDs
- **No joins**: Relationships are maintained by embedding reference IDs (e.g., `barangayId`, `residentId`) as string fields within documents
- **Flat hierarchy**: All primary collections are top-level; no subcollections are used in the current schema, simplifying query patterns
- **Real-time capability**: Firestore's `onSnapshot()` listener streams document changes to subscribed clients within milliseconds
- **Atomic batch writes**: Multiple documents can be written in a single atomic operation using `writeBatch()`
- **Offline persistence**: Firestore SDK caches recently read documents locally for offline access (read-only)

**Firestore Collection Schema:**

```
/users/{userId}
  - uid: string
  - email: string
  - role: "SuperAdmin" | "Admin" | "Barangay Captain" | "Secretary" | "Treasurer" | "Resident"
  - barangayId: string
  - isSuperAdmin: boolean
  - displayName: string
  - createdAt: timestamp

/barangays/{barangayId}
  - id: string
  - name: string
  - municipality: string
  - province: string
  - region: string
  - logoUrl: string (Firebase Storage URL)
  - pricing: { [documentType]: number }
  - isActive: boolean
  - createdAt: timestamp

/residents/{residentId}
  - id: string
  - barangayId: string
  - userId: string (links to /users)
  - firstName: string
  - lastName: string
  - middleName: string
  - birthdate: timestamp
  - civilStatus: string
  - address: string
  - municipality: string
  - province: string
  - contactNumber: string
  - avatarUrl: string
  - createdAt: timestamp
  - updatedAt: timestamp

/documentRequests/{requestId}
  - id: string
  - barangayId: string
  - residentId: string
  - type: string (e.g., "Barangay Clearance")
  - status: "Pending" | "Processing" | "Approved" | "Rejected" | "Released"
  - purpose: string
  - fee: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - processedBy: string (staff userId)
  - releasedAt: timestamp

/payments/{paymentId}
  - id: string
  - barangayId: string
  - requestId: string
  - amount: number
  - method: string
  - proofUrl: string (Firebase Storage URL)
  - verified: boolean
  - verifiedBy: string (treasurer userId)
  - createdAt: timestamp

/officials/{officialId}
  - id: string
  - barangayId: string
  - name: string
  - position: string
  - term: string
  - createdAt: timestamp

/barangayConfig/{configId}
  - (Legacy collection maintained for backward compatibility)
```

### Data Model

The data model follows a **multi-tenant, flat-document pattern** with tenant isolation enforced through a `barangayId` field present on all operational documents:

- **Tenant anchor**: `/barangays/{barangayId}` — every operational document references this
- **Identity anchor**: `/users/{userId}` — every user's role and barangay assignment is stored here and read by Firestore security rules at request time
- **Resident-request relationship**: `documentRequests.residentId` references `residents.id`, enabling per-resident request history
- **Request-payment relationship**: `payments.requestId` references `documentRequests.id`, linking financial records to their originating request
- **User-resident link**: `residents.userId` links a resident profile to its corresponding Firebase Auth user account, enabling self-service access

### Master Data

| Master Entity | Location | Managed By | Purpose |
|---|---|---|---|
| Barangay configuration | `/barangays/{id}` | Super Admin, Admin | Tenant configuration, pricing, branding |
| User accounts | `/users/{uid}` + Firebase Auth | Super Admin, Admin | Identity, role, barangay assignment |
| Document type catalog | Application source code (`src/lib/`) | Development team | Defines available document types and their default fees |
| Pricing overrides | `barangays.pricing{}` map | Admin, Treasurer | Per-barangay fee customization |
| PSGC geographic data | `ph-geo-admin-divisions` npm package | N/A (static) | Standardized address lookup |

### Data Standards

| Standard | Implementation |
|---|---|
| Document IDs | Firebase auto-generated alphanumeric IDs (20 characters) |
| Timestamps | Firestore `serverTimestamp()` — stored as Firestore Timestamp, displayed via `date-fns` |
| Address format | PSGC hierarchy: Region > Province > Municipality > Barangay > Street/Sitio |
| Phone numbers | Philippine format: +63XXXXXXXXXX or 09XXXXXXXXX |
| Image formats | JPEG/PNG only, enforced by Storage rules (`request.resource.contentType.matches('image/.*')`) |
| File size limit | 5MB maximum per file, enforced by Storage rules |
| Currency | Philippine Peso (₱), stored as `number` in Firestore |
| Status values | Enumerated string constants: "Pending", "Processing", "Approved", "Rejected", "Released" |
| Boolean flags | Firestore native boolean type (not string "true"/"false") |

### Data Synchronization

- **Real-time sync**: Firestore `onSnapshot()` listeners in `app-context.tsx` subscribe to collection queries on login and update React state whenever any document in the subscribed collection changes
- **Multi-client sync**: When a Secretary updates a document request status, all other users with the same collection open (e.g., the resident checking their status, the Treasurer viewing pending payments) see the update reflected in their UI within milliseconds
- **Offline cache**: The Firestore SDK maintains a local IndexedDB cache of recently read documents. When connectivity drops, the cache serves reads; writes are queued and replayed when connectivity restores
- **PWA cache vs. Firestore cache**: The PWA service worker caches rendered page HTML and static assets. Firestore's SDK cache handles live data. These are complementary, not competing.
- **No manual polling**: The application contains no `setInterval()` or manual refresh patterns; all live data updates are driven by Firestore listeners

### Data Validation

**Three-layer validation architecture:**

| Layer | Tool | When | What |
|---|---|---|---|
| Client (UI) | React Hook Form + Zod | On input change and form submit | Field types, required fields, format patterns, length limits |
| Transport | TypeScript interfaces | At compile time | Shape of data objects passed between components and functions |
| Server (Database) | Firestore Security Rules | On every write operation | `barangayId` ownership, authentication status, role-based permission |

**Example Zod schema (resident creation):**
```typescript
const residentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthdate: z.date({ required_error: "Birthdate is required" }),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated"]),
  contactNumber: z.string().regex(/^(09|\+639)\d{9}$/, "Invalid Philippine phone number"),
  barangayId: z.string().min(1)
});
```

### Data Governance

| Governance Area | Policy | Implementation |
|---|---|---|
| Access control | RBAC with barangayId scoping | Firestore security rules (`firestore.rules`) |
| Data minimization | Only collect fields necessary for barangay operations | Schema design; no unnecessary personal fields |
| Purpose limitation | Resident data used only for barangay service delivery | No third-party data sharing; AI uses anonymized context |
| Right to access | Residents can view their own profile and requests | Role-based read permissions in Firestore rules |
| Right to deletion | Staff can permanently delete resident records | `deleteDoc()` available to Secretary/Admin roles |
| Data retention | Operational data retained for government audit purposes | No automatic expiry; archival policy defined per barangay |
| Breach response | Documented incident response procedure | See Section XIX and Appendix I |
| Regulatory compliance | Philippine Data Privacy Act (RA 10173) | Access controls, audit logs, data minimization, deletion rights |
| Third-party exposure | Prohibited for personal data | AI queries use aggregate/anonymized data only |

---

## XII. NETWORK AND INFRASTRUCTURE ARCHITECTURE

### Network Topology

iBarangay operates on a **cloud-hosted, internet-facing, serverless topology** with zero on-premises infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                        END USER DEVICES                          │
│   Desktop (Chrome/Edge/Firefox) │ Mobile (Android/iOS Browser)  │
│                  │ PWA Installed App                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS / TLS 1.3
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                  VERCEL EDGE CDN (Global)                        │
│   Static assets served from nearest edge node                   │
│   Next.js API routes → Vercel Serverless Functions              │
│   Automatic HTTPS, DDoS protection, rate limiting               │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Internal GCP network
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│               GOOGLE CLOUD PLATFORM (Asia-Southeast)            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Firebase   │  │  Cloud       │  │  Firebase Storage      │ │
│  │  Auth       │  │  Firestore   │  │  (GCS Bucket)          │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Firebase   │  │  Google Gemini AI (via Genkit)           │ │
│  │  Functions  │  │  (AI/ML APIs)                            │ │
│  └─────────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

No VPN, dedicated leased line, or on-premises server is required at any barangay site.

### Server Architecture

| Component | Architecture | Scaling | Management |
|---|---|---|---|
| Next.js App | Vercel serverless (edge + lambda) | Auto-scales with requests | Zero ops — managed by Vercel |
| API Routes | Vercel serverless functions | Auto-scales per function | Zero ops — managed by Vercel |
| Cloud Firestore | Distributed NoSQL (Google-managed) | Auto-scales with read/write load | Zero ops — managed by Firebase |
| Firebase Auth | Distributed identity service | Auto-scales with auth requests | Zero ops — managed by Firebase |
| Firebase Storage | Google Cloud Storage object store | Auto-scales with storage usage | Zero ops — managed by Firebase |
| Firebase Functions | Google Cloud Run functions | `maxInstances: 1` (pilot) | Configured in `apphosting.yaml` |

### Internet Connectivity

| Connection Type | Minimum | Recommended | Notes |
|---|---|---|---|
| Barangay staff workstation | 1 Mbps stable | 5 Mbps | For dashboard, document processing, file uploads |
| Resident self-service | 512 Kbps | 2 Mbps | For form submission, status checking |
| PWA offline mode | No internet | — | Read-only access to cached pages |
| Mobile (LTE/4G) | 3G sufficient | LTE | Responsive design optimized for mobile |

Vercel's CDN serves static assets from the nearest edge node to Philippine users, typically achieving sub-100ms asset delivery from Singapore or Hong Kong edge nodes.

### Firewall

| Layer | Type | Implementation | Protects Against |
|---|---|---|---|
| Network edge | CDN/WAF | Vercel platform firewall | DDoS, volumetric attacks, malicious bots |
| Application | Rules-as-firewall | Firestore Security Rules | Unauthorized data access, cross-tenant leakage |
| Application | Rules-as-firewall | Firebase Storage Rules | Unauthorized file access, oversized uploads, wrong MIME types |
| Transport | TLS enforcement | Vercel HTTPS redirect | Man-in-the-middle, packet sniffing |
| API | Token verification | Firebase Admin SDK in API routes | Unauthenticated API calls, token forgery |

There is no hardware firewall or network appliance required at barangay sites.

### Load Balancer

Load balancing is handled transparently by the cloud platforms:

- **Vercel**: Distributes incoming HTTP requests across serverless function instances automatically. Functions are instantiated on-demand; multiple instances run in parallel for concurrent requests.
- **Cloud Firestore**: Google's internal load balancing distributes read and write operations across Firestore nodes transparently.
- **Firebase Auth**: Google's identity infrastructure handles concurrent authentication requests at scale.
- No manual load balancer configuration (e.g., NGINX, HAProxy) is required.

### Storage

| Storage Type | Service | Capacity | Access Control | Use Case |
|---|---|---|---|---|
| Document database | Cloud Firestore | Scales to terabytes | Firestore security rules + JWT | All structured application data |
| Object storage | Firebase Storage (GCS) | Scales to petabytes | Storage security rules + JWT | Images: barangay seals, payment proofs |
| Static asset CDN | Vercel CDN | Per deployment | Public (no auth) | JS bundles, CSS, fonts, icons |
| Local browser cache | IndexedDB (Firestore SDK) | ~50MB per browser | Same-origin | Offline Firestore data reads |
| PWA cache | Service Worker (CacheStorage) | ~100MB per browser | Same-origin | Cached pages, static assets |

**Storage Rules Summary:**
- `/barangay-logos/*` — Public read; write restricted to `isSuperAdmin == true`, max 5MB, `image/*`
- `/payment-proofs/*` — Authenticated read/write; max 5MB, `image/*`
- All other paths — Denied by default (`allow read, write: if false`)

### Backup Infrastructure

| Asset | Backup Method | Frequency | Retention | Recovery |
|---|---|---|---|---|
| Firestore data | GCP managed point-in-time recovery | Continuous (GCP-managed) | 7 days rolling | Restore via Firebase Console or gcloud CLI |
| Firestore exports | Cloud Scheduler → GCS export | Configurable (daily recommended) | Per policy | Import via Firebase Admin SDK |
| Firebase Storage files | GCS multi-region redundancy | Real-time replication | Indefinite | Automatic GCS failover |
| Application code | GitHub repository | On every commit | Full history | Redeploy any commit via Vercel |
| Deployment artifacts | Vercel deployment history | On every deploy | Full history | One-click rollback in Vercel dashboard |

### Cloud/On-Premises Infrastructure

iBarangay is **fully cloud-native**. No on-premises infrastructure is required or used.

| Provider | Services Used | Region |
|---|---|---|
| Google Cloud Platform | Firebase Auth, Firestore, Storage, Functions, Gemini AI | asia-southeast1 (Singapore) |
| Vercel | Next.js hosting, serverless functions, CI/CD, CDN | Global edge (nearest to Philippines: Singapore/HK) |
| GitHub | Source code version control, CI/CD trigger | Global |

---

## XIII. SECURITY ARCHITECTURE

### Authentication

Firebase Authentication is the sole identity management system for iBarangay. It handles credential storage, token issuance, session management, and password operations.

**Authentication flow:**
```
User enters email + password
       ↓
signInWithEmailAndPassword() → Firebase Auth
       ↓
Firebase validates credentials (bcrypt hash comparison)
       ↓
Firebase issues signed JWT (ID Token) — valid 1 hour
       ↓
SDK stores token in browserLocalStorage
       ↓
All Firestore/Storage requests include Bearer token
       ↓
Token auto-refreshed silently before expiry
```

**Supported authentication methods (current):**
- Email/Password (primary)

**First-run Super Admin setup:**
- The `/initial-setup` route creates the first Super Admin account
- After creation, the route checks if a Super Admin already exists and blocks re-execution
- Super Admin receives the `isSuperAdmin: true` custom claim via Firebase Admin SDK

### Authorization

Authorization is enforced at two independent layers, both must pass for a data operation to succeed:

**Layer 1 — Database Rules (enforced server-side by Firebase):**
```javascript
// From firestore.rules
function isSuperAdmin() {
  let userData = getUserData(request.auth.uid);
  return isSignedIn() && userData != null && userData.isSuperAdmin == true;
}
function isSameBarangay(resourceBarangayId) {
  return isSuperAdmin() || getUserBarangayId(request.auth.uid) == resourceBarangayId;
}
```
These rules run on Firebase's servers and cannot be bypassed by any client-side code, regardless of what the JavaScript application does.

**Layer 2 — Application UI (enforced client-side by React):**
- Role is read from Firestore on login and stored in `app-context.tsx`
- Components conditionally render based on role: e.g., "Approve" button only renders for Secretary and Admin roles
- Routes under `(dashboard)` verify authentication status via middleware; unauthenticated users are redirected to `/login`

### Role-Based Access Control

**RBAC Matrix — Firestore Collections:**

| Role | `/users` | `/barangays` | `/residents` | `/documentRequests` | `/payments` | `/officials` |
|---|---|---|---|---|---|---|
| Super Admin | Full (all) | Full (all) | Full (all) | Full (all) | Full (all) | Full (all) |
| Admin | CRUD (own barangay) | Update (own) | Full CRUD (own) | Full CRUD (own) | Full CRUD (own) | Full CRUD (own) |
| Barangay Captain | Read (own) | Read (own) | Read (own) | Read (own) | Read (own) | Read (own) |
| Secretary | None | None | Full CRUD (own) | Approve/Reject/Release | Read (own) | None |
| Treasurer | None | Update pricing | Read (own) | Read (own) | Verify/Update (own) | None |
| Resident | Own profile only | Read (active) | Own profile | Own requests (create/read) | Own payments | None |

**RBAC Matrix — Firebase Storage:**

| Role | `/barangay-logos/*` | `/payment-proofs/*` |
|---|---|---|
| Super Admin | Read + Write | Read + Write |
| Admin/Staff | Read only | Read + Write |
| Resident | Read only | Write own + Read |
| Unauthenticated | Read logos | None |

### Encryption

| Data State | Method | Standard | Managed By |
|---|---|---|---|
| In transit (browser ↔ Vercel) | TLS | TLS 1.3 | Vercel (automatic) |
| In transit (Vercel ↔ Firebase) | TLS | TLS 1.3 | Google Cloud (automatic) |
| At rest (Firestore) | Encryption at rest | AES-256 | Google Cloud (automatic) |
| At rest (Firebase Storage) | Encryption at rest | AES-256 | Google Cloud (automatic) |
| Passwords | Hashing | bcrypt | Firebase Authentication |
| Admin private key | Environment variable | Not stored in code | Vercel env vars + `.env.local` |
| API keys (Gemini) | Environment variable | Server-side only | Vercel env vars + `.env.local` |

No custom encryption implementation is required; all encryption is managed by the cloud providers.

### API Security

| Threat | Mitigation |
|---|---|
| Unauthenticated API calls | All `/api/*` routes verify Firebase JWT via Admin SDK `verifyIdToken()` before execution |
| Exposed Gemini API key | Key stored server-side only in `GEMINI_API_KEY` env var; never sent to browser |
| Exposed Admin private key | `FIREBASE_PRIVATE_KEY` stored in env vars only; `.env.local` is in `.gitignore` |
| Cross-Origin requests | Vercel default same-origin CORS policy for API routes |
| Request replay attacks | Firebase JWT includes `iat` (issued-at) and `exp` (expiry) claims; expired tokens rejected |
| Parameter injection | Zod schema validation on all API route request bodies before processing |

### Network Security

| Control | Implementation |
|---|---|
| HTTPS enforcement | Vercel forces HTTPS on all routes; HTTP → 301 redirect to HTTPS |
| TLS version | TLS 1.3 minimum (Vercel default) |
| HSTS | Vercel sets `Strict-Transport-Security` header automatically |
| Content Security Policy | Configurable via `next.config.ts` headers (recommended for production hardening) |
| Database firewall | Firestore security rules reject all unauthorized operations server-side |
| Storage firewall | Firebase Storage rules enforce auth, size, and MIME type on all uploads |
| Credential exposure | All secrets in `.env.local` (excluded from git via `.gitignore`) and Vercel encrypted env vars |
| Dependency security | `npm audit` run before every production deployment; all deps pinned to exact versions |

### Audit Logs

**Application-level audit fields (stored in every Firestore document):**

| Field | Type | Description |
|---|---|---|
| `createdAt` | Firestore Timestamp | When the document was first created |
| `updatedAt` | Firestore Timestamp | When the document was last modified |
| `createdBy` | string (user UID) | Which user created the record |
| `updatedBy` | string (user UID) | Which staff member last modified the record |
| `processedBy` | string (user UID) | Secretary/Admin who processed a document request |
| `verifiedBy` | string (user UID) | Treasurer who verified a payment |
| `releasedAt` | Firestore Timestamp | When a document was released to the resident |

**Platform-level audit logs:**
- **Firebase Console** — Authentication sign-in events, database access patterns, storage upload/download history
- **Vercel Dashboard** — All API route invocations with timestamps, duration, status codes
- **Google Cloud Console** — Infrastructure-level access logs, quota consumption, billing events

### Data Privacy

iBarangay's data privacy design is aligned with the **Philippine Data Privacy Act (RA 10173)**:

| Principle | Implementation |
|---|---|
| Lawful basis | Barangay government has lawful authority to collect resident data for service delivery |
| Data minimization | Only fields necessary for barangay operations are collected; no unnecessary sensitive data |
| Purpose limitation | Resident data is used exclusively for barangay service delivery; no marketing or third-party use |
| Storage limitation | Data retained per government record-keeping requirements; Admins can delete records |
| Integrity and confidentiality | AES-256 at rest, TLS in transit, RBAC access controls |
| Accountability | Audit log fields in every document; designated Data Protection Officer per barangay |
| Data subject rights | Residents can view, correct, and request deletion of their own data via the self-service portal |
| Breach notification | Documented incident response procedure (see Section XIX) |

### Security Monitoring

| Monitor | Tool | Frequency | Alerts |
|---|---|---|---|
| Authentication events | Firebase Console → Authentication tab | Real-time | Failed login spikes, unusual locations |
| Database operations | Firebase Console → Firestore Usage | Real-time | Quota thresholds, rule denials |
| Storage activity | Firebase Console → Storage | Real-time | Abnormal upload volumes |
| API function health | Vercel Dashboard → Functions | Real-time | Error rate spikes, cold start latency |
| Infrastructure health | Google Cloud Console | Real-time | Service degradation, quota exhaustion |
| Billing anomalies | GCP Billing → Budget Alerts | On threshold | Unexpected cost spikes indicating abuse |
| Dependency vulnerabilities | `npm audit` | Pre-deployment | Critical/high severity CVEs |

---

## XIV. SYSTEM INTEGRATION WORKFLOW

### Data Input

All data entry occurs through structured React forms built with React Hook Form. Each form is tied to a specific Zod schema that defines the expected shape, types, and constraints of the data. Input fields use controlled components; the form state is managed entirely by React Hook Form's `useForm()` hook, preventing uncontrolled state drift.

Form types in iBarangay:
- Resident registration and profile edit form
- Document request submission form (with dynamic fee display based on barangay pricing)
- Payment proof upload form
- Barangay settings and pricing configuration form
- User (staff) account creation form
- Login and password reset forms

### Data Validation

Validation occurs in two stages before any data reaches Firebase:

**Stage 1 — Real-time field validation (onChange/onBlur):**
- React Hook Form triggers Zod validation on each field as the user types or leaves the field
- Inline error messages appear immediately below failing fields
- The Submit button remains enabled but submission is blocked if validation fails

**Stage 2 — Full schema validation (onSubmit):**
- On form submission, the complete Zod schema is evaluated against all field values
- If any field fails validation, the submission is cancelled and all error messages are shown
- Only a fully valid payload proceeds to the Firebase SDK or API route

### Authentication

Before any data operation reaches Firebase, the authentication state is verified:

1. `onAuthStateChanged()` listener in `app-context.tsx` maintains the current auth state across the application lifetime
2. Protected routes check this state; unauthenticated users are redirected to `/login` before the component renders
3. For Firestore operations: the Firebase SDK automatically attaches the current ID token to every request header
4. For API route operations: the client reads the current ID token via `getIdToken()` and sends it in the `Authorization: Bearer <token>` header
5. Expired tokens are silently refreshed by the Firebase SDK before the request is sent

### API Request

**Path A — Standard Firestore Operations (resident CRUD, document requests, payments):**
```
React Component
  → React Hook Form (validated data)
  → Firebase SDK (setDoc / updateDoc / addDoc)
  → Firestore Security Rules evaluation
  → Firestore database write
  → onSnapshot() broadcast to all listeners
```

**Path B — Privileged Admin SDK Operations (create user, delete user):**
```
React Component (Admin/Super Admin only)
  → React Hook Form (validated data)
  → fetch('/api/admin/create-user', { method: 'POST', headers: { Authorization: Bearer token } })
  → Next.js API Route
  → Firebase Admin SDK: verifyIdToken(token)
  → Firebase Admin SDK: createUser({ email, password, ... })
  → Firestore: setDoc('/users/{newUid}', { role, barangayId, ... })
  → Response: { uid, email }
```

**Path C — AI Report Generation:**
```
React Component (Analytics page)
  → User submits natural language report request
  → fetch('/api/ai/generate-report', { method: 'POST', body: { prompt, barangayId } })
  → Next.js API Route
  → Firebase Admin SDK: verifyIdToken(token)
  → Genkit: generate({ model: gemini15Flash, prompt: structuredPrompt })
  → Google Gemini API
  → Streaming response back to client
  → Rendered in report UI component
```

### Data Processing

- **Firestore Security Rules** evaluate every write against the user's authenticated identity and role before the write is committed. A rule denial returns a "permission-denied" error to the client.
- **Batch writes** are used when multiple documents must be updated atomically (e.g., updating document request status + logging the action timestamp + notifying the resident).
- **AI processing** happens server-side in the Next.js API route. The Genkit framework structures the prompt, sends it to Gemini, handles retries on rate limit errors, and returns the streamed response.
- **PDF generation** runs client-side using jsPDF and html2canvas. The certificate template is rendered as an HTML component, captured as a canvas image, and embedded in a PDF document for download.

### Database Transaction

Firestore guarantees **atomic document writes** — a document is either fully written or not written at all. For multi-document operations:

- **Batch writes** (`writeBatch()`) group up to 500 document operations into a single atomic commit
- **Transactions** (`runTransaction()`) are used when a write depends on reading the current value of a document first (e.g., checking available slots before approving a request)
- All write operations include `updatedAt: serverTimestamp()` to maintain an accurate audit trail

### Response

After a successful Firestore write:
1. Firestore confirms the write and returns the document reference
2. All active `onSnapshot()` listeners subscribed to the affected collection receive a `DocumentChange` event
3. React state updates via the context provider, triggering a re-render of affected components
4. The updated data appears in the UI in real time — no page refresh required
5. A Radix UI Toast notification confirms the action to the user who performed it

For API route operations, a JSON response `{ success: true, data: {...} }` is returned to the client, which then updates local state accordingly.

### Notification

**Trigger events and notification channels:**

| Event | In-App Toast | Email to Resident | Email to Staff |
|---|---|---|---|
| Document request submitted | ✅ (resident) | ✅ Confirmation | ✅ New request alert |
| Request approved | ✅ (secretary) | ✅ Status update | — |
| Request rejected | ✅ (secretary) | ✅ Rejection reason | — |
| Payment uploaded | ✅ (resident) | — | ✅ Payment pending review |
| Payment verified | ✅ (treasurer) | ✅ Payment confirmed | — |
| Document ready for release | ✅ (secretary) | ✅ Ready for pickup | — |
| Document released | ✅ (secretary) | ✅ Final confirmation | — |

---

## XV. HARDWARE AND SOFTWARE REQUIREMENTS

### A. Hardware Requirements

**Minimum per barangay staff workstation:**

| Component | Minimum | Recommended |
|---|---|---|
| Processor | Intel Core i3 (8th gen) / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 |
| RAM | 4 GB DDR4 | 8 GB DDR4 |
| Storage | 128 GB HDD | 256 GB SSD |
| Display | 1366×768 (HD) | 1920×1080 (Full HD) |
| Network adapter | 100 Mbps Ethernet / 802.11n Wi-Fi | Gigabit Ethernet / 802.11ac Wi-Fi |
| Browser | Chrome 90+, Edge 90+, Firefox 90+ | Latest stable Chrome or Edge |
| OS | Windows 10 Home | Windows 10/11 Pro |
| Printer | Inkjet (letter/A4) | Laser printer for certificate output |
| UPS | 500VA | 1000VA for extended outage protection |

**No server hardware is required.** The system is fully cloud-hosted.

**For resident self-service access (minimum):**
- Any smartphone (Android 8+ or iOS 13+) with Chrome or Safari
- Any laptop or desktop with a modern browser
- Minimum 512 Kbps internet connection

### B. Software Requirements

**Runtime environment:**

| Software | Version | Required | Purpose |
|---|---|---|---|
| Node.js | 18.x LTS or higher | Development only | Build tool runtime |
| npm | 9.x or higher | Development only | Package manager |
| Next.js | 16.1.6 | Server | Application framework |
| TypeScript | 5.x | Development | Type-safe compilation |

**Core dependencies (from `package.json`):**

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.1.6 | Full-stack React framework |
| `react` | ^18.3.1 | UI component library |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `firebase` | ^11.9.1 | Client-side Firebase SDK |
| `firebase-admin` | ^13.6.0 | Server-side Admin SDK |
| `genkit` | ^1.20.0 | AI orchestration framework |
| `@genkit-ai/google-genai` | ^1.20.0 | Google Gemini integration |
| `@genkit-ai/next` | ^1.20.0 | Genkit Next.js adapter |
| `@ducanh2912/next-pwa` | ^10.2.9 | Progressive Web App builder |
| `tailwindcss` | ^3.4.1 | Utility CSS framework |
| `react-hook-form` | ^7.54.2 | Form state management |
| `zod` | ^3.24.2 | Schema validation |
| `jspdf` | ^2.5.1 | PDF generation |
| `html2canvas` | ^1.4.1 | HTML-to-canvas for PDF |
| `recharts` | ^2.15.1 | Data visualization |
| `date-fns` | ^3.6.0 | Date formatting |
| `lucide-react` | ^0.475.0 | Icon library |
| `xlsx` | ^0.18.5 | Excel export |
| `ph-geo-admin-divisions` | ^1.0.8 | PSGC address data |
| `next-themes` | ^0.3.0 | Dark/light mode |

**UI component packages (shadcn/ui via Radix UI):**
All `@radix-ui/react-*` packages at their respective versions (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, select, separator, tabs, toast, tooltip, etc.)

**Development tools:**

| Tool | Purpose |
|---|---|
| Firebase CLI | Deploy Firestore rules and Storage rules |
| Vercel CLI | Production deployment management |
| ESLint | Code quality linting |
| TypeScript compiler (`tsc`) | Type checking |
| Git + GitHub | Version control and CI/CD |

### C. Network Requirements

| Requirement | Specification |
|---|---|
| Protocol | HTTPS (TLS 1.3); HTTP automatically redirected |
| Minimum bandwidth (staff) | 1 Mbps stable broadband or LTE |
| Minimum bandwidth (resident) | 512 Kbps |
| Recommended bandwidth | 5 Mbps for smooth multi-user operation |
| Ports required (outbound) | 443 (HTTPS) |
| DNS | Standard public DNS; no custom records required at barangay |
| Firewall allow-list (outbound) | `*.firebaseio.com`, `*.googleapis.com`, `*.vercel.app`, `*.google.com` |
| IPv4 / IPv6 | IPv4 required; IPv6 supported |
| VPN | Not required |
| Static IP | Not required |
| Proxy | Transparent proxies supported; authenticated proxies require browser configuration |

### D. Security Requirements

| Requirement | Implementation |
|---|---|
| HTTPS | Enforced by Vercel on all routes (no configuration needed) |
| Firebase Auth enabled | Email/Password provider must be enabled in Firebase Console |
| Firestore Security Rules | Must be deployed: `firebase deploy --only firestore:rules` |
| Storage Security Rules | Must be deployed: `firebase deploy --only storage` |
| Environment variables | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_FIREBASE_*` — configured in Vercel dashboard and `.env.local` |
| Firebase App Check | Must be enabled in production to prevent unauthorized API access |
| Dependency audit | `npm audit` must return zero critical/high vulnerabilities before deployment |
| `.gitignore` compliance | `.env.local`, `src/firebase/config.ts`, service account JSON files must never be committed |
| Admin SDK credentials | Firebase service account private key must be stored only in environment variables; rotated every 6 months |
| Key rotation | Firebase Admin SDK service account keys rotated every 6 months; Gemini API key rotated annually |

---

## XVI. IMPLEMENTATION PLAN

### Requirements Analysis (Weeks 1–2)
- Conduct stakeholder workshops with DICT MIMAROPA officers and representative barangay captains and secretaries from the 5 pilot barangays
- Document functional requirements per user role using user story format
- Define non-functional requirements: performance targets, availability SLA, security baseline
- Confirm data model — field names, data types, relationships, and validation rules
- Produce a signed Requirements Specification Document for stakeholder approval

### System Assessment (Weeks 2–3)
- Conduct on-site visits to all 5 pilot barangays to audit existing hardware, internet connectivity, and staff digital literacy
- Document hardware gaps (workstations, printers, UPS) and produce procurement recommendations
- Assess existing records for data migration scope (volume of paper records to be digitized at launch)
- Confirm Firebase project setup: create production Firebase project, enable Auth, Firestore, Storage, and Functions
- Establish Vercel project linked to GitHub repository

### Architecture Design (Weeks 3–4)
- Finalize Firestore collection schema with all field names, types, and indexes
- Draft and review Firestore security rules and Storage rules
- Produce system architecture diagram, network topology diagram, data flow diagram, and ERD
- Define API route contracts (input/output schemas) for all server-side endpoints
- Produce and review the RBAC matrix with stakeholders
- Obtain architecture sign-off from Technical Lead and Project Manager

### Development (Weeks 4–24 — 10 × 2-week sprints)

| Sprint | Deliverables |
|---|---|
| Sprint 1 | Firebase config, Auth flow (login/logout/register), initial setup page, user context |
| Sprint 2 | Barangay management (CRUD), settings page, barangay seal upload |
| Sprint 3 | Resident management (CRUD, avatar upload, PSGC address, search/filter) |
| Sprint 4 | Document request submission form, request list views per role |
| Sprint 5 | Document request workflow (approve/reject/release), status tracking |
| Sprint 6 | Payment tracking, proof upload, treasurer verification |
| Sprint 7 | Analytics dashboard, charts (Recharts), PDF certificate generation |
| Sprint 8 | AI analytics and natural language report generation (Gemini/Genkit) |
| Sprint 9 | PWA implementation (manifest, service worker, offline page, install prompt) |
| Sprint 10 | Super Admin dashboard, multi-barangay management, UI polish, dark mode |

### Integration (Weeks 24–26)
- Connect all modules through the shared `app-context.tsx` global state
- Wire all Firestore `onSnapshot` listeners to their respective UI components
- End-to-end workflow testing: full document request lifecycle across all roles
- Validate all Firestore security rules against the RBAC matrix using Firebase Emulator
- Configure Vercel CI/CD pipeline; set all production environment variables
- Connect email notification service to document status change triggers

### Testing (Weeks 26–28)
- Execute unit test suite for components, utilities, and Zod schemas
- Execute integration tests against Firebase Emulator for all CRUD operations
- Conduct end-to-end system testing for all six user role workflows
- Performance testing: load test with 50–200 simulated concurrent users
- Security testing: attempt rule bypass, cross-tenant access, injection attacks
- User Acceptance Testing with pilot barangay staff: task-based scenarios, feedback collection

### Deployment (Weeks 28–29)
- Deploy Firestore and Storage rules to production Firebase project
- Configure production environment variables in Vercel
- Push main branch to GitHub; Vercel auto-deploys to production
- Configure custom domain (if applicable) with SSL
- Enable Firebase App Check on production project
- Run full post-deployment checklist (see Section XIX — System Restoration)
- Conduct smoke testing on live production system with all user roles

### Training (Weeks 29–31)
- Deliver Super Admin training to DICT MIMAROPA IT officers (system setup, barangay management, analytics)
- Deliver Admin training to pilot barangay administrators (user management, settings, reporting)
- Deliver role-specific training for Secretaries (resident CRUD, document workflow)
- Deliver role-specific training for Treasurers (payment verification, financial reports)
- Conduct resident orientation sessions at pilot barangays (self-registration, document requests)
- Distribute role-specific user manuals (printed and digital)

### Maintenance (Ongoing from Week 31)
- Monthly: dependency security patches, bug fix releases, Firebase usage review
- Quarterly: feature releases from user feedback backlog, security rule audits
- Semi-annually: Admin SDK service account key rotation, performance benchmarking
- Annually: Penetration testing, Data Privacy Act compliance review, capacity planning
- On-demand: Critical security patches applied within 48 hours of discovery; production incidents responded to within 2 hours

---

## XVII. TESTING AND QUALITY ASSURANCE

### Unit Testing

Individual units of functionality are tested in isolation:

| Unit | Test Focus | Tool |
|---|---|---|
| Zod validation schemas | Accept valid inputs, reject invalid inputs, correct error messages | Jest / Vitest |
| Utility functions | Date formatting, currency formatting, string helpers | Jest / Vitest |
| Custom React hooks | Correct state transitions, Firestore query output | React Testing Library |
| RBAC helper functions | `isAdmin()`, `isStaff()`, `isSameBarangay()` return correct booleans | Jest / Vitest |
| PDF generation | Valid PDF structure produced from template data | jsPDF unit checks |

Acceptance criteria: ≥90% code coverage on utility functions and validation schemas; zero failing tests before any production deployment.

### Integration Testing

Tests covering interactions between multiple system components:

| Integration | Test Focus |
|---|---|
| Firebase Auth ↔ App | Sign-in, sign-out, token refresh, role retrieval |
| Firestore ↔ App | CRUD operations, `onSnapshot` listener updates, batch writes |
| Firebase Storage ↔ App | Image upload, URL retrieval, size/type rule enforcement |
| Next.js API Routes ↔ Admin SDK | User creation, deletion, token verification |
| Genkit ↔ Gemini API | Prompt submission, response parsing, error handling |
| Firestore Security Rules | Role-based access, cross-barangay access denial, field validation |

Integration tests run against the **Firebase Emulator Suite** (local emulators for Auth, Firestore, and Storage), eliminating the need for a live Firebase project during CI.

### System Testing

End-to-end workflow tests covering complete user journeys across all roles:

| Workflow | Steps Covered |
|---|---|
| Resident self-service | Register → Login → Submit document request → Upload payment → Track status |
| Secretary workflow | Login → Add resident → Process request (approve) → Release document |
| Treasurer workflow | Login → Review pending payments → Verify payment → Generate financial report |
| Admin workflow | Login → Create staff accounts → Configure barangay settings → Set document pricing |
| Captain workflow | Login → View analytics dashboard → Generate AI report → Export PDF |
| Super Admin workflow | Login → Create barangay → Assign Admin → View cross-barangay analytics |

All system tests are executed in a staging environment (separate Firebase project) identical to production before any release.

### Performance Testing

| Test Type | Tool | Target Metric |
|---|---|---|
| Load test (concurrent users) | k6 / Artillery | 200 concurrent users; p95 response time < 2s |
| Firestore query performance | Firebase Console + custom timing | Resident list query (1,000 records) < 500ms |
| PDF generation time | Browser performance API | Certificate generation < 3s |
| PWA first load | Lighthouse | Performance score ≥ 90 |
| PWA repeat load (cached) | Lighthouse | Load time < 1s for cached pages |
| Firebase cold start | Vercel function logs | API route cold start < 500ms |

Performance baselines are established during staging and monitored in production via Vercel's built-in analytics.

### Security Testing

| Test | Method | Frequency |
|---|---|---|
| Firestore rules unit tests | Firebase Emulator (`rules-unit-testing` package) | Every sprint |
| Cross-tenant access attempt | Manual: login as Barangay A staff, attempt to read Barangay B data | Pre-release |
| Unauthenticated API call | Manual: call `/api/admin/create-user` without auth token | Pre-release |
| Injection in form fields | Manual: XSS payloads, SQL injection strings in text inputs | Pre-release |
| Environment variable exposure | Inspect browser network tab and JS bundles for leaked keys | Pre-release |
| Dependency vulnerabilities | `npm audit` | Pre-deployment (automated in CI) |
| Annual penetration test | Third-party security firm | Annually |

### User Acceptance Testing (UAT)

UAT is conducted with actual end users from the 5 pilot barangays before the production go-live:

**Participants:** 2–3 staff members per role (Secretary, Treasurer, Admin, Captain) from each pilot barangay; 5–10 residents per barangay

**Method:** Task-based usability testing — each participant is given a set of realistic tasks to complete without assistance

**Tasks per role (examples):**
- Secretary: "Add a new resident named Juan Dela Cruz from Barangay Masikap"
- Secretary: "Process the pending Barangay Clearance request for Maria Santos"
- Treasurer: "Verify the payment uploaded by Jose Reyes for his Certificate of Indigency"
- Admin: "Change the fee for Barangay Clearance to ₱50"
- Resident: "Request a Certificate of Residency and upload your payment proof"

**Acceptance criteria:**
- Task completion rate ≥ 95% for all critical workflows
- Zero critical bugs (system-breaking, data loss, or security issues) found during UAT
- No more than 5 major bugs (incorrect behavior, confusing UX) in total
- Net Promoter Score (NPS) from staff participants ≥ 7/10
- All critical and major bugs resolved before production go-live sign-off

---

## XVIII. PROJECT MANAGEMENT AND GOVERNANCE

### Project Organization

```
┌─────────────────────────────┐
│      PROJECT SPONSOR         │
│  DICT MIMAROPA Director      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│      PROJECT MANAGER         │
│  DICT MIMAROPA IT Officer    │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│      TECHNICAL LEAD / CTO    │
│  Ryan Lanuevo Claud          │
└────┬─────────┬──────────────┘
     │         │
┌────▼────┐  ┌─▼────────────────────┐
│ Dev Team│  │ QA Engineer           │
│ (4 devs)│  │ + Customer Success    │
└─────────┘  └──────────────────────┘
               │
┌──────────────▼──────────────┐
│   STAKEHOLDER REPS           │
│  Pilot barangay captains     │
│  and secretaries             │
└─────────────────────────────┘
```

### Roles and Responsibilities

| Role | Person/Group | Key Responsibilities |
|---|---|---|
| Project Sponsor | DICT MIMAROPA Director | Strategic approval, budget authorization, escalation resolution |
| Project Manager | DICT IT Officer | Timeline management, stakeholder coordination, status reporting, risk tracking |
| Technical Lead | Ryan Lanuevo Claud | Architecture decisions, code review, security design, deployment, technical documentation |
| Senior Developers | Development team | Feature development, unit testing, code review participation |
| QA Engineer | QA team | Test plan creation, test execution, bug reporting and verification |
| Customer Success | Support team | UAT coordination, training delivery, post-launch support |
| Stakeholder Reps | Pilot barangay officials | Requirements validation, UAT participation, change request initiation |

### Technical Governance

| Governance Item | Policy |
|---|---|
| Architecture changes | Require Technical Lead written approval; documented in Architecture Decision Records (ADRs) |
| Security rule changes | Require Technical Lead review + Project Manager sign-off before deployment |
| Database schema changes | Version-controlled in GitHub; reviewed in pull request before merge |
| API contract changes | Follow semantic versioning; backward compatibility required for minor versions |
| Dependency updates | Staged in `package.json` with exact versions; tested in staging before production |
| Production deployments | Require successful staging test + QA sign-off; deployed via GitHub push to trigger Vercel CI |
| Emergency hotfixes | Technical Lead approval only; documented retroactively as a change record |

### Change Management

**Change classification:**

| Class | Definition | Approval Required |
|---|---|---|
| Minor | UI text, style changes, documentation updates | Technical Lead only |
| Standard | New feature, bug fix, dependency update, Firestore rule change | Technical Lead + Project Manager |
| Major | Architecture change, new integration, RBAC restructuring, data migration | Technical Lead + Project Manager + Sponsor |
| Emergency | Critical security vulnerability, production outage fix | Technical Lead (immediate); retroactive documentation |

**Change process:**
1. Submitter creates a GitHub Issue with the Change Request template
2. Technical Lead assesses classification and impact
3. Appropriate approvals obtained per classification table
4. Development executed in a feature branch
5. Pull request opened; code review by at least one other developer
6. Staging deployment and QA sign-off
7. Production deployment via GitHub merge to main
8. Change record closed with deployment timestamp and outcome notes

### Documentation Management

| Document Type | Location | Owner | Update Frequency |
|---|---|---|---|
| Technical architecture docs | `docs/` directory in GitHub repo | Technical Lead | On architecture changes |
| Firestore security rules | `firestore.rules` in GitHub repo | Technical Lead | On rule changes |
| Storage rules | `storage.rules` in GitHub repo | Technical Lead | On rule changes |
| API specifications | Inline TypeScript JSDoc + `docs/` | Development team | On API changes |
| User manuals (per role) | Distributed PDF + `docs/` | Customer Success | Per major release |
| Change records | GitHub Issues + Pull Requests | Project Manager | Per change |
| Meeting minutes | Project management tool | Project Manager | After each meeting |
| Incident reports | `docs/` + project management tool | Technical Lead | After each incident |

---

## XIX. BACKUP, DISASTER RECOVERY, AND BUSINESS CONTINUITY

### Backup Strategy

**Tier 1 — Platform-managed automatic backups (zero-configuration):**
- **Cloud Firestore**: Google Cloud provides continuous, managed point-in-time recovery. Data is automatically replicated across multiple Google data centers in the configured region.
- **Firebase Storage (GCS)**: Files stored in a multi-region GCS bucket with automatic multi-zone replication.

**Tier 2 — Scheduled Firestore export (recommended for production):**
- Configure Cloud Scheduler to trigger a Firestore export to a GCS bucket daily at 2:00 AM
- Retain exports for 30 days rolling; monthly snapshots retained for 1 year
- Command: `gcloud firestore export gs://ibarangay-backups/$(date +%Y-%m-%d)`

**Tier 3 — Source code and deployment:**
- All application code version-controlled in GitHub with full commit history
- Every Vercel deployment is retained; any prior version can be redeployed in under 2 minutes

### Recovery Point Objective (RPO)

| Data Type | RPO | Method |
|---|---|---|
| Firestore structured data | ~1 hour (GCP managed) | Point-in-time recovery via Firebase Console |
| Firestore structured data | ~24 hours (scheduled export) | Restore from daily GCS export |
| Firebase Storage files | ~0 seconds | Multi-region GCS replication (automatic failover) |
| Application code | ~0 seconds | Full history in GitHub |
| Deployed application | Last deployment (minutes) | Vercel deployment history |

### Recovery Time Objective (RTO)

| Failure Scenario | RTO | Recovery Action |
|---|---|---|
| Bad code deployment | 2–5 minutes | Vercel one-click rollback to prior deployment |
| Firebase Auth outage (Google-side) | Dependent on Google SLA | Wait for GCP resolution; monitor Firebase Status page |
| Firestore data corruption | 1–4 hours | Restore from Firestore export; re-deploy application |
| Complete Firebase project deletion | 4–8 hours | Restore from GCS export to new project; reconfigure; re-deploy |
| Vercel service outage | Dependent on Vercel SLA | Fallback deploy to Firebase Hosting (`npm run build && firebase deploy`) |

### Disaster Recovery

**Disaster Recovery Runbook:**

**Step 1 — Detection (0–15 min)**
- Monitor Firebase Status page (https://status.firebase.google.com)
- Check Vercel Status page (https://vercel-status.com)
- Review Vercel function error logs and Firebase Console anomalies
- Confirm scope: application layer (Vercel) vs. data layer (Firebase) vs. network

**Step 2 — Containment (15–30 min)**
- If bad deployment: execute Vercel rollback immediately
- If database issue: set Firestore rules to deny all writes to prevent further corruption
- Notify Project Manager and project stakeholders of the incident

**Step 3 — Recovery (30 min – 8 hr depending on scope)**
- Application recovery: Vercel rollback or redeploy from GitHub
- Data recovery: restore from Firestore export via Firebase Admin SDK import
- Storage recovery: GCS multi-region failover is automatic
- Verify restored data integrity by cross-checking record counts and sample documents

**Step 4 — Validation**
- Run full post-deployment checklist (all user roles, all workflows)
- Confirm Firestore security rules are active and correct
- Confirm all active `onSnapshot` listeners reconnect successfully

**Step 5 — Post-Incident Review**
- Produce incident report within 48 hours: timeline, root cause, impact, resolution, prevention measures
- Update runbook with lessons learned

### Business Continuity

**During an internet outage at the barangay site:**
- PWA offline mode allows staff to view all previously cached pages and data (read-only)
- Previously loaded resident lists, document request status, and settings remain accessible
- No new data can be written; queued writes will sync automatically when connectivity restores

**During an extended system outage (>4 hours):**
- Barangays revert to temporary paper-based processes as an emergency fallback
- Staff document transactions manually during the outage period
- Upon system restoration, the outage period's paper records are entered into the system retroactively

**Communication during outages:**
- Project Manager notifies all barangay Admins via email/phone within 30 minutes of confirmed outage
- Status updates sent every 2 hours during the outage
- All-clear notification sent upon full system restoration

### System Restoration

Post-recovery validation checklist:

- [ ] Firebase Authentication: Test login for each user role (Super Admin, Admin, Secretary, Treasurer, Resident)
- [ ] Firestore reads: Verify resident list and document request list load correctly per barangay
- [ ] Firestore writes: Create a test resident record; confirm it persists
- [ ] Firebase Storage: Upload a test image; confirm URL is accessible
- [ ] API routes: Call `/api/admin/create-user` with a test payload; verify response
- [ ] AI analytics: Submit a test report prompt; verify Gemini response returns
- [ ] PDF generation: Generate a test certificate; verify download works
- [ ] PWA: Verify service worker is active; confirm offline page loads when disconnected
- [ ] Email notifications: Trigger a test document status change; verify email is sent
- [ ] Security rules: Attempt a cross-tenant read (should be denied); confirm rule enforcement active

---

## XX. RISK MANAGEMENT

### Technical Risks

| Risk | Likelihood | Impact | Description |
|---|---|---|---|
| Firebase service degradation/outage | Low | High | Firebase/GCP experiences unplanned downtime affecting all system functions |
| Vercel deployment failure | Low | High | Bad deployment breaks production; code rollback required |
| npm dependency vulnerability | Medium | Medium | A package in `node_modules` has a published CVE |
| Google Gemini API rate limiting | Medium | Low | AI report generation fails during high-demand periods |
| Firestore quota exhaustion | Low | High | Read/write/storage quotas exceeded, blocking all data operations |
| Next.js App Router breaking change | Low | Medium | Major Next.js upgrade introduces incompatibility |
| Browser PWA support gaps | Medium | Low | Safari/iOS has limited PWA support; install flow differs |

### Security Risks

| Risk | Likelihood | Impact | Description |
|---|---|---|---|
| Compromised Firebase Admin credentials | Low | Critical | `FIREBASE_PRIVATE_KEY` or service account JSON leaked |
| Firestore rule misconfiguration | Low | Critical | A rule change inadvertently exposes cross-barangay data |
| Unauthorized API access without App Check | Medium | High | Non-app clients call Firebase directly without App Check token |
| Brute-force authentication attack | Medium | Medium | Automated attempts to guess staff or resident passwords |
| XSS via user input | Low | High | Malicious script injected through form fields and executed by other users |
| Leaked API key in repository | Low | Critical | `GEMINI_API_KEY` or Firebase config accidentally committed to GitHub |
| Session hijacking | Low | High | JWT token stolen and used to impersonate a user |

### Operational Risks

| Risk | Likelihood | Impact | Description |
|---|---|---|---|
| Low digital literacy of barangay staff | High | Medium | Staff struggle with the system, reducing adoption and accuracy |
| Poor internet connectivity at barangay sites | High | Medium | Unstable connections cause sync failures and frustration |
| Staff turnover at barangay level | High | Medium | Trained staff leave; replacements have no system knowledge |
| Resistance to change from barangay officials | Medium | Medium | Officials prefer existing manual processes; low system usage |
| Insufficient hardware at barangay sites | Medium | Medium | Old computers cannot run Chrome smoothly; slow page loads |
| Data entry errors during initial migration | High | Medium | Paper records transcribed incorrectly into the digital system |

### Integration Risks

| Risk | Likelihood | Impact | Description |
|---|---|---|---|
| Firebase SDK major version breaking change | Low | Medium | Firebase SDK v11 → v12 introduces API incompatibilities |
| Genkit/Gemini API deprecation | Medium | Low | Google changes the Gemini API or Genkit framework interface |
| Vercel + Next.js App Router incompatibility | Low | Medium | New Next.js version breaks serverless function behavior on Vercel |
| PSGC data package outdated | Low | Low | `ph-geo-admin-divisions` data becomes stale as PSGC updates |
| Third-party service (email/SMS) downtime | Medium | Low | Email or future SMS provider experiences service interruption |

### Data Risks

| Risk | Likelihood | Impact | Description |
|---|---|---|---|
| Accidental bulk record deletion | Low | High | Admin or Secretary accidentally deletes multiple resident records |
| Duplicate resident records | Medium | Medium | Same resident registered twice by different staff members |
| Firestore data corruption | Very Low | Critical | Document data becomes malformed due to partial write failure |
| Loss of payment proof images | Low | High | Firebase Storage files deleted or bucket misconfigured |
| Unauthorized bulk data export | Low | High | Staff extracts resident data for unauthorized use |

### Risk Mitigation Strategies

| Risk | Mitigation Strategy |
|---|---|
| Firebase outage | Monitor Firebase Status page; PWA offline mode for continuity; documented DR runbook |
| Compromised Admin credentials | Store only in Vercel env vars and `.env.local`; rotate every 6 months; enable GCP audit logs |
| Firestore rule misconfiguration | Emulator-based unit tests for every rule change; staging environment validation before production deploy |
| Low digital literacy | Role-specific UI design (simplified workflows); comprehensive training; in-app help text |
| Poor connectivity | PWA offline caching; progressive enhancement; low-bandwidth optimization of assets |
| Staff turnover | Documented user manuals per role; DICT MIMAROPA maintains Super Admin access for recovery |
| Duplicate records | Search-before-create UX prompt; duplicate detection scripts in `src/scripts/` |
| Accidental deletion | Confirmation dialogs for destructive actions; soft-delete (mark inactive) before permanent delete |
| Dependency vulnerability | `npm audit` in CI pipeline; exact version pinning; Dependabot alerts on GitHub repository |
| Data export abuse | RBAC restricts export to Admin/Captain roles; all export actions logged with user UID and timestamp |
| Quota exhaustion | GCP billing alerts configured; monthly usage review; Firebase Spark → Blaze plan migration at thresholds |

---

## XXI. BUDGETARY REQUIREMENTS

### Hardware

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| Staff workstations (new) | 10 (2 per pilot barangay) | ₱25,000 | ₱250,000 | Only for barangays without existing PCs |
| Laser printers | 5 | ₱8,000 | ₱40,000 | Certificate printing |
| UPS units | 5 | ₱3,500 | ₱17,500 | Power outage protection |
| Network router/switch | 5 | ₱3,000 | ₱15,000 | Stable local network |
| **Hardware Subtotal** | | | **₱322,500** | |

### Software

| Item | Annual Cost | Notes |
|---|---|---|
| Firebase Blaze Plan (pay-as-you-go) | ₱120,000 | ~$2,000 USD/year for production usage |
| Vercel Pro Plan | ₱60,000 | ~$1,000 USD/year |
| Google Gemini API usage | ₱60,000 | Based on estimated monthly report generation volume |
| Development tools and IDE licenses | ₱30,000 | |
| GitHub Teams plan | ₱18,000 | |
| Email service (SMTP/SendGrid) | ₱12,000 | Transaction email for notifications |
| **Software Subtotal (Annual)** | **₱300,000** | |

### Development

| Activity | Duration | Cost |
|---|---|---|
| Sprint 1–2: Auth, barangay management | 4 weeks | ₱360,000 |
| Sprint 3–4: Residents, document requests | 4 weeks | ₱360,000 |
| Sprint 5–6: Workflow, payments | 4 weeks | ₱360,000 |
| Sprint 7–8: Analytics, AI, PDF | 4 weeks | ₱360,000 |
| Sprint 9–10: PWA, Super Admin, polish | 4 weeks | ₱360,000 |
| Architecture and design (pre-sprint) | 2 weeks | ₱180,000 |
| DevOps and CI/CD setup | 2 weeks | ₱180,000 |
| **Development Subtotal** | **22 weeks** | **₱2,160,000** |

### Integration

| Activity | Cost |
|---|---|
| Firebase Auth + Firestore + Storage integration | ₱120,000 |
| Firebase Admin SDK (server-side) integration | ₱80,000 |
| Google Gemini AI via Genkit integration | ₱100,000 |
| PWA (next-pwa / Workbox) integration | ₱60,000 |
| PDF generation engine integration | ₱60,000 |
| Email notification service integration | ₱40,000 |
| **Integration Subtotal** | **₱460,000** |

### Security

| Activity | Cost |
|---|---|
| Firestore and Storage security rules design and testing | ₱80,000 |
| Firebase App Check setup and configuration | ₱30,000 |
| Initial penetration testing (third-party) | ₱150,000 |
| Security audit of API routes and environment variable handling | ₱60,000 |
| Data Privacy Act compliance review (legal consultation) | ₱80,000 |
| **Security Subtotal** | **₱400,000** |

### Training

| Activity | Cost |
|---|---|
| Training material development (manuals, video guides) | ₱80,000 |
| Super Admin training — DICT MIMAROPA staff (2 days) | ₱30,000 |
| Admin training — 5 pilot barangay administrators (2 days each) | ₱75,000 |
| Staff training — Secretaries and Treasurers (2 days each, 5 barangays) | ₱100,000 |
| Resident orientation sessions (5 barangays) | ₱50,000 |
| **Training Subtotal** | **₱335,000** |

### Maintenance (Annual)

| Activity | Annual Cost |
|---|---|
| Technical support staff (1 FTE developer + 1 FTE support) | ₱1,200,000 |
| Cloud infrastructure (Firebase + Vercel) | ₱300,000 |
| Annual security audit and penetration test | ₱150,000 |
| Feature updates and bug fixes (quarterly releases) | ₱480,000 |
| Training for new staff / refresher training | ₱60,000 |
| **Maintenance Subtotal (Annual)** | **₱2,190,000** |

### Contingency

15% contingency on total non-recurring project costs:
- Non-recurring total: ₱322,500 + ₱300,000 + ₱2,160,000 + ₱460,000 + ₱400,000 + ₱335,000 = ₱3,977,500
- **Contingency: ₱596,625**

### Total Budget Summary

| Category | Amount |
|---|---|
| Hardware | ₱322,500 |
| Software (Year 1) | ₱300,000 |
| Development | ₱2,160,000 |
| Integration | ₱460,000 |
| Security | ₱400,000 |
| Training | ₱335,000 |
| Maintenance (Year 1) | ₱2,190,000 |
| Contingency (15%) | ₱596,625 |
| **Grand Total (Year 1)** | **₱6,764,125** |

---

## XXII. EXPECTED BENEFITS AND OUTCOMES

### Operational Efficiency

| Metric | Before (Manual) | After (iBarangay) | Improvement |
|---|---|---|---|
| Document processing time | 1–3 business days | 2–4 hours | ~80% reduction |
| Time spent searching for records | 20–60 min per search | Under 5 seconds | ~99% reduction |
| Report generation time | 1–2 days manual compilation | Real-time dashboard | Instant |
| Staff hours on administrative tasks | ~40 hrs/week (Secretary) | ~15 hrs/week | ~62% reduction |
| Document error rate | ~15% (manual typos) | <1% (form validation) | ~93% reduction |
| Multi-barangay oversight time | Days to aggregate data | Real-time Super Admin dashboard | Instant |

The Secretary, historically the most burdened role in barangay operations, benefits most directly. Automated form filling from resident data, real-time request tracking, and digital workflow routing eliminate the majority of repetitive manual tasks.

### Data Accuracy

- **Standardized inputs**: Dropdown selectors for civil status, document type, municipality, and barangay eliminate free-text entry errors
- **PSGC compliance**: Address fields use validated PSGC data, ensuring geographic consistency with national data standards
- **Required field enforcement**: Zod validation prevents incomplete records from being saved
- **Type safety**: TypeScript interfaces across the entire codebase catch data shape errors at compile time, before they reach production
- **Audit trail**: Every record modification is timestamped with the acting user's UID, enabling post-hoc data quality review

### Improved Service Delivery

- Residents can submit document requests 24/7 from any device without visiting the barangay hall
- Real-time status notifications at every workflow stage keep residents informed without requiring follow-up calls or visits
- PDF certificates are generated automatically from standardized templates with the barangay's official seal and current officer signatures
- Payment proof upload allows residents to submit proof remotely, eliminating the need to physically present receipts
- The PWA enables one-tap access from a phone's home screen, reducing the friction of accessing services for residents with limited digital experience

### Improved Security

- **Before**: Any staff member could access all physical records with no accountability
- **After**: Six-tier RBAC enforces strict data access per role; every data access and modification is logged with user identity and timestamp
- **Before**: No protection against unauthorized document modifications
- **After**: Firestore security rules make it technically impossible for a user to access data outside their role and barangay assignment
- **Before**: Passwords shared among staff on sticky notes
- **After**: Individual Firebase Authentication accounts with unique passwords, session management, and secure password reset

### Cost Reduction

| Cost Item | Manual System | iBarangay | Savings |
|---|---|---|---|
| Paper and printing supplies | ₱50,000–₱80,000/year per barangay | ~₱5,000/year (certificate printing only) | ~85% reduction |
| Record storage (cabinets, folders) | ₱10,000–₱20,000/year | ₱0 | 100% elimination |
| Administrative overtime | Frequent | Minimal | Significant reduction |
| Error correction labor | High (re-processing rejected documents) | Low (validation prevents most errors) | Estimated 70% reduction |
| SaaS subscription cost | N/A | ₱25,000–₱75,000/year | — |
| **Net estimated savings per barangay** | | | **₱30,000–₱70,000/year** |

The SaaS subscription cost is typically offset within the first year by paper, printing, and labor savings alone.

### Scalability

The iBarangay architecture scales at three dimensions:

1. **Data scale**: Firestore handles terabytes of data with consistent performance; no migration needed as resident and document records grow
2. **User scale**: Vercel serverless functions auto-scale to handle traffic spikes (e.g., during a barangay fiesta when document requests spike); no manual server provisioning
3. **Geographic scale**: Adding a new barangay requires only creating a new document in the `/barangays` collection and assigning an Admin — no code changes, no new servers, no infrastructure provisioning

### Interoperability

iBarangay is designed with future interoperability in mind:

- **PSGC-compliant addresses**: All address data conforms to PSA's PSGC, ensuring compatibility with national databases
- **RESTful API layer**: Next.js API routes provide standard HTTP endpoints for future integration with DILG, PSA, or PhilSys systems
- **JSON data format**: Firestore exports to standard JSON, importable by any government system or analytics platform
- **Open protocols**: HTTPS, JWT, and standard web APIs ensure compatibility with any future government integration layer

### Digital Transformation

iBarangay represents a foundational digital transformation milestone for Philippine barangay governance:

- Establishes the **first comprehensive digital resident database** at the barangay level for participating communities
- Creates an **immutable digital audit trail** for all administrative actions — a governance accountability mechanism that does not exist in paper-based systems
- Enables **data-driven governance**: barangay captains and DICT administrators can analyze trends, identify underserved residents, and measure service delivery performance using real data
- Builds **digital literacy** among barangay staff through daily system use, preparing them for future e-government initiatives
- **Advances digital inclusion** for residents by providing online access to government services from their smartphones — particularly valuable for elderly residents, PWDs, and those with limited mobility

---

## XXIII. SUSTAINABILITY AND MAINTENANCE

### System Maintenance

iBarangay follows a **tiered maintenance release schedule**:

| Release Type | Frequency | Scope | Example |
|---|---|---|---|
| Hotfix | As needed (within 48h of discovery) | Critical bug fix, security patch | Fix broken login, patch security vulnerability |
| Patch release | Monthly | Non-critical bug fixes, dependency updates | Fix UI alignment issue, update firebase SDK |
| Minor release | Quarterly | New features, UX improvements | Add new document type, improve analytics dashboard |
| Major release | Annually | Architectural changes, major features | Multi-municipality support, PSA integration |

All releases follow the change management process: feature branch → code review → staging → QA sign-off → production deployment via GitHub push.

### Technical Support

**Support tiers aligned with subscription plans:**

| Tier | Response Time | Channel | Included In |
|---|---|---|---|
| Basic | 48 hours | Email (support@ibarangay.com) | Starter Plan |
| Priority | 24 hours | Email + Phone | Professional Plan |
| Dedicated | 4 hours | Email + Phone + Video | Enterprise Plan |
| Emergency | 2 hours | Phone + Direct escalation | All plans (critical outages) |

Support covers: system access issues, configuration questions, workflow guidance, bug reporting, and feature requests. Hardware and network issues at barangay sites are outside the support scope.

### Software Updates

| Update Type | Process | Frequency |
|---|---|---|
| Security patches | Immediate: hotfix branch → staging test → production deploy | Within 48h of CVE publication |
| npm dependency updates | `npm update` in staging → `npm audit` clean → PR review → production | Monthly |
| Next.js/React upgrades | Evaluate release notes for breaking changes → staging test → production | Quarterly review |
| Firebase SDK upgrades | Validate API compatibility in staging → deploy | Quarterly review |
| TypeScript upgrades | Compile with `tsc --noEmit` to check type errors → fix → deploy | Annually |

All updates go through staging before production. No `npm update` directly to production.

### Security Updates

| Activity | Frequency | Responsible |
|---|---|---|
| `npm audit` vulnerability check | Pre-every-deployment (CI) | Automated |
| Firestore security rules review | After any role/feature change | Technical Lead |
| Firebase App Check token rotation | Annually | Technical Lead |
| Admin SDK service account key rotation | Every 6 months | Technical Lead |
| Penetration testing | Annually | Third-party security firm |
| Data Privacy Act compliance review | Annually | Technical Lead + Legal |
| Security incident response drill | Annually | Technical Lead + Project Manager |

### Infrastructure Maintenance

| Task | Frequency | Action |
|---|---|---|
| Firebase quota review | Monthly | Check read/write/storage usage vs. Blaze plan limits in Firebase Console |
| GCP billing review | Monthly | Verify actual vs. budgeted spend; investigate anomalies |
| Vercel function performance review | Monthly | Check cold start frequency, error rate, duration metrics |
| Firestore export backup verification | Monthly | Restore a sample document from the latest backup to verify integrity |
| Storage cleanup (old payment proofs) | Annually | Archive payment proof images older than 3 years per retention policy |
| SSL/TLS certificate | Automatic | Vercel manages certificate renewal automatically |

### System Monitoring

**Monitoring dashboard checklist (reviewed weekly by Technical Lead):**

| Monitor | Platform | Metric | Alert Threshold |
|---|---|---|---|
| Authentication success rate | Firebase Console | Failed logins / total logins | >10% failure rate |
| Firestore operations | Firebase Console | Reads, writes, deletes per day | >80% of daily quota |
| Storage usage | Firebase Console | GB used | >80% of allocated budget |
| API route error rate | Vercel Dashboard | 5xx responses / total requests | >1% error rate |
| Function cold starts | Vercel Dashboard | Cold start latency | >1000ms p95 |
| Build status | Vercel Dashboard | Last deployment status | Any failed build |
| GCP billing | Cloud Console | Monthly spend | >110% of budget |

Alerts are configured in GCP Billing and Firebase Quotas to notify the Technical Lead by email when thresholds are approached.

### Capacity Planning

**Annual capacity planning review (conducted in Q4 each year):**

1. **Barangay growth projection**: Estimate new barangay onboarding count for the next 12 months
2. **Data volume projection**: Calculate expected Firestore document growth based on current rate × projected barangay count
3. **API traffic projection**: Estimate Vercel function invocation growth and review serverless plan limits
4. **Storage projection**: Estimate Firebase Storage growth from payment proofs and barangay seals
5. **Cost projection**: Model infrastructure costs for the projected scale; compare against subscription revenue
6. **Plan adjustments**: Upgrade Firebase or Vercel plans proactively before limits are reached; adjust `maxInstances` in `apphosting.yaml` as traffic grows

---

## XXIV. CONCLUSION AND RECOMMENDATION

### Summary of the Proposed Architecture

iBarangay is a production-ready, cloud-native, multi-tenant barangay management system built on a serverless, zero-infrastructure architecture. The technology stack — Next.js 14, Firebase (Authentication, Firestore, Storage, Cloud Functions), Google Gemini AI via Genkit, and Vercel — represents mature, globally proven technologies deployed specifically to address the governance needs of Philippine barangay local government units.

The architecture achieves:
- **Security**: Role-based access enforced at the database layer via declarative security rules; JWT authentication; AES-256 encryption at rest; TLS 1.3 in transit
- **Scalability**: Serverless compute and managed NoSQL database scale automatically from 5 barangays to 42,000+ without code changes or infrastructure provisioning
- **Reliability**: Multi-region Google Cloud infrastructure with managed backups, automatic failover, and Vercel's global CDN delivery
- **Accessibility**: Progressive Web App with offline support enables access from any internet-connected device, including in low-bandwidth and connectivity-challenged barangay environments
- **Maintainability**: TypeScript throughout, CI/CD via GitHub + Vercel, version-controlled infrastructure configuration, and comprehensive documentation in the `docs/` directory

### Justification for Implementation

Three converging factors make iBarangay's implementation not just beneficial but essential:

1. **Governance gap**: 42,000+ Philippine barangays — the government's most numerous and citizen-facing tier — have no digital management solution. iBarangay fills this gap with a system purpose-built for their specific operational context and budget constraints.

2. **Technology readiness**: The system is fully developed, tested, and documented. It is not a prototype — it is a production-ready platform that can be deployed to pilot barangays within weeks of approval. The technical risk is low because the architecture relies entirely on managed cloud services with Google- and Vercel-level SLAs.

3. **Cost-effectiveness**: At ₱25,000–₱75,000 per barangay per year, iBarangay costs less than the annual budget many barangays spend on paper and printing alone. The return on investment — in staff time saved, error reduction, and improved resident service — is measurable within the first quarter of operation.

### Recommendation for Approval and Implementation

It is hereby recommended that DICT MIMAROPA Region IV-B formally approve the iBarangay Digital Barangay Management System for deployment, beginning with a **5-barangay pilot program** in Oriental Mindoro, with the following phased implementation:

| Phase | Timeline | Scope | Target |
|---|---|---|---|
| Phase 1: Pilot | Months 1–6 | 5 barangays, Oriental Mindoro | Prove operational value, collect feedback |
| Phase 2: Provincial | Months 7–18 | All 426 barangays, Oriental Mindoro | Full provincial digital transformation |
| Phase 3: Regional | Months 19–36 | All MIMAROPA provinces (~1,460 barangays) | Regional governance modernization |
| Phase 4: National | Years 3–5 | Nationwide expansion with DILG partnership | Nationwide barangay digitization |

The development team requests the following for immediate commencement:
1. Formal written approval from DICT MIMAROPA Director
2. Budget allocation for Year 1 (₱6,764,125 as detailed in Section XXI)
3. Identification and commitment of 5 pilot barangays and their designated Admin users
4. Assignment of a DICT MIMAROPA Project Manager as the primary coordination point

With these in place, the system can be deployed to the first pilot barangay within four weeks of approval.

---

## XXV. REFERENCES

- Firebase Documentation. (2024). *Cloud Firestore Security Rules*. Google. https://firebase.google.com/docs/firestore/security/get-started
- Firebase Documentation. (2024). *Firebase Authentication*. Google. https://firebase.google.com/docs/auth
- Firebase Documentation. (2024). *Firebase Storage Security Rules*. Google. https://firebase.google.com/docs/storage/security
- Firebase Documentation. (2024). *Firebase App Hosting*. Google. https://firebase.google.com/docs/app-hosting
- Next.js Documentation. (2024). *App Router*. Vercel. https://nextjs.org/docs/app
- Next.js Documentation. (2024). *API Routes*. Vercel. https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Google AI. (2024). *Gemini API Documentation*. Google. https://ai.google.dev/docs
- Genkit Documentation. (2024). *Firebase Genkit for Node.js*. Google. https://firebase.google.com/docs/genkit
- Vercel Documentation. (2024). *Deploying Next.js*. Vercel. https://vercel.com/docs/frameworks/nextjs
- Workbox Documentation. (2024). *Workbox — JavaScript Libraries for Progressive Web Apps*. Google. https://developer.chrome.com/docs/workbox
- next-pwa. (2024). *@ducanh2912/next-pwa*. npm. https://www.npmjs.com/package/@ducanh2912/next-pwa
- shadcn/ui Documentation. (2024). *Building your component library*. https://ui.shadcn.com
- Radix UI. (2024). *Radix Primitives Documentation*. https://www.radix-ui.com/primitives
- React Hook Form. (2024). *Performance, flexible and extensible forms*. https://react-hook-form.com
- Zod Documentation. (2024). *TypeScript-first schema validation*. https://zod.dev
- Department of Information and Communications Technology. (2023). *Digital Governance Reference Architecture for Philippine LGUs*. DICT Philippines.
- Republic Act No. 10173. (2012). *Data Privacy Act of 2012*. Republic of the Philippines. https://privacy.gov.ph/data-privacy-act
- National Privacy Commission. (2023). *Data Privacy Act Implementing Rules and Regulations*. NPC Philippines. https://privacy.gov.ph
- Department of the Interior and Local Government. (2022). *Barangay Governance Manual*. DILG Philippines.
- Philippine Statistics Authority. (2023). *Philippine Standard Geographic Code (PSGC)*. PSA. https://psa.gov.ph/classification/psgc
- OWASP Foundation. (2024). *OWASP Top Ten Web Application Security Risks*. https://owasp.org/www-project-top-ten
- Google Cloud. (2024). *Cloud Firestore — Data model*. https://cloud.google.com/firestore/docs/data-model
- Christensen, C. M. (1997). *The Innovator's Dilemma*. Harvard Business School Press.
- Dunleavy, P., Margetts, H., Bastow, S., & Tinkler, J. (2006). *Digital Era Governance*. Oxford University Press.
- Gil-Garcia, J. R., Dawes, S. S., & Pardo, T. A. (2018). Digital government and public management research. *Public Management Review*, 20(5), 633–646.

---

## XXVI. APPENDICES

### Appendix A: System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER DEVICES                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │         Next.js 14 Web Application (React 18)                │    │
│  │   Tailwind CSS + shadcn/ui (Radix UI)                        │    │
│  │   PWA Service Worker (Workbox via next-pwa)                  │    │
│  │   React Context API (app-context.tsx) — Global State         │    │
│  └────────────┬───────────────────────┬──────────────────────────┘    │
└───────────────┼───────────────────────┼──────────────────────────────┘
     HTTPS/TLS  │              Firebase │ SDK (WebSocket/HTTP)
                ▼                       ▼
┌────────────────────────┐   ┌──────────────────────────────────────┐
│    VERCEL EDGE CDN      │   │         FIREBASE / GCP                │
│    (Global Nodes)       │   │                                       │
│                         │   │  ┌─────────────┐  ┌───────────────┐  │
│  Static Assets          │   │  │ Firebase    │  │ Cloud         │  │
│  (JS/CSS/Images)        │   │  │ Auth (JWT)  │  │ Firestore     │  │
│                         │   │  └─────────────┘  └───────────────┘  │
│  Next.js API Routes     │   │                                       │
│  (Serverless Functions) │◄──►  ┌─────────────┐  ┌───────────────┐  │
│  /api/admin/create-user │   │  │ Firebase    │  │ Cloud         │  │
│  /api/admin/delete-user │   │  │ Storage     │  │ Functions     │  │
│  /api/ai/generate-report│   │  │ (GCS)       │  │ (deleteUser)  │  │
│                         │   │  └─────────────┘  └───────────────┘  │
│  Firebase Admin SDK     │   │                                       │
│  (token verify, admin   │   │  ┌──────────────────────────────────┐ │
│   user operations)      │   │  │ Google Gemini AI (via Genkit)    │ │
└────────────────────────┘   │  │ @genkit-ai/google-genai          │ │
                              │  └──────────────────────────────────┘ │
                              └──────────────────────────────────────┘
```

### Appendix B: Network Architecture Diagram

```
[Barangay Staff — Desktop / Laptop]     [Resident — Smartphone / Tablet]
           │                                          │
    [LTE / DSL / WiFi ISP]               [LTE / Mobile Data / WiFi]
           │                                          │
           └──────────────┬───────────────────────────┘
                          │
                   [Public Internet]
                          │
              ┌───────────▼────────────┐
              │   VERCEL EDGE CDN      │   ← Static assets, CDN delivery
              │   (Singapore / HK)     │
              └───────────┬────────────┘
                          │ Serverless function execution
              ┌───────────▼────────────────────────────┐
              │       GOOGLE CLOUD PLATFORM             │
              │       asia-southeast1 (Singapore)       │
              │                                         │
              │  ┌──────────┐  ┌──────────┐            │
              │  │ Firebase │  │Firestore │            │
              │  │   Auth   │  │ Database │            │
              │  └──────────┘  └──────────┘            │
              │                                         │
              │  ┌──────────┐  ┌──────────┐            │
              │  │ Firebase │  │  Gemini  │            │
              │  │ Storage  │  │    AI    │            │
              │  └──────────┘  └──────────┘            │
              └─────────────────────────────────────────┘
```

### Appendix C: Data Flow Diagram

**Document Request Lifecycle:**

```
RESIDENT                 SECRETARY                TREASURER          FIRESTORE
   │                         │                        │                  │
   ├─ Login ──────────────────────────────────────────────────────────►│
   │◄─ Auth token ────────────────────────────────────────────────────┤
   │                         │                        │                  │
   ├─ Submit document ────────────────────────────────────────────────►│
   │  request form            │                        │         [create documentRequest]
   │◄─ onSnapshot update ─────────────────────────────────────────────┤
   │  (status: Pending)       │                        │                  │
   │                         │◄─ onSnapshot: new ──────────────────────┤
   │                         │   request appears       │                  │
   │                         │                        │                  │
   │                         ├─ Approve request ────────────────────────►│
   │                         │                        │         [update status: Approved]
   │◄─ Email notification ──────────────────────────────────────────────┤
   │  (status: Approved)      │                        │                  │
   │                         │                        │                  │
   ├─ Upload payment ──────────────────────────────── Firebase Storage  │
   │  proof image             │                        │                  │
   ├─ Create payment record ──────────────────────────────────────────►│
   │                         │                        │         [create payment record]
   │                         │                        │◄─ onSnapshot ───┤
   │                         │                        │   new payment    │
   │                         │                        │                  │
   │                         │                        ├─ Verify payment ─►│
   │                         │                        │         [update payment.verified]
   │◄─ Email notification ──────────────────────────────────────────────┤
   │  (payment verified)      │                        │                  │
   │                         │                        │                  │
   │                         ├─ Release document ───────────────────────►│
   │                         │                        │         [update status: Released]
   │◄─ Email notification ──────────────────────────────────────────────┤
   │  (document ready)        │                        │                  │
```

### Appendix D: Entity Relationship Diagram (Logical)

```
BARANGAY
  │ id (PK)
  │ name, municipality, province
  │ logoUrl, pricing{}
  │ isActive, createdAt
  │
  ├──────────────────────────────────────────────────────┐
  │                                                       │
  ▼ (1:M)                                                ▼ (1:M)
USERS                                               RESIDENTS
  │ uid (PK)                                          │ id (PK)
  │ email, role                                       │ barangayId (FK → BARANGAY)
  │ barangayId (FK → BARANGAY)                        │ userId (FK → USERS)
  │ isSuperAdmin                                      │ firstName, lastName
  │ createdAt                                         │ birthdate, civilStatus
  │                                                   │ address, contactNumber
  │                                                   │ avatarUrl, createdAt
  │                                                   │
  │                                                   ▼ (1:M)
  │                                           DOCUMENT_REQUESTS
  │                                              │ id (PK)
  │                                              │ barangayId (FK → BARANGAY)
  │                                              │ residentId (FK → RESIDENTS)
  │                                              │ type, status, fee
  │                                              │ purpose, processedBy (FK → USERS)
  │                                              │ createdAt, updatedAt, releasedAt
  │                                              │
  │                                              ▼ (1:M)
  │                                          PAYMENTS
  │                                              id (PK)
  │                                              barangayId (FK → BARANGAY)
  │                                              requestId (FK → DOCUMENT_REQUESTS)
  │                                              amount, method, proofUrl
  │                                              verified, verifiedBy (FK → USERS)
  │                                              createdAt
  │
  ▼ (1:M via barangayId)
OFFICIALS
  id (PK)
  barangayId (FK → BARANGAY)
  name, position, term
  createdAt
```

### Appendix E: API Specifications

**POST `/api/admin/create-user`**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

Request Body:
{
  "email": "secretary@barangay.com",
  "password": "SecurePass123!",
  "displayName": "Maria Santos",
  "role": "Secretary",
  "barangayId": "brgy_abc123"
}

Success Response (201):
{
  "success": true,
  "uid": "firebase_uid_xyz",
  "email": "secretary@barangay.com"
}

Error Response (401):
{ "error": "Unauthorized: invalid or expired token" }

Error Response (403):
{ "error": "Forbidden: insufficient permissions" }
```

**DELETE `/api/admin/delete-user`**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

Request Body:
{ "uid": "firebase_uid_xyz" }

Success Response (200):
{ "success": true, "message": "User deleted" }

Error Response (404):
{ "error": "User not found" }
```

**POST `/api/ai/generate-report`**
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

Request Body:
{
  "prompt": "Generate a monthly summary of document requests for October 2026",
  "barangayId": "brgy_abc123",
  "dataContext": { "totalRequests": 142, "approved": 130, "rejected": 12 }
}

Success Response (200, streaming text):
"In October 2026, Barangay XYZ processed 142 document requests..."

Error Response (429):
{ "error": "AI service rate limit exceeded; please try again in 30 seconds" }
```

### Appendix F: System Requirements

See **Section XV: Hardware and Software Requirements** for complete specification tables covering hardware, software dependencies (with exact versions from `package.json`), network, and security requirements.

### Appendix G: Project Timeline / Gantt Chart

| Week | Activity | Phase |
|---|---|---|
| 1–2 | Requirements analysis, stakeholder workshops | Analysis |
| 2–3 | System assessment, Firebase project setup | Assessment |
| 3–4 | Architecture design, security rule design, ERD | Design |
| 4–6 | Sprint 1: Auth, user management, initial setup | Development |
| 6–8 | Sprint 2: Barangay management, settings | Development |
| 8–10 | Sprint 3: Resident management | Development |
| 10–12 | Sprint 4: Document request forms | Development |
| 12–14 | Sprint 5: Document workflow (approve/release) | Development |
| 14–16 | Sprint 6: Payment tracking, treasurer verification | Development |
| 16–18 | Sprint 7: Analytics dashboard, PDF generation | Development |
| 18–20 | Sprint 8: AI analytics (Gemini/Genkit) | Development |
| 20–22 | Sprint 9: PWA, offline mode, install prompt | Development |
| 22–24 | Sprint 10: Super Admin, UI polish, dark mode | Development |
| 24–26 | Integration, end-to-end testing, security rule validation | Integration |
| 26–28 | Testing (unit, integration, system, security, performance) | Testing |
| 28–29 | UAT with pilot barangay staff | Testing |
| 29 | Production deployment, post-deployment checklist | Deployment |
| 29–31 | Staff training (all roles, 5 pilot barangays) | Training |
| 31+ | Ongoing monitoring, support, maintenance | Maintenance |

**Total estimated duration to production go-live: 29 weeks (~7 months)**

### Appendix H: Estimated Budget

See **Section XXI: Budgetary Requirements** for the full itemized breakdown.

**Summary:**

| Category | Amount |
|---|---|
| Hardware | ₱322,500 |
| Software (Year 1) | ₱300,000 |
| Development | ₱2,160,000 |
| Integration | ₱460,000 |
| Security | ₱400,000 |
| Training | ₱335,000 |
| Maintenance (Year 1) | ₱2,190,000 |
| Contingency (15%) | ₱596,625 |
| **Grand Total (Year 1)** | **₱6,764,125** |

### Appendix I: Security and Privacy Requirements

**Authentication Requirements:**
- Firebase Authentication Email/Password provider must be enabled in the Firebase project
- Minimum password length: 8 characters; must include uppercase, lowercase, and numeric characters
- Password reset via verified email only; no security question fallback
- Sessions expire after 1 hour; silent token refresh via Firebase SDK
- Super Admin accounts require the `isSuperAdmin: true` custom claim set via Admin SDK; this claim is never set client-side
- The `/initial-setup` route must be permanently disabled after the first Super Admin account is created

**Authorization Requirements:**
- `firestore.rules` must be deployed and active before any barangay goes live
- `storage.rules` must be deployed and active before file upload features go live
- All Next.js API routes must call `admin.auth().verifyIdToken(token)` before executing any Firebase Admin SDK operation
- The RBAC matrix in Section XIII must be validated against the deployed rules using the Firebase Emulator Suite before each production release
- `barangayId` must be present and validated on all writes to `/residents`, `/documentRequests`, `/payments`, and `/officials` collections

**Credential Security Requirements:**
- `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, and `GEMINI_API_KEY` must never appear in source code, commit history, or client-side JavaScript bundles
- `.env.local` must be listed in `.gitignore` and must never be committed to GitHub
- `src/firebase/config.ts` (containing client-side Firebase config) must be listed in `.gitignore`
- Firebase Admin SDK service account keys must be rotated every 6 months
- Gemini API keys must be rotated annually
- All credentials stored in Vercel encrypted environment variables for production

**Firebase App Check:**
- Must be enabled in the Firebase project for production
- App Check prevents non-app clients (e.g., Postman, scripts) from calling Firebase APIs directly without a valid app attestation token
- Configured using Google Play Integrity (Android), App Attest (iOS), or reCAPTCHA Enterprise (web)

**Data Privacy Act (RA 10173) Compliance Checklist:**
- [ ] Privacy notice displayed to residents during registration explaining data collection purpose
- [ ] Resident consent obtained during registration for data processing
- [ ] Data minimization: only fields necessary for barangay service delivery are collected
- [ ] Access controls: residents can only access their own data; staff limited to own barangay
- [ ] Right to access: residents can view their profile and all their document requests
- [ ] Right to rectification: residents can edit their own profile; staff can correct records
- [ ] Right to erasure: staff and Admin can permanently delete resident records
- [ ] Data retention policy documented and communicated to barangay staff
- [ ] Data breach notification procedure documented (see Section XIX)
- [ ] Designated Data Protection Officer (DPO) identified per barangay
- [ ] Annual Data Privacy Act compliance review conducted

---

*This document constitutes the complete Technical Detail sections (IX–XXVI) of the iBarangay System Integration and Architecture Proposal. All specifications are based on the actual implemented system. August 2026.*
