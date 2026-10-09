declare const process: any;
import assert from 'node:assert';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

console.log(`\n======================================================`);
console.log(`☕ TEZLAA 360° LIVE API & END-TO-END VERIFICATION SUITE`);
console.log(`🎯 Testing Target: ${BASE_URL}`);
console.log(`======================================================\n`);

let passedCount = 0;
let totalCount = 0;
const failures: { name: string; error: string }[] = [];

async function step(name: string, fn: () => Promise<void>) {
  totalCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failures.push({ name, error: err.message });
  }
}

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runVerification() {
  let customerToken = '';
  let adminToken = '';
  let managerToken = '';
  let staffToken = '';
  let createdOrderId = '';
  let createdOrderNumber = '';
  let sampleProductId = '';
  let malabeBranchId = '';

  // ----------------------------------------------------
  // SECTION 1: PUBLIC CATALOG & STORE LOCATIONS
  // ----------------------------------------------------
  console.log('--- 1. PUBLIC CATALOG & STORE LOCATIONS ---');

  await step('GET /health - Server health & uptime', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'UP');
  });

  await step('GET /categories - Retrieve all active café categories (Hot Coffee, Cold Coffee, Matcha, etc.)', async () => {
    const res = await request('/categories');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
    assert.strictEqual(res.data.data.length >= 10, true, 'Expected at least 10 categories');
  });

  await step('GET /products - Retrieve full product catalog with variants & addons', async () => {
    const res = await request('/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
    assert.strictEqual(res.data.data.length >= 10, true);
    sampleProductId = res.data.data[0].id;
  });

  await step('GET /products/:id - Single product detail resolution', async () => {
    const res = await request(`/products/${sampleProductId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.id, sampleProductId);
  });

  await step('GET /products/fresh-today - Daily fresh artisan bakes & recommendations', async () => {
    const res = await request('/products/fresh-today');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await step('GET /branches - TEZLAA physical café locations', async () => {
    const res = await request('/branches');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
    assert.strictEqual(res.data.data.length >= 1, true);
    malabeBranchId = res.data.data[0].id;
  });

  await step('GET /promotions - Active promotional banners', async () => {
    const res = await request('/promotions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  // ----------------------------------------------------
  // SECTION 2: AUTHENTICATION & MULTI-ROLE SESSIONS
  // ----------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & MULTI-ROLE SESSIONS ---');

  await step('POST /auth/login - Customer Login (customer@tezlaa.com)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'customer@tezlaa.com', password: 'Password@123' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.role, 'CUSTOMER');
    customerToken = res.data.data.accessToken;
  });

  await step('POST /auth/login - Admin Login (admin@tezlaa.com)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@tezlaa.com', password: 'Password@123' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.role, 'ADMIN');
    adminToken = res.data.data.accessToken;
  });

  await step('POST /auth/login - Branch Manager Login (manager@tezlaa.com)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'manager@tezlaa.com', password: 'Password@123' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.role, 'BRANCH_MANAGER');
    managerToken = res.data.data.accessToken;
  });

  await step('POST /auth/login - Kitchen Staff Login (staff@tezlaa.com)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'staff@tezlaa.com', password: 'Password@123' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.role, 'BRANCH_STAFF');
    staffToken = res.data.data.accessToken;
  });

  await step('GET /auth/me - Authenticated Customer Profile & Loyalty Balance', async () => {
    const res = await request('/auth/me', { token: customerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.email, 'customer@tezlaa.com');
  });

  await step('GET /loyalty/rewards - Authenticated Loyalty Rewards Catalogue', async () => {
    const res = await request('/loyalty/rewards', { token: customerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
  });

  // ----------------------------------------------------
  // SECTION 3: CART VALIDATION & COMPLETE ORDER FLOW
  // ----------------------------------------------------
  console.log('\n--- 3. CART VALIDATION & COMPLETE ORDER FLOW ---');

  await step('POST /orders/validate-cart - Authoritative Cart Pre-Checkout Calculation', async () => {
    const res = await request('/orders/validate-cart', {
      method: 'POST',
      token: customerToken,
      body: {
        orderType: 'DELIVERY',
        branchId: malabeBranchId,
        items: [{ productId: sampleProductId, quantity: 2 }],
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.data.subtotal, 'number');
    assert.strictEqual(typeof res.data.data.deliveryFee, 'number');
  });

  await step('POST /orders - Customer Places Cash On Delivery (COD) Order', async () => {
    const res = await request('/orders', {
      method: 'POST',
      token: customerToken,
      body: {
        orderType: 'DELIVERY',
        branchId: malabeBranchId,
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryInstructions: 'Ring doorbell twice upon arrival',
        customerNotes: 'Please include extra napkins',
        items: [{ productId: sampleProductId, quantity: 1 }],
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'CONFIRMED');
    createdOrderId = res.data.data.id;
    createdOrderNumber = res.data.data.orderNumber;
  });

  await step('GET /orders - Customer Order History Retrieval', async () => {
    const res = await request('/orders', { token: customerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
    assert.strictEqual(res.data.data.some((o: any) => o.id === createdOrderId), true);
  });

  await step('GET /orders/:id - Customer Order Status & Real-time Tracking Info', async () => {
    const res = await request(`/orders/${createdOrderId}`, { token: customerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.orderNumber, createdOrderNumber);
  });

  // ----------------------------------------------------
  // SECTION 4: ADMIN DASHBOARD & KITCHEN STAFF KDS OPERATIONS
  // ----------------------------------------------------
  console.log('\n--- 4. ADMIN DASHBOARD & KITCHEN STAFF KDS OPERATIONS ---');

  await step('GET /admin/dashboard - Executive overview metrics & live counts', async () => {
    const res = await request('/admin/dashboard', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.data.metrics.todayOrders, 'number');
    assert.strictEqual(typeof res.data.data.metrics.todayRevenue, 'number');
  });

  await step('GET /admin/orders - Staff & Admin live Kitchen Display System (KDS) queue', async () => {
    const res = await request('/admin/orders', { token: managerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.data.total, 'number');
    assert.strictEqual(Array.isArray(res.data.data.items), true);
  });

  await step('PATCH /orders/:id/status - Staff transitions Order: CONFIRMED -> PREPARING', async () => {
    const res = await request(`/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'PREPARING' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'PREPARING');
  });

  await step('PATCH /orders/:id/status - Staff transitions Order: PREPARING -> READY', async () => {
    const res = await request(`/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status: 'READY' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'READY');
  });

  await step('PATCH /orders/:id/status - Rider/Staff transitions Order: READY -> OUT_FOR_DELIVERY', async () => {
    const res = await request(`/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'OUT_FOR_DELIVERY');
  });

  await step('PATCH /orders/:id/status - Final transition: OUT_FOR_DELIVERY -> DELIVERED', async () => {
    const res = await request(`/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'DELIVERED' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'DELIVERED');
  });

  await step('GET /admin/customers - Admin Customer Management Directory', async () => {
    const res = await request('/admin/customers', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data.items), true);
  });

  await step('GET /admin/loyalty - Loyalty Ledger & Account Point balances', async () => {
    const res = await request('/admin/loyalty', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
  });

  await step('GET /notifications - User In-App Notification Feed', async () => {
    const res = await request('/notifications', { token: customerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(Array.isArray(res.data.data), true);
  });

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 FINAL REPORT: ${passedCount}/${totalCount} TESTS PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  if (failures.length > 0) {
    console.log(`⚠️ Failures encountered (${failures.length}):`);
    failures.forEach((f) => console.log(`   - ${f.name}: ${f.error}`));
  } else {
    console.log(`🎉 100% OPERATIONAL: ALL 24 ENDPOINTS & STATE TRANSITIONS SUCCEEDED!`);
  }
  console.log('======================================================\n');
}

runVerification().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
