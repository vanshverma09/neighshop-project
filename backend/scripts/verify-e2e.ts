const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runE2ETest() {
  console.log('===============================================================');
  console.log('🚀 NEIGHSHOP MARKETPLACE: FULL E2E WORKFLOW VERIFICATION');
  console.log('===============================================================\n');

  try {
    // 1. SELLER AUTHENTICATION
    console.log('1️⃣  Authenticating as Seller (seller@neighshop.com)...');
    const sellerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'seller@neighshop.com',
        password: 'Seller@123'
      })
    });
    const sellerToken = sellerLogin.token;
    console.log(`   ✅ Seller authenticated: ${sellerLogin.user.name} (Role: ${sellerLogin.user.role})`);

    // 2. SELLER POSTS A NEW ADVERTISEMENT
    console.log('\n2️⃣  Posting a new classified advertisement as Seller...');
    const newAdRes = await request('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        title: 'Sony PlayStation 5 Digital Edition with DualSense Controller',
        description: 'Mint condition PS5 Digital Edition with 825GB SSD, white DualSense controller, and original box.',
        price: 38500,
        category_id: 1,
        product_condition: 'used_like_new',
        location: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        contact_phone: '+91 98201 12345',
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600']
      })
    });
    const adId = newAdRes.advertisement.id;
    console.log(`   ✅ Ad published with ID #${adId}. Initial moderation status: [${newAdRes.advertisement.status}]`);

    // 3. ADMIN AUTHENTICATION
    console.log('\n3️⃣  Authenticating as Administrator (admin@neighshop.com)...');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@neighshop.com',
        password: 'Admin@123'
      })
    });
    const adminToken = adminLogin.token;
    console.log(`   ✅ Admin authenticated: ${adminLogin.user.name} (Role: ${adminLogin.user.role})`);

    // 4. ADMIN MODERATION: REJECT WITH FEEDBACK REASON
    console.log(`\n4️⃣  Admin moderates Ad #${adId}: rejects with specific reason...`);
    const rejectionReason = 'Please upload a photo showing the serial number and original purchase receipt.';
    const rejectRes = await request(`/admin/advertisements/${adId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'rejected',
        rejection_reason: rejectionReason
      })
    });
    console.log(`   ✅ Admin moderation response: "${rejectRes.message}"`);

    // 5. SELLER REVIEWS FEEDBACK IN MY ADS HUB
    console.log('\n5️⃣  Seller checks rejection feedback in Seller Mobile Ads Hub...');
    const sellerAdsRes = await request('/advertisements/seller/me?status=rejected', {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const rejectedAd = sellerAdsRes.advertisements.find((a: any) => a.id === adId);
    console.log(`   ✅ Feedback delivered to seller: "${rejectedAd.rejection_reason}"`);

    // 6. SELLER RESUBMITS & ADMIN APPROVES
    console.log(`\n6️⃣  Seller updates Ad #${adId} and Admin approves it...`);
    await request(`/advertisements/${adId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        description: 'Mint condition PS5 Digital Edition with receipt and serial number photos added.',
        status: 'pending'
      })
    });

    const approveRes = await request(`/admin/advertisements/${adId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    console.log(`   ✅ Ad #${adId} approved by Admin: "${approveRes.message}"`);

    // 7. BUYER DISCOVERS AD, WISHLISTS & SENDS INQUIRY
    console.log('\n7️⃣  Buyer (buyer@neighshop.com) logs in, saves ad to wishlist, and sends inquiry...');
    const buyerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'buyer@neighshop.com',
        password: 'Buyer@123'
      })
    });
    const buyerToken = buyerLogin.token;

    const wishRes = await request(`/wishlist/${adId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    console.log(`   ✅ Buyer saved ad #${adId}: ${wishRes.message}`);

    const inquiryRes = await request('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: adId,
        message: 'Hi Vansh, is this PS5 still available? Can we do physical testing in Bandra tomorrow?',
        phone: '+91 98190 54321'
      })
    });
    console.log(`   ✅ Buyer inquiry sent with ID #${inquiryRes.enquiry.id}`);

    // 8. SELLER INQUIRIES HUB & REPLY
    console.log('\n8️⃣  Seller receives inquiry in seller messages hub and marks it replied...');
    const inquiriesRes = await request('/enquiries/seller', {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const received = inquiriesRes.enquiries.find((e: any) => e.advertisement_id === adId);
    console.log(`   ✅ Seller found inquiry from ${received.buyer_name}: "${received.message}"`);

    const replyRes = await request(`/enquiries/${received.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ status: 'replied' })
    });
    console.log(`   ✅ Inquiry marked replied: "${replyRes.message}"`);

    console.log('\n===============================================================');
    console.log('🎉 ALL 8 E2E WORKFLOW STAGES PASSED FLAWLESSLY WITH ZERO ERRORS');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ E2E Test Failed:', err.message);
    process.exit(1);
  }
}

runE2ETest();
