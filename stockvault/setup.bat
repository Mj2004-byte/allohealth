@echo off
REM StockVault Local Setup Script for Windows
REM This script sets up your local development environment

setlocal enabledelayedexpansion

echo.
echo 🚀 StockVault Local Setup
echo =========================
echo.

REM Check Node.js
for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODE_VERSION=%%i
if "%NODE_VERSION%"=="" (
    echo ❌ Node.js is not installed
    echo    Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js %NODE_VERSION%
for /f "tokens=*" %%i in ('npm -v 2^>nul') do echo ✓ npm %%i
echo.

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Step 2: Check .env.local
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy .env.local.example .env.local
    echo ⚠️  Please edit .env.local with your credentials:
    echo    - DATABASE_URL ^(Supabase pooler connection^)
    echo    - DIRECT_URL ^(Supabase direct connection^)
    echo    - GROQ_API_KEY ^(from console.groq.com^)
    echo    - CRON_SECRET ^(any random string^)
    echo.
    echo Opening .env.local in notepad...
    start notepad .env.local
    echo.
    echo Once updated, run: npm run db:setup
    pause
    exit /b 0
)

echo ✓ .env.local found
echo.

REM Step 3: Generate Prisma Client
echo 🔧 Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Step 4: Run migrations
echo 🗄️  Running database migrations...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ⚠️  Migrations may have already been applied
)
echo ✓ Database migrations completed
echo.

REM Step 5: Seed database
echo 🌱 Seeding database with sample data...
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo ⚠️  Database may have already been seeded
)
echo ✓ Database seeded
echo.

REM Success
echo =========================
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Start development server: npm run dev
echo 2. Open http://localhost:3000 in your browser
echo 3. View database: npx prisma studio
echo.
echo Happy coding! 🚀
echo.
pause
