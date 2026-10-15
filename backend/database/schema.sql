-- ====================================================================
-- NEIGHSHOP GLOBAL - OLX-INSPIRED CLASSIFIED MARKETPLACE
-- MILESTONE 2: RELATIONAL DATABASE SCHEMA (MySQL 8.0+)
-- Author: Vansh | Project: Classified Marketplace Full-Stack
-- ====================================================================

-- 1. Create database if not exists
CREATE DATABASE IF NOT EXISTS neighshop_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE neighshop_marketplace;

-- Disable foreign key checks during initialization
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================
-- 1. USERS TABLE
-- Stores credentials, role definitions, and account moderation status.
-- ====================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
    status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 2. SELLER PROFILES TABLE (1-to-1 extension of users for sellers)
-- Stores merchant credentials, business storefront info, and reputation.
-- ====================================================================
DROP TABLE IF EXISTS seller_profiles;
CREATE TABLE seller_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    business_name VARCHAR(150) NULL,
    bio TEXT NULL,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_sales INT DEFAULT 0,
    address VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seller_city (city),
    INDEX idx_seller_verified (is_verified),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. CATEGORIES TABLE
-- Top-level marketplace classification taxonomy.
-- ====================================================================
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon VARCHAR(100) NOT NULL DEFAULT 'tag',
    description VARCHAR(255) NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. SUBCATEGORIES TABLE
-- Granular item classifications scoped to parent categories.
-- ====================================================================
DROP TABLE IF EXISTS subcategories;
CREATE TABLE subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cat_subcat (category_id, slug),
    INDEX idx_subcat_category (category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. ADVERTISEMENTS TABLE
-- Classified marketplace listings published by sellers.
-- Explicit Statuses: pending, approved, rejected, sold, inactive.
-- ====================================================================
DROP TABLE IF EXISTS advertisements;
CREATE TABLE advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    subcategory_id INT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    product_condition ENUM('new', 'used_like_new', 'used_good', 'used_fair') DEFAULT 'used_good',
    location VARCHAR(150) NOT NULL DEFAULT 'Bandra West',
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    contact_phone VARCHAR(20) NULL,
    contact_email VARCHAR(150) NULL,
    status ENUM('pending', 'approved', 'rejected', 'sold', 'inactive') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ad_status (status),
    INDEX idx_ad_search_public (status, city, category_id, created_at),
    INDEX idx_ad_category (category_id),
    INDEX idx_ad_seller (seller_id),
    INDEX idx_ad_price (price),
    INDEX idx_ad_featured (is_featured),
    INDEX idx_ad_city (city),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. ADVERTISEMENT IMAGES TABLE
-- Multi-image photo gallery per advertisement.
-- ====================================================================
DROP TABLE IF EXISTS advertisement_images;
CREATE TABLE advertisement_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_image_ad_primary (advertisement_id, is_primary),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. FAVOURITES / WISHLIST TABLE
-- User-saved bookmarked advertisements.
-- ====================================================================
DROP TABLE IF EXISTS favourites;
CREATE TABLE favourites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    advertisement_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_ad_fav (user_id, advertisement_id),
    INDEX idx_fav_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 8. BUYER ENQUIRIES TABLE
-- Direct buyer-to-seller communication inquiries on listings.
-- ====================================================================
DROP TABLE IF EXISTS enquiries;
CREATE TABLE enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    message TEXT NOT NULL,
    reply TEXT NULL,
    status ENUM('pending', 'responded', 'closed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enquiry_ad (advertisement_id),
    INDEX idx_enquiry_seller (seller_id),
    INDEX idx_enquiry_buyer (buyer_id),
    INDEX idx_enquiry_status (status),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 9. REPORTS AND COMPLAINTS TABLE
-- Community safety violation complaints submitted by marketplace users.
-- ====================================================================
DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason ENUM('fraud', 'spam', 'offensive', 'counterfeit', 'duplicate', 'wrong_category', 'other') NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'under_review', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_report_ad (advertisement_id),
    INDEX idx_report_status (status),
    INDEX idx_report_reason (reason),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 10. FEATURED ADVERTISEMENTS TABLE
-- Promoted homepage placements with scheduling & priority.
-- ====================================================================
DROP TABLE IF EXISTS featured_advertisements;
CREATE TABLE featured_advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    priority INT DEFAULT 1,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_featured_ad (advertisement_id),
    INDEX idx_featured_dates (start_date, end_date),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 11. ADMINISTRATIVE ACTIVITY LOGS TABLE
-- Immutable security and audit trail of all moderation actions.
-- ====================================================================
DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_admin (admin_id),
    INDEX idx_log_target (target_entity, target_id),
    INDEX idx_log_created (created_at),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
