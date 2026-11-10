# iBarangay: Digital Barangay Management System
## Infrastructure Layer — Technical Reference
### Sections X–XII

---

## X. INTEGRATION ARCHITECTURE

### API Architecture

iBarangay implements a **dual API pattern** that separates concerns between client-facing real-time data access and server-side privileged operations:

**Pattern 1 — Firebase SDK (Client-side Direct Access)**
- Used for all standard CRUD operations: resident management, document requests, payment records
- The Firebase JavaScript SDK (`firebase@^11.9.1`) communicates directly with Firestore and Storage from the browser
- Security is enforced entirely by declarative Firestore and Storage rules — no custom endpoint needed
- Real-time updates via `onSnapshot()` listeners eliminate the need for polling

**Pattern 2 — Next.js API Routes (Server-side Privileged Operations)**
- Used exclusively when the Firebase Admin SDK is required (user creation, deletion, custom claim assignment)
- All routes under `src/app/api/` execute as Vercel serverless functions
- Every route verifies the caller's Firebase JWT before executing any Admin SDK operation
- Keeps Admin SDK service account credentials server-side, never exposed to the browser

**Rationale:** This dual pattern eliminates the need for a traditional backend server while still providing a secure execution environment for privileged operations. Standard data access goes direct to Firebase; admin operations go through a verified, server-side API route.

---

### API Gateway

Vercel's edge network acts as the implicit API gateway for all Next.js API routes:

| Capability | Implementation |
|---|---|
| HTTPS/TLS termination | Automatic on all Vercel deployments (TLS 1.3) |
| Request routing | `/api/*` mapped to individual serverless functions |
| Edge caching | Static responses cached at nearest edge node |
| DDoS protection | Vercel platform-level protection, included by default |
| Rate limiting | Vercel platform controls + Firebase Auth built-in throttling |
| Logging | Vercel dashboard with per-function invocation logs, duration, and status codes |
| CI/CD trigger | GitHub webhook on every push to the `main` branch |

No custom API gateway configuration (e.g., AWS API Gateway, Kong) is required. Vercel handles routing, HTTPS, and edge distribution automatically.

---

### Web Services

| Service | Provider | Integration Method | Purpose |
|---|---|---|---|
| AI Analytics & Reports | Google Gemini | Genkit SDK (server-side) | Natural language report generation, trend analysis |
| Authentication | Firebase Auth | Firebase SDK (client) + Admin SDK (server) | User identity, JWT issuance, session management |
| Database | Cloud Firestore | Firebase JS SDK | Real-time NoSQL data operations |
| File Storage | Firebase Storage | Firebase JS SDK | Barangay seals, payment proof images |
| Hosting & CDN | Vercel | GitHub CI/CD + Vercel CLI | Application delivery and global edge distribution |
| PDF Generation | jsPDF + html2canvas | npm libraries (client-side) | Barangay certificate generation and download |
| Address Data | ph-geo-admin-divisions | npm package (static local data) | PSGC-compliant address selection dropdowns |

All third-party services are accessed over HTTPS. No direct TCP or proprietary protocol connections are used.

---

### Database Integration

Cloud Firestore integration via Firebase JavaScript SDK v11 uses the following access patterns:

| Operation | SDK Method | Use Case |
|---|---|---|
| Real-time listen | `onSnapshot()` | Live dashboard updates, document status tracking |
| One-time read (single) | `getDoc()` | Fetch a specific resident or request by ID |
| One-time read (query) | `getDocs()` with `where()` | Filtered lists scoped by `barangayId` |
| Create | `setDoc()` / `addDoc()` | New resident, new document request |
| Update | `updateDoc()` | Status change, payment verification, profile edit |
| Delete | `deleteDoc()` | Remove resident or document record |
| Batch write | `writeBatch()` | Multi-document atomic updates |
| Increment | `increment()` | Counter fields (e.g., request counts) |

**Multi-tenancy enforcement:** All queries include a `where('barangayId', '==', userBarangayId)` filter to enforce tenant data isolation at the query layer. Super Admin queries omit this filter to enable cross-barangay visibility.

**Connection model:** The Firebase SDK uses persistent WebSocket connections (via gRPC or HTTP/2) for `onSnapshot` listeners, providing sub-second data delivery without polling.

---

### Authentication / SSO

Firebase Authentication is the sole identity provider for iBarangay. It manages the complete authentication lifecycle.

**Login Flow:**
1. User submits email and password on `/login`
2. `signInWithEmailAndPassword()` authenticates against Firebase Auth
3. Firebase issues a signed JWT (ID token) valid for 1 hour
4. Token is stored in the browser by the Firebase SDK (`browserLocalStorage`) and auto-refreshed before expiry
5. All subsequent Firestore and Storage requests include the token in the Authorization header
6. Firestore rules evaluate `request.auth` on every read/write operation

**Super Admin Elevated Access:**
- `isSuperAdmin: true` custom claim is set via Firebase Admin SDK on the user's token
- Rules check `request.auth.token.isSuperAdmin == true` for cross-barangay access
- Custom claims persist until explicitly revoked; clients must refresh their token to receive updated claims

**Password Reset:**
- Firebase built-in `sendPasswordResetEmail()` dispatches a time-limited reset link to the user's registered email
- No custom password reset endpoint is required

**Session Management:**
- Persistence set to `browserLocalStorage` — sessions survive page refreshes and browser restarts
- Logout calls `signOut()`, which clears the local token and terminates all active Firestore listeners
- Token auto-refresh is transparent to the user; no re-login required for active sessions

**No SSO integration** with external identity providers (Google OAuth, SAML, OIDC) exists in the current version. All accounts are email/password within the Firebase Auth tenant.

---

### Notification Services

| Channel | Trigger | Implementation | Status |
|---|---|---|---|
| In-app Toast | Any user action (save, approve, error) | Radix UI Toast (`@radix-ui/react-toast`) | Implemented |
| Email (status update) | Document request status change | Firebase email triggers / SMTP API route | Implemented |
| PWA Push Notification | Future: status change while app is closed | Workbox Push API (service worker ready) | Roadmap |
| SMS | Future: OTP or status alerts | Semaphore API (defined in subscription model) | Roadmap |

**In-app Toasts** are the primary real-time feedback mechanism. They fire for all create, update, delete, and error events, providing immediate confirmation without requiring a page refresh. Toast messages are composed per-action and styled by severity (success, warning, error).

**Email notifications** are triggered server-side when document request status transitions occur. The Firestore trigger evaluates the `status` field change and dispatches a templated email to the resident's registered email address.

---

### External System Integration

| System | Package / Method | Authentication | Data Direction | Purpose |
|---|---|---|---|---|
| Google Gemini AI | `@genkit-ai/google-genai@^1.20.0` | `GEMINI_API_KEY` env var (server-side only) | Outbound (prompt) / Inbound (streamed response) | AI report generation and trend analysis |
| Firebase Auth | `firebase@^11.9.1` | Firebase project config (public) | Bidirectional | User authentication and session management |
| Cloud Firestore | `firebase@^11.9.1` | JWT token (per-request) | Bidirectional | Primary application database |
| Firebase Storage | `firebase@^11.9.1` | JWT token (per-request) | Bidirectional | Barangay seals and payment proof image storage |
| Firebase Admin SDK | `firebase-admin@^13.6.0` | Service account private key (env var) | Outbound (privileged ops) | Server-side user management, token verification |
| Vercel Build API | GitHub webhook | GitHub token (managed by GitHub) | Outbound (trigger) | CI/CD automated deployment on push |
| PSGC Data | `ph-geo-admin-divisions@^1.0.8` | None (static local npm package) | Inbound (static read) | PSGC-compliant address hierarchy for forms |

**Not currently integrated:** PSA (Philippine Statistics Authority), DILG, PhilSys, or any other national government information system. These are planned for a future phase of development.

---

### Middleware / Integration Services

| Middleware | Package | Role |
|---|---|---|
| AI Orchestration | `genkit@^1.20.0` + `@genkit-ai/next@^1.20.0` | Structures Gemini prompts, handles streaming responses, abstracts AI provider switching |
| Firebase Admin SDK | `firebase-admin@^13.6.0` | Server-side token verification, user creation/deletion, custom claim management |
| PWA Builder | `@ducanh2912/next-pwa@^10.2.9` | Generates Workbox service worker and web manifest at build time |
| Form Validation | `react-hook-form@^7.54.2` + `zod@^3.24.2` | Client-side schema-based validation middleware applied before any Firebase write |
| Auth Resolver | `@hookform/resolvers@^4.1.3` | Bridges Zod schemas with React Hook Form's validation engine |
| Theme Provider | `next-themes@^0.3.0` | Dark/light mode middleware injected at the root layout level |
| Date Utilities | `date-fns@^3.6.0` | Consistent date formatting and manipulation across all components |

---

## XI. DATA ARCHITECTURE

### Data Sources

| Source Type | Description | Examples |
|---|---|---|
| User Input | Form data submitted by staff and residents via validated React forms | Resident registration, document request forms, payment details, barangay settings |
| File Uploads | Binary files sent to Firebase Storage | Barangay seal images (PNG/JPG), payment proof screenshots |
| System-Generated | Automatically created by application logic | Firestore document IDs, `serverTimestamp()` fields, status transition timestamps |
| AI-Generated | Outputs from Google Gemini via Genkit | Report summaries, trend analysis narratives, statistical insights |
| External Static | Pre-packaged geographic reference data bundled at build time | PSGC barangay/municipality/province hierarchy via `ph-geo-admin-divisions` |

---

### Database Architecture

Cloud Firestore is a **schema-less, NoSQL document database** with the following structural characteristics:

- **Document-collection model**: Data is organized into top-level collections; each document is identified by an auto-generated or developer-assigned ID
- **No joins**: Relationships are maintained by embedding reference IDs (e.g., `barangayId`, `residentId`) as string fields
- **Flat hierarchy**: All primary collections are top-level — no subcollections are used in the current schema, simplifying query patterns and rule enforcement
- **Real-time capability**: `onSnapshot()` streams document changes to subscribed clients within milliseconds using persistent WebSocket connections
- **Atomic batch writes**: Up to 500 document operations can be grouped into a single atomic commit via `writeBatch()`
- **Offline persistence**: The Firestore SDK caches recently read documents in the browser's IndexedDB for offline read access; writes are queued and replayed on reconnect

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
  - logoUrl: string          ← Firebase Storage URL
  - pricing: { [documentType]: number }
  - isActive: boolean
  - createdAt: timestamp

/residents/{residentId}
  - id: string
  - barangayId: string       ← tenant isolation key
  - userId: string           ← links to /users
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
  - type: string             ← e.g., "Barangay Clearance"
  - status: "Pending" | "Processing" | "Approved" | "Rejected" | "Released"
  - purpose: string
  - fee: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - processedBy: string      ← staff userId
  - releasedAt: timestamp

/payments/{paymentId}
  - id: string
  - barangayId: string
  - requestId: string
  - amount: number
  - method: string
  - proofUrl: string         ← Firebase Storage URL
  - verified: boolean
  - verifiedBy: string       ← treasurer userId
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

---

### Data Model

The data model follows a **multi-tenant, flat-document pattern** with tenant isolation enforced through the `barangayId` field present on all operational documents:

| Relationship | Implementation |
|---|---|
| Tenant anchor | `/barangays/{barangayId}` — every operational document references this ID |
| Identity anchor | `/users/{userId}` — every user's role and barangay assignment is read by Firestore security rules |
| Resident → Requests | `documentRequests.residentId` references `residents.id` for per-resident request history |
| Request → Payment | `payments.requestId` references `documentRequests.id` linking financial records to their request |
| User → Resident | `residents.userId` links a resident profile to its Firebase Auth user account for self-service |

There are no foreign key constraints (Firestore is schemaless). Referential integrity is maintained at the application layer through consistent write patterns and validated at form submission via Zod schemas.

---

### Master Data

| Master Entity | Location | Managed By | Purpose |
|---|---|---|---|
| Barangay configuration | `/barangays/{id}` | Super Admin, Admin | Tenant configuration, document pricing, branding (seal/logo) |
| User accounts | `/users/{uid}` + Firebase Auth | Super Admin, Admin | Identity, role assignment, barangay association |
| Document type catalog | Application source code (`src/lib/`) | Development team | Defines available document types and default fees |
| Pricing overrides | `barangays.pricing{}` map field | Admin, Treasurer | Per-barangay document fee customization |
| PSGC geographic data | `ph-geo-admin-divisions` npm package | N/A (static, version-pinned) | Standardized PSGC-compliant address hierarchy |

---

### Data Standards

| Standard | Implementation |
|---|---|
| Document IDs | Firebase auto-generated alphanumeric IDs (20 characters) |
| Timestamps | Firestore `serverTimestamp()` — stored as Firestore Timestamp, displayed via `date-fns` formatters |
| Address format | PSGC hierarchy: Region → Province → Municipality → Barangay → Street/Sitio |
| Phone numbers | Philippine mobile format: `09XXXXXXXXX` or `+639XXXXXXXXX` (enforced by Zod regex) |
| Image formats | JPEG/PNG only, enforced by Storage security rules: `request.resource.contentType.matches('image/.*')` |
| File size limit | 5MB maximum per file, enforced by Firebase Storage rules |
| Currency | Philippine Peso (₱), stored as `number` (float) in Firestore; displayed with `₱` prefix in the UI |
| Status values | Enumerated string constants: `"Pending"`, `"Processing"`, `"Approved"`, `"Rejected"`, `"Released"` |
| Boolean flags | Firestore native `boolean` type — never stored as string `"true"` / `"false"` |

---

### Data Synchronization

| Mechanism | Description |
|---|---|
| Real-time sync | Firestore `onSnapshot()` listeners in `app-context.tsx` subscribe to collection queries on login and push state updates to React whenever any document in a subscribed collection changes |
| Multi-client sync | When a Secretary updates a request status, all other users with the same collection open (resident checking status, Treasurer viewing payments) see the change reflected within milliseconds |
| Offline cache | The Firestore SDK maintains a local IndexedDB cache of recently read documents. Reads are served from cache during connectivity drops; writes are queued and replayed on reconnect |
| PWA vs. Firestore cache | PWA service worker caches rendered HTML and static assets (JS/CSS/fonts). Firestore SDK cache handles live data. These layers are complementary, not competing |
| No manual polling | The application contains no `setInterval()` or manual refresh patterns — all live data updates are driven exclusively by Firestore listeners |

---

### Data Validation

**Three-layer validation architecture:**

| Layer | Tool | When | What It Validates |
|---|---|---|---|
| Client (UI) | React Hook Form + Zod | On input change and form submit | Field types, required fields, format patterns (phone, email), length limits |
| Transport | TypeScript interfaces | At compile time | Shape of data objects passed between components and functions |
| Server (Database) | Firestore Security Rules | On every read/write operation | `barangayId` ownership, authentication status, role-based permission |

**Example Zod schema (resident creation):**
```typescript
const residentSchema = z.object({
  firstName:     z.string().min(1, "First name is required"),
  lastName:      z.string().min(1, "Last name is required"),
  birthdate:     z.date({ required_error: "Birthdate is required" }),
  civilStatus:   z.enum(["Single", "Married", "Widowed", "Separated"]),
  contactNumber: z.string().regex(/^(09|\+639)\d{9}$/, "Invalid Philippine phone number"),
  barangayId:    z.string().min(1)
});
```

No data reaches Firebase unless it passes both the Zod schema check and the Firestore security rule evaluation.

---

### Data Governance

| Governance Area | Policy | Implementation |
|---|---|---|
| Access control | RBAC with `barangayId` scoping | Firestore security rules (`firestore.rules`); enforced server-side by Firebase |
| Data minimization | Collect only fields necessary for barangay service delivery | Schema design; no unnecessary personal or sensitive fields |
| Purpose limitation | Resident data used only for barangay government service delivery | No third-party data sharing; AI analytics use anonymized aggregate context |
| Right to access | Residents can view their own profile and all their requests | Role-based read permissions in Firestore rules |
| Right to deletion | Staff can permanently delete resident records | `deleteDoc()` available to Secretary and Admin roles; confirmation dialog required |
| Data retention | Operational data retained per Philippine government audit requirements | No automatic expiry; archival policy defined and documented per barangay |
| Breach response | Documented incident response procedure | Notification within 72 hours as required by RA 10173 |
| Regulatory compliance | Philippine Data Privacy Act (RA 10173) | Access controls, audit log fields, data minimization, deletion rights, DPO designation |
| Third-party exposure | Prohibited for personal data | AI queries receive only aggregate/anonymized data; no raw personal fields |

---

## XII. NETWORK AND INFRASTRUCTURE ARCHITECTURE

### Network Topology

iBarangay operates on a **cloud-hosted, internet-facing, serverless topology** with zero on-premises infrastructure:

```
┌──────────────────────────────────────────────────────────────────┐
│                       END USER DEVICES                            │
│  Desktop (Chrome/Edge/Firefox)  │  Mobile (Android/iOS Browser)  │
│               └── PWA Installed App                              │
└─────────────────────┬────────────────────────────────────────────┘
                      │ HTTPS / TLS 1.3
                      │
┌─────────────────────▼────────────────────────────────────────────┐
│                 VERCEL EDGE CDN (Global)                          │
│   Static assets served from nearest edge node to Philippines     │
│   Next.js API routes → Vercel Serverless Functions               │
│   Automatic HTTPS, DDoS protection, rate limiting                │
└─────────────────────┬────────────────────────────────────────────┘
                      │ Internal GCP network
                      │
┌─────────────────────▼────────────────────────────────────────────┐
│            GOOGLE CLOUD PLATFORM (asia-southeast1)               │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │  Firebase    │  │  Cloud        │  │  Firebase Storage    │  │
│  │  Auth        │  │  Firestore    │  │  (GCS Bucket)        │  │
│  └──────────────┘  └───────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌────────────────────────────────────────┐   │
│  │  Firebase    │  │  Google Gemini AI (via Genkit)         │   │
│  │  Functions   │  │  (AI / ML APIs)                        │   │
│  └──────────────┘  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

No VPN, dedicated leased line, or on-premises server is required at any barangay site. Connectivity requirements are limited to standard HTTPS (port 443) on any ISP-provided broadband or LTE connection.

---

### Server Architecture

| Component | Architecture | Scaling | Management |
|---|---|---|---|
| Next.js Web App | Vercel serverless (edge + lambda) | Auto-scales with incoming requests | Zero ops — fully managed by Vercel |
| Next.js API Routes | Vercel serverless functions | Auto-scales per function, per invocation | Zero ops — fully managed by Vercel |
| Cloud Firestore | Distributed NoSQL (Google-managed, multi-region) | Auto-scales with read/write load | Zero ops — fully managed by Firebase |
| Firebase Auth | Distributed identity service (Google-managed) | Auto-scales with authentication requests | Zero ops — fully managed by Firebase |
| Firebase Storage | Google Cloud Storage object store | Auto-scales with storage usage and bandwidth | Zero ops — fully managed by Firebase |
| Firebase Functions | Google Cloud Run functions | `maxInstances: 1` (pilot phase, per `apphosting.yaml`) | Adjustable in `apphosting.yaml` |
| Gemini AI | Google AI API (multi-region) | Google-managed, no configuration needed | Zero ops — fully managed by Google |

**No virtual machines, no containers to manage, and no server provisioning** are required by the iBarangay operations team. All compute is serverless and on-demand.

---

### Internet Connectivity

| Connection Type | Minimum | Recommended | Notes |
|---|---|---|---|
| Barangay staff workstation | 1 Mbps stable | 5 Mbps | Dashboard, document processing, file uploads (max 5MB) |
| Resident self-service | 512 Kbps | 2 Mbps | Form submission, status checking, payment proof upload |
| PWA offline mode | No internet required | — | Read-only access to all previously cached pages and data |
| Mobile (LTE/4G) | 3G sufficient | LTE / 4G | Responsive design fully optimized for mobile |

Vercel's CDN serves static assets from the nearest edge node. For Philippine users, this is typically Singapore or Hong Kong, achieving sub-100ms asset delivery times.

---

### Firewall

| Layer | Type | Implementation | Protects Against |
|---|---|---|---|
| Network edge | CDN / WAF | Vercel platform firewall | DDoS attacks, volumetric traffic floods, malicious bots |
| Application (data) | Rules-as-firewall | Firestore Security Rules | Unauthorized data access, cross-tenant data leakage |
| Application (files) | Rules-as-firewall | Firebase Storage Rules | Unauthorized file access, oversized uploads, wrong MIME types |
| Transport | TLS enforcement | Vercel automatic HTTPS + redirect | Man-in-the-middle attacks, packet sniffing |
| API | Token verification | Firebase Admin SDK `verifyIdToken()` | Unauthenticated API calls, forged or expired tokens |

There is **no hardware firewall or network appliance** required at any barangay site. All network security is handled at the cloud provider layer.

---

### Load Balancer

Load balancing is handled transparently by the hosting platforms — no manual configuration is required:

| Layer | Load Balancer | Behavior |
|---|---|---|
| Vercel (HTTP traffic) | Vercel platform | Automatically distributes incoming HTTP requests across serverless function instances. New instances are spun up on-demand for concurrent requests. |
| Cloud Firestore | Google-internal | Google distributes read and write operations across Firestore nodes transparently. |
| Firebase Auth | Google-internal | Google's identity infrastructure handles concurrent authentication requests at scale. |
| Firebase Storage | Google Cloud Load Balancing | GCS distributes storage operations automatically. |

No manual load balancer configuration (NGINX, HAProxy, AWS ELB) is required at any layer.

---

### Storage

| Storage Type | Service | Capacity | Access Control | Use Case |
|---|---|---|---|---|
| Document database | Cloud Firestore | Scales to terabytes | Firestore security rules + JWT token | All structured application data |
| Object storage | Firebase Storage (GCS) | Scales to petabytes | Storage security rules + JWT token | Barangay seal images, payment proof photos |
| Static asset CDN | Vercel Edge CDN | Per deployment (automatic) | Public (no auth required) | JS bundles, CSS stylesheets, fonts, icons |
| Local browser cache | IndexedDB (Firestore SDK) | ~50MB per browser | Same-origin policy | Offline Firestore data reads |
| PWA page cache | Service Worker (CacheStorage) | ~100MB per browser | Same-origin policy | Cached rendered pages, static assets |

**Firebase Storage Security Rules Summary:**

| Path | Read | Write | Constraints |
|---|---|---|---|
| `/barangay-logos/*` | Public (anyone) | Super Admin only (`isSuperAdmin == true`) | Max 5MB, `image/*` MIME type |
| `/payment-proofs/*` | Authenticated users | Authenticated users (own barangay) | Max 5MB, `image/*` MIME type |
| All other paths | Denied | Denied | Default-deny policy |

---

### Backup Infrastructure

| Asset | Backup Method | Frequency | Retention | Recovery |
|---|---|---|---|---|
| Firestore data | GCP managed point-in-time recovery | Continuous (GCP-managed, automatic) | 7 days rolling | Restore via Firebase Console or `gcloud` CLI |
| Firestore exports | Cloud Scheduler → GCS export | Daily at 2:00 AM (configurable) | 30 days rolling; monthly for 1 year | Import via Firebase Admin SDK |
| Firebase Storage files | GCS multi-region redundancy | Real-time automatic replication | Indefinite | Automatic GCS failover, no manual action needed |
| Application code | GitHub repository (full commit history) | On every commit | Complete history | Redeploy any commit via Vercel dashboard |
| Deployment artifacts | Vercel deployment history | On every production deploy | Complete history | One-click rollback in Vercel dashboard |

**Recovery objectives:**

| Data Type | Recovery Point Objective (RPO) | Recovery Time Objective (RTO) |
|---|---|---|
| Firestore structured data | ~1 hour (GCP managed recovery) | 1–4 hours |
| Firestore structured data | ~24 hours (scheduled export) | 4–8 hours |
| Firebase Storage files | ~0 seconds (multi-region) | Automatic, no RTO |
| Application code | Last commit | 2–5 minutes (Vercel rollback) |

---

### Cloud / On-Premises Infrastructure

iBarangay is **fully cloud-native**. No on-premises infrastructure is required or used at any level.

| Provider | Services Used | Region | Purpose |
|---|---|---|---|
| Google Cloud Platform | Firebase Auth, Cloud Firestore, Firebase Storage, Cloud Functions, Google Gemini AI | `asia-southeast1` (Singapore) | All backend services and data storage |
| Vercel | Next.js hosting, serverless API functions, CI/CD pipeline, global CDN | Global edge — nearest Philippines nodes: Singapore / Hong Kong | Application delivery and server-side operations |
| GitHub | Source code version control, CI/CD trigger (GitHub → Vercel webhook) | Global | Code repository and deployment trigger |

**Infrastructure characteristics:**
- No barangay needs to procure, host, or maintain any server hardware
- No network appliances, VPN concentrators, or data center equipment are needed
- Infrastructure provisioning for a new barangay is a single database document write — no code change, no server, no configuration
- All platform SLAs are provided by Google Cloud and Vercel at their respective published uptime guarantees
- AES-256 encryption at rest and TLS 1.3 in transit are provided automatically by GCP and Vercel; no encryption configuration is required

---

*Infrastructure Layer reference — iBarangay Digital Barangay Management System. August 2026.*
