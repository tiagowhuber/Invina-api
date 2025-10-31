# Serverless Deployment Guide

## Overview

This backend is **fully compatible** with serverless platforms like Vercel, AWS Lambda, Netlify Functions, and others. The traditional cron job has been replaced with a more flexible approach suitable for serverless environments.

## Order Expiration Strategy

### How It Works

1. **Automatic Check on Payment**: When a customer initiates payment via `/api/webpay/initiate`, the system automatically checks if the order has expired
2. **Manual Trigger**: You can manually expire old orders by calling `POST /api/admin/expire-orders`
3. **External Cron**: Set up an external scheduler to periodically call the expiration endpoint

## Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI (if not already installed)
```powershell
npm install -g vercel
```

#### 2. Deploy
```powershell
vercel
```

#### 3. Vercel Cron Jobs (Built-in)

The `vercel.json` file is already configured to run order expiration every 5 minutes:

```json
{
  "crons": [{
    "path": "/api/admin/expire-orders",
    "schedule": "*/5 * * * *"
  }]
}
```

This is automatically activated on **Pro and Enterprise plans**. On Hobby plan, use Option 3.

#### 4. Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

```
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=invina
DB_USER=your-user
DB_PASSWORD=your-password
WEBPAY_COMMERCE_CODE=your-code
WEBPAY_API_KEY=your-key
WEBPAY_ENVIRONMENT=production
ORDER_EXPIRATION_MINUTES=15
```

### Option 2: AWS Lambda + API Gateway

#### Using Serverless Framework

1. **Install Serverless**:
```powershell
npm install -g serverless
```

2. **Create `serverless.yml`**:
```yaml
service: invina-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  api:
    handler: dist/server.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
  
  expireOrders:
    handler: dist/server.expireOrders
    events:
      - schedule: rate(5 minutes)
```

3. **Deploy**:
```powershell
serverless deploy
```

### Option 3: External Cron Services (Works with any platform)

Use external services to trigger order expiration:

#### A. GitHub Actions (Free)

Create `.github/workflows/expire-orders.yml`:

```yaml
name: Expire Orders

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - name: Call expire endpoint
        run: |
          curl -X POST https://your-api.vercel.app/api/admin/expire-orders
```

#### B. Cron-job.org (Free)

1. Go to https://cron-job.org
2. Create account and new cron job
3. Set URL: `https://your-api.vercel.app/api/admin/expire-orders`
4. Method: POST
5. Schedule: Every 5 minutes

#### C. EasyCron (Free tier available)

1. Go to https://www.easycron.com
2. Create new cron job
3. URL: `https://your-api.vercel.app/api/admin/expire-orders`
4. Interval: 5 minutes

#### D. UptimeRobot (Free)

Can be used as a cron alternative:
1. Create HTTP(s) monitor
2. URL: `https://your-api.vercel.app/api/admin/expire-orders`
3. Monitor every 5 minutes

### Option 4: Railway

1. **Install Railway CLI**:
```powershell
npm install -g @railway/cli
```

2. **Deploy**:
```powershell
railway login
railway init
railway up
```

3. **Add Cron Plugin**:
Railway supports cron jobs in their dashboard.

## Database Options for Serverless

### Recommended PostgreSQL Providers

1. **Neon** (https://neon.tech)
   - Serverless PostgreSQL
   - Generous free tier
   - Auto-scaling
   - Connection pooling built-in

2. **Supabase** (https://supabase.com)
   - Includes PostgreSQL
   - REST API & Realtime
   - Free tier available

3. **AWS RDS Proxy**
   - Connection pooling for Lambda
   - Prevents connection exhaustion

4. **PlanetScale** (MySQL alternative)
   - If you prefer MySQL
   - Serverless-friendly

### Connection Pooling

For serverless, use connection pooling to avoid "too many connections" errors:

```typescript
// Update src/config/database.ts
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 2, // Reduced for serverless
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});
```

## Environment Variables

Ensure these are set in your deployment platform:

### Required
- `DB_HOST` - Database hostname
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `WEBPAY_COMMERCE_CODE` - Transbank commerce code
- `WEBPAY_API_KEY` - Transbank API key
- `WEBPAY_ENVIRONMENT` - `integration` or `production`

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - `development` or `production`
- `ORDER_EXPIRATION_MINUTES` - Minutes until order expires (default: 15)
- `DB_MAX_CONNECTIONS` - Max DB connections (default: 20, use 2 for serverless)
- `CORS_ORIGIN` - Allowed CORS origins
- `WEBPAY_RETURN_URL` - WebPay return URL
- `WEBPAY_CALLBACK_URL` - WebPay callback URL

## Testing Deployment

After deployment:

1. **Health Check**:
```bash
curl https://your-api.vercel.app/health
```

2. **Create Test Event**:
```bash
curl -X POST https://your-api.vercel.app/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","event_date":"2025-12-31T20:00:00","location":"Test","capacity":10,"price":10}'
```

3. **Test Order Expiration**:
```bash
curl -X POST https://your-api.vercel.app/api/admin/expire-orders
```

## Monitoring

### Vercel
- View logs in Vercel Dashboard
- Set up integrations with Datadog, LogDNA, etc.

### General
- Use Sentry for error tracking
- Set up UptimeRobot for uptime monitoring
- Use Datadog/New Relic for APM

## Cost Optimization

1. **Database Connection Pooling**: Use max 2 connections for serverless
2. **Cold Starts**: Keep functions warm with periodic health checks
3. **Caching**: Implement Redis for frequently accessed data
4. **CDN**: Serve static assets via CDN

## Troubleshooting

### "Too many connections" error
- Reduce `DB_MAX_CONNECTIONS` to 2
- Use connection pooling service (PgBouncer, RDS Proxy)
- Use serverless-friendly database (Neon, Supabase)

### Cold starts
- Use health check endpoint to keep warm
- Consider using provisioned concurrency (AWS Lambda)
- Optimize bundle size

### Cron not working
- Verify Vercel plan supports cron (Pro/Enterprise)
- Use external cron service
- Check endpoint is publicly accessible

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to Git
2. **API Keys**: Store in platform secret manager
3. **CORS**: Set specific origins in production
4. **Rate Limiting**: Implement rate limiting for admin endpoints
5. **Authentication**: Add auth to `/api/admin/*` endpoints

## Next Steps

1. Deploy to your chosen platform
2. Set up database (Neon/Supabase recommended)
3. Configure environment variables
4. Set up external cron or use Vercel Cron
5. Test all endpoints
6. Monitor and optimize
