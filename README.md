# NEIGHSHOP GLOBAL — TECHNICAL SELECTION ASSIGNMENT
## Modern OLX-Inspired Classified Marketplace Full-Stack Platform

**Candidate Name:** Vansh  
**Project Category:** Classified Marketplace / E-Commerce Platform  
**Purpose:** Candidate Selection and Technical Evaluation  
**Assigned By:** Neighshop Global Technical Evaluation Team  

---

## 1. Project Architecture Overview

The system strictly adheres to the technical specification, delivering **three distinct client applications** communicating with a unified, shared Node.js/Express TypeScript backend and a normalized MySQL database (with automatic zero-config fallback to SQLite for immediate evaluator review):

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                 Shared Backend API                       │
                               │          (Node.js + Express.js + TypeScript)             │
                               │        JWT Auth • RBAC • Multer • RESTful APIs           │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                       ┌────────────────────────────────────┼────────────────────────────────────┐
                       │                                    │                                    │
                       ▼                                    ▼                                    ▼
       ┌───────────────────────────────┐    ┌───────────────────────────────┐    ┌───────────────────────────────┐
       │     User Mobile App           │    │    Seller Mobile App          │    │       Admin Web Panel         │
       │ (React Native + TypeScript +  │    │ (React Native + TypeScript +  │    │     (React.js + TypeScript    │
       │       React Navigation)       │    │       React Navigation)       │    │      Responsive Web App)      │
       │                               │    │                               │    │                               │
       │ • Location & City Picker      │    │ • Seller Studio & Analytics   │    │ • Executive KPI Dashboard     │
       │ • Horizontal Category Pills   │    │ • Structured + SELL Ad Form   │    │ • Listing Moderation Queue    │
       │ • 2-Column OLX Product Feed   │    │ • Multi-Photo Upload Selector │    │ • Full Inventory Management   │
       │ • Multi-Criteria Condition    │    │ • Inventory Status Tracker:   │    │ • User Account Moderation     │
       │ • Detailed Product View &     │    │   (Active, Pending, Rejected, │    │ • Category/Subcategory CRUD   │
       │   Photo Gallery Carousel      │    │    Sold with Admin Feedback)  │    │ • Complaints & Safety Center  │
       │ • Buyer Inquiries & Chat CTA  │    │ • Buyer Inquiries Hub & Call  │    │ • Audit Activity Logs         │
       │ • Wishlist / Saved Ads        │    │ • Seller Storefront Editor    │    │ • Role-Based Protected Routes │
       │ • Report Advertisement        │    │ • Verified Merchant Badge     │    │ • Single-Click Autofill Demo  │
       └───────────────────────────────┘    └───────────────────────────────┘    └───────────────────────────────┘
                                                            │
                                                            ▼
                                           ┌──────────────────────────────────┐
                                           │       MySQL 8.0+ Database        │
                                           │   (Normalized Relational Schema) │
                                           │  Zero-config fallback: SQLite    │
                                           └──────────────────────────────────┘
```

> **Evaluation Flexibility:** To ensure evaluators can immediately explore the entire mobile experience inside any web browser without needing physical mobile devices or Android/iOS simulators, a high-fidelity **interactive mobile simulator** (`mobile-app/`) is also pre-configured on port 5174, allowing instant switching between Buyer and Seller perspectives!

---

## 2. Directory Structure

```text
Project/
├── shared/                               # Shared TypeScript Contracts & Types
│   └── types/
│       ├── user.types.ts                 # User roles, profile, auth DTOs
│       ├── advertisement.types.ts        # Ad status, condition, image DTOs
│       ├── category.types.ts             # Category and subcategory taxonomy
│       ├── enquiry.types.ts              # Buyer inquiry and seller reply DTOs
│       ├── report.types.ts               # Safety complaint types
│       └── index.ts
│
├── backend/                              # Shared RESTful Backend API (Node.js + Express + TS)
│   ├── database/
│   │   ├── db.ts                         # Dual-adapter database layer (MySQL 8.0 + SQLite fallback)
│   │   ├── schema.sql                    # Production MySQL 8.0 DDL schema script
│   │   └── seed.sql                      # Comprehensive seed data script
│   ├── src/
│   │   ├── config/env.ts                 # Validated environment configuration
│   │   ├── controllers/                  # Fully-typed controllers (auth, ad, admin, cat, enquiry, etc.)
│   │   ├── middleware/                   # JWT auth, RBAC (Buyer, Seller, Admin), Multer upload
│   │   ├── routes/                       # Typed Express REST routes
│   │   └── server.ts                     # Express application entrypoint (Port 5000)
│   ├── scripts/
│   │   └── verify-e2e.ts                 # Full multi-role 8-stage automated workflow verification
│   ├── package.json
│   └── tsconfig.json
│
├── user-mobile/                          # User Mobile Application (React Native + TS + React Navigation)
│   ├── src/
│   │   ├── api/apiClient.ts              # Typed User API Client
│   │   ├── navigation/                   # UserTabNavigator (5 Tabs) & UserRootNavigator (Native Stack)
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx            # OLX location bar, category chips, 2-col feed, wishlist
│   │   │   ├── ExploreScreen.tsx         # Search, condition filters (New, Like New, Good)
│   │   │   ├── WishlistScreen.tsx        # Saved ads, quick contact, remove action
│   │   │   ├── ChatsScreen.tsx           # Buyer inquiry threads and seller responses
│   │   │   ├── ProfileScreen.tsx         # Account card, safety guidelines, auth toggle
│   │   │   └── ProductDetailScreen.tsx   # Photo carousel, bold ₹ price, seller card, enquiry modal
│   │   └── types/                        # Mirrored shared TypeScript models
│   ├── App.tsx                           # SafeAreaProvider + NavigationContainer
│   ├── index.js
│   ├── package.json
│   └── tsconfig.json                     # Strict TypeScript verification (0 errors)
│
├── seller-mobile/                        # Seller Mobile Application (React Native + TS + React Navigation)
│   ├── src/
│   │   ├── api/apiClient.ts              # Typed Seller API Client
│   │   ├── navigation/                   # SellerTabNavigator (5 Tabs + Center SELL) & SellerRootNavigator
│   │   ├── screens/
│   │   │   ├── SellerDashboardScreen.tsx # Seller Studio KPIs (Active, Under Review, Rejected, Sales)
│   │   │   ├── MyAdsScreen.tsx           # Inventory manager with status tabs and Rejection Reason Banner
│   │   │   ├── PostAdScreen.tsx          # + SELL ad posting form with category picker and photo preview
│   │   │   ├── InquiriesScreen.tsx       # Buyer inquiry leads, phone dialer CTA, mark replied
│   │   │   └── SellerProfileScreen.tsx   # Storefront profile, owner details, address editor
│   │   └── types/                        # Mirrored shared TypeScript models
│   ├── App.tsx                           # SafeAreaProvider + NavigationContainer
│   ├── index.js
│   ├── package.json
│   └── tsconfig.json                     # Strict TypeScript verification (0 errors)
│
├── admin-web/                            # Dedicated Admin Web Application (React.js + TS)
│   ├── src/
│   │   ├── components/                   # Sidebar, Header, Confirmation Modals
│   │   ├── views/
│   │   │   ├── DashboardView.tsx         # Metric counters, pending queue, category distribution
│   │   │   ├── PendingApprovalsView.tsx  # Ad moderation queue with Approve / Reject modal
│   │   │   ├── AdvertisementsView.tsx    # Inventory table, status filters, featured star toggle
│   │   │   ├── UsersView.tsx             # User & Seller account moderation, status suspension
│   │   │   ├── CategoriesView.tsx        # Category taxonomy with delete safety protection
│   │   │   ├── ReportsView.tsx           # User complaint center and violating ad suspension
│   │   │   ├── LogsView.tsx              # Audit trail of all moderator decisions
│   │   │   └── LoginView.tsx             # Secure admin authentication screen
│   │   ├── api.ts                        # Typed Admin API client with Bearer token injection
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json                     # Strict TypeScript verification (0 errors)
│   └── vite.config.ts                    # Configured on Port 5173
│
└── mobile-app/                           # Interactive Web Phone Simulator (for instant in-browser testing)
    ├── src/                              # High-fidelity OLX experience with dual perspective switch
    ├── vite.config.js                    # Configured on Port 5174
    └── package.json
```

---

## 3. Safe Demonstration Credentials

The database comes pre-seeded with verified test accounts across all three roles:

| Role | Email | Password | Primary Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@neighshop.com` | `Admin@123` | Full Admin Console, Approve/Reject Ads with feedback reasons, User Moderation, Taxonomies, Audit Trail |
| **Seller** | `seller@neighshop.com` | `Seller@123` | Seller Studio, + SELL Ad Posting, Inventory Management, Rejection Reason Feedback, Buyer Leads |
| **Buyer** | `buyer@neighshop.com` | `Buyer@123` | Browse Marketplace, Location Selector, Multi-Filters, Wishlist, Send Inquiries, Report Ads |

---

## 4. Quick-Start Guide (Running Locally)

### Prerequisites
- **Node.js**: v18.0.0 or higher (v26.x supported)
- **npm**: v9.0.0 or higher
- **MySQL**: 8.0+ *(Optional — the backend includes an automatic zero-config fallback to SQLite if MySQL is not running)*

---

### Step 1: Start Shared Backend API
```bash
cd backend
npm install
npm run build     # Compiles TypeScript (0 errors)
npm start         # Starts backend on http://localhost:5000
```
- Health Check: `http://localhost:5000/api/health`
- Automated E2E Test: `npm run test:e2e`

---

### Step 2: Start Admin Web Dashboard
In a second terminal:
```bash
cd admin-web
npm install
npm run build     # Validates TypeScript & builds production bundle (0 errors)
npm run dev       # Starts dev server on http://localhost:5173
```
- Open `http://localhost:5173` in your browser.
- Log in with `admin@neighshop.com` / `Admin@123` (or click the quick autofill button).

---

### Step 3: Run Mobile Applications

#### Option A: Interactive Browser Simulator (Immediate Evaluation)
In a third terminal:
```bash
cd mobile-app
npm install
npm run dev       # Starts interactive simulator on http://localhost:5174
```
- Open `http://localhost:5174` in your browser.
- Use the top navigation bar to toggle between **Buyer App (Priya)** and **Seller App (Vansh)**.

#### Option B: User Mobile Application (React Native + TS)
```bash
cd user-mobile
npm install --legacy-peer-deps
npm run typecheck # Strict TypeScript compilation (0 errors)
npm start         # Starts Metro bundler
```

#### Option C: Seller Mobile Application (React Native + TS)
```bash
cd seller-mobile
npm install --legacy-peer-deps
npm run typecheck # Strict TypeScript compilation (0 errors)
npm start         # Starts Metro bundler
```

---

## 5. Automated Multi-Role E2E Verification

The project includes an automated end-to-end multi-role test suite in `backend/scripts/verify-e2e.ts`. It executes the complete lifecycle across all three roles:

```bash
cd backend
npm run test:e2e
```

**Workflow verified by the test:**
1. **Seller Auth:** Authenticates `seller@neighshop.com` via JWT.
2. **Post Ad:** Publishes "Sony PlayStation 5 Digital Edition with DualSense Controller". Initial status is set to `'pending'`.
3. **Admin Auth:** Authenticates `admin@neighshop.com`.
4. **Moderation Rejection:** Admin reviews pending queue and rejects the ad with reason: *"Please upload a photo showing the serial number and original purchase receipt."*
5. **Seller Feedback:** Seller checks `My Ads` and retrieves the exact administrator rejection reason.
6. **Resubmission & Approval:** Seller updates listing details and Admin approves the ad to `'approved'`.
7. **Buyer Discovery & Wishlist:** Buyer (`buyer@neighshop.com`) discovers the ad in the public feed, saves it to their wishlist, and submits an inquiry: *"Hi Vansh, is this PS5 still available? Can we do physical testing in Bandra tomorrow?"*
8. **Seller Lead Response:** Seller receives the inquiry in their messages hub and responds to the buyer.

---

## 6. Technical Evaluation Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **User Mobile App** | React Native, TypeScript, React Navigation (Tabs: Home, Explore, Wishlist, Chats, Account + ProductDetail Stack). OLX 2-column feed, location selector, category chips. | ✅ Verified (0 TS errors) |
| **Seller Mobile App** | React Native, TypeScript, React Navigation (Tabs: Studio, My Ads, + SELL, Inquiries, Storefront). Rejection reason feedback banner, status filters, buyer leads. | ✅ Verified (0 TS errors) |
| **Admin Web App** | React.js, TypeScript, Vite. Executive KPIs, Pending Approvals queue with Approve/Reject modal, User moderation, Category CRUD, Reports Center, Audit Trail. | ✅ Verified (0 TS errors) |
| **Shared Backend API** | Node.js, Express.js, TypeScript. JWT authentication, Role-Based Access Control (`buyer`, `seller`, `admin`), Multer file uploads, parameterized SQL. | ✅ Verified (0 TS errors) |
| **Database Architecture** | MySQL 8.0+ normalized schema (`schema.sql` and `seed.sql`). Seamless automatic zero-config fallback to SQLite for immediate testing. | ✅ Verified |
| **End-to-End Moderation** | Full feedback loop from ad submission -> admin review -> rejection reason display to seller -> resubmission -> approval -> public discovery. | ✅ Verified (`test:e2e`) |
| **Git & Clean Repository** | Clean multi-project repository structure, thorough documentation, test credentials, and runnable development servers. | ✅ Verified |

---

## 7. Explanatory Video Recording Guide (Section 12.2)

When recording the explanatory video, cover the following 12 key points:

1. **Architecture Walkthrough**: Demonstrate how all three applications talk to the shared Node.js Express TypeScript backend and MySQL database.
2. **Codebase Organization**: Show the directory structure: `backend/`, `user-mobile/`, `seller-mobile/`, `admin-web/`, and `shared/types/`.
3. **User Mobile Application**: Showcase the OLX-inspired UI, location picker, category chips, fresh recommendations grid, and product details with photo gallery.
4. **Seller Mobile Application**: Demonstrate creating an ad with photo upload, viewing the listing in `My Ads` under the `Pending Approval` tab.
5. **Admin Web Panel**: Log into `http://localhost:5173/`, explain the KPI cards, open the `Pending Approvals` queue, and click **Approve** or **Reject with Reason**.
6. **Live Data Consistency**: Return to the mobile app and refresh to show the newly approved ad is now visible in the public marketplace feed.
7. **Rejection Feedback Workflow**: Reject a test ad with an explanatory reason (e.g., "Counterfeit item") and show the rejection banner appear in the seller's `My Ads` tab.
8. **Buyer Inquiries**: Submit an enquiry from the Buyer view and respond to it from the Seller view.
9. **Wishlist & Reporting**: Add an item to favorites and submit a safety report. Show the report appear in the Admin Panel's `Reports` center.
10. **Backend Security & RBAC**: Point out the JWT authentication middleware (`src/middleware/auth.ts`) and role-based guards (`src/middleware/rbac.ts`).
11. **Database Relational Design**: Walk through `schema.sql`, explaining primary keys, foreign keys, indexes, and cascades.
12. **Automated Verification**: Run `npm run test:e2e` in `backend/` to showcase the 8-stage automated verification passing with 0 errors.

---

**Developed with care for NeighShop Global by Candidate Vansh.**
