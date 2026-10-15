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

const runId = Date.now().toString().slice(-4);
let buyerToken = '';
let buyerUser: any = null;
let sellerToken = '';
let sellerId = 0;
let adminToken = '';
let sampleApprovedAdId = 0;
let testReportId = 0;

async function runMilestone5Verification() {
  console.log('====================================================================');
  console.log('📱  NEIGHSHOP GLOBAL: MILESTONE 5 USER MOBILE APPLICATION VERIFICATION');
  console.log('Verifying Buyer Mobile Workflows, Public Isolation & MySQL Persistence');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // STAGE 1: REGISTRATION, LOGIN, PROFILE & SESSION SECURITY
    // -------------------------------------------------------------
    console.log('1️⃣  VERIFYING USER REGISTRATION, LOGIN & PROFILE MANAGEMENT...');

    const testEmail = `buyer_m5_${runId}@neighshop.com`;
    const testPassword = 'TestPassword@123';

    // 1.1 Buyer Registration
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Priya TestBuyer ${runId}`,
        email: testEmail,
        password: testPassword,
        phone: '+91 98200 99881',
        role: 'buyer'
      })
    });
    assert(regRes.status === 201, `Buyer registration failed: ${JSON.stringify(regRes.data)}`);
    assert(regRes.data.token, 'Registration must return auth token');
    assert(regRes.data.user.role === 'buyer', 'Registered role must be buyer');
    console.log(`   ✅ 1.1 Registered buyer: ${testEmail} (ID: ${regRes.data.user.id}, Role: ${regRes.data.user.role})`);

    // 1.2 Invalid Login Attempt
    const badLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword' })
    });
    assert(badLogin.status === 401, 'Bad credentials must return 401 Unauthorized');
    console.log(`   🛡️ 1.2 Rejected incorrect password: HTTP ${badLogin.status} "${badLogin.data.message}"`);

    // 1.3 Valid Buyer Login
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert(loginRes.status === 200, 'Valid login failed');
    buyerToken = loginRes.data.token;
    buyerUser = loginRes.data.user;
    console.log(`   ✅ 1.3 Authenticated buyer: "${buyerUser.name}" (Token issued)`);

    // 1.4 Get Profile
    const profileRes = await apiRequest('/auth/profile', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(profileRes.status === 200, 'Get profile failed');
    assert(profileRes.data.user.email === testEmail, 'Profile email mismatch');
    assert(!profileRes.data.user.password_hash, 'SECURITY: Password hash must NOT be returned in profile');
    console.log(`   ✅ 1.4 Profile retrieved: Name="${profileRes.data.user.name}", Role="${profileRes.data.user.role}"`);

    // 1.5 Update Profile
    const updatedName = `Priya Sharma Verified ${runId}`;
    const updateRes = await apiRequest('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        name: updatedName,
        phone: '+91 98200 77665'
      })
    });
    assert(updateRes.status === 200, 'Update profile failed');
    assert(updateRes.data.user.name === updatedName, 'Updated name mismatch');
    console.log(`   ✅ 1.5 Profile updated in MySQL: "${updateRes.data.user.name}"`);

    // Setup Admin & Seller tokens for later stages
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@neighshop.com', password: 'Admin@123' })
    });
    adminToken = adminLogin.data.token;

    const sellerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'seller@neighshop.com', password: 'Seller@123' })
    });
    sellerToken = sellerLogin.data.token;
    sellerId = sellerLogin.data.user.id;

    // -------------------------------------------------------------
    // STAGE 2: PUBLIC SEARCH & STRICT LISTING ISOLATION
    // -------------------------------------------------------------
    console.log('\n2️⃣  VERIFYING PUBLIC ISOLATION & UNAPPROVED ADS FILTER...');

    // 2.1 Create a test ad in 'pending' status
    const createAdRes = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        title: `Pending Ad ${runId} (Must Stay Hidden)`,
        description: 'This is an unapproved advertisement that must never appear in public search.',
        price: 45000,
        category_id: 1,
        product_condition: 'used_like_new',
        city: 'Mumbai',
        state: 'Maharashtra',
        imageUrls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800']
      })
    });
    assert(createAdRes.status === 201, 'Ad creation failed');
    const pendingAdId = createAdRes.data.adId || createAdRes.data.advertisementId;
    console.log(`   Created test pending ad #${pendingAdId} (Initial status: [pending])`);

    // 2.2 Verify that public feed strictly excludes this pending ad
    const publicFeed = await apiRequest('/advertisements?limit=100');
    assert(publicFeed.status === 200, 'Public feed fetch failed');
    const foundPending = publicFeed.data.advertisements.find((a: any) => a.id === pendingAdId);
    assert(!foundPending, 'SECURITY VIOLATION: Pending listing appeared in public marketplace feed!');
    console.log(`   🛡️ 2.1 PUBLIC ISOLATION CONFIRMED: Pending Ad #${pendingAdId} is completely hidden from public feed`);

    // 2.3 Verify 100% of public listings have status = 'approved'
    const nonApproved = publicFeed.data.advertisements.filter((a: any) => a.status !== 'approved');
    assert(nonApproved.length === 0, 'All public listings must have status = approved');
    console.log(`   ✅ 2.2 Verified ${publicFeed.data.advertisements.length} public listings: 100% have status = "approved"`);

    // Cache an approved ad ID owned by seed seller for testing details, wishlist, enquiries
    const sellerAd = publicFeed.data.advertisements.find((a: any) => a.seller_id === sellerId) || publicFeed.data.advertisements[0];
    sampleApprovedAdId = sellerAd?.id || 1;

    // -------------------------------------------------------------
    // STAGE 3: CATEGORY BROWSING & TAXONOMY HIERARCHY
    // -------------------------------------------------------------
    console.log('\n3️⃣  VERIFYING BACKEND-DRIVEN CATEGORIES & TAXONOMY...');

    const catRes = await apiRequest('/categories');
    assert(catRes.status === 200, 'Categories fetch failed');
    assert(catRes.data.categories.length >= 7, 'Must have at least 7 primary categories');
    console.log(`   ✅ 3.1 Retrieved ${catRes.data.categories.length} primary categories`);

    // Verify subcategories and ad counts
    const firstCat = catRes.data.categories[0];
    assert(firstCat.name && firstCat.slug && firstCat.icon, 'Category must have name, slug and icon');
    assert(Array.isArray(firstCat.subcategories), 'Category must contain subcategories array');
    console.log(`   ✅ 3.2 Category "${firstCat.name}" has ${firstCat.subcategories.length} subcategories and ${firstCat.ad_count || 0} approved ads`);

    // Fetch category by slug
    const catSlugRes = await apiRequest(`/categories/${firstCat.slug}`);
    assert(catSlugRes.status === 200, 'Category by slug failed');
    assert(catSlugRes.data.category.id === firstCat.id, 'Category slug mismatch');
    console.log(`   ✅ 3.3 Resolved slug "/categories/${firstCat.slug}" -> "${catSlugRes.data.category.name}"`);

    // -------------------------------------------------------------
    // STAGE 4: MULTI-CRITERIA SEARCH, FILTERING, SORTING & PAGINATION
    // -------------------------------------------------------------
    console.log('\n4️⃣  VERIFYING SEARCH, FILTERS, SORTING & PAGINATION...');

    // 4.1 Search by keyword
    const approvedSample = publicFeed.data.advertisements[0];
    const searchWord = approvedSample.title.split(' ')[0];
    const searchRes = await apiRequest(`/advertisements?search=${encodeURIComponent(searchWord)}`);
    assert(searchRes.status === 200, 'Keyword search failed');
    assert(searchRes.data.advertisements.length > 0, `Search for "${searchWord}" must return matches`);
    console.log(`   ✅ 4.1 Keyword search ("${searchWord}"): Found ${searchRes.data.advertisements.length} listings`);

    // 4.2 Location / City filter
    const cityRes = await apiRequest('/advertisements?city=Mumbai');
    assert(cityRes.status === 200, 'City filter failed');
    assert(cityRes.data.advertisements.every((a: any) => a.city.toLowerCase() === 'mumbai'), 'All ads must be in Mumbai');
    console.log(`   ✅ 4.2 City filter ("Mumbai"): Found ${cityRes.data.advertisements.length} matching listings in Mumbai`);

    // 4.3 Price Range filter
    const priceRes = await apiRequest('/advertisements?minPrice=20000&maxPrice=100000');
    assert(priceRes.status === 200, 'Price filter failed');
    assert(
      priceRes.data.advertisements.every((a: any) => Number(a.price) >= 20000 && Number(a.price) <= 100000),
      'All listings must fall within price bounds'
    );
    console.log(`   ✅ 4.3 Price range (₹20,000 - ₹1,00,000): Found ${priceRes.data.advertisements.length} matching listings`);

    // 4.4 Condition filter
    const condRes = await apiRequest('/advertisements?condition=used_like_new');
    assert(condRes.status === 200, 'Condition filter failed');
    assert(condRes.data.advertisements.every((a: any) => a.product_condition === 'used_like_new'), 'All ads must be used_like_new');
    console.log(`   ✅ 4.4 Condition filter ("used_like_new"): Found ${condRes.data.advertisements.length} listings`);

    // 4.5 Sorting (Price: Low to High)
    const sortRes = await apiRequest('/advertisements?sort=price_asc&limit=5');
    assert(sortRes.status === 200, 'Sort price_asc failed');
    const prices = sortRes.data.advertisements.map((a: any) => Number(a.price));
    for (let i = 0; i < prices.length - 1; i++) {
      assert(prices[i] <= prices[i + 1], 'Prices must be sorted in ascending order');
    }
    console.log(`   ✅ 4.5 Sorting (Price Ascending): [${prices.map((p: number) => '₹' + p).join(' <= ')}]`);

    // 4.6 Pagination
    const pageRes = await apiRequest('/advertisements?page=1&limit=3');
    assert(pageRes.status === 200, 'Pagination failed');
    assert(pageRes.data.page === 1, 'Page must be 1');
    assert(pageRes.data.advertisements.length === 3, 'Must return exactly 3 items');
    assert(pageRes.data.total > 0, 'Total count must be positive');
    console.log(`   ✅ 4.6 Pagination: Page 1 of ${pageRes.data.totalPages} (Total approved ads: ${pageRes.data.total})`);

    // -------------------------------------------------------------
    // STAGE 5: FEATURED ADVERTISEMENTS CAROUSEL
    // -------------------------------------------------------------
    console.log('\n5️⃣  VERIFYING FEATURED ADVERTISEMENTS CAROUSEL...');

    const featuredRes = await apiRequest('/advertisements/featured');
    assert(featuredRes.status === 200, 'Featured ads fetch failed');
    assert(featuredRes.data.featured.length > 0, 'Featured ads must contain listings');
    assert(
      featuredRes.data.featured.every((a: any) => a.is_featured && a.status === 'approved'),
      'All featured ads must be marked as featured and approved'
    );
    console.log(`   ✅ 5.1 Retrieved ${featuredRes.data.featured.length} featured carousel listings:`);
    featuredRes.data.featured.slice(0, 3).forEach((a: any) => {
      console.log(`      • [⭐ FEATURED] "${a.title}" — ₹${Number(a.price).toLocaleString('en-IN')}`);
    });

    // -------------------------------------------------------------
    // STAGE 6: PRODUCT DETAILS, GALLERY & SELLER PRIVACY
    // -------------------------------------------------------------
    console.log('\n6️⃣  VERIFYING PRODUCT DETAILS & SELLER PRIVACY GUARD...');

    const detailRes = await apiRequest(`/advertisements/${sampleApprovedAdId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(detailRes.status === 200, 'Product detail fetch failed');
    const adDetail = detailRes.data.advertisement;
    assert(adDetail.id === sampleApprovedAdId, 'Ad ID mismatch');
    assert(Array.isArray(adDetail.images) && adDetail.images.length > 0, 'Images array must contain photos');
    console.log(`   ✅ 6.1 Listing #${adDetail.id} ("${adDetail.title}") has ${adDetail.images.length} photos attached`);

    // Seller information verification
    assert(adDetail.seller_name, 'Seller name must be provided');
    assert(adDetail.seller_rating !== undefined, 'Seller rating must be provided');
    assert(!adDetail.seller_password, 'SECURITY: Seller password must NEVER be exposed');
    assert(!adDetail.password_hash, 'SECURITY: Password hash must NEVER be exposed');
    console.log(`   ✅ 6.2 Seller card verified: "${adDetail.seller_name}" (Rating: ${adDetail.seller_rating} ⭐, Deals: ${adDetail.seller_sales || 1})`);
    console.log(`   🛡️ 6.3 SELLER PRIVACY VERIFIED: No sensitive authentication credentials exposed`);

    // -------------------------------------------------------------
    // STAGE 7: FAVOURITES / WISHLIST DATABASE PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n7️⃣  VERIFYING WISHLIST DATABASE PERSISTENCE...');

    // 7.1 Toggle bookmark ON
    const toggleOnRes = await apiRequest(`/wishlist/${sampleApprovedAdId}/toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(toggleOnRes.status === 200, 'Wishlist toggle failed');
    assert(toggleOnRes.data.is_favourited === true, 'is_favourited must be true');
    console.log(`   ✅ 7.1 Saved Ad #${sampleApprovedAdId} to wishlist: is_favourited=true`);

    // 7.2 Fetch Wishlist
    const wishlistRes = await apiRequest('/wishlist', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(wishlistRes.status === 200, 'Get wishlist failed');
    const inWishlist = wishlistRes.data.wishlist.some((a: any) => a.id === sampleApprovedAdId);
    assert(inWishlist, 'Saved ad must be returned in buyer wishlist');
    console.log(`   ✅ 7.2 Wishlist verified: ${wishlistRes.data.wishlist.length} saved items`);

    // 7.3 Toggle bookmark OFF
    const toggleOffRes = await apiRequest(`/wishlist/${sampleApprovedAdId}/toggle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(toggleOffRes.status === 200, 'Wishlist toggle OFF failed');
    assert(toggleOffRes.data.is_favourited === false, 'is_favourited must be false');
    console.log(`   ✅ 7.3 Removed Ad #${sampleApprovedAdId} from wishlist: is_favourited=false`);

    // -------------------------------------------------------------
    // STAGE 8: BUYER ENQUIRIES & SELLER RESPONSE CONVERSATION
    // -------------------------------------------------------------
    console.log('\n8️⃣  VERIFYING BUYER ENQUIRIES & SELLER REPLY THREADS...');

    // 8.1 Prevent Self-Enquiry (seller cannot enquire on own ad)
    const selfEnquiry = await apiRequest('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        advertisement_id: sampleApprovedAdId,
        message: 'Can I buy my own item?'
      })
    });
    // In seed data Ad #1 belongs to seller #2
    if (sampleApprovedAdId === 1) {
      assert(selfEnquiry.status === 400, 'Self enquiry must return 400 Bad Request');
      console.log(`   🛡️ 8.1 SELF-ENQUIRY BARRIER: Blocked seller inquiring on own ad: HTTP ${selfEnquiry.status} "${selfEnquiry.data.message}"`);
    }

    // 8.2 Buyer sends enquiry
    const enquiryMsg = `Hi, is Ad #${sampleApprovedAdId} available for in-person inspection in Mumbai today? (Test ${runId})`;
    const createEnqRes = await apiRequest('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: sampleApprovedAdId,
        message: enquiryMsg
      })
    });
    assert(createEnqRes.status === 201, 'Enquiry submission failed');
    const enquiryId = createEnqRes.data.enquiryId;
    console.log(`   ✅ 8.2 Buyer submitted Enquiry #${enquiryId}: "${enquiryMsg}"`);

    // 8.3 Buyer views inquiries hub
    const buyerEnqRes = await apiRequest('/enquiries/buyer', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(buyerEnqRes.status === 200, 'Buyer enquiries fetch failed');
    const buyerEnq = buyerEnqRes.data.enquiries.find((e: any) => e.id === enquiryId);
    assert(buyerEnq, 'Enquiry must appear in buyer inquiries hub');
    assert(buyerEnq.status === 'pending', 'Initial enquiry status must be pending');
    console.log(`   ✅ 8.3 Buyer verified conversation thread #${enquiryId} (Status: [${buyerEnq.status}])`);

    // 8.4 Seller replies to enquiry
    const replyText = `Yes, physical testing is welcome at our Bandra location between 4 PM and 7 PM today. (Test ${runId})`;
    const replyRes = await apiRequest(`/enquiries/${enquiryId}/reply`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ reply: replyText })
    });
    assert(replyRes.status === 200, 'Seller reply failed');
    console.log(`   ✅ 8.4 Seller replied to Enquiry #${enquiryId}: "${replyText}"`);

    // 8.5 Buyer confirms seller response in Chats
    const updatedBuyerEnqRes = await apiRequest('/enquiries/buyer', {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const updatedEnq = updatedBuyerEnqRes.data.enquiries.find((e: any) => e.id === enquiryId);
    assert(updatedEnq && updatedEnq.reply === replyText, 'Buyer must see seller reply');
    assert(updatedEnq.status === 'responded' || updatedEnq.status === 'replied', 'Enquiry status must now be responded/replied');
    console.log(`   💬 8.5 CONVERSATION COMPLETE: Buyer received reply from seller (Status: [${updatedEnq.status}])`);

    // -------------------------------------------------------------
    // STAGE 9: SAFETY COMPLAINT & REPORT ADVERTISEMENT
    // -------------------------------------------------------------
    console.log('\n9️⃣  VERIFYING SAFETY COMPLAINT & REPORT ADVERTISEMENT...');

    const reportDesc = `Suspected fraudulent seller: refuses to meet in a public location and requested gift cards. (Test ${runId})`;
    const reportRes = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: sampleApprovedAdId,
        reason: 'fraud',
        description: reportDesc
      })
    });
    assert(reportRes.status === 201, 'Report submission failed');
    testReportId = reportRes.data.reportId;
    console.log(`   ✅ 9.1 Buyer filed safety complaint #${testReportId} against Ad #${sampleApprovedAdId}`);

    // Verify report appears in Admin Reports Center
    const adminReportsRes = await apiRequest('/admin/reports?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminReportsRes.status === 200, 'Admin reports fetch failed');
    const foundReport = adminReportsRes.data.reports.find((r: any) => r.id === testReportId);
    assert(foundReport, 'Report must be logged in database and visible to admin moderation');
    console.log(`   🛡️ 9.2 ADMIN AUDIT CONFIRMED: Report #${testReportId} queued for investigation (Reporter: "${foundReport.reporter_name}")`);

    console.log('\n====================================================================');
    console.log('🎉 ALL MILESTONE 5 USER MOBILE APPLICATION ACCEPTANCE CRITERIA PASSED!');
    console.log('====================================================================\n');
  } catch (err: any) {
    console.error('\n❌ MILESTONE 5 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runMilestone5Verification();
