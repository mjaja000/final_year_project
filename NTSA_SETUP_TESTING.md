# NTSA Integration - Setup & Testing Guide

## Quick Start

### 1. Database Schema Update

Add these columns to the `feedback` table:

```sql
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_forwarded BOOLEAN DEFAULT FALSE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_priority VARCHAR(50) DEFAULT 'LOW';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_category VARCHAR(255);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ntsa_message_id VARCHAR(255);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS report_type VARCHAR(50);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_date DATE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS incident_time TIME;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS crew_details TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS evidence_url TEXT;
```

### 2. Environment Configuration

Update your `.env` file:

```env
# Email Service (Gmail)
EMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM_NAME=MatatuConnect Support

# NTSA Configuration
NTSA_EMAIL=complaints@ntsa.go.ke
DEV_EMAIL=mjajaaa00@gmail.com
FORWARD_TO_NTSA=true

# App Configuration
NODE_ENV=development
APP_EMAIL=noreply@matatuconnect.com

# Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### 3. Gmail App Password Setup

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the generated 16-character password
4. Add to `.env` as `GMAIL_APP_PASSWORD`

## Testing the System

### Test 1: Classification Test

**File**: `backend/test-ntsa-classification.js`

```javascript
const NTSAService = require('./src/services/ntsaService');

// Test CRITICAL complaint
console.log('=== TESTING CRITICAL CLASSIFICATION ===');
const criticalTest = {
  comment: 'The vehicle is missing seatbelts and has no conformity plate!',
  vehicleNumber: 'KAA 123B',
  reportType: 'REPORT_TO_NTSA'
};

const criticalResult = NTSAService.classifyComplaint(criticalTest);
console.log('CRITICAL Test:', criticalResult);
console.assert(criticalResult.priority === 'CRITICAL', 'Should be CRITICAL');

// Test HIGH complaint
console.log('\n=== TESTING HIGH CLASSIFICATION ===');
const highTest = {
  comment: 'Driver was speeding recklessly on the highway',
  reportType: 'REPORT_TO_NTSA'
};

const highResult = NTSAService.classifyComplaint(highTest);
console.log('HIGH Test:', highResult);
console.assert(highResult.priority === 'HIGH', 'Should be HIGH');

// Test MEDIUM complaint
console.log('\n=== TESTING MEDIUM CLASSIFICATION ===');
const mediumTest = {
  comment: 'The conductor was very rude and used abusive language',
  reportType: 'Complaint'
};

const mediumResult = NTSAService.classifyComplaint(mediumTest);
console.log('MEDIUM Test:', mediumResult);
console.assert(mediumResult.priority === 'MEDIUM', 'Should be MEDIUM');

// Test LOW complaint
console.log('\n=== TESTING LOW CLASSIFICATION ===');
const lowTest = {
  comment: 'The vehicle seat was a bit uncomfortable',
  reportType: 'Feedback'
};

const lowResult = NTSAService.classifyComplaint(lowTest);
console.log('LOW Test:', lowResult);
console.assert(lowResult.priority === 'LOW', 'Should be LOW');

console.log('\n✅ All classification tests passed!');
```

**Run Test**:
```bash
cd backend
node test-ntsa-classification.js
```

### Test 2: Email Forwarding Test

**File**: `backend/test-ntsa-email.js`

```javascript
const NTSAService = require('./src/services/ntsaService');

async function testEmailForwarding() {
  try {
    console.log('🧪 Testing NTSA Email Forwarding...');
    
    const feedback = {
      id: 99999,
      customer_name: 'Test User',
      phone_number: '+254700000000',
      email: 'test@example.com',
      vehicle_number: 'KAA 123B',
      route_name: 'Nairobi-Rongai',
      comment: 'Vehicle missing seatbelts and operating unsafely',
      incident_date: '2024-02-19',
      incident_time: '14:30',
      crew_details: 'Driver - male, ~50 years old',
      vehicle_id: 1,
      route_id: 2
    };

    const forwardResult = await NTSAService.forwardToNTSA(
      feedback,
      'Test forwarding from development environment'
    );

    console.log('✅ Email forwarding result:');
    console.log(forwardResult);

  } catch (error) {
    console.error('❌ Email forwarding failed:');
    console.error(error.message);
  }
}

testEmailForwarding();
```

**Run Test**:
```bash
cd backend
node test-ntsa-email.js
```

### Test 3: Admin API Endpoints

**Test NTSA Stats Endpoint**:

```bash
# Get NTSA statistics
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:3000/api/feedback/admin/ntsa-stats
```

**Expected Response**:
```json
{
  "totalComplaints": 25,
  "byCriticality": {
    "CRITICAL": 2,
    "HIGH": 5,
    "MEDIUM": 8,
    "LOW": 10
  },
  "byCategory": {
    "Vehicle Safety Violations": 2,
    "Dangerous Driving & Operations": 5,
    "Commercial Exploitation": 3,
    "Verbal Abuse & Harassment": 5,
    "Service Quality Issues": 10
  },
  "forwardedToNTSA": 7,
  "handleLocally": 18
}
```

**Test Manual NTSA Forward**:

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalNotes": "Customer provided vehicle photo evidence",
    "adminId": 5
  }' \
  http://localhost:3000/api/feedback/admin/ntsa-forward/15
```

### Test 4: Frontend Form Testing

1. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Feedback Form**

3. **Test Case 1: General Feedback**
   - Select "General Feedback"
   - Fill in content
   - Submit
   - ✅ Should show simple confirmation

4. **Test Case 2: Serious Incident**
   - Select "Serious Incident"
   - Fill in content and incident details
   - Submit
   - ✅ Should classify and show escalation message

5. **Test Case 3: Report to NTSA**
   - Select "Report to NTSA"
   - Fill all incident fields
   - Include complaint about safety violation (e.g., "missing seatbelts")
   - Submit
   - ✅ Should show "Forwarded to NTSA" message
   - ✅ WhatsApp message should be sent

### Test 5: Admin Dashboard Testing

1. **Access Admin Panel**
   - Login as admin
   - Navigate to Feedback Management

2. **Verify Statistics**
   - Check NTSA stats cards display correct counts
   - Verify color-coded priority badges working

3. **Filter Complaints**
   - Filter by "Complaints" type
   - Search for "seatbelt" - should find CRITICAL complaints
   - Verify filters work

4. **View Complaint Details**
   - Click on a CRITICAL complaint
   - Check all incident details displayed
   - Verify "Forward to NTSA" button visible

5. **Send WhatsApp**
   - Click "Send WhatsApp"
   - Confirm phone number
   - ✅ Should send priority-aware message

## Verification Checklist

### Backend Setup
- [ ] Database schema updated with ntsa columns
- [ ] `.env` file configured with email credentials
- [ ] Gmail app password generated and set
- [ ] `ntsaService.js` exists and exports correctly
- [ ] `feedbackController.js` imports and uses NTSAService
- [ ] Admin routes protected with `authorizeRoles('admin')`
- [ ] WhatsappService enhanced with NTSA methods

### Frontend Setup
- [ ] `FeedbackForm.tsx` has report type selector
- [ ] Incident detail fields shown only for complaints
- [ ] `FeedbackManager.tsx` component created
- [ ] NTSA stats cards display in dashboard
- [ ] Color-coded badges showing priority levels
- [ ] Filter and search working
- [ ] WhatsApp button shows correctly

### Testing Results
- [ ] Classification test: All 4 priority levels working
- [ ] Email forwarding test: Emails sent successfully
- [ ] Admin API test: Stats endpoint returns data
- [ ] Manual forward test: Forward endpoint working
- [ ] Frontend form: All report types submitting
- [ ] WhatsApp: Messages sent with priority info
- [ ] Admin dashboard: All filters and actions working

## Troubleshooting

### Gmail Email Not Sending

**Issue**: "Invalid login credentials"

**Solutions**:
1. Verify you're using an app password, not account password
2. Check app password is correct in `.env`
3. Ensure 2FA is enabled on Gmail account
4. Try disabling and re-enabling 2FA
5. Generate a new app password

**Debug**:
```bash
# Add to ntsaService.js temporarily
console.log('Using email:', process.env.EMAIL_USER);
console.log('From name:', process.env.EMAIL_FROM_NAME);
```

### Classification Not Working

**Issue**: All complaints classified as LOW

**Solutions**:
1. Check NTSAService keywords match your test text
2. Keywords are case-insensitive but need exact matches
3. Some keywords are matatu/Kenya specific (RSL, KBA, etc.)
4. Add debug logging:

```javascript
const result = NTSAService.classifyComplaint({
  comment: 'Test comment...',
  reportType: 'REPORT_TO_NTSA'
});
console.log('Classification:', result);
console.log('Reasons:', {
  hasSafetyViolation: NTSAService.checkSafetyViolations('comment'),
  hasSexualViolation: NTSAService.checkSexualViolations('comment'),
  // etc...
});
```

### WhatsApp Not Sending

**Issue**: WhatsApp messages not delivered

**Solutions**:
1. Verify Twilio sandbox is active
2. Confirm phone number is verified in Twilio sandbox
3. Check WhatsApp methods exist in `whatsappService.js`
4. Verify `api.feedback.forwardToNTSA()` exists in frontend

**Test Directly**:
```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/feedback/admin/whatsapp/15/254700000000
```

## Performance Considerations

### For Large Complaint Volumes

1. **Add Pagination** to FeedbackManager:
```typescript
const [page, setPage] = useState(1);
const { data: complaints } = useQuery({
  queryKey: ['complaints', page],
  queryFn: () => api.feedback.getComplaints({ page, limit: 20 })
});
```

2. **Add Database Indexes**:
```sql
CREATE INDEX idx_feedback_ntsa_priority ON feedback(ntsa_priority);
CREATE INDEX idx_feedback_ntsa_forwarded ON feedback(ntsa_forwarded);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
```

3. **Cache NTSA Stats**:
```javascript
// In feedbackController.js
const cacheKey = `ntsa-stats-${new Date().toISOString().split('T')[0]}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

## Keyword Customization

To customize classification keywords, edit `backend/src/services/ntsaService.js`:

**Safety Violations Keywords** (lines ~25-35):
```javascript
const safetyKeywords = [
  'seatbelt', 'unroadworthy', 'brake', 'conformity plate',
  // Add your own:
  'tailgate open', 'overloaded', 'reckless'
];
```

**High Priority Keywords** (lines ~45-50):
```javascript
const dangerousKeywords = [
  'speeding', 'reckless', 'overloading', 'dangerous driving',
  // Add your own:
  'pothole', 'accident risk'
];
```

Apply changes and restart backend:
```bash
npm restart
```

---

## Next Steps

1. ✅ Run all 5 tests above
2. ✅ Verify admin dashboard integration
3. ✅ Test email forwarding to NTSA
4. ✅ Get stakeholder feedback
5. ⬜ Add database migration script
6. ⬜ Set up NTSA API integration (Phase 2)
7. ⬜ Implement SMS complaint submission (Phase 2)

