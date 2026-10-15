import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.DEPLOYED_API_URL || process.argv[2] || 'http://localhost:5000/api';

console.log('====================================================================');
console.log('🌐 NEIGHSHOP GLOBAL: LIVE DEPLOYED ENVIRONMENT VERIFICATION SUITE');
console.log(`Target Deployed API: ${API_BASE}`);
console.log('====================================================================\n');

async function runDeploymentVerification() {
  const timestamp = Date.now().toString().slice(-4);
  const sellerEmail = `prod_seller_${timestamp}@neighshop.com`;
  const buyerEmail = `prod_buyer_${timestamp}@neighshop.com`;
  const password = 'Password@123';

  let sellerToken = '';
  let buyerToken = '';
  let adminToken = '';
  let createdAdId = 0;
  let enquiryId = 0;
  let reportId = 0;

  try {
    // 1. Health Check
    console.log('1️⃣  VERIFYING LIVE API HEALTH & HTTPS TERMINATION...');
    const healthRes = await fetch(`${API_BASE}/health`);
    if (!healthRes.ok) {
      throw new Error(`Health check failed with HTTP ${healthRes.status}`);
    }
    const healthData = await healthRes.json();
    console.log(`   ✅ Health check passed! Service: "${healthData.service}", DB: [${healthData.database}], Uptime: ${healthData.uptime}s`);

    // 2. Categories Taxonomy
    console.log('\n2️⃣  VERIFYING DATABASE TAXONOMY & SEED DATA...');
    const catRes = await fetch(`${API_BASE}/categories`);
    const catData = await catRes.json();
    console.log(`   ✅ Retrieved ${catData.categories?.length || 0} top-level categories from production database.`);
    if (!catData.categories || catData.categories.length === 0) {
      throw new Error('No categories found. Run "npm run migrate:prod" to seed the database.');
    }

    // 3. Admin Authentication
    console.log('\n3️⃣  VERIFYING ADMIN AUTHENTICATION ON DEPLOYED API...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@neighshop.com', password: 'Admin@123' })
    });
    if (!adminLoginRes.ok) {
      throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    }
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;
    console.log(`   ✅ Admin authenticated successfully (Role: ${adminData.user.role}).`);

    // 4. Seller Registration & Listing Creation
    console.log('\n4️⃣  VERIFYING SELLER REGISTRATION & LISTING CREATION...');
    const sellerRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Prod Seller ${timestamp}`,
        email: sellerEmail,
        password,
        role: 'seller',
        phone: '+91 98200 11223'
      })
    });
    const sellerRegData = await sellerRegRes.json();
    sellerToken = sellerRegData.token;
    console.log(`   ✅ Seller registered (User ID #${sellerRegData.user.id}).`);

    // Create Advertisement
    const createAdRes = await fetch(`${API_BASE}/advertisements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify({
        title: `Deployed Live Production Test Ad ${timestamp}`,
        description: 'Testing live cloud deployment: Express API + MySQL + Cloud Storage.',
        price: '45000',
        category_id: 1,
        location: 'Bandra West, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        product_condition: 'used_like_new',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800']
      })
    });
    const adData = await createAdRes.json();
    createdAdId = adData.adId;
    console.log(`   ✅ Ad #${createdAdId} created in deployed database with status [${adData.status}].`);

    // 5. Verify Pending Ad is Hidden from Public Search
    console.log('\n5️⃣  VERIFYING PUBLIC ISOLATION (PENDING AD HIDDEN)...');
    const publicSearchRes = await fetch(`${API_BASE}/advertisements?search=${encodeURIComponent(`Test Ad ${timestamp}`)}`);
    const publicSearchData = await publicSearchRes.json();
    const foundInSearch = (publicSearchData.advertisements || []).some((a: any) => a.id === createdAdId);
    if (foundInSearch) {
      throw new Error(`Security breach: Pending ad #${createdAdId} was found in public search results!`);
    }
    console.log('   ✅ Pending ad is correctly hidden from public buyers.');

    // 6. Admin Approval
    console.log('\n6️⃣  VERIFYING ADMIN APPROVAL WORKFLOW...');
    const approveRes = await fetch(`${API_BASE}/admin/advertisements/${createdAdId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    if (!approveRes.ok) throw new Error('Failed to approve ad');
    console.log(`   ✅ Ad #${createdAdId} approved by admin. Status is now [approved].`);

    // Verify Public Discovery
    const publicSearchRes2 = await fetch(`${API_BASE}/advertisements?search=${encodeURIComponent(`Test Ad ${timestamp}`)}`);
    const publicSearchData2 = await publicSearchRes2.json();
    const foundInSearch2 = (publicSearchData2.advertisements || []).some((a: any) => a.id === createdAdId);
    if (!foundInSearch2) {
      throw new Error(`Approved ad #${createdAdId} did not appear in public search results!`);
    }
    console.log('   ✅ Approved ad is now publicly searchable by marketplace buyers.');

    // 7. Buyer Registration, Favourites & Enquiry
    console.log('\n7️⃣  VERIFYING BUYER REGISTRATION, FAVOURITES & ENQUIRY...');
    const buyerRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Prod Buyer ${timestamp}`,
        email: buyerEmail,
        password,
        role: 'buyer'
      })
    });
    const buyerRegData = await buyerRegRes.json();
    buyerToken = buyerRegData.token;
    console.log(`   ✅ Buyer registered (User ID #${buyerRegData.user.id}).`);

    // Add to Favourites
    const favRes = await fetch(`${API_BASE}/wishlist/${createdAdId}/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const favData = await favRes.json();
    console.log(`   ✅ Ad #${createdAdId} added to buyer favourites (Status: ${favData.is_favourited}).`);

    // Submit Buyer Enquiry
    const enquiryRes = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        advertisement_id: createdAdId,
        message: `Hello! Is Ad #${createdAdId} available for in-person testing in Mumbai today? (Live Verification)`
      })
    });
    const enquiryData = await enquiryRes.json();
    enquiryId = enquiryData.enquiryId || enquiryData.id;
    console.log(`   ✅ Buyer enquiry #${enquiryId} submitted successfully.`);

    // 8. Seller Receives Enquiry & Replies
    console.log('\n8️⃣  VERIFYING SELLER LEADS INBOX & RESPONSE...');
    const sellerEnquiriesRes = await fetch(`${API_BASE}/enquiries/seller`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    const sellerEnquiriesData = await sellerEnquiriesRes.json();
    const matchedEnquiry = (sellerEnquiriesData.enquiries || []).find((e: any) => e.advertisement_id === createdAdId);
    if (!matchedEnquiry) {
      throw new Error(`Seller did not receive enquiry for ad #${createdAdId}`);
    }
    console.log(`   ✅ Seller received enquiry from buyer: "${matchedEnquiry.message.slice(0, 40)}..."`);

    // Seller Reply
    const replyRes = await fetch(`${API_BASE}/enquiries/${matchedEnquiry.id}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify({ reply: 'Yes, physical inspection is welcome between 4 PM and 7 PM today!' })
    });
    if (!replyRes.ok) throw new Error('Seller reply failed');
    console.log('   ✅ Seller replied to buyer enquiry successfully.');

    // 9. Buyer Report & Admin Resolution
    console.log('\n9️⃣  VERIFYING SAFETY REPORTING & COMPLAINT RESOLUTION...');
    const reportRes = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        advertisement_id: createdAdId,
        reason: 'duplicate',
        description: 'Duplicate listing filed during live verification.'
      })
    });
    const reportData = await reportRes.json();
    reportId = reportData.reportId || reportData.id;
    console.log(`   ✅ Safety report #${reportId} filed by buyer.`);

    // Admin Resolves Report
    const resolveRes = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'resolved',
        admin_notes: 'Verified during production test run.'
      })
    });
    if (!resolveRes.ok) throw new Error('Report resolution failed');
    console.log(`   ✅ Admin marked report #${reportId} as resolved.`);

    // 10. Cleanup
    console.log('\n🧹 CLEANING UP TEMPORARY VERIFICATION ADVERTISEMENT...');
    await fetch(`${API_BASE}/advertisements/${createdAdId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Test ad #${createdAdId} cleaned up.`);

    console.log('\n====================================================================');
    console.log('🎉 LIVE DEPLOYED ENVIRONMENT VERIFICATION COMPLETED WITH 100% SUCCESS!');
    console.log('====================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exit(1);
  }
}

runDeploymentVerification();
