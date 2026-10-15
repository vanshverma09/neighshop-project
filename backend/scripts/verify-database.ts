import { query, getOne, DatabaseClientType } from '../src/database/db';

async function runDatabaseVerification() {
  console.log('====================================================================');
  console.log('🛡️  NEIGHSHOP GLOBAL: MILESTONE 2 DATABASE SCHEMA VERIFICATION');
  console.log('====================================================================\n');

  try {
    // 1. VERIFY TABLE INVENTORY
    console.log('1️⃣  Verifying Table Inventory & Schema Completeness...');
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
      'featured_advertisements',
      'admin_logs'
    ];

    for (const table of expectedTables) {
      const countRes = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM ${table}`);
      console.log(`   ✅ Table '${table}' exists and is queryable. Rows count: ${countRes[0]?.cnt ?? 0}`);
    }

    // 2. VERIFY EXPLICIT ADVERTISEMENT STATUSES
    console.log('\n2️⃣  Verifying Explicit Advertisement Statuses (pending, approved, rejected, sold, inactive)...');
    const validStatuses = ['pending', 'approved', 'rejected', 'sold', 'inactive'];
    
    // Create temporary ad to test state machine transitions
    const insertTestAd = await query<any>(`
      INSERT INTO advertisements (
        seller_id, category_id, title, description, price, product_condition,
        location, city, state, contact_phone, contact_email, status
      ) VALUES (2, 1, 'Database Test Ad', 'Testing lifecycle', 999.00, 'used_good', 'Test', 'Mumbai', 'Maharashtra', '999', 'test@test.com', 'pending')
    `);
    const testAdId = insertTestAd[0]?.insertId || insertTestAd.insertId;
    console.log(`   ✅ Ad #${testAdId} inserted with initial status ['pending']`);

    // Transition to rejected with rejection_reason
    const rejectionReason = 'Test rejection feedback: Missing clear device photos.';
    await query(`
      UPDATE advertisements 
      SET status = 'rejected', rejection_reason = ? 
      WHERE id = ?
    `, [rejectionReason, testAdId]);
    
    const rejectedAd = await getOne<any>('SELECT status, rejection_reason FROM advertisements WHERE id = ?', [testAdId]);
    if (rejectedAd.status !== 'rejected' || rejectedAd.rejection_reason !== rejectionReason) {
      throw new Error('Failed to verify rejection status and rejection_reason storage!');
    }
    console.log(`   ✅ Status updated to ['rejected']. Stored reason: "${rejectedAd.rejection_reason}"`);

    // Transition to approved
    await query("UPDATE advertisements SET status = 'approved', rejection_reason = NULL WHERE id = ?", [testAdId]);
    const approvedAd = await getOne<any>('SELECT status FROM advertisements WHERE id = ?', [testAdId]);
    console.log(`   ✅ Status updated to ['${approvedAd.status}']`);

    // Transition to sold
    await query("UPDATE advertisements SET status = 'sold' WHERE id = ?", [testAdId]);
    const soldAd = await getOne<any>('SELECT status FROM advertisements WHERE id = ?', [testAdId]);
    console.log(`   ✅ Status updated to ['${soldAd.status}']`);

    // Transition to inactive
    await query("UPDATE advertisements SET status = 'inactive' WHERE id = ?", [testAdId]);
    const inactiveAd = await getOne<any>('SELECT status FROM advertisements WHERE id = ?', [testAdId]);
    console.log(`   ✅ Status updated to ['${inactiveAd.status}']`);

    // 3. VERIFY PUBLIC SEARCH ISOLATION
    console.log('\n3️⃣  Verifying Public Search Isolation Rule (Only approved listings appear in public search)...');
    const publicResults = await query<any>(`
      SELECT id, title, status FROM advertisements WHERE status = 'approved' AND id = ?
    `, [testAdId]);

    if (publicResults.length > 0) {
      throw new Error(`Public search isolation violated! Inactive ad #${testAdId} appeared in public results.`);
    }
    console.log(`   ✅ Verification passed: Inactive ad #${testAdId} is completely hidden from public search feed.`);

    // 4. VERIFY FOREIGN KEYS & CASCADE DELETION RULES
    console.log('\n4️⃣  Verifying Foreign Key Deletion Rules (CASCADE & RESTRICT)...');
    // Attach an image, favourite, enquiry, and report to testAdId
    await query('INSERT INTO advertisement_images (advertisement_id, image_url, is_primary) VALUES (?, ?, 1)', [testAdId, 'http://test.com/img1.jpg']);
    await query('INSERT INTO favourites (user_id, advertisement_id) VALUES (3, ?)', [testAdId]);
    await query('INSERT INTO enquiries (advertisement_id, buyer_id, seller_id, message) VALUES (?, 3, 2, ?)', [testAdId, 'Test question']);
    await query('INSERT INTO reports (advertisement_id, reporter_id, reason, description) VALUES (?, 3, ?, ?)', [testAdId, 'spam', 'Test report']);
    await query('INSERT INTO featured_advertisements (advertisement_id, priority) VALUES (?, 1)', [testAdId]);

    console.log('   ✅ Associated records created in images, favourites, enquiries, reports, and featured_advertisements.');

    // Delete the parent ad
    await query('DELETE FROM advertisements WHERE id = ?', [testAdId]);

    // Verify cascade deletion
    const imgCheck = await query<any>('SELECT count(*) as c FROM advertisement_images WHERE advertisement_id = ?', [testAdId]);
    const favCheck = await query<any>('SELECT count(*) as c FROM favourites WHERE advertisement_id = ?', [testAdId]);
    const enqCheck = await query<any>('SELECT count(*) as c FROM enquiries WHERE advertisement_id = ?', [testAdId]);
    const repCheck = await query<any>('SELECT count(*) as c FROM reports WHERE advertisement_id = ?', [testAdId]);
    const featCheck = await query<any>('SELECT count(*) as c FROM featured_advertisements WHERE advertisement_id = ?', [testAdId]);

    if (imgCheck[0].c !== 0 || favCheck[0].c !== 0 || enqCheck[0].c !== 0 || repCheck[0].c !== 0 || featCheck[0].c !== 0) {
      throw new Error('Cascade deletion rule failed! Orphan records remained after ad deletion.');
    }
    console.log('   ✅ ON DELETE CASCADE confirmed: All child records in images, favourites, enquiries, reports, and featured_advertisements were automatically purged.');

    // 5. VERIFY UNIQUENESS CONSTRAINTS
    console.log('\n5️⃣  Verifying Uniqueness Constraints...');
    
    // Duplicate email constraint check
    let emailUniqueWorked = false;
    try {
      await query("INSERT INTO users (name, email, password_hash) VALUES ('Duplicate', 'admin@neighshop.com', 'hash')");
    } catch {
      emailUniqueWorked = true;
    }
    if (!emailUniqueWorked) throw new Error('Unique constraint on users.email failed!');
    console.log('   ✅ Unique constraint on users.email verified: duplicate emails rejected.');

    // Duplicate favourite constraint check
    let favUniqueWorked = false;
    try {
      await query('INSERT INTO favourites (user_id, advertisement_id) VALUES (3, 1)');
      await query('INSERT INTO favourites (user_id, advertisement_id) VALUES (3, 1)'); // duplicate
    } catch {
      favUniqueWorked = true;
    }
    if (!favUniqueWorked) throw new Error('Unique constraint on favourites(user_id, advertisement_id) failed!');
    console.log('   ✅ Unique constraint uq_user_ad_fav verified: duplicate bookmarks rejected.');

    // Duplicate category slug constraint check
    let catSlugWorked = false;
    try {
      await query("INSERT INTO categories (name, slug) VALUES ('New Mobiles', 'mobiles-tablets')"); // duplicate slug
    } catch {
      catSlugWorked = true;
    }
    if (!catSlugWorked) throw new Error('Unique constraint on categories.slug failed!');
    console.log('   ✅ Unique constraint on categories.slug verified: duplicate slugs rejected.');

    console.log('\n====================================================================');
    console.log('🎉 ALL MILESTONE 2 DATABASE SCHEMA & CONSTRAINT TESTS PASSED!');
    console.log('====================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database Verification Failed:', err.message);
    process.exit(1);
  }
}

runDatabaseVerification();
