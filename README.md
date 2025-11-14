# MSP ERP Lite - Frontend

> **Precision, Performance, Perfection**

A modern, enterprise-grade ERP system built with Next.js and React for managing manufacturing operations, inventory, production workflows, and quality control.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [API Integration](#api-integration)
- [Development Guidelines](#development-guidelines)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

MSP ERP Lite is a comprehensive manufacturing execution system designed to streamline production operations. The system provides role-based access control for various stakeholders including administrators, managers, supervisors, store managers, and operators.

### Key Capabilities

- **Manufacturing Order Management**: Create, track, and manage production orders
- **Inventory Control**: Real-time tracking of raw materials and finished goods
- **Process Tracking**: Monitor production processes and batch operations
- **Quality Control**: Patrol monitoring and quality verification
- **Outsourcing Management**: Track and manage outsourced operations
- **Packing & Dispatch**: Manage packing operations and product dispatch
- **Analytics & Reporting**: Production analytics and performance metrics

---

## 🛠 Tech Stack

### Core Technologies

- **Framework**: [Next.js 15.5.3](https://nextjs.org/) (App Router)
- **Runtime**: [React 19.1.0](https://react.dev/)
- **Styling**: [TailwindCSS 3.4.18](https://tailwindcss.com/)
- **Language**: JavaScript (ES6+)
- **Node.js**: v20+ (Alpine-based Docker images)

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@heroicons/react` | ^2.2.0 | Icon library |
| `lucide-react` | ^0.548.0 | Additional icons |
| `react-hot-toast` | ^2.6.0 | Toast notifications |
| `react-datepicker` | ^8.8.0 | Date selection |
| `clsx` | ^2.1.1 | Conditional classNames |

### Development Tools

- **Linter**: ESLint 9 with Next.js config
- **CSS Processing**: PostCSS with Autoprefixer
- **Build Tool**: Next.js with Turbopack (dev mode)

---

## ✨ Features

### Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Role-based access control (RBAC)
- Session management with localStorage/sessionStorage
- CSRF protection

### Manufacturing Operations
- Manufacturing Order (MO) creation and tracking
- Purchase Order (PO) management
- Process assignment and workflow tracking
- Batch processing and heat number management
- Resource allocation and priority management

### Inventory Management
- Raw Material (RM) store management
- Finished Goods (FG) store operations
- Stock level monitoring and alerts
- Transaction logging and history
- Stock adjustments and transfers

### Quality Control
- Patrol duty management and QC sheet uploads
- Final inspection and verification
- Incoming material verification
- Quality checkpoints throughout production

### Outsourcing
- Send batches to outsourcing vendors
- Receive and verify outsourced materials
- Track outsourcing quantities and timelines
- Manage vendor operations

### Packing & Dispatch
- Batch verification and packing
- Loose stock management
- Heat number merging
- Label generation
- Dispatch management with confirmations

### Analytics & Reporting
- Production analytics dashboards
- Real-time operational metrics
- Performance tracking
- Supervisor activity monitoring

---

## 🏗 System Architecture

### Application Structure

```
msp-frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/               # Admin portal
│   │   ├── manager/             # Manager dashboard
│   │   ├── production-head/     # Production head interface
│   │   ├── supervisor/          # Supervisor panel
│   │   ├── operator/            # Operator interface
│   │   ├── rm-store/            # Raw material store
│   │   ├── fg-store/            # Finished goods store
│   │   ├── packing-zone/        # Packing operations
│   │   ├── patrol/              # Quality patrol
│   │   ├── outsourcing-incharge/# Outsourcing management
│   │   └── login/               # Authentication
│   │
│   ├── components/              # Reusable components
│   │   ├── API_Service/         # API integration layer
│   │   ├── CommonComponents/    # Shared UI components
│   │   ├── config/              # Configuration files
│   │   └── [role-specific]/     # Role-based components
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── constants/               # Application constants
│   └── styles/                  # Global styles
│
├── public/                      # Static assets
├── Docker files                 # Container configuration
└── Configuration files          # Project setup
```

### Authentication Flow

1. **Login**: User authenticates with credentials
2. **Token Storage**: JWT access & refresh tokens stored securely
3. **API Requests**: Automatic token injection in headers
4. **Token Refresh**: Silent refresh on 401 responses
5. **Session Management**: Persistent or session-based storage

### API Communication

- Base URL configured via environment variables
- Automatic authentication header injection
- Request/response interceptors for error handling
- Retry logic with exponential backoff
- CSRF token management

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: For version control
- **Docker** (optional): For containerized deployment
- **Backend API**: MSP Backend server must be running

### System Requirements

- **OS**: macOS, Linux, or Windows
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 500MB for node_modules

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd msp-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies listed in `package.json`.

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables) section).

### 4. Verify Installation

```bash
npm run dev
```

The application should start on `http://localhost:3000`.

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Build Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | Yes | `http://localhost:8000/api` |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics tracking ID | No | - |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | No | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | No | `1` |

### Production Environment

For production deployment, create a `.env.production` file:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## 🏃 Running the Application

### Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

- Opens at: `http://localhost:3000`
- Uses Turbopack for faster builds
- Hot Module Replacement (HMR) enabled
- Source maps for debugging

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

### Production Mode

Run the production build locally:

```bash
npm run build
npm start
```

- Optimized bundle sizes
- Server-side rendering
- Static page generation where applicable

### Linting

Check code quality:

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint -- --fix
```

---

## 🐳 Docker Deployment

### Development Docker Image

```bash
# Build development image
docker build -t msp-frontend:dev -f Dockerfile .

# Run development container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api \
  msp-frontend:dev
```

### Production Docker Image (Multi-stage Build)

```bash
# Build production image
docker build -t msp-frontend:prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -f Dockerfile.production .

# Run production container
docker run -p 3000:3000 msp-frontend:prod
```

### Docker Compose Setup

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.production
      args:
        NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 30s
      retries: 3
      start_period: 5s
```

Run with Docker Compose:

```bash
docker-compose up -d
```

---

## 📁 Project Structure

### Detailed Directory Structure

```
msp-frontend/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── admin/                   # Admin dashboard and management
│   │   │   ├── dashboard/           # User and role management
│   │   │   ├── work-centers/        # Work center configuration
│   │   │   └── supervisor-activity/ # Activity monitoring
│   │   │
│   │   ├── manager/                 # Manager operations
│   │   │   ├── dashboard/           # Overview and stats
│   │   │   ├── outsourcing/         # Outsourcing management
│   │   │   ├── mo-approval/         # MO approval workflow
│   │   │   ├── work-centers/        # Work center operations
│   │   │   └── create-outsourcing/  # Create outsourcing orders
│   │   │
│   │   ├── production-head/         # Production head interface
│   │   │   ├── dashboard/           # Production overview
│   │   │   ├── analytics/           # Production analytics
│   │   │   ├── create-mo/           # Manufacturing order creation
│   │   │   ├── create-po/           # Purchase order creation
│   │   │   ├── manufacturing-orders/# MO list and management
│   │   │   ├── process-assignment/  # Assign processes to orders
│   │   │   └── outsourcing/         # Outsourcing oversight
│   │   │
│   │   ├── supervisor/              # Supervisor panel
│   │   │   ├── dashboard/           # Process monitoring
│   │   │   ├── final-inspection/    # Quality inspection
│   │   │   ├── incoming-material-verification/
│   │   │   └── mo-detail/           # MO details and tracking
│   │   │
│   │   ├── operator/                # Operator interface
│   │   │   └── process-execution/   # Execute assigned processes
│   │   │
│   │   ├── rm-store/                # Raw Material Store
│   │   │   ├── dashboard/           # Stock overview
│   │   │   └── mo-list/             # MO material requirements
│   │   │
│   │   ├── fg-store/                # Finished Goods Store
│   │   │   └── dashboard/           # FG inventory and dispatch
│   │   │
│   │   ├── packing-zone/            # Packing Operations
│   │   │   └── dashboard/           # Packing, labeling, verification
│   │   │
│   │   ├── patrol/                  # Quality Patrol
│   │   │   └── dashboard/           # QC monitoring and uploads
│   │   │
│   │   ├── outsourcing-incharge/    # Outsourcing Management
│   │   │   └── dashboard/           # Send/receive operations
│   │   │
│   │   ├── login/                   # Authentication
│   │   ├── notifications/           # Notification center
│   │   ├── workflow-tracker/        # Process workflow tracking
│   │   ├── layout.js                # Root layout with providers
│   │   ├── page.js                  # Landing page
│   │   └── globals.css              # Global styles
│   │
│   ├── components/
│   │   ├── API_Service/             # API Integration Layer
│   │   │   ├── api-utils.js         # Core API utilities
│   │   │   ├── api-list.js          # API endpoint definitions
│   │   │   ├── manufacturing-api.js # Manufacturing endpoints
│   │   │   ├── inventory-api.js     # Inventory endpoints
│   │   │   ├── outsourcing-api.js   # Outsourcing endpoints
│   │   │   ├── packing-zone-api.js  # Packing zone endpoints
│   │   │   ├── patrol-api.js        # Patrol endpoints
│   │   │   ├── adminService.js      # Admin operations
│   │   │   ├── work-center-api.js   # Work center endpoints
│   │   │   ├── process-tracking-api.js # Process tracking
│   │   │   ├── role-auth.js         # Role-based auth
│   │   │   ├── throttled-api.js     # Rate limiting
│   │   │   └── notifications-api.js # Notifications
│   │   │
│   │   ├── CommonComponents/        # Shared Components
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── ConditionalHeader.js
│   │   │   │   ├── ConditionalFooter.js
│   │   │   │   ├── Navbar.js
│   │   │   │   └── Sidebar.js
│   │   │   ├── ui/                  # UI primitives
│   │   │   │   ├── Button.js
│   │   │   │   ├── Card.js
│   │   │   │   ├── Input.js
│   │   │   │   ├── Modal.js
│   │   │   │   ├── Table.js
│   │   │   │   └── Loading.js
│   │   │   └── forms/               # Form components
│   │   │
│   │   ├── config/                  # Configuration
│   │   │   ├── index.js             # App configuration
│   │   │   └── roles.js             # Role definitions
│   │   │
│   │   ├── [role-specific]/         # Role-based components
│   │   │   ├── admin/               # Admin components
│   │   │   ├── manager/             # Manager components
│   │   │   ├── supervisor/          # Supervisor components
│   │   │   ├── rm-store/            # RM store components
│   │   │   ├── fg-store/            # FG store components
│   │   │   ├── packing-zone/        # Packing zone components
│   │   │   ├── patrol/              # Patrol components
│   │   │   └── outsourcing-incharge/# Outsourcing components
│   │   │
│   │   ├── manufacturing/           # Manufacturing components
│   │   │   ├── MOPriorityManager.js
│   │   │   ├── ResourceAllocationPanel.js
│   │   │   └── StopMOConfirmationModal.js
│   │   │
│   │   ├── process/                 # Process visualization
│   │   │   ├── ProcessFlowVisualization.js
│   │   │   └── BatchProcessFlowVisualization.js
│   │   │
│   │   └── ProtectedRoute.js        # Route protection HOC
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useAuth.js               # Authentication hook
│   │   ├── useLocalStorage.js       # Local storage hook
│   │   └── useThrottledAuth.js      # Rate-limited auth
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── index.js                 # General utilities
│   │   ├── utils.js                 # Helper functions
│   │   ├── notifications.js         # Notification helpers
│   │   ├── permissionUtils.js       # Permission checks
│   │   └── rateLimitUtils.js        # Rate limiting
│   │
│   ├── constants/                   # Application Constants
│   │   └── index.js                 # Global constants
│   │
│   ├── lib/                         # Third-party integrations
│   │   └── utils.js                 # Library utilities
│   │
│   └── styles/                      # Global Styles
│       └── globals.css              # Global CSS
│
├── public/                          # Static Assets
│   ├── next.svg
│   ├── vercel.svg
│   └── [other-assets]
│
├── .next/                           # Build output (generated)
├── node_modules/                    # Dependencies (generated)
│
├── Dockerfile                       # Development Docker config
├── Dockerfile.production            # Production Docker config
├── docker-compose.yml               # Docker Compose setup
│
├── next.config.mjs                  # Next.js configuration
├── tailwind.config.js               # TailwindCSS configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── jsconfig.json                    # JavaScript configuration
│
├── package.json                     # Project dependencies
├── package-lock.json                # Dependency lock file
│
├── .env.local                       # Local environment variables
├── .env.production                  # Production environment variables
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 👥 User Roles & Permissions

The system supports nine distinct user roles, each with specific permissions and access levels:

### 1. Admin
**Path**: `/admin`  
**Primary Color**: Red (#dc2626)

**Responsibilities**:
- System administration and configuration
- User management (create, update, delete users)
- Role assignment and permission management
- Work center configuration
- Global system settings
- Supervisor activity monitoring

**Permissions**: Full system access

---

### 2. Manager
**Path**: `/manager`  
**Primary Color**: Violet (#7c3aed)

**Responsibilities**:
- Manufacturing Order (MO) management
- Stock allocation oversight
- Generate and review reports
- Part master management
- Outsourcing operations approval
- Work center management

**Permissions**:
- `manage_orders`
- `view_reports`
- `stock_allocation`
- `part_master`

---

### 3. Production Head
**Path**: `/production-head`  
**Primary Color**: Amber (#f59e0b)

**Responsibilities**:
- Complete production oversight
- Manufacturing order creation and approval
- Purchase order creation
- Process assignment and management
- Quality control supervision
- Production analytics and reporting
- All manager operations

**Permissions**:
- All manager permissions
- `quality_control`
- `process_management`
- `create_mo`
- `create_po`

---

### 4. Supervisor
**Path**: `/supervisor`  
**Primary Color**: Emerald (#059669)

**Responsibilities**:
- Process-level supervision
- Machine allocation
- Batch monitoring and tracking
- Final inspection
- Incoming material verification
- Quality checkpoint management

**Permissions**:
- `supervise_processes`
- `view_batches`
- `quality_checks`
- `machine_allocation`

---

### 5. RM Store (Raw Material Store)
**Path**: `/rm-store`  
**Primary Color**: Cyan (#0891b2)

**Responsibilities**:
- Raw material inventory management
- Process material requirements
- RM stock transactions
- Inventory CRUD operations
- Stock level monitoring

**Permissions**:
- `process_management`
- `manage_inventory`
- `rawmaterials_crud`
- `rmstock_management`
- `stock_transactions`

---

### 6. FG Store (Finished Goods Store)
**Path**: `/fg-store`  
**Primary Color**: Orange (#ea580c)

**Responsibilities**:
- Finished goods inventory management
- Dispatch operations
- Stock level monitoring
- Transaction logging
- Stock alerts management
- Packaging oversight

**Permissions**:
- `dispatch_management`
- `stock_levels`
- `mo_dispatch`
- `transactions_log`
- `stock_alerts`
- `packaging`

---

### 7. Packing Zone
**Path**: `/packing-zone`  
**Primary Color**: Indigo (#6366f1)

**Responsibilities**:
- Batch verification and packing
- Loose stock management
- Heat number merging requests
- Stock adjustment requests
- Label generation
- Product packaging

**Permissions**:
- `verify_batches`
- `pack_products`
- `manage_loose_stock`
- `request_merge`
- `request_adjustment`
- `generate_labels`

---

### 8. Outsourcing Incharge
**Path**: `/outsourcing-incharge`  
**Primary Color**: Violet (#8b5cf6)

**Responsibilities**:
- Send batches for outsourcing
- Receive materials from vendors
- Track outsourcing quantities
- Manage outsource batch clearance
- Vendor operation coordination

**Permissions**:
- `send_outsource`
- `receive_outsource`
- `manage_outsource_batches`
- `view_outsource_history`

---

### 9. Patrol
**Path**: `/patrol`  
**Primary Color**: Emerald (#10b981)

**Responsibilities**:
- Quality control monitoring
- QC sheet uploads at scheduled intervals
- Process monitoring assignments
- Patrol duty tracking
- Quality documentation

**Permissions**:
- `upload_qc`
- `view_patrol_duties`
- `view_qc_sheets`

---

### Role Configuration

Role configurations are defined in `src/components/config/roles.js`:

```javascript
import { getRoleConfig, isValidRole, getAllRolePaths } from '@/components/config/roles';

// Get role configuration
const config = getRoleConfig('manager');
// Returns: { title, subtitle, description, primaryColor, permissions, path, key, label }

// Check if role is valid
const isValid = isValidRole('manager'); // true

// Get all role paths
const paths = getAllRolePaths();
// Returns: ['/admin', '/manager', '/production-head', ...]
```

---

## 🔌 API Integration

### API Architecture

The application uses a centralized API service layer located in `src/components/API_Service/`.

### Core API Utilities (`api-utils.js`)

#### Authentication

```javascript
import { authUtils } from '@/components/API_Service/api-utils';

// Check authentication status
const isAuthenticated = authUtils.isAuthenticated();

// Get current token
const token = authUtils.getToken();

// Handle login success
authUtils.handleLoginSuccess(loginResponse, remember);

// Logout
authUtils.removeToken();
```

#### Making API Requests

```javascript
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/components/API_Service/api-utils';

// GET request
const response = await apiGet('/manufacturing-orders/');

// POST request
const response = await apiPost('/manufacturing-orders/', {
  customer: 'ABC Corp',
  part: 'PART-001',
  quantity: 1000
});

// PUT request
const response = await apiPut(`/manufacturing-orders/${id}/`, updatedData);

// PATCH request
const response = await apiPatch(`/manufacturing-orders/${id}/`, partialData);

// DELETE request
const response = await apiDelete(`/manufacturing-orders/${id}/`);
```

#### Response Format

All API responses follow this structure:

```javascript
{
  success: true|false,
  data: {...}|null,
  status: 200|400|401|500,
  error: "Error message" // only if success is false
}
```

### File Upload

```javascript
import { apiUpload } from '@/components/API_Service/api-utils';

const response = await apiUpload('/patrol/upload-qc/', file, {
  process_id: 123,
  duty_id: 456
});
```

### API Modules

| Module | File | Purpose |
|--------|------|---------|
| Manufacturing | `manufacturing-api.js` | MO/PO operations |
| Inventory | `inventory-api.js` | Stock management |
| Outsourcing | `outsourcing-api.js` | Outsourcing operations |
| Packing Zone | `packing-zone-api.js` | Packing operations |
| Patrol | `patrol-api.js` | QC operations |
| Admin | `adminService.js` | User/role management |
| Work Centers | `work-center-api.js` | Work center operations |
| Process Tracking | `process-tracking-api.js` | Process monitoring |
| Notifications | `notifications-api.js` | Notification handling |

### Error Handling

The API layer automatically handles:
- **401 Unauthorized**: Automatic token refresh
- **Token Expiry**: Silent refresh with request retry
- **Network Errors**: Graceful error messages
- **Validation Errors**: Formatted error messages
- **Rate Limiting**: Request throttling

### Request Interceptor

```javascript
// Automatic features:
✓ JWT token injection
✓ CSRF token handling
✓ Content-Type headers
✓ Authorization headers
✓ Request/response logging
```

### Token Refresh Flow

```
1. API Request → 401 Response
2. Pause current request
3. Refresh token using refresh endpoint
4. Update stored tokens
5. Retry original request with new token
6. Resume queued requests
```

---

## 📝 Development Guidelines

### Code Style

- **ES6+ Syntax**: Use modern JavaScript features
- **Functional Components**: Prefer function components over class components
- **Hooks**: Use React hooks for state and side effects
- **Naming Conventions**:
  - Components: PascalCase (`ManufacturingOrderForm.js`)
  - Utilities: camelCase (`apiUtils.js`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Folders: kebab-case (`packing-zone`)

### Component Structure

```javascript
// 1. Imports
import { useState, useEffect } from 'react';
import { apiGet } from '@/components/API_Service/api-utils';
import Button from '@/components/ui/Button';

// 2. Component definition
export default function MyComponent({ prop1, prop2 }) {
  // 3. State declarations
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 4. Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // 5. Event handlers
  const handleClick = async () => {
    // Handler logic
  };
  
  // 6. Helper functions
  const fetchData = async () => {
    // Function logic
  };
  
  // 7. Conditional returns
  if (loading) return <div>Loading...</div>;
  
  // 8. Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### State Management

- Use `useState` for component-local state
- Use `useLocalStorage` hook for persistent state
- Use `useAuth` hook for authentication state
- Lift state up when needed by multiple components

### API Integration

```javascript
// Good: Handle success and error cases
const handleSubmit = async (data) => {
  setLoading(true);
  const response = await apiPost('/endpoint/', data);
  
  if (response.success) {
    toast.success('Operation successful!');
    // Handle success
  } else {
    toast.error(response.error || 'Operation failed');
    // Handle error
  }
  setLoading(false);
};
```

### Toast Notifications

```javascript
import toast from 'react-hot-toast';

// Success
toast.success('Order created successfully!');

// Error
toast.error('Failed to create order');

// Loading
const toastId = toast.loading('Creating order...');
toast.success('Order created!', { id: toastId });

// Custom duration
toast.success('Saved!', { duration: 2000 });
```

### Form Handling

```javascript
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // Form submission logic
};
```

### Protected Routes

```javascript
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['manager', 'admin']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Performance Optimization

- Use `React.memo()` for expensive components
- Implement pagination for large datasets
- Lazy load routes and components
- Optimize images (WebP, AVIF formats)
- Use Next.js Image component for automatic optimization

### Accessibility

- Use semantic HTML elements
- Add ARIA labels where appropriate
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Test with screen readers

---

## 📜 Available Scripts

### Development

```bash
# Start development server (with Turbopack)
npm run dev

# Start development server (standard)
npm run dev -- --turbopack=false
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Build and start
npm run build && npm start
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Package Management

```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Docker Commands

```bash
# Build development image
docker build -t msp-frontend:dev -f Dockerfile .

# Build production image
docker build -t msp-frontend:prod -f Dockerfile.production .

# Run container
docker run -p 3000:3000 msp-frontend:prod

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Port Already in Use**

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

---

#### 2. **Module Not Found Errors**

```bash
Error: Cannot find module '@/components/...'
```

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

#### 3. **API Connection Issues**

```bash
Error: Failed to fetch from API
```

**Solution**:
- Verify backend server is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify CORS settings on backend
- Check network connectivity
- Inspect browser console for detailed errors

---

#### 4. **Authentication Issues**

**Symptom**: Redirected to login repeatedly

**Solution**:
```javascript
// Clear tokens and retry
localStorage.clear();
sessionStorage.clear();
// Refresh browser
```

**Check**:
- Token expiry settings
- Backend token validation
- Browser console for 401 errors
- Network tab for token refresh attempts

---

#### 5. **Build Errors**

```bash
Error: Build optimization failed
```

**Solution**:
```bash
# Clear all caches
rm -rf .next node_modules
npm install
npm run build

# If issue persists, check:
# - TypeScript/JavaScript syntax errors
# - Import/export statements
# - Environment variables in .env files
```

---

#### 6. **Docker Issues**

**Container not starting**:
```bash
# Check logs
docker logs <container-id>

# Rebuild without cache
docker build --no-cache -t msp-frontend:prod -f Dockerfile.production .

# Check environment variables
docker exec <container-id> env
```

---

#### 7. **Styling Issues**

**TailwindCSS classes not working**:

**Solution**:
```bash
# Rebuild with fresh TailwindCSS
npm run dev

# Verify tailwind.config.js content paths
# Ensure PostCSS is configured correctly
```

---

#### 8. **Performance Issues**

**Slow page loads**:

**Solution**:
- Check Network tab in browser DevTools
- Enable production mode: `npm run build && npm start`
- Optimize images using Next.js Image component
- Implement code splitting
- Use pagination for large datasets
- Enable compression in production

---

### Debug Mode

Enable verbose logging:

```javascript
// In api-utils.js, uncomment console.log statements
console.log('Making API request to:', url);
console.log('Response status:', response.status);
```

### Getting Help

1. **Check Logs**: Review browser console and network tab
2. **Backend Status**: Verify backend API is accessible
3. **Environment Variables**: Double-check all `.env` values
4. **Dependencies**: Ensure all packages are installed correctly
5. **Documentation**: Review Next.js and React documentation

---

## 🤝 Contributing

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code style guidelines
   - Write clean, documented code
   - Test thoroughly

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to Repository**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Provide detailed description
   - Reference related issues
   - Await code review

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] No console errors or warnings
- [ ] Components are properly documented
- [ ] API calls handle errors gracefully
- [ ] Toast notifications for user feedback
- [ ] Responsive design works on all devices
- [ ] Accessibility standards met
- [ ] Performance optimizations applied

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 📞 Support

For technical support or questions:

- **Project Lead**: [Your Name/Team]
- **Email**: [support@your-domain.com]
- **Issue Tracker**: [GitHub Issues URL]

---

## 🔄 Changelog

### Version 1.0.0 (Current)

**Initial Release**
- Multi-role authentication system
- Manufacturing order management
- Inventory tracking (RM & FG)
- Quality control and patrol system
- Outsourcing management
- Packing zone operations
- Production analytics
- Docker support
- Comprehensive API integration

---

## 🎯 Roadmap

### Planned Features

- [ ] Real-time notifications with WebSocket
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive improvements
- [ ] Offline mode support
- [ ] Export reports to PDF/Excel
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Advanced search and filtering
- [ ] Batch operations for bulk actions
- [ ] Integration with third-party services

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Vercel** - For hosting and deployment platform
- **TailwindCSS** - For the utility-first CSS framework
- **React Team** - For the React library
- **Contributors** - For their valuable contributions

---

<div align="center">

**MSP ERP Lite** - Built with ❤️ using Next.js

[Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>

