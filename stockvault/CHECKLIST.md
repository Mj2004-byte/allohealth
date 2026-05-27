# Pre-Deployment Checklist ✓

Complete this checklist before deploying to Vercel.

## Code Quality

- [x] TypeScript compiles without errors
- [x] No console errors in development
- [x] All API endpoints return correct data
- [x] Prisma schema is valid
- [x] Environment variables are documented
- [x] Git repository is clean (no uncommitted changes)

## Configuration Files

- [x] `package.json` - Build scripts correct
- [x] `next.config.js` - Production settings configured
- [x] `tsconfig.json` - TypeScript strict mode enabled
- [x] `tsconfig.seed.json` - Seed config for migrations
- [x] `prisma/schema.prisma` - Database schema defined
- [x] `vercel.json` - Cron jobs configured
- [x] `.env.local.example` - Template for env vars
- [x] `.env.example` - Simple env template
- [x] `.gitignore` - Excludes node_modules, .env files
- [x] `.vercelignore` - Optimizes for Vercel

## Documentation

- [x] `README.md` - Project overview and local setup
- [x] `DEPLOYMENT.md` - Detailed deployment guide
- [x] `VERCEL_SETUP.md` - Quick 5-minute deployment
- [x] `API.md` - Complete API reference
- [x] Inline code comments for complex logic
- [x] Error messages are user-friendly

## Database

- [ ] Supabase project created
- [ ] Database credentials obtained
- [ ] `DATABASE_URL` (pooler, port 6543)
- [ ] `DIRECT_URL` (direct, port 5432)
- [ ] Tested connection locally
- [ ] Schema migrations created

## API Keys

- [ ] Groq API key obtained (console.groq.com)
- [ ] Valid Groq free tier account
- [ ] CRON_SECRET generated
- [ ] All keys stored securely (not in code)

## Local Testing

- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts server
- [ ] App loads on `http://localhost:3000`
- [ ] Products endpoint returns data
- [ ] Chat widget works
- [ ] Reservation flow works end-to-end
- [ ] Database migrations run
- [ ] Seed data loads

## Vercel Setup

- [ ] GitHub repository created and pushed
- [ ] Vercel account created
- [ ] Project imported on Vercel
- [ ] Environment variables added:
  - [ ] `DATABASE_URL`
  - [ ] `DIRECT_URL`
  - [ ] `GROQ_API_KEY`
  - [ ] `CRON_SECRET`
  - [ ] `RESERVATION_EXPIRY_MINUTES`
  - [ ] `NODE_ENV=production`
- [ ] First deployment successful

## Post-Deployment Testing

- [ ] App loads on Vercel URL
- [ ] Products API endpoint works
- [ ] Chat endpoint works
- [ ] Cron job runs (test manually)
- [ ] Reservations can be created
- [ ] Reservations can be confirmed
- [ ] Reservations can be cancelled
- [ ] Reservation expiry works

## Production Security

- [ ] No secrets in git history
- [ ] `DATABASE_URL` uses pooler (port 6543)
- [ ] `DIRECT_URL` for migrations only
- [ ] CRON_SECRET is strong (32+ chars)
- [ ] Environment variables not logged
- [ ] Error handling doesn't expose internals
- [ ] CORS properly configured
- [ ] Rate limiting considered

## Monitoring (Optional but Recommended)

- [ ] Vercel error tracking enabled
- [ ] Database connection monitoring
- [ ] Groq API quota monitoring
- [ ] Cron job success tracking
- [ ] Application performance monitoring

## Documentation Review

- [ ] README is accurate
- [ ] Deployment guide covers all steps
- [ ] API documentation is complete
- [ ] Error messages are helpful
- [ ] Setup instructions are clear

---

## Quick Verification

```bash
# Run this before deployment
npm run build       # Should succeed
npm run lint        # Should pass
npx prisma studio  # Should connect to DB
```

---

## Deployment Steps

1. [ ] Complete all checks above
2. [ ] Push code to GitHub
3. [ ] Import project on Vercel
4. [ ] Add environment variables
5. [ ] Deploy
6. [ ] Run database migration: `vercel env pull && npx prisma migrate deploy`
7. [ ] Seed database: `npx prisma db seed`
8. [ ] Run post-deployment tests
9. [ ] Monitor logs for errors
10. [ ] Share live URL

---

## Support Links

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **Groq Console**: https://console.groq.com

---

## Notes

Completed on: ___________

Team members notified: ___________

Go-live date: ___________

---

✅ **Ready to deploy!** 🚀
