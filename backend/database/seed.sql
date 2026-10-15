-- ====================================================================
-- NEIGHSHOP GLOBAL - OLX-INSPIRED CLASSIFIED MARKETPLACE
-- MILESTONE 2: COMPREHENSIVE SEED DATA
-- Default Test Logins:
-- Admin:  admin@neighshop.com  / Admin@123
-- Seller: seller@neighshop.com / Seller@123
-- Buyer:  buyer@neighshop.com  / Buyer@123
-- ====================================================================

-- 1. SEED USERS (Safe development hashes: Admin@123, Seller@123, Buyer@123)
INSERT INTO users (id, name, email, password_hash, phone, avatar_url, role, status) VALUES
(1, 'Admin Moderator', 'admin@neighshop.com', '$2b$10$2ooP9mkVkU4MlHQQ4I1qcOiQTOwiTuLrTRfL6IGVR.SyolHn42SNe', '+91 9820011223', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin', 'active'),
(2, 'Vansh Verma (Seller)', 'seller@neighshop.com', '$2b$10$nv7vG9zPTSOdnb7PRD3ngu3iCcSrJEgDyqBYiSYVF.v2j2yWMgdAW', '+91 9811223344', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'seller', 'active'),
(3, 'Priya Sharma (Buyer)', 'buyer@neighshop.com', '$2b$10$yKzXFeJQzVGbLEl5mfRgK.MCRQAoQDuTH8RhlgTpYVgtyMjDR.0Wm', '+91 9988776655', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'buyer', 'active'),
(4, 'Rohit Mehta (Seller)', 'rohit.store@gmail.com', '$2b$10$nv7vG9zPTSOdnb7PRD3ngu3iCcSrJEgDyqBYiSYVF.v2j2yWMgdAW', '+91 9876543210', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'seller', 'active');

-- 2. SEED SELLER PROFILES
INSERT INTO seller_profiles (id, user_id, business_name, bio, rating, total_sales, address, city, state, is_verified) VALUES
(1, 2, 'Vansh Tech & Motors', 'Certified dealer for pre-owned flagship electronics and verified two-wheelers. Member since 2023.', 4.90, 48, 'Shop 14, Linking Road, Bandra West', 'Mumbai', 'Maharashtra', TRUE),
(2, 4, 'Mehta Home & Furniture', 'Quality refurbished home furniture and verified domestic appliances.', 4.75, 23, 'Indiranagar 100ft Road', 'Bengaluru', 'Karnataka', TRUE);

-- 3. SEED CATEGORIES
INSERT INTO categories (id, name, slug, icon, description, display_order) VALUES
(1, 'Mobiles & Tablets', 'mobiles-tablets', 'smartphone', 'Smartphones, Tablets, Smartwatches & Accessories', 1),
(2, 'Cars & Vehicles', 'cars-vehicles', 'car', 'Cars, Bikes, Scooters, Commercial Vehicles & Parts', 2),
(3, 'Property & Real Estate', 'property-real-estate', 'home', 'Flats, Independent Houses, Commercial Space & Land', 3),
(4, 'Electronics & Appliances', 'electronics-appliances', 'tv', 'Laptops, TVs, Home Theaters, Refrigerators & ACs', 4),
(5, 'Furniture & Home Decor', 'furniture-decor', 'sofa', 'Sofas, Beds, Dining Tables, Wardrobes & Lighting', 5),
(6, 'Fashion & Lifestyle', 'fashion-lifestyle', 'shirt', 'Men & Women Clothing, Footwear, Watches & Jewelry', 6),
(7, 'Commercial & Services', 'services-jobs', 'briefcase', 'Home Repairs, Freelancers, Movers & Classified Services', 7);

-- 4. SEED SUBCATEGORIES
INSERT INTO subcategories (id, category_id, name, slug, display_order) VALUES
(1, 1, 'Mobile Phones', 'mobile-phones', 1),
(2, 1, 'Tablets & iPads', 'tablets-ipads', 2),
(3, 1, 'Smartwatches', 'smartwatches', 3),
(4, 1, 'Accessories & Cables', 'mobile-accessories', 4),

(5, 2, 'Cars', 'cars', 1),
(6, 2, 'Motorcycles & Bikes', 'motorcycles', 2),
(7, 2, 'Scooters & EV', 'scooters-ev', 3),
(8, 2, 'Spare Parts', 'vehicle-spare-parts', 4),

(9, 3, 'Apartments For Sale', 'apartments-sale', 1),
(10, 3, 'Houses & Villas', 'houses-villas', 2),
(11, 3, 'Flats For Rent', 'flats-rent', 3),
(12, 3, 'Commercial Properties', 'commercial-shops', 4),

(13, 4, 'Laptops & Computers', 'laptops-computers', 1),
(14, 4, 'TV, Video & Audio', 'tv-audio', 2),
(15, 4, 'Kitchen Appliances', 'kitchen-appliances', 3),
(16, 4, 'Cameras & Lenses', 'cameras', 4),

(17, 5, 'Sofas & Dining Sets', 'sofas-dining', 1),
(18, 5, 'Beds & Mattresses', 'beds-mattresses', 2),
(19, 5, 'Office Desks & Chairs', 'office-furniture', 3),

(20, 6, 'Men Fashion & Shoes', 'mens-fashion', 1),
(21, 6, 'Women Ethnic & Western', 'womens-fashion', 2),
(22, 6, 'Luxury Watches', 'luxury-watches', 3),

(23, 7, 'Home Repair & Electrician', 'home-repair', 1),
(24, 7, 'Packers & Movers', 'packers-movers', 2);

-- 5. SEED ADVERTISEMENTS (Covering all explicit statuses: approved, pending, rejected, sold, inactive)
INSERT INTO advertisements (id, seller_id, category_id, subcategory_id, title, description, price, product_condition, location, city, state, contact_phone, contact_email, status, rejection_reason, is_featured, views_count, created_at) VALUES
(1, 2, 1, 1, 'Apple iPhone 14 Pro 128GB Space Black (Mint Condition)', 'Selling my Apple iPhone 14 Pro in flawless condition. 128GB storage, Space Black color. Battery health is at 94%. Always used with Spigen screen protector and silicone case. Comes with original box, Apple invoice, and brand new braided Lightning cable. No scratches or dents.', 64999.00, 'used_like_new', 'Bandra West, Hill Road', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', NULL, TRUE, 342, NOW() - INTERVAL 2 DAY),

(2, 2, 2, 5, 'Hyundai Creta SX (O) 1.5 Diesel Automatic 2022', 'Single owner driven Hyundai Creta 2022 Top End model. Panoramic sunroof, ventilated front seats, Bose sound system, 28,000 KM genuine reading with company service history. Comprehensive insurance valid till Dec 2026. Zero accidental history.', 1450000.00, 'used_good', 'Juhu Circle, Andheri West', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', NULL, TRUE, 810, NOW() - INTERVAL 3 DAY),

(3, 4, 4, 13, 'MacBook Air M2 8-Core CPU / 256GB SSD (Midnight Blue)', 'Apple MacBook Air M2 in stunning Midnight color. 8GB unified RAM, 256GB ultra-fast SSD. Barely 4 months old, under Apple warranty till Nov 2026. Battery cycle count only 26. Ideal for coding, design, and college work.', 78000.00, 'used_like_new', 'Indiranagar 100ft Rd', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'approved', NULL, TRUE, 512, NOW() - INTERVAL 1 DAY),

(4, 4, 5, 17, 'Modern 6-Seater L-Shape Chesterfield Sofa (Teak Wood Frame)', 'Royal dark grey velvet L-shape 6-seater sofa set with 4 soft throw cushions. High density foam cushioning with 10 years frame warranty. Relocating to new city, urgently selling at discounted price.', 21500.00, 'used_good', 'Koramangala 4th Block', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'approved', NULL, FALSE, 189, NOW() - INTERVAL 4 DAY),

(5, 2, 1, 1, 'Samsung Galaxy S23 Ultra 5G 256GB Phantom Black', 'Samsung flagship phone with built-in S-Pen, 200MP camera, 12GB RAM. Bill, box, and 45W superfast adapter included. Kept in pristine condition.', 68000.00, 'used_like_new', 'Colaba Causeway', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', NULL, FALSE, 267, NOW() - INTERVAL 5 DAY),

(6, 2, 2, 6, 'Royal Enfield Classic 350 Stealth Black (Dual Channel ABS)', 'Royal Enfield Classic 350 bs6 model with alloy wheels and tubeless tires. Run 14,200 km. Recently serviced with Motul fully synthetic oil. All documents clear, MH-02 registered.', 165000.00, 'used_good', 'Powai Hiranandani', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', NULL, TRUE, 620, NOW() - INTERVAL 1 DAY),

(7, 4, 3, 9, 'Luxury 3 BHK Sea View Apartment in Worli Sea Face', 'Spacious 1850 sq.ft carpet area 3 BHK apartment with breathtaking Arabian sea views. High floor, 2 reserved covered stilt parking, clubhouse, swimming pool, and round-the-clock gated security.', 58000000.00, 'new', 'Worli Sea Face', 'Mumbai', 'Maharashtra', '+91 9876543210', 'rohit.store@gmail.com', 'approved', NULL, TRUE, 1240, NOW() - INTERVAL 6 DAY),

(8, 2, 4, 14, 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV', 'Sony Bravia 55X74L series with Triluminos Pro display, Dolby Audio, voice remote. Purchased 1 year back, bill and wall mount bracket included.', 42000.00, 'used_good', 'Malad Link Road', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', NULL, FALSE, 145, NOW() - INTERVAL 2 DAY),

-- Status: PENDING (Admin Moderation Queue)
(9, 2, 1, 3, 'Apple Watch Series 8 45mm GPS Midnight Aluminum', 'Apple Watch Series 8 with blood oxygen sensor, ECG, and always-on retina display. Battery health 98%. Selling because upgraded to Ultra.', 24500.00, 'used_like_new', 'Bandra West', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'pending', NULL, FALSE, 12, NOW()),

(10, 4, 2, 7, 'Ather 450X Gen 3 Electric Scooter (TrueRange 105km)', 'Space grey Ather 450X with Warp mode, Google Maps navigation dashboard. 6,800 KM run. Home charger unit included.', 92000.00, 'used_good', 'HSR Layout', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'pending', NULL, FALSE, 8, NOW()),

-- Status: REJECTED (Stores exact rejection reason from admin moderation)
(11, 2, 6, 22, 'Rolex Submariner Watch Replica First Copy', 'Brand new high quality automatic movement replica watch.', 8500.00, 'new', 'Dadar', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'rejected', 'Violates marketplace policy: Counterfeit, replica, and unverified luxury goods are strictly prohibited.', FALSE, 5, NOW() - INTERVAL 7 DAY),

-- Status: SOLD (Marketplace item completed transaction)
(12, 4, 5, 18, 'Solid Sheesham Wood King Size Bed with Storage', 'King size hydraulic storage bed with Wakefit orthopedic memory foam mattress.', 18000.00, 'used_good', 'Whitefield', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'sold', NULL, FALSE, 430, NOW() - INTERVAL 10 DAY),

-- Status: INACTIVE (Deactivated by seller temporarily)
(13, 2, 4, 13, 'Lenovo ThinkPad T14 Gen 2 (Temporarily Inactive)', 'Temporarily paused while seller is traveling out of town.', 45000.00, 'used_good', 'Bandra West', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'inactive', NULL, FALSE, 24, NOW() - INTERVAL 12 DAY);

-- 6. SEED ADVERTISEMENT IMAGES
INSERT INTO advertisement_images (advertisement_id, image_url, is_primary, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', TRUE, 1),
(1, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', FALSE, 2),
(1, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800', FALSE, 3),

(2, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', TRUE, 1),
(2, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', FALSE, 2),

(3, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', TRUE, 1),
(3, 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800', FALSE, 2),

(4, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', TRUE, 1),
(4, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', FALSE, 2),

(5, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', TRUE, 1),
(5, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800', FALSE, 2),

(6, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', TRUE, 1),
(6, 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', FALSE, 2),

(7, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', TRUE, 1),
(7, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', FALSE, 2),

(8, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', TRUE, 1),

(9, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800', TRUE, 1),
(10, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', TRUE, 1),
(11, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', TRUE, 1),
(12, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', TRUE, 1),
(13, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', TRUE, 1);

-- 7. SEED FAVOURITES (Buyer Wishlist)
INSERT INTO favourites (user_id, advertisement_id) VALUES
(3, 1),
(3, 3),
(3, 6);

-- 8. SEED BUYER ENQUIRIES
INSERT INTO enquiries (id, advertisement_id, buyer_id, seller_id, message, reply, status, created_at) VALUES
(1, 1, 3, 2, 'Hi Vansh, is this iPhone 14 Pro still available? What is your final best price for pickup today in Bandra?', 'Yes Priya, still available! I can do ₹62,000 if you can collect it today from Hill Road.', 'responded', NOW() - INTERVAL 1 DAY),
(2, 6, 3, 2, 'Hello, can you share the insurance copy and service booklet for the Classic 350?', NULL, 'pending', NOW() - INTERVAL 3 HOUR);

-- 9. SEED REPORTS
INSERT INTO reports (id, advertisement_id, reporter_id, reason, description, status, admin_notes, created_at) VALUES
(1, 11, 3, 'counterfeit', 'Seller is openly selling a replica fake Rolex watch. Counterfeits violate platform terms.', 'resolved', 'Advertisement confirmed as policy violation and rejected from public marketplace.', NOW() - INTERVAL 6 DAY),
(2, 2, 3, 'wrong_category', 'Checking if car has clear title papers before booking test drive.', 'pending', NULL, NOW() - INTERVAL 12 HOUR);

-- 10. SEED FEATURED ADVERTISEMENTS
INSERT INTO featured_advertisements (id, advertisement_id, priority, start_date, end_date) VALUES
(1, 1, 1, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 28 DAY),
(2, 2, 2, NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 27 DAY),
(3, 3, 3, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 29 DAY);

-- 11. SEED ADMINISTRATIVE AUDIT LOGS
INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details) VALUES
(1, 'approve_ad', 'advertisement', 1, 'Approved iPhone 14 Pro ad after checking IMEI and invoice photo.'),
(1, 'approve_ad', 'advertisement', 2, 'Approved Hyundai Creta 2022 listing.'),
(1, 'reject_ad', 'advertisement', 11, 'Rejected replica watch listing due to violation of brand trademark policies.');
