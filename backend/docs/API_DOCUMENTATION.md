# NeighShop Classified Marketplace — Shared REST API Documentation

**Candidate Name:** Vansh  
**Project:** NeighShop Global Classified Marketplace (OLX-Inspired)  
**Base URL:** `http://localhost:5000/api`  
**API Version:** `1.0.0`  
**Authentication Scheme:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. System Architecture & Standards

### 1.1 Standard HTTP Status Codes
| Status Code | Meaning | Usage |
| :--- | :--- | :--- |
| `200 OK` | Standard success | Retrieval, updates, and general commands |
| `201 Created` | Resource created | Registrations, ad creations, enquiry submissions, report filings |
| `400 Bad Request` | Validation failure | Missing required fields, invalid enum/status, malformed input |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT token |
| `403 Forbidden` | Authorization barrier | Seller attempting to edit another seller's ad; non-admin accessing admin routes; suspended account |
| `404 Not Found` | Resource not found | Ad, user, category, or inquiry ID does not exist |
| `409 Conflict` | Unique conflict | Registration with an email address that is already registered |
| `500 Server Error` | Internal error | Unhandled server or database exceptions |

### 1.2 Standard JSON Response Format
```json
// Success
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Description of why the request failed.",
  "error": "Optional diagnostic information"
}
```

---

## 2. API Health & Diagnostic Endpoint

### `GET /api/health`
- **Access:** Public (No authentication required)
- **Description:** Returns server status, database engine, uptime, version, and server timestamp.
- **Response `200 OK`:**
```json
{
  "status": "online",
  "service": "NeighShop Classified Marketplace Shared API",
  "candidate": "Vansh",
  "database": "SQLITE",
  "version": "1.0.0",
  "uptime": 120,
  "timestamp": "2026-10-15T12:00:00.000Z"
}
```

---

## 3. Module Reference (11 Functional Modules)

### Module 1: Authentication & Profile Management
- `POST /api/auth/register` (Public): Register a new buyer or seller account with secure bcrypt password hashing.
  - Body: `{ name, email, password, phone, role: "buyer" | "seller", businessName?, city?, state? }`
  - Response: `201 Created` with JWT token and user profile.
- `POST /api/auth/login` (Public): Authenticate existing user; validates account status (suspended users receive `403 Forbidden`).
  - Body: `{ email, password }`
  - Response: `200 OK` with JWT token and user profile.
- `POST /api/auth/logout` (Authenticated): Logs out the user session.
  - Headers: `Authorization: Bearer <token>`
  - Response: `200 OK` with confirmation message.
- `GET /api/auth/profile` (Authenticated): Retrieves authenticated user's profile, seller profile (if applicable), and activity counters (myAdsCount, favouritesCount).
- `PUT /api/auth/profile` (Authenticated): Updates user details (name, phone, avatar) and seller storefront details (business_name, bio, address, city, state).
- `POST /api/auth/switch-role` (Authenticated): Switch active role between `buyer` and `seller`.

### Module 2: Categories & Subcategories
- `GET /api/categories` (Public): Returns all top-level categories with subcategories and live counts of approved listings.
- `GET /api/categories/:slug` (Public): Returns a specific category and its subcategories by category URL slug.

### Module 3: Advertisement CRUD, Images & Seller Ownership
- `POST /api/advertisements` (Seller or Admin): Publish a new advertisement with multi-image support (Multer or image URLs). Initial status is set to `'pending'`.
  - Body: `{ title, description, price, category_id, subcategory_id?, product_condition, location, city, state, contact_phone?, images?: string[] }`
  - Response: `201 Created` with ad ID and initial status `'pending'`.
- `GET /api/advertisements/:id` (Public for approved; Owner/Admin for pending/rejected): Retrieves full ad details, image gallery, seller verification badge, and similar listings.
- `PUT /api/advertisements/:id` (Owner Seller or Admin): Updates advertisement details. **Sellers cannot edit advertisements belonging to another seller (returns `403 Forbidden`).**
- `DELETE /api/advertisements/:id` (Owner Seller or Admin): Deletes advertisement and cascades deletion of attached images and bookmarks. **Unauthorized sellers receive `403 Forbidden`.**

### Module 4: Search, Filtering, Sorting & Pagination
- `GET /api/advertisements` (Public): Public feed querying approved marketplace listings. **Pending, rejected, sold, and inactive listings are strictly isolated and never exposed.**
  - Query parameters:
    - `search`: Keyword search matching title and description.
    - `categoryId`: Filter by primary category.
    - `subcategoryId`: Filter by subcategory.
    - `minPrice` & `maxPrice`: Filter by budget range.
    - `condition`: Filter by `new`, `used_like_new`, `used_good`, `used_fair`.
    - `city`: Filter by city (e.g., `Mumbai`, `Delhi`, `Bengaluru`).
    - `sort`: `newest`, `oldest`, `price_asc`, `price_desc`.
    - `page` & `limit`: Pagination parameters.
  - Response: `200 OK` with `total`, `page`, `totalPages`, and `advertisements` array.

### Module 5: Favourites & Buyer Enquiries
- `GET /api/wishlist` (Authenticated Buyer): List user's bookmarked advertisements.
- `POST /api/wishlist/:adId` (Authenticated Buyer): Toggle favourite status on an advertisement.
- `POST /api/enquiries` (Authenticated Buyer): Send a direct enquiry on an advertisement.
  - Body: `{ advertisement_id, message, phone? }`
  - Validation: Buyers cannot enquire on their own advertisements (`400 Bad Request`).
- `GET /api/enquiries/buyer` (Authenticated Buyer): List all sent enquiries and seller responses.

### Module 6: Seller Dashboard & Enquiry Management
- `GET /api/advertisements/my-ads` or `GET /api/advertisements/seller/me` (Seller or Admin):
  - Query parameters: `status: 'all' | 'approved' | 'pending' | 'rejected' | 'sold'`
  - Returns seller's own listings plus summary KPIs (`total`, `approved_count`, `pending_count`, `rejected_count`, `sold_count`).
- `GET /api/enquiries/seller` (Seller or Admin): View all received inquiries from interested buyers.
- `PUT /api/enquiries/:id/reply` (Seller or Admin): Respond to an enquiry (`status` updates to `'responded'`).
- `PATCH /api/advertisements/:id/sold` (Owner Seller or Admin): Mark listing as sold (`status = 'sold'`).

### Module 7: Admin User & Seller Management
- `GET /api/admin/users` (Admin Only): Fetch all platform users with filtering by `role` (`buyer`, `seller`, `admin`), `status` (`active`, `suspended`, `deactivated`), and keyword `search`.
- `PATCH /api/admin/users/:id/status` (Admin Only): Suspend or reactivate user accounts. Administrators cannot suspend other admin accounts.

### Module 8: Advertisement Approval & Rejection Workflow
- `GET /api/admin/advertisements` (Admin Only): Fetch listings with status filters (e.g., `status=pending`).
- `PATCH /api/admin/advertisements/:id/status` (Admin Only):
  - Approve ad: `{ status: "approved" }` -> Listing becomes publicly visible in marketplace search.
  - Reject ad: `{ status: "rejected", rejection_reason: "Explanation..." }` -> Requires explicit non-empty `rejection_reason` (returns `400 Bad Request` if omitted). Rejection reason is stored in database and displayed in seller's My Ads hub.
  - Non-administrators receive `403 Forbidden`.

### Module 9: Reports & Complaints
- `POST /api/reports` (Authenticated Buyer or Seller): Report a violating listing.
  - Body: `{ advertisement_id, reason: 'spam' | 'fraud' | 'offensive' | 'counterfeit' | 'duplicate' | 'wrong_category' | 'other', description }`
- `GET /api/admin/reports` (Admin Only): Admin lists all safety complaints.
- `PATCH /api/admin/reports/:id` (Admin Only): Update report status (`resolved` / `dismissed`), set `admin_notes`, and optionally flag `takeDownAd: true` to reject the offending listing immediately.

### Module 10: Featured Advertisements & Admin Statistics
- `GET /api/advertisements/featured` (Public): Returns top promoted listings with `is_featured = 1` and `status = 'approved'`.
- `PATCH /api/admin/advertisements/:id/featured` (Admin Only): Toggle featured badge for an advertisement.
- `GET /api/admin/stats` (Admin Only): Returns real-time KPI metrics: user counts (active, suspended, buyers, sellers), ad counts (total, pending, approved, rejected, sold, featured), complaints count, category breakdown, and recent pending submissions.

### Module 11: Administrative Activity Logs
- `GET /api/admin/audit-logs` (Admin Only): Returns immutable audit trail of administrative moderation actions (`approve_ad`, `reject_ad`, `feature_ad`, `suspend_user`, `activate_user`, `create_category`, `delete_category`, `resolve_report`) with admin ID, timestamp, and details.
