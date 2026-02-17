# MatatuConnect Reporting & Feedback API Documentation

## Overview

The Reporting & Feedback Backend implements a high-integrity system for users to submit feedback (GENERAL) or report incidents (INCIDENT) for matatu services. The system uses:

- **PostgreSQL** with the `pg` library for ACID compliance
- **Repository Pattern** for clean data access
- **Zod** for client-side and server-side validation with discriminated unions
- **Transaction-based operations** to ensure data consistency
- **Priority scoring** for incidents with automatic urgent alerts
- **Health score calculation** for matatu performance tracking

---

## Architecture

### 1. **Database Layer** (`migrations/createReportsTable.js`)
- **Table:** `reports` with UUID primary key
- **Columns:**
  - `id` (UUID PRIMARY KEY)
  - `user_id` (UUID, nullable FK to users)
  - `matatu_id` (UUID, FK to vehicles)
  - `type` (VARCHAR: 'GENERAL' or 'INCIDENT')
  - `category` (VARCHAR, optional)
  - `rating` (INT, CHECK 1-5)
  - `comment` (TEXT)
  - `created_at` (TIMESTAMPTZ, UTC)
  - `updated_at` (TIMESTAMPTZ, UTC)

### 2. **Repository Layer** (`repositories/reportRepository.js`)
- Implements the Repository Pattern for clean separation of concerns
- All queries use parameterized placeholders (`$1`, `$2`, etc.) to prevent SQL injection
- Includes transaction support for multi-step operations
- Methods:
  - `createReport(data)` - Insert with transaction
  - `getMatatuStats(matatuId)` - Aggregate stats query
  - `getHighPriorityIncidents(matatuId)`
  - `getMatatuReports(matatuId, options)` - Paginated query
  - `getReportById(reportId)`
  - `deleteReport(reportId)`
  - `getIncidentCategoryBreakdown(matatuId)`

### 3. **Service Layer** (`services/reportService.js`)
- Business logic and orchestration
- Zod validation (discriminated union)
- Priority scoring for incidents
- Conditional notification triggering
- Health score calculation

### 4. **Controller Layer** (`controllers/reportController.js`)
- HTTP request/response handling
- Comprehensive error handling with try/catch
- Parameter validation
- Swagger-compatible documentation

### 5. **Notification Service** (`services/notificationService.js`)
- Placeholder for urgent alerts (priority > 4)
- Priority scoring logic
- Can be extended with SMS, WhatsApp, Telegram, Email

---

## API Endpoints

### **POST /api/reports**
Create a new report (GENERAL feedback or INCIDENT report)

**Request Body:**
```json
{
  "matatuId": "uuid-of-matatu",
  "reportType": "GENERAL" | "INCIDENT",
  "category": "Speeding" | "Reckless" | "Overcharging" | "Harassment" | "Loud Music" | "Poor Condition" | "Unsafe Driving" | "Other",
  "rating": 1-5,
  "comment": "Optional details",
  "userId": "optional-user-uuid"
}
```

**Validation Rules (Zod Discriminated Union):**
- **GENERAL:** Requires `matatuId`, `rating` (1-5), optionally `comment`
- **INCIDENT:** Requires `matatuId`, `category` (enum), optionally `comment`

**Response (201 Created):**
```json
{
  "message": "Report submitted successfully",
  "success": true,
  "data": {
    "id": "report-uuid",
    "user_id": "user-uuid",
    "matatu_id": "matatu-uuid",
    "type": "GENERAL" | "INCIDENT",
    "category": "...",
    "rating": 4,
    "comment": "...",
    "created_at": "2026-02-16T10:30:00.000Z"
  },
  "incident": {
    "priorityScore": 7,
    "alertTriggered": true
  }
}
```

---

### **GET /api/reports/stats/:matatuId**
Get performance statistics and health score for a matatu

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "matatuId": "uuid-of-matatu",
    "stats": {
      "matatu_id": "uuid",
      "total_reports": 15,
      "feedback_count": 8,
      "incident_count": 7,
      "average_rating": 3.5,
      "unique_incident_categories": 4,
      "last_report_date": "2026-02-16T10:30:00.000Z"
    },
    "categoryBreakdown": [
      { "category": "Speeding", "count": 3 },
      { "category": "Overcharging", "count": 2 },
      { "category": "Harassment", "count": 2 }
    ],
    "healthScore": 65,
    "riskLevel": "MEDIUM"
  }
}
```

**Health Score Calculation:**
- Starts at 100
- Deducts based on average rating: `(5 - avgRating) * 10`
- Deducts based on incidents: `min(incidentCount * 5, 40)`

**Risk Levels:**
- **LOW:** healthScore >= 80
- **MEDIUM:** healthScore 50-79
- **HIGH:** healthScore < 50

---

### **GET /api/reports/matatu/:matatuId**
Get all reports for a matatu with optional filtering

**Query Parameters:**
- `type` (optional): Filter by 'GENERAL' or 'INCIDENT'
- `limit` (optional, default 50, max 100): Pagination limit
- `offset` (optional, default 0): Pagination offset

**Example:** `GET /api/reports/matatu/uuid-123?type=INCIDENT&limit=10&offset=0`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "user_id": "user-uuid",
        "matatu_id": "matatu-uuid",
        "type": "INCIDENT",
        "category": "Speeding",
        "rating": null,
        "comment": "Driver was speeding on Nairobi-Mombasa road",
        "created_at": "2026-02-16T09:00:00.000Z"
      }
    ],
    "total": 15,
    "limit": 10,
    "offset": 0
  }
}
```

---

### **GET /api/reports/:reportId**
Get a single report by ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "user_id": "user-uuid",
    "matatu_id": "matatu-uuid",
    "type": "GENERAL",
    "category": null,
    "rating": 4,
    "comment": "Great service, friendly driver",
    "created_at": "2026-02-16T10:30:00.000Z",
    "updated_at": "2026-02-16T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Report not found"
}
```

---

### **DELETE /api/reports/:reportId** (Protected)
Delete a report (requires authentication)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report deleted successfully",
  "reportId": "report-uuid"
}
```

---

### **GET /api/reports/analysis/high-risk** (Protected)
Get high-risk matatus (admin endpoint)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "High-risk matatus endpoint - implement based on your dashboard needs",
    "example": [
      {
        "matatuId": "uuid-1",
        "riskLevel": "HIGH",
        "healthScore": 35,
        "incident_count": 12,
        "average_rating": 2.5
      }
    ]
  }
}
```

---

## Error Handling

All endpoints follow a consistent error handling pattern with appropriate HTTP status codes:

### **400 Bad Request**
Validation errors or missing required parameters
```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": "rating",
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

### **404 Not Found**
Resource not found
```json
{
  "message": "Report not found"
}
```

### **500 Internal Server Error**
Server-side errors
```json
{
  "message": "Failed to create report",
  "error": "Database connection failed"
}
```

---

## Incident Priority Scoring

Priority scores (0-10) determine whether urgent alerts are triggered:

| Category | Base Score |
|----------|-----------|
| Unsafe Driving | 10 |
| Reckless | 9 |
| Speeding | 8 |
| Harassment | 7 |
| Overcharging | 4 |
| Poor Condition | 3 |
| Loud Music | 2 |
| Other | 3 |

**Modifiers:**
- If matatu has > 5 existing incidents: +2 to base score (capped at 10)

**Urgent Alert Triggered:** When priority score > 4

---

## Zod Validation Schema

```typescript
// Discriminated Union Schema
const reportSchema = z.discriminatedUnion('reportType', [
  // GENERAL: Requires rating, optional category/comment
  {
    reportType: z.literal('GENERAL'),
    userId: z.string().uuid().optional(),
    matatuId: z.string().uuid(),
    type: z.literal('GENERAL'),
    rating: z.number().int().min(1).max(5),
    category: z.undefined().optional(),
    comment: z.string().optional(),
  },
  // INCIDENT: Requires category, optional rating/comment
  {
    reportType: z.literal('INCIDENT'),
    userId: z.string().uuid().optional(),
    matatuId: z.string().uuid(),
    type: z.literal('INCIDENT'),
    category: z.enum(['Speeding', 'Reckless', 'Overcharging', ...]),
    rating: z.number().optional(),
    comment: z.string().optional(),
  },
]);
```

---

## Transaction Support

The `createReport()` method in the Repository uses PostgreSQL transactions:

1. **BEGIN** transaction
2. Insert report into `reports` table
3. Update `matatu_performance_logs` (secondary table)
4. **COMMIT** on success or **ROLLBACK** on error

This ensures ACID compliance: either both operations succeed or both are rolled back.

---

## UTC Timezone Handling

All timestamps are stored and returned in UTC:
- Database column: `TIMESTAMPTZ DEFAULT NOW() AT TIME ZONE 'UTC'`
- Always use `NOW() AT TIME ZONE 'UTC'` in queries for consistency

---

## Integration with Frontend

The frontend `ReportContainer` component sends validated data to `POST /api/reports`:

```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matatuId: selectedMatatuId,
    reportType: 'GENERAL',
    rating: 4,
    comment: 'Great service',
  }),
});
```

---

## Best Practices Implemented

✅ **Parameterized Queries** - Prevent SQL injection  
✅ **Transaction Support** - Ensure ACID compliance  
✅ **Zod Validation** - Type-safe discriminated unions  
✅ **Repository Pattern** - Clean separation of concerns  
✅ **Error Handling** - Comprehensive try/catch blocks  
✅ **UTC Timestamps** - Consistent timezone handling  
✅ **Pagination** - Efficient data retrieval  
✅ **Indexing** - Optimized queries with database indexes  
✅ **Health Scoring** - Matatu performance metrics  
✅ **Priority Scoring** - Automatic incident escalation  

---

## Testing the API

### Create a GENERAL report:
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "matatuId": "550e8400-e29b-41d4-a716-446655440000",
    "reportType": "GENERAL",
    "rating": 4,
    "comment": "Good service"
  }'
```

### Create an INCIDENT report:
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "matatuId": "550e8400-e29b-41d4-a716-446655440000",
    "reportType": "INCIDENT",
    "category": "Speeding",
    "comment": "Driver was speeding on the highway"
  }'
```

### Get matatu stats:
```bash
curl http://localhost:5000/api/reports/stats/550e8400-e29b-41d4-a716-446655440000
```

---

## Future Enhancements

- [ ] Real-time SMS alerts for urgent incidents
- [ ] WhatsApp notification integration
- [ ] Telegram admin channel updates
- [ ] Email reports for SACCO managers
- [ ] Dashboard analytics with ChartsJS
- [ ] Batch operations for admin reports
- [ ] Report export (CSV/PDF)
- [ ] Machine learning for predictive incident scoring
