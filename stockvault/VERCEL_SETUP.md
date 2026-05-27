# Quick Vercel Deployment Guide

Deploy StockVault to Vercel in **under 5 minutes**.

## Prerequisites

- GitHub account (free)
- Vercel account (free, connect with GitHub)
- Supabase account (free PostgreSQL hosting)
- Groq API key (free tier available)

## Quick Start (5 Minutes)

### 1. Get Database Credentials (Supabase)

**Sign up at supabase.com:**

1. Create new PostgreSQL project
2. Go to Database → Connection Strings
3. Copy these 2 URLs:
   ```
   postgresql://postgres:PASSWORD@HOST:6543/postgres   (DATABASE_URL - port 6543)
   postgresql://postgres:PASSWORD@HOST:5432/postgres   (DIRECT_URL - port 5432)
   ```

### 2. Get API Keys

**Groq API Key:**
1. Go to console.groq.com
2. Create API key
3. Copy the `gsk_...` key

**Cron Secret (just a random string):**
```
openssl rand -base64 32   # Mac/Linux
```
Example: `rp9x7kL2mN8qW5jH4vZ6bYcXa3sD1eF2`

### 3. Deploy on Vercel

1. Go to **vercel.com/new**
2. Click "Import Git Repository"
3. Paste: `https://github.com/YOUR_USERNAME/stockvault`
4. Click Import
5. **Set Environment Variables** (Settings tab):
   ```
   DATABASE_URL = postgresql://...@HOST:6543/postgres
   DIRECT_URL = postgresql://...@HOST:5432/postgres
   GROQ_API_KEY = gsk_...
   CRON_SECRET = rp9x7kL2mN8qW5jH4vZ6bYcXa3sD1eF2
   RESERVATION_EXPIRY_MINUTES = 10
   NODE_ENV = production
   ```
6. Click "Deploy" 🚀

**⚠️ CRITICAL**: Use **port 6543** for DATABASE_URL (connection pooler), **5432** for DIRECT_URL!

### 4. Run Database Migration (After Deploy)

```bash
# Install Vercel CLI
npm install -g vercel

# Pull env vars
vercel env pull --environment=production

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### 5. Done! ✅

Visit `https://your-project.vercel.app` - your app is live!

## Testing

**Test the app:**
```bash
curl https://your-project.vercel.app/api/products
```

**Test cron job:**
```bash
curl https://your-project.vercel.app/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Build fails with "DATABASE_URL not found" | Add env vars in Vercel Settings, then redeploy |
| Chat doesn't work (502 error) | Check GROQ_API_KEY is valid at console.groq.com |
| Reservations don't expire | Verify CRON_SECRET matches Vercel env var |
| Database connection timeout | Use port **6543** for DATABASE_URL (pooler, not 5432) |

## Local Development

After cloning:

```bash
# Windows
./setup.bat

# Mac/Linux
bash setup.sh
```

Or manually:

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your DB credentials

npm run db:setup
npm run dev
```

Visit http://localhost:3000

## File Structure

```
stockvault/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities (Prisma client)
│   └── types/           # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Sample data
├── .env.local.example   # Environment template
├── .env.example         # Simple env template
├── DEPLOYMENT.md        # Detailed deployment guide
└── vercel.json          # Cron job configuration
```

## Architecture

```
┌─────────────────────────────────────┐
│  Vercel (Frontend + API)            │
│  - Next.js 14 (React)               │
│  - Serverless functions (/api)      │
│  - Cron jobs (cleanup)              │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
┌────▼────┐        ┌────▼─────────┐
│ Supabase│        │ Groq API     │
│PostgreSQL       │  (Chat/AI)   │
│         │        │              │
└─────────┘        └──────────────┘

Features:
• Real-time inventory sync
• Concurrent reservation locking
• Auto-expire (5-min cleanup)
• Streaming chat responses
```

## Next Steps

- Add custom domain: Settings → Domains
- Enable analytics: Vercel Analytics
- Set up monitoring: Vercel Error Tracking
- Configure backups: Supabase Backups

---

📖 Need more help? See **DEPLOYMENT.md** for detailed troubleshooting.

🚀 Need development help? See **README.md** for API docs and local setup.
