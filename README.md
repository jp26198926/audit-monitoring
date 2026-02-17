# Audit Monitoring System

A production-ready web application for monitoring audits, findings, and corrective actions.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT
- **Email**: Nodemailer
- **Cron Jobs**: node-cron

## Folder Structure

```
audit-monitoring/
├── database/
│   └── schema.sql              # MySQL database schema
├── public/
│   └── uploads/                # File uploads directory
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── audits/
│   │   │   ├── findings/
│   │   │   ├── vessels/
│   │   │   ├── audit-types/
│   │   │   ├── audit-parties/
│   │   │   ├── users/
│   │   │   └── dashboard/
│   │   ├── (auth)/             # Auth pages
│   │   └── (dashboard)/        # Dashboard pages
│   ├── lib/
│   │   ├── db.ts               # Database connection
│   │   ├── auth.ts             # JWT helper functions
│   │   └── email.ts            # Email helper functions
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   └── rbac.middleware.ts  # Role-based access control
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── audit.controller.ts
│   │   ├── finding.controller.ts
│   │   ├── vessel.controller.ts
│   │   ├── auditType.controller.ts
│   │   ├── auditParty.controller.ts
│   │   ├── user.controller.ts
│   │   └── dashboard.controller.ts
│   ├── validators/
│   │   └── schemas.ts          # Zod validation schemas
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── cron/
│   │   └── reminderCron.ts     # Email reminder cron job
│   └── utils/
│       ├── fileUpload.ts       # File upload handler
│       └── helpers.ts          # Helper functions
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Database Schema

See `database/schema.sql` for the complete MySQL schema.

### Main Tables:

- **users**: User accounts with roles (Admin, Encoder, Viewer)
- **vessels**: Ship/vessel master data
- **audit_types**: Audit type master data (dynamic)
- **audit_parties**: Audit party master data (Internal/2nd Party/External)
- **audits**: Main audit records
- **findings**: Audit findings (optional per audit)
- **attachments**: File attachments for findings

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Audits

- `GET /api/audits` - List audits (with filters)
- `GET /api/audits/:id` - Get audit details
- `POST /api/audits` - Create audit (Encoder, Admin)
- `PUT /api/audits/:id` - Update audit (Encoder, Admin)
- `DELETE /api/audits/:id` - Delete audit (Admin only)
- `POST /api/audits/:id/upload-report` - Upload audit report

### Findings

- `GET /api/findings` - List findings (with filters)
- `GET /api/findings/:id` - Get finding details
- `POST /api/findings` - Create finding (Encoder, Admin)
- `PUT /api/findings/:id` - Update finding (Encoder, Admin)
- `DELETE /api/findings/:id` - Delete finding (Admin only)
- `POST /api/findings/:id/close` - Close finding (Encoder, Admin)
- `POST /api/findings/:id/reopen` - Reopen finding (Admin only)
- `POST /api/findings/:id/attachments` - Upload attachment

### Vessels

- `GET /api/vessels` - List vessels
- `GET /api/vessels/:id` - Get vessel details
- `POST /api/vessels` - Create vessel (Admin)
- `PUT /api/vessels/:id` - Update vessel (Admin)
- `DELETE /api/vessels/:id` - Delete vessel (Admin)

### Audit Types

- `GET /api/audit-types` - List audit types
- `POST /api/audit-types` - Create audit type (Admin)
- `PUT /api/audit-types/:id` - Update audit type (Admin)
- `DELETE /api/audit-types/:id` - Delete audit type (Admin)

### Audit Parties

- `GET /api/audit-parties` - List audit parties
- `POST /api/audit-parties` - Create audit party (Admin)
- `PUT /api/audit-parties/:id` - Update audit party (Admin)
- `DELETE /api/audit-parties/:id` - Delete audit party (Admin)

### Users

- `GET /api/users` - List users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts` - Get chart data

## User Roles & Permissions

### Admin

- Full system access
- Manage all master data
- Delete any records
- Reopen closed findings
- View full dashboard

### Encoder

- Create and update audits
- Add and update findings
- Upload reports and attachments
- Close findings
- Cannot delete or manage users

### Viewer

- Read-only access
- View audits, findings, and dashboard
- Cannot create, update, or delete anything

## Business Rules

1. **Audit can exist without findings** - Audits with zero findings are valid
2. **Finding status auto-update** - If `target_date < today` and status is not "Closed", system automatically updates status to "Overdue"
3. **Audit lifecycle**: Planned → Ongoing → Completed → Closed
4. **Finding lifecycle**: Open → In Progress → Submitted → Closed (or Overdue)

## Email Reminders (Cron Job)

The system sends automated email reminders:

1. **Upcoming Audit Reminder**: Notifies Admin when `next_due_date` is within 30 days
2. **Finding Due Reminder**: Notifies Encoder 7 days before `target_date`
3. **Overdue Finding Alert**: Notifies Admin when finding is overdue

Run cron job: `npm run cron`

For production, setup as systemd service or use PM2.

## Setup Instructions

1. **Clone and Install**

   ```bash
   npm install
   ```

2. **Database Setup**

   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create Upload Directory**

   ```bash
   mkdir -p public/uploads
   ```

5. **Run Development Server**

   ```bash
   npm run dev
   ```

6. **Setup Cron Job** (Production)
   ```bash
   # Add to crontab for daily execution at 8:00 AM
   0 8 * * * cd /path/to/audit-monitoring && npm run cron
   ```

## Default Login

- Email: `admin@auditmonitor.com`
- Password: `admin123` (change after first login)

## Security Notes

- Change JWT_SECRET in production
- Use strong passwords
- Enable HTTPS in production
- Regularly update dependencies
- Implement rate limiting for auth endpoints
- Validate all file uploads

## License

Internal Company Use Only
