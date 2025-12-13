Below is a **ready-to-paste Markdown plan** you can use as a **Cursor IDE project prompt**.
It includes:
✔ Complete feature roadmap
✔ Folder structure
✔ Tech stack choices
✔ API architecture (Fastify inside Next API routes)
✔ Supabase integration
✔ Shadcn UI usage
✔ Tasks breakdown

---

# ✅ **CURSOR PROJECT PLAN — Restaurant POS System**

### **Tech Stack:** Next.js • TypeScript • TailwindCSS • ShadCN UI • Fastify (inside Next API) • Supabase (Free Tier)

---

# # 📌 **PROJECT NAME:**

**Restaurant POS & Multi-Outlet Management System**

---

# # 🚀 **TECH STACK REQUIREMENTS**

* **Frontend:**

  * Next.js (App Router)
  * TypeScript
  * TailwindCSS
  * Shadcn UI Components

* **Backend:**

  * Next.js API Routes
  * **Fastify server instance within API routes**
  * Zod validation schemas

* **Database:**

  * **Supabase PostgreSQL** (Free Tier)
  * Supabase Auth (for users & roles)
  * Supabase Row Level Security (RLS)

* **Other:**

  * QR Code generator
  * CSV export
  * Zustand or Jotai for UI state (optional)

---

# # 🏗️ **CORE FEATURE MODULES**

All modules must match industry-standard POS system behavior.

---

## ## **1. Menu Management**

* CRUD for menu items
* Category support
* Price, description, image upload
* Toggle availability
* Sync with digital view-only QR menu

---

## ## **2. Order Management**

* Create dine-in or takeaway orders
* Add items with quantities
* Add item-level notes
* Order status: `NEW → PREPARING → READY → SERVED → COMPLETED`
* Cancel orders
* Kitchen Order Ticket (KOT) optional

---

## ## **3. Billing & Payments**

* Auto bill calculation
* GST / Tax
* Payment types: Cash, UPI, Card
* Receipt print / download
* Reprint support

---

## ## **4. Table Management**

* Create & edit table layout
* Table statuses: Empty / Occupied / Billed
* Assign order to tables
* Move tables
* Merge tables (optional)

---

## ## **5. User Roles / Auth**

* Supabase Auth
* Roles: `admin`, `cashier`, `staff`
* RLS so staff can access only allowed features

---

## ## **6. Order History**

* Full history with filters
* Reprint invoice
* View item details
* Cancelled order logs

---

## ## **7. Basic Inventory Tracking**

* Track stock per item
* Auto stock deduction per order
* Ingredient-level tracking optional
* Low stock alerts
* Inventory adjustment logs

---

## ## **8. Exportable Reports**

Exports must be **CSV**.

* Daily Sales Report
* Item-wise Sales
* Staff Performance
* Outlet-wise Sales (if multi-outlet enabled)

---

## ## **9. Simple QR Menu (View Only)**

* Generate QR code per outlet/table
* Load `/menu` page
* No ordering allowed
* Fetches menu from Supabase

---

## ## **10. Multi-Outlet Support (Franchise Mode)**

* Create & manage outlets
* Each outlet has:

  * Items
  * Orders
  * Inventory
  * Staff
* Head Office Dashboard
* Combined sales view
* Compare outlets

---

## ## **11. Sales & Analytics Module**

* Daily/Weekly/Monthly sales
* Payment method breakdown
* Best/low selling items
* Staff performance
* Peak hour chart
* Outlet-wise comparison

---

# # 🗂️ **PROJECT FOLDER STRUCTURE (FOR CURSOR TO GENERATE)**

```
src/
 ├── app/
 │   ├── dashboard/
 │   ├── menu/
 │   ├── orders/
 │   ├── tables/
 │   ├── inventory/
 │   ├── reports/
 │   ├── outlets/
 │   ├── settings/
 │   └── api/
 │        ├── fastify/
 │        │    └── server.ts
 │        ├── menu/
 │        │    └── route.ts
 │        ├── orders/
 │        ├── inventory/
 │        ├── reports/
 │        ├── outlets/
 │        └── tables/
 │
 ├── lib/
 │   ├── supabase.ts
 │   ├── fastify.ts
 │   ├── auth.ts
 │   ├── utils.ts
 │   └── types.ts
 │
 ├── components/
 │   ├── ui/ (shadcn)
 │   ├── layout/
 │   ├── forms/
 │   ├── tables/
 │   ├── charts/
 │   └── qr/
 │
 ├── hooks/
 ├── store/
 └── styles/
```

---

# # 🗄️ **SUPABASE DATABASE SCHEMA**

### **Tables**

```
users (id, name, role, email)
outlets (id, name, address)
items (id, outlet_id, name, price, category, available, image_url)
tables (id, outlet_id, name, status)
orders (id, outlet_id, table_id, user_id, status, payment_method, total, tax, created_at)
order_items (id, order_id, item_id, qty, notes)
inventory (id, outlet_id, item_id, stock, low_stock_threshold)
inventory_logs (id, outlet_id, item_id, change, reason, created_at)
sales_summary (id, outlet_id, date, total_sales, total_orders)
```

---

# # ⚙️ **BACKEND ARCHITECTURE — FASTIFY INSIDE NEXT API**

### **Example Setup**

* `/app/api/fastify/server.ts` → initializes a Fastify instance
* Every route file imports Fastify and registers endpoints
* Next.js API handler forwards requests to Fastify

---

# # 📌 **API ENDPOINT LIST**

### **Menu**

* `GET /api/menu`
* `POST /api/menu`
* `PATCH /api/menu/:id`
* `DELETE /api/menu/:id`

---

### **Orders**

* `POST /api/orders`
* `PATCH /api/orders/:id`
* `GET /api/orders/history`
* `POST /api/orders/:id/complete`

---

### **Billing**

* `POST /api/billing/generate`
* `POST /api/billing/reprint`

---

### **Inventory**

* `GET /api/inventory`
* `PATCH /api/inventory/update`
* `GET /api/inventory/alerts`

---

### **Outlets**

* `GET /api/outlets`
* `POST /api/outlets`
* `GET /api/outlets/:id/summary`

---

### **Reports**

* `GET /api/reports/daily`
* `GET /api/reports/itemwise`
* `GET /api/reports/staff`
* `GET /api/reports/outletwise`

---

### **QR Menu**

* `GET /api/qr/:outlet_id`
* Render client page `/menu?outlet={id}`

---

# # 📊 **UI PAGES TO GENERATE**

### **Dashboard**

* Cards: Today's Sales, Orders, Top Item
* Charts: Sales Trend, Peak Hours

### **Menu Page**

* Table of items
* Add/Edit forms
* Toggle available

### **Orders Page**

* Active order list
* Order creation modal
* Status flow

### **Tables Page**

* Dine-in table layout
* Assign order

### **Inventory Page**

* Current stock
* Low stock warnings
* Update stock

### **Reports Page**

* Export buttons
* Tables & charts

### **Outlets Page**

* List outlets
* Add outlet
* Outlet dashboard

---

# # 📈 **FEATURE DEVELOPMENT PHASES**

### **Phase 1 — Core**

* Menu
* Orders
* Billing
* Tables
* Auth

### **Phase 2 — Inventory**

* Stock deduction
* Alerts
* Logs

### **Phase 3 — Reports**

* CSV exports
* Sales module

### **Phase 4 — Multi-outlet**

* Outlet dashboards
* Combined analytics

### **Phase 5 — QR Menu**

* View-only menu
* QR generator

---




