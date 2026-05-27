#!/bin/bash
# StockVault Local Setup Script
# This script sets up your local development environment

set -e

echo "🚀 StockVault Local Setup"
echo "========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required (you have $(node -v))"
    exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ npm $(npm -v)"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 2: Environment variables
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local with your credentials:"
    echo "   - DATABASE_URL (Supabase pooler connection)"
    echo "   - DIRECT_URL (Supabase direct connection)"
    echo "   - GROQ_API_KEY (from console.groq.com)"
    echo "   - CRON_SECRET (any random string)"
    echo ""
    echo "Once updated, run: npm run db:setup"
    exit 0
fi

echo "✓ .env.local found"
echo ""

# Step 3: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

# Step 4: Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init || echo "⚠️  Migrations may have already been applied"
echo "✓ Database migrations completed"
echo ""

# Step 5: Seed database
echo "🌱 Seeding database with sample data..."
npm run prisma:seed
echo "✓ Database seeded"
echo ""

# Success
echo "========================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. View database: npx prisma studio"
echo ""
echo "Happy coding! 🚀"
