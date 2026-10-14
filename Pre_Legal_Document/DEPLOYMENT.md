# Deployment Guide

This guide covers deploying the Pre Legal Document Generator to Vercel with Docker support for local development.

## Quick Start (Vercel)

### 1. Prerequisites
- Vercel account
- GitHub repository
- PostgreSQL database (Vercel Postgres, Neon, Supabase, or self-hosted)
- Redis instance (Vercel KV, Upstash, or self-hosted)

### 2. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fpre-legal-document-generator&env=DATABASE_URL,AUTH_SECRET,NEXT_PUBLIC_APP_URL&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fyour-org%2Fpre-legal-document-generator%2Fblob%2Fmain%2F.env.production.example)

### 3. Manual Setup

#### Clone and Install
```bash
git clone https://github.com/your-org/pre-legal-document-generator.git
cd pre-legal-document-generator
pnpm install
```

#### Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

#### Run Setup Script
```bash
chmod +x scripts/setup-vercel.sh
./scripts/setup-vercel.sh
```

## Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | 32+ character random string | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://prelegal.app` |

### Optional (Services)
| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Google Cloud Console |
| `EMAIL_API_KEY` | Resend/SendGrid | Email delivery |
| `PAYMENT_SECRET_KEY` | Stripe | Billing (sk_live_...) |
| `PAYMENT_WEBHOOK_SECRET` | Stripe | Webhook signing (whsec_...) |
| `AI_API_KEY` | OpenAI/Anthropic | AI-assisted drafting |
| `SENTRY_DSN` | Sentry | Error tracking |

See `.env.production.example` for complete list.

## Database Setup

### Vercel Postgres (Recommended)
1. Go to Vercel Dashboard > Storage > Create Database > Postgres
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `pnpm db:migrate`

### External PostgreSQL
- Neon: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db`
- Supabase: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`
- AWS RDS: `postgresql://user:pass@xxx.rds.amazonaws.com:5432/db`

### Run Migrations
```bash
# Local
pnpm db:migrate

# Production (via Vercel CLI)
vercel env pull .env.production
pnpm db:migrate
```

## Docker Development

### Start Services
```bash
docker compose up -d
```

### Run Migrations
```bash
docker compose --profile migrate up migrate
```

### Seed Database
```bash
docker compose --profile seed up seed
```

### View Logs
```bash
docker compose logs -f app
```

### Stop Services
```bash
docker compose down
# WARNING: docker compose down -v deletes database data
```

## Production Docker Deployment

### Build Image
```bash
docker build -t prelegal/app -f docker/app/Dockerfile ..
```

### Deploy with Docker Compose
```bash
cp .env.production.example .env.production
# Edit .env.production
docker compose -f docker/app/docker-compose.prod.yml up -d
```

### With Caddy (HTTPS)
```bash
# Configure Caddyfile with your domain
# Set DOMAIN and CADDY_EMAIL in .env.production
docker compose -f docker/app/docker-compose.prod.yml up -d
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) handles:
1. **Lint & Typecheck** - ESLint, TypeScript
2. **Unit Tests** - Vitest
3. **Build** - Next.js production build
4. **Docker Build** - Multi-stage Docker image
5. **Deploy Preview** - Vercel preview on PRs
6. **Deploy Production** - Vercel production on main branch

### Required GitHub Secrets
| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | Vercel Account Settings > Tokens |
| `VERCEL_ORG_ID` | `vercel inspect <deployment>` |
| `VERCEL_PROJECT_ID` | `vercel inspect <deployment>` |
| `DATABASE_URL` | Your database |
| `AUTH_SECRET` | Generated secret |
| `NEXT_PUBLIC_APP_URL` | Your domain |
| ... | All other env vars |

## Vercel Configuration

### Project Settings
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install`
- **Node Version**: 20.x

### Environment Variables
Add all variables from `.env.production.example` to:
- **Production**: Vercel Dashboard > Settings > Environment Variables
- **Preview**: Same values (or use `vercel env pull`)

### Domains
1. Add custom domain in Vercel Dashboard > Settings > Domains
2. Configure DNS:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

### Cron Jobs
Vercel Cron Jobs are configured in `vercel.json`:
- `cleanup-expired-shares`: Daily at 2 AM UTC
- `usage-reset`: Monthly on 1st at midnight UTC

## Health Checks

### Application Health
```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### Database Health
Included in `/api/health` - checks PostgreSQL connectivity.

## Monitoring

### Vercel Analytics
Enable in Vercel Dashboard > Analytics for:
- Web Vitals
- Page views
- Function invocations

### Sentry (Optional)
1. Create Sentry project
2. Add `SENTRY_DSN` to environment variables
3. Errors automatically captured

### Logs
- Vercel: Dashboard > Functions > Logs
- Docker: `docker compose logs -f app`

## Rollback

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Docker
```bash
# Tag current as backup
docker tag prelegal/app:latest prelegal/app:backup-$(date +%s)

# Deploy previous version
docker compose -f docker/app/docker-compose.prod.yml up -d --force-recreate
```

## Troubleshooting

### Build Failures
- Check Node version (20.x required)
- Verify all env vars are set
- Check Prisma schema matches database

### Runtime Errors
- Check `/api/health` endpoint
- Review Vercel function logs
- Verify database connectivity

### Performance
- Enable Vercel Edge Functions for API routes
- Configure caching headers in `vercel.json`
- Use `@vercel/kv` for session storage

## Security Checklist

- [ ] `AUTH_SECRET` is 32+ random characters
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] Stripe webhook secret configured
- [ ] OAuth redirect URIs match production domain
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Backups scheduled (daily for PostgreSQL)

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Security: security@your-domain.com