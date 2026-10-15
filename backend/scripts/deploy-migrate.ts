import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runProductionMigrations() {
  console.log('====================================================================');
  console.log('🚀 NEIGHSHOP GLOBAL: PRODUCTION DATABASE MIGRATION RUNNER');
  console.log('Target: Managed MySQL Database (Aiven / Railway / AWS RDS / Cloud SQL)');
  console.log('====================================================================\n');

  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'neighshop_marketplace';
  const useSsl = process.env.DB_SSL === 'true' || (Boolean(databaseUrl) && !databaseUrl?.includes('localhost'));

  let connection: mysql.Connection;

  try {
    if (databaseUrl) {
      console.log(`🔌 Connecting to MySQL using connection URI (SSL: ${useSsl})...`);
      connection = await mysql.createConnection({
        uri: databaseUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        multipleStatements: true,
      });
    } else {
      console.log(`🔌 Connecting to MySQL at ${dbHost}:${dbPort}/${dbName} (SSL: ${useSsl})...`);
      connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        multipleStatements: true,
      });
    }

    console.log('✅ Connected to target MySQL instance successfully!\n');

    // Step 1: Apply Schema
    console.log('1️⃣  Applying Normalized Schema from schema.sql...');
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('   ✅ Schema DDL applied successfully.');

    // Step 2: Verify Tables
    console.log('\n2️⃣  Verifying Table Inventory in Target Database...');
    const expectedTables = [
      'users',
      'seller_profiles',
      'categories',
      'subcategories',
      'advertisements',
      'advertisement_images',
      'favourites',
      'enquiries',
      'reports',
      'admin_logs'
    ];

    const [rows]: any = await connection.query('SHOW TABLES');
    const actualTables = rows.map((r: any) => Object.values(r)[0]);

    for (const table of expectedTables) {
      if (actualTables.includes(table)) {
        console.log(`   ✅ Table '${table}' exists and is ready.`);
      } else {
        throw new Error(`Expected table '${table}' was not created!`);
      }
    }

    // Step 3: Check if Seed Data is Needed
    console.log('\n3️⃣  Checking Seed Data Status...');
    const [userCountRows]: any = await connection.query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountRows[0].count;

    if (userCount === 0) {
      console.log('   🌱 Database is empty. Applying seed data from seed.sql...');
      const seedPath = path.resolve(__dirname, '../database/seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('   ✅ Seed accounts and categories inserted successfully.');
      }
    } else {
      console.log(`   ℹ️ Database already contains ${userCount} users. Skipping seed insertion.`);
    }

    console.log('\n====================================================================');
    console.log('🎉 PRODUCTION DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================================\n');

    await connection.end();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Migration Failed:', err.message);
    process.exit(1);
  }
}

runProductionMigrations();
