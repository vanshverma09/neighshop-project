# NeighShop Global — Project Showcase Guide & Demonstration Runbook

**Candidate Name:** Vansh  
**Project:** NeighShop Global Classified Marketplace  
**Showcase Edition:** Standalone Localhost Showcase Suite  

---

## 1. Quick Start (1-Click Launch on Your Laptop)

To start the complete software suite on your laptop without any complex cloud accounts or command-line steps:

1. Open your project folder: `c:\Users\verma\OneDrive\Desktop\Project`
2. Double-click **`Launch-NeighShop.bat`**.
3. Your web browser will automatically open:
   👉 **`http://127.0.0.1:5173`**

To stop all services when finished demoing, double-click **`Stop-NeighShop.bat`**.

---

## 2. Showcase Architecture (All-in-One Single Webpage)

At the top of the interface, you can freely switch between 4 operational roles:

```
[🏪 NeighShop Project Showcase Suite]  [🛍️ Buyer Marketplace]  [💼 Seller Studio]  [🛡️ Admin Control Panel (2)]  [📱 Mobile App Simulator]
```

### Module 1: 🛍️ Buyer Marketplace
* **Live Discovery Feed**: Real-time product cards populated directly from the local database.
* **Smart Search & Filters**: Live search by keyword and location filter (Mumbai, Delhi, Bangalore, All India).
* **Taxonomy Chips**: Fast categorization (Mobiles & Tablets, Cars & Vehicles, Property, Electronics, Fashion).
* **Rich Product Detail Modal**: Multi-photo gallery, condition tags, verified seller badge, and direct enquiry composer.
* **Favourites / Wishlist**: 1-click heart toggle to save items.
* **Safety Report Modal**: Report spam or fraud directly to the Admin moderation desk.

### Module 2: 💼 Seller Studio
* **Inventory KPI Dashboard**: Real-time counters for **Total**, **Active (Approved)**, **Pending Moderation**, **Rejected**, and **Sold**.
* **Moderation Feedback Loop**: If an item is rejected, the seller sees the exact feedback reason written by the admin.
* **`+ Post New Ad (SELL)`**: Create new listings with image previews, category selection, price, and location.
* **Buyer Leads & Inquiry Inbox**: Threaded lead responses to buyer inquiries.

### Module 3: 🛡️ Admin Operations Control Panel
* **Live Pending Badge**: Live counter showing pending moderation items right on the navigation tab.
* **1-Click Moderation Desk**: Review pending advertisements and approve or reject with custom feedback.
* **User Governance**: View registered users, promote to admin, or ban malicious accounts.
* **Category Taxonomy Editor**: Create, update, or remove top-level and sub-categories.
* **Safety Dispute Desk**: Investigate buyer reports, take down ads, and resolve tickets.
* **Immutable Audit Trail**: Chronological log of administrative actions with timestamps.

### Module 4: 📱 Mobile App Simulator (Interactive Smartphone Demo)
* **Embedded Smartphone Frame**: Realistic device mockup with status bar, dynamic island, and bottom navigation.
* **Buyer Mobile Flow**: Home feed, search, bottom sheet product inspection, and instant enquiry.
* **Seller Mobile Flow**: Mobile seller dashboard, active ad status tags, and leads overview.
* **Talking Point**: Demonstrates that the React Native mobile applications in `user-mobile/` and `seller-mobile/` use the exact same clean layered architecture (UI ➔ Logic ➔ Data) and REST endpoints as the web application.

---

## 3. Step-by-Step 5-Minute Evaluation Script

When presenting to an interviewer or technical evaluator, follow this 5-step demo script:

1. **Step 1: The Seller Creates an Advertisement**
   * Click **`💼 Seller Studio`** ➔ **`➕ Post New Ad`**.
   * Fill in: Title (`MacBook Pro M3 Max 36GB RAM`), Price (`185000`), Category (`Electronics & Appliances`), City (`Mumbai`).
   * Click **Publish & Submit for Moderation**.
   * Switch to **`📦 My Listings`**: Notice the listing has the amber badge **PENDING APPROVAL**.

2. **Step 2: Negative Test — Isolation from Public Search**
   * Switch to **`🛍️ Buyer Marketplace`**.
   * Search for `MacBook Pro M3 Max`.
   * **Highlight to Evaluator**: The unapproved item is strictly hidden from buyers, ensuring marketplace safety.

3. **Step 3: Admin Review & Moderation**
   * Switch to **`🛡️ Admin Control Panel`** ➔ Notice the yellow badge **`(1)`** on Pending Approvals.
   * Open **Pending Approvals** ➔ Click **Approve**.

4. **Step 4: Buyer Discovery & Direct Enquiry**
   * Switch back to **`🛍️ Buyer Marketplace`** ➔ Search for `MacBook Pro M3 Max`.
   * Click on the card to open the detail modal.
   * Add to favourites (heart icon) and type an enquiry: *"Can I inspect the laptop tomorrow at Bandra?"*. Click **Send Message**.

5. **Step 5: Seller Inquiry Reply & Mobile Simulator**
   * Switch to **`💼 Seller Studio`** ➔ Open **`💬 Buyer Leads`**.
   * The seller sees the buyer's inquiry! Type reply: *"Yes, available after 4 PM at Bandra West."* and click **Reply**.
   * Finally, click **`📱 Mobile App Simulator`** to show the evaluator the mobile buyer and seller experiences running inside the interactive smartphone frame.

---

## 4. Pre-Configured Showcase Accounts

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@neighshop.com` | `Admin@123` | Full governance, moderation, taxonomy, audit logs |
| **Seller** | `seller@neighshop.com` | `Seller@123` | Inventory studio, lead responses, ad publishing |
| **Buyer** | `buyer@neighshop.com` | `Buyer@123` | Marketplace browsing, enquiries, favourites, safety reporting |

---

## 5. Technical Highlights & Engineering Stack

* **Frontend**: React 19, TypeScript, Vite, Vanilla CSS design system with custom tokens and glassmorphism.
* **Backend**: Node.js, Express, TypeScript, RESTful API architecture.
* **Database**: MySQL 8.0 & SQLite dual-driver compatibility with connection pooling and relational foreign keys.
* **Mobile Apps**: React Native with Expo, clean layered architecture (`src/components`, `src/screens`, `src/services`).
* **Security**: JWT stateless bearer authentication, bcrypt password hashing (10 salt rounds), parametric SQL to eliminate SQL injection, role-based access control (RBAC).
