# iBarangay BMS: Comprehensive System Modeling & 17 Diagrams Specification

**Project Proposal Title:**  
*iBarangay: An Automated Cloud-Based Barangay Information Management, Demographic Profiling, and Civic Services System*

---

## Executive Summary & Blueprinting Answers

### 1. Project Identification
**Proposal Title:**  
`iBarangay: An Automated Cloud-Based Barangay Information Management and Civic Services Platform`

**System Summary (2–3 Sentences):**  
iBarangay is a multi-tenant, cloud-native Local Government Unit (LGU) management system engineered to automate demographic census profiling, online document issuance (Barangay Clearance, Certificate of Residency, Indigency, and Business Permits), and community blotter incident mediation for Philippine barangays. The platform integrates role-based administrative portals (Admin, Barangay Captain, Secretary, Treasurer) and a resident web/PWA portal featuring real-time civic notifications, audio chime alerts, digital payment verification (GCash), and dynamic demographic analytics. By synchronizing serverless cloud infrastructure with real-time reactive data stores, iBarangay replaces paper records with a secure, auditable, and transparent digital governance platform.

---

### 2. Structural Blueprinting (The Static Blueprint)
* **Selected Essential Structural Diagram:** **System Architecture Diagram** (with supplementary **Class Diagram**)
* **Architectural Justification:**  
  The System Architecture Diagram is foundational to iBarangay because the platform operates on a multi-tenant, serverless cloud model where physical servers are abstracted in favor of edge-rendered Next.js frontends and decoupled Firebase services (Cloud Firestore, Firebase Authentication, Cloud Storage, and Admin SDK server routes). A high-level architectural diagram is required to define the boundary between client-side optimistic UI rendering and server-side privileged execution (such as `/api/admin/create-staff`, `/api/admin/create-resident-account`, and `/api/admin/reset-password`). Without this structural blueprint, developers cannot enforce multi-tenant barangay data isolation (`barangayId` scoping), nor can stakeholders comprehend how the web application communicates securely across SSL/TLS encryption gates to the NoSQL document database.

---

### 3. Behavioral Blueprinting (The System in Motion)
* **Selected Behavioral Diagram 1:** **Sequence Diagram**
  * **Specific Project Scenario:** *Online Barangay Clearance Request with GCash Payment Verification and Document Issuance.*  
    This maps the chronological, end-to-end transaction starting when a resident fills out the document request form, passes client-side validation, writes a `Pending` record to Firestore, triggers an instant audio-visual notification on the Secretary's workstation, transitions through Treasurer payment verification against GCash reference numbers, and culminates in the Barangay Captain's digital approval and PDF issuance.
* **Selected Behavioral Diagram 2:** **Activity Diagram**
  * **Specific Project Scenario:** *Blotter Incident Filing, Jurisdiction Assessment, and Amicable Conciliation Scheduling.*  
    This flowchart maps out the operational business logic executed by the Barangay Secretary when an incident report is submitted: evaluating whether the complaint falls within barangay jurisdiction under Republic Act 7160 (Katarungang Pambarangay), routing urgent domestic cases to emergency responders, or scheduling Lupon Tagapamayapa hearing summons.

---

### 4. Data Blueprinting (User Input to Database Storage)
* **Data Flow Trace:**  
  When an actor (e.g., a Resident) submits a request or profile update through the interface:
  1. **Input Capture & Client Validation:** The user completes a form in the Next.js React frontend. Zod schemas validate format integrity (RFC 5322 emails, Philippine contact numbers, required purok selections).
  2. **Context Dispatch:** The form invokes a state action in `AppContext` (e.g., `addDocumentRequest()` or `addIncident()`).
  3. **Security Rules Gate:** The payload is packaged with the resident's authenticated UID (`currentUser.id`) and assigned `barangayId`. It hits the Cloud Firestore security boundary where `firestore.rules` validates write permissions and tenant match.
  4. **Persistence:** Firestore commits the document into `/documentRequests/{docId}` or `/incidents/{docId}`.
  5. **Reactive Propagation:** Real-time listeners (`onSnapshot` / `useCollection`) immediately broadcast the new record back to the Secretary and Admin dashboards within milliseconds, triggering the blinking notification indicator and audio chime.

---

# Part 1: Structural Diagrams (The Static Blueprint)

```
8 Structural Diagrams:
1. System Architecture Diagram
2. Class Diagram
3. Component Diagram
4. Deployment Diagram
5. Object Diagram
6. Package Diagram
7. Composite Structure Diagram
8. Profile Diagram
```

---

### Diagram 1: System Architecture Diagram

#### Purpose in iBarangay
Illustrates the multi-tier cloud topology of the iBarangay system, detailing the client devices, Next.js presentation and edge routing layers, serverless API micro-routes, and Google Cloud Firebase data services.

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Presentation Layer (Multi-Platform)"]
        ResidentDevice["Resident Portal (Mobile PWA / Web Browser)"]
        StaffWorkstation["Barangay Staff Console (Desktop Chrome / Edge)"]
        CaptainTablet["Executive Dashboard (Tablet / Mobile Web)"]
    end

    subgraph EdgeLayer["2. Routing & Edge Middleware Layer (Next.js 16 Engine)"]
        Router["Next.js App Router & Turbopack Engine (Port 9002)"]
        AuthMiddleware["RBAC Route Guards & Auth Session Watcher"]
        AppProvider["AppContext & Reactive Realtime State Provider"]
    end

    subgraph ServiceLayer["3. Server-Side Execution & API Micro-Routes"]
        StaffAPI["/api/admin/create-staff (Privileged User Creation)"]
        ResidentAccountAPI["/api/admin/create-resident-account (Portal Activation)"]
        PasswordResetAPI["/api/admin/reset-password (Admin Password Sync)"]
        ReportEngine["Client-Side PDF/Excel Generator (jsPDF / XLSX)"]
        AudioEngine["Civic Audio Synthesizer (Web Audio API Chime)"]
    end

    subgraph DataLayer["4. Cloud Infrastructure Layer (Google Firebase / GCP)"]
        FirebaseAuth["Firebase Authentication (Identity Platform)"]
        FirestoreDB[("Cloud Firestore NoSQL Database")]
        subgraph Collections["Firestore Collections (Multi-Tenant Scoped)"]
            ColBarangays["/barangays (LGU Metadata & Emergency Hotlines)"]
            ColUsers["/users (Auth Credentials & Roles)"]
            ColResidents["/residents (Census & Profiling Records)"]
            ColRequests["/documentRequests (Clearances & Permits)"]
            ColIncidents["/incidents (Blotter & Complaints)"]
            ColEvents["/events (Upcoming Barangay Gatherings)"]
        end
        CloudStorage["Firebase Cloud Storage (Payment Proofs & Seal Logos)"]
    end

    ResidentDevice -->|HTTPS / TLS 1.3| Router
    StaffWorkstation -->|HTTPS / TLS 1.3| Router
    CaptainTablet -->|HTTPS / TLS 1.3| Router

    Router --> AuthMiddleware
    AuthMiddleware --> AppProvider

    AppProvider --> StaffAPI
    AppProvider --> ResidentAccountAPI
    AppProvider --> PasswordResetAPI
    AppProvider --> ReportEngine
    AppProvider --> AudioEngine

    StaffAPI -->|Firebase Admin SDK| FirebaseAuth
    StaffAPI -->|Firebase Admin SDK| FirestoreDB
    ResidentAccountAPI -->|Firebase Admin SDK| FirestoreDB
    PasswordResetAPI -->|Firebase Admin SDK| FirebaseAuth

    AppProvider <-->|onSnapshot Real-time Listener| FirestoreDB
    AppProvider <-->|Direct Auth Tokens| FirebaseAuth
    AppProvider -->|Blob Upload| CloudStorage

    FirestoreDB --- Collections
```

#### Detailed Architectural Explanation
* **Client Layer:** Supports responsive desktop and mobile devices via Progressive Web App (PWA) capabilities.
* **Edge Routing Layer:** Powered by Next.js with Turbopack, enforcing instant client-side transitions and role-based route security (`Admin`, `Barangay Captain`, `Secretary`, `Treasurer`, `Resident`).
* **Service Layer:** Houses administrative micro-routes utilizing the `firebase-admin` SDK, ensuring administrative operations (like password resets and account provisioning) occur without mutating client auth session tokens.
* **Data Layer:** Cloud Firestore manages collections isolated by `barangayId`, guarded by strict Firestore Security Rules.

#### External Tool Generation Prompt
> *"Create a 4-tier cloud system architecture diagram for an e-governance platform named 'iBarangay'. Top layer: Client devices (Resident Smartphone PWA, Staff Desktop, Captain Tablet). Second layer: Next.js edge router with RBAC middleware and AppContext state manager. Third layer: Server-side API endpoints for staff creation, resident activation, password reset, and client-side PDF/Excel engines. Bottom layer: Google Cloud Firebase services showing Firebase Authentication, Cloud Storage, and Cloud Firestore with collections for barangays, users, residents, documentRequests, incidents, and events. Clean corporate blue and emerald palette, isometric blocks, labeled arrows with TLS 1.3 protocol."*

---

### Diagram 2: Class Diagram

#### Purpose in iBarangay
Defines the core object-oriented domain entities, their attributes, access visibilities, and relationships (aggregations, compositions, and associations) that power the iBarangay TypeScript codebase.

```mermaid
classDiagram
    class Barangay {
        +string id
        +string name
        +string address
        +string municipality
        +string province
        +string region
        +string captainName
        +int totalPopulation
        +boolean isActive
        +EmergencyHotlines emergencyHotlines
        +DocumentPricing documentPricing
        +getHotlines() EmergencyHotlines
        +updateConfig() void
    }

    class EmergencyHotlines {
        +string dutyDesk
        +string mdrrmo
        +string police
        +string fireStation
        +string healthCenter
        +string additionalNotes
    }

    class DocumentPricing {
        +number barangayClearance
        +number residency
        +number indigency
        +number businessPermit
        +number goodMoral
        +number soloParent
    }

    class User {
        +string id
        +string name
        +string email
        +Role role
        +string barangayId
        +string residentId
        +string status
        +boolean isDeleted
        +login() boolean
        +updateProfile() void
    }

    class Resident {
        +string id
        +string userId
        +string firstName
        +string lastName
        +string purok
        +string address
        +string birthdate
        +string householdNumber
        +string email
        +string contactNumber
        +string barangayId
        +getFullName() string
        +requestDocument() DocumentRequest
        +fileComplaint() IncidentReport
    }

    class DocumentRequest {
        +string id
        +string residentId
        +string residentName
        +DocumentType documentType
        +string requestDate
        +DocumentRequestStatus status
        +string trackingNumber
        +number amount
        +string barangayId
        +PaymentDetails paymentDetails
        +approve() void
        +verifyPayment() void
        +release() void
    }

    class PaymentDetails {
        +string method
        +string referenceNumber
        +string accountName
        +string paymentDate
        +string proofImageUrl
        +string verifiedBy
    }

    class IncidentReport {
        +string id
        +string caseNumber
        +string complainantName
        +string respondentName
        +string incidentType
        +string dateFiled
        +IncidentStatus status
        +string narrative
        +string barangayId
        +scheduleMediation() void
        +resolveCase() void
    }

    class BarangayEvent {
        +string id
        +string title
        +string description
        +string eventDate
        +string eventTime
        +string location
        +string barangayId
        +string createdBy
        +broadcastNotification() void
    }

    Barangay "1" *-- "1" EmergencyHotlines : contains
    Barangay "1" *-- "1" DocumentPricing : configures
    Barangay "1" o-- "*" User : employs
    Barangay "1" o-- "*" Resident : registers
    Barangay "1" o-- "*" BarangayEvent : hosts
    Resident "1" -- "0..1" User : linked_portal_account
    Resident "1" o-- "*" DocumentRequest : applies_for
    Resident "1" o-- "*" IncidentReport : reports
    DocumentRequest "1" *-- "0..1" PaymentDetails : verified_by
```

#### Detailed Architectural Explanation
* **Barangay:** The root multi-tenant entity. Composes `EmergencyHotlines` and `DocumentPricing` as dependent records.
* **User vs. Resident:** Demonstrates the separation of concerns: `Resident` represents demographic census records (52 in Mina de Oro), whereas `User` represents an authentication identity in `/users`. A resident is linked optionally (`0..1`) to a `User` login account.
* **DocumentRequest & PaymentDetails:** Encapsulates clearances and the financial audit trail.

#### External Tool Generation Prompt
> *"Generate an academic UML Class Diagram for the iBarangay local government information system. Include classes: Barangay, EmergencyHotlines, DocumentPricing, User, Resident, DocumentRequest, PaymentDetails, IncidentReport, and BarangayEvent. Detail attributes with private/public visibility, data types (string, number, boolean, date), methods, and multi-tenant relationships (1-to-many aggregations and 1-to-1 compositions). Formatted with clean UML standard notation."*

---

### Diagram 3: Component Diagram

#### Purpose in iBarangay
Illustrates how modular software components in the frontend Next.js architecture depend on state contexts, utility libraries, API services, and Firebase backend modules.

```mermaid
flowchart TB
    subgraph UIComponents["Presentation Layer (React Server & Client Components)"]
        DashboardView["Dashboard Modules (Admin, Captain, Sec, Treas, Resident)"]
        TablesView["Paginated Table Grids (usePagination & PaginationControl)"]
        DialogModules["Modal Dialogs (AddUser, ResetPassword, EmergencyModal, EventModal)"]
        NavComponents["Navigation Shell (SidebarNav & MobileBottomNav)"]
    end

    subgraph StateAndHooks["State & Business Logic Layer"]
        AppContext["AppContext (Central Reactive Data Store)"]
        AuthHook["useAuth Hook (Firebase Session State)"]
        AudioHelper["Notification Audio Synthesizer (notification-sound.ts)"]
        ExportHelper["Report Generation Utilities (lib/reports.ts)"]
    end

    subgraph BackendServices["Server Routes & API Microservices"]
        StaffService["Staff Provisioning Service (/api/admin/create-staff)"]
        ResidentService["Resident Activation Service (/api/admin/create-resident-account)"]
        ResetService["Auth Password Reset Service (/api/admin/reset-password)"]
    end

    subgraph FirebaseSDK["Firebase & External Dependencies"]
        ClientFirestore["Firebase Client SDK (useCollection, useDoc)"]
        AdminSDK["Firebase Admin SDK (adminAuth, adminDb)"]
        ExternalPDF["jsPDF & AutoTable Engine"]
        ExternalXLSX["SheetJS (xlsx) Engine"]
    end

    DashboardView --> AppContext
    TablesView --> AppContext
    DialogModules --> AppContext
    NavComponents --> AppContext

    AppContext --> AuthHook
    AppContext --> AudioHelper
    AppContext --> ClientFirestore

    TablesView --> ExportHelper
    ExportHelper --> ExternalPDF
    ExportHelper --> ExternalXLSX

    DialogModules --> StaffService
    DialogModules --> ResidentService
    DialogModules --> ResetService

    StaffService --> AdminSDK
    ResidentService --> AdminSDK
    ResetService --> AdminSDK
```

#### Detailed Architectural Explanation
* **Decoupled Architecture:** Presentation elements rely strictly on `AppContext` and custom hooks (`usePagination`, `useToast`), shielding UI views from raw network calls.
* **Dual SDK Usage:** The Client Firestore SDK handles lightweight real-time document listeners via WebSocket channels, while the Admin SDK powers high-privilege operations over protected HTTPS APIs.

#### External Tool Generation Prompt
> *"Create a UML Component Diagram showing the internal module dependencies of a Next.js 16 Web Application. Group components into Presentation Layer (Dashboard views, Paginated Tables, Modals, Mobile Nav), State/Logic Layer (AppContext, useAuth, Notification Sound, Export Utilities), Backend API Layer, and External Dependencies (Firebase Client SDK, Firebase Admin SDK, jsPDF, XLSX). Show dependencies with clean dashed UML dependency arrows."*

---

### Diagram 4: Deployment Diagram

#### Purpose in iBarangay
Maps the physical nodes, hosting environments, network protocols, execution runtimes, and database servers across the cloud deployment topology.

```mermaid
flowchart TB
    subgraph ClientNodes["Client Tier (Physical Devices)"]
        DesktopNode["Office Desktop Node\n<<device>>\nOS: Windows / macOS\nBrowser: Google Chrome v120+"]
        MobileNode["Citizen Smartphone Node\n<<device>>\nOS: Android / iOS\nBrowser: Mobile Safari / Chrome (PWA)"]
    end

    subgraph CloudVercel["Application Server Tier (Vercel / Cloud Container)"]
        subgraph NodeJSContainer["Next.js Application Server Container\n<<execution environment>>\nNode.js v20.x LTS / Turbopack Engine"]
            NextFrontend["Next.js SSR/Client Frontend\n<<artifact>>\n(Port 9002 / 443 HTTPS)"]
            NextAPI["Next.js Serverless API Worker\n<<artifact>>\n(Node.js Runtime)"]
        end
    end

    subgraph CloudFirebase["Cloud Database Tier (Google Cloud Platform)"]
        subgraph FirebasePlatform["Firebase Managed Services\n<<cloud infrastructure>>\nRegion: asia-southeast1 (Singapore)"]
            AuthEngine["Firebase Identity Platform\n<<service>>\n(JWT Auth / OIDC)"]
            FirestoreEngine["Cloud Firestore\n<<database system>>\n(Multi-Region NoSQL Engine)"]
            StorageBucket["Cloud Storage Bucket\n<<storage>>\n(GCS Payment Receipts & Assets)"]
        end
    end

    DesktopNode -->|HTTPS / TLS 1.3\n(Port 443)| NextFrontend
    MobileNode -->|HTTPS / TLS 1.3\n(Port 443)| NextFrontend

    NextFrontend -->|Local Process Invocation| NextAPI
    NextAPI -->|gRPC / Admin SDK / TLS 1.3| AuthEngine
    NextAPI -->|gRPC / Admin SDK / TLS 1.3| FirestoreEngine

    NextFrontend <-->|WSS WebSockets / Firestore Sync| FirestoreEngine
    NextFrontend -->|REST Upload / Multipart| StorageBucket
```

#### Detailed Architectural Explanation
* **Network Security:** All external traffic travels over HTTPS/TLS 1.3 on standard port 443.
* **Serverless Backend:** Node.js executes Server Components and API workers that communicate over Google's gRPC internal fabric to the `asia-southeast1` Firebase cluster.

#### External Tool Generation Prompt
> *"Draw a UML Deployment Diagram for the iBarangay cloud governance system. Nodes: Client Tier (Desktop PC running Chrome, Smartphone running iOS/Android PWA), Cloud Application Tier (Docker/Node.js Container with Next.js Turbopack application on port 443), and Google Cloud Platform Tier (Firebase Auth, Cloud Firestore NoSQL multi-region database, and Cloud Storage Bucket). Display protocols (TLS 1.3, gRPC, WebSocket), UML stereotyping <<device>>, <<execution environment>>, and <<artifact>>."*

---

### Diagram 5: Object Diagram

#### Purpose in iBarangay
Captures a concrete runtime snapshot of actual data objects, field values, and inter-object links within Barangay Mina de Oro at timestamp `2026-11-11 00:38:00`.

```mermaid
classDiagram
    class brgy_minadeoro {
        id = "Z1Zxhqsc31GzZavwpm3s"
        name = "Mina de Oro"
        municipality = "Bongabong"
        province = "Oriental Mindoro"
        totalPopulation = 52
        isActive = true
    }

    class admin_user {
        id = "0tfMPeaBD1YL15IZqHS73ogQ8m22"
        name = "Admin Mina De Oro"
        email = "admin@ibarangayminadeoro.com"
        role = "Admin"
        status = "Active"
    }

    class sec_user {
        id = "UVFO7XHmW1e62HRYMUbz0uSCAv12"
        name = "Barangay Secretary"
        email = "secretary@ibarangayminadeoro.com"
        role = "Secretary"
        status = "Active"
    }

    class resident_ryan {
        id = "wACqoqXzPqUqjcBTOcFFCCqAlqe2"
        userId = "wACqoqXzPqUqjcBTOcFFCCqAlqe2"
        firstName = "Ryan"
        lastName = "Claud"
        purok = "Purok 1"
        email = "ryan1@gmail.com"
    }

    class resident_miguel {
        id = "PROF-1794317073188-5z3ug4"
        userId = "unlinked"
        firstName = "Miguel"
        lastName = "Reyes"
        purok = "Purok 1"
        email = "NONE"
    }

    class doc_req_01 {
        id = "REQ-2026-0042"
        residentId = "wACqoqXzPqUqjcBTOcFFCCqAlqe2"
        documentType = "Barangay Clearance"
        status = "Ready for Pickup"
        amount = 50.00
    }

    class event_01 {
        id = "EVT-8821"
        title = "Seminar for TUPAD program"
        eventDate = "2026-11-12"
        location = "Barangay Multi Purpose Hall"
    }

    brgy_minadeoro ..> admin_user : assigns
    brgy_minadeoro ..> sec_user : assigns
    brgy_minadeoro ..> resident_ryan : registers
    brgy_minadeoro ..> resident_miguel : registers
    brgy_minadeoro ..> event_01 : organizes
    resident_ryan ..> doc_req_01 : requested
```

#### Detailed Architectural Explanation
* **Demonstrates Live System Reality:** Shows `resident_ryan` having an active user account, while `resident_miguel` reflects the census-only profile state (`userId = unlinked`, `email = NONE`) identified during our database audit.

#### External Tool Generation Prompt
> *"Generate a UML Object Diagram illustrating a snapshot of an active system state for Barangay Mina de Oro. Show concrete instance objects with populated attribute values: brgy_minadeoro:Barangay, admin_user:User, sec_user:User, resident_ryan:Resident (linked), resident_miguel:Resident (unregistered profile), doc_req_01:DocumentRequest (Status = Ready for Pickup), and event_01:BarangayEvent. Use UML underline notation for instance names."*

---

### Diagram 6: Package Diagram

#### Purpose in iBarangay
Shows the modular folder organization and layered namespace dependencies within the Next.js project codebase.

```mermaid
flowchart TB
    subgraph PackageRoot["Root Architecture: /src"]
        subgraph AppPkg["app/ (Routing & Endpoints)"]
            AppDashboard["(dashboard)/ - Protected Role Views"]
            AppAuth["(auth)/ - Login & Register Pages"]
            AppAPI["api/admin/ - Privileged API Endpoints"]
        end

        subgraph ComponentsPkg["components/ (UI & Presentation)"]
            CompDashboard["dashboard/ - KPI Cards, Charts, Carousel"]
            CompUsers["users/ - User Management & Modals"]
            CompResidents["residents/ - Census Tables & Forms"]
            CompUI["ui/ - Radix UI Accessible Primitives"]
        end

        subgraph ContextsPkg["contexts/ (State Management)"]
            AppContextModule["app-context.tsx - Realtime Firestore Provider"]
        end

        subgraph FirebasePkg["firebase/ (Infrastructure Connectors)"]
            FirebaseClient["client.ts & provider.tsx"]
            FirebaseAdmin["admin.ts (Server SDK Instance)"]
            FirestoreRules["firestore.rules"]
        end

        subgraph LibPkg["lib/ (Domain Models & Tools)"]
            LibTypes["types.ts (TypeScript Interfaces)"]
            LibReports["reports.ts (PDF & Excel Exporters)"]
            LibSound["notification-sound.ts (Web Audio Synthesizer)"]
        end

        subgraph HooksPkg["hooks/ (Reusable Logic)"]
            HookPagination["use-pagination.ts"]
            HookToast["use-toast.ts"]
        end
    end

    AppPkg --> ComponentsPkg
    AppPkg --> ContextsPkg
    ComponentsPkg --> ContextsPkg
    ComponentsPkg --> HooksPkg
    ComponentsPkg --> LibPkg
    ContextsPkg --> FirebasePkg
    ContextsPkg --> LibPkg
    AppAPI --> FirebasePkg
```

#### Detailed Architectural Explanation
* **Clean Layering:** Strict unidirectional dependencies prevent circular imports: `app/` consumes `components/`, which in turn consumes `contexts/`, `hooks/`, and `lib/`.

#### External Tool Generation Prompt
> *"Create a UML Package Diagram representing the folder and module architecture of a modern Next.js TypeScript repository. Group packages into: app/ (routes and API microservices), components/ (dashboard, users, residents, ui), contexts/ (AppContext), firebase/ (client connectors and admin SDK), lib/ (types, reports, audio), and hooks/ (pagination, toast). Show import dependency arrows between packages."*

---

### Diagram 7: Composite Structure Diagram

#### Purpose in iBarangay
Deconstructs the internal sub-components, ports, and interfaces of the complex `DocumentProcessingEngine` responsible for document applications, payments, and issuance.

```mermaid
flowchart LR
    subgraph Engine["<<component>> DocumentProcessingEngine"]
        PortIn[("Port 1: Request Ingest Port")]
        PortPay[("Port 2: Payment Proof Port")]
        PortOut[("Port 3: Clearance Issuance Port")]

        subgraph InternalParts["Internal Functional Units"]
            PricingCalculator["Part: PricingCalculator\n(Determines Document Tariff)"]
            SecurityValidator["Part: SecurityValidator\n(RBAC & Duplicate Checker)"]
            AuditLogger["Part: AuditLogger\n(Generates Tracking Number)"]
            DocumentStamper["Part: DocumentStamper\n(Digital Barangay Seal Attacher)"]
        end

        PortIn --> SecurityValidator
        SecurityValidator --> PricingCalculator
        PricingCalculator --> AuditLogger
        PortPay --> AuditLogger
        AuditLogger --> DocumentStamper
        DocumentStamper --> PortOut
    end

    ResidentActor["Actor: Resident Client"] -->|Submit Clearance Request| PortIn
    TreasurerActor["Actor: Treasurer Console"] -->|GCash Verification| PortPay
    PortOut -->|Downloadable PDF Certificate| ResidentActor
```

#### Detailed Architectural Explanation
* **Encapsulation:** Highlights the internal mechanics of request validation, tariff pricing lookup, and cryptographic document stamping without exposing internal details to client callers.

#### External Tool Generation Prompt
> *"Draw a UML Composite Structure Diagram for a composite classifier titled 'DocumentProcessingEngine'. Show three internal ports: Request Ingest Port, Payment Proof Port, and Clearance Issuance Port. Inside the composite structure, show connected internal parts: PricingCalculator, SecurityValidator, AuditLogger, and DocumentStamper. Illustrate interactions with external actors Resident Client and Treasurer Console."*

---

### Diagram 8: Profile Diagram

#### Purpose in iBarangay
Defines the specialized UML Domain Profile tailored to the Philippine Local Government Code (Republic Act 7160) and Katarungang Pambarangay governance standards.

```mermaid
classDiagram
    class UML_Metaclass_Class["<<metaclass>> Class"]
    class UML_Metaclass_Property["<<metaclass>> Property"]

    class LGU_Entity {
        <<stereotype>>
        +string lguCode
        +string republicAct = "RA 7160"
        +string regionalJurisdiction
    }

    class Civic_Document {
        <<stereotype>>
        +number statutoryFee
        +string validityPeriod = "6 Months"
        +boolean requiresCaptainSignature = true
    }

    class Blotter_Case {
        <<stereotype>>
        +string katarungangPambarangayForm
        +int maxMediationDays = 15
        +string mediationStatus
    }

    class Audit_Trail {
        <<stereotype>>
        +string loggedBy
        +string ipAddress
        +string retentionPolicy = "5 Years"
    }

    UML_Metaclass_Class <|-- LGU_Entity : <<extends>>
    UML_Metaclass_Class <|-- Civic_Document : <<extends>>
    UML_Metaclass_Class <|-- Blotter_Case : <<extends>>
    UML_Metaclass_Property <|-- Audit_Trail : <<extends>>
```

#### Detailed Architectural Explanation
* **Standardization:** Establishes stereotypes (`<<LGU_Entity>>`, `<<Civic_Document>>`, `<<Blotter_Case>>`) to ensure domain-specific statutory compliance throughout system engineering.

#### External Tool Generation Prompt
> *"Create a UML Profile Diagram extending standard UML metaclasses for a Philippine Barangay Information System. Show stereotypes: <<LGU_Entity>> extending Class with tagged values for lguCode and republicAct; <<Civic_Document>> extending Class with statutoryFee and validityPeriod; <<Blotter_Case>> extending Class with mediation properties; and <<Audit_Trail>> extending Property with retention policies."*

---

# Part 2: Behavioral Diagrams (The System in Motion)

```
9 Behavioral Diagrams:
9. Data Flow Diagram (DFD Level 0 & Level 1)
10. Use Case Diagram
11. Activity Diagram
12. Sequence Diagram
13. State Machine Diagram
14. Communication Diagram
15. Interaction Overview Diagram
16. Timing Diagram
17. Requirement Diagram (SysML)
```

---

### Diagram 9: Data Flow Diagram (DFD Level 0 & Level 1)

#### Purpose in iBarangay
Maps how citizen data, payments, and complaint records enter the system boundary, transform across processes, and commit to persistent datastores.

```mermaid
flowchart TD
    subgraph ExternalEntities["External Actors"]
        Resident["Resident Citizen"]
        Secretary["Barangay Secretary"]
        Treasurer["Barangay Treasurer"]
        Captain["Punong Barangay (Captain)"]
    end

    subgraph DFDLevel1["iBarangay Processing Nodes (Level 1 DFD)"]
        P1["1.0 Register & Verify Resident Profile"]
        P2["2.0 Ingest & Review Document Application"]
        P3["3.0 Verify Payment & Reconcile Revenue"]
        P4["4.0 Issue Document & Affix Digital Seal"]
        P5["5.0 Log Blotter Complaint & Schedule Mediation"]
        P6["6.0 Aggregate Executive Analytics"]
    end

    subgraph DataStores["Persistent Cloud Datastores"]
        DS_Residents[("D1: /residents & /households")]
        DS_Requests[("D2: /documentRequests")]
        DS_Payments[("D3: /payments & /revenueLedger")]
        DS_Incidents[("D4: /incidents & /blotterCases")]
        DS_Config[("D5: /barangays (Settings & Hotlines)")]
    end

    Resident -->|Demographic Info & Valid ID| P1
    P1 -->|Store Profile Record| DS_Residents

    Resident -->|Clearance / Permit Application| P2
    P2 -->|Save Pending Request| DS_Requests
    Secretary -->|Approve Application Request| P2

    Resident -->|GCash Payment Screenshot & Ref #| P3
    Treasurer -->|Verify GCash Transaction| P3
    P3 -->|Update Request Status to 'Payment Verified'| DS_Requests
    P3 -->|Record Payment Ledger Entry| DS_Payments

    P2 -->|Forward Approved Clearance| P4
    Captain -->|Executive Digital Sign-off| P4
    P4 -->|Update Status to 'Ready for Pickup / Released'| DS_Requests
    P4 -->|Official Stamped PDF Clearance| Resident

    Resident -->|Submit Incident / Dispute Narrative| P5
    Secretary -->|Docket Case & Set Summons Date| P5
    P5 -->|Store Incident Case Record| DS_Incidents

    DS_Residents --> P6
    DS_Requests --> P6
    DS_Payments --> P6
    DS_Incidents --> P6
    P6 -->|Realtime KPI Dashboard & Charts| Captain
```

#### Detailed Architectural Explanation
* **Level 1 Functional Decomposition:** Data flows through six distinct processes, updating isolated Firestore datastores (`D1`–`D5`) while notifying respective municipal officers.

#### External Tool Generation Prompt
> *"Create a Data Flow Diagram (DFD Level 1) for the iBarangay local government portal. Show external entities (Resident Citizen, Barangay Secretary, Barangay Treasurer, Punong Barangay). Show 6 core processes: 1.0 Register Profile, 2.0 Ingest Document Request, 3.0 Verify Payment, 4.0 Issue Clearance, 5.0 Log Blotter Incident, 6.0 Aggregate Analytics. Connect with labeled data flow lines to datastores D1: Residents, D2: Document Requests, D3: Payments, D4: Incidents, D5: Barangay Config."*

---

### Diagram 10: Use Case Diagram

#### Purpose in iBarangay
Defines the functional boundary of the system, mapping actors to their system interactions and modeling relationships (`<<include>>` and `<<extend>>`).

```mermaid
flowchart LR
    subgraph Actors["System Actors"]
        ResidentActor["Resident Citizen\n<<Actor>>"]
        SecActor["Barangay Secretary\n<<Actor>>"]
        TreasActor["Barangay Treasurer\n<<Actor>>"]
        CapActor["Punong Barangay\n<<Actor>>"]
        AdminActor["Barangay Admin\n<<Actor>>"]
    end

    subgraph SystemBoundary["iBarangay System Boundary"]
        UC_Auth(["Authenticate & Login"])
        UC_RegProfile(["Submit Resident Profile"])
        UC_ReqDoc(["Apply for Barangay Document"])
        UC_PayGCash(["Submit GCash Payment Proof"])
        UC_VerifyPay(["Verify Payment Transaction"])
        UC_ApproveDoc(["Approve Document Issuance"])
        UC_FileBlotter(["File Blotter Complaint"])
        UC_Mediate(["Docket & Schedule Mediation"])
        UC_PostEvent(["Create & Broadcast Event"])
        UC_Analytics(["Review Executive Analytics"])
        UC_ResetPass(["Admin Password Reset"])
        UC_ManageStaff(["Provision Staff & Users"])
        UC_ExportReports(["Export PDF/Excel Reports"])
        UC_Hotlines(["View Emergency Responders"])
    end

    ResidentActor --> UC_Auth
    ResidentActor --> UC_RegProfile
    ResidentActor --> UC_ReqDoc
    ResidentActor --> UC_PayGCash
    ResidentActor --> UC_FileBlotter
    ResidentActor --> UC_Hotlines

    SecActor --> UC_Auth
    SecActor --> UC_RegProfile
    SecActor --> UC_ApproveDoc
    SecActor --> UC_Mediate
    SecActor --> UC_PostEvent
    SecActor --> UC_ExportReports

    TreasActor --> UC_Auth
    TreasActor --> UC_VerifyPay
    TreasActor --> UC_ExportReports

    CapActor --> UC_Auth
    CapActor --> UC_ApproveDoc
    CapActor --> UC_Analytics

    AdminActor --> UC_Auth
    AdminActor --> UC_ManageStaff
    AdminActor --> UC_ResetPass
    AdminActor --> UC_Analytics

    UC_ReqDoc -.->|<<include>>| UC_Auth
    UC_ReqDoc -.->|<<extend>>| UC_PayGCash
    UC_ApproveDoc -.->|<<include>>| UC_VerifyPay
    UC_ResetPass -.->|<<include>>| UC_Auth
```

#### Detailed Architectural Explanation
* **Actor Scoping:** Clear role-based boundaries ensure only Treasurers verify payments, Captains execute approvals, and Admins handle credential resets.

#### External Tool Generation Prompt
> *"Generate a complete UML Use Case Diagram for the iBarangay platform. Show actors: Resident, Barangay Secretary, Barangay Treasurer, Barangay Captain, and Barangay Admin. Within the system boundary, show use cases for authentication, resident registration, clearance requests, GCash payments, blotter mediation, event posting, report generation, and password resets. Connect use cases with <<include>> and <<extend>> dependency relationships."*

---

### Diagram 11: Activity Diagram

#### Purpose in iBarangay
Maps the multi-lane algorithmic business logic and decision branches for processing online document requests from application to issuance.

```mermaid
flowchart TD
    StartNode((Start)) --> FillRequest[Resident submits Document Request form]
    FillRequest --> CheckDocumentType{Is Document Free?\nIndigency vs Paid}

    CheckDocumentType -->|Free Indigency| SecReview[Secretary reviews Indigency status]
    CheckDocumentType -->|Paid Clearance / Permit| CalcAmount[System calculates tariff fee from Barangay Config]

    CalcAmount --> UploadProof[Resident uploads GCash receipt & reference number]
    UploadProof --> TreasReview[Treasurer inspects GCash transaction proof]

    TreasReview --> PaymentValid{Payment Verified?}
    PaymentValid -->|Invalid / Missing| RejectPayment[Treasurer marks 'Payment Rejected' with remarks]
    RejectPayment --> NotifyResidentPay[System notifies Resident to re-upload proof]
    NotifyResidentPay --> UploadProof

    PaymentValid -->|Valid| SetPaymentVerified[Treasurer updates status to 'Payment Verified']
    SetPaymentVerified --> SecReview

    SecReview --> DocEligible{Resident record verified & eligible?}
    DocEligible -->|Disqualified / Pending Cases| SecReject[Secretary marks request as 'Rejected']
    SecReject --> EndNode((End: Disapproved))

    DocEligible -->|Eligible| CapSign[Captain reviews & provides final digital signature]
    CapSign --> ReadyStatus[System sets status to 'Ready for Pickup / Released']
    ReadyStatus --> GenerateDoc[System renders Stamped PDF with Barangay Seal]
    GenerateDoc --> SendAlert[System emits Real-time Sound & Visual Notification to Resident]
    SendAlert --> EndSuccess((End: Completed))
```

#### Detailed Architectural Explanation
* **Decision Gates:** Clearly delineates between free documents (Indigency) and fee-bearing certificates, incorporating recovery loops for invalid payment submissions.

#### External Tool Generation Prompt
> *"Draw a comprehensive UML Activity Diagram for a Barangay Document Request and Clearance Issuance workflow. Start with resident submission, evaluate decision diamond for free vs paid document, show GCash payment verification swimlane, error correction loop for rejected payments, Secretary verification diamond, Captain approval, PDF document generation, and final notification dispatch to end state."*

---

### Diagram 12: Sequence Diagram

#### Purpose in iBarangay
Illustrates the chronological messaging, method calls, and database transactions between frontend components, context managers, and Firebase backend services.

```mermaid
sequenceDiagram
    autonumber
    actor Resident as Resident Citizen
    participant ClientUI as Next.js React UI
    participant AppContext as AppContext Store
    participant Firestore as Cloud Firestore DB
    participant AudioAPI as Web Audio Chime API
    actor Secretary as Barangay Secretary
    actor Treasurer as Barangay Treasurer

    Resident->>ClientUI: Submit Clearance Request (Type, Purok, Purpose)
    ClientUI->>AppContext: addDocumentRequest(payload)
    AppContext->>Firestore: collection('documentRequests').add(status: 'Pending')
    Firestore-->>AppContext: Document ID created (REQ-9921)
    
    par Realtime Alert to Staff
        Firestore-->>Secretary: onSnapshot event triggered
        Secretary->>AudioAPI: playNotificationSound()
        Secretary->>Secretary: Review document application
    end

    Resident->>ClientUI: Upload GCash Screenshot & Enter Reference #
    ClientUI->>AppContext: updateDocumentRequestStatus(REQ-9921, 'Payment Submitted', proof)
    AppContext->>Firestore: updateDoc(status: 'Payment Submitted')

    Firestore-->>Treasurer: Realtime notification: Pending Payment
    Treasurer->>Treasurer: Verify reference with GCash merchant portal
    Treasurer->>ClientUI: Click 'Verify Payment'
    ClientUI->>AppContext: updateDocumentRequestStatus(REQ-9921, 'Payment Verified')
    AppContext->>Firestore: updateDoc(status: 'Payment Verified')

    Secretary->>ClientUI: Click 'Mark Ready for Pickup'
    ClientUI->>AppContext: updateDocumentRequestStatus(REQ-9921, 'Ready for Pickup')
    AppContext->>Firestore: updateDoc(status: 'Ready for Pickup')

    par Realtime Alert to Resident
        Firestore-->>Resident: onSnapshot update received
        Resident->>AudioAPI: playNotificationSound()
        Resident->>ClientUI: View pickup instructions & download receipt
    end
```

#### Detailed Architectural Explanation
* **Parallel Notification Dispatch:** Leverages Firestore's reactive snapshot listeners to simultaneously update workstation states and emit audio chime alerts without client polling.

#### External Tool Generation Prompt
> *"Create a UML Sequence Diagram for the clearance request and verification cycle in iBarangay. Participants: Resident Citizen, Next.js React UI, AppContext Store, Cloud Firestore DB, Web Audio Chime API, Barangay Secretary, and Barangay Treasurer. Include chronological numbered messages, synchronous calls, and parallel (par) execution blocks for real-time WebSocket notifications."*

---

### Diagram 13: State Machine Diagram

#### Purpose in iBarangay
Documents the complete state lifecycle of a `DocumentRequest` entity, identifying state transitions, trigger events, and guard conditions.

```mermaid
stateDiagram-v2
    [*] --> Pending : Resident submits application form

    Pending --> Approved : Secretary validates demographic profile
    Pending --> Rejected : Record incomplete or invalid

    Approved --> Payment_Submitted : Resident uploads GCash screenshot
    Approved --> Ready_for_Pickup : Document is Free (Certificate of Indigency)

    Payment_Submitted --> Payment_Verified : Treasurer verifies transaction ref#
    Payment_Submitted --> Payment_Rejected : GCash receipt invalid or unreadable

    Payment_Rejected --> Payment_Submitted : Resident resubmits valid receipt
    Payment_Rejected --> Cancelled : 7 days timeout without valid payment

    Payment_Verified --> Ready_for_Pickup : Document signed and stamped with seal
    Ready_for_Pickup --> Released : Resident claims hardcopy at Barangay Hall

    Released --> [*]
    Rejected --> [*]
    Cancelled --> [*]
```

#### Detailed Architectural Explanation
* **Formal State Machine:** Guarantees audit compliance by preventing a document from reaching `Released` without passing through either `Payment_Verified` or the authorized fee-exempt path.

#### External Tool Generation Prompt
> *"Draw a UML State Machine Diagram (Statechart) detailing the lifecycle of a civic document in an e-governance platform. States: Initial [*], Pending, Approved, Payment_Submitted, Payment_Rejected, Payment_Verified, Ready_for_Pickup, Released, Rejected, Cancelled, and Final [*]. Annotate transitions with event triggers and guard conditions."*

---

### Diagram 14: Communication Diagram

#### Purpose in iBarangay
Emphasizes the object collaboration network and call frequency hierarchy over structural links rather than purely chronological sequence.

```mermaid
flowchart TD
    ResidentClient["1: ResidentClient\n<<boundary>>"]
    AppContext["2: AppContextStore\n<<controller>>"]
    FirebaseAuth["3: FirebaseAuthService\n<<service>>"]
    FirestoreDB["4: CloudFirestore\n<<database>>"]
    TreasurerConsole["5: TreasurerConsole\n<<boundary>>"]
    AudioEngine["6: AudioNotificationEngine\n<<service>>"]

    ResidentClient <-->|1.0 Submit Request()\n4.0 Upload Payment()| AppContext
    AppContext <-->|2.0 Verify Session Token()| FirebaseAuth
    AppContext <-->|3.0 writeDocumentRequest()\n5.0 subscribeSnapshot()| FirestoreDB
    FirestoreDB <-->|6.0 emitRealtimeUpdate()| AppContext
    TreasurerConsole <-->|7.0 verifyPaymentReference()\n8.0 updateStatus()| AppContext
    AppContext -->|9.0 triggerAudioAlert()| AudioEngine
```

#### Detailed Architectural Explanation
* **Object Collaboration:** Demonstrates that `AppContextStore` serves as the primary mediator, isolating boundary clients from direct database mutation.

#### External Tool Generation Prompt
> *"Create a UML Communication Diagram (Collaboration Diagram) for iBarangay showing object collaboration. Nodes: ResidentClient, AppContextStore, FirebaseAuthService, CloudFirestore, TreasurerConsole, and AudioNotificationEngine. Show numbered message links demonstrating transaction flow."*

---

### Diagram 15: Interaction Overview Diagram

#### Purpose in iBarangay
Combines high-level activity flow gates with referenced sequence frames to map major system workflows.

```mermaid
flowchart TD
    StartNode((Start Interaction)) --> AuthDecision{"User Role Authenticated?"}

    AuthDecision -->|Unauthenticated| SD_Login["ref: User Authentication & Role Validation Sequence"]
    SD_Login --> AuthDecision

    AuthDecision -->|Role: Resident| ResidentPortal["ref: Resident Services Sub-Interaction\n(Profile, Clearance Request, Incident Filing)"]
    AuthDecision -->|Role: Staff / Admin| StaffPortal["ref: Staff Administrative Sub-Interaction\n(Profiling, Verification, Account Provisioning)"]

    ResidentPortal --> DocDecision{"Action Involves Document Request?"}
    DocDecision -->|Yes| SD_Clearance["ref: Clearance Request & GCash Payment Sequence"]
    DocDecision -->|No| SD_Blotter["ref: Incident Filing & Summons Sequence"]

    StaffPortal --> ActionDecision{"Select Administrative Duty"}
    ActionDecision -->|Payment Verification| SD_Clearance
    ActionDecision -->|Event Broadcast| SD_Events["ref: Event Posting & Realtime Notification Broadcast"]
    ActionDecision -->|User Management| SD_UserMgmt["ref: Admin Account Provisioning & Password Reset"]

    SD_Clearance --> AuditSync["ref: System Audit Logging & Analytics Update"]
    SD_Blotter --> AuditSync
    SD_Events --> AuditSync
    SD_UserMgmt --> AuditSync

    AuditSync --> EndNode((End Interaction))
```

#### Detailed Architectural Explanation
* **Workflow Orchestration:** Connects disparate functional sequences (auth, clearance, blotter, events) into a cohesive control flow.

#### External Tool Generation Prompt
> *"Draw a UML Interaction Overview Diagram for the iBarangay platform. Use activity diagram decision nodes combined with UML reference frames (ref blocks) for Authentication Sequence, Clearance Request Sequence, Blotter Mediation Sequence, Event Broadcasting Sequence, and Audit Logging Sequence."*

---

### Diagram 16: Timing Diagram

#### Purpose in iBarangay
Examines state changes across system entities over an explicit timeline ($t_0$ to $t_5$), proving real-time responsiveness and SLA compliance.

```mermaid
flowchart LR
    subgraph TimeAxis["Timeline Progression (Hours / SLA Targets)"]
        T0["t0\n(0 min)\nSubmit"]
        T1["t1\n(1-2 min)\nBroadcast"]
        T2["t2\n(15 min)\nPayment"]
        T3["t3\n(2 hrs)\nApproval"]
        T4["t4\n(24 hrs)\nPickup"]
    end

    subgraph ResidentTimeline["Resident State"]
        R_Idle["State: Idle"] --> R_Submitting["State: Applying"]
        R_Submitting --> R_AwaitingPay["State: Awaiting Pay Verification"]
        R_AwaitingPay --> R_Ready["State: Ready for Pickup"]
    end

    subgraph SystemTimeline["System Reactive Layer"]
        S_Passive["State: Listening"] --> S_AudioChime["State: Audio Chime Trigger (<200ms)"]
        S_AudioChime --> S_DBWrite["State: Firestore Synchronized (<500ms)"]
        S_DBWrite --> S_Passive
    end

    subgraph StaffTimeline["Officer Duty State"]
        O_Idle["State: Waiting Queue"] --> O_SecReview["State: Reviewing Application"]
        O_SecReview --> O_TreasVerify["State: Verifying GCash Ref (<30 min)"]
        O_TreasVerify --> O_CapSign["State: Final Sign-off (<24 hr SLA)"]
    end

    T0 -.-> R_Submitting
    T1 -.-> S_AudioChime
    T2 -.-> O_TreasVerify
    T3 -.-> O_CapSign
    T4 -.-> R_Ready
```

#### Detailed Architectural Explanation
* **Strict Performance Timing:** Real-time WebSockets propagate state in $<200\text{ ms}$, ensuring official SLAs (payment verification in $<30\text{ min}$, release in $<24\text{ hours}$) are tracked accurately.

#### External Tool Generation Prompt
> *"Create a UML Timing Diagram illustrating state waveforms across five milestone intervals: t0 (submission), t1 (notification broadcast), t2 (payment verification), t3 (executive signing), and t4 (issuance). Show state transitions for Resident Actor, System Reactive Layer, and Municipal Staff."*

---

### Diagram 17: Requirement Diagram (SysML)

#### Purpose in iBarangay
Formally maps functional and non-functional requirements to their implementing software components and validation methods.

```mermaid
flowchart TD
    subgraph Requirements["System Requirements Hierarchy (SysML)"]
        REQ01["<<requirement>>\nREQ-01: Multi-Tenant Barangay Isolation\nId: 'SYS-REQ-001'\nText: Data must be isolated by barangayId across all queries."]
        REQ02["<<requirement>>\nREQ-02: Real-time Audio-Visual Alerts\nId: 'SYS-REQ-002'\nText: Notifications must trigger visual indicators and audio chimes without polling."]
        REQ03["<<requirement>>\nREQ-03: Unified Resident Census Visibility\nId: 'SYS-REQ-003'\nText: Account management must display all 52 registered residents regardless of portal account status."]
        REQ04["<<requirement>>\nREQ-04: Non-Custodial Password Reset\nId: 'SYS-REQ-004'\nText: Admin must reset resident credentials via email dispatch or temporary hash without exposing raw passwords."]
        REQ05["<<requirement>>\nREQ-05: Emergency Hotlines Directory\nId: 'SYS-REQ-005'\nText: Residents must access verified local responders (Duty Desk, MDRRMO, Police) with 1-click contact."]
        REQ06["<<requirement>>\nREQ-06: Mobile Responsive Navigation\nId: 'SYS-REQ-006'\nText: System must render a fixed bottom navigation dock and touch carousel on viewport <768px."]
    end

    subgraph Implementations["Implementing Architecture Components"]
        COMP01["<<block>>\nfirestore.rules & AppContext\n(Tenant Scoping)"]
        COMP02["<<block>>\nNotificationSound & DocumentStatusAlert\n(Web Audio & Realtime Listener)"]
        COMP03["<<block>>\nUserManagementClientPage & ActivateResidentDialog\n(Unified Resident List)"]
        COMP04["<<block>>\nResetPasswordDialog & /api/admin/reset-password\n(Secure Admin Auth Route)"]
        COMP05["<<block>>\nEmergencyRespondersDialog & BarangayInfoSettings\n(LGU Hotline Directory)"]
        COMP06["<<block>>\nMobileBottomNav & ResidentInfoCarousel\n(Responsive Layout Engine)"]
    end

    COMP01 -.->|<<satisfy>>| REQ01
    COMP02 -.->|<<satisfy>>| REQ02
    COMP03 -.->|<<satisfy>>| REQ03
    COMP04 -.->|<<satisfy>>| REQ04
    COMP05 -.->|<<satisfy>>| REQ05
    COMP06 -.->|<<satisfy>>| REQ06
```

#### Detailed Architectural Explanation
* **Traceability Matrix:** Proves that all project proposal requirements map directly to active components in the codebase.

#### External Tool Generation Prompt
> *"Generate a SysML Requirement Diagram for the iBarangay digital governance project. Show 6 requirements: REQ-01 Multi-Tenant Isolation, REQ-02 Realtime Alerts, REQ-03 Unified Resident Census, REQ-04 Non-Custodial Password Reset, REQ-05 Emergency Hotlines, REQ-06 Mobile Responsiveness. Connect each requirement to its implementing architectural component using <<satisfy>> dependency arrows."*

---

## Verification & Summary Matrix

| # | Diagram Name | UML/SysML Category | Representation in iBarangay | Key Entities Modeled |
|---|---|---|---|---|
| **1** | **System Architecture** | Structural | Multi-Tier Cloud Topology | Clients, Next.js Router, Server APIs, Firebase Backend |
| **2** | **Class Diagram** | Structural | Data Model & Class Definitions | `Barangay`, `User`, `Resident`, `DocumentRequest`, `IncidentReport` |
| **3** | **Component Diagram** | Structural | Software Module Dependencies | UI Viewports, `AppContext`, Export Engines, Admin SDK |
| **4** | **Deployment Diagram** | Structural | Physical Hardware & Cloud Hosting | Desktop PC, Smartphone PWA, Node.js Container, GCP Region |
| **5** | **Object Diagram** | Structural | Concrete State Snapshot | `brgy_minadeoro`, `admin_user`, `resident_ryan`, `resident_miguel` |
| **6** | **Package Diagram** | Structural | Codebase Folder Architecture | `app/`, `components/`, `contexts/`, `firebase/`, `lib/`, `hooks/` |
| **7** | **Composite Structure** | Structural | Internal Component Mechanics | `DocumentProcessingEngine`, Pricing, Security, Seal Stamper |
| **8** | **Profile Diagram** | Structural | RA 7160 Domain Specialization | `<<LGU_Entity>>`, `<<Civic_Document>>`, `<<Blotter_Case>>` |
| **9** | **Data Flow (DFD L1)** | Behavioral | Data Ingest & Storage Pipelines | Resident inputs, Processing nodes 1.0–6.0, Datastores D1–D5 |
| **10** | **Use Case Diagram** | Behavioral | Actor Functional Boundaries | Resident, Secretary, Treasurer, Captain, Admin Use Cases |
| **11** | **Activity Diagram** | Behavioral | Operational Flowchart & Logic Gates | Clearance request, GCash verification loop, Captain signoff |
| **12** | **Sequence Diagram** | Behavioral | Chronological API Transactions | Clearance submission, WebSocket snapshot, Audio chime alert |
| **13** | **State Machine** | Behavioral | Entity Lifecycle State Transitions | `Pending` $\to$ `Approved` $\to$ `Payment_Verified` $\to$ `Released` |
| **14** | **Communication** | Behavioral | Object Link & Call Hierarchy | `ResidentClient` $\leftrightarrow$ `AppContext` $\leftrightarrow$ `Firestore` |
| **15** | **Interaction Overview**| Behavioral | Workflow Orchestration Frames | Auth frame, Clearance sequence, Blotter sequence, Audit sync |
| **16** | **Timing Diagram** | Behavioral | Real-time SLA Waveforms | Submissions at $t_0$, Audio $<200\text{ ms}$, Verification $<30\text{ min}$ |
| **17** | **Requirement (SysML)** | Behavioral/SysML| System Requirement Traceability | REQ-01 through REQ-06 satisfied by concrete codebase blocks |

