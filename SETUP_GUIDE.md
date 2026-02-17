# Backend Setup Guide

This guide will help you set up the Audit Monitoring System backend.

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## Step 1: Install Dependencies

```bash
cd audit-monitoring
npm install
```

## Step 2: Setup MySQL Database

1. **Start MySQL Server**

2. **Create Database**

   ```bash
   mysql -u root -p
   ```

   ```sql
   CREATE DATABASE audit_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit;
   ```

3. **Import Schema**

   ```bash
   mysql -u root -p audit_monitoring < database/schema.sql
   ```

4. **Verify Setup**

   ```bash
   mysql -u root -p audit_monitoring -e "SHOW TABLES;"
   ```

   You should see:
   - attachments
   - audit_parties
   - audit_types
   - audits
   - findings
   - users
   - vessels

## Step 3: Configure Environment Variables

1. **Copy the example environment file**

   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` file with your configuration**

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=audit_monitoring

   # JWT Configuration
   JWT_SECRET=generate_a_random_secret_key_here
   JWT_EXPIRES_IN=7d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=Audit Monitoring System <noreply@auditmonitor.com>

   # Admin Email
   ADMIN_EMAIL=admin@company.com

   # Application URL
   APP_URL=http://localhost:3000

   # File Upload
   UPLOAD_DIR=./public/uploads
   MAX_FILE_SIZE=10485760

   # Node Environment
   NODE_ENV=development
   ```

3. **Generate JWT Secret**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output and use it as `JWT_SECRET`

4. **Gmail Setup (for email notifications)**
   - Enable 2-Factor Authentication in your Gmail account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use the generated password as `EMAIL_PASSWORD`

## Step 4: Create Default Admin User

The database schema already includes a default admin user. However, you need to generate a proper password hash:

1. **Generate Password Hash**

   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
   ```

2. **Update the hash in database**

   ```sql
   mysql -u root -p audit_monitoring

   UPDATE users
   SET password_hash = 'YOUR_GENERATED_HASH'
   WHERE email = 'admin@auditmonitor.com';
   ```

## Step 5: Create Uploads Directory

```bash
mkdir public\uploads
```

## Step 6: Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Step 7: Test the Backend

### Test Database Connection

Create a test file `test-db.js`:

```javascript
const { testConnection } = require("./src/lib/db");

testConnection().then((success) => {
  if (success) {
    console.log("✓ Database connected successfully");
  } else {
    console.log("✗ Database connection failed");
  }
  process.exit(0);
});
```

Run it:

```bash
node test-db.js
```

### Test Login API

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@auditmonitor.com\",\"password\":\"admin123\"}"
```

You should receive a token in the response.

### Test Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/vessels ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 8: Setup Cron Job (Optional for Development)

For development, you can manually run the cron job:

```bash
npm run cron
```

For production, see Production Deployment section below.

## Verify Setup Checklist

- [ ] MySQL database created and schema imported
- [ ] All tables exist in database
- [ ] `.env` file configured with correct credentials
- [ ] JWT secret generated
- [ ] Email configuration tested (optional)
- [ ] Uploads directory created
- [ ] Development server starts without errors
- [ ] Login API returns token successfully
- [ ] Protected endpoints work with token

## Common Issues

### Issue: MySQL Connection Failed

**Solution**:

- Check if MySQL is running
- Verify credentials in `.env`
- Ensure database exists
- Check if port 3306 is not blocked

### Issue: "MODULE_NOT_FOUND" Error

**Solution**:

```bash
npm install
```

### Issue: JWT Token Invalid

**Solution**:

- Regenerate JWT_SECRET in `.env`
- Restart the development server

### Issue: Email Not Sending

**Solution**:

- Use Gmail App Password, not regular password
- Enable "Less secure app access" if needed
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`

## Production Deployment

### Using PM2

1. **Install PM2**

   ```bash
   npm install -g pm2
   ```

2. **Build the application**

   ```bash
   npm run build
   ```

3. **Start with PM2**

   ```bash
   pm2 start ecosystem.config.js
   ```

4. **Setup PM2 to start on boot**
   ```bash
   pm2 startup
   pm2 save
   ```

### Cron Job Setup (Linux)

```bash
crontab -e
```

Add:

```
0 8 * * * cd /path/to/audit-monitoring && npm run cron >> /var/log/audit-cron.log 2>&1
```

### Cron Job Setup (Windows Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Audit Monitoring Cron"
4. Trigger: Daily at 8:00 AM
5. Action: Start a program
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\path\to\audit-monitoring\src\cron\reminderCron.js`
8. Start in: `C:\path\to\audit-monitoring`

## Security Notes

- Change default admin password immediately
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Keep dependencies updated
- Implement rate limiting for authentication endpoints
- Regular database backups

## Next Steps

Once backend is verified and working:

1. Test all API endpoints
2. Verify role-based access control
3. Test cron job functionality
4. Setup monitoring and logging
5. Proceed with frontend development

## Support

If you encounter issues:

1. Check the error logs
2. Verify `.env` configuration
3. Ensure all dependencies are installed
4. Check database connectivity
5. Review API_ENDPOINTS.md for endpoint documentation
