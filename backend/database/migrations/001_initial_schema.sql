-- Migration: 001_initial_schema.sql
-- Description: Core tables for NeighShop Classifieds Marketplace
-- Database: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS neighshop_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE neighshop_marketplace;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
    status ENUM('active', 'suspended', 'deactivated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Seller Profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon VARCHAR(100) NOT NULL DEFAULT 'tag',
    description VARCHAR(255) NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cat_subcat (category_id, slug),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Advertisements
CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    subcategory_id INT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    product_condition ENUM('new', 'used_like_new', 'used_good', 'used_fair') DEFAULT 'used_good',
    location VARCHAR(150) NOT NULL DEFAULT 'Bandra, Mumbai',
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    contact_phone VARCHAR(20) NULL,
    contact_email VARCHAR(150) NULL,
    status ENUM('pending', 'approved', 'rejected', 'sold') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ad_status (status),
    INDEX idx_ad_category (category_id),
    INDEX idx_ad_seller (seller_id),
    INDEX idx_ad_price (price),
    INDEX idx_ad_featured (is_featured),
    INDEX idx_ad_city (city),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Advertisement Images
CREATE TABLE IF NOT EXISTS advertisement_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_image_ad (advertisement_id),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Favourites / Wishlist
CREATE TABLE IF NOT EXISTS favourites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    advertisement_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_ad_fav (user_id, advertisement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Buyer Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    message TEXT NOT NULL,
    reply TEXT NULL,
    status ENUM('pending', 'responded', 'closed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enquiry_ad (advertisement_id),
    INDEX idx_enquiry_buyer (buyer_id),
    INDEX idx_enquiry_seller (seller_id),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Reports & Complaints
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    advertisement_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason ENUM('spam', 'fraud', 'offensive', 'counterfeit', 'duplicate', 'wrong_category', 'other') NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_report_ad (advertisement_id),
    INDEX idx_report_status (status),
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_admin (admin_id),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
