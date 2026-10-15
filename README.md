# NEIGHSHOP GLOBAL — TECHNICAL SELECTION ASSIGNMENT
## Modern OLX-Inspired Classified Marketplace Full-Stack Platform

**Candidate Name:** Vansh  
**Project Category:** Classified Marketplace / E-Commerce Platform  
**Purpose:** Technical Selection and Evaluation Assignment  
**Assigned By:** Neighshop Global Technical Evaluation Team  

---

## 1. Project Architecture Overview

The system consists of three distinct client applications communicating with a unified, shared Node.js/Express backend and a normalized MySQL database:

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                 Shared Backend API                       │
                               │               (Node.js + Express.js)                     │
                               │        JWT Auth • RBAC • Multer • RESTful APIs           │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                       ┌────────────────────────────────────┼────────────────────────────────────┐
                       │                                    │                                    │
                       ▼                                    ▼                                    ▼
       ┌───────────────────────────────┐    ┌───────────────────────────────┐    ┌───────────────────────────────┐
       │     User Application          │    │    Seller Application         │    │       Admin Web Panel         │
       │    (OLX Mobile Experience)    │    │   (Seller Management Hub)     │    │      (React.js Web App)       │
       │                               │    │                               │    │                               │
       │ • Location & Search Bar       │    │ • Seller Dashboard & Stats    │    │ • Executive KPI Dashboard     │
       │ • Category Pills Carousel     │    │ • Structured Ad Creation Form │    │ • Listing Approvals Queue     │
       │ • Featured & Recent Feeds     │    │ • Multi-Photo Upload & Cover  │    │ • Full Inventory Management   │
       │ • Multi-Criteria Filters      │    │ • Ad Status Tracker:          │    │ • User & Seller Moderation    │
       │ • Product Details & Gallery   │    │   (Active, Pending, Rejected, │    │ • Category/Subcategory CRUD   │
       │ • Buyer Inquiries & Chat      │    │    Sold with Admin Feedback)  │    │ • Complaints & Safety Center  │
       │ • Wishlist / Favourites       │    │ • Buyer Enquiry Inbox & Reply │    │ • Audit Activity Logs         │
       │ • Report Advertisement        │    │ • Seller Profile & Rating     │    │ • Role-Based Protected Routes │
       └───────────────────────────────┘    └───────────────────────────────┘    └───────────────────────────────┘
                                                            │
                                                            ▼
                                           ┌──────────────────────────────────┐
                                           │       MySQL 8.0+ Database        │
                                           │   (Normalized Relational Schema) │
                                           │  Zero-config fallback: SQLite    │
                                           └──────────────────────────────────┘
```

---

## 2. Directory Structure

```text
Project/
├── backend/                              # Shared RESTful Backend API
│   ├── controllers/
│   │   ├── adController.js               # Discovery, filtering, sorting, seller CRUD
│   │   ├── adminController.js            # KPIs, approvals, users, categories, reports, audit logs
│   │   ├── authController.js             # Registration, login, JWT issuance, profile, role switch
│   │   ├── categoryController.js         # Category tree and listing counters
│   │   ├── enquiryController.js          # Buyer inquiries and seller replies
│   │   ├── reportController.js           # User reporting system
│   │   └── wishlistController.js         # Wishlist management
│   ├── database/
│   │   ├── db.js                         # Dual-adapter database layer (MySQL + SQLite fallback)
│   │   ├── schema.sql                    # Production MySQL 8.0 DDL schema script
│   │   └── seed.sql                      # Comprehensive seed data script
│   ├── middleware/
│   │   ├── auth.js                       # JWT authentication and user loader
│   │   ├── rbac.js                       # Role-Based Access Control (Admin, Seller, Buyer)
│   │   └── upload.js                     # Multer image storage and MIME validator
│   ├── routes/                           # Modular Express route declarations
│   ├── uploads/                          # Static directory for uploaded images
│   ├── .env.example                      # Documented environment variables
│   ├── package.json
│   └── server.js                         # Server entrypoint (Port 5000)
│
├── admin-web/                            # Dedicated Admin Web Application (React.js)
│   ├── src/
│   │   ├── components/                   # Sidebar, Header, Modal dialogs
│   │   ├── views/
│   │   │   ├── DashboardView.jsx         # Metric counters, pending queue, category distribution
│   │   │   ├── PendingApprovalsView.jsx  # Ad moderation queue with Approve / Reject modal
│   │   │   ├── AdvertisementsView.jsx    # Inventory table, status filters, featured star toggle
│   │   │   ├── UsersView.jsx             # User and Seller account moderation and status toggle
│   │   │   ├── CategoriesView.jsx        # Category taxonomy with delete safety protection
│   │   │   ├── ReportsView.jsx           # User complaint center and violating ad suspension
│   │   │   ├── LogsView.jsx              # Audit trail of all moderator decisions
│   │   │   └── LoginView.jsx             # Secure admin authentication screen
│   │   ├── api.js                        # Admin API client with Bearer token injection
│   │   ├── index.css                     # Premium design tokens & layout styles
│   │   └── App.jsx
│   ├── vite.config.js                    # Configured on Port 5173
│   └── package.json
│
├── mobile-app/                           # OLX-Inspired User & Seller Mobile Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                # Location picker + search bar + filter trigger
│   │   │   ├── BottomNav.jsx             # 5 tabs with iconic raised circular SELL button
│   │   │   ├── LocationModal.jsx         # Indian cities selector (Mumbai, Delhi, Bengaluru...)
│   │   │   ├── FilterModal.jsx           # Price slider, condition picker, sort selector
│   │   │   └── AuthModal.jsx             # Buyer & Seller sign-in / registration
│   │   ├── screens/
│   │   │   ├── HomeScreen.jsx            # Category chips, hero banner, 2-column feed
│   │   │   ├── ProductDetailScreen.jsx   # Photo gallery, bold price, seller badge, call/chat CTA
│   │   │   ├── SellScreen.jsx            # Seller ad posting studio with photo upload & preview
│   │   │   ├── MyAdsScreen.jsx           # Seller listings by status (Active, Pending, Rejected, Sold)
│   │   │   ├── ChatsScreen.jsx           # Buyer inquiries & seller response center
│   │   │   └── AccountScreen.jsx         # Profile, buyer/seller mode toggle, wishlist
│   │   ├── api.js                        # Mobile API client
│   │   ├── index.css                     # OLX mobile styling and phone frame simulator
│   │   └── App.jsx                       # Device frame simulator & perspective switcher
│   ├── vite.config.js                    # Configured on Port 5174
│   └── package.json
│
└── README.md
```

---

## 3. Safe Demonstration Credentials

The database comes pre-seeded with verified test accounts across all three roles:

| Role | Email | Password | Primary Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@neighshop.com` | `Admin@123` | Full Admin Console, Approve/Reject Ads, User Moderation, Taxonomies |
| **Seller** | `seller@neighshop.com` | `Seller@123` | Post Ads, Upload Photos, Manage Listings, View Rejections, Respond to Inquiries |
| **Buyer** | `buyer@neighshop.com` | `Buyer@123` | Browse Marketplace, Multi-Filters, Wishlist, Send Inquiries, Report Ads |

> **Convenience Feature:** Both the Admin Web Panel and Mobile App include single-click autofill buttons for these credentials so evaluators don't need to type them manually!

---

## 4. Setup and Execution Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v26.x supported)
- **npm**: v9.0.0 or higher
- **MySQL**: 8.0+ *(Optional for local review — the backend includes an automatic zero-config fallback to SQLite if MySQL is not running)*

### Step 1: Shared Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment (pre-configured with safe defaults)
cp .env.example .env

# 3. Start the Backend API
npm start
# -> Backend API is live on http://localhost:5000
# -> Health endpoint: http://localhost:5000/api/health
```

### Step 2: Admin Web Panel Setup
In a new terminal window:
```bash
cd admin-web

# 1. Install dependencies
npm install

# 2. Start the Admin Web Dashboard
npm run dev
# -> Admin Web Portal is live on http://localhost:5173
```

### Step 3: User & Seller Mobile Application Setup
In a new terminal window:
```bash
cd mobile-app

# 1. Install dependencies
npm install

# 2. Start the Mobile Application
npm run dev
# -> OLX-style Mobile App is live on http://localhost:5174
```

---

## 5. MySQL Database Setup (Optional / Production)

If running directly on a MySQL instance:
1. Open MySQL CLI or phpMyAdmin:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema script:
   ```sql
   SOURCE backend/database/schema.sql;
   ```
3. Populate with comprehensive test seed data:
   ```sql
   SOURCE backend/database/seed.sql;
   ```
4. Set `DB_CLIENT=mysql` in `backend/.env` with your host, user, and password.

---

## 6. End-to-End Advertisement Approval Workflow

Per specification Section 6.6, the ad workflow functions as follows:

```
[Seller Mobile App]                   [Shared Backend]                     [Admin Web Panel]
         │                                   │                                     │
         ├────── Create Advertisement ──────>│                                     │
         │       (Photos, Price, Specs)      │                                     │
         │                                   ├──── Status set to 'pending' ───────>│
         │                                   │    (Hidden from public feed)        │
         │                                   │                                     ├─ Review Images & Details
         │                                   │                                     ├─ Decision:
         │                                   │                                     │   ├── Option A: APPROVE
         │                                   │                                     │   └── Option B: REJECT
         │                                   │<─── Approve / Reject (with reason) ─┘
         │<───── Real-time status update ────┤
         │                                   │
         ├── If Approved: Appears in public discovery & search feed
         └── If Rejected: Seller views exact rejection reason banner in "My Ads" tab
```

---

## 7. Key RESTful API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create buyer or seller account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/profile` — Fetch current user profile and stats
- `PUT /api/auth/profile` — Update contact information and store bio
- `POST /api/auth/switch-role` — Toggle active role between buyer and seller

### Public Discovery & Marketplace (`/api/advertisements`)
- `GET /api/advertisements` — Filtered browse (`search`, `categoryId`, `minPrice`, `maxPrice`, `condition`, `city`, `sort`, `page`)
- `GET /api/advertisements/featured` — Homepage promoted listings
- `GET /api/advertisements/:id` — Complete advertisement details, seller card, and similar items
- `POST /api/advertisements` — Seller creates advertisement (saved as `pending`)
- `PUT /api/advertisements/:id` — Seller updates own listing
- `DELETE /api/advertisements/:id` — Seller deletes own listing
- `PATCH /api/advertisements/:id/sold` — Seller marks listing as sold
- `GET /api/advertisements/seller/my-ads` — Seller retrieves listings with status counts

### Inquiries & Communications (`/api/enquiries`)
- `POST /api/enquiries` — Buyer sends enquiry to seller for an item
- `GET /api/enquiries/buyer` — Buyer views sent enquiries and seller replies
- `GET /api/enquiries/seller` — Seller views received buyer questions
- `POST /api/enquiries/:id/reply` — Seller replies to buyer inquiry

### Wishlist (`/api/wishlist`)
- `GET /api/wishlist` — View authenticated user's saved items
- `POST /api/wishlist/:adId` — Toggle add/remove favorite

### Safety & Complaints (`/api/reports`)
- `POST /api/reports` — Buyer reports an advertisement (reasons: `spam`, `counterfeit`, `fraud`, `offensive`)

### Admin Control & Operations (`/api/admin`)
- `GET /api/admin/stats` — Executive dashboard KPI counters and distributions
- `GET /api/admin/advertisements` — Filter all marketplace listings
- `PATCH /api/admin/advertisements/:id/status` — Approve or reject listing (requires reason if rejecting)
- `PATCH /api/admin/advertisements/:id/featured` — Toggle homepage featured status
- `GET /api/admin/users` — Search and manage user accounts
- `PATCH /api/admin/users/:id/status` — Activate or suspend account
- `POST /api/admin/categories` & `POST /api/admin/subcategories` — Manage taxonomy
- `DELETE /api/admin/categories/:id` — Delete category (includes cascade safety protection)
- `GET /api/admin/reports` — Review open safety complaints
- `PATCH /api/admin/reports/:id/status` — Resolve complaint & optionally take down violating listing
- `GET /api/admin/logs` — Immutable audit trail of moderator actions

---

## 8. Explanatory Video Recording Guide (Section 12.2)

When recording the mandatory explanatory video, cover the following 12 key points:

1. **Architecture Walkthrough**: Demonstrate how all three applications talk to the shared Node.js Express backend and MySQL database.
2. **Codebase Organization**: Show the directory structure of `backend/`, `admin-web/`, and `mobile-app/`.
3. **User Mobile Application**: Showcase the OLX-inspired UI, location picker, search, category chips, fresh recommendations grid, and product details with photo gallery.
4. **Seller Mobile Application**: Demonstrate creating an ad with photo upload, viewing the listing in `My Ads` under the `Pending Approval` tab.
5. **Admin Web Panel**: Log into `http://localhost:5173/`, explain the KPI cards, open the `Pending Approvals` queue, and click **Approve**.
6. **Live Data Consistency**: Return to the mobile app and refresh to show the newly approved ad is now visible in the public marketplace feed!
7. **Rejection Feedback Workflow**: Reject a test ad with an explanatory reason (e.g., "Counterfeit item") and show the rejection banner appear in the seller's `My Ads` tab.
8. **Buyer Inquiries**: Submit an enquiry from the Buyer view and respond to it from the Seller view.
9. **Wishlist & Reporting**: Add an item to favorites and submit a safety report. Show the report appear in the Admin Panel's `Reports` center.
10. **Backend Security & RBAC**: Point out the JWT authentication middleware (`middleware/auth.js`) and role-based guards (`middleware/rbac.js`).
11. **Database Relational Design**: Walk through `schema.sql`, explaining primary keys, foreign keys, indexes, and cascades.
12. **Technical Challenges & Decisions**: Explain the dual-adapter database architecture (supporting MySQL and zero-config SQLite), responsive viewport simulation, and defensive category deletion rules.

---

## 9. Candidate Verification & Testing Confirmation

- [x] Shared Node.js + Express backend verified and active on `http://localhost:5000`
- [x] Admin Web Panel verified and active on `http://localhost:5173`
- [x] OLX Mobile User & Seller Application verified and active on `http://localhost:5174`
- [x] Full MySQL schema and comprehensive seed data ready
- [x] Complete ad approval workflow tested end-to-end
- [x] Git repository initialized and committed with clean structure
