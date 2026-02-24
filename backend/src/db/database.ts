import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/routeflow.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    -- Customers (retailers/accounts served on routes)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      trade_class TEXT DEFAULT 'Retail', -- Retail, On-Premise, Chain, Wholesale
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      phone TEXT,
      email TEXT,
      contact_name TEXT,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      payment_terms TEXT DEFAULT 'Net 30',
      status TEXT DEFAULT 'Active', -- Active, Inactive, Hold
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Products (SKUs)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT, -- Beer, Wine, Spirits, NA, Cider
      package_type TEXT, -- Can, Bottle, Keg, Bag-in-Box
      unit_size TEXT, -- 12oz, 16oz, 24oz, etc.
      units_per_case INTEGER DEFAULT 24,
      price_per_case REAL DEFAULT 0,
      deposit_per_unit REAL DEFAULT 0,
      weight_per_case REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Drivers
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      license_number TEXT,
      license_class TEXT,
      license_expiry TEXT,
      hire_date TEXT,
      status TEXT DEFAULT 'Active', -- Active, Inactive, On Leave
      notes TEXT
    );

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_number TEXT UNIQUE NOT NULL,
      make TEXT,
      model TEXT,
      year INTEGER,
      vin TEXT,
      license_plate TEXT,
      capacity_cases INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active', -- Active, Maintenance, Out of Service
      last_service_date TEXT,
      notes TEXT
    );

    -- Routes (daily route plans)
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      driver_id INTEGER REFERENCES drivers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      route_date TEXT NOT NULL,
      status TEXT DEFAULT 'Planned', -- Planned, Loaded, In Progress, Completed, Cancelled
      start_time TEXT,
      end_time TEXT,
      total_stops INTEGER DEFAULT 0,
      stops_completed INTEGER DEFAULT 0,
      total_cases INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_collected REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Route Stops (customer stops on a route)
    CREATE TABLE IF NOT EXISTS route_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      stop_order INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending', -- Pending, Arrived, Delivered, Skipped, No Access
      planned_arrival TEXT,
      actual_arrival TEXT,
      actual_departure TEXT,
      delivery_notes TEXT,
      signature_captured INTEGER DEFAULT 0,
      photo_captured INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL
    );

    -- Orders (invoices)
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      route_id INTEGER REFERENCES routes(id),
      route_stop_id INTEGER REFERENCES route_stops(id),
      order_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pending', -- Pending, Confirmed, Delivered, Invoiced, Paid, Cancelled
      order_type TEXT DEFAULT 'Delivery', -- Delivery, Pre-Sell, Return, Credit
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      deposit_total REAL DEFAULT 0,
      total REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_method TEXT, -- Cash, Check, Credit Card, Account
      due_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Order Line Items
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity_cases REAL NOT NULL,
      quantity_units REAL DEFAULT 0,
      unit_price REAL NOT NULL,
      deposit_per_unit REAL DEFAULT 0,
      line_total REAL NOT NULL,
      deposit_total REAL DEFAULT 0
    );

    -- Returns
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      route_stop_id INTEGER REFERENCES route_stops(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity_cases REAL NOT NULL,
      reason TEXT, -- Damaged, Expired, Over-order, Refused
      credit_amount REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      route_id INTEGER REFERENCES routes(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      amount REAL NOT NULL,
      method TEXT NOT NULL, -- Cash, Check, Credit Card, ACH
      reference TEXT, -- Check number, transaction ID
      received_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    );

    -- Route Load (what was loaded on the truck)
    CREATE TABLE IF NOT EXISTS route_loads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      loaded_cases REAL DEFAULT 0,
      sold_cases REAL DEFAULT 0,
      returned_cases REAL DEFAULT 0,
      damaged_cases REAL DEFAULT 0,
      variance_cases REAL DEFAULT 0
    );

    -- Inventory
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      warehouse_location TEXT DEFAULT 'Main',
      quantity_cases REAL DEFAULT 0,
      reorder_point REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(route_date);
    CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);

  console.log('Database initialized successfully');
}

export default db;
