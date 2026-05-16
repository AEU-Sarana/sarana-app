# Mini POS System Roadmap

## 1. Project Overview

We will build a **Mini POS System** with separate experiences for different roles.

The system will support:

- Product management
- Sales and checkout
- Stock receiving from suppliers
- Stock adjustment and stock history
- Reports
- Barcode scanning with phone camera
- Simple customer notes during checkout

The system will have three main roles:

```text
Admin
Cashier
Receiver
```

---

## 2. Technology Stack

We will use:

```text
Frontend: Next.js + TypeScript
Backend: Express.js + TypeScript
ORM: Prisma
Database: PostgreSQL
Styling: Tailwind CSS
```

System architecture:

```text
Admin Web Dashboard
        ↓
Express.js Backend API
        ↓
Prisma ORM
        ↓
PostgreSQL Database

Cashier Mini App
        ↓
Express.js Backend API
        ↓
Prisma ORM
        ↓
PostgreSQL Database

Receiver Mini App
        ↓
Express.js Backend API
        ↓
Prisma ORM
        ↓
PostgreSQL Database
```

---

## 3. Main Roles

## 3.1 Admin

Admin uses the **web dashboard**.

Admin can manage:

- Dashboard
- Users
- Products
- Suppliers
- Stock
- Stock receiving history
- Stock adjustment
- Sales history
- Reports
- System settings

Admin has the highest permission level.

---

## 3.2 Cashier

Cashier uses the **cashier mini app**.

Cashier can:

- Login
- Logout
- Search product
- Scan barcode with phone camera
- Add product to cart
- Change quantity
- Remove item from cart
- Add customer name, phone, and note
- Complete sale
- View receipt

Cashier should not manage products, suppliers, users, or reports.

---

## 3.3 Receiver

Receiver uses the **receiver mini app**.

Receiver handles incoming stock from suppliers.

Receiver can:

- Login
- Logout
- View product list
- View supplier list
- Receive products from suppliers
- Record supplier invoice number
- Record received quantity
- Record cost price
- Add receiving note
- Submit stock-in record
- View receiving history
- Scan barcode when receiving products

Receiver should not create sales or view business reports.

---

## 4. Feature List

## 4.1 Authentication

- Login
- Logout
- Role-based access
  - Admin
  - Cashier
  - Receiver

After login:

```text
ADMIN    -> /admin/dashboard
CASHIER  -> /cashier/checkout
RECEIVER -> /receiver/stock-in
```

---

## 4.2 Admin Web Dashboard Features

### Dashboard

Admin can view:

- Today sales total
- Total orders today
- Low-stock products
- Top-selling products
- Recent sales
- Stock-in summary

### Product Management

Admin can:

- View product list
- Add product
- Edit product
- Delete product
- Set product barcode
- Set price
- Set cost
- Set stock
- Link product to supplier

### Supplier Management

Admin can:

- View supplier list
- Add supplier
- Edit supplier
- Delete supplier
- View products by supplier

### Stock Management

Admin can:

- View current stock
- Receive stock from supplier
- View stock receiving history
- Adjust stock manually
- View stock movement history
- View low-stock products

### Sales Management

Admin can:

- View all sales
- View sale detail
- View receipt
- Filter sales by date
- Filter sales by cashier
- Search invoice number

### Reports

Admin can view:

- Daily sales total
- Weekly sales total
- Monthly sales total
- Total orders
- Top-selling products
- Low-stock products
- Profit report
- Sales by cashier

### User Management

Admin can:

- Create cashier account
- Create receiver account
- Edit user account
- Disable user account
- Reset user password

---

## 4.3 Cashier Mini App Features

Cashier mini app should be simple, fast, and mobile-friendly.

### Checkout

Cashier can:

- Search product
- Scan barcode with phone camera
- Add product to cart
- Change quantity
- Remove item from cart
- See total amount
- Enter paid amount
- See change amount
- Complete sale

### Customer Note

During checkout, cashier can add optional customer information:

- Customer name
- Customer phone
- Customer note

This is not full customer management yet. It is only a note for each sale.

### Receipt

After sale is completed, cashier can view:

- Invoice number
- Cashier name
- Customer name
- Customer phone
- Customer note
- Items
- Total
- Paid amount
- Change amount
- Date

---

## 4.4 Receiver Mini App / Stock-In Features

Receiver uses a **mini app** to record stock received from suppliers.

### Stock-In Flow

```text
1. Receiver logs in
2. Select supplier
3. Enter supplier invoice/reference number
4. Search product or scan barcode
5. Add products to receiving list
6. Enter received quantity
7. Enter cost price
8. Add note
9. Submit stock-in
10. System increases product stock
11. System records who received it
```

Example:

```text
Supplier: ABC Drinks
Supplier invoice: SUP-INV-00123
Received by: Receiver Dara

Items:
- Coca Cola x50, cost $0.40
- Water x100, cost $0.20
```

After submit:

```text
Coca Cola stock +50
Water stock +100
```

---

## 4.5 Barcode Scanner

Barcode scanner will be used mainly by cashier and receiver.

### Cashier Barcode Flow

```text
Open scanner
Camera reads barcode
Find product by barcode
Add product to cart
```

### Receiver Barcode Flow

```text
Open scanner
Camera reads barcode
Find product by barcode
Add product to stock-in list
Enter received quantity
```

If product is not found:

```text
Show: Product not found
```

---

## 5. Permission Map

| Feature | Admin | Cashier | Receiver |
|---|---:|---:|---:|
| Login / Logout | Yes | Yes | Yes |
| Dashboard | Yes | No | Optional |
| Product list | Yes | Read only | Read only |
| Add product | Yes | No | No |
| Edit product | Yes | No | No |
| Delete product | Yes | No | No |
| Supplier list | Yes | No | Read only |
| Add supplier | Yes | No | No |
| Edit supplier | Yes | No | No |
| Delete supplier | Yes | No | No |
| Checkout | Optional | Yes | No |
| Create sale | Optional | Yes | No |
| Receipt | Yes | Yes | No |
| Stock-in / Receive products | Yes | No | Yes |
| Manual stock adjustment | Yes | No | No |
| View stock movement | Yes | No | Yes, limited |
| Reports | Yes | No | No |
| Manage users | Yes | No | No |
| Barcode scanner | Optional | Yes | Yes |

---

## 6. Database Tables

## 6.1 users

```text
id
name
email
password
role
created_at
```

Role values:

```text
ADMIN
CASHIER
RECEIVER
```

---

## 6.2 products

```text
id
name
barcode
price
cost
stock
supplier_id
created_at
updated_at
```

---

## 6.3 suppliers

```text
id
name
phone
address
note
created_at
```

---

## 6.4 sales

```text
id
invoice_number
cashier_id
customer_name
customer_phone
customer_note
subtotal
total
paid_amount
change_amount
created_at
```

---

## 6.5 sale_items

```text
id
sale_id
product_id
quantity
price
subtotal
```

---

## 6.6 stock_receives

This table stores the main stock-in receiving record.

```text
id
receive_number
supplier_id
supplier_invoice_number
received_by_id
note
total_cost
received_at
created_at
```

Meaning:

```text
supplier_id = supplier who delivered the products
received_by_id = receiver or admin who received the products
```

---

## 6.7 stock_receive_items

This table stores each product inside a stock receiving record.

```text
id
stock_receive_id
product_id
quantity
cost
subtotal
```

---

## 6.8 stock_adjustments

This table stores manual stock correction records.

```text
id
adjustment_number
adjusted_by_id
reason
note
created_at
```

---

## 6.9 stock_adjustment_items

```text
id
stock_adjustment_id
product_id
adjustment_type
quantity
before_stock
after_stock
```

Adjustment types:

```text
INCREASE
DECREASE
SET
```

---

## 6.10 stock_movements

This table is used as stock history or stock audit log.

```text
id
product_id
type
quantity
before_stock
after_stock
reason
reference_type
reference_id
created_by_id
created_at
```

Movement types:

```text
STOCK_IN
SALE
ADJUSTMENT
RETURN
```

Example stock-in movement:

```text
product: Coca Cola
type: STOCK_IN
quantity: +50
before_stock: 20
after_stock: 70
reason: Received from supplier ABC Drinks
reference_type: STOCK_RECEIVE
reference_id: 1
created_by_id: Receiver Dara
```

Example sale movement:

```text
product: Coca Cola
type: SALE
quantity: -2
before_stock: 70
after_stock: 68
reason: Sold invoice INV-0001
reference_type: SALE
reference_id: 1
created_by_id: Cashier Sokha
```

---

## 6.11 Optional Future Tables

These can be added later:

```text
categories
payments
customers
refunds
branches
settings
```

---

## 7. API Routes

## 7.1 Auth API

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## 7.2 Product API

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/barcode/:barcode
```

---

## 7.3 Supplier API

```text
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

---

## 7.4 Sales API

```text
POST /api/sales
GET  /api/sales
GET  /api/sales/:id
```

---

## 7.5 Stock Receive API

```text
POST /api/stock-receives
GET  /api/stock-receives
GET  /api/stock-receives/:id
```

---

## 7.6 Stock Adjustment API

```text
POST /api/stock-adjustments
GET  /api/stock-adjustments
GET  /api/stock-adjustments/:id
```

---

## 7.7 Report API

```text
GET /api/reports/dashboard
GET /api/reports/daily-sales
GET /api/reports/top-products
GET /api/reports/low-stock
GET /api/reports/sales-by-cashier
```

---

## 8. Next.js Route Structure

Recommended route structure:

```text
app/
├── login/
│   └── page.tsx
│
├── admin/
│   ├── dashboard/
│   ├── products/
│   ├── suppliers/
│   ├── stock/
│   ├── stock-in/
│   ├── stock-adjustments/
│   ├── sales/
│   ├── reports/
│   └── users/
│
├── cashier/
│   ├── checkout/
│   ├── scan/
│   └── receipt/
│       └── [id]/
│
└── receiver/
    ├── stock-in/
    ├── stock-in/
    │   └── history/
    └── scan/
```

---

## 9. Development Roadmap

## Phase 1: Backend Foundation

Build:

- Express.js + TypeScript setup
- Prisma setup
- PostgreSQL setup
- User model
- Product model
- Supplier model
- Sale model
- SaleItem model
- StockReceive model
- StockReceiveItem model
- StockMovement model
- Login API
- Role middleware

Goal:

```text
Admin, Cashier, and Receiver can login with different roles.
```

---

## Phase 2: Admin Web Basic

Build:

- Admin login
- Admin dashboard layout
- Product list
- Add product
- Edit product
- Delete product
- Supplier list
- Add supplier
- User management

Goal:

```text
Admin can prepare products, suppliers, and users.
```

---

## Phase 3: Receiver Mini App / Stock-In

Build:

- Receiver mini app layout
- Receiver login
- Stock-in page
- Supplier selection
- Product search
- Barcode scan for product
- Add product to receiving list
- Submit stock-in
- Increase product stock
- Create stock movement record
- View stock-in history

Goal:

```text
Receiver can receive products from suppliers and stock increases automatically.
```

---

## Phase 4: Cashier Mini App

Build:

- Cashier login
- Checkout page
- Product search
- Cart
- Quantity change
- Remove item
- Customer name, phone, and note
- Complete sale
- Receipt page

Goal:

```text
Cashier can create a sale and view receipt.
```

---

## Phase 5: Stock Logic

Add backend logic:

- Check product stock before sale
- Reduce stock after sale
- Reject sale if stock is not enough
- Create stock movement after sale
- Create stock movement after stock-in
- Create stock movement after adjustment

Goal:

```text
All stock changes are tracked correctly.
```

---

## Phase 6: Reports

Build admin reports:

- Today sales total
- Total orders
- Top-selling products
- Low-stock products
- Sales by cashier
- Stock-in report

Goal:

```text
Admin can monitor business performance.
```

---

## Phase 7: Barcode Scanner

Build barcode scanner features:

- Open phone camera
- Scan barcode
- Search product by barcode
- Add product to cart for cashier
- Add product to stock-in list for receiver
- Show error if product is not found

Goal:

```text
Cashier and Receiver can work faster using phone camera barcode scanning.
```

---

## 10. Recommended First Version

For the first working version, focus on:

```text
1. Login with roles
2. Admin product management
3. Admin supplier management
4. Receiver stock-in
5. Cashier checkout
6. Stock increase from receiving
7. Stock decrease from sales
8. Simple receipt
```

After that, add:

```text
Reports
Barcode scanner
Stock adjustment
Advanced dashboard
```

---

## 11. Team Explanation

We will build a Mini POS System with three user experiences:

```text
Admin Web Dashboard
Cashier Mini App
Receiver Stock-In App
```

Admin will manage the system, products, suppliers, users, stock, and reports.

Cashier will use a simple mini app for checkout, barcode scanning, customer notes, sale completion, and receipt.

Receiver will use a simple mini app for stock-in. The receiver mini app will allow receivers to receive items from suppliers, record supplier invoice numbers, enter quantities and costs, scan barcodes, and update stock.

All roles will connect to the same Express.js backend API, Prisma ORM, and PostgreSQL database.

The main goal is to build a working POS flow where:

```text
Supplier delivers stock
Receiver records stock-in
System increases product stock
Cashier sells products
System decreases product stock
Admin views reports and stock history
```