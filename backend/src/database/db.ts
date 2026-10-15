import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { ENV } from '../config/env';

export type DatabaseClientType = 'mysql' | 'sqlite';

let dbType: DatabaseClientType = 'sqlite';
let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database.Database | null = null;

export interface QueryResult {
  insertId?: number;
  affectedRows?: number;
  [key: string]: any;
}

function initSqliteDatabase(): void {
  const dbDir = path.resolve(__dirname, '../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlitePath = path.resolve(dbDir, 'marketplace.sqlite');
  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  // Execute schema
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'buyer',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seller_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      business_name TEXT,
      bio TEXT,
      rating REAL DEFAULT 5.0,
      total_sales INTEGER DEFAULT 0,
      address TEXT,
      city TEXT DEFAULT 'Mumbai',
      state TEXT DEFAULT 'Maharashtra',
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'tag',
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      subcategory_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      product_condition TEXT DEFAULT 'used_good',
      location TEXT DEFAULT 'Bandra, Mumbai',
      city TEXT DEFAULT 'Mumbai',
      state TEXT DEFAULT 'Maharashtra',
      latitude REAL,
      longitude REAL,
      contact_phone TEXT,
      contact_email TEXT,
      status TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      is_featured INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
    );

    CREATE TABLE IF NOT EXISTS advertisement_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertisement_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favourites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      advertisement_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, advertisement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertisement_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      reply TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertisement_id INTEGER NOT NULL,
      reporter_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS featured_advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertisement_id INTEGER NOT NULL,
      priority INTEGER DEFAULT 1,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Check if seed is needed
  const row = sqliteDb.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (row.count === 0) {
    seedSqliteDatabase();
  }
}

function seedSqliteDatabase(): void {
  if (!sqliteDb) return;
  console.log('[DB] Seeding initial dataset into SQLite database...');

  const insertUser = sqliteDb.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, avatar_url, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(1, 'Admin Moderator', 'admin@neighshop.com', '$2b$10$2ooP9mkVkU4MlHQQ4I1qcOiQTOwiTuLrTRfL6IGVR.SyolHn42SNe', '+91 9820011223', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin', 'active');
  insertUser.run(2, 'Vansh Verma (Seller)', 'seller@neighshop.com', '$2b$10$nv7vG9zPTSOdnb7PRD3ngu3iCcSrJEgDyqBYiSYVF.v2j2yWMgdAW', '+91 9811223344', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'seller', 'active');
  insertUser.run(3, 'Priya Sharma (Buyer)', 'buyer@neighshop.com', '$2b$10$yKzXFeJQzVGbLEl5mfRgK.MCRQAoQDuTH8RhlgTpYVgtyMjDR.0Wm', '+91 9988776655', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'buyer', 'active');
  insertUser.run(4, 'Rohit Mehta (Seller)', 'rohit.store@gmail.com', '$2b$10$nv7vG9zPTSOdnb7PRD3ngu3iCcSrJEgDyqBYiSYVF.v2j2yWMgdAW', '+91 9876543210', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'seller', 'active');

  const insertSeller = sqliteDb.prepare(`
    INSERT INTO seller_profiles (id, user_id, business_name, bio, rating, total_sales, address, city, state, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSeller.run(1, 2, 'Vansh Tech & Motors', 'Certified dealer for pre-owned flagship electronics and verified two-wheelers.', 4.9, 48, 'Shop 14, Linking Road, Bandra West', 'Mumbai', 'Maharashtra', 1);
  insertSeller.run(2, 4, 'Mehta Home & Furniture', 'Quality refurbished home furniture and verified domestic appliances.', 4.75, 23, 'Indiranagar 100ft Road', 'Bengaluru', 'Karnataka', 1);

  const insertCat = sqliteDb.prepare(`INSERT INTO categories (id, name, slug, icon, description, display_order) VALUES (?, ?, ?, ?, ?, ?)`);
  insertCat.run(1, 'Mobiles & Tablets', 'mobiles-tablets', 'smartphone', 'Smartphones, Tablets & Accessories', 1);
  insertCat.run(2, 'Cars & Vehicles', 'cars-vehicles', 'car', 'Cars, Bikes, Scooters & Commercial', 2);
  insertCat.run(3, 'Property & Real Estate', 'property-real-estate', 'home', 'Flats, Houses, Commercial Space & Land', 3);
  insertCat.run(4, 'Electronics & Appliances', 'electronics-appliances', 'tv', 'Laptops, TVs, Refrigerators & ACs', 4);
  insertCat.run(5, 'Furniture & Home Decor', 'furniture-decor', 'sofa', 'Sofas, Beds, Tables & Office Furniture', 5);
  insertCat.run(6, 'Fashion & Lifestyle', 'fashion-lifestyle', 'shirt', 'Men & Women Clothing, Footwear & Watches', 6);
  insertCat.run(7, 'Commercial & Services', 'services-jobs', 'briefcase', 'Home Repairs, Freelancers & Movers', 7);

  const insertSub = sqliteDb.prepare(`INSERT INTO subcategories (id, category_id, name, slug, display_order) VALUES (?, ?, ?, ?, ?)`);
  insertSub.run(1, 1, 'Mobile Phones', 'mobile-phones', 1);
  insertSub.run(2, 1, 'Tablets & iPads', 'tablets-ipads', 2);
  insertSub.run(3, 1, 'Smartwatches', 'smartwatches', 3);
  insertSub.run(4, 1, 'Accessories & Cables', 'mobile-accessories', 4);
  insertSub.run(5, 2, 'Cars', 'cars', 1);
  insertSub.run(6, 2, 'Motorcycles & Bikes', 'motorcycles', 2);
  insertSub.run(7, 2, 'Scooters & EV', 'scooters-ev', 3);
  insertSub.run(8, 2, 'Spare Parts', 'vehicle-spare-parts', 4);
  insertSub.run(9, 3, 'Apartments For Sale', 'apartments-sale', 1);
  insertSub.run(10, 3, 'Houses & Villas', 'houses-villas', 2);
  insertSub.run(11, 3, 'Flats For Rent', 'flats-rent', 3);
  insertSub.run(12, 3, 'Commercial Properties', 'commercial-shops', 4);
  insertSub.run(13, 4, 'Laptops & Computers', 'laptops-computers', 1);
  insertSub.run(14, 4, 'TV, Video & Audio', 'tv-audio', 2);
  insertSub.run(15, 4, 'Kitchen Appliances', 'kitchen-appliances', 3);
  insertSub.run(16, 4, 'Cameras & Lenses', 'cameras', 4);
  insertSub.run(17, 5, 'Sofas & Dining Sets', 'sofas-dining', 1);
  insertSub.run(18, 5, 'Beds & Mattresses', 'beds-mattresses', 2);
  insertSub.run(19, 5, 'Office Desks & Chairs', 'office-furniture', 3);
  insertSub.run(20, 6, 'Men Fashion & Shoes', 'mens-fashion', 1);
  insertSub.run(21, 6, 'Women Ethnic & Western', 'womens-fashion', 2);
  insertSub.run(22, 6, 'Luxury Watches', 'luxury-watches', 3);
  insertSub.run(23, 7, 'Home Repair & Electrician', 'home-repair', 1);
  insertSub.run(24, 7, 'Packers & Movers', 'packers-movers', 2);

  const insertAd = sqliteDb.prepare(`
    INSERT INTO advertisements (id, seller_id, category_id, subcategory_id, title, description, price, product_condition, location, city, state, contact_phone, contact_email, status, rejection_reason, is_featured, views_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAd.run(1, 2, 1, 1, 'Apple iPhone 14 Pro 128GB Space Black (Mint Condition)', 'Selling my Apple iPhone 14 Pro in flawless condition. 128GB storage, Space Black color. Battery health is at 94%. Always used with screen protector.', 64999.00, 'used_like_new', 'Bandra West, Hill Road', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', null, 1, 342);
  insertAd.run(2, 2, 2, 5, 'Hyundai Creta SX (O) 1.5 Diesel Automatic 2022', 'Single owner driven Hyundai Creta 2022 Top End model. Panoramic sunroof, ventilated front seats, Bose sound system, 28,000 KM genuine reading.', 1450000.00, 'used_good', 'Juhu Circle, Andheri West', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', null, 1, 810);
  insertAd.run(3, 4, 4, 13, 'MacBook Air M2 8-Core CPU / 256GB SSD (Midnight Blue)', 'Apple MacBook Air M2 in Midnight color. 8GB unified RAM, 256GB SSD. Under warranty till Nov 2026. Battery cycle count only 26.', 78000.00, 'used_like_new', 'Indiranagar 100ft Rd', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'approved', null, 1, 512);
  insertAd.run(4, 4, 5, 17, 'Modern 6-Seater L-Shape Chesterfield Sofa (Teak Wood Frame)', 'Royal dark grey velvet L-shape 6-seater sofa set with 4 soft throw cushions. High density foam cushioning with 10 years frame warranty.', 21500.00, 'used_good', 'Koramangala 4th Block', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'approved', null, 0, 189);
  insertAd.run(5, 2, 1, 1, 'Samsung Galaxy S23 Ultra 5G 256GB Phantom Black', 'Samsung flagship phone with built-in S-Pen, 200MP camera, 12GB RAM. Bill, box, and 45W superfast adapter included.', 68000.00, 'used_like_new', 'Colaba Causeway', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', null, 0, 267);
  insertAd.run(6, 2, 2, 6, 'Royal Enfield Classic 350 Stealth Black (Dual Channel ABS)', 'Royal Enfield Classic 350 bs6 model with alloy wheels and tubeless tires. Run 14,200 km. Recently serviced with Motul fully synthetic oil.', 165000.00, 'used_good', 'Powai Hiranandani', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', null, 1, 620);
  insertAd.run(7, 4, 3, 9, 'Luxury 3 BHK Sea View Apartment in Worli Sea Face', 'Spacious 1850 sq.ft carpet area 3 BHK apartment with Arabian sea views. High floor, 2 reserved parking, clubhouse, swimming pool.', 58000000.00, 'new', 'Worli Sea Face', 'Mumbai', 'Maharashtra', '+91 9876543210', 'rohit.store@gmail.com', 'approved', null, 1, 1240);
  insertAd.run(8, 2, 4, 14, 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV', 'Sony Bravia 55X74L series with Triluminos Pro display, Dolby Audio, voice remote. Purchased 1 year back.', 42000.00, 'used_good', 'Malad Link Road', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'approved', null, 0, 145);
  // Pending listings
  insertAd.run(9, 2, 1, 3, 'Apple Watch Series 8 45mm GPS Midnight Aluminum', 'Apple Watch Series 8 with blood oxygen sensor and ECG. Battery health 98%.', 24500.00, 'used_like_new', 'Bandra West', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'pending', null, 0, 12);
  insertAd.run(10, 4, 2, 7, 'Ather 450X Gen 3 Electric Scooter (TrueRange 105km)', 'Space grey Ather 450X with Warp mode, Google Maps navigation dashboard. 6,800 KM run.', 92000.00, 'used_good', 'HSR Layout', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'pending', null, 0, 8);
  // Rejected listing
  insertAd.run(11, 2, 6, 22, 'Rolex Submariner Watch Replica First Copy', 'Brand new high quality automatic movement replica watch.', 8500.00, 'new', 'Dadar', 'Mumbai', 'Maharashtra', '+91 9811223344', 'seller@neighshop.com', 'rejected', 'Violates marketplace policy: Counterfeit, replica, and unverified luxury goods are strictly prohibited.', 0, 5);
  // Sold listing
  insertAd.run(12, 4, 5, 18, 'Solid Sheesham Wood King Size Bed with Storage', 'King size hydraulic storage bed with orthopedic mattress.', 18000.00, 'used_good', 'Whitefield', 'Bengaluru', 'Karnataka', '+91 9876543210', 'rohit.store@gmail.com', 'sold', null, 0, 430);

  const insertImg = sqliteDb.prepare(`INSERT INTO advertisement_images (advertisement_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)`);
  insertImg.run(1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 1, 1);
  insertImg.run(1, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', 0, 2);
  insertImg.run(2, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', 1, 1);
  insertImg.run(3, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 1, 1);
  insertImg.run(4, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 1, 1);
  insertImg.run(5, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', 1, 1);
  insertImg.run(6, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', 1, 1);
  insertImg.run(7, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 1, 1);
  insertImg.run(8, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', 1, 1);
  insertImg.run(9, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800', 1, 1);
  insertImg.run(10, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', 1, 1);
  insertImg.run(11, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', 1, 1);
  insertImg.run(12, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', 1, 1);

  const insertFav = sqliteDb.prepare(`INSERT INTO favourites (user_id, advertisement_id) VALUES (?, ?)`);
  insertFav.run(3, 1);
  insertFav.run(3, 3);
  insertFav.run(3, 6);

  const insertEnq = sqliteDb.prepare(`INSERT INTO enquiries (id, advertisement_id, buyer_id, seller_id, message, reply, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertEnq.run(1, 1, 3, 2, 'Hi Vansh, is this iPhone 14 Pro still available? What is your final best price for pickup today in Bandra?', 'Yes Priya, still available! I can do ₹62,000 if you can collect it today from Hill Road.', 'responded');
  insertEnq.run(2, 6, 3, 2, 'Hello, can you share the insurance copy and service booklet for the Classic 350?', null, 'pending');

  const insertRep = sqliteDb.prepare(`INSERT INTO reports (id, advertisement_id, reporter_id, reason, description, status, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertRep.run(1, 11, 3, 'counterfeit', 'Seller is openly selling a replica fake Rolex watch. Counterfeits violate platform terms.', 'resolved', 'Advertisement confirmed as policy violation and rejected from public marketplace.');
  insertRep.run(2, 2, 3, 'wrong_category', 'Checking if car has clear title papers before booking test drive.', 'pending', null);

  const insertLog = sqliteDb.prepare(`INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)`);
  insertLog.run(1, 'approve_ad', 'advertisement', 1, 'Approved iPhone 14 Pro ad after checking IMEI and invoice photo.');
  insertLog.run(1, 'approve_ad', 'advertisement', 2, 'Approved Hyundai Creta 2022 listing.');
  insertLog.run(1, 'reject_ad', 'advertisement', 11, 'Rejected replica watch listing due to violation of brand trademark policies.');

  console.log('[DB] Seeding complete! 4 users, 12 ads, 24 subcategories ready.');
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (dbType === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows as T[];
  } else {
    if (!sqliteDb) {
      initSqliteDatabase();
    }
    const stmt = sqliteDb!.prepare(sql);
    if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
      return stmt.all(...params) as T[];
    } else {
      const info = stmt.run(...params);
      return [{
        insertId: Number(info.lastInsertRowid),
        affectedRows: info.changes
      }] as unknown as T[];
    }
  }
}

export async function getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0];
  }
  return null;
}

export async function initDatabase(): Promise<{ dbType: DatabaseClientType }> {
  const requestedClient = ENV.DB_CLIENT;

  if (requestedClient === 'mysql' || requestedClient === 'auto') {
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
      const useSsl = process.env.DB_SSL === 'true' || (Boolean(databaseUrl) && !databaseUrl?.includes('localhost'));

      console.log(`[DB] Attempting MySQL connection (${databaseUrl ? 'via DATABASE_URL' : `${ENV.DB_HOST}:${ENV.DB_PORT}`}, SSL: ${useSsl})...`);

      const pool = databaseUrl
        ? mysql.createPool({
            uri: databaseUrl,
            ssl: useSsl ? { rejectUnauthorized: false } : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
          })
        : mysql.createPool({
            host: ENV.DB_HOST,
            port: ENV.DB_PORT,
            user: ENV.DB_USER,
            password: ENV.DB_PASSWORD,
            database: ENV.DB_NAME,
            ssl: useSsl ? { rejectUnauthorized: false } : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
          });

      await pool.query('SELECT 1');
      mysqlPool = pool;
      dbType = 'mysql';
      console.log(' [DB] Connected to MySQL successfully!');
      return { dbType: 'mysql' };
    } catch (err: any) {
      console.warn(` [DB] MySQL connection notice: ${err.message}`);
      console.log('🔄 [DB] Falling back to high-performance local SQLite database (zero-setup mode)...');
    }
  }

  initSqliteDatabase();
  dbType = 'sqlite';
  console.log(' [DB] SQLite database active with full schema and seed data loaded!');
  return { dbType: 'sqlite' };
}

export function getDbType(): DatabaseClientType {
  return dbType;
}
