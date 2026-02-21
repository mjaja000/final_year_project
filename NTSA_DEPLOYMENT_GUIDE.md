# NTSA Integration - Migration & Deployment Guide

## Overview

This guide covers deploying the NTSA feedback integration feature from development through production, including database migrations, environment configuration, and rollback procedures.

## Pre-Deployment Checklist

### Development Environment
- [ ] All tests passing locally
- [ ] Feature branch `feature/feedback-ntsa` ready
- [ ] No console errors or warnings
- [ ] Git history clean and commits well-documented

### Staging Environment
- [ ] Deploy to staging server
- [ ] Run database migrations
- [ ] Test NTSA email forwarding with dev email
- [ ] Test WhatsApp in Twilio sandbox
- [ ] Admin team reviews dashboard UI
- [ ] Load testing (if >1000 complaints expected)

### Production Readiness
- [ ] Security review completed
- [ ] NTSA contact information verified
- [ ] Gmail account setup and password secured
- [ ] Database backup strategy confirmed
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured

## Phase 1: Branch Merge to Main

**Status**: Feature branch created and tested
**Branch**: `feature/feedback-ntsa`

### Option A: Via GitHub (Recommended)

1. **Create Pull Request**:
   - Go to GitHub repo
   - Create PR from `feature/feedback-ntsa` → `main`
   - Add description of changes
   - Request code review

2. **Code Review**:
   - Team reviews NTSA classification logic
   - Verify security and access controls
   - Check database schema design

3. **Merge PR**:
   - Click "Merge Pull Request"
   - Confirm merge
   - Delete feature branch

### Option B: Via Command Line

```bash
# Pull latest main
git checkout main
git pull origin main

# Merge feature branch
git merge feature/feedback-ntsa

# Push to remote
git push origin main

# Delete local feature branch
git branch -d feature/feedback-ntsa

# Delete remote feature branch
git push origin --delete feature/feedback-ntsa
```

## Phase 2: Database Schema Migration

### Manual Migration (Development/Staging)

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -d matatuconnect

# Run migration script
\i backend/migrations/ntsa-schema.sql
```

### Migration Script: `backend/migrations/ntsa-schema.sql`

```sql
-- Add NTSA columns to feedback table
BEGIN;

-- NTSA Priority tracking
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_priority VARCHAR(50) 
  DEFAULT 'LOW' 
  CHECK (ntsa_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'));

-- Classification category
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_category VARCHAR(255);

-- Forwarding status
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_forwarded BOOLEAN 
  DEFAULT FALSE;

-- NTSA email message ID for tracking
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_message_id VARCHAR(255);

-- Report type selector
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS report_type VARCHAR(50)
  DEFAULT 'General' 
  CHECK (report_type IN ('General', 'Complaint', 'REPORT_TO_NTSA'));

-- Incident details
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_date DATE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_time TIME;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS crew_details TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- Forwarding timestamp
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_forwarded_at TIMESTAMP;

-- Admin notes for NTSA escalation
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_admin_notes TEXT;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_ntsa_priority 
  ON feedback(ntsa_priority);

CREATE INDEX IF NOT EXISTS idx_feedback_ntsa_forwarded 
  ON feedback(ntsa_forwarded);

CREATE INDEX IF NOT EXISTS idx_feedback_vehicle_number 
  ON feedback(vehicle_number);

CREATE INDEX IF NOT EXISTS idx_feedback_incident_date 
  ON feedback(incident_date);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at 
  ON feedback(created_at DESC);

-- Create view for NTSA stats
CREATE OR REPLACE VIEW v_ntsa_stats AS
SELECT 
  ntsa_priority,
  COUNT(*) as total,
  COUNT(CASE WHEN ntsa_forwarded THEN 1 END) as forwarded,
  COUNT(CASE WHEN NOT ntsa_forwarded THEN 1 END) as local
FROM feedback
WHERE created_at >= (NOW() - INTERVAL '30 days')
GROUP BY ntsa_priority;

COMMIT;
```

### Automated Migration (Production)

Create migration file: `backend/migrations/020-add-ntsa-fields.js`

```javascript
const pool = require('../config/database');

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Run migration SQL
    await client.query(`
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_priority VARCHAR(50) 
        DEFAULT 'LOW' 
        CHECK (ntsa_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'))
    `);
    
    // ... other columns ...
    
    // Create indices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_ntsa_priority 
        ON feedback(ntsa_priority)
    `);
    
    await client.query('COMMIT');
    console.log('✅ Migration successful');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Drop indices
    await client.query('DROP INDEX IF EXISTS idx_feedback_ntsa_priority');
    
    // Drop view
    await client.query('DROP VIEW IF EXISTS v_ntsa_stats');
    
    // Drop columns (in reverse order)
    await client.query(`
      ALTER TABLE feedback 
      DROP COLUMN IF EXISTS ntsa_admin_notes,
      DROP COLUMN IF EXISTS ntsa_forwarded_at,
      DROP COLUMN IF EXISTS evidence_url,
      DROP COLUMN IF EXISTS vehicle_number,
      DROP COLUMN IF EXISTS crew_details,
      DROP COLUMN IF EXISTS incident_time,
      DROP COLUMN IF EXISTS incident_date,
      DROP COLUMN IF EXISTS report_type,
      DROP COLUMN IF EXISTS ntsa_message_id,
      DROP COLUMN IF EXISTS ntsa_forwarded,
      DROP COLUMN IF EXISTS ntsa_category,
      DROP COLUMN IF EXISTS ntsa_priority
    `);
    
    await client.query('COMMIT');
    console.log('✅ Rollback successful');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
```

### Run Migration

```bash
cd backend

# Run pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback if needed
npm run migrate:down
```

## Phase 3: Environment Configuration

### Production `.env` Setup

```env
# ===== APP CONFIGURATION =====
NODE_ENV=production
APP_NAME=MatatuConnect
APP_EMAIL=noreply@matatuconnect.com
APP_URL=https://matatuconnect.com

# ===== DATABASE =====
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=matatuconnect_prod
DB_USER=prod_user
DB_PASSWORD=${SECURE_DB_PASSWORD}

# ===== NTSA CONFIGURATION =====
NTSA_EMAIL=complaints@ntsa.go.ke
DEV_EMAIL=mjajaaa00@gmail.com
CC_DEV_ON_NTSA_FORWARD=true

# ===== EMAIL SERVICE (Gmail SMTP) =====
EMAIL_USER=noreply@matatuconnect.com
GMAIL_APP_PASSWORD=${SECURE_GMAIL_PASSWORD}
EMAIL_FROM_NAME=MatatuConnect Safety Team
EMAIL_PORT=587
EMAIL_HOST=smtp.gmail.com
EMAIL_TLS=true

# ===== JWT / SECURITY =====
JWT_SECRET=${SECURE_JWT_SECRET}
ADMIN_SECRET=${SECURE_ADMIN_SECRET}

# ===== TWILIO (WhatsApp) =====
TWILIO_ACCOUNT_SID=${SECURE_TWILIO_SID}
TWILIO_AUTH_TOKEN=${SECURE_TWILIO_TOKEN}
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://matatuconnect.com/webhooks/whatsapp

# ===== MONITORING & LOGGING =====
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# ===== FEATURE FLAGS =====
ENABLE_NTSA_FORWARDING=true
ENABLE_WHATSAPP=true
DEBUG_MODE=false
```

### Secure Password Storage

**DO NOT commit `.env` to Git!**

```bash
# 1. Create .env.example (no secrets)
cp .env .env.example
# Edit .env.example to remove passwords

# 2. Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore

# 3. Use environment variable management (e.g., Vercel, Heroku, AWS Secrets Manager)
# For AWS:
aws secretsmanager create-secret \
  --name matatuconnect/prod/env \
  --secret-string file://deploy/.env.prod.json
```

## Phase 4: Build & Deployment

### Backend Deployment

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build (if using TypeScript)
npm run build

# 5. Start service
npm start

# Verify logs
tail -f logs/app.log | grep -i "ntsa\|error"
```

### Frontend Deployment

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Build for production
npm run build

# 4. Upload dist/ folder to CDN/web server
# Example: AWS S3 + CloudFront
aws s3 sync dist/ s3://matatuconnect-cdn/app/

# 5. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/*"
```

### Verification Steps

```bash
# 1. Health check
curl -s https://api.matatuconnect.com/health | jq .

# 2. Test NTSA endpoint
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://api.matatuconnect.com/api/feedback/admin/ntsa-stats

# 3. Test feedback submission
curl -X POST https://api.matatuconnect.com/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": 1,
    "vehicleId": 2,
    "comment": "Test feedback",
    "reportType": "General"
  }'

# 4. Check database
psql -U prod_user -h prod-db.example.com -d matatuconnect_prod \
  -c "SELECT COUNT(*) as feedback_count FROM feedback;"

# 5. Monitor logs
tail -f /var/log/matatuconnect/app.log
```

## Phase 5: Monitoring & Alerting

### Setup Application Monitoring

**With Sentry** (for error tracking):

```javascript
// backend/src/app.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Setup NTSA Email Alerts

```javascript
// backend/src/services/emailMonitor.js
async function monitorNTSAEmails() {
  const failedCount = await Feedback.count({
    where: {
      ntsa_forwarded: true,
      ntsa_message_id: null,
      created_at: { $gte: '1 hour ago' }
    }
  });

  if (failedCount > 0) {
    await sendSlackAlert(
      `⚠️ NTSA Email Failures: ${failedCount} complaints unable to forward`
    );
  }
}

// Run every 5 minutes
setInterval(monitorNTSAEmails, 5 * 60 * 1000);
```

### Key Metrics to Monitor

```
1. NTSA Forwarding Success Rate
   - Target: >99%
   - Alert if: <98%

2. Email Delivery Time
   - Target: <5 seconds
   - Alert if: >30 seconds

3. Admin Dashboard Load Time
   - Target: <2 seconds
   - Alert if: >5 seconds

4. Complaint Classification Accuracy
   - Target: >95%
   - Monthly review by admin

5. WhatsApp Delivery Rate
   - Target: >95%
   - Alert if: <90%

6. Database Performance
   - Slow queries: >1 second
   - Index usage: All ntsa_* queries should use indices
```

## Phase 6: Rollback Strategy

### Quick Rollback (if Critical Issues)

**If NTSA forwarding broken**:
```bash
# 1. Disable NTSA forwarding
ENABLE_NTSA_FORWARDING=false npm restart

# 2. Keep complaints in queue for manual forward later
# 3. Notify NTSA team of temporary outage
# 4. Investigate error in staging
```

**If FeedbackManager UI broken**:
```bash
# 1. Revert frontend deployment
aws s3 sync --delete s3://backup/app-v1.2.0/ s3://matatuconnect-cdn/app/

# 2. Invalidate CDN cache
aws cloudfront create-invalidation --distribution-id E123 --paths "/*"
```

**Complete Rollback (Database)**:
```bash
# Run down migration
npm run migrate:down

# This will:
# - Drop NTSA columns
# - Drop NTSA indices  
# - Drop v_ntsa_stats view
# - Restore original schema
```

### Communication Protocol

**When Rollback Triggered**:
1. Notify team in Slack
2. Update status page
3. Email users: "Temporary NTSA feature unavailability"
4. Document issue for post-mortem
5. Test fix thoroughly before re-deploy

## Phase 7: Post-Deployment Tasks

### 1. Test All Features

```bash
# Run integration tests
cd backend
npm run test:integration

# Specific NTSA tests
npm test -- --testPathPattern=ntsa
```

### 2. Load Testing (if expecting high volume)

```bash
# Using Apache Bench
ab -n 1000 -c 10 \
  -H "Authorization: Bearer TOKEN" \
  https://api.matatuconnect.com/api/feedback/admin/ntsa-stats

# Using k6
k6 run backend/tests/load-ntsa-dashboard.js
```

### 3. Smoke Test Checklist

- [ ] Submit general feedback → Receives WhatsApp ✓
- [ ] Submit complaint → Classified as LOW → Not forwarded ✓
- [ ] Submit safety complaint → CRITICAL → Forwarded to NTSA ✓
- [ ] Check admin dashboard → Stats cards display ✓
- [ ] Filter complaints → Works correctly ✓
- [ ] Click complaint → Modal opens ✓
- [ ] Send WhatsApp from admin → Message received ✓
- [ ] Check email in dev inbox → NTSA email received ✓

### 4. Documentation Updates

- [ ] Update user documentation with report types
- [ ] Add admin dashboard guide to training materials
- [ ] Update API documentation with NTSA endpoints
- [ ] Create NTSA forwarding procedures guide

### 5. Training & Communication

- [ ] Train support team on NTSA classifications
- [ ] Prepare talking points for stakeholders
- [ ] Schedule NTSA liaison meeting
- [ ] Create FAQ for customers

## Troubleshooting Post-Deployment

### Issue: NTSA Emails Not Sending

**Check**:
```bash
# 1. Gmail credentials in logs
tail -f logs/app.log | grep -i "email\|gmail"

# 2. Test SMTP directly
npm run test-email

# 3. Check Gmail security
# - Go to https://myaccount.google.com/apppasswords
# - Generate new app password if expired
# - Retry with new password

# 4. Check firewall
netstat -an | grep 587  # Gmail SMTP port
```

**Fix**:
```bash
# Update .env with new Gmail app password
# Restart service
npm restart

# Manually forward missed complaints
POST /api/feedback/admin/ntsa-forward/123 with admin token
```

### Issue: Admin Dashboard Slow

**Check**:
```bash
# 1. Database response time
EXPLAIN ANALYZE SELECT * FROM feedback WHERE ntsa_priority = 'CRITICAL';

# 2. API response time
time curl https://api.matatuconnect.com/api/feedback/admin/ntsa-stats

# 3. Frontend bundle size
npm run build && du -sh dist/
```

**Fix**:
```javascript
// Add caching to stats endpoint
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.get('/admin/ntsa-stats', async (req, res) => {
  const cached = statsCache.get('ntsa-stats');
  if (cached) return res.json(cached);
  
  const stats = await FeedbackController.getNTSAStats();
  statsCache.set('ntsa-stats', stats);
  res.json(stats);
});
```

### Issue: WhatsApp Not Sending

**Check**:
```bash
# 1. Twilio sandbox status
curl https://api.twilio.com/2010-04-01/Accounts/YOUR_SID \
  -u YOUR_SID:YOUR_TOKEN

# 2. Phone number verified in sandbox
# Go to Twilio console → Sandbox
# Check if test number is added

# 3. Test directly
npm run test-whatsapp
```

**Fix**:
```bash
# Verify sandbox phone again in Twilio console
# Or upgrade to Twilio production plan for live numbers
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-19 | Initial NTSA integration deployment |
| 1.1 | TBD | Database optimization and caching |
| 2.0 | TBD | NTSA API integration (when available) |

---

**Deployment Lead**: DevOps Team  
**Last Updated**: 2024-02-19  
**Next Review**: 2024-03-19  
**Status**: Ready for Production
