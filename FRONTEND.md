# Frontend Documentation - Audit Monitoring System

## Overview

The frontend is built with **Next.js 15** using the App Router, **TailwindCSS** for styling, and follows a **mobile-first responsive design** approach. All pages are 100% mobile-responsive and provide an excellent user experience across all device sizes.

## Technology Stack

- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: TailwindCSS 3.4.17 (Mobile-first approach)
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Charts**: Recharts
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── login/                   # Login page
│   ├── dashboard/               # Dashboard with stats & charts
│   ├── vessels/                 # Vessel management
│   ├── audit-types/             # Audit type management
│   ├── audit-parties/           # Audit party management
│   ├── audits/                  # Audit management
│   ├── findings/                # Findings management
│   ├── users/                   # User management (Admin only)
│   └── api/                     # Backend API routes
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── Pagination.tsx
│   │   └── LoadingSpinner.tsx
│   ├── AppLayout.tsx            # Main app layout with sidebar
│   └── ProtectedRoute.tsx       # Route authentication wrapper
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── lib/
│   ├── api.ts                   # API client utilities
│   ├── auth.ts                  # JWT & bcrypt functions
│   ├── db.ts                    # Database connection
│   └── email.ts                 # Email sending
├── types/
│   └── index.ts                 # TypeScript type definitions
└── utils/
    ├── helpers.ts               # Helper functions
    └── fileUpload.ts            # File upload configuration
```

## Features

### Authentication System

- JWT-based authentication
- Persistent login (token stored in localStorage)
- Auto-redirect based on auth state
- Role-based access control (Admin, Auditor, Viewer)

### Dashboard

- Real-time statistics cards:
  - Total Vessels
  - Total Audits
  - Total Findings
  - Overdue Findings
- Interactive charts:
  - Audits by Status (Bar Chart)
  - Findings by Severity (Pie Chart)

### Vessel Management

- Create, read, update, delete vessels
- Search and filter capabilities
- Vessel name and IMO number tracking

### Audit Types Management

- Manage different types of audits
- Add descriptions for each type
- Active/inactive status

### Audit Parties Management

- Manage auditing organizations
- Contact email tracking
- Quick edit/delete actions

### Audits Management

- Full CRUD operations
- Advanced filtering:
  - By vessel
  - By audit type
  - By status
- Pagination support
- Status management (Scheduled, In Progress, Completed, Cancelled)
- Date tracking (scheduled and actual dates)
- Findings summary

### Findings Management

- Full CRUD operations for findings
- Severity levels (Critical, High, Medium, Low)
- Status tracking (Open, Closed, Overdue)
- Close findings with corrective actions
- Reopen findings with reason
- Target date tracking
- Advanced filtering and pagination

### User Management (Admin Only)

- CRUD operations for users
- Role assignment (Admin, Auditor, Viewer)
- Password management
- Access control

## Role-Based Permissions

### Admin

- Full access to all features
- User management
- Can create, edit, and delete all entities

### Auditor

- Create and edit audits, findings, vessels, types, and parties
- Cannot manage users
- Read access to everything

### Viewer

- Read-only access to all data
- Cannot create, edit, or delete anything
- Cannot access user management

## Mobile Responsiveness

### Mobile-First Approach

All components are built with mobile devices as the primary target:

1. **Navigation**
   - Collapsible sidebar on mobile
   - Hamburger menu for easy access
   - Bottom-sheet style on small screens

2. **Tables**
   - Horizontal scrolling on mobile
   - Optimized column widths
   - Touch-friendly action buttons

3. **Forms**
   - Single-column layout on mobile
   - Full-width inputs
   - Large touch targets

4. **Charts**
   - Responsive containers
   - Auto-scaling based on screen size
   - Touch-enabled interactions

5. **Cards & Modals**
   - Stack vertically on mobile
   - Full-screen modals on small devices
   - Swipe gestures supported

### Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=audit_monitoring

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME="Audit Monitoring System"
EMAIL_FROM_ADDRESS=noreply@auditmonitor.com

# App
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Set Up Database

```bash
# Import the database schema
mysql -u root -p < database/schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

### 5. Default Login Credentials

```
Email: admin@example.com
Password: admin123
```

## UI Components Guide

### Button

```tsx
import Button from "@/components/ui/Button";

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>;

// Variants: primary, secondary, danger, success, warning
// Sizes: sm, md, lg
// Props: fullWidth, loading, disabled
```

### Input

```tsx
import Input from "@/components/ui/Input";

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
/>;
```

### Select

```tsx
import Select from "@/components/ui/Select";

<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ]}
/>;
```

### Modal

```tsx
import Modal from "@/components/ui/Modal";

<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Add New Item"
  size="md" // sm, md, lg, xl
>
  <form>...</form>
</Modal>;
```

### Table

```tsx
import Table from "@/components/ui/Table";

const columns = [
  { key: "id", title: "ID" },
  { key: "name", title: "Name" },
  {
    key: "status",
    title: "Status",
    render: (value) => <Badge variant="success">{value}</Badge>,
  },
];

<Table columns={columns} data={items} loading={loading} />;
```

### Badge

```tsx
import Badge from "@/components/ui/Badge";

<Badge variant="success" size="md">
  Active
</Badge>;

// Variants: default, success, warning, danger, info
```

### Card

```tsx
import Card from "@/components/ui/Card";

<Card title="Card Title" action={<Button size="sm">Action</Button>}>
  Card content goes here
</Card>;
```

## API Client Usage

### Making API Calls

```tsx
import { vesselsApi, auditsApi, findingsApi } from "@/lib/api";

// Get all vessels
const vessels = await vesselsApi.getAll();

// Create new audit
const audit = await auditsApi.create({
  vessel_id: 1,
  audit_type_id: 2,
  scheduled_date: "2026-03-15",
  status: "Scheduled",
});

// Update finding
await findingsApi.update(findingId, { severity: "High" });

// Delete vessel
await vesselsApi.delete(vesselId);
```

### Error Handling

```tsx
try {
  await auditsApi.create(formData);
  toast.success("Audit created successfully");
} catch (error: any) {
  toast.error(error.message || "Failed to create audit");
}
```

## Authentication

### Using Auth Context

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, login, logout, hasRole } = useAuth();

  // Check if user is authenticated
  if (!user) return <div>Please login</div>;

  // Check user role
  if (hasRole(["Admin"])) {
    return <AdminPanel />;
  }

  return <ViewerPanel />;
}
```

### Protected Routes

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## Styling Guide

### TailwindCSS Classes

Common patterns used in the project:

```tsx
// Responsive layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Responsive flex
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

// Responsive padding
<div className="p-4 sm:p-6 lg:p-8">

// Mobile-first visibility
<div className="block lg:hidden">Mobile only</div>
<div className="hidden lg:block">Desktop only</div>
```

## Testing Checklist

### Desktop Testing

- [ ] All pages load correctly
- [ ] Navigation works smoothly
- [ ] Forms submit successfully
- [ ] Tables display properly
- [ ] Charts render correctly
- [ ] Modals open and close
- [ ] Filters work as expected
- [ ] Pagination functions correctly

### Mobile Testing (< 768px)

- [ ] Sidebar collapses to hamburger menu
- [ ] Tables scroll horizontally
- [ ] Forms are single column
- [ ] Touch targets are large enough (min 44x44px)
- [ ] Modals are full-screen or near full-screen
- [ ] Charts scale appropriately
- [ ] All buttons are easily tappable
- [ ] Text is readable without zooming

### Tablet Testing (768px - 1024px)

- [ ] Layout adjusts properly
- [ ] Sidebar behavior is appropriate
- [ ] Multi-column layouts work
- [ ] Charts utilize available space

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure all sensitive values are updated:

- `JWT_SECRET` - Strong random string
- `DB_PASSWORD` - Secure database password
- SMTP credentials - If using email

### Performance Optimization

- All images are optimized with Next.js Image component
- Code splitting with dynamic imports
- Server-side rendering for initial page load
- Client-side caching of API responses

## Troubleshooting

### Common Issues

**Issue**: Login fails with network error
**Solution**: Ensure backend is running and database is accessible

**Issue**: Charts not rendering
**Solution**: Check if dashboard API is returning data correctly

**Issue**: Mobile menu not closing
**Solution**: Clear browser cache and reload

**Issue**: TypeScript errors in IDE
**Solution**: Run `npm install` and restart TypeScript server

## Support

For issues or questions:

1. Check API_ENDPOINTS.md for backend documentation
2. Review SETUP_GUIDE.md for setup instructions
3. Check browser console for errors
4. Verify API responses using network tab

## Future Enhancements

Potential features for future development:

- [ ] Dark mode support
- [ ] Offline mode with service workers
- [ ] Real-time updates with WebSockets
- [ ] Export reports to PDF
- [ ] Advanced analytics dashboard
- [ ] File attachments for findings
- [ ] Email notifications from frontend
- [ ] Audit trail/activity log
- [ ] Multi-language support

---

**Built with ❤️ using Next.js, TailwindCSS, and TypeScript**
