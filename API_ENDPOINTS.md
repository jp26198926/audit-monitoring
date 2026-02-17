# API Endpoints Documentation

Base URL: `http://localhost:3000/api`

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /auth/login

**Description**: User login  
**Access**: Public  
**Request Body**:

```json
{
  "email": "admin@auditmonitor.com",
  "password": "admin123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "System Admin",
      "email": "admin@auditmonitor.com",
      "role": "Admin"
    }
  }
}
```

### GET /auth/me

**Description**: Get current user details  
**Access**: Authenticated  
**Response**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@auditmonitor.com",
    "role": "Admin",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## Users (Admin Only)

### GET /users

**Description**: List all users  
**Access**: Admin  
**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "System Admin",
      "email": "admin@auditmonitor.com",
      "role": "Admin",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /users

**Description**: Create new user  
**Access**: Admin  
**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Encoder",
  "is_active": true
}
```

### GET /users/{id}

**Description**: Get user by ID  
**Access**: Admin

### PUT /users/{id}

**Description**: Update user  
**Access**: Admin  
**Request Body**: (all fields optional)

```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "password": "newpassword123",
  "role": "Admin",
  "is_active": false
}
```

### DELETE /users/{id}

**Description**: Delete user  
**Access**: Admin

---

## Vessels

### GET /vessels

**Description**: List all vessels  
**Access**: Authenticated  
**Query Params**: `active_only=true` (optional)

### POST /vessels

**Description**: Create vessel  
**Access**: Admin  
**Request Body**:

```json
{
  "vessel_name": "MV Sample Vessel",
  "registration_number": "IMO-1234567",
  "status": "Active"
}
```

### GET /vessels/{id}

**Description**: Get vessel by ID  
**Access**: Authenticated

### PUT /vessels/{id}

**Description**: Update vessel  
**Access**: Admin  
**Request Body**:

```json
{
  "vessel_name": "MV Updated Vessel",
  "status": "Inactive"
}
```

### DELETE /vessels/{id}

**Description**: Delete vessel  
**Access**: Admin

---

## Audit Types

### GET /audit-types

**Description**: List all audit types  
**Access**: Authenticated  
**Query Params**: `active_only=true` (optional)

### POST /audit-types

**Description**: Create audit type  
**Access**: Admin  
**Request Body**:

```json
{
  "type_name": "ISM Audit",
  "description": "International Safety Management Audit",
  "is_active": true
}
```

### GET /audit-types/{id}

**Description**: Get audit type by ID  
**Access**: Authenticated

### PUT /audit-types/{id}

**Description**: Update audit type  
**Access**: Admin

### DELETE /audit-types/{id}

**Description**: Delete audit type  
**Access**: Admin

---

## Audit Parties

### GET /audit-parties

**Description**: List all audit parties  
**Access**: Authenticated

### POST /audit-parties

**Description**: Create audit party  
**Access**: Admin  
**Request Body**:

```json
{
  "party_name": "Internal"
}
```

### GET /audit-parties/{id}

**Description**: Get audit party by ID  
**Access**: Authenticated

### PUT /audit-parties/{id}

**Description**: Update audit party  
**Access**: Admin

### DELETE /audit-parties/{id}

**Description**: Delete audit party  
**Access**: Admin

---

## Audits

### GET /audits

**Description**: List audits with filters and pagination  
**Access**: Authenticated  
**Query Params**:

- `vessel_id` (optional)
- `audit_type_id` (optional)
- `audit_party_id` (optional)
- `status` (optional): Planned, Ongoing, Completed, Closed
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "audit_reference": "AUD-2026-001",
      "vessel_name": "MV Sample Vessel",
      "audit_type_name": "ISM Audit",
      "audit_party_name": "Internal",
      "status": "Completed",
      "findings_count": 3,
      ...
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### POST /audits

**Description**: Create audit  
**Access**: Encoder, Admin  
**Request Body**:

```json
{
  "vessel_id": 1,
  "audit_type_id": 1,
  "audit_party_id": 1,
  "audit_reference": "AUD-2026-001",
  "audit_start_date": "2026-01-15",
  "audit_end_date": "2026-01-18",
  "next_due_date": "2027-01-15",
  "location": "Singapore Port",
  "status": "Planned",
  "remarks": "Annual ISM audit"
}
```

### GET /audits/{id}

**Description**: Get audit by ID with findings  
**Access**: Authenticated

### PUT /audits/{id}

**Description**: Update audit  
**Access**: Encoder, Admin

### DELETE /audits/{id}

**Description**: Delete audit  
**Access**: Admin

---

## Findings

### GET /findings

**Description**: List findings with filters  
**Access**: Authenticated  
**Query Params**:

- `audit_id` (optional)
- `category` (optional): Major, Minor, Observation
- `status` (optional): Open, In Progress, Submitted, Closed, Overdue
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

### POST /findings

**Description**: Create finding  
**Access**: Encoder, Admin  
**Request Body**:

```json
{
  "audit_id": 1,
  "category": "Major",
  "description": "Safety management system documentation incomplete",
  "root_cause": "Lack of proper documentation procedures",
  "corrective_action": "Update SMS manual and train crew",
  "responsible_person": "Chief Engineer",
  "target_date": "2026-03-15",
  "status": "Open"
}
```

### GET /findings/{id}

**Description**: Get finding by ID with attachments  
**Access**: Authenticated

### PUT /findings/{id}

**Description**: Update finding  
**Access**: Encoder, Admin

### DELETE /findings/{id}

**Description**: Delete finding  
**Access**: Admin

### POST /findings/{id}/close

**Description**: Close finding  
**Access**: Encoder, Admin

### POST /findings/{id}/reopen

**Description**: Reopen finding  
**Access**: Admin

---

## Dashboard

### GET /dashboard/stats

**Description**: Get dashboard statistics  
**Access**: Authenticated  
**Query Params**: (all optional)

- `vessel_id`
- `audit_type_id`
- `audit_party_id`
- `status`
- `date_from`
- `date_to`

**Response**:

```json
{
  "success": true,
  "data": {
    "audits": {
      "total_ytd": 45,
      "upcoming_30days": 3,
      "completed": 38,
      "overdue": 2
    },
    "findings": {
      "total": 127,
      "open": 15,
      "overdue": 8,
      "closed_this_month": 12
    }
  }
}
```

### GET /dashboard/charts

**Description**: Get chart data  
**Access**: Authenticated  
**Query Params**: Same as /dashboard/stats

**Response**:

```json
{
  "success": true,
  "data": {
    "monthly_audit_trend": [
      { "month": "2026-01", "count": 5 },
      { "month": "2026-02", "count": 7 }
    ],
    "findings_by_category": [
      { "category": "Major", "count": 15 },
      { "category": "Minor", "count": 45 },
      { "category": "Observation", "count": 67 }
    ],
    "audits_by_party": [
      { "party_name": "Internal", "count": 25 },
      { "party_name": "2nd Party", "count": 12 },
      { "party_name": "External", "count": 8 }
    ]
  }
}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common HTTP Status Codes**:

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (Missing or Invalid Token)
- `403` - Forbidden (Insufficient Permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing with cURL

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@auditmonitor.com","password":"admin123"}'
```

### Get Audits

```bash
curl -X GET http://localhost:3000/api/audits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Audit

```bash
curl -X POST http://localhost:3000/api/audits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vessel_id": 1,
    "audit_type_id": 1,
    "audit_party_id": 1,
    "audit_reference": "AUD-2026-001",
    "audit_start_date": "2026-01-15",
    "audit_end_date": "2026-01-18",
    "next_due_date": "2027-01-15",
    "location": "Singapore Port",
    "status": "Planned"
  }'
```

---

## Role-Based Access Control

| Endpoint                   | Admin | Encoder | Viewer |
| -------------------------- | ----- | ------- | ------ |
| GET /audits                | ✓     | ✓       | ✓      |
| POST /audits               | ✓     | ✓       | ✗      |
| PUT /audits                | ✓     | ✓       | ✗      |
| DELETE /audits             | ✓     | ✗       | ✗      |
| GET /findings              | ✓     | ✓       | ✓      |
| POST /findings             | ✓     | ✓       | ✗      |
| PUT /findings              | ✓     | ✓       | ✗      |
| DELETE /findings           | ✓     | ✗       | ✗      |
| POST /findings/{id}/close  | ✓     | ✓       | ✗      |
| POST /findings/{id}/reopen | ✓     | ✗       | ✗      |
| Manage Master Data         | ✓     | ✗       | ✗      |
| Manage Users               | ✓     | ✗       | ✗      |
| View Dashboard             | ✓     | ✓       | ✓      |
