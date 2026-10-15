import { RequestInit } from 'node';

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

let adminToken = '';
let sellerToken = '';
let buyerToken = '';
let testSellerId = 0;
let testAdId = 0;
let testCatId = 0;
let testSubId = 0;
let testReportId = 0;
const runId = Date.now().toString().slice(-4);

async function runMilestone4Verification() {
  console.log('====================================================================');
  console.log('🛡️  NEIGHSHOP GLOBAL: MILESTONE 4 ADMIN WEB APPLICATION VERIFICATION');
  console.log('Verifying Admin Workflows, RBAC Barriers, Database Integrity & UI APIs');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // STAGE 1: AUTHENTICATION, LOGIN, LOGOUT & RBAC BARRIER
    // -------------------------------------------------------------
    console.log('1️⃣  VERIFYING ADMIN AUTHENTICATION & ACCESS BARRIERS...');

    // 1.1 Non-admin (buyer/seller) login attempt on admin routes
    const sellerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'seller@neighshop.com', password: 'Seller@123' })
    });
    assert(sellerLogin.status === 200, 'Seller login failed');
    sellerToken = sellerLogin.data.token;

    // Seller attempts to access admin stats -> MUST RETURN 403
    const sellerBlocked = await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    assert(sellerBlocked.status === 403, `Expected 403 Forbidden for seller on /admin/stats, got ${sellerBlocked.status}`);
    console.log(`   🛡️ RBAC ENFORCED: Non-admin (Seller) blocked from admin APIs: HTTP 403`);

    // Unauthenticated request -> MUST RETURN 401
    const unauthBlocked = await apiRequest('/admin/stats');
    assert(unauthBlocked.status === 401, `Expected 401 Unauthorized for missing token, got ${unauthBlocked.status}`);
    console.log(`   🛡️ AUTH ENFORCED: Unauthenticated request blocked: HTTP 401`);

    // 1.2 Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@neighshop.com', password: 'Admin@123' })
    });
    assert(adminLogin.status === 200, 'Admin login failed');
    assert(adminLogin.data.user.role === 'admin', 'User role must be admin');
    adminToken = adminLogin.data.token;
    console.log(`   ✅ Admin authenticated: "${adminLogin.data.user.name}" (Role: ${adminLogin.data.user.role})`);

    // 1.3 Admin logout confirmation
    const logoutRes = await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(logoutRes.status === 200, 'Logout failed');
    console.log(`   ✅ Admin logout endpoint verified: "${logoutRes.data.message}"`);

    // -------------------------------------------------------------
    // STAGE 2: DASHBOARD STATISTICS FROM ACTUAL DATABASE
    // -------------------------------------------------------------
    console.log('\n2️⃣  VERIFYING DASHBOARD STATISTICS FROM DATABASE...');
    const statsRes = await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.status === 200, 'Failed to fetch admin stats');
    const { users, advertisements, reports } = statsRes.data.stats;
    assert(typeof users.total_users === 'number' && users.total_users > 0, 'User stats invalid');
    assert(typeof advertisements.total_ads === 'number', 'Ad stats invalid');
    assert(typeof reports.total_reports === 'number', 'Report stats invalid');
    assert(Array.isArray(statsRes.data.categoryBreakdown), 'Category breakdown must be array');

    console.log(`   ✅ Dashboard Stats retrieved successfully:`);
    console.log(`      • Total Registered Users:  ${users.total_users} (Active: ${users.active_users}, Sellers: ${users.total_sellers})`);
    console.log(`      • Total Advertisements:    ${advertisements.total_ads} (Approved: ${advertisements.approved_ads}, Pending: ${advertisements.pending_ads}, Rejected: ${advertisements.rejected_ads}, Sold: ${advertisements.sold_ads})`);
    console.log(`      • Featured Listings:       ${advertisements.featured_ads}`);
    console.log(`      • Open Safety Complaints:  ${reports.pending_reports} of ${reports.total_reports}`);
    console.log(`      • Category Breakdown:      ${statsRes.data.categoryBreakdown.length} primary categories reporting active volumes`);

    // -------------------------------------------------------------
    // STAGE 3: USER & SELLER ACCOUNT MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n3️⃣  VERIFYING USER & SELLER ACCOUNT MANAGEMENT...');
    
    // Register a test seller to moderate
    const tempSellerEmail = `temp_mod_seller_${runId}@neighshop.com`;
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Flagged Seller ${runId}`,
        email: tempSellerEmail,
        password: 'Password@123',
        phone: '+91 99887 66554',
        role: 'seller',
        businessName: `Suspicious Store ${runId}`
      })
    });
    testSellerId = regRes.data.user.id;
    console.log(`   Created test seller account #${testSellerId} (${tempSellerEmail})`);

    // 3.1 Search & filter users
    const usersSearch = await apiRequest(`/admin/users?search=${encodeURIComponent(tempSellerEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(usersSearch.status === 200, 'User search failed');
    assert(usersSearch.data.users.length === 1, 'Search must locate exactly the created seller');
    console.log(`   ✅ Admin user search: Found account #${testSellerId} with status [${usersSearch.data.users[0].status}]`);

    // 3.2 Suspend seller
    const suspendRes = await apiRequest(`/admin/users/${testSellerId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'suspended' })
    });
    assert(suspendRes.status === 200, 'Suspend user failed');
    console.log(`   ✅ Admin suspended account #${testSellerId}: "${suspendRes.data.message}"`);

    // 3.3 Verify suspended seller CANNOT log in
    const badSuspendedLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: tempSellerEmail, password: 'Password@123' })
    });
    assert(badSuspendedLogin.status === 403, `Expected 403 for suspended user login, got ${badSuspendedLogin.status}`);
    console.log(`   🛡️ SUSPENSION EFFECTIVE: Suspended seller login rejected: HTTP 403 "${badSuspendedLogin.data.message}"`);

    // 3.4 Reactivate seller
    const reactivateRes = await apiRequest(`/admin/users/${testSellerId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'active' })
    });
    assert(reactivateRes.status === 200, 'Reactivate failed');
    console.log(`   ✅ Admin reactivated account #${testSellerId}: "${reactivateRes.data.message}"`);

    // 3.5 Verify admin cannot suspend another administrator
    const adminSelfSuspend = await apiRequest(`/admin/users/1/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'suspended' })
    });
    assert(adminSelfSuspend.status === 400, 'Admin should not be able to suspend an administrator account');
    console.log(`   🛡️ SAFETY RULE: Administrator account cannot be suspended: HTTP 400 "${adminSelfSuspend.data.message}"`);

    // -------------------------------------------------------------
    // STAGE 4: PENDING APPROVALS & MODERATION WORKFLOW
    // -------------------------------------------------------------
    console.log('\n4️⃣  VERIFYING PENDING APPROVALS & MODERATION WORKFLOW...');

    // Post a new ad from seller
    const adPostRes = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        title: `Sony Alpha A7 IV Full-Frame Camera #${runId}`,
        description: 'Mint condition 33MP mirrorless camera with 28-70mm kit lens. Barely used.',
        price: 185000,
        category_id: 1,
        product_condition: 'used_like_new',
        location: 'Khar West',
        city: 'Mumbai',
        state: 'Maharashtra',
        contact_phone: '+91 98112 23344',
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800']
      })
    });
    assert(adPostRes.status === 201, 'Ad creation failed');
    testAdId = adPostRes.data.adId || adPostRes.data.advertisement.id;
    console.log(`   Created test ad #${testAdId} (Initial status: [${adPostRes.data.status}])`);

    // 4.1 Pending queue includes image previews and seller details
    const pendingRes = await apiRequest('/admin/advertisements?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(pendingRes.status === 200, 'Pending fetch failed');
    const pendingAd = pendingRes.data.advertisements.find((a: any) => a.id === testAdId);
    assert(pendingAd, 'Newly posted ad must appear in pending moderation queue');
    assert(typeof pendingAd.primary_image === 'string', 'Pending ad must include primary_image preview');
    assert(typeof pendingAd.seller_name === 'string', 'Pending ad must include seller_name');
    console.log(`   ✅ Pending Queue verified: Ad #${testAdId} present with image preview "${pendingAd.primary_image}"`);

    // 4.2 Reject listing with required reason
    const feedbackReason = 'Please upload a photo of the camera body showing shutter count and serial number clearly.';
    const rejectRes = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'rejected', rejection_reason: feedbackReason })
    });
    assert(rejectRes.status === 200, 'Rejection failed');
    console.log(`   ✅ Admin rejected Ad #${testAdId} with reason: "${feedbackReason}"`);

    // 4.3 Confirm rejected listing is hidden from public search
    const publicSearchHidden = await apiRequest(`/advertisements?search=${encodeURIComponent(runId)}`);
    assert(publicSearchHidden.status === 200, 'Public search failed');
    assert(publicSearchHidden.data.advertisements.length === 0, 'SECURITY VIOLATION: Rejected listing must NOT appear in public marketplace!');
    console.log(`   🛡️ PUBLIC ISOLATION VERIFIED: Rejected ad #${testAdId} is completely hidden from public search`);

    // 4.4 Admin approves listing
    const approveRes = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    assert(approveRes.status === 200, 'Approval failed');
    console.log(`   ✅ Admin approved Ad #${testAdId}: "${approveRes.data.message}"`);

    // 4.5 Confirm approved listing is immediately discoverable publicly
    const publicSearchLive = await apiRequest(`/advertisements?search=${encodeURIComponent(runId)}`);
    assert(publicSearchLive.status === 200, 'Public search failed');
    assert(publicSearchLive.data.advertisements.some((a: any) => a.id === testAdId), 'Approved ad must appear in public search!');
    console.log(`   🎉 PUBLIC DISCOVERY VERIFIED: Approved ad #${testAdId} is now live and discoverable in the public marketplace!`);


    // -------------------------------------------------------------
    // STAGE 5: FEATURED ADVERTISEMENT MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n5️⃣  VERIFYING FEATURED ADVERTISEMENT MANAGEMENT...');
    
    // Toggle on featured
    const featOn = await apiRequest(`/admin/advertisements/${testAdId}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(featOn.status === 200, 'Feature ad failed');
    assert(featOn.data.is_featured === true, 'Listing must be featured');
    console.log(`   ✅ Featured status toggled ON for Ad #${testAdId}: "${featOn.data.message}"`);

    // Verify in public featured endpoint
    const featList = await apiRequest('/advertisements/featured');
    assert(featList.status === 200, 'Featured list failed');
    assert(featList.data.featured.some((a: any) => a.id === testAdId), 'Ad must be present in public featured ads');
    console.log(`   ✅ Confirmed: Ad #${testAdId} is returned in public featured carousel`);

    // Toggle off featured
    const featOff = await apiRequest(`/admin/advertisements/${testAdId}/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(featOff.status === 200, 'Unfeature ad failed');
    assert(featOff.data.is_featured === false, 'Listing must be unfeatured');
    console.log(`   ✅ Featured status toggled OFF for Ad #${testAdId}: "${featOff.data.message}"`);

    // -------------------------------------------------------------
    // STAGE 6: CATEGORY & SUBCATEGORY TAXONOMY MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n6️⃣  VERIFYING CATEGORY & SUBCATEGORY MANAGEMENT...');

    // 6.1 Create new category
    const catName = `Gaming & VR Tech ${runId}`;
    const newCatRes = await apiRequest('/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: catName,
        icon: 'gamepad-2',
        description: 'VR headsets, gaming consoles, and accessories'
      })
    });
    assert(newCatRes.status === 201, 'Category creation failed');
    testCatId = newCatRes.data.categoryId;
    console.log(`   ✅ Created Primary Category #${testCatId}: "${catName}"`);

    // 6.2 Add subcategory
    const subName = `VR Headsets ${runId}`;
    const newSubRes = await apiRequest('/admin/subcategories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        category_id: testCatId,
        name: subName
      })
    });
    assert(newSubRes.status === 201, 'Subcategory creation failed');
    testSubId = newSubRes.data.subcategoryId;
    console.log(`   ✅ Added Subcategory #${testSubId}: "${subName}" under Category #${testCatId}`);

    // 6.3 Safety Rule: Cannot delete category containing active listings
    const cannotDeleteMobiles = await apiRequest('/admin/categories/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(cannotDeleteMobiles.status === 400, 'Must block deletion of non-empty categories');
    console.log(`   🛡️ TAXONOMY INTEGRITY: Blocked deleting non-empty Category #1 with HTTP 400: "${cannotDeleteMobiles.data.message}"`);

    // 6.4 Delete newly created empty category
    const deleteEmptyCat = await apiRequest(`/admin/categories/${testCatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteEmptyCat.status === 200, 'Delete category failed');
    console.log(`   ✅ Deleted empty Category #${testCatId}: "${deleteEmptyCat.data.message}"`);

    // -------------------------------------------------------------
    // STAGE 7: REPORTS, COMPLAINTS & TAKEDOWNS
    // -------------------------------------------------------------
    console.log('\n7️⃣  VERIFYING REPORTS & SAFETY COMPLAINTS CENTER...');

    // Buyer reports Ad
    const buyerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'buyer@neighshop.com', password: 'Buyer@123' })
    });
    buyerToken = buyerLogin.data.token;

    const fileReportRes = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: testAdId,
        reason: 'counterfeit',
        description: 'Test investigation complaint: please verify warranty document authenticity.'
      })
    });
    assert(fileReportRes.status === 201, 'Report filing failed');
    testReportId = fileReportRes.data.reportId;
    console.log(`   Filed safety complaint #${testReportId} against Ad #${testAdId}`);

    // Admin views complaints queue
    const reportsList = await apiRequest('/admin/reports?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reportsList.status === 200, 'Reports fetch failed');
    assert(reportsList.data.reports.some((r: any) => r.id === testReportId), 'Complaint must appear in queue');
    console.log(`   ✅ Admin inspected complaints queue: ${reportsList.data.reports.length} open complaints`);

    // Admin resolves complaint with takeDownAd = true
    const resolveRes = await apiRequest(`/admin/reports/${testReportId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'resolved',
        admin_notes: 'Investigation complete: verified authenticity, taking down ad as part of test.',
        takeDownAd: true
      })
    });
    assert(resolveRes.status === 200, 'Resolve report failed');
    console.log(`   ✅ Admin resolved Complaint #${testReportId} with takedown: "${resolveRes.data.message}"`);

    // Confirm that Ad was suspended
    const takenDownAd = await apiRequest(`/admin/advertisements?search=${encodeURIComponent(runId)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const checkedAd = takenDownAd.data.advertisements.find((a: any) => a.id === testAdId);
    assert(checkedAd && checkedAd.status === 'rejected', 'Ad status must be rejected following takedown');
    console.log(`   🛡️ TAKEDOWN CONFIRMED: Ad #${testAdId} status is now [${checkedAd.status}]`);

    // -------------------------------------------------------------
    // STAGE 8: RECENT PLATFORM ACTIVITY & AUDIT LOGS
    // -------------------------------------------------------------
    console.log('\n8️⃣  VERIFYING PLATFORM OPERATIONS AUDIT LOGS...');
    const auditLogsRes = await apiRequest('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(auditLogsRes.status === 200, 'Audit logs fetch failed');
    assert(auditLogsRes.data.logs.length > 0, 'Audit logs must contain recorded operations');

    const recordedActions = new Set(auditLogsRes.data.logs.map((l: any) => l.action_type));
    console.log(`   ✅ Retrieved ${auditLogsRes.data.logs.length} immutable audit log entries`);
    console.log(`   Action types captured: [${Array.from(recordedActions).join(', ')}]`);
    assert(recordedActions.has('approve_ad'), 'approve_ad must be in audit logs');
    assert(recordedActions.has('reject_ad'), 'reject_ad must be in audit logs');
    assert(recordedActions.has('suspend_user'), 'suspend_user must be in audit logs');
    assert(recordedActions.has('resolve_report'), 'resolve_report must be in audit logs');

    console.log('\n====================================================================');
    console.log('🎉 ALL MILESTONE 4 ADMIN WEB APPLICATION ACCEPTANCE CRITERIA PASSED!');
    console.log('====================================================================\n');
  } catch (err: any) {
    console.error('\n❌ MILESTONE 4 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runMilestone4Verification();
