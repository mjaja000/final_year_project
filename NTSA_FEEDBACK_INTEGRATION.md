# NTSA Feedback & Incident Reporting System

## Overview

The improved feedback system now includes comprehensive NTSA (National Transport and Safety Authority) integration, allowing the platform to classify complaints and automatically forward critical safety violations to NTSA for official investigation.

## Features

### 1. **Enhanced Feedback Form** (Frontend)

**Report Types:**
- **General Feedback**: Regular complaints and compliments about service quality
- **Serious Incident**: Safety violations, harassment, dangerous behavior requiring escalation
- **Report to NTSA**: Critical complaints for forwarding to national authorities

**Additional Fields for NTSA Reporting:**
- Incident date and time
- Vehicle plate number
- Crew member details (if identifiable)
- Evidence links (photos, videos)

### 2. **Complaint Classification System** (Backend)

**Priority Levels:**

#### 🔴 CRITICAL (Automatic NTSA Forward)
- **Vehicle Safety Violations**: Missing seatbelts, unroadworthy vehicles, missing anti-roll bars, no conformity plate
- **Sexual Harassment/Assault**: Physical touching, stripping, sexual comments with gestures, crew blocking passengers
- **Detection**: Keywords like "seatbelt", "unroadworthy", "sexual", "assault", etc.

#### 🟠 HIGH (High Priority Review)
- **Dangerous Driving**: Speeding, reckless overtaking, overloading, unauthorized route deviations, forcing passengers to alight
- **Detection**: Keywords like "speeding", "reckless", "overloading", "dangerous driving"

#### 🟡 MEDIUM (Standard Handling)
- **Commercial Exploitation**: Mid-journey fare hikes, overcharging, fare manipulation
- **Verbal Abuse**: Abusive language, obscene music, intimidation
- **Detection**: Keywords like "fare hike", "overcharged", "abusive", "intimidation"

#### 🟢 LOW (Local Tracking)
- **Service Quality**: Dirty vehicles, poor customer service, unhygienic conditions
- **Detection**: Other complaint types

### 3. **NTSA Email Forwarding** (Backend Service)

**File**: `backend/src/services/ntsaService.js`

**Functionality:**
- Automatic classification of complaints by severity
- Email forwarding for CRITICAL and HIGH priority complaints
- Development mode: Forwards to `mjajaaa00@gmail.com`
- Production mode: Forwards to official NTSA email with dev CC
- Detailed incident information included in forwarded reports

**API Endpoints:**
```
POST /api/feedback/admin/ntsa-forward/:feedbackId
GET /api/feedback/admin/ntsa-stats
POST /api/feedback/admin/whatsapp/:feedbackId/:phoneNumber
```

### 4. **Admin Dashboard UI** (Frontend)

**File**: `frontend/src/components/admin/FeedbackManager.tsx`

**Features:**
- **NTSA Statistics**: Display complaint counts by priority level
- **Complaint Filtering**: Filter by type, search by content, route, or vehicle
- **Priority Visualization**: Color-coded badges for complaint severity
- **Manual NTSA Forwarding**: Admin can manually forward complaints with additional notes
- **WhatsApp Integration**: Send feedback confirmations and NTSA notifications to customers
- **Detailed Views**: Full complaint details with incident information

**Dashboard Metrics:**
```
┌─────────────────────────────────────┐
│ Critical  │ High    │ Medium  │ NTSA  │
│    5      │   12    │   23    │   17  │
└─────────────────────────────────────┘
```

### 5. **WhatsApp Integration**

**Priority-Based Notifications:**

**CRITICAL Complaint:**
```
🚨 *URGENT - CRITICAL PRIORITY*
Category: Vehicle Safety Violations
This complaint has been classified as critical and 
forwarded to NTSA for immediate action.
```

**HIGH Complaint:**
```
⚠️ *HIGH PRIORITY*
Category: Dangerous Driving & Operations
This complaint is being escalated for priority review.
```

**NTSA Forwarding Notification:**
```
🚔 *Report Forwarded to NTSA*
Your complaint has been forwarded to the National 
Transport and Safety Authority (NTSA) for official 
investigation.
```

## Complaint Categories & Examples

### Vehicle Safety Violations
- Missing three-point seatbelts
- Poorly mounted seats
- Missing anti-roll bars
- No conformity plate
- Unroadworthy vehicles operating with RSL

**Why NTSA Handles It**: Direct violation of NTSA's mandate to inspect vehicles and enforce safety standards

### Sexual Harassment & Assault
- Inappropriate physical touching
- Stripping/undressing incidents
- Sexual comments with gestures
- Crew blocking women from exiting

**Why NTSA Handles It**: 82% of perpetrators are crew members; NTSA can revoke licenses and has regulatory authority

### Dangerous Driving & Operations
- Speeding and reckless overtaking
- Overloading passengers beyond capacity
- Unauthorized route deviations
- Forcing passengers to alight before destination

**Why NTSA Handles It**: Can suspend licenses of repeat offender Saccos; driver misconduct cited in accidents

### Commercial Exploitation
- Mid-journey fare hikes (e.g., KSh 100 → KSh 150)
- Overcharging without refund
- Fare manipulation by touts

**Why NTSA Handles It**: Willing to act on fare-related complaints; precedent in Bolt case

### Verbal Abuse & Harassment
- Abusive language from crew
- Obscene music forced on passengers
- Intimidation when complaining

**Why NTSA Handles It**: Falls under consumer rights protection under Article 46 of Constitution

### Service Quality Issues
- Dirty/unhygienic vehicles
- "Sambaza" makeshift seats
- Poor customer service

**Why NTSA May Handle It**: Patterns could indicate broader regulatory failure

## Implementation Details

### Backend Service: NTSAService

```javascript
// Classification example
const classification = NTSAService.classifyComplaint({
  complaintType: 'REPORT_TO_NTSA',
  comment: 'Driver was speeding recklessly, forcing passengers to alight',
  vehicleNumber: 'KAA 123B',
  routeName: 'Nairobi-Rongai'
});

// Returns:
{
  priority: 'HIGH',
  category: 'Dangerous Driving & Operations',
  shouldForwardToNTSA: true,
  reason: 'NTSA can suspend licenses of repeat offenders'
}
```

### Frontend API Integration

```typescript
// Get NTSA statistics
const { data: stats } = useQuery({
  queryKey: ['ntsa-stats'],
  queryFn: () => api.feedback.getNTSAStats()
});

// Forward to NTSA
const forwardMutation = useMutation({
  mutationFn: (feedbackId: number) =>
    api.feedback.forwardToNTSA(feedbackId, { additionalInfo: notes })
});

// Send WhatsApp notification
const whatsappMutation = useMutation({
  mutationFn: (feedbackId: number) =>
    fetch(`/api/feedback/admin/whatsapp/${feedbackId}/${phoneNumber}`, 
      { method: 'POST' })
});
```

## User Workflow

### 1. Customer Reports Incident

1. Navigate to Feedback/Report section
2. Select **"Report to NTSA"** option
3. Fill incident details:
   - Date and time of incident
   - Vehicle plate number
   - Crew member details
   - Evidence links
4. Describe the violation in detail
5. Submit report

### 2. System Classifies Complaint

- NTSAService analyzes complaint text
- Assigns priority level (CRITICAL/HIGH/MEDIUM/LOW)
- Determines if automatic forwarding needed

### 3. Automatic Actions (if CRITICAL/HIGH)

- Email forwarded to NTSA with full details
- WhatsApp notification sent to customer
- Admin dashboard updated with priority flag

### 4. Admin Review & Manual Action

1. Admin reviews complaint in FeedbackManager dashboard
2. Sees priority classification and auto-forward status
3. Can manually forward with additional notes
4. Can send WhatsApp follow-up to customer
5. Tracks NTSA response

## Email Template (NTSA Forwarding)

```
NTSA COMPLAINT REPORT
======================
Priority: CRITICAL
Category: Vehicle Safety Violations
Date Submitted: [timestamp]

INCIDENT DETAILS
================
Date: [incident date]
Time: [incident time]
Route: [route name]
Vehicle Plate: [vehicle number]

COMPLAINT DESCRIPTION
=====================
[Full complaint text]

CREW INFORMATION
================
[Crew details if provided]

PASSENGER DETAILS
=================
Contact: [phone number]

EVIDENCE
========
[Evidence links if provided]
```

## Database Considerations

**Future Enhancements** (Add to feedback table):
```sql
ALTER TABLE feedback ADD COLUMN ntsa_forwarded BOOLEAN DEFAULT FALSE;
ALTER TABLE feedback ADD COLUMN ntsa_message_id VARCHAR(255);
ALTER TABLE feedback ADD COLUMN ntsa_priority VARCHAR(50);
ALTER TABLE feedback ADD COLUMN ntsa_category VARCHAR(255);
ALTER TABLE feedback ADD COLUMN report_type VARCHAR(50);
ALTER TABLE feedback ADD COLUMN incident_date DATE;
ALTER TABLE feedback ADD COLUMN incident_time TIME;
ALTER TABLE feedback ADD COLUMN crew_details TEXT;
ALTER TABLE feedback ADD COLUMN vehicle_number VARCHAR(20);
ALTER TABLE feedback ADD COLUMN evidence_url TEXT;
```

## Configuration

Set these environment variables:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password

# NTSA Configuration
NTSA_EMAIL=complaints@ntsa.go.ke (production)
DEV_EMAIL=mjajaaa00@gmail.com (development)

# App Configuration
APP_EMAIL=noreply@matatuconnect.com
```

## Testing the System

### 1. Test CRITICAL Complaint

```javascript
const testFeedback = {
  routeId: 1,
  vehicleId: 2,
  feedbackType: 'Complaint',
  reportType: 'REPORT_TO_NTSA',
  comment: 'The vehicle is missing seatbelts and the seats are poorly mounted. This is extremely unsafe.',
  incidentDate: '2024-02-19',
  incidentTime: '14:30',
  vehicleNumber: 'KAA 123B',
  crewDetails: 'Driver - male, ~50 years old'
};
```

### 2. Test HIGH Complaint

```javascript
const testFeedback = {
  comment: 'Driver was speeding recklessly and forced me to alight before my destination.',
  reportType: 'REPORT_TO_NTSA'
};
```

### 3. Verify Classifications

```javascript
const classification = NTSAService.classifyComplaint(testFeedback);
console.log(classification); // Should show priority level
```

## Admin Dashboard Usage

### View NTSA Statistics
- Dashboard displays CRITICAL/HIGH/MEDIUM/LOW counts
- Shows breakdown by category
- Tracks forwarded vs. local handling

### Manage Critical Complaints
1. Click on complaint to view details
2. Review classification and incident info
3. Add admin notes if needed
4. Click "Forward to NTSA" to escalate
5. Send WhatsApp to customer for confirmation

## Benefits

✅ **For Customers**: Systematic escalation of serious safety concerns to authorities
✅ **For MatatuConnect**: Demonstrates commitment to passenger safety
✅ **For NTSA**: Structured complaint data for enforcement actions
✅ **For Regulatory Compliance**: Evidence of proactive safety reporting
✅ **For Pattern Recognition**: Track chronic violators by SACCO/vehicle

## Future Enhancements

- [ ] NTSA API integration for direct submission
- [ ] SMS-based complaint submission
- [ ] Driver notification system for complaints
- [ ] Complaint resolution tracking
- [ ] SACCO-level reporting and scoring
- [ ] Automated license suspension alerts
- [ ] WhatsApp group notifications for critical safety issues

---

**Branch**: `feature/feedback-ntsa`
**Lead Developer**: AI Assistant
**Status**: Ready for testing and integration
