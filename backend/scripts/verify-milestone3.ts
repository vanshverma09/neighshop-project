import { RequestInit } from 'node';

const BASE_URL = 'http://localhost:5000/api';

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

// Global test state
let adminToken = '';
let seller1Token = '';
let seller2Token = '';
let buyerToken = '';
let testAdId = 0;
let testEnquiryId = 0;
let testReportId = 0;
const uniqueId = Date.now().toString().slice(-5);

async function testHealthEndpoint() {
  console.log('\n================================================================');
  console.log('🩺 API HEALTH ENDPOINT VERIFICATION');
  console.log('================================================================');
  const res = await apiRequest('/health');
  assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
  assert(res.data.status === 'online', 'Server status must be online');
  assert(res.data.service.includes('NeighShop'), 'Service name must be correct');
  assert(typeof res.data.database === 'string', 'Database type must be reported');
  console.log(`   ✅ /api/health returned 200 OK:`);
  console.log(`      • Service:  ${res.data.service}`);
  console.log(`      • Database: ${res.data.database}`);
  console.log(`      • Uptime:   ${res.data.uptime} seconds`);
  console.log(`      • Version:  ${res.data.version}`);
}

async function testModule1Auth() {
  console.log('\n================================================================');
  console.log('📦 MODULE 1: AUTHENTICATION, REGISTRATION, LOGIN, LOGOUT & PROFILE');
  console.log('================================================================');

  // 1.1 Register Seller 1
  const seller1Email = `seller_m3_${uniqueId}@neighshop.com`;
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Vansh Seller ${uniqueId}`,
      email: seller1Email,
      password: 'Password@123',
      phone: '+91 98200 11111',
      role: 'seller',
      businessName: `Vansh Electronics Hub ${uniqueId}`,
      city: 'Mumbai',
      state: 'Maharashtra'
    })
  });
  assert(regRes.status === 201, `Seller 1 registration failed: ${JSON.stringify(regRes.data)}`);
  assert(regRes.data.success === true, 'Registration success must be true');
  assert(typeof regRes.data.token === 'string', 'Registration must issue a JWT token');
  seller1Token = regRes.data.token;
  console.log(`   ✅ 1.1 Registered Seller 1: ${seller1Email} (Role: ${regRes.data.user.role}, Token issued)`);

  // 1.2 Register Seller 2 (for ownership tests)
  const seller2Email = `seller2_m3_${uniqueId}@neighshop.com`;
  const reg2Res = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: `Rahul Seller ${uniqueId}`,
      email: seller2Email,
      password: 'Password@123',
      phone: '+91 98200 22222',
      role: 'seller',
      businessName: `Rahul Autos ${uniqueId}`,
      city: 'Pune',
      state: 'Maharashtra'
    })
  });
  assert(reg2Res.status === 201, `Seller 2 registration failed`);
  seller2Token = reg2Res.data.token;
  console.log(`   ✅ 1.2 Registered Seller 2: ${seller2Email} (Role: ${reg2Res.data.user.role})`);

  // 1.3 Test invalid credentials rejection
  const badLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: seller1Email,
      password: 'WrongPassword@999'
    })
  });
  assert(badLogin.status === 401, `Expected 401 for incorrect password, got ${badLogin.status}`);
  console.log(`   ✅ 1.3 Rejected invalid credentials with HTTP 401: "${badLogin.data.message}"`);

  // 1.4 Login with correct credentials
  const goodLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: seller1Email,
      password: 'Password@123'
    })
  });
  assert(goodLogin.status === 200, `Login failed: ${JSON.stringify(goodLogin.data)}`);
  seller1Token = goodLogin.data.token;
  console.log(`   ✅ 1.4 Login successful with HTTP 200: Welcome back "${goodLogin.data.user.name}"`);

  // Login Seed Accounts for remaining tests
  const adminLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@neighshop.com', password: 'Admin@123' })
  });
  assert(adminLogin.status === 200, 'Admin login failed');
  adminToken = adminLogin.data.token;

  const buyerLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'buyer@neighshop.com', password: 'Buyer@123' })
  });
  assert(buyerLogin.status === 200, 'Buyer login failed');
  buyerToken = buyerLogin.data.token;
  console.log(`   ✅ 1.5 Seed Admin & Buyer authenticated successfully`);

  // 1.6 Fetch authenticated profile
  const profileRes = await apiRequest('/auth/profile', {
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(profileRes.status === 200, 'Profile fetch failed');
  assert(profileRes.data.user.email === seller1Email, 'Profile user email must match');
  console.log(`   ✅ 1.6 Retrieved profile: Name="${profileRes.data.user.name}", AdsCount=${profileRes.data.stats.myAdsCount}`);

  // 1.7 Update profile
  const updateRes = await apiRequest('/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${seller1Token}` },
    body: JSON.stringify({
      name: `Vansh S. (Verified)`,
      phone: '+91 98200 99999',
      city: 'Navi Mumbai',
      businessName: `Vansh Premier Classifieds`
    })
  });
  assert(updateRes.status === 200, 'Update profile failed');
  console.log(`   ✅ 1.7 Updated profile: "${updateRes.data.message}"`);

  // 1.8 Logout
  const logoutRes = await apiRequest('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(logoutRes.status === 200, 'Logout failed');
  console.log(`   ✅ 1.8 Logout session confirmed: "${logoutRes.data.message}"`);
}

async function testModule2Categories() {
  console.log('\n================================================================');
  console.log('📦 MODULE 2: CATEGORIES & SUBCATEGORIES');
  console.log('================================================================');

  // 2.1 Fetch all categories with subcategories and live ad counts
  const catRes = await apiRequest('/categories');
  assert(catRes.status === 200, 'Categories fetch failed');
  assert(Array.isArray(catRes.data.categories), 'Categories must be an array');
  assert(catRes.data.categories.length >= 6, 'Must have at least 6 primary categories');
  
  const firstCat = catRes.data.categories[0];
  assert(Array.isArray(firstCat.subcategories), 'Category must contain subcategories array');
  assert(typeof firstCat.ad_count === 'number', 'Category must include approved ad count');
  console.log(`   ✅ 2.1 Fetched ${catRes.data.categories.length} categories with subcategories and live ad counts`);
  console.log(`      Sample: "${firstCat.name}" with ${firstCat.subcategories.length} subcategories, Approved Ads: ${firstCat.ad_count}`);

  // 2.2 Fetch category by slug
  const slugRes = await apiRequest(`/categories/${firstCat.slug}`);
  assert(slugRes.status === 200, `Category slug fetch failed for ${firstCat.slug}`);
  assert(slugRes.data.category.slug === firstCat.slug, 'Slug must match');
  console.log(`   ✅ 2.2 Fetched category by slug: "${firstCat.slug}" -> "${slugRes.data.category.name}"`);
}

async function testModule3AdCrudAndOwnership() {
  console.log('\n================================================================');
  console.log('📦 MODULE 3: ADVERTISEMENT CRUD, IMAGES & SELLER OWNERSHIP');
  console.log('================================================================');

  // 3.1 Seller 1 creates a new advertisement
  const createRes = await apiRequest('/advertisements', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seller1Token}` },
    body: JSON.stringify({
      title: `Apple MacBook Pro M3 Max 16-inch 36GB RAM #${uniqueId}`,
      description: 'Space Black M3 Max with 36GB unified memory, 1TB SSD. Original invoice, AppleCare+ active.',
      price: 245000,
      category_id: 1, // Electronics
      subcategory_id: 2, // Laptops
      product_condition: 'used_like_new',
      location: 'BKC Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      contact_phone: '+91 98200 11111',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
      ]
    })
  });
  assert(createRes.status === 201, `Ad creation failed: ${JSON.stringify(createRes.data)}`);
  testAdId = createRes.data.adId || createRes.data.advertisement.id;
  assert(testAdId > 0, 'Ad creation must return valid adId');
  assert(createRes.data.status === 'pending', 'Initial status must be pending');
  console.log(`   ✅ 3.1 Seller 1 created Ad #${testAdId} with 2 images (Initial Status: [${createRes.data.status}])`);

  // 3.2 Fetch Ad details
  const detailRes = await apiRequest(`/advertisements/${testAdId}`, {
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(detailRes.status === 200, 'Ad detail fetch failed');
  assert(detailRes.data.advertisement.images.length === 2, 'Ad must include both uploaded images');
  console.log(`   ✅ 3.2 Verified ad image gallery: ${detailRes.data.advertisement.images.length} images attached`);

  // 3.3 Seller 1 updates own advertisement
  const updateRes = await apiRequest(`/advertisements/${testAdId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${seller1Token}` },
    body: JSON.stringify({
      price: 239000,
      description: 'Space Black M3 Max with 36GB unified memory, price reduced for quick pickup.'
    })
  });
  assert(updateRes.status === 200, 'Owner ad update failed');
  console.log(`   ✅ 3.3 Seller 1 successfully updated own Ad #${testAdId} (Price updated to ₹2,39,000)`);

  // 3.4 Seller 2 attempts to edit Seller 1's advertisement -> MUST RETURN 403 FORBIDDEN
  const rogueUpdate = await apiRequest(`/advertisements/${testAdId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${seller2Token}` },
    body: JSON.stringify({
      price: 1000,
      title: 'Hacked Price by Seller 2'
    })
  });
  assert(rogueUpdate.status === 403, `Expected 403 Forbidden for unauthorized seller, got ${rogueUpdate.status}`);
  console.log(`   🛡️ 3.4 OWNERSHIP ENFORCED: Seller 2 blocked from editing Seller 1's ad: HTTP 403 "${rogueUpdate.data.message}"`);

  // 3.5 Seller 2 attempts to delete Seller 1's advertisement -> MUST RETURN 403 FORBIDDEN
  const rogueDelete = await apiRequest(`/advertisements/${testAdId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${seller2Token}` }
  });
  assert(rogueDelete.status === 403, `Expected 403 Forbidden for unauthorized delete, got ${rogueDelete.status}`);
  console.log(`   🛡️ 3.5 OWNERSHIP ENFORCED: Seller 2 blocked from deleting Seller 1's ad: HTTP 403 "${rogueDelete.data.message}"`);
}

async function testModule4SearchFilteringSorting() {
  console.log('\n================================================================');
  console.log('📦 MODULE 4: SEARCH, FILTERING, SORTING & PAGINATION');
  console.log('================================================================');

  // 4.1 Public feed verification: Pending ads MUST NOT appear
  const publicFeed = await apiRequest('/advertisements');
  assert(publicFeed.status === 200, 'Public feed fetch failed');
  const foundPending = publicFeed.data.advertisements.some((a: any) => a.id === testAdId);
  assert(!foundPending, 'SECURITY VIOLATION: Pending listing must not appear in public marketplace feed!');
  console.log(`   🛡️ 4.1 PUBLIC ISOLATION VERIFIED: Ad #${testAdId} [pending] is completely hidden from public feed`);

  // 4.2 Search by keyword (dynamic from available approved ad)
  const firstWord = publicFeed.data.advertisements[0]?.title.split(' ')[0] || 'Samsung';
  const searchRes = await apiRequest(`/advertisements?search=${encodeURIComponent(firstWord)}`);
  assert(searchRes.status === 200, 'Search failed');
  assert(searchRes.data.advertisements.length > 0, `Keyword search for ${firstWord} must find listings`);
  console.log(`   ✅ 4.2 Keyword search ("${firstWord}"): Found ${searchRes.data.advertisements.length} matching approved listings`);


  // 4.3 Filter by Category
  const catFilter = await apiRequest('/advertisements?categoryId=1');
  assert(catFilter.status === 200, 'Category filter failed');
  assert(catFilter.data.advertisements.every((a: any) => a.category_id === 1), 'All items must belong to category 1');
  console.log(`   ✅ 4.3 Category filter (Electronics): Found ${catFilter.data.advertisements.length} listings`);

  // 4.4 Filter by City
  const cityFilter = await apiRequest('/advertisements?city=Mumbai');
  assert(cityFilter.status === 200, 'City filter failed');
  assert(cityFilter.data.advertisements.every((a: any) => a.city.toLowerCase() === 'mumbai'), 'All items must be in Mumbai');
  console.log(`   ✅ 4.4 Location filter ("Mumbai"): Found ${cityFilter.data.advertisements.length} listings`);

  // 4.5 Filter by Price Range
  const priceFilter = await apiRequest('/advertisements?minPrice=50000&maxPrice=150000');
  assert(priceFilter.status === 200, 'Price filter failed');
  assert(priceFilter.data.advertisements.every((a: any) => a.price >= 50000 && a.price <= 150000), 'All items must be within price range');
  console.log(`   ✅ 4.5 Price range filter (₹50,000 - ₹1,50,000): Found ${priceFilter.data.advertisements.length} listings`);

  // 4.6 Sort by Price Ascending
  const sortRes = await apiRequest('/advertisements?sort=price_asc');
  assert(sortRes.status === 200, 'Sort failed');
  const prices = sortRes.data.advertisements.map((a: any) => a.price);
  for (let i = 1; i < prices.length; i++) {
    assert(prices[i] >= prices[i - 1], 'Listings must be in ascending price order');
  }
  console.log(`   ✅ 4.6 Sorting (Price: Low to High): Lowest is ₹${prices[0]} -> Highest is ₹${prices[prices.length - 1]}`);

  // 4.7 Pagination
  const pageRes = await apiRequest('/advertisements?page=1&limit=3');
  assert(pageRes.status === 200, 'Pagination failed');
  assert(pageRes.data.advertisements.length <= 3, 'Must return at most 3 items per page');
  assert(pageRes.data.page === 1, 'Page number must be 1');
  assert(pageRes.data.total > 0, 'Total items must be greater than 0');
  console.log(`   ✅ 4.7 Pagination (Limit: 3): Page 1 of ${pageRes.data.totalPages} (Total approved ads: ${pageRes.data.total})`);
}

async function testModule5FavouritesAndEnquiries() {
  console.log('\n================================================================');
  console.log('📦 MODULE 5: FAVOURITES & BUYER ENQUIRIES');
  console.log('================================================================');

  // 5.1 Buyer toggles favourite on approved Ad #5
  let favRes = await apiRequest('/wishlist/5', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(favRes.status === 200, 'Wishlist toggle failed');
  if (!favRes.data.is_favourited) {
    favRes = await apiRequest('/wishlist/5', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
  }
  assert(favRes.data.is_favourited === true, 'Ad #5 must be favourited');
  console.log(`   ✅ 5.1 Buyer saved Ad #5 to favourites: "${favRes.data.message}"`);

  // 5.2 Buyer checks wishlist
  const wishListRes = await apiRequest('/wishlist', {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(wishListRes.status === 200, 'Wishlist fetch failed');
  assert(wishListRes.data.wishlist.some((a: any) => a.id === 5), 'Ad #5 must appear in wishlist');
  console.log(`   ✅ 5.2 Wishlist verified: ${wishListRes.data.total} saved items`);


  // 5.3 Buyer sends an enquiry on Ad #1
  const enqRes = await apiRequest('/enquiries', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      advertisement_id: 1,
      message: `Hi, is this iPhone 14 Pro still available for inspection today? Ref #${uniqueId}`
    })
  });
  assert(enqRes.status === 201, 'Enquiry submission failed');
  testEnquiryId = enqRes.data.enquiryId || enqRes.data.enquiry.id;
  assert(testEnquiryId > 0, 'Must return valid enquiry ID');
  console.log(`   ✅ 5.3 Buyer submitted Enquiry #${testEnquiryId}: "${enqRes.data.message}"`);

  // 5.4 Seller attempts to send enquiry to own advertisement -> MUST RETURN 400 BAD REQUEST
  const selfEnq = await apiRequest('/enquiries', {
    method: 'POST',
    headers: { Authorization: `Bearer ${seller1Token}` },
    body: JSON.stringify({
      advertisement_id: testAdId,
      message: 'Self enquiry attempt'
    })
  });
  assert(selfEnq.status === 400, `Expected 400 Bad Request for self-enquiry, got ${selfEnq.status}`);
  console.log(`   🛡️ 5.4 SELF-ENQUIRY BARRIER ENFORCED: Blocked with HTTP 400: "${selfEnq.data.message}"`);
}

async function testModule6SellerDashboard() {
  console.log('\n================================================================');
  console.log('📦 MODULE 6: SELLER DASHBOARD & ENQUIRY MANAGEMENT');
  console.log('================================================================');

  // 6.1 Seller retrieves own ads with status counts
  const myAdsRes = await apiRequest('/advertisements/my-ads', {
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(myAdsRes.status === 200, 'My ads fetch failed');
  assert(typeof myAdsRes.data.counts.total === 'number', 'Total count must be provided');
  assert(typeof myAdsRes.data.counts.pending_count === 'number', 'Pending count must be provided');
  console.log(`   ✅ 6.1 Seller Dashboard Counters:`);
  console.log(`      • Total Listings:    ${myAdsRes.data.counts.total}`);
  console.log(`      • Approved (Active): ${myAdsRes.data.counts.approved_count}`);
  console.log(`      • Pending Approval:  ${myAdsRes.data.counts.pending_count}`);
  console.log(`      • Rejected:          ${myAdsRes.data.counts.rejected_count}`);
  console.log(`      • Sold:              ${myAdsRes.data.counts.sold_count}`);

  // 6.2 Seed Seller checks incoming enquiries
  const sellerSeedLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'seller@neighshop.com', password: 'Seller@123' })
  });
  const sellerSeedToken = sellerSeedLogin.data.token;

  const enqListRes = await apiRequest('/enquiries/seller', {
    headers: { Authorization: `Bearer ${sellerSeedToken}` }
  });
  assert(enqListRes.status === 200, 'Seller enquiries fetch failed');
  assert(enqListRes.data.enquiries.some((e: any) => e.id === testEnquiryId), 'New enquiry must appear in seller list');
  console.log(`   ✅ 6.2 Seller received Enquiry #${testEnquiryId} from buyer`);

  // 6.3 Seller replies to enquiry
  const replyRes = await apiRequest(`/enquiries/${testEnquiryId}/reply`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerSeedToken}` },
    body: JSON.stringify({
      reply: 'Yes, it is available! You can inspect it at our Bandra West location tomorrow at 4 PM.'
    })
  });
  assert(replyRes.status === 200, 'Reply submission failed');
  console.log(`   ✅ 6.3 Seller replied to Enquiry #${testEnquiryId}: "${replyRes.data.message}"`);

  // 6.4 Unauthorized seller attempts to mark Ad #1 as sold -> MUST RETURN 403 FORBIDDEN
  const rogueSold = await apiRequest('/advertisements/1/sold', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(rogueSold.status === 403, `Expected 403 Forbidden for unauthorized mark as sold, got ${rogueSold.status}`);
  console.log(`   🛡️ 6.4 SOLD STATUS OWNERSHIP BARRIER: Blocked unauthorized seller with HTTP 403: "${rogueSold.data.message}"`);

  // 6.5 Owner marks advertisement as sold
  const soldRes = await apiRequest('/advertisements/1/sold', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${sellerSeedToken}` }
  });
  assert(soldRes.status === 200, 'Mark as sold failed');
  console.log(`   ✅ 6.5 Owner marked Ad #1 as sold: "${soldRes.data.message}"`);

  // Restore Ad #1 status to approved for test idempotency
  await apiRequest('/admin/advertisements/1/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
}



async function testModule7AdminUserManagement() {
  console.log('\n================================================================');
  console.log('📦 MODULE 7: ADMIN USER & SELLER MANAGEMENT');
  console.log('================================================================');

  // 7.1 Non-admin (Seller) attempts to access admin users -> MUST RETURN 403 FORBIDDEN
  const rogueUserList = await apiRequest('/admin/users', {
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(rogueUserList.status === 403, `Expected 403 for non-admin, got ${rogueUserList.status}`);
  console.log(`   🛡️ 7.1 RBAC BARRIER ENFORCED: Seller blocked from admin users list: HTTP 403`);

  // 7.2 Admin lists users
  const adminUsers = await apiRequest('/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminUsers.status === 200, 'Admin user list failed');
  assert(adminUsers.data.users.length > 0, 'Users array must not be empty');
  console.log(`   ✅ 7.2 Admin retrieved user registry: ${adminUsers.data.total} total platform accounts`);

  // 7.3 Admin suspends Seller 2
  const seller2User = adminUsers.data.users.find((u: any) => u.email.startsWith('seller2_m3'));
  assert(seller2User, 'Seller 2 must exist in user registry');
  const suspendRes = await apiRequest(`/admin/users/${seller2User.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'suspended' })
  });
  assert(suspendRes.status === 200, 'User suspension failed');
  console.log(`   ✅ 7.3 Admin suspended account #${seller2User.id} (${seller2User.email})`);

  // 7.4 Suspended user attempts to log in -> MUST RETURN 403 FORBIDDEN
  const suspendedLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: seller2User.email, password: 'Password@123' })
  });
  assert(suspendedLogin.status === 403, `Expected 403 for suspended user, got ${suspendedLogin.status}`);
  console.log(`   🛡️ 7.4 SUSPENSION ENFORCED: Suspended user login rejected with HTTP 403: "${suspendedLogin.data.message}"`);

  // 7.5 Admin reactivates account
  const reactivateRes = await apiRequest(`/admin/users/${seller2User.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'active' })
  });
  assert(reactivateRes.status === 200, 'User reactivation failed');
  console.log(`   ✅ 7.5 Admin reactivated account #${seller2User.id}: "${reactivateRes.data.message}"`);
}

async function testModule8AdApprovalWorkflow() {
  console.log('\n================================================================');
  console.log('📦 MODULE 8: ADVERTISEMENT APPROVAL & REJECTION WORKFLOW');
  console.log('================================================================');

  // 8.1 Non-admin attempts to moderate ad -> MUST RETURN 403 FORBIDDEN
  const rogueModerate = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${seller1Token}` },
    body: JSON.stringify({ status: 'approved' })
  });
  assert(rogueModerate.status === 403, `Expected 403 Forbidden for non-admin moderation, got ${rogueModerate.status}`);
  console.log(`   🛡️ 8.1 MODERATION BARRIER ENFORCED: Seller blocked from approving ads: HTTP 403`);

  // 8.2 Reject ad WITHOUT rejection reason -> MUST RETURN 400 BAD REQUEST
  const badReject = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'rejected' }) // missing reason!
  });
  assert(badReject.status === 400, `Expected 400 Bad Request when rejecting without reason, got ${badReject.status}`);
  console.log(`   🛡️ 8.2 REJECTION REASON VALIDATION: Blocked empty reason with HTTP 400: "${badReject.data.message}"`);

  // 8.3 Reject ad WITH explanatory reason
  const rejectionReason = 'Please upload a photo of the Apple receipt and clear battery health screenshot.';
  const rejectRes = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'rejected',
      rejection_reason: rejectionReason
    })
  });
  assert(rejectRes.status === 200, 'Rejection failed');
  console.log(`   ✅ 8.3 Admin rejected Ad #${testAdId} with feedback reason: "${rejectionReason}"`);

  // 8.4 Seller reviews rejection feedback in My Ads
  const sellerAdsRes = await apiRequest('/advertisements/my-ads?status=rejected', {
    headers: { Authorization: `Bearer ${seller1Token}` }
  });
  assert(sellerAdsRes.status === 200, 'Seller my-ads fetch failed');
  const rejectedAd = sellerAdsRes.data.advertisements.find((a: any) => a.id === testAdId);
  assert(rejectedAd, 'Rejected ad must appear in seller rejected tab');
  assert(rejectedAd.rejection_reason === rejectionReason, 'Rejection reason must match admin input');
  console.log(`   ✅ 8.4 Feedback verified in Seller My Ads: "${rejectedAd.rejection_reason}"`);

  // 8.5 Admin approves ad
  const approveRes = await apiRequest(`/admin/advertisements/${testAdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
  assert(approveRes.status === 200, 'Approval failed');
  console.log(`   ✅ 8.5 Admin approved Ad #${testAdId}: "${approveRes.data.message}"`);

  // 8.6 Verify ad now appears in public marketplace
  const publicCheck = await apiRequest(`/advertisements?search=M3 Max`);
  assert(publicCheck.status === 200, 'Public search failed');
  const nowVisible = publicCheck.data.advertisements.some((a: any) => a.id === testAdId);
  assert(nowVisible, 'Approved listing must immediately appear in public search!');
  console.log(`   🎉 8.6 Newly approved Ad #${testAdId} is now live and discoverable in the public marketplace!`);
}

async function testModule9ReportsAndComplaints() {
  console.log('\n================================================================');
  console.log('📦 MODULE 9: REPORTS & COMPLAINTS');
  console.log('================================================================');

  // 9.1 Buyer submits report on an advertisement
  const repRes = await apiRequest('/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      advertisement_id: testAdId,
      reason: 'counterfeit',
      description: 'Requesting admin to verify authenticity of serial number.'
    })
  });
  assert(repRes.status === 201, 'Report filing failed');
  testReportId = repRes.data.reportId;
  assert(testReportId > 0, 'Report must return valid ID');
  console.log(`   ✅ 9.1 Buyer filed safety report #${testReportId}: "${repRes.data.message}"`);

  // 9.2 Admin views complaints
  const adminReports = await apiRequest('/admin/reports', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminReports.status === 200, 'Admin reports fetch failed');
  assert(adminReports.data.reports.some((r: any) => r.id === testReportId), 'Report must appear in admin queue');
  console.log(`   ✅ 9.2 Admin fetched reports center: ${adminReports.data.reports.length} pending complaints`);

  // 9.3 Admin resolves complaint with notes
  const resolveRes = await apiRequest(`/admin/reports/${testReportId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'resolved',
      admin_notes: 'Serial number verified against Apple database; listing verified authentic.'
    })
  });
  assert(resolveRes.status === 200, 'Report resolution failed');
  console.log(`   ✅ 9.3 Admin resolved report #${testReportId}: "${resolveRes.data.message}"`);
}

async function testModule10FeaturedAndAdminStats() {
  console.log('\n================================================================');
  console.log('📦 MODULE 10: FEATURED ADVERTISEMENTS & ADMIN STATISTICS');
  console.log('================================================================');

  // 10.1 Admin toggles featured status for Ad
  const featRes = await apiRequest(`/admin/advertisements/${testAdId}/featured`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(featRes.status === 200, 'Toggle featured failed');
  assert(featRes.data.is_featured === true, 'Listing must be featured');
  console.log(`   ✅ 10.1 Admin featured Ad #${testAdId}: "${featRes.data.message}"`);

  // 10.2 Public featured ads endpoint
  const pubFeatured = await apiRequest('/advertisements/featured');
  assert(pubFeatured.status === 200, 'Featured ads fetch failed');
  assert(pubFeatured.data.featured.some((a: any) => a.id === testAdId), 'Ad must appear in featured carousel');
  console.log(`   ✅ 10.2 Verified in public featured carousel: ${pubFeatured.data.featured.length} featured items`);

  // 10.3 Admin dashboard stats & KPIs
  const statsRes = await apiRequest('/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(statsRes.status === 200, 'Stats fetch failed');
  assert(typeof statsRes.data.stats.users.total_users === 'number', 'Must include user stats');
  assert(typeof statsRes.data.stats.advertisements.total_ads === 'number', 'Must include ad stats');
  assert(Array.isArray(statsRes.data.categoryBreakdown), 'Must include category breakdown');
  console.log(`   ✅ 10.3 Admin Dashboard KPIs:`);
  console.log(`      • Total Users:       ${statsRes.data.stats.users.total_users} (Active: ${statsRes.data.stats.users.active_users})`);
  console.log(`      • Total Ads:         ${statsRes.data.stats.advertisements.total_ads} (Approved: ${statsRes.data.stats.advertisements.approved_ads}, Pending: ${statsRes.data.stats.advertisements.pending_ads})`);
  console.log(`      • Featured Listings: ${statsRes.data.stats.advertisements.featured_ads}`);
  console.log(`      • Total Complaints:  ${statsRes.data.stats.reports.total_reports}`);
}

async function testModule11AdministrativeLogs() {
  console.log('\n================================================================');
  console.log('📦 MODULE 11: ADMINISTRATIVE ACTIVITY LOGS');
  console.log('================================================================');

  // 11.1 Admin fetches audit logs
  const logsRes = await apiRequest('/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(logsRes.status === 200, 'Logs fetch failed');
  assert(Array.isArray(logsRes.data.logs), 'Logs must be an array');
  assert(logsRes.data.logs.length > 0, 'Audit logs must record actions');

  const actionTypes = new Set(logsRes.data.logs.map((l: any) => l.action_type));
  assert(actionTypes.has('approve_ad'), 'Audit logs must capture approve_ad actions');
  assert(actionTypes.has('reject_ad'), 'Audit logs must capture reject_ad actions');

  console.log(`   ✅ 11.1 Audit trail retrieved: ${logsRes.data.logs.length} logged administrative events`);
  console.log(`   Action types recorded: [${Array.from(actionTypes).join(', ')}]`);
  console.log(`   Recent log entry: "${logsRes.data.logs[0].details}" by ${logsRes.data.logs[0].admin_name} at ${logsRes.data.logs[0].created_at}`);
}

async function runMilestone3TestSuite() {
  console.log('================================================================');
  console.log('🚀 NEIGHSHOP GLOBAL — MILESTONE 3: REST API COMPREHENSIVE SUITE');
  console.log('Testing 11 Modules in Strict Sequential Order');
  console.log('================================================================');

  try {
    await testHealthEndpoint();
    await testModule1Auth();
    await testModule2Categories();
    await testModule3AdCrudAndOwnership();
    await testModule4SearchFilteringSorting();
    await testModule5FavouritesAndEnquiries();
    await testModule6SellerDashboard();
    await testModule7AdminUserManagement();
    await testModule8AdApprovalWorkflow();
    await testModule9ReportsAndComplaints();
    await testModule10FeaturedAndAdminStats();
    await testModule11AdministrativeLogs();

    console.log('\n================================================================');
    console.log('🎉 ALL 11 REST API MODULES VERIFIED SUCCESSFULLY WITH 100% PASS');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runMilestone3TestSuite();
