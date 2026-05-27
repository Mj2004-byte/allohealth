# StockVault - Real-time Inventory Reservation System

A production-grade ecommerce stock reservation system with AI chatbot powered by Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🎯 Project Overview

StockVault is a sophisticated inventory management platform that allows real-time stock reservations with:

- **Real-time Inventory Management**: Live stock tracking across multiple warehouses
- **Concurrent Reservation Handling**: Row-level database locking prevents overselling
- **Automatic Expiry**: Unreserved stock after 10 minutes (configurable)
- **AI Chatbot**: Groq-powered assistant for customer support
- **Responsive Design**: Mobile-first UI with glassmorphism effects

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **AI**: Groq API (llama3-70b-8192)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Date Handling**: date-fns
- **Deployment**: Vercel (with cron jobs)

## 📋 Environment Variables

Create a `.env.local` file in the root directory:

```
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
GROQ_API_KEY=your-groq-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESERVATION_EXPIRY_MINUTES=10
CRON_SECRET=your-secret-token-for-cron
```

### Environment Variables Explained

- **DATABASE_URL**: Prisma connection string (use connection pooler for production)
- **DIRECT_URL**: Direct database connection (used for migrations)
- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com) - free tier available
- **NEXT_PUBLIC_APP_URL**: Your application URL (public variable)
- **RESERVATION_EXPIRY_MINUTES**: How long reservations last before auto-expiring
- **CRON_SECRET**: Secret token for protecting cron endpoints

## 🚀 Local Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+ (or Supabase account)
- Groq API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stockvault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Seed the database with sample data**
   ```bash
   npm run prisma:seed
   ```

   This creates:
   - 6 products (iPhone, MacBook, Sony headphones, iPad, Apple Watch, AirPods)
   - 3 warehouses (Mumbai, Delhi, Bangalore)
   - Inventory records with varying stock levels

7. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 API Documentation

### Products

**GET /api/products**
- Returns all products with inventory across warehouses
- Response includes `availableStock` (totalStock - reservedStock) per warehouse

### Warehouses

**GET /api/warehouses**
- Returns all warehouse locations

### Reservations

**POST /api/reservations**
- Create a new reservation
- Body: `{ productId, warehouseId, quantity }`
- Returns: Created reservation with expiration time
- Status codes:
  - 201: Success
  - 409: Insufficient stock
  - 404: Inventory not found

**GET /api/reservations/[id]**
- Get reservation details
- Status codes:
  - 200: Success
  - 404: Reservation not found

**POST /api/reservations/[id]/confirm**
- Confirm and complete reservation
- Decrements both totalStock and reservedStock
- Status codes:
  - 200: Success
  - 410: Reservation expired
  - 400: Invalid status

**POST /api/reservations/[id]/release**
- Release and cancel reservation
- Decrements only reservedStock
- Status codes:
  - 200: Success
  - 400: Invalid status

### Chat

**POST /api/chat**
- Stream-based AI chat using Groq
- Body: `{ messages: [{role, content}], context?: string }`
- Returns: Streamed text response

### Cron

**GET /api/cron/cleanup**
- Protected by `Authorization: Bearer CRON_SECRET` header
- Marks expired reservations and restores stock
- Returns count of processed reservations

## 🔒 Concurrency & Data Integrity

### The Problem

Without proper locking, concurrent reservation requests could lead to overselling:
- User A and B both request 5 units from stock of 5
- Both requests see 5 available
- Both reservations succeed (10 units reserved from 5!)

### Our Solution: Row-Level Locking

We use PostgreSQL `SELECT FOR UPDATE` with Prisma transactions:

```typescript
const reservation = await prisma.$transaction(
  async (tx) => {
    // This locks the row, other transactions wait
    const inventory = await tx.$queryRaw`
      SELECT * FROM "Inventory"
      WHERE "productId" = ${productId}
      AND "warehouseId" = ${warehouseId}
      FOR UPDATE;
    `;

    // Calculate available stock
    const available = inventory.totalStock - inventory.reservedStock;
    
    // Check before updating
    if (available < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update is now safe - no other transaction can interfere
    await tx.$executeRaw`
      UPDATE "Inventory" SET "reservedStock" = ...
    `;
  },
  { isolationLevel: 'Serializable' }
);
```

**How it works:**
1. Transaction 1: Locks row, checks stock (5 available), reserves 5
2. Transaction 2: Waits for lock to be released
3. Lock released, Transaction 2 checks stock (0 available), returns error
4. Result: No overselling ✓

## ⏰ Expiry Mechanism

### Automatic Cleanup with Vercel Cron

Reservations automatically expire after `RESERVATION_EXPIRY_MINUTES` (default: 10 minutes).

**Cron Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "*/5 * * * *"
  }]
}
```

- Runs every 5 minutes
- Finds all pending reservations with `expiresAt < now()`
- Marks them as `expired` and returns `reservedStock`
- Maximum delay: 5 minutes

**Tradeoff**: Simple to implement but up to 5-minute delay vs real-time cleanup (would require Redis with expiring keys or background jobs).

### Reservation Lifecycle

```
pending → confirmed (user confirms) → ✓
pending → released (user cancels) → ✓
pending → expired (timer runs out or cron job) → ✓
```

**Stock Changes:**
- **Create reservation** (pending): `reservedStock += quantity`
- **Confirm** (pending → confirmed): `totalStock -= quantity`, `reservedStock -= quantity`
- **Release** (pending → released): `reservedStock -= quantity`
- **Expire** (pending → expired): `reservedStock -= quantity`

## 🎨 UI/UX Features

### Design System

- **Colors**: Deep navy background (#0A0F1E), electric blue primary (#3B82F6), emerald success (#10B981)
- **Typography**: "Sora" for headings, "JetBrains Mono" for prices/numbers
- **Effects**: Glassmorphism cards, backdrop blur, smooth transitions
- **Animations**: Gradient shifts, countdown timer color changes, pulsing effects

### Pages

**Home Page** (`/`)
- Hero section with animated gradient text
- Product grid with real-time stock updates
- Warehouse selector for multi-warehouse products
- 30-second polling for live stock changes

**Reservation Page** (`/reserve/[id]`)
- Order summary with pricing
- Live countdown timer with color changes (green → yellow → red → pulsing)
- Confirm/Cancel buttons with loading states
- Success/Expiry/Cancel confirmation screens
- Auto-expires and releases reservation when timer hits 00:00

### AI Chatbot

Floating widget (bottom-right) with:
- Initial greeting message
- Streaming responses from Groq API
- Typing indicator animation
- Auto-scrolling message list
- Clear chat history button
- Responsive design (400px desktop, full-screen mobile)

## 📦 Database Schema

### Products
- Store product metadata (name, price, description, images)

### Warehouses
- Store warehouse locations

### Inventory
- Tracks stock per product × warehouse
- `totalStock`: Physical inventory count
- `reservedStock`: Held for pending reservations
- `availableStock` (calculated): totalStock - reservedStock
- Unique constraint on (productId, warehouseId)

### Reservations
- Track all reservation requests
- Status: pending, confirmed, released, expired
- Auto-expires based on `expiresAt` timestamp

## 🔧 Available Commands

```bash
# Development
npm run dev                 # Start dev server on http://localhost:3000

# Database
npm run prisma:migrate    # Run pending migrations
npm run prisma:generate   # Generate Prisma Client
npm run prisma:seed       # Seed database with sample data

# Production
npm run build             # Build for production
npm start                 # Start production server

# Code Quality
npm run lint              # Run ESLint
```

## 🚀 Deployment to Vercel

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import GitHub repository
   - Add environment variables in Settings
   - Deploy!

3. **Setup Cron Jobs**
   - Vercel automatically runs cron jobs defined in `vercel.json`
   - Ensure `CRON_SECRET` is set in production environment

4. **Database**
   - Use Supabase (PostgreSQL) for production
   - Enable connection pooler for serverless
   - Run migrations: `npx prisma migrate deploy`
   - Seed if needed: Run seed endpoint or script

## ⚡ Performance Optimizations

### Current Implementation
- PostgreSQL row-level locking for concurrency
- Prisma singleton pattern for efficient connection pooling
- React state management (no external Redux)
- Next.js Image component ready (update ProductCard when images available)
- Streaming responses for chat API

### Recommended Production Improvements

1. **Redis for Session Cache**
   ```
   Cache product inventory for 30 seconds
   Reduces database queries during high traffic
   ```

2. **WebSocket for Real-time Updates**
   ```
   Push inventory changes to connected clients
   Instant stock updates without polling
   ```

3. **Idempotency Keys**
   ```
   Prevent duplicate reservations from network retries
   Add: x-idempotency-key header to POST /api/reservations
   ```

4. **Rate Limiting**
   ```
   Prevent bot abuse on reservation endpoint
   Use Vercel Middleware or Upstash Redis
   ```

5. **Database Indexing**
   ```sql
   CREATE INDEX idx_inventory_product_warehouse 
   ON "Inventory"("productId", "warehouseId");
   CREATE INDEX idx_reservations_status_expires 
   ON "Reservation"(status, "expiresAt");
   ```

6. **Connection Pooling**
   ```
   Use Supabase connection pooler (PgBouncer)
   Avoid connection exhaustion on serverless
   ```

## 📊 Scalability Notes

### Current Limits
- Single PostgreSQL database (works for ~1000 concurrent users)
- Polling-based updates (not optimal for high frequency)
- No message queue (cron-based cleanup has delays)

### At Scale (>10k users)
- Implement Redis caching layer
- Use WebSockets for real-time updates
- Add background job queue (Bull, Temporal)
- Split reads/writes with replica databases
- Implement GraphQL subscription for chat

## 🐛 Troubleshooting

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Database Connection Error
- Check `DATABASE_URL` format
- Verify IP whitelist in Supabase
- Test with `psql` directly

### Chat API Failing
- Verify `GROQ_API_KEY` is valid
- Check Groq rate limits
- Ensure streaming response is enabled

### Cron Jobs Not Running
- Verify `vercel.json` is in root directory
- Check cron logs in Vercel dashboard
- Ensure `CRON_SECRET` is set

## 📝 License

MIT License - feel free to use this for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Open an issue or submit a PR for:
- Bug fixes
- Performance improvements
- New features (wishlist features, payment integration, etc.)
- Documentation improvements

## 📧 Support

For questions or issues:
- Check documentation above
- Open GitHub issue
- Review code comments in implemen