import { Blob } from 'buffer';

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

interface TestRecord {
  id: number;
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  evidence: string;
}

const testRecords: TestRecord[] = [];
let testCounter = 0;

function recordTest(category: string, name: string, passed: boolean, evidence: string) {
  testCounter++;
  const status = passed ? 'PASSED' : 'FAILED';
  testRecords.push({ id: testCounter, category, name, status, evidence });
  if (passed) {
    console.log(`   ✅ [${testCounter}] ${name} (${evidence})`);
  } else {
    console.error(`   ❌ [${testCounter}] ${name} (${evidence})`);
    throw new Error(`Test #${testCounter} FAILED: ${name} - ${evidence}`);
  }
}

const runId = Date.now().toString().slice(-4);
let seller1Token = '';
let seller1User: any = null;
let seller2Token = '';
let seller2User: any = null;
let buyerToken = '';
let buyerUser: any = null;
let adminToken = '';
let adminUser: any = null;

let approvedAdId = 0;
let rejectedAdId = 0;
let enquiryId = 0;
let reportId = 0;

async function runMilestone7IntegrationQA() {
  console.log('====================================================================');
  console.log('🏪  NEIGHSHOP GLOBAL: MILESTONE 7 END-TO-END INTEGRATION & QA VERIFICATION');
  console.log('Verifying Full 9-Step Lifecycle, Security Guards & 26 Negative Cases');
  console.log('====================================================================\n');

  try {
    // ========================================================================
    // PHASE 1: THE COMPLETE 9-STEP USER-TO-SELLER-TO-ADMIN LIFECYCLE
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 PHASE 1: COMPLETE 9-STEP MARKETPLACE WORKFLOW VERIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ------------------------------------------------------------------------
    // STEP 1: Seller registers and creates an advertisement
    // ------------------------------------------------------------------------
    console.log('\n1️⃣  STEP 1: Seller registers and creates an advertisement...');
    const sellerEmail = `merchant_qa_${runId}@neighshop.com`;
    const sellerRegRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Vansh Merchant QA ${runId}`,
        email: sellerEmail,
        password: 'MerchantPass@123',
        phone: '+91 98201 11222',
        role: 'seller',
        businessName: `Verma Electronics Hub ${runId}`,
        city: 'Mumbai',
        state: 'Maharashtra',
      }),
    });
    recordTest(
      'Lifecycle Step 1',
      'Seller Registration',
      sellerRegRes.status === 201 && sellerRegRes.data.user.role === 'seller',
      `HTTP ${sellerRegRes.status}, User ID #${sellerRegRes.data?.user?.id}, Role: ${sellerRegRes.data?.user?.role}`
    );
    seller1Token = sellerRegRes.data.token;
    seller1User = sellerRegRes.data.user;

    // Create Advertisement 1
    const createAd1Res = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        title: `Sony Bravia 55-inch 4K OLED Smart TV (QA ${runId})`,
        description: 'Mint condition OLED display with acoustic surface audio and remote. Complete in retail box.',
        price: 85999,
        category_id: 1, // Electronics & Appliances
        product_condition: 'used_like_new',
        location: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        contact_phone: '+91 98201 11222',
        images: [
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
          'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
        ],
      }),
    });
    approvedAdId = createAd1Res.data.advertisement.id;
    recordTest(
      'Lifecycle Step 1',
      'Seller Creates Advertisement #1',
      createAd1Res.status === 201 && approvedAdId > 0,
      `HTTP ${createAd1Res.status}, Ad ID #${approvedAdId}`
    );

    // ------------------------------------------------------------------------
    // STEP 2: The advertisement is stored in MySQL with pending status
    // ------------------------------------------------------------------------
    console.log('\n2️⃣  STEP 2: Advertisement is stored in MySQL with pending status...');
    const adStatusCheck = await apiRequest(`/advertisements/${approvedAdId}`, {
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    recordTest(
      'Lifecycle Step 2',
      'Advertisement Initial Status is Pending',
      adStatusCheck.status === 200 && adStatusCheck.data.advertisement.status === 'pending',
      `HTTP ${adStatusCheck.status}, status = [${adStatusCheck.data.advertisement.status}]`
    );

    // ------------------------------------------------------------------------
    // STEP 3: Public search does not return it
    // ------------------------------------------------------------------------
    console.log('\n3️⃣  STEP 3: Public search does not return pending advertisement...');
    const publicSearchRes = await apiRequest('/advertisements?search=Sony+Bravia');
    const foundInSearch = publicSearchRes.data.advertisements?.some((a: any) => a.id === approvedAdId);
    recordTest(
      'Lifecycle Step 3',
      'Pending Ad Isolated from Public Search',
      publicSearchRes.status === 200 && !foundInSearch,
      `Search returned ${publicSearchRes.data.advertisements?.length} items, Pending Ad #${approvedAdId} hidden`
    );

    // ------------------------------------------------------------------------
    // STEP 4: An authorized admin approves the advertisement
    // ------------------------------------------------------------------------
    console.log('\n4️⃣  STEP 4: Authorized admin approves the advertisement...');
    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@neighshop.com', password: 'Admin@123' }),
    });
    recordTest(
      'Lifecycle Step 4',
      'Admin Authentication',
      adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'admin',
      `HTTP ${adminLoginRes.status}, Admin: ${adminLoginRes.data.user.name}`
    );
    adminToken = adminLoginRes.data.token;
    adminUser = adminLoginRes.data.user;

    const approveRes = await apiRequest(`/admin/advertisements/${approvedAdId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    recordTest(
      'Lifecycle Step 4',
      'Admin Moderation Approval',
      approveRes.status === 200 && approveRes.data.status === 'approved',
      `HTTP ${approveRes.status}, Status updated to [${approveRes.data.status}]`
    );

    // ------------------------------------------------------------------------
    // STEP 5: The advertisement becomes visible in the user app
    // ------------------------------------------------------------------------
    console.log('\n5️⃣  STEP 5: Advertisement becomes visible in user app...');
    const userSearchRes = await apiRequest('/advertisements?search=Sony+Bravia');
    const foundApproved = userSearchRes.data.advertisements?.some((a: any) => a.id === approvedAdId);
    recordTest(
      'Lifecycle Step 5',
      'Approved Ad Visible in Public Search',
      userSearchRes.status === 200 && foundApproved === true,
      `Found Ad #${approvedAdId} in public search results`
    );

    const publicDetailRes = await apiRequest(`/advertisements/${approvedAdId}`);
    recordTest(
      'Lifecycle Step 5',
      'Approved Ad Details Accessible to Public',
      publicDetailRes.status === 200 && publicDetailRes.data.advertisement.title.includes('Sony Bravia'),
      `HTTP ${publicDetailRes.status}, Title: "${publicDetailRes.data.advertisement.title}"`
    );

    // ------------------------------------------------------------------------
    // STEP 6: User opens it, adds to favourites and sends an enquiry
    // ------------------------------------------------------------------------
    console.log('\n6️⃣  STEP 6: User adds to favourites and sends an enquiry...');
    const buyerEmail = `buyer_qa_${runId}@neighshop.com`;
    const buyerRegRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Priya Sharma QA ${runId}`,
        email: buyerEmail,
        password: 'BuyerPassword@123',
        phone: '+91 98190 33444',
        role: 'buyer',
      }),
    });
    buyerToken = buyerRegRes.data.token;
    buyerUser = buyerRegRes.data.user;
    recordTest(
      'Lifecycle Step 6',
      'Buyer User Registration',
      buyerRegRes.status === 201 && buyerRegRes.data.user.role === 'buyer',
      `HTTP ${buyerRegRes.status}, Buyer ID #${buyerUser.id}`
    );

    // Toggle favourite
    const favRes = await apiRequest(`/favourites/${approvedAdId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Lifecycle Step 6',
      'User Adds Ad to Favourites',
      favRes.status === 200 && favRes.data.is_favourited === true,
      `HTTP ${favRes.status}, is_favourited = ${favRes.data.is_favourited}`
    );

    // Verify in favourites list
    const favListRes = await apiRequest('/favourites', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const inFavList = favListRes.data.wishlist?.some((a: any) => a.id === approvedAdId);
    recordTest(
      'Lifecycle Step 6',
      'Ad Persisted in User Favourites List',
      favListRes.status === 200 && inFavList === true,
      `User has ${favListRes.data.total} favourite(s), Ad #${approvedAdId} confirmed`
    );

    // Send Enquiry
    const enquiryMsg = `Hi Vansh, is this Sony Bravia OLED available for physical inspection in Andheri? (QA ${runId})`;
    const enquiryRes = await apiRequest('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: approvedAdId,
        message: enquiryMsg,
      }),
    });
    enquiryId = enquiryRes.data.enquiryId || enquiryRes.data.enquiry?.id;
    recordTest(
      'Lifecycle Step 6',
      'Buyer Sends Enquiry to Seller',
      enquiryRes.status === 201 && enquiryId > 0,
      `HTTP ${enquiryRes.status}, Enquiry ID #${enquiryId}`
    );

    // ------------------------------------------------------------------------
    // STEP 7: Seller sees the enquiry and responds
    // ------------------------------------------------------------------------
    console.log('\n7️⃣  STEP 7: Seller sees the enquiry and responds...');
    const sellerEnquiriesRes = await apiRequest('/enquiries/seller', {
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    const foundEnquiry = sellerEnquiriesRes.data.enquiries?.find((e: any) => e.id === enquiryId);
    recordTest(
      'Lifecycle Step 7',
      'Seller Receives Enquiry in Leads Hub',
      sellerEnquiriesRes.status === 200 && Boolean(foundEnquiry),
      `Found lead from "${foundEnquiry?.buyer_name}": "${foundEnquiry?.message?.slice(0, 40)}..."`
    );

    // Seller replies
    const replyText = `Hello Priya! Yes, inspection is welcome between 3 PM and 6 PM at our store in Andheri. (QA ${runId})`;
    const replyRes = await apiRequest(`/enquiries/${enquiryId}/reply`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({ reply: replyText }),
    });
    recordTest(
      'Lifecycle Step 7',
      'Seller Dispatches Reply to Buyer',
      replyRes.status === 200,
      `HTTP ${replyRes.status}: "${replyRes.data.message}"`
    );

    // Buyer receives reply
    const buyerEnquiriesRes = await apiRequest('/enquiries/buyer', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const repliedEnquiry = buyerEnquiriesRes.data.enquiries?.find((e: any) => e.id === enquiryId);
    recordTest(
      'Lifecycle Step 7',
      'Buyer Receives Seller Response in Inbox',
      buyerEnquiriesRes.status === 200 && repliedEnquiry?.reply?.includes('inspection is welcome'),
      `Status: [${repliedEnquiry?.status}], Reply: "${repliedEnquiry?.reply?.slice(0, 45)}..."`
    );

    // ------------------------------------------------------------------------
    // STEP 8: User submits a report and admin reviews it
    // ------------------------------------------------------------------------
    console.log('\n8️⃣  STEP 8: User submits a report and admin reviews it...');
    const reportRes = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: approvedAdId,
        reason: 'duplicate',
        description: `Suspected duplicate post of existing listing across multiple categories (QA ${runId}).`,
      }),
    });
    reportId = reportRes.data.reportId;
    recordTest(
      'Lifecycle Step 8',
      'User Submits Moderation Complaint / Report',
      reportRes.status === 201 && reportId > 0,
      `HTTP ${reportRes.status}, Report ID #${reportId}`
    );

    // Admin views reports
    const adminReportsRes = await apiRequest('/admin/reports', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundReport = adminReportsRes.data.reports?.find((r: any) => r.id === reportId);
    recordTest(
      'Lifecycle Step 8',
      'Admin Discovers Report in Moderation Queue',
      adminReportsRes.status === 200 && Boolean(foundReport),
      `Report #${reportId} found: reason = "${foundReport?.reason}", reporter = "${foundReport?.reporter_name}"`
    );

    // Admin resolves report
    const updateReportRes = await apiRequest(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'resolved',
        admin_notes: `Investigated by QA Admin: verified genuine listing, not a duplicate. (QA ${runId})`,
      }),
    });
    recordTest(
      'Lifecycle Step 8',
      'Admin Resolves Complaint with Audit Notes',
      updateReportRes.status === 200,
      `HTTP ${updateReportRes.status}: "${updateReportRes.data.message}"`
    );

    // ------------------------------------------------------------------------
    // STEP 9: Admin rejects another listing and seller sees rejection reason
    // ------------------------------------------------------------------------
    console.log('\n9️⃣  STEP 9: Admin rejects another listing and seller sees rejection reason...');
    // Create Ad #2
    const createAd2Res = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        title: `Apple iPhone 15 Pro Max 256GB Titanium (QA ${runId})`,
        description: 'Brand new in sealed box. Indian retail unit with full manufacturer warranty.',
        price: 119999,
        category_id: 1, // Electronics & Appliances
        product_condition: 'new',
        location: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        contact_phone: '+91 98201 11222',
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'],
      }),
    });
    rejectedAdId = createAd2Res.data.advertisement.id;
    recordTest(
      'Lifecycle Step 9',
      'Seller Publishes Ad #2 for Moderation',
      createAd2Res.status === 201 && rejectedAdId > 0,
      `HTTP ${createAd2Res.status}, Ad ID #${rejectedAdId}`
    );

    // Admin rejects with explicit reason
    const feedbackReason = `Please provide clear photo of the original GST bill with IMEI number clearly visible. (QA ${runId})`;
    const rejectRes = await apiRequest(`/admin/advertisements/${rejectedAdId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'rejected',
        rejection_reason: feedbackReason,
      }),
    });
    recordTest(
      'Lifecycle Step 9',
      'Admin Rejects Ad #2 with Rejection Reason',
      rejectRes.status === 200 && rejectRes.data.status === 'rejected',
      `HTTP ${rejectRes.status}, status = [${rejectRes.data.status}]`
    );

    // Seller checks rejected ads in My Ads
    const sellerRejectedAdsRes = await apiRequest('/advertisements/my-ads?status=rejected', {
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    const foundRejected = sellerRejectedAdsRes.data.advertisements?.find((a: any) => a.id === rejectedAdId);
    recordTest(
      'Lifecycle Step 9',
      'Seller Views Exact Moderator Rejection Feedback',
      sellerRejectedAdsRes.status === 200 && foundRejected?.rejection_reason === feedbackReason,
      `Delivered reason: "${foundRejected?.rejection_reason}"`
    );

    // ========================================================================
    // PHASE 2: RIGOROUS NEGATIVE CASES & AUTHORIZATION GUARDS
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛡️ PHASE 2: NEGATIVE TEST CASES, INPUT VALIDATION & SECURITY BARRIERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Setup Seller 2 (for cross-seller authorization tests)
    const seller2Res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Rohan Sharma Seller 2 QA ${runId}`,
        email: `seller2_qa_${runId}@neighshop.com`,
        password: 'Password@123',
        phone: '+91 98333 44555',
        role: 'seller',
        businessName: `Rohan Automotive ${runId}`,
      }),
    });
    seller2Token = seller2Res.data.token;
    seller2User = seller2Res.data.user;

    // ------------------------------------------------------------------------
    // Group A: Invalid Input Validation
    // ------------------------------------------------------------------------
    console.log('\n--- Group A: Invalid Input Validation ---');

    // Neg 1: Missing registration fields
    const neg1Res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Empty Registration Payload',
      neg1Res.status === 400,
      `HTTP ${neg1Res.status}: "${neg1Res.data.message}"`
    );

    // Neg 2: Invalid email format
    const neg2Res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bad Email User',
        email: 'invalid-email-string-without-at-sign',
        password: 'ValidPassword@123',
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Invalid Email Address Format',
      neg2Res.status === 400,
      `HTTP ${neg2Res.status}: "${neg2Res.data.message}"`
    );

    // Neg 3: Short password
    const neg3Res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short Password User',
        email: `shortpass_${runId}@test.com`,
        password: '123',
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Weak / Short Password (< 6 chars)',
      neg3Res.status === 400,
      `HTTP ${neg3Res.status}: "${neg3Res.data.message}"`
    );

    // Neg 4: Negative price in advertisement
    const neg4Res = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        title: 'Negative Price Laptop',
        description: 'Should fail validation due to negative price value.',
        price: -5000,
        category_id: 1,
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Negative Advertisement Price',
      neg4Res.status === 400,
      `HTTP ${neg4Res.status}: "${neg4Res.data.message}"`
    );

    // Neg 5: Non-existent category ID in advertisement
    const neg5Res = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        title: 'Ghost Category Item',
        description: 'Should fail validation due to nonexistent category ID.',
        price: 2500,
        category_id: 999999,
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Nonexistent Category ID',
      neg5Res.status === 400,
      `HTTP ${neg5Res.status}: "${neg5Res.data.message}"`
    );

    // Neg 6: Missing required fields in advertisement
    const neg6Res = await apiRequest('/advertisements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        title: '',
        price: 1000,
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Missing Required Ad Fields',
      neg6Res.status === 400,
      `HTTP ${neg6Res.status}: "${neg6Res.data.message}"`
    );

    // Neg 7: Report submission without reason
    const neg7Res = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: approvedAdId,
        reason: '',
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Report Submission Without Reason',
      neg7Res.status === 400,
      `HTTP ${neg7Res.status}: "${neg7Res.data.message}"`
    );

    // Neg 8: Report submission with invalid reason enum
    const neg8Res = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: approvedAdId,
        reason: 'nonexistent_invalid_reason_string',
      }),
    });
    recordTest(
      'Negative: Input Validation',
      'Reject Report With Invalid Reason Code',
      neg8Res.status === 400,
      `HTTP ${neg8Res.status}: "${neg8Res.data.message}"`
    );

    // ------------------------------------------------------------------------
    // Group B: Unauthenticated Requests (401 Unauthorized)
    // ------------------------------------------------------------------------
    console.log('\n--- Group B: Unauthenticated Requests (401 Unauthorized) ---');

    // Neg 9: Access seller ads without token
    const neg9Res = await apiRequest('/advertisements/my-ads');
    recordTest(
      'Negative: Unauthenticated',
      'Block Unauthenticated Access to Seller Inventory',
      neg9Res.status === 401,
      `HTTP ${neg9Res.status}: "${neg9Res.data.message}"`
    );

    // Neg 10: Access admin stats without token
    const neg10Res = await apiRequest('/admin/stats');
    recordTest(
      'Negative: Unauthenticated',
      'Block Unauthenticated Access to Admin Dashboard',
      neg10Res.status === 401,
      `HTTP ${neg10Res.status}: "${neg10Res.data.message}"`
    );

    // Neg 11: Add favourite without token
    const neg11Res = await apiRequest(`/favourites/${approvedAdId}`, {
      method: 'POST',
    });
    recordTest(
      'Negative: Unauthenticated',
      'Block Unauthenticated Favourites Toggle',
      neg11Res.status === 401,
      `HTTP ${neg11Res.status}: "${neg11Res.data.message}"`
    );

    // Neg 12: Submit enquiry without token
    const neg12Res = await apiRequest('/enquiries', {
      method: 'POST',
      body: JSON.stringify({ advertisement_id: approvedAdId, message: 'Unauthenticated lead' }),
    });
    recordTest(
      'Negative: Unauthenticated',
      'Block Unauthenticated Enquiry Submission',
      neg12Res.status === 401,
      `HTTP ${neg12Res.status}: "${neg12Res.data.message}"`
    );

    // ------------------------------------------------------------------------
    // Group C: Unauthorized Admin Actions (403 Forbidden)
    // ------------------------------------------------------------------------
    console.log('\n--- Group C: Unauthorized Admin Actions (403 Forbidden) ---');

    // Neg 13: Buyer attempting admin ad approval
    const neg13Res = await apiRequest(`/admin/advertisements/${approvedAdId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    recordTest(
      'Negative: RBAC Authorization',
      'Block Non-Admin Buyer from Approving Advertisements',
      neg13Res.status === 403,
      `HTTP ${neg13Res.status}: "${neg13Res.data.message}"`
    );

    // Neg 14: Seller attempting to fetch admin users directory
    const neg14Res = await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    recordTest(
      'Negative: RBAC Authorization',
      'Block Seller from Accessing Admin Users Directory',
      neg14Res.status === 403,
      `HTTP ${neg14Res.status}: "${neg14Res.data.message}"`
    );

    // ------------------------------------------------------------------------
    // Group D: Cross-Seller & Self-Authorization Guards (403 Forbidden / 400 Bad Request)
    // ------------------------------------------------------------------------
    console.log('\n--- Group D: Cross-Seller & Self-Authorization Guards ---');

    // Neg 15: Cross-seller listing update (Seller 2 edits Seller 1's ad)
    const neg15Res = await apiRequest(`/advertisements/${approvedAdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${seller2Token}` },
      body: JSON.stringify({ title: 'Hacked by Competitor Seller' }),
    });
    recordTest(
      'Negative: Cross-Seller Guard',
      'Block Cross-Seller Advertisement Modification',
      neg15Res.status === 403,
      `HTTP ${neg15Res.status}: "${neg15Res.data.message}"`
    );

    // Neg 16: Cross-seller listing deletion (Seller 2 deletes Seller 1's ad)
    const neg16Res = await apiRequest(`/advertisements/${approvedAdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${seller2Token}` },
    });
    recordTest(
      'Negative: Cross-Seller Guard',
      'Block Cross-Seller Advertisement Deletion',
      neg16Res.status === 403,
      `HTTP ${neg16Res.status}: "${neg16Res.data.message}"`
    );

    // Neg 17: Cross-seller enquiry reply (Seller 2 replies to Seller 1's lead)
    const neg17Res = await apiRequest(`/enquiries/${enquiryId}/reply`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${seller2Token}` },
      body: JSON.stringify({ reply: 'Unauthorized competitor intercepting lead' }),
    });
    recordTest(
      'Negative: Cross-Seller Guard',
      'Block Cross-Seller Enquiry Response Interception',
      neg17Res.status === 403,
      `HTTP ${neg17Res.status}: "${neg17Res.data.message}"`
    );

    // Neg 18: Seller self-approval attempt
    const neg18Res = await apiRequest(`/advertisements/${rejectedAdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({ status: 'approved' }),
    });
    recordTest(
      'Negative: Self-Approval Barrier',
      'Block Seller from Self-Approving Listing',
      neg18Res.status === 403,
      `HTTP ${neg18Res.status}: "${neg18Res.data.message}"`
    );

    // Neg 19: Self-enquiry barrier (Seller sending inquiry on own listing)
    const neg19Res = await apiRequest('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        advertisement_id: approvedAdId,
        message: 'Can I buy my own TV?',
      }),
    });
    recordTest(
      'Negative: Self-Action Barrier',
      'Block Seller from Submitting Enquiry on Own Ad',
      neg19Res.status === 400,
      `HTTP ${neg19Res.status}: "${neg19Res.data.message}"`
    );

    // ------------------------------------------------------------------------
    // Group E: Invalid Uploads & Payloads (400 Bad Request)
    // ------------------------------------------------------------------------
    console.log('\n--- Group E: Upload Validation (400 Bad Request) ---');

    // Neg 20: Invalid file type upload (.txt instead of image)
    const formWithText = new FormData();
    const fakeTextFile = new Blob(['This is plain text not an image'], { type: 'text/plain' });
    formWithText.append('images', fakeTextFile as any, 'malicious_script.txt');

    const neg20Res = await apiRequest('/advertisements/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: formWithText,
    });
    recordTest(
      'Negative: Upload Security',
      'Reject Non-Image File Upload (.txt / text/plain)',
      neg20Res.status === 400,
      `HTTP ${neg20Res.status}: "${neg20Res.data.message}"`
    );

    // Neg 21: Empty upload payload (no files)
    const emptyForm = new FormData();
    const neg21Res = await apiRequest('/advertisements/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller1Token}` },
      body: emptyForm,
    });
    recordTest(
      'Negative: Upload Validation',
      'Reject Upload Request with No Files Attached',
      neg21Res.status === 400,
      `HTTP ${neg21Res.status}: "${neg21Res.data.message}"`
    );

    // ------------------------------------------------------------------------
    // Group F: Nonexistent Records (404 Not Found)
    // ------------------------------------------------------------------------
    console.log('\n--- Group F: Nonexistent Records (404 Not Found) ---');

    // Neg 22: Get non-existent advertisement
    const neg22Res = await apiRequest('/advertisements/999999');
    recordTest(
      'Negative: Nonexistent Record',
      'Return 404 for Nonexistent Advertisement',
      neg22Res.status === 404,
      `HTTP ${neg22Res.status}: "${neg22Res.data.message}"`
    );

    // Neg 23: Favourite non-existent advertisement
    const neg23Res = await apiRequest('/favourites/999999', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Negative: Nonexistent Record',
      'Return 404 When Favouriting Nonexistent Advertisement',
      neg23Res.status === 404,
      `HTTP ${neg23Res.status}: "${neg23Res.data.message}"`
    );

    // Neg 24: Send enquiry for non-existent advertisement
    const neg24Res = await apiRequest('/enquiries', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: 999999,
        message: 'Hello ghost advertisement',
      }),
    });
    recordTest(
      'Negative: Nonexistent Record',
      'Return 404 for Enquiry on Nonexistent Advertisement',
      neg24Res.status === 404,
      `HTTP ${neg24Res.status}: "${neg24Res.data.message}"`
    );

    // Neg 25: Report non-existent advertisement
    const neg25Res = await apiRequest('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        advertisement_id: 999999,
        reason: 'spam',
        description: 'Reporting ghost advertisement',
      }),
    });
    recordTest(
      'Negative: Nonexistent Record',
      'Return 404 for Reporting Nonexistent Advertisement',
      neg25Res.status === 404,
      `HTTP ${neg25Res.status}: "${neg25Res.data.message}"`
    );

    // Neg 26: Admin update non-existent report
    const neg26Res = await apiRequest('/admin/reports/999999', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'resolved',
        admin_notes: 'Trying to update ghost report',
      }),
    });
    recordTest(
      'Negative: Nonexistent Record',
      'Return 404 for Updating Nonexistent Report ID',
      neg26Res.status === 404,
      `HTTP ${neg26Res.status}: "${neg26Res.data.message}"`
    );

    // ========================================================================
    // TEARDOWN & CLEANUP
    // ========================================================================
    console.log('\n--- Cleanup: Marking Test Products Sold & Removing Artifacts ---');
    await apiRequest(`/advertisements/${approvedAdId}/sold`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    await apiRequest(`/advertisements/${approvedAdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    await apiRequest(`/advertisements/${rejectedAdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${seller1Token}` },
    });
    console.log(`   🧹 Cleaned up temporary test advertisements #${approvedAdId} and #${rejectedAdId}.`);

    // ========================================================================
    // FINAL SUMMARY REPORT
    // ========================================================================
    console.log('\n====================================================================');
    console.log(`🎉 ALL ${testRecords.length} MILESTONE 7 VERIFICATION CRITERIA PASSED 100%!`);
    console.log(`   ✅ 9 Lifecycle Steps: PASSED`);
    console.log(`   ✅ 26 Negative & Authorization Tests: PASSED`);
    console.log('====================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Milestone 7 Verification Failed:', err.message);
    process.exit(1);
  }
}

runMilestone7IntegrationQA();
