# Quick Start Guide

Get the Audit Monitoring System backend running in 5 minutes.

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Setup Steps

### 1. Install Dependencies (30 seconds)

```bash
npm install
```

### 2. Setup Database (1 minute)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE audit_monitoring;
exit;

# Import schema
mysql -u root -p audit_monitoring < database/schema.sql
```

### 3. Configure Environment (1 minute)

```bash
# Copy environment file
copy .env.example .env
```

Edit `.env` and update these essential values:

```env
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=audit_monitoring
JWT_SECRET=your_random_secret_here
```

Generate JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Fix Admin Password Hash (30 seconds)

```bash
# Generate hash for password "admin123"
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

Copy the output hash, then:

```bash
mysql -u root -p audit_monitoring
```

```sql
UPDATE users
SET password_hash = 'PASTE_YOUR_HASH_HERE'
WHERE email = 'admin@auditmonitor.com';
exit;
```

### 5. Create Upload Directory (5 seconds)

```bash
mkdir public\uploads
```

### 6. Start Server (5 seconds)

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

## Test the Backend

### Test 1: Login

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@auditmonitor.com\",\"password\":\"admin123\"}"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

Copy the token value.

### Test 2: Get Vessels (Protected Endpoint)

Replace `YOUR_TOKEN` with the token from Test 1:

```bash
curl -X GET http://localhost:3000/api/vessels ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vessel_name": "MV Sample Vessel 1",
      "registration_number": "IMO-1234567",
      "status": "Active"
    },
    {
      "id": 2,
      "vessel_name": "MV Sample Vessel 2",
      "registration_number": "IMO-7654321",
      "status": "Active"
    }
  ]
}
```

### Test 3: Create Audit

```bash
curl -X POST http://localhost:3000/api/audits ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"vessel_id\":1,\"audit_type_id\":1,\"audit_party_id\":1,\"audit_reference\":\"AUD-2026-001\",\"audit_start_date\":\"2026-02-20\",\"audit_end_date\":\"2026-02-22\",\"next_due_date\":\"2027-02-20\",\"location\":\"Singapore\",\"status\":\"Planned\"}"
```

### Test 4: Get Dashboard Stats

```bash
curl -X GET http://localhost:3000/api/dashboard/stats ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Success!

If all tests pass, your backend is working correctly!

## Next Steps

1. **Test Cron Job**: `npm run cron`
2. **Configure Email**: Update EMAIL\_\* variables in `.env`
3. **Review API Docs**: See `API_ENDPOINTS.md`
4. **Build Frontend**: Start developing the UI

## Common Issues

**Issue**: Login returns 401

- **Fix**: Check if admin password hash was updated correctly

**Issue**: Database connection error

- **Fix**: Verify MySQL is running and credentials in `.env` are correct

**Issue**: Token invalid on protected routes

- **Fix**: Ensure JWT_SECRET in `.env` matches when token was generated

## Production Deployment

See `SETUP_GUIDE.md` for detailed production deployment instructions.

## Default Credentials

- **Email**: admin@auditmonitor.com
- **Password**: admin123
- **⚠️ Change after first login**

## File Structure

```
audit-monitoring/
├── database/schema.sql       # Database schema
├── src/
│   ├── app/api/             # API endpoints
│   ├── controllers/         # Business logic
│   ├── lib/                 # Core utilities
│   ├── middleware/          # Auth & RBAC
│   └── cron/                # Reminder job
├── .env                     # Configuration
└── package.json             # Dependencies
```

## API Overview

| Endpoint                  | Purpose              |
| ------------------------- | -------------------- |
| POST /api/auth/login      | User login           |
| GET /api/auth/me          | Current user         |
| GET /api/vessels          | List vessels         |
| GET /api/audit-types      | List audit types     |
| GET /api/audit-parties    | List audit parties   |
| GET /api/audits           | List audits          |
| POST /api/audits          | Create audit         |
| GET /api/findings         | List findings        |
| POST /api/findings        | Create finding       |
| GET /api/dashboard/stats  | Dashboard statistics |
| GET /api/dashboard/charts | Chart data           |

Full API documentation: `API_ENDPOINTS.md`

---

**Need Help?** Check:

- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup
- `API_ENDPOINTS.md` - API reference
- `BACKEND_SUMMARY.md` - What's included
