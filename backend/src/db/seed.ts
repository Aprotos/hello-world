import db, { initializeDatabase } from './database';

initializeDatabase();

console.log('Seeding database...');

// Clear existing data
db.exec(`
  DELETE FROM route_loads;
  DELETE FROM returns;
  DELETE FROM payments;
  DELETE FROM order_items;
  DELETE FROM orders;
  DELETE FROM route_stops;
  DELETE FROM routes;
  DELETE FROM inventory;
  DELETE FROM vehicles;
  DELETE FROM drivers;
  DELETE FROM customers;
  DELETE FROM products;
`);

// ── PRODUCTS ────────────────────────────────────────────────────────────────
const insertProduct = db.prepare(`
  INSERT INTO products (sku, name, brand, category, package_type, unit_size, units_per_case, price_per_case, deposit_per_unit, weight_per_case, status)
  VALUES (@sku, @name, @brand, @category, @package_type, @unit_size, @units_per_case, @price_per_case, @deposit_per_unit, @weight_per_case, @status)
`);

const products = [
  { sku: 'BUD-12C-24', name: 'Budweiser 12oz Cans 24pk', brand: 'Budweiser', category: 'Beer', package_type: 'Can', unit_size: '12oz', units_per_case: 24, price_per_case: 22.50, deposit_per_unit: 0.05, weight_per_case: 20.5, status: 'Active' },
  { sku: 'BLT-12C-24', name: 'Bud Light 12oz Cans 24pk', brand: 'Bud Light', category: 'Beer', package_type: 'Can', unit_size: '12oz', units_per_case: 24, price_per_case: 21.75, deposit_per_unit: 0.05, weight_per_case: 20.5, status: 'Active' },
  { sku: 'COO-12C-24', name: 'Coors Light 12oz Cans 24pk', brand: 'Coors Light', category: 'Beer', package_type: 'Can', unit_size: '12oz', units_per_case: 24, price_per_case: 21.75, deposit_per_unit: 0.05, weight_per_case: 20.5, status: 'Active' },
  { sku: 'MIL-12C-24', name: 'Miller Lite 12oz Cans 24pk', brand: 'Miller Lite', category: 'Beer', package_type: 'Can', unit_size: '12oz', units_per_case: 24, price_per_case: 21.75, deposit_per_unit: 0.05, weight_per_case: 20.5, status: 'Active' },
  { sku: 'SAM-12B-12', name: 'Samuel Adams Boston Lager 12oz Bottles 12pk', brand: 'Samuel Adams', category: 'Beer', package_type: 'Bottle', unit_size: '12oz', units_per_case: 24, price_per_case: 32.00, deposit_per_unit: 0.05, weight_per_case: 24.0, status: 'Active' },
  { sku: 'HIN-12B-24', name: 'Heineken 12oz Bottles 24pk', brand: 'Heineken', category: 'Beer', package_type: 'Bottle', unit_size: '12oz', units_per_case: 24, price_per_case: 35.50, deposit_per_unit: 0.05, weight_per_case: 23.0, status: 'Active' },
  { sku: 'COR-12B-24', name: 'Corona Extra 12oz Bottles 24pk', brand: 'Corona', category: 'Beer', package_type: 'Bottle', unit_size: '12oz', units_per_case: 24, price_per_case: 33.00, deposit_per_unit: 0.05, weight_per_case: 23.0, status: 'Active' },
  { sku: 'BLT-KEG-HH', name: 'Bud Light 1/2 Barrel Keg', brand: 'Bud Light', category: 'Beer', package_type: 'Keg', unit_size: '15.5gal', units_per_case: 1, price_per_case: 95.00, deposit_per_unit: 30.00, weight_per_case: 160.0, status: 'Active' },
  { sku: 'BUD-KEG-HH', name: 'Budweiser 1/2 Barrel Keg', brand: 'Budweiser', category: 'Beer', package_type: 'Keg', unit_size: '15.5gal', units_per_case: 1, price_per_case: 97.00, deposit_per_unit: 30.00, weight_per_case: 160.0, status: 'Active' },
  { sku: 'TRP-16C-24', name: 'Truly Hard Seltzer Variety 16oz Cans 24pk', brand: 'Truly', category: 'Beer', package_type: 'Can', unit_size: '16oz', units_per_case: 24, price_per_case: 38.00, deposit_per_unit: 0.05, weight_per_case: 22.0, status: 'Active' },
  { sku: 'WHL-16C-24', name: 'White Claw Variety 16oz Cans 24pk', brand: 'White Claw', category: 'Beer', package_type: 'Can', unit_size: '16oz', units_per_case: 24, price_per_case: 39.00, deposit_per_unit: 0.05, weight_per_case: 22.0, status: 'Active' },
  { sku: 'SKY-750-12', name: 'Smirnoff Vodka 750ml 12pk', brand: 'Smirnoff', category: 'Spirits', package_type: 'Bottle', unit_size: '750ml', units_per_case: 12, price_per_case: 144.00, deposit_per_unit: 0.00, weight_per_case: 22.0, status: 'Active' },
  { sku: 'JAK-750-12', name: "Jack Daniel's 750ml 12pk", brand: "Jack Daniel's", category: 'Spirits', package_type: 'Bottle', unit_size: '750ml', units_per_case: 12, price_per_case: 192.00, deposit_per_unit: 0.00, weight_per_case: 24.0, status: 'Active' },
  { sku: 'KJM-750-12', name: 'Kim Crawford Sauvignon Blanc 750ml 12pk', brand: 'Kim Crawford', category: 'Wine', package_type: 'Bottle', unit_size: '750ml', units_per_case: 12, price_per_case: 120.00, deposit_per_unit: 0.00, weight_per_case: 20.0, status: 'Active' },
  { sku: 'PCT-750-12', name: 'Meiomi Pinot Noir 750ml 12pk', brand: 'Meiomi', category: 'Wine', package_type: 'Bottle', unit_size: '750ml', units_per_case: 12, price_per_case: 132.00, deposit_per_unit: 0.00, weight_per_case: 20.0, status: 'Active' },
  { sku: 'RDB-20B-24', name: 'Red Bull Energy 8.4oz Cans 24pk', brand: 'Red Bull', category: 'NA', package_type: 'Can', unit_size: '8.4oz', units_per_case: 24, price_per_case: 40.00, deposit_per_unit: 0.05, weight_per_case: 14.0, status: 'Active' },
  { sku: 'MTD-20B-24', name: 'Monster Energy 16oz Cans 24pk', brand: 'Monster', category: 'NA', package_type: 'Can', unit_size: '16oz', units_per_case: 24, price_per_case: 37.00, deposit_per_unit: 0.05, weight_per_case: 22.0, status: 'Active' },
];

const productIds: number[] = [];
for (const p of products) {
  const result = insertProduct.run(p) as { lastInsertRowid: number };
  productIds.push(result.lastInsertRowid);
}
console.log(`Inserted ${products.length} products`);

// ── DRIVERS ──────────────────────────────────────────────────────────────────
const insertDriver = db.prepare(`
  INSERT INTO drivers (employee_id, first_name, last_name, phone, email, license_number, license_class, license_expiry, hire_date, status)
  VALUES (@employee_id, @first_name, @last_name, @phone, @email, @license_number, @license_class, @license_expiry, @hire_date, @status)
`);

const drivers = [
  { employee_id: 'EMP-001', first_name: 'Marcus', last_name: 'Johnson', phone: '802-555-0101', email: 'marcus.j@routeflow.io', license_number: 'VT-CDL-100291', license_class: 'Class A CDL', license_expiry: '2026-08-15', hire_date: '2018-03-01', status: 'Active' },
  { employee_id: 'EMP-002', first_name: 'Sarah', last_name: 'Chen', phone: '802-555-0102', email: 'sarah.c@routeflow.io', license_number: 'VT-CDL-200482', license_class: 'Class A CDL', license_expiry: '2025-11-30', hire_date: '2019-07-15', status: 'Active' },
  { employee_id: 'EMP-003', first_name: 'Derek', last_name: 'Williams', phone: '802-555-0103', email: 'derek.w@routeflow.io', license_number: 'VT-CDL-300173', license_class: 'Class B CDL', license_expiry: '2026-04-22', hire_date: '2020-01-10', status: 'Active' },
  { employee_id: 'EMP-004', first_name: 'Ana', last_name: 'Martinez', phone: '802-555-0104', email: 'ana.m@routeflow.io', license_number: 'VT-CDL-400264', license_class: 'Class A CDL', license_expiry: '2027-02-14', hire_date: '2021-05-20', status: 'Active' },
  { employee_id: 'EMP-005', first_name: 'Tom', last_name: 'Nguyen', phone: '802-555-0105', email: 'tom.n@routeflow.io', license_number: 'VT-CDL-500355', license_class: 'Class B CDL', license_expiry: '2025-09-01', hire_date: '2022-08-01', status: 'On Leave' },
];

const driverIds: number[] = [];
for (const d of drivers) {
  const result = insertDriver.run(d) as { lastInsertRowid: number };
  driverIds.push(result.lastInsertRowid);
}
console.log(`Inserted ${drivers.length} drivers`);

// ── VEHICLES ─────────────────────────────────────────────────────────────────
const insertVehicle = db.prepare(`
  INSERT INTO vehicles (vehicle_number, make, model, year, vin, license_plate, capacity_cases, status, last_service_date)
  VALUES (@vehicle_number, @make, @model, @year, @vin, @license_plate, @capacity_cases, @status, @last_service_date)
`);

const vehicles = [
  { vehicle_number: 'TRK-001', make: 'Freightliner', model: 'M2 106', year: 2021, vin: '1FVACWDT5MHGE8001', license_plate: 'VT-TRK-001', capacity_cases: 800, status: 'Active', last_service_date: '2024-01-15' },
  { vehicle_number: 'TRK-002', make: 'International', model: '4300', year: 2020, vin: '1HTMMAAM0LH001234', license_plate: 'VT-TRK-002', capacity_cases: 600, status: 'Active', last_service_date: '2024-01-22' },
  { vehicle_number: 'TRK-003', make: 'Freightliner', model: 'MT55', year: 2022, vin: '4UZACWDT5CCAR0003', license_plate: 'VT-TRK-003', capacity_cases: 500, status: 'Active', last_service_date: '2024-02-01' },
  { vehicle_number: 'TRK-004', make: 'Ford', model: 'F-650', year: 2021, vin: '3FRNF65V1LMJA0004', license_plate: 'VT-TRK-004', capacity_cases: 400, status: 'Maintenance', last_service_date: '2024-01-05' },
];

for (const v of vehicles) {
  insertVehicle.run(v);
}
console.log(`Inserted ${vehicles.length} vehicles`);

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
const insertCustomer = db.prepare(`
  INSERT INTO customers (account_number, name, trade_class, address, city, state, zip, phone, email, contact_name, credit_limit, current_balance, payment_terms, status)
  VALUES (@account_number, @name, @trade_class, @address, @city, @state, @zip, @phone, @email, @contact_name, @credit_limit, @current_balance, @payment_terms, @status)
`);

const customers = [
  { account_number: 'ACC-10001', name: "Murphy's Pub & Grill", trade_class: 'On-Premise', address: '123 Main St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1001', email: 'orders@murphyspub.com', contact_name: 'Patrick Murphy', credit_limit: 5000, current_balance: 1250.75, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10002', name: "Price Chopper #442", trade_class: 'Chain', address: '456 Williston Rd', city: 'South Burlington', state: 'VT', zip: '05403', phone: '802-555-1002', email: 'receiving@pricechopper442.com', contact_name: 'Mary Thompson', credit_limit: 25000, current_balance: 8430.50, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10003', name: "Hannaford #1158", trade_class: 'Chain', address: '789 Shelburne Rd', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1003', email: 'orders@hannaford1158.com', contact_name: 'Bob Larson', credit_limit: 30000, current_balance: 12800.00, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10004', name: "The Rusty Nail Bar", trade_class: 'On-Premise', address: '321 College St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1004', email: 'manager@rustynail.com', contact_name: 'Lisa Kim', credit_limit: 3000, current_balance: 875.25, payment_terms: 'COD', status: 'Active' },
  { account_number: 'ACC-10005', name: "Maplefields Convenience", trade_class: 'Retail', address: '654 Dorset St', city: 'South Burlington', state: 'VT', zip: '05403', phone: '802-555-1005', email: 'store@maplefields.com', contact_name: 'Dave Singh', credit_limit: 4000, current_balance: 320.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10006', name: "Liquid Alchemy Brewery", trade_class: 'Wholesale', address: '987 Pine St', city: 'Essex Junction', state: 'VT', zip: '05452', phone: '802-555-1006', email: 'procurement@liquidalchemy.com', contact_name: 'Chris Foster', credit_limit: 10000, current_balance: 4100.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10007', name: "Market 32 #88", trade_class: 'Chain', address: '147 Hinesburg Rd', city: 'South Burlington', state: 'VT', zip: '05403', phone: '802-555-1007', email: 'mgr@market3288.com', contact_name: 'Jane Park', credit_limit: 20000, current_balance: 7600.80, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10008', name: "Sportsman's Grill", trade_class: 'On-Premise', address: '258 North Ave', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1008', email: 'info@sportsmansgrill.com', contact_name: 'Mike Davis', credit_limit: 4500, current_balance: 2150.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10009', name: "Richmond IGA", trade_class: 'Retail', address: '369 Bridge St', city: 'Richmond', state: 'VT', zip: '05477', phone: '802-555-1009', email: 'orders@richmondiga.com', contact_name: 'Tom Briggs', credit_limit: 6000, current_balance: 980.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10010', name: "Williston Country Club", trade_class: 'On-Premise', address: '741 Club Rd', city: 'Williston', state: 'VT', zip: '05495', phone: '802-555-1010', email: 'beverage@willistoncc.com', contact_name: 'Sandra White', credit_limit: 8000, current_balance: 3400.00, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10011', name: "Shaw's #2302", trade_class: 'Chain', address: '1 Dorset St', city: 'South Burlington', state: 'VT', zip: '05403', phone: '802-555-1011', email: 'rcv@shaws2302.com', contact_name: 'Amy Chen', credit_limit: 28000, current_balance: 11200.00, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10012', name: "Pine Street Variety", trade_class: 'Retail', address: '852 Pine St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1012', email: 'owner@pinestreetvariety.com', contact_name: 'Carlos Rivera', credit_limit: 2000, current_balance: 0.00, payment_terms: 'COD', status: 'Active' },
  { account_number: 'ACC-10013', name: "Vergennes Hotel Restaurant", trade_class: 'On-Premise', address: '3 Main St', city: 'Vergennes', state: 'VT', zip: '05491', phone: '802-555-1013', email: 'food@vergennesmhotel.com', contact_name: 'Helen Grant', credit_limit: 5500, current_balance: 1800.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10014', name: "Cumberland Farms #3019", trade_class: 'Chain', address: '25 Shelburne Rd', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1014', email: 'mgr@cfarms3019.com', contact_name: 'Nick Russo', credit_limit: 3500, current_balance: 1100.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10015', name: "The Farmhouse Tap & Grill", trade_class: 'On-Premise', address: '160 Bank St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1015', email: 'bar@farmhousetap.com', contact_name: 'Owen Baker', credit_limit: 7000, current_balance: 3250.00, payment_terms: 'Net 14', status: 'Active' },
  { account_number: 'ACC-10016', name: "Shelburne Supermarket", trade_class: 'Retail', address: '420 Shelburne Rd', city: 'Shelburne', state: 'VT', zip: '05482', phone: '802-555-1016', email: 'orders@shelburnemarket.com', contact_name: 'Gina Torres', credit_limit: 8000, current_balance: 2750.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10017', name: "Zero Gravity Craft Brewery", trade_class: 'Wholesale', address: '716 Pine St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1017', email: 'biz@zerogravitybeer.com', contact_name: 'Paul Hale', credit_limit: 12000, current_balance: 5600.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10018', name: "Burlington Tavern", trade_class: 'On-Premise', address: '87 Church St', city: 'Burlington', state: 'VT', zip: '05401', phone: '802-555-1018', email: 'info@burlingtontavern.com', contact_name: 'Rachel Stone', credit_limit: 4000, current_balance: 925.00, payment_terms: 'Net 30', status: 'Hold' },
  { account_number: 'ACC-10019', name: "Colchester Mobil Mart", trade_class: 'Retail', address: '555 Blakely Rd', city: 'Colchester', state: 'VT', zip: '05446', phone: '802-555-1019', email: 'store@colchestermobil.com', contact_name: 'Jeff Wu', credit_limit: 2500, current_balance: 450.00, payment_terms: 'Net 30', status: 'Active' },
  { account_number: 'ACC-10020', name: "Essex Junction Elks Lodge", trade_class: 'On-Premise', address: '61 Pearl St', city: 'Essex Junction', state: 'VT', zip: '05452', phone: '802-555-1020', email: 'bartender@essexelks.org', contact_name: 'Frank Olson', credit_limit: 3000, current_balance: 1200.00, payment_terms: 'COD', status: 'Active' },
];

const customerIds: number[] = [];
for (const c of customers) {
  const result = insertCustomer.run(c) as { lastInsertRowid: number };
  customerIds.push(result.lastInsertRowid);
}
console.log(`Inserted ${customers.length} customers`);

// ── INVENTORY ─────────────────────────────────────────────────────────────────
const insertInventory = db.prepare(`
  INSERT INTO inventory (product_id, warehouse_location, quantity_cases, reorder_point)
  VALUES (?, 'Main', ?, ?)
`);

const inventoryData = [
  [productIds[0], 450, 100], [productIds[1], 520, 100], [productIds[2], 380, 100],
  [productIds[3], 410, 100], [productIds[4], 180, 50],  [productIds[5], 220, 50],
  [productIds[6], 195, 50],  [productIds[7], 32, 10],   [productIds[8], 28, 10],
  [productIds[9], 150, 40],  [productIds[10], 170, 40], [productIds[11], 85, 20],
  [productIds[12], 72, 20],  [productIds[13], 90, 20],  [productIds[14], 95, 20],
  [productIds[15], 310, 60], [productIds[16], 280, 60],
];
for (const row of inventoryData) {
  insertInventory.run(...row);
}

// ── ROUTES & ORDERS (Last 30 days) ───────────────────────────────────────────
const insertRoute = db.prepare(`
  INSERT INTO routes (route_number, name, driver_id, vehicle_id, route_date, status, start_time, end_time, total_stops, stops_completed, total_cases, total_revenue, total_collected)
  VALUES (@route_number, @name, @driver_id, @vehicle_id, @route_date, @status, @start_time, @end_time, @total_stops, @stops_completed, @total_cases, @total_revenue, @total_collected)
`);

const insertStop = db.prepare(`
  INSERT INTO route_stops (route_id, customer_id, stop_order, status, actual_arrival, actual_departure, signature_captured)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertOrder = db.prepare(`
  INSERT INTO orders (order_number, customer_id, route_id, route_stop_id, order_date, status, order_type, subtotal, tax_rate, tax_amount, deposit_total, total, amount_paid, balance_due, payment_method)
  VALUES (@order_number, @customer_id, @route_id, @route_stop_id, @order_date, @status, @order_type, @subtotal, @tax_rate, @tax_amount, @deposit_total, @total, @amount_paid, @balance_due, @payment_method)
`);

const insertOrderItem = db.prepare(`
  INSERT INTO order_items (order_id, product_id, quantity_cases, unit_price, deposit_per_unit, line_total, deposit_total)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertPayment = db.prepare(`
  INSERT INTO payments (order_id, route_id, customer_id, amount, method, received_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let orderCounter = 1000;

// Generate 30 days of route history
const today = new Date('2026-02-24');
let routeCounter = 100;

const routeTemplates = [
  { name: 'Burlington North Route', driver_idx: 0, vehicle_idx: 0, customer_idxs: [0, 3, 7, 11, 14, 17] },
  { name: 'South Burlington Chain Route', driver_idx: 1, vehicle_idx: 1, customer_idxs: [1, 2, 6, 10, 15] },
  { name: 'Essex/Colchester Route', driver_idx: 2, vehicle_idx: 2, customer_idxs: [4, 5, 18, 19, 12] },
  { name: 'Williston/Shelburne Route', driver_idx: 3, vehicle_idx: 0, customer_idxs: [8, 9, 13, 15, 16] },
];

for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
  const routeDate = new Date(today);
  routeDate.setDate(today.getDate() - dayOffset);
  const dayOfWeek = routeDate.getDay();
  if (dayOfWeek === 0) continue; // Skip Sundays

  const dateStr = routeDate.toISOString().split('T')[0];
  const isToday = dayOffset === 0;
  const isFuture = dayOffset < 0;

  // Run 2-3 routes per day
  const numRoutes = dayOfWeek === 6 ? 2 : Math.min(3, routeTemplates.length);

  for (let r = 0; r < numRoutes; r++) {
    const tmpl = routeTemplates[r % routeTemplates.length];
    const routeStatus = isToday ? (r === 0 ? 'In Progress' : 'Planned') : isFuture ? 'Planned' : 'Completed';
    routeCounter++;

    const totalStops = tmpl.customer_idxs.length;
    const stopsCompleted = routeStatus === 'Completed' ? totalStops : routeStatus === 'In Progress' ? 2 : 0;
    let routeTotalCases = 0;
    let routeTotalRevenue = 0;

    const routeResult = insertRoute.run({
      route_number: `RT-${routeCounter}`,
      name: tmpl.name,
      driver_id: driverIds[tmpl.driver_idx],
      vehicle_id: r + 1,
      route_date: dateStr,
      status: routeStatus,
      start_time: routeStatus !== 'Planned' ? `${dateStr}T07:30:00` : null,
      end_time: routeStatus === 'Completed' ? `${dateStr}T16:45:00` : null,
      total_stops: totalStops,
      stops_completed: stopsCompleted,
      total_cases: 0,
      total_revenue: 0,
      total_collected: 0,
    }) as { lastInsertRowid: number };
    const routeId = routeResult.lastInsertRowid;

    let routeCollected = 0;

    for (let s = 0; s < tmpl.customer_idxs.length; s++) {
      const custIdx = tmpl.customer_idxs[s];
      const customerId = customerIds[custIdx];
      const stopStatus = s < stopsCompleted ? 'Delivered' : 'Pending';

      const stopResult = insertStop.run(routeId, customerId, s + 1, stopStatus,
        stopStatus === 'Delivered' ? `${dateStr}T${(8 + s * 1.5).toFixed(0).padStart(2, '0')}:${(s * 15 % 60).toString().padStart(2, '0')}:00` : null,
        stopStatus === 'Delivered' ? `${dateStr}T${(8 + s * 1.5 + 0.75).toFixed(0).padStart(2, '0')}:${(s * 15 % 60 + 30).toString().padStart(2, '0')}:00` : null,
        stopStatus === 'Delivered' ? 1 : 0
      ) as { lastInsertRowid: number };
      const stopId = stopResult.lastInsertRowid;

      if (stopStatus === 'Delivered') {
        // Create order for delivered stops
        const numProducts = 2 + Math.floor(Math.random() * 3);
        let subtotal = 0;
        let depositTotal = 0;
        const orderItems: { productId: number; qty: number; price: number; deposit: number }[] = [];

        const selectedProducts = [...productIds].sort(() => Math.random() - 0.5).slice(0, numProducts);
        for (const pid of selectedProducts) {
          const prod = products[productIds.indexOf(pid)];
          const qty = 1 + Math.floor(Math.random() * 8);
          const price = prod.price_per_case;
          const deposit = prod.deposit_per_unit * prod.units_per_case;
          subtotal += qty * price;
          depositTotal += qty * deposit;
          orderItems.push({ productId: pid, qty, price, deposit });
          routeTotalCases += qty;
        }

        const taxRate = 0.0;
        const taxAmount = 0;
        const total = subtotal + depositTotal + taxAmount;
        const isPaid = Math.random() > 0.3;
        const amountPaid = isPaid ? total : 0;
        const paymentMethod = isPaid ? ['Cash', 'Check', 'Credit Card', 'Account'][Math.floor(Math.random() * 4)] : null;

        orderCounter++;
        const orderResult = insertOrder.run({
          order_number: `ORD-${orderCounter}`,
          customer_id: customerId,
          route_id: routeId,
          route_stop_id: stopId,
          order_date: dateStr,
          status: isPaid ? 'Paid' : 'Invoiced',
          order_type: 'Delivery',
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          deposit_total: depositTotal,
          total,
          amount_paid: amountPaid,
          balance_due: total - amountPaid,
          payment_method: paymentMethod,
        }) as { lastInsertRowid: number };
        const orderId = orderResult.lastInsertRowid;

        for (const item of orderItems) {
          insertOrderItem.run(orderId, item.productId, item.qty, item.price, item.deposit, item.qty * item.price, item.qty * item.deposit);
        }

        if (isPaid) {
          insertPayment.run(orderId, routeId, customerId, amountPaid, paymentMethod!, dateStr);
          routeCollected += amountPaid;
        }

        routeTotalRevenue += total;
      }
    }

    // Update route totals
    db.prepare(`UPDATE routes SET total_cases = ?, total_revenue = ?, total_collected = ? WHERE id = ?`)
      .run(routeTotalCases, routeTotalRevenue, routeCollected, routeId);
  }
}

console.log('Seed data inserted successfully');
console.log(`  Routes: ${routeCounter - 100}`);
console.log(`  Orders: ${orderCounter - 1000}`);
