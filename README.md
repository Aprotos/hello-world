# RouteFlow — Modern Route Accounting Platform

> A competing application to VIP (Vermont Information Processing), targeting the beverage distribution industry with a modern cloud-native architecture.

---

## Overview

**RouteFlow** is a full-stack route accounting and distribution management system built for beverage distributors. It competes directly with VIP's suite (Beverage, eoStar, BizStride, VIPPAY) and other platforms like Encompass, Pepperi, and Prism.

### Competitive Differentiators vs. VIP

| Feature | VIP | RouteFlow |
|---|---|---|
| Architecture | Legacy on-premise + web | Cloud-native, API-first |
| UI/UX | Functional but dated | Modern React, mobile-first |
| Setup time | Months | Days |
| Open API | Limited | Full REST API |
| Real-time tracking | Limited | Built-in |
| Pricing | Expensive enterprise | Competitive SaaS |

---

## Features

### Core Route Accounting
- **Route Management** — Plan, load, dispatch, and track delivery routes in real time
- **Stop-by-Stop Delivery** — Driver mobile workflow with arrival/departure tracking, signature capture, proof of delivery
- **Order Management** — Pre-sell and street-sale order entry, invoicing, and payment collection
- **Route Settlement** — End-of-day reconciliation of loaded vs. sold vs. returned vs. collected

### Customer Management
- Account database with trade class segmentation (On-Premise, Chain, Retail, Wholesale)
- Credit limits, payment terms, and A/R tracking
- Order history and top product analysis per account

### Inventory & Warehouse
- Product catalog with full SKU management (Beer, Wine, Spirits, NA, Cider)
- Keg and deposit tracking
- Real-time stock levels with automated low-inventory alerts
- Inventory valuation

### Financial
- Full A/R aging (0-30, 31-60, 61-90, 90+ days)
- Multi-payment method support (Cash, Check, Credit Card, ACH, Account)
- Deposit management for kegs and returnable packaging
- Revenue and collection reporting by period, category, and trade class

### Driver Management
- Driver profiles with CDL license tracking and expiry alerts
- Route assignment and performance analytics
- Revenue, stops completed, and route completion metrics per driver

### Business Intelligence
- Real-time dashboard with KPIs and trend charts
- Sales reports (daily/weekly/monthly, by category, by trade class)
- A/R aging report with customer drill-down
- Inventory status report with reorder alerts
- Top customers and top products by volume

---

## Tech Stack

### Backend
- **Runtime:** Node.js 22 + TypeScript
- **Framework:** Express.js
- **Database:** SQLite (via better-sqlite3) — production-ready swap to PostgreSQL
- **API Style:** REST, JSON

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v6

---

## Project Structure

```
routeflow/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts    # SQLite schema & init
│   │   │   └── seed.ts        # Demo seed data
│   │   ├── routes/
│   │   │   ├── dashboard.ts   # KPIs, charts, today's ops
│   │   │   ├── routes.ts      # Route CRUD + stops
│   │   │   ├── customers.ts   # Customer management
│   │   │   ├── orders.ts      # Order + payment processing
│   │   │   ├── products.ts    # Product catalog + inventory
│   │   │   ├── drivers.ts     # Driver profiles + performance
│   │   │   ├── deliveries.ts  # Delivery tracking
│   │   │   └── reports.ts     # Sales, A/R, inventory reports
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # HTTP client
│   │   ├── components/        # Layout, StatCard, StatusBadge, etc.
│   │   └── pages/             # Dashboard, Routes, Customers, Orders,
│   │                          # Products, Drivers, Deliveries, Reports
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install all dependencies
npm run install:all

# Seed demo data (20 customers, 17 products, 5 drivers, 74 routes, 382 orders)
npm run seed

# Start the backend API (port 3001)
npm run dev:backend

# In a separate terminal, start the frontend (port 3000)
npm run dev:frontend

# Open http://localhost:3000
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/dashboard` | Dashboard KPIs, charts, today's ops |
| `GET /api/routes` | List routes (filter by date, status, driver) |
| `GET /api/routes/:id` | Route detail with stops and loads |
| `POST /api/routes` | Create a new route |
| `PATCH /api/routes/:id` | Update route status |
| `POST /api/routes/:id/stops` | Add a stop to a route |
| `PATCH /api/routes/:id/stops/:stopId` | Update stop status |
| `GET /api/customers` | List customers (search, trade class, status) |
| `GET /api/customers/:id` | Customer detail with order history |
| `POST /api/customers` | Create customer |
| `GET /api/orders` | List orders (filter by status, date, customer) |
| `GET /api/orders/:id` | Order detail with line items and payments |
| `POST /api/orders` | Create order with line items |
| `POST /api/orders/:id/payment` | Record payment on an order |
| `GET /api/products` | Product catalog with inventory levels |
| `GET /api/drivers` | Drivers with performance stats |
| `GET /api/deliveries` | Today's delivery stops |
| `POST /api/deliveries/:stopId/complete` | Mark delivery as complete |
| `GET /api/reports/sales` | Sales summary by period |
| `GET /api/reports/ar` | A/R aging report |
| `GET /api/reports/inventory` | Inventory status report |
| `GET /api/reports/routes` | Route performance report |

---

## Demo Data

The seed script creates realistic Vermont-based demo data:
- **20 customers** across Burlington, South Burlington, Essex, Colchester, Williston, Shelburne
- **17 products** — Budweiser, Bud Light, Coors Light, Miller Lite, Sam Adams, Heineken, Corona, kegs, hard seltzer, spirits, wine, energy drinks
- **5 drivers** with CDL licenses and hire dates
- **4 trucks** (Freightliner, International, Ford)
- **74 routes** over the past 30 days with realistic route completion data
- **382 orders** with line items, payments, and A/R balances

---

## Competitive Landscape

RouteFlow targets the same market as:
- **VIP (Vermont Information Processing)** — market leader, 50%+ beer distributor market share, acquired eoStar
- **Encompass Distribution Cloud** — strong cloud-native competitor
- **Pepperi** — global CPG platform
- **Prism Route Accounting** — DSD-focused
- **SimplyDepo** — fast deployment, small distributors

---

*Built as a competitive alternative to VIP's route accounting suite for modern beverage distributors seeking a cloud-native, developer-friendly platform.*
