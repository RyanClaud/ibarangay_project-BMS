# 🏛️ iBarangay: Digital Barangay Management System

<div align="center">
  <img src="public/icon.png" alt="iBarangay Logo" width="200" height="200">
  
  <h3>Modern Digital Governance for Oriental Mindoro</h3>
  <p>Powered by DICT MIMAROPA Region IV-B</p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

<p align="center">
  A comprehensive, modern web-based Barangay Information and Service Automation System designed to streamline community management, document processing, and data analysis for local government units across Oriental Mindoro.
</p>

---

> **🔒 SECURITY NOTICE:** This repository does not include sensitive configuration files. See [SECURITY_SETUP.md](SECURITY_SETUP.md) for required setup steps and configuration files you need to create locally.

---

## ✨ Key Features

### 🎯 Core Functionality

-   **🏢 Multi-Barangay Support** - Manage multiple barangays from a single installation with secure data isolation and super admin controls
-   **👤 Resident Management** - Complete CRUD system for resident profiles with demographic information and avatar support
-   **📄 Document Request System** - Online portal for requesting barangay certificates with auto-filled forms
-   **✅ Workflow Management** - Role-based document processing from request to release with real-time status tracking
-   **💰 Configurable Pricing** - Each barangay can set their own document fees independently
-   **💳 Payment Processing** - Digital payment tracking with proof upload and treasurer verification
-   **📱 Fully Responsive** - Beautiful, modern UI that works seamlessly on all devices

### 🚀 Advanced Features

-   **🤖 AI-Powered Analytics** - Google Gemini AI integration for data insights and trend analysis
-   **📊 Custom Reports** - Generate PDF/Excel reports using natural language descriptions
-   **📄 PDF Generation** - Automatic creation of official certificates with barangay seals
-   **🔐 Secure Authentication** - Email/password authentication with password reset
-   **🎨 Modern UI/UX** - Gradient designs, smooth animations, and intuitive navigation
-   **🌙 Dark Mode** - Full dark mode support throughout the application
-   **📧 Email Notifications** - Automated status updates for document requests
-   **🔍 Advanced Search** - Filter and search across residents and documents

## 🎭 Role-Based Access Control (RBAC)

The system is built with a sophisticated role-based access model to ensure that users only have access to the information and functionalities relevant to their position.

| Role                | Description & Key Functionalities                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Admin**     | **Multi-Barangay Manager** with access to all barangays. Can create and manage multiple barangays, assign users, and view cross-barangay analytics.                                          |
| **Admin**           | **Barangay Super User** with full access to their assigned barangay. Manages all aspects of the application, including user accounts, system settings, and all resident/document data.        |
| **Barangay Captain**  | **High-Level Oversight.** Views comprehensive dashboards, resident masterlists, document request statuses, and generated reports for strategic decision-making.                               |
| **Secretary**       | **Records & Document Management.** Manages resident profiles (add/edit/delete) and processes document requests (approve/reject/release).                                                      |
| **Treasurer**       | **Financial Management.** Manages and verifies payments for document requests, views financial reports, and tracks revenue.                                                                   |
| **Resident**        | **Self-Service Portal.** Can view their own dashboard, request new documents, track the status of their requests in real-time, and manage their personal profile information.                  |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Google AI API key (for AI features)

### Installation

> **⚠️ IMPORTANT:** Before starting, read [SECURITY_SETUP.md](SECURITY_SETUP.md) for required configuration files.

1. **Clone the repository**
   ```bash
   git clone https://github.com/RyanClaud/ibarangay_project-BMS.git
   cd ibarangay_project-BMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Enable Storage
   - **Follow [SECURITY_SETUP.md](SECURITY_SETUP.md) to create required configuration files:**
     - `src/firebase/config.ts` (copy from `config.example.ts`)
     - `.firebaserc`
     - `firebase.json`
     - `firestore.rules`
     - `storage.rules`

4. **Set up environment variables**
   ```bash
   # Create .env.local file (see SECURITY_SETUP.md for details)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="your-private-key"
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Deploy Firebase rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002)

7. **Initial Setup**
   - Visit `/initial-setup` to create your super admin account
   - Login and start adding barangays

### Quick Setup Guide

**For Super Admins (DICT MIMAROPA):**
1. Complete initial setup at `/initial-setup`
2. Add barangays via Barangays page
3. Create barangay admin accounts
4. Configure document pricing per barangay

**For Barangay Admins:**
1. Login with provided credentials
2. Change default password
3. Update barangay information and upload seal
4. Configure document pricing
5. Add staff accounts (Captain, Secretary, Treasurer)
6. Start adding residents

**For Residents:**
1. Register at `/register` or get credentials from secretary
2. Login and complete profile
3. Request documents from dashboard
4. Track status and upload payment proof
5. Pickup documents when ready

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Library:** [React 18](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Forms:** React Hook Form + Zod validation

### Backend & Services
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth)
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Storage:** [Firebase Storage](https://firebase.google.com/docs/storage)
- **AI:** [Google Gemini](https://ai.google.dev/) via Genkit

### Additional Libraries
- **PDF Generation:** jsPDF + html2canvas
- **Charts:** Recharts
- **Date Handling:** date-fns
- **State Management:** React Context API

## 📁 Project Structure

```
ibarangay_project-BMS/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── residents/          # Resident management
│   │   ├── documents/          # Document processing
│   │   └── settings/           # Settings components
│   ├── contexts/               # React contexts
│   │   └── app-context.tsx     # Main app state
│   ├── firebase/               # Firebase configuration
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and types
│   └── scripts/                # Setup scripts
├── public/                     # Static assets
└── firestore.rules            # Firestore security rules
```

## 🎨 Recent Updates

### November 2024 - Major UI/UX Overhaul

**Landing Page**
- ✨ New modern landing page with hero section
- 🎯 Feature showcase with animated cards
- 📱 Fully responsive design
- 🎨 Gradient backgrounds and smooth animations

**Authentication Pages**
- 🔐 Enhanced login page with frosted glass design
- 📝 Improved registration flow with municipality selection
- 🔗 Clickable logos redirecting to landing page

**Dashboard Improvements**
- 💜 Secretary dashboard with enhanced stats and quick actions
- 📊 Better data visualization with colored cards
- 🎭 Improved role-based dashboards for all user types

**Document Management**
- 💰 Configurable pricing per barangay
- 💳 Enhanced payment tracking and verification
- 📄 Improved document request form with live pricing
- 🎨 Better table designs with hover effects

**Profile Management**
- 👤 Redesigned edit profile with avatar display
- 🎨 Organized sections with icons
- 📝 Better form layouts and validation
- 🔒 Enhanced security warnings

**Settings**
- 💰 New pricing configuration tab
- 🎨 Improved tab navigation with emojis
- 🔐 Enhanced change password form
- ⚙️ Better system maintenance section

## 🔒 Security Features

- ✅ Role-based access control (RBAC)
- ✅ Firestore security rules
- ✅ Data isolation per barangay
- ✅ Secure authentication with Firebase
- ✅ Password hashing and encryption
- ✅ Protected API routes
- ✅ Input validation and sanitization

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed for DICT MIMAROPA Region IV-B.

## 👥 Authors

- **Ryan Claud** - *Initial work* - [RyanClaud](https://github.com/RyanClaud)

## 🙏 Acknowledgments

- DICT MIMAROPA Region IV-B
- Oriental Mindoro Provincial Government
- All participating barangays
- Open source community

## 📞 Support

For support and inquiries:
- **Email:** ibarangays@gmail.com
- **Developer:** ryanclaud4@gmail.com
- **GitHub Issues:** [Create an issue](https://github.com/RyanClaud/ibarangay_project-BMS/issues)

---

<div align="center">
  <p>Made with ❤️ by RYAN LANUEVO CLAUD</p>
  <p>© 2024 iBarangay. All rights reserved.</p>
</div>
