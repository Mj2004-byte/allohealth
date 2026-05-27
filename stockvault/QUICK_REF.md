# Quick Reference Guide

Essential commands and information for StockVault development.

## 🚀 Getting Started

### First Time Setup

```bash
# Clone project
git clone https://github.com/YOUR_USERNAME/stockvault.git
cd stockvault

# Windows: Run setup.bat
# Mac/Linux: Run bash setup.sh

# Or manually:
npm install
cp .env.local.example .env.local
# Edit .env.local with your credentials
npm run db:setup
npm run dev
```

Visit: http://localhost:3000

## 📦 NPM Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run prisma:migrate   # Create migration
npm run prisma:seed      # Seed database
npm run db:setup         # Full DB setup (migrate + seed)
npm run db:reset         # Reset DB and reseed
```

## 🗄️ Database Commands

```bash
npx prisma studio       # View database GUI
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Create & run migration
npx prisma db seed      # Run seed script
npx prisma db push      # Push schema changes
```

## 📁 Project Structure

```
stockvault/
├── src/app/
│   ├── page.tsx              # Home page (product list)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles & animations
│   ├── api/
│   │   ├── products/         # GET products
│   │   ├── reservations/     # POST/GET/confirm/release
│   │   ├── warehouses/       # GET warehouses
│   │   ├── chat/             # POST messages (streaming)
│   │   └── cron/cleanup/     # Cron job (every 5 min)
│   └── reserve/[id]/page.tsx # Reservation confirmation UI
├── src/components/
│   ├── ProductCard.tsx       # Product grid item
│   ├── ChatWidget.tsx        # AI chat interface
│   ├── Header.tsx            # Navigation header
│   └── CountdownTimer.tsx    # 10-min timer display
├── src/lib/
│   └── prisma.ts            # Prisma singleton
├── src/types/
│   └── index.ts             # TypeScript interfaces
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Sample data
└── [Docs & Config Files]
```

## 🔌 API Endpoints

**Products**
- `GET /api/products` - All products with inventory

**Reservations**
- `POST /api/reservations` - Create 10-min hold
- `GET /api/reservations/[id]` - Get reservation details
- `POST /api/reservations/[id]/confirm` - Complete purchase
- `POST /api/reservations/[id]/release` - Cancel hold

**Chat**
- `POST /api/chat` - Stream AI responses

**Warehouses**
- `GET /api/warehouses` - All locations

**Cron** (Protected)
- `GET /api/cron/cleanup` - Clean expired (runs every 5 min)

## 🔐 Environment Variables

```bash
# Database (Supabase)
DATABASE_URL=postgresql://...@HOST:6543/postgres   # Pooler (port 6543)
DIRECT_URL=postgresql://...@HOST:5432/postgres     # Direct (port 5432)

# AI & Auth
GROQ_API_KEY=gsk_...                              # AI chat API
CRON_SECRET=your-secret-token                      # Cron protection

# App Config
RESERVATION_EXPIRY_MINUTES=10                      # Reservation hold time
NODE_ENV=development|production

# Optional (Public - can be in .env)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🐛 Debugging

### In VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser DevTools

```javascript
// Test API from console
fetch('/api/products')
  .then(r => r.json())
  .then(d => console.log(d))

// Test chat
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages: [{role:'user',content:'Hi'}] })
})
  .then(r => r.text())
  .then(d => console.log(d))
```

### Database Connection

```bash
# Test connection
npx prisma studio

# Check migrations
npx prisma migrate status

# View schema
cat prisma/schema.prisma
```

## 🚀 Deployment

### To Vercel (5 min)

1. Push to GitHub
2. Import on https://vercel.com/new
3. Add env vars (DATABASE_URL with port **6543**)
4. Deploy
5. Run: `vercel env pull && npx prisma migrate deploy`

### Full Guide
See: **VERCEL_SETUP.md** or **DEPLOYMENT.md**

## 🧪 Testing

### Unit/Integration

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build check
npm run build
```

### Manual API Testing

```bash
# Get products
curl http://localhost:3000/api/products | jq

# Create reservation
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"...","warehouseId":"...","quantity":1}'
```

## 📊 Database Schema Quick View

```
Products           Warehouses         Inventory         Reservations
├── id             ├── id             ├── id            ├── id
├── name           ├── name           ├── productId     ├── productId
├── price          ├── location       ├── warehouseId   ├── warehouseId
├── description    ├── createdAt      ├── totalStock    ├── quantity
├── category       └── [relations]    ├── reservedStock │├── status
└── [relations]                       └── [relations]   ├── expiresAt
                                                        ├── createdAt
                                                        └── [relations]
```

## 🎨 Key CSS Classes

```css
.glass           /* Glassmorphism effect */
.glass-strong    /* Stronger glass effect */
.btn-primary     /* Blue gradient button */
.btn-danger      /* Red danger button */
.btn-success     /* Green success button */

/* Animations */
.animate-fade-up       /* Fade in moving up */
.animate-float         /* Floating movement */
.animate-timer-pulse   /* Pulsing effect */
.animate-bounce-dot    /* Bouncing dots */
.animate-pulse-glow    /* Glowing pulse */
```

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| **README.md** | Project overview, tech stack, local setup |
| **VERCEL_SETUP.md** | Quick 5-minute deployment guide |
| **DEPLOYMENT.md** | Comprehensive deployment walkthrough |
| **API.md** | Complete API endpoint reference |
| **CHECKLIST.md** | Pre-launch verification checklist |
| **CHANGES.md** | Summary of all fixes and improvements |

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| `DATABASE_URL not found` | Add to .env.local or Vercel env vars |
| `Prisma error` | Run `npx prisma generate` |
| `Port 3000 in use` | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| `Chat returns 502` | Check GROQ_API_KEY is valid |
| `Cron fails (401)` | Verify CRON_SECRET in env vars |

## 🔗 Useful Links

- **Repository**: https://github.com/YOUR_USERNAME/stockvault
- **Live App**: https://your-project.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Console**: https://app.supabase.com
- **Groq Console**: https://console.groq.com

## 💾 Git Workflow

```bash
# Before committing
npm run lint        # Check code style
npm run build       # Test build

# Daily workflow
git pull            # Get latest changes
git checkout -b feature-name  # Create branch
# ... make changes ...
git add .
git commit -m "feature: description"
git push origin feature-name
# Create pull request on GitHub
```

## 🎯 Performance Tips

- Images are lazy-loaded (next/image)
- API responses are cached with proper headers
- Database queries use indices
- Tailwind CSS is purged for production
- No unnecessary re-renders (useMemo, useCallback)

## 📈 Monitoring

Check Vercel dashboard for:
- Build times
- API response times
- Error rates
- Cron job success rate
- Bandwidth usage

---

**Tip**: Bookmark **VERCEL_SETUP.md** and **DEPLOYMENT.md** for quick reference!

**Last Updated**: January 2024
