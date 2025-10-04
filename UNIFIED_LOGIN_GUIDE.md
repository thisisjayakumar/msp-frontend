# Unified Login System - Implementation Guide

## Overview

The MSP-ERP frontend now uses a **single unified login page** for all users, regardless of their role. After successful authentication, users are automatically routed to their role-specific dashboard.

## How It Works

### 1. **Single Login Page** (`/login`)
- All users (Admin, Manager, Production Head, Supervisor, RM Store, FG Store) use the same login page
- No need to select role before login
- Backend determines the user's role during authentication

### 2. **Automatic Role Detection**
- When user enters credentials, the backend API returns their role
- Frontend reads the role from the authentication response
- User is automatically redirected to their role-specific dashboard

### 3. **Role-Based Routing**
After successful login, users are routed to:
- **Admin** → `/admin/dashboard`
- **Manager** → `/manager/dashboard`
- **Production Head** → `/production-head/dashboard`
- **Supervisor** → `/supervisor/dashboard`
- **RM Store** → `/rm-store/dashboard`
- **FG Store** → `/fg-store/dashboard`

## Implementation Details

### New Files Created

#### 1. `/app/login/page.js`
The unified login page that all users access.

```javascript
// Usage: Navigate to http://localhost:3000/login
// Users enter email and password
// System automatically detects role and routes accordingly
```

#### 2. `/hooks/useAuth.js`
Custom React hook for authentication state management.

```javascript
import { useAuth } from '@/hooks/useAuth';

// In your component:
const { user, role, isLoading, isAuthenticated } = useAuth();

// Or with role requirement:
const { user, role } = useAuth('admin'); // Enforces admin role
```

#### 3. `/components/ProtectedRoute.js`
Wrapper component to protect dashboard routes.

```javascript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      {/* Your dashboard content */}
    </ProtectedRoute>
  );
}
```

### Updated Files

#### 1. `/app/page.js` (Homepage)
- Removed role-specific login buttons
- Added single "Sign In to Your Account" button linking to `/login`
- Shows all supported roles as informational cards

#### 2. `/components/API_Service/role-auth.js`
- Already had `login()` method that works without role validation
- Role-specific methods still exist for backward compatibility

#### 3. `/components/config/roles.js`
- Updated role hierarchy to match backend:
  - Added: `production_head`, `fg_store`
  - Removed: `store_manager`, `operator`

## Usage Examples

### Example 1: Basic Login Flow
```
1. User visits homepage (/)
2. Clicks "Sign In to Your Account"
3. Enters email: manager@microsprings.com, password: ****
4. Backend authenticates and returns role: "manager"
5. User automatically redirected to /manager/dashboard
```

### Example 2: Protecting a Dashboard
```javascript
// app/admin/dashboard/page.js
"use client";

import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user, role, isLoading } = useAuth('admin');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {user.full_name}</h1>
      <p>Role: {role}</p>
      {/* Dashboard content */}
    </div>
  );
}
```

### Example 3: Checking Permissions
```javascript
import { usePermission } from '@/hooks/useAuth';

export default function SomeComponent() {
  const canCreateOrders = usePermission('create_orders');
  
  return (
    <div>
      {canCreateOrders && (
        <button>Create New Order</button>
      )}
    </div>
  );
}
```

## Migration from Old System

### Before (Role-Specific Pages)
```
❌ /admin → Admin login page
❌ /manager → Manager login page
❌ /supervisor → Supervisor login page
❌ /rm-store → RM Store login page
```

### After (Unified System)
```
✅ /login → Single login for all users
✅ Automatic routing to role dashboards
✅ Backward compatible (old role pages still work)
```

## Benefits

### 1. **Simplified User Experience**
- Users don't need to know their role to login
- Single entry point for all users
- Consistent branding and UX

### 2. **Easier Maintenance**
- Single login component to maintain
- Centralized authentication logic
- Reduced code duplication

### 3. **Better Security**
- Role validation happens on backend
- Users can't fake their role
- Protected routes with automatic redirection

### 4. **Scalability**
- Easy to add new roles without creating new login pages
- Role configuration managed in one place (`roles.js`)

## Testing

### Test Accounts (if using demo data)
```
Admin:
  email: admin@microsprings.com
  password: admin123
  Expected redirect: /admin/dashboard

Manager:
  email: manager@microsprings.com
  password: manager123
  Expected redirect: /manager/dashboard

Production Head:
  email: production@microsprings.com
  password: production123
  Expected redirect: /production-head/dashboard

RM Store:
  email: rmstore@microsprings.com
  password: rmstore123
  Expected redirect: /rm-store/dashboard
```

### Test Scenarios

#### 1. **Successful Login**
```
1. Go to /login
2. Enter valid credentials
3. Click "Sign In"
4. Verify redirect to correct dashboard
5. Verify user data stored in localStorage
```

#### 2. **Invalid Credentials**
```
1. Go to /login
2. Enter invalid email/password
3. Click "Sign In"
4. Verify error message displays
5. Verify no redirect occurs
```

#### 3. **Protected Route Access**
```
1. Clear localStorage (logout)
2. Try to access /admin/dashboard directly
3. Verify redirect to /login
4. After login, verify redirect back to dashboard
```

#### 4. **Role Mismatch**
```
1. Login as Manager
2. Try to access /admin/dashboard
3. Verify redirect to /manager/dashboard
4. Verify appropriate message (optional)
```

## Configuration

### Adding a New Role

1. **Update Backend** (`authentication/models.py`)
```python
ROLE_HIERARCHY = [
    ('admin', 'Admin'),
    ('manager', 'Manager'),
    ('new_role', 'New Role'),  # Add here
    # ...
]
```

2. **Update Frontend** (`config/roles.js`)
```javascript
export const ROLE_HIERARCHY = [
  { key: 'new_role', label: 'New Role', path: '/new-role' },
  // ...
];

export const ROLE_CONFIG = {
  new_role: {
    title: 'New Role Dashboard',
    subtitle: 'Role Description',
    primaryColor: '#3b82f6',
    // ...
  }
};
```

3. **Create Dashboard** (`app/new-role/dashboard/page.js`)
```javascript
"use client";
import { useAuth } from '@/hooks/useAuth';

export default function NewRoleDashboard() {
  const { user } = useAuth('new_role');
  
  return <div>New Role Dashboard</div>;
}
```

That's it! The unified login will automatically handle the new role.

## Troubleshooting

### Issue: "Redirecting in a loop"
**Solution**: Clear localStorage and try again
```javascript
localStorage.clear();
```

### Issue: "Cannot access dashboard after login"
**Solution**: Check if role configuration exists in `roles.js`

### Issue: "Wrong dashboard displayed"
**Solution**: Verify backend returns correct role in login response

### Issue: "Token expired"
**Solution**: Implement token refresh logic or redirect to login

## API Integration

### Backend Login Endpoint
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "access": "jwt_token_here",
    "refresh": "refresh_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "primary_role": {
        "name": "manager",
        "hierarchy_level": 2
      },
      "permissions": { ... }
    },
    "role": "manager"
  }
}
```

## Future Enhancements

### Planned Features
- [ ] Remember me functionality
- [ ] Social login integration
- [ ] Two-factor authentication
- [ ] Password strength indicator
- [ ] Login attempt limiting
- [ ] Session management UI
- [ ] Remember last visited page and redirect after login

### Nice to Have
- [ ] Animated transitions between login and dashboard
- [ ] Progressive loading of dashboard data
- [ ] Offline support with service workers
- [ ] Dark mode support

## Support

For issues or questions, refer to:
- Backend documentation: `/Microsprings-inventory-managemenet-system/authentication/README.md`
- Frontend configuration: `/msp-frontend/src/components/config/roles.js`
- API service: `/msp-frontend/src/components/API_Service/role-auth.js`

---

**Last Updated**: October 2025  
**Version**: 2.0  
**Status**: Production Ready ✅

