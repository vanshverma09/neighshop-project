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

## 2. Milestone 2: MySQL Relational Database Design

The database schema is fully normalized (3NF), adhering to relational design principles with explicit foreign key constraints, composite and single-column indexes, deletion rules, and status lifecycle state machines.

### 2.1 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o| seller_profiles : "extends (1:1)"
    users ||--o{ advertisements : "publishes (1:N)"
    users ||--o{ favourites : "bookmarks (1:N)"
    users ||--o{ enquiries : "submits as buyer (1:N)"
    users ||--o{ enquiries : "receives as seller (1:N)"
    users ||--o{ reports : "submits (1:N)"
    users ||--o{ admin_logs : "records action (1:N)"

    categories ||--o{ subcategories : "contains (1:N)"
    categories ||--o{ advertisements : "classifies (1:N)"
    subcategories ||--o{ advertisements : "sub-classifies (0..1:N)"

    advertisements ||--o{ advertisement_images : "showcases (1:N)"
    advertisements ||--o{ favourites : "saved in (1:N)"
    advertisements ||--o{ enquiries : "enquired on (1:N)"
    advertisements ||--o{ reports : "flagged in (1:N)"
    advertisements ||--o| featured_advertisements : "promoted as (0..1:1)"

    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar phone
        varchar avatar_url
        enum role "buyer | seller | admin"
        enum status "active | suspended | deleted"
        timestamp created_at
        timestamp updated_at
    }

    seller_profiles {
        int id PK
        int user_id FK,UK
        varchar business_name
        text bio
        decimal rating
        int total_sales
        varchar address
        varchar city
        varchar state
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    categories {
        int id PK
        varchar name UK
        varchar slug UK
        varchar icon
        varchar description
        int display_order
        timestamp created_at
    }

    subcategories {
        int id PK
        int category_id FK
        varchar name
        varchar slug
        int display_order
        timestamp created_at
    }

    advertisements {
        int id PK
        int seller_id FK
        int category_id FK
        int subcategory_id FK
        varchar title
        text description
        decimal price
        enum product_condition "new | used_like_new | used_good | used_fair"
        varchar location
        varchar city
        varchar state
        decimal latitude
        decimal longitude
        varchar contact_phone
        varchar contact_email
        enum status "pending | approved | rejected | sold | inactive"
        text rejection_reason
        boolean is_featured
        int views_count
        timestamp created_at
        timestamp updated_at
    }

    advertisement_images {
        int id PK
        int advertisement_id FK
        varchar image_url
        boolean is_primary
        int display_order
        timestamp created_at
    }

    favourites {
        int id PK
        int user_id FK
        int advertisement_id FK
        timestamp created_at
    }

    enquiries {
        int id PK
        int advertisement_id FK
        int buyer_id FK
        int seller_id FK
        text message
        text reply
        enum status "pending | responded | closed"
        timestamp created_at
        timestamp updated_at
    }

    reports {
        int id PK
        int advertisement_id FK
        int reporter_id FK
        enum reason "fraud | spam | offensive | counterfeit | duplicate | wrong_category | other"
        text description
        enum status "pending | under_review | resolved | dismissed"
        text admin_notes
        timestamp created_at
        timestamp updated_at
    }

    featured_advertisements {
        int id PK
        int advertisement_id FK
        int priority
        timestamp start_date
        timestamp end_date
        timestamp created_at
    }

    admin_logs {
        int id PK
        int admin_id FK
        varchar action_type
        varchar target_entity
        int target_id
        text details
        varchar ip_address
        timestamp created_at
    }
```

---

### 2.2 Table-by-Table Relational Schema Reference

#### 1. `users`
- **Purpose:** Core identity, credential storage, role definition, and moderation status.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `name VARCHAR(100) NOT NULL`
  - `email VARCHAR(150) NOT NULL UNIQUE` (Unique constraint prevents duplicate accounts)
  - `password_hash VARCHAR(255) NOT NULL` (Standard bcrypt hashed credentials)
  - `phone VARCHAR(20) NULL`
  - `role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer'`
  - `status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active'`
  - `created_at`, `updated_at TIMESTAMP`
- **Indexes:** `idx_user_email (email)`, `idx_user_role (role)`, `idx_user_status (status)`.

#### 2. `seller_profiles`
- **Purpose:** 1-to-1 extension of `users` storing verified merchant storefront details, physical pickup addresses, and buyer feedback ratings.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `user_id INT NOT NULL UNIQUE` (Strict 1-to-1 relationship with `users`)
  - `business_name VARCHAR(150) NULL`
  - `bio TEXT NULL`
  - `rating DECIMAL(3, 2) DEFAULT 5.00`
  - `total_sales INT DEFAULT 0`
  - `address VARCHAR(255) NULL`, `city VARCHAR(100)`, `state VARCHAR(100)`
  - `is_verified BOOLEAN DEFAULT FALSE`
- **Foreign Key:** `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- **Indexes:** `idx_seller_city (city)`, `idx_seller_verified (is_verified)`.

#### 3. `categories` & `subcategories`
- **Purpose:** Two-tier classification taxonomy for structured browsing and filtering.
- **Key Columns (`categories`):**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `name VARCHAR(100) NOT NULL UNIQUE`, `slug VARCHAR(120) NOT NULL UNIQUE`
  - `icon VARCHAR(100) NOT NULL DEFAULT 'tag'`, `description VARCHAR(255)`
  - `display_order INT DEFAULT 0`
- **Key Columns (`subcategories`):**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `category_id INT NOT NULL`
  - `name VARCHAR(100) NOT NULL`, `slug VARCHAR(120) NOT NULL`
  - `UNIQUE KEY uq_cat_subcat (category_id, slug)` (Slug uniqueness within parent category)
- **Foreign Key:** `FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE`.

#### 4. `advertisements`
- **Purpose:** Central entity storing classified advertisements posted by sellers.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `seller_id INT NOT NULL`
  - `category_id INT NOT NULL`
  - `subcategory_id INT NULL`
  - `title VARCHAR(150) NOT NULL`, `description TEXT NOT NULL`
  - `price DECIMAL(12, 2) NOT NULL` (Indexed for price bracket filters)
  - `product_condition ENUM('new', 'used_like_new', 'used_good', 'used_fair') DEFAULT 'used_good'`
  - `location VARCHAR(150)`, `city VARCHAR(100)`, `state VARCHAR(100)`
  - `status ENUM('pending', 'approved', 'rejected', 'sold', 'inactive') NOT NULL DEFAULT 'pending'`
  - `rejection_reason TEXT NULL` (Stores specific moderator explanation for rejected ads)
  - `is_featured BOOLEAN DEFAULT FALSE`
  - `views_count INT DEFAULT 0`
- **Foreign Keys & Deletion Rules:**
  - `FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE` (Removing user removes ads)
  - `FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT` (**Defensive integrity rule:** Prevents accidental deletion of categories that have active advertisements!)
  - `FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL` (Allows subcategory refactoring without losing ads)
- **Indexes:** `idx_ad_status (status)`, `idx_ad_search_public (status, city, category_id, created_at)`, `idx_ad_price (price)`, `idx_ad_featured (is_featured)`.

#### 5. `advertisement_images`
- **Purpose:** Multi-photo gallery per advertisement.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `advertisement_id INT NOT NULL`
  - `image_url VARCHAR(500) NOT NULL`
  - `is_primary BOOLEAN DEFAULT FALSE` (Identifies hero/cover photo for feeds)
  - `display_order INT DEFAULT 0`
- **Foreign Key:** `FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE`.
- **Indexes:** `idx_image_ad_primary (advertisement_id, is_primary)`.

#### 6. `favourites`
- **Purpose:** Buyer saved listings / wishlist.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `user_id INT NOT NULL`, `advertisement_id INT NOT NULL`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `UNIQUE KEY uq_user_ad_fav (user_id, advertisement_id)` (**Prevents duplicate bookmarking**)
- **Foreign Keys:** Both `user_id` and `advertisement_id` cascade on delete.

#### 7. `enquiries`
- **Purpose:** Direct buyer-to-seller inquiry messages on specific advertisements.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `advertisement_id INT NOT NULL`
  - `buyer_id INT NOT NULL`, `seller_id INT NOT NULL`
  - `message TEXT NOT NULL`, `reply TEXT NULL`
  - `status ENUM('pending', 'responded', 'closed') NOT NULL DEFAULT 'pending'`
- **Foreign Keys:** `advertisement_id`, `buyer_id`, and `seller_id` all reference respective entities with `ON DELETE CASCADE`.
- **Indexes:** `idx_enquiry_ad (advertisement_id)`, `idx_enquiry_seller (seller_id)`, `idx_enquiry_buyer (buyer_id)`.

#### 8. `reports`
- **Purpose:** Community safety violation reports (spam, counterfeit, fraud, harassment).
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `advertisement_id INT NOT NULL`, `reporter_id INT NOT NULL`
  - `reason ENUM('fraud', 'spam', 'offensive', 'counterfeit', 'duplicate', 'wrong_category', 'other') NOT NULL`
  - `description TEXT NULL`
  - `status ENUM('pending', 'under_review', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending'`
  - `admin_notes TEXT NULL`
- **Foreign Keys:** Both reference `advertisements(id)` and `users(id)` with `ON DELETE CASCADE`.

#### 9. `featured_advertisements`
- **Purpose:** Dedicated promotion schedule table for high-visibility homepage banner spots.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `advertisement_id INT NOT NULL`
  - `priority INT DEFAULT 1`
  - `start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, `end_date TIMESTAMP NULL`
- **Foreign Key:** `FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE`.

#### 10. `admin_logs`
- **Purpose:** Immutable administrative security audit trail tracking moderation decisions.
- **Key Columns:**
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `admin_id INT NOT NULL`
  - `action_type VARCHAR(50) NOT NULL` (e.g. `approve_ad`, `reject_ad`, `suspend_user`, `delete_category`)
  - `target_entity VARCHAR(50) NOT NULL`, `target_id INT NULL`
  - `details TEXT NULL` (Stores audit context including rejection reasons or suspension causes)
  - `ip_address VARCHAR(45) NULL`
- **Foreign Key:** `FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE`.

---

### 2.3 Explicit Advertisement Status Workflow

```mermaid
stateDiagram-v2
    [*] --> pending: Seller Submits Listing (+ SELL)
    
    pending --> approved: Admin Approves Listing
    pending --> rejected: Admin Rejects with Rejection Reason
    
    rejected --> pending: Seller Edits & Resubmits for Review
    
    approved --> sold: Seller Marks as Sold
    approved --> inactive: Seller Pauses / Deactivates
    
    inactive --> approved: Seller Reactivates Listing
    
    approved --> [*]: Public Search & Discovery Feed
```

> **Public Search Isolation Rule:** The public marketplace query unconditionally enforces `WHERE status = 'approved'`, guaranteeing that listings with statuses `pending`, `rejected`, `sold`, or `inactive` are strictly excluded from public buyer feeds and search results!

---

### 2.4 Six Production-Grade Sample SQL Queries

#### Query 1: Public Marketplace Feed (Filtered, Ordered & Joined)
*Only retrieves approved, active listings matching user search criteria, joining primary image and checking wishlist status:*
```sql
SELECT 
    a.id,
    a.title,
    a.price,
    a.product_condition,
    a.location,
    a.city,
    a.created_at,
    a.is_featured,
    c.name AS category_name,
    c.icon AS category_icon,
    img.image_url AS primary_image,
    EXISTS(SELECT 1 FROM favourites f WHERE f.user_id = 3 AND f.advertisement_id = a.id) AS is_favourited
FROM advertisements a
JOIN categories c ON a.category_id = c.id
LEFT JOIN advertisement_images img ON img.advertisement_id = a.id AND img.is_primary = TRUE
WHERE a.status = 'approved'
  AND (LOWER(a.city) = 'mumbai')
  AND (a.category_id = 1)
  AND (a.price BETWEEN 10000 AND 80000)
ORDER BY a.is_featured DESC, a.created_at DESC
LIMIT 12 OFFSET 0;
```

#### Query 2: Admin Moderation Queue (Pending Review)
*Retrieves all pending advertisements requiring moderation with seller contact information:*
```sql
SELECT 
    a.id,
    a.title,
    a.price,
    a.created_at,
    a.product_condition,
    a.city,
    u.name AS seller_name,
    u.email AS seller_email,
    sp.is_verified AS seller_verified,
    c.name AS category_name,
    (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS thumbnail
FROM advertisements a
JOIN users u ON a.seller_id = u.id
JOIN categories c ON a.category_id = c.id
LEFT JOIN seller_profiles sp ON sp.user_id = u.id
WHERE a.status = 'pending'
ORDER BY a.created_at ASC;
```

#### Query 3: Admin Moderation Action (Rejection with Feedback & Audit Logging)
*Atomic transaction rejecting an ad, storing the rejection explanation, and recording an immutable audit log entry:*
```sql
START TRANSACTION;

-- 1. Update advertisement status to rejected and store explanation
UPDATE advertisements 
SET status = 'rejected',
    rejection_reason = 'Counterfeit goods policy violation: Replica items are strictly prohibited on NeighShop.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 11 AND status = 'pending';

-- 2. Insert audit log record
INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details, ip_address)
VALUES (1, 'reject_ad', 'advertisement', 11, 'Rejected listing due to brand trademark violation.', '192.168.1.100');

COMMIT;
```

#### Query 4: Seller Inventory Overview with Status Breakdown
*Fetches seller listings grouped by status along with view counts and admin feedback for rejected ads:*
```sql
SELECT 
    a.id,
    a.title,
    a.price,
    a.status,
    a.rejection_reason,
    a.views_count,
    a.created_at,
    (SELECT COUNT(*) FROM enquiries e WHERE e.advertisement_id = a.id) AS total_inquiries,
    (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
FROM advertisements a
WHERE a.seller_id = 2
ORDER BY 
    CASE a.status 
        WHEN 'rejected' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'approved' THEN 3
        ELSE 4
    END,
    a.created_at DESC;
```

#### Query 5: Buyer Enquiry Threading & Response Tracking
*Retrieves all buyer inquiries for a seller, joining buyer details and product thumbnail:*
```sql
SELECT 
    e.id AS enquiry_id,
    e.message,
    e.reply,
    e.status AS enquiry_status,
    e.created_at AS received_at,
    u.name AS buyer_name,
    u.phone AS buyer_phone,
    a.id AS advertisement_id,
    a.title AS ad_title,
    a.price AS ad_price,
    (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS ad_thumbnail
FROM enquiries e
JOIN users u ON e.buyer_id = u.id
JOIN advertisements a ON e.advertisement_id = a.id
WHERE e.seller_id = 2
ORDER BY e.created_at DESC;
```

#### Query 6: Safety Complaint Center & Automatic Violating Ad Suspension
*Finds unresolved reports and provides administrative resolution with automatic ad removal:*
```sql
-- Identify high-priority complaints
SELECT 
    r.id AS report_id,
    r.reason,
    r.description,
    r.created_at,
    reporter.name AS reported_by,
    a.id AS advertisement_id,
    a.title AS ad_title,
    seller.name AS seller_name
FROM reports r
JOIN users reporter ON r.reporter_id = reporter.id
JOIN advertisements a ON r.advertisement_id = a.id
JOIN users seller ON a.seller_id = seller.id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- Resolve complaint & suspend violating ad
START TRANSACTION;

UPDATE reports 
SET status = 'resolved',
    admin_notes = 'Listing verified as fraudulent; listing taken down immediately.'
WHERE id = 1;

UPDATE advertisements 
SET status = 'rejected',
    rejection_reason = 'Removed by administrator due to community safety complaint.'
WHERE id = 11;

INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details)
VALUES (1, 'resolve_report', 'report', 1, 'Resolved report and rejected advertisement #11.');

COMMIT;
```

---

### 2.5 Automated Database Verification Suite

A dedicated verification script [backend/scripts/verify-database.ts](file:///c:/Users/verma/OneDrive/Desktop/Project/backend/scripts/verify-database.ts) confirms that the schema can be initialized from scratch and that all relational rules function correctly:

```bash
cd backend
npm run test:db
```

**Verification Steps Executed by the Test Suite:**
1. **Table Inventory:** Confirms all 10 tables exist and are queryable.
2. **Status Lifecycles:** Inserts an ad, verifies transitions through all 5 explicit statuses (`pending`, `approved`, `rejected`, `sold`, `inactive`), and confirms `rejection_reason` storage.
3. **Public Search Isolation:** Queries public feed and verifies that inactive/pending/rejected/sold ads are 100% excluded.
4. **Cascade Deletion:** Attaches images, wishlist bookmarks, inquiries, reports, and featured records to an ad, deletes the ad, and verifies that `ON DELETE CASCADE` automatically purges child records without leaving orphans.
5. **Uniqueness Constraints:** Attempts inserting duplicate emails, duplicate bookmarks, and duplicate category slugs, verifying that all are cleanly rejected.

---

## 3. Milestone 3: Shared REST API Architecture & Implementation

The shared REST API is built with **Node.js, Express.js, TypeScript**, and backed by the normalized MySQL schema (with automatic zero-config fallback to SQLite). It enforces strict backend validation, parameterized queries, bcrypt password hashing, robust role-based access control (RBAC), and deterministic HTTP status codes across 11 functional modules.

### 3.1 Modular API Architecture
```
backend/src/
├── config/env.ts              # Environment configuration & validation
├── controllers/               # Business logic, authorization & database execution
│   ├── authController.ts      # Registration, login, logout, profile & role switching
│   ├── categoryController.ts  # Taxonomy navigation & live approved ad counters
│   ├── adController.ts        # Ad CRUD, image ingestion & ownership verification
│   ├── wishlistController.ts  # Favourites bookmarking & status checks
│   ├── enquiryController.ts   # Buyer inquiries & seller response management
│   ├── adminController.ts     # Moderation queue, user management, stats & logs
│   ├── reportController.ts    # Safety complaints & violating ad takedowns
│   └── userController.ts      # Public seller storefront profiles & active listings
├── middleware/                # Security & request pipelines
│   ├── auth.ts                # Bearer JWT verification & active user hydration
│   ├── rbac.ts                # Role barriers (requireBuyer, requireSeller, requireAdmin)
│   ├── upload.ts              # Multer multi-photo upload handler
│   └── errorHandler.ts        # Centralized 404 & 500 error sanitization
├── routes/                    # RESTful route definitions mounted on /api
│   ├── auth.routes.ts         # /api/auth
│   ├── category.routes.ts     # /api/categories
│   ├── ad.routes.ts           # /api/advertisements
│   ├── wishlist.routes.ts     # /api/wishlist
│   ├── enquiry.routes.ts      # /api/enquiries
│   ├── report.routes.ts       # /api/reports
│   ├── admin.routes.ts        # /api/admin
│   └── user.routes.ts         # /api/users
├── database/db.ts             # Dual-engine connection pool (MySQL + SQLite)
└── server.ts                  # Server entrypoint with diagnostic health check (Port 5000)
```

### 3.2 Implemented Functional Modules (In Sequential Order)

| # | Module | Key Endpoints | Security & Business Logic Enforced |
| :- | :--- | :--- | :--- |
| **1** | **Authentication & Profiles** | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/logout`<br>`GET /api/auth/profile`<br>`PUT /api/auth/profile` | Bcrypt password hashing (10 salt rounds). Validates duplicate emails (`409 Conflict`). Suspended accounts blocked at login (`403 Forbidden`). |
| **2** | **Categories & Subcategories** | `GET /api/categories`<br>`GET /api/categories/:slug` | Returns all 7 categories and 24 subcategories. Computes live counts of approved listings per category. |
| **3** | **Advertisement CRUD & Ownership** | `POST /api/advertisements`<br>`GET /api/advertisements/:id`<br>`PUT /api/advertisements/:id`<br>`DELETE /api/advertisements/:id` | Initial ad creation sets status to `'pending'`. **Strict listing ownership enforcement:** Sellers cannot edit or delete listings belonging to other sellers (`403 Forbidden`). Attached images stored in `advertisement_images`. |
| **4** | **Search, Filtering & Pagination** | `GET /api/advertisements` | **Strict Public Isolation:** Excludes `pending`, `rejected`, `sold`, and `inactive` ads. Supports keyword search (`search`), category filter (`categoryId`), city filter (`city`), price range (`minPrice`, `maxPrice`), sorting (`price_asc`, `newest`), and pagination (`page`, `limit`). |
| **5** | **Favourites & Buyer Enquiries** | `GET /api/wishlist`<br>`POST /api/wishlist/:id`<br>`POST /api/enquiries`<br>`GET /api/enquiries/buyer` | Toggle save/bookmark. Buyers can submit enquiries on listings. **Self-enquiry barrier:** Sellers cannot submit an enquiry on their own advertisement (`400 Bad Request`). |
| **6** | **Seller Dashboard & Inquiries** | `GET /api/advertisements/my-ads`<br>`GET /api/enquiries/seller`<br>`PUT /api/enquiries/:id/reply`<br>`PATCH /api/advertisements/:id/sold` | Returns seller's own listings with summary counters (`total`, `approved`, `pending`, `rejected`, `sold`). Inquiries hub with reply action. Ownership guard on `markAsSold` (`403 Forbidden` for unauthorized sellers). |
| **7** | **Admin User Management** | `GET /api/admin/users`<br>`PATCH /api/admin/users/:id/status` | Non-admin accounts blocked (`403 Forbidden`). Admin can inspect user registry, suspend fraudulent accounts, and reactivate users. Suspended users immediately blocked from authentication. |
| **8** | **Advertisement Approval Workflow** | `GET /api/admin/advertisements`<br>`PATCH /api/admin/advertisements/:id/status` | Non-admin accounts blocked (`403 Forbidden`). Rejection requires a non-empty `rejection_reason` (`400 Bad Request` if omitted). Stored feedback is delivered directly to the seller's My Ads hub. Approval immediately publishes listing to public marketplace feed. |
| **9** | **Reports & Complaints** | `POST /api/reports`<br>`GET /api/admin/reports`<br>`PATCH /api/admin/reports/:id` | Authenticated users report policy violations (`counterfeit`, `spam`, `fraud`). Admin reviews queue, resolves reports with notes, and can trigger automated listing takedowns. |
| **10** | **Featured Ads & Admin Stats** | `GET /api/advertisements/featured`<br>`PATCH /api/admin/advertisements/:id/featured`<br>`GET /api/admin/stats` | Admin can toggle featured promotional banner. Public featured carousel. Admin overview returns real-time KPI metrics (users, listings by status, complaints, category breakdown). |
| **11** | **Administrative Activity Logs** | `GET /api/admin/audit-logs` | Immutable audit trail capturing every moderator action (`approve_ad`, `reject_ad`, `feature_ad`, `suspend_user`, `activate_user`, `resolve_report`) with admin ID, timestamp, and IP address. |

### 3.3 Security & Authorization Safeguards
- **Role-Based Access Control (RBAC):** Middleware checks verify user tokens before protected routes execute.
  - `requireAdmin`: Enforces administrative rights (`admin`).
  - `requireSeller`: Allows sellers and administrators (`seller`, `admin`).
  - `requireBuyer`: Allows buyers, sellers, and administrators.
- **Listing Ownership Guard:** `ad.seller_id === req.user.id || req.user.role === 'admin'`. Unauthorized sellers receive `HTTP 403 Forbidden`.
- **Public Feed Isolation:** Public advertisement queries strictly append `a.status = 'approved'`, guaranteeing that unapproved listings (`pending`, `rejected`, `sold`, `inactive`) never leak to the public.
- **SQL Injection Prevention:** 100% of queries use parameterized prepared statements (`?` placeholders).

### 3.4 Diagnostic Health Check & API Documentation
- **Health Check Endpoint:** `GET http://localhost:5000/api/health`
  ```json
  {
    "status": "online",
    "service": "NeighShop Classified Marketplace Shared API",
    "candidate": "Vansh",
    "database": "SQLITE",
    "version": "1.0.0",
    "uptime": 277,
    "timestamp": "2026-10-15T12:00:00.000Z"
  }
  ```
- **Full API Specification:** Complete endpoint reference is documented in [backend/docs/API_DOCUMENTATION.md](file:///c:/Users/verma/OneDrive/Desktop/Project/backend/docs/API_DOCUMENTATION.md).

### 3.5 Automated Milestone 3 Verification Suite
Run the automated test suite testing all 11 modules in strict sequential order:
```bash
cd backend
npm run test:m3
```

---

## 4. Directory Structure

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
│   │   ├── seed.sql                      # Comprehensive seed data script
│   │   ├── migrations/                   # Version-controlled schema migrations
│   │   │   └── 001_initial_schema.sql
│   │   └── seeds/                        # Version-controlled seed data
│   │       └── 001_initial_seed.sql
│   ├── src/
│   │   ├── config/env.ts                 # Validated environment configuration
│   │   ├── controllers/                  # Fully-typed controllers (auth, ad, admin, cat, enquiry, etc.)
│   │   ├── middleware/                   # JWT auth, RBAC (Buyer, Seller, Admin), Multer upload
│   │   ├── routes/                       # Typed Express REST routes
│   │   └── server.ts                     # Express application entrypoint (Port 5000)
│   ├── scripts/
│   │   ├── verify-database.ts            # Milestone 2: Schema, constraint & cascade test suite
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

## 5. Safe Demonstration Credentials

The database comes pre-seeded with verified test accounts across all three roles:

| Role | Email | Password | Primary Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@neighshop.com` | `Admin@123` | Full Admin Console, Approve/Reject Ads with feedback reasons, User Moderation, Taxonomies, Audit Trail |
| **Seller** | `seller@neighshop.com` | `Seller@123` | Seller Studio, + SELL Ad Posting, Inventory Management, Rejection Reason Feedback, Buyer Leads |
| **Buyer** | `buyer@neighshop.com` | `Buyer@123` | Browse Marketplace, Location Selector, Multi-Filters, Wishlist, Send Inquiries, Report Ads |

---

## 6. Quick-Start Guide (Running Locally)

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
npm run test:db   # Executes Milestone 2 database schema verification suite
npm run test:m3   # Executes Milestone 3 11-module REST API verification suite
npm run test:e2e  # Executes automated multi-role E2E workflow test
npm start         # Starts backend on http://localhost:5000
```
- Health Check: `http://localhost:5000/api/health`

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

## 7. Technical Evaluation Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **User Mobile App** | React Native, TypeScript, React Navigation (Tabs: Home, Explore, Wishlist, Chats, Account + ProductDetail Stack). OLX 2-column feed, location selector, category chips. | ✅ Verified (0 TS errors) |
| **Seller Mobile App** | React Native, TypeScript, React Navigation (Tabs: Studio, My Ads, + SELL, Inquiries, Storefront). Rejection reason feedback banner, status filters, buyer leads. | ✅ Verified (0 TS errors) |
| **Admin Web App** | React.js, TypeScript, Vite. Executive KPIs, Pending Approvals queue with Approve/Reject modal, User moderation, Category CRUD, Reports Center, Audit Trail. | ✅ Verified (0 TS errors) |
| **Shared Backend API** | Node.js, Express.js, TypeScript. JWT authentication, Role-Based Access Control (`buyer`, `seller`, `admin`), Multer file uploads, parameterized SQL. 11 functional modules tested. | ✅ Verified (`test:m3`) |
| **Database Architecture** | MySQL 8.0+ normalized schema (`schema.sql` and `seed.sql`). Seamless automatic zero-config fallback to SQLite for immediate testing. | ✅ Verified (`test:db`) |
| **End-to-End Moderation** | Full feedback loop from ad submission -> admin review -> rejection reason display to seller -> resubmission -> approval -> public discovery. | ✅ Verified (`test:e2e`) |
| **Git & Clean Repository** | Clean multi-project repository structure, thorough documentation, test credentials, and runnable development servers. | ✅ Verified |

---

## 8. Explanatory Video Recording Guide (Section 12.2)

When recording the explanatory video, cover the following 12 key points:

1. **Architecture Walkthrough**: Demonstrate how all three applications talk to the shared Node.js Express TypeScript backend and MySQL database.
2. **Codebase Organization**: Show the directory structure: `backend/`, `user-mobile/`, `seller-mobile/`, `admin-web/`, and `shared/types/`.
3. **Database Relational Design**: Walk through `schema.sql`, explaining the 10 tables, explicit statuses, foreign keys, indexes, and cascades.
4. **User Mobile Application**: Showcase the OLX-inspired UI, location picker, category chips, fresh recommendations grid, and product details with photo gallery.
5. **Seller Mobile Application**: Demonstrate creating an ad with photo upload, viewing the listing in `My Ads` under the `Pending Approval` tab.
6. **Admin Web Panel**: Log into `http://localhost:5173/`, explain the KPI cards, open the `Pending Approvals` queue, and click **Approve** or **Reject with Reason**.
7. **Live Data Consistency**: Return to the mobile app and refresh to show the newly approved ad is now visible in the public marketplace feed.
8. **Rejection Feedback Workflow**: Reject a test ad with an explanatory reason (e.g., "Counterfeit item") and show the rejection banner appear in the seller's `My Ads` tab.
9. **Buyer Inquiries**: Submit an enquiry from the Buyer view and respond to it from the Seller view.
10. **Wishlist & Reporting**: Add an item to favorites and submit a safety report. Show the report appear in the Admin Panel's `Reports` center.
11. **Backend Security & RBAC**: Point out the JWT authentication middleware (`src/middleware/auth.ts`) and role-based guards (`src/middleware/rbac.ts`).
12. **Automated Verification**: Run `npm run test:db`, `npm run test:m3`, and `npm run test:e2e` in `backend/` to showcase all automated verification suites passing with 0 errors.

---

**Developed with care for NeighShop Global by Candidate Vansh.**

