# StockVault Deployment Guide

Complete guide to deploy StockVault to Vercel with PostgreSQL/Supabase.

## 📋 Checklist

- [ ] GitHub repository created and code pushed
- [ ] Supabase project created with PostgreSQL database
- [ ] Groq API key obtained
- [ ] Vercel account created
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Cron jobs verified

## 🔧 Prerequisites

### Required Services (Free Tier Available)

1. **GitHub** - Code repository
2. **Vercel** - Hosting and serverless functions
3. **Supabase** - PostgreSQL database
4. **Groq** - AI API for chatbot

### Local Requirements

- Node.js 18+ installed
- npm or yarn package manager

## Step-by-Step Deployment

### Phase 1: Repository Setup

#### 1.1 Initialize Git

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit: StockVault application"
```

#### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create repository: `stockvault`
3. Don't initialize with README (you already have one)
4. Click "Create repository"

#### 1.3 Push Code

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/stockvault.git
git branch -M main
git push -u origin main
```

### Phase 2: Database Setup (Supabase)

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: `stockvault` (or preferred name)
   - **Database Password**: Create strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (wait 2-3 minutes)

#### 2.2 Get Connection Strings

1. In Supabase dashboard, click "Database" in sidebar
2. Click "Connection Strings" tab
3. Copy both URLs:

**For Environment Variables:**

- **Connection Pooler** (DATABASE_URL for app):
  ```
  postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
  ```

- **Direct Connection** (DIRECT_URL for migrations):
  ```
  postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
  ```

**Important**: Replace `[PASSWORD]` and `[HOST]` with your actual values.

#### 2.3 Verify Connection

Test connection locally:

```bash
# Create .env.local file
echo "DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:6543/postgres" > .env.local

# Generate Prisma client
npx prisma generate

# Check connection
npx prisma studio  # Opens database UI on http://localhost:5555
```

If Prisma Studio opens, your connection works! ✓

### Phase 3: API Keys

#### 3.1 Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Navigate to "API Keys" section
4. Create new API key
5. Copy the key (you'll only see it once!)

**Example**: `gsk_abcdef123456...`

#### 3.2 Create Cron Secret

Generate a secure random string:

```bash
# On Windows PowerShell:
-join((33..126) | Get-Random -Count 32 | % {[char]$_})

# On Mac/Linux:
openssl rand -base64 32
```

**Example**: `rp9x7kL2mN8qW5jH4vZ6bYcXa3sD1eF2`

### Phase 4: Vercel Deployment

#### 4.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel access to GitHub
4. Click "Import Git Repository"
5. Paste: `https://github.com/YOUR_USERNAME/stockvault.git`
6. Click "Import"

#### 4.2 Configure Project

- **Framework Preset**: Should auto-detect "Next.js" ✓
- **Build Command**: `prisma generate && next build` ✓
- **Install Command**: `npm install` ✓
- **Output Directory**: `.next` ✓

#### 4.3 Set Environment Variables

In project settings, go to **Settings → Environment Variables**.

Add all variables for "Production":

```
DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:6543/postgres
DIRECT_URL = postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres
GROQ_API_KEY = gsk_abcdef123456...
CRON_SECRET = rp9x7kL2mN8qW5jH4vZ6bYcXa3sD1eF2
RESERVATION_EXPIRY_MINUTES = 10
NODE_ENV = production
```

**⚠️ CRITICAL**: Use connection **pooler** (port 6543) for DATABASE_URL!

#### 4.4 Deploy

1. Click "Deploy" button
2. Wait for build to complete (2-3 minutes)
3. Once "Deployment Successful" appears, you have a URL!

**Your app is now live**: `https://YOUR_PROJECT.vercel.app`

### Phase 5: Database Migration

After successful deployment, run migrations in production:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Pull production environment variables
vercel env pull --environment=production

# Run migrations against production database
npx prisma migrate deploy

# Seed database with sample data
npx prisma db seed
```

#### Option B: Using Supabase Dashboard

1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Run initial schema setup (usually automatic with Prisma)

### Phase 6: Verify Everything

#### 6.1 Test Homepage

1. Visit `https://YOUR_PROJECT.vercel.app`
2. Should see product grid loading
3. Check browser console for errors (F12 → Console tab)

#### 6.2 Test API Endpoints

```bash
# Products endpoint
curl https://YOUR_PROJECT.vercel.app/api/products | jq

# Warehouses endpoint
curl https://YOUR_PROJECT.vercel.app/api/warehouses | jq
```

Should return JSON data.

#### 6.3 Test Chatbot

1. Click chat widget (bottom-right corner)
2. Send a message
3. Should receive streamed response from Groq

#### 6.4 Test Cron Job

```bash
curl https://YOUR_PROJECT.vercel.app/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "expired": 0,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

If it returns `401 Unauthorized`, your CRON_SECRET doesn't match.

## 🐛 Troubleshooting

### Build Fails

**Error**: `DATABASE_URL is missing`

**Solution**:
1. Go to Vercel Settings → Environment Variables
2. Ensure all variables are set
3. Click "Redeploy" button

---

**Error**: `Prisma engine not available`

**Solution**:
1. Make sure `build` script is: `prisma generate && next build`
2. Ensure `@prisma/client` is in dependencies (not devDependencies)

### Database Connection Issues

**Error**: `Connection timeout at 6543`

**Solution**:
- You used direct connection URL instead of pooler
- Supabase URL must be `HOST:6543` (not 5432)
- Update DATABASE_URL in Vercel environment variables

---

**Error**: `DIRECT_URL is missing for migrations`

**Solution**:
- Ensure DIRECT_URL is set in environment variables
- Use port 5432 (direct) not 6543 (pooler)
- Only used during migration, not in app

### Chat Doesn't Work

**Error**: `Post /api/chat returns 502`

**Solution**:
1. Verify GROQ_API_KEY is valid:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer YOUR_GROQ_KEY"
   ```
2. Check Groq account has API quota
3. Groq free tier has rate limits (check usage)

### Cron Job Not Running

**Symptom**: Reservations don't auto-expire

**Solution**:
1. Check `vercel.json` exists in root
2. Verify CRON_SECRET is set in Vercel
3. Test manually:
   ```bash
   curl https://YOUR_PROJECT.vercel.app/api/cron/cleanup \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## 📊 Production Checklist

Before using in production:

- [ ] Database backups configured (Supabase auto-backups)
- [ ] Error monitoring set up (Vercel has logs)
- [ ] Database indices on frequently queried fields
- [ ] Implement rate limiting on APIs
- [ ] CORS configured appropriately
- [ ] SSL/HTTPS enforced (automatic on Vercel)
- [ ] Database credentials rotated
- [ ] Monitoring set up for cron jobs

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use Vercel dashboard for sensitive values
   - Rotate CRON_SECRET periodically

2. **Database**
   - Use strong database password
   - Enable SSL connections
   - Restrict IP access if possible
   - Regular backups

3. **API Keys**
   - Use separate Groq key per environment
   - Implement rate limiting
   - Monitor API usage for anomalies

4. **CORS**
   - Whitelist specific origins
   - Avoid `*` in production

## 📈 Scaling & Optimization

### Current Limits

- Vercel free tier: 12 serverless function invocations/day (included)
- Supabase free tier: 500MB database, 2GB bandwidth
- Groq free tier: Reasonable rate limits

### When to Upgrade

- Expect >1000 daily users → Vercel Pro
- Database >500MB → Supabase Pro
- Groq API rate limits hit → Paid plan

## 📞 Support

- **Vercel Issues**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Issues**: [supabase.com/docs](https://supabase.com/docs)
- **Groq API Help**: [console.groq.com](https://console.groq.com)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
