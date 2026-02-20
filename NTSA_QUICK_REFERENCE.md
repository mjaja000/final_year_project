# NTSA Integration - Quick Reference Card

## 🚀 For Developers

### The 3 Minute Overview

**What**: Automatic complaint classification and forwarding to NTSA  
**Why**: Safety violations need regulatory attention  
**How**: Keyword detection → Priority assignment → Auto-email or Admin review  

### Key Files to Know

```
Backend:
├── src/services/ntsaService.js ⭐ Classification engine
├── src/controllers/feedbackController.js (modified)
├── src/routes/feedbackRoutes.js (modified, +3 endpoints)
└── src/services/whatsappService.js (enhanced)

Frontend:
├── src/components/FeedbackForm.tsx (modified, +report type selector)
├── src/components/admin/FeedbackManager.tsx ⭐ Admin dashboard
└── src/lib/api.ts (modified, +NTSA API methods)
```

### The Classification Flow

```
Customer Submission (comment text)
          ↓
NTSAService.classifyComplaint()
    ↓           ↓           ↓           ↓
  Safety?    Sexual?    Dangerous?   Other?
    ↓           ↓           ↓           ↓
 CRITICAL    CRITICAL     HIGH       MEDIUM/LOW
    ↓           ↓           ↓           ↓
  └───────────┬───────────┘           │
              ↓                        ↓
      Auto-forward to NTSA      Store with priority
      + WhatsApp notification    + Admin review in dashboard
```

### The 5 Core Classification Categories

| Priority | Category | Examples | Action |
|----------|----------|----------|--------|
| 🔴 CRITICAL | Vehicle Safety | No seatbelt, unroadworthy | Auto → NTSA |
| 🔴 CRITICAL | Sexual Harassment | Assault, stripping | Auto → NTSA |
| 🟠 HIGH | Dangerous Driving | Speeding, overloading | Display in dashboard |
| 🟡 MEDIUM | Commercial Abuse | Fare hikes, overcharging | Display in dashboard |
| 🟡 MEDIUM | Verbal Abuse | Abusive language | Display in dashboard |
| 🟢 LOW | Service Quality | Dirty vehicle, poor service | Store in database |

### Environment Variables (Production)

```env
NTSA_EMAIL=complaints@ntsa.go.ke          # Production NTSA
EMAIL_USER=your-gmail@gmail.com            # Your gmail
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx    # Gmail app password
ENABLE_NTSA_FORWARDING=true                # Toggle on/off
```

### API Quick Test

```bash
# Get NTSA stats (admin only)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/feedback/admin/ntsa-stats

# Expected response:
{
  "totalComplaints": 25,
  "byCriticality": {"CRITICAL": 2, "HIGH": 5, ...},
  "byCategory": {...},
  "forwardedToNTSA": 7,
  "handleLocally": 18
}
```

### Common Debugging

| Problem | Cause | Solution |
|---------|-------|----------|
| All complaints = LOW | Keywords not matching | Check ntsaService.js keywords |
| Email not sending | Gmail password wrong | Regenerate app password |
| WhatsApp not sending | Sandbox not verified | Re-verify in Twilio console |
| Dashboard slow | No database indices | Run migration script |
| Null complaint details | Old records (null columns) | Add default values in view |

---

## 📊 For Admin/Product

### What Admins Can Do

1. **View Dashboard**
   - 4 stat cards showing CRITICAL/HIGH/MEDIUM/LOW counts
   - Search/filter complaints by type and content
   - See color-coded priority badges

2. **Review Complaints**
   - Click complaint card to see full details
   - View incident info (date, time, vehicle, crew)
   - Read customer's full comment

3. **Take Action**
   - **Forward to NTSA**: Add admin notes, send formal complaint
   - **Send WhatsApp**: Notify customer of status update
   - **Add Notes**: Document admin perspective

4. **Monitor NTSA Stats**
   - Total complaints vs forwarded to NTSA
   - Breakdown by priority level
   - Category distribution

### NTSA Email Contents (What Gets Sent)

```
FROM: noreply@matatuconnect.com
TO: complaints@ntsa.go.ke
CC: mjajaaa00@gmail.com (dev mode)

Subject: NTSA Complaint Report - [Vehicle Plate] - [Priority]

Body Contains:
- Priority level (CRITICAL/HIGH)
- Complaint category
- Date/time of incident
- Vehicle plate number
- Route name
- Full customer complaint text
- Customer phone for follow-up
- Any evidence links provided
- Reference ID for tracking
```

### WhatsApp Messages Customers Receive

**Message 1 (Feedback Confirmation)**:
```
✅ Your feedback has been received
Category: [Safety/Harassment/Other]
Priority: [Low/Medium/High/Critical]
Status: [Handled locally/Escalated/Forwarded to NTSA]
```

**Message 2 (If NTSA Forwarded)**:
```
🚔 Your report forwarded to NTSA
Reference: #F-12345
NTSA will investigate and contact you
Thank you for reporting safety concerns
```

### Key Decisions You Make

- ✅ **Accept CRITICAL classifications** or adjust keywords?
- ✅ **Approve manual NTSA forwards** or let auto-forwarding handle all?
- ✅ **Share WhatsApp notifications** or keep them internal?
- ✅ **Escalation timing**: immediate or batch review?

---

## 📱 For Support Team

### How to Help Customers

**Customer asks**: "Where do I report a safety issue?"  
**Answer**: "Use 'Report to NTSA' button in Feedback. Include details like vehicle number and time. We'll forward critical issues to NTSA for investigation."

**Customer asks**: "Who gets my report?"  
**Answer**: "Safety violations go to the National Transport Authority (NTSA). Service quality issues we handle directly on our platform."

**Customer asks**: "How long before NTSA responds?"  
**Answer**: "NTSA typically responds within 2-7 days. You'll receive a WhatsApp from us once forwarded."

**Customer asks**: "Can I remain anonymous?"  
**Answer**: "Your phone number is required so NTSA can follow up. But you can use minimal personal details in the description."

### NTSA Categories Cheat Sheet

| What They Say | Category | Our Response |
|---------------|----------|--------------|
| "Vehicle has no seatbelts" | Safety | Auto → NTSA 🚔 |
| "Driver was speeding dangerously" | Dangerous | Dashboard review ⚠️ |
| "Conductor touched me inappropriately" | Sexual Abuse | Auto → NTSA 🚔 |
| "Driver increased fare mid-way" | Commercial | Dashboard review ⚠️ |
| "Conductor used abusive language" | Verbal | Dashboard review ⚠️ |
| "Vehicle was dirty" | Service | Our handling ✓ |

---

## 🔍 For QA/Testing

### Test Scenarios

| Scenario | Expected | How to Verify |
|----------|----------|---------------|
| Submit safety complaint | CRITICAL priority | Check dashboard stats +1 CRITICAL |
| Submit cleanliness complaint | LOW priority | Check dashboard stats +1 LOW |
| Admin forwards to NTSA | Email sent + SMS received | Check dev email + Twilio logs |
| Admin sends WhatsApp | Message to customer | Check Twilio sandbox |
| Filter by vehicle number | Complaints filtered | Search for "KAA 123B" |
| Admin adds notes | Notes saved | Reopen complaint, see notes |

### Load Testing Targets

```
Concurrent Users: 100
Complaint Submission Rate: 10/second
Dashboard Load Time: <2 seconds (for 10K complaints)
NTSA Email Send: <5 seconds
WhatsApp Delivery: <3 seconds
```

### Regression Test Checklist

- [ ] Regular feedback still works (General Feedback flow)
- [ ] Existing complaints unaffected by new columns
- [ ] Old routes still accessible (no breaking changes)
- [ ] Admin dashboard doesn't require new login
- [ ] Email still works for other features
- [ ] WhatsApp still works for other notifications

---

## 📚 For Documentation & Communications

### Talking Points (Why This Matters)

> "By automatically sending critical safety violations to NTSA, we're creating a formal channel for passenger protection. This isn't just feedback—it's regulatory enforcement."

### Key Benefits Summary

| Stakeholder | Benefit |
|-------------|---------|
| **Passengers** | Safety concerns reach authorities immediately |
| **MatatuConnect** | Demonstrates commitment to safety |
| **NTSA** | Structured complaint data for enforcement |
| **Operators** | Clear rules and accountability |

### User-Facing Messages

**For Feedback Form**:
> "Help us keep passengers safe. Report safety violations, harassment, and dangerous driving directly to authorities."

**For Confirmation**:
> "Your safety report has been classified and forwarded to NTSA for investigation."

**For Dashboard**:
> "Critical complaints are automatically escalated. Monitor your fleet's safety standing here."

---

## ⚡ Emergency Contacts

| Issue | Who | Action |
|-------|-----|--------|
| NTSA emails failing | DevOps | Check Gmail credentials, restart service |
| Dashboard down | Frontend team | Check database, clear cache, redeploy |
| Classification wrong | Product | Review keywords, update ntsaService.js |
| Customer couldn't submit | Support | Check WhatsApp status, database space |

---

## 📋 Before Release Checklist

**Development**:
- [ ] All code committed to feature/feedback-ntsa
- [ ] Tests passing locally
- [ ] No console errors

**Staging**:
- [ ] Database migration runs cleanly
- [ ] NTSA email sends to dev inbox
- [ ] WhatsApp sends in sandbox
- [ ] Admin dashboard loads quickly
- [ ] Admin team reviews UI

**Pre-Production**:
- [ ] NTSA email configured for production
- [ ] Gmail app password securely stored
- [ ] Twilio WhatsApp live (not sandbox)
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented

**Post-Release**:
- [ ] Monitor error logs for 24 hours
- [ ] Run smoke tests each hour for 8 hours
- [ ] Collect admin feedback
- [ ] Verify NTSA receives emails
- [ ] Track complaint classification accuracy

---

## 🎓 Learning Resources

**To Understand NTSA Integration**:
1. Read: [NTSA_FEEDBACK_INTEGRATION.md](NTSA_FEEDBACK_INTEGRATION.md) (5 min)
2. Review: [NTSA_ARCHITECTURE_DECISIONS.md](NTSA_ARCHITECTURE_DECISIONS.md) (15 min)
3. Implement: [NTSA_SETUP_TESTING.md](NTSA_SETUP_TESTING.md) (30 min)
4. Deploy: [NTSA_DEPLOYMENT_GUIDE.md](NTSA_DEPLOYMENT_GUIDE.md) (45 min)

**Total Time**: ~90 minutes to full understanding

---

**Version**: 1.0  
**Last Updated**: 2024-02-19  
**Status**: Production Ready
