# MSP ERP Lite - System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Application Layers](#application-layers)
5. [Authentication Flow](#authentication-flow)
6. [API Communication](#api-communication)
7. [State Management](#state-management)
8. [Routing Strategy](#routing-strategy)
9. [Component Architecture](#component-architecture)
10. [Security Architecture](#security-architecture)
11. [Deployment Architecture](#deployment-architecture)

---

## Overview

MSP ERP Lite is a modern, enterprise-grade manufacturing execution system built with Next.js 15 and React 19. The architecture follows a modular, role-based design pattern with clear separation of concerns.

### Key Architectural Principles

- **Modular Design**: Role-based component isolation
- **Separation of Concerns**: Clear boundaries between layers
- **Scalability**: Horizontal scaling with Docker
- **Security First**: JWT authentication, RBAC, secure headers
- **Performance**: Code splitting, lazy loading, optimized builds
- **Developer Experience**: Type safety, linting, standardized patterns

---

## Technology Stack

### Frontend Core

```
┌─────────────────────────────────────┐
│         Next.js 15.5.3             │
│         (App Router)               │
├─────────────────────────────────────┤
│         React 19.1.0               │
│         (Functional Components)    │
├─────────────────────────────────────┤
│         TailwindCSS 3.4.18         │
│         (Utility-First Styling)    │
└─────────────────────────────────────┘
```

### Key Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| `@heroicons/react` | Icon system | 2.2.0 |
| `lucide-react` | Additional icons | 0.548.0 |
| `react-hot-toast` | Notifications | 2.6.0 |
| `react-datepicker` | Date selection | 8.8.0 |
| `clsx` | Conditional classes | 2.1.1 |

### Build Tools

- **Turbopack**: Fast development builds
- **ESLint**: Code quality
- **PostCSS**: CSS processing
- **Autoprefixer**: Browser compatibility

---

## Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Browser (React)                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │   Pages    │  │ Components │  │  Context/Hooks     │ │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVICE LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ API Utils   │  │ Auth Utils   │  │  API Modules   │  │  │
│  │  │ (Request/   │  │ (JWT Token   │  │  (Manufacturing│  │  │
│  │  │  Response)  │  │  Management) │  │   Inventory,   │  │  │
│  │  │             │  │              │  │   etc.)        │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NETWORK LAYER                             │
│                    (HTTP/HTTPS + JWT)                            │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                 │
│                   (Django/FastAPI)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MSP ERP LITE FRONTEND                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PRESENTATION LAYER                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Admin   │  │ Manager  │  │   Prod   │  │Supervisor│  │ │
│  │  │Dashboard │  │Dashboard │  │   Head   │  │  Panel   │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ RM Store │  │ FG Store │  │ Packing  │  │  Patrol  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │  ┌──────────┐  ┌──────────┐                               │ │
│  │  │Outsourc  │  │ Operator │                               │ │
│  │  │  Incharge│  │Interface │                               │ │
│  │  └──────────┘  └──────────┘                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     BUSINESS LOGIC LAYER                    │ │
│  │  ┌────────────┐  ┌───────────┐  ┌─────────────────────┐  │ │
│  │  │   Hooks    │  │  Utils    │  │  State Management   │  │ │
│  │  │ (useAuth,  │  │(formatters│  │  (useState,         │  │ │
│  │  │ useLocal   │  │validators)│  │  useLocalStorage)   │  │ │
│  │  │  Storage)  │  │           │  │                     │  │ │
│  │  └────────────┘  └───────────┘  └─────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    DATA ACCESS LAYER                        │ │
│  │  ┌────────────────────────────────────────────────────────┐│ │
│  │  │                   API Service                           ││ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ ││ │
│  │  │  │   Auth   │  │   API    │  │   Module-Specific    │ ││ │
│  │  │  │  Utils   │  │  Utils   │  │   API Services       │ ││ │
│  │  │  │(JWT mgmt)│  │(Request/ │  │ (Manufacturing,      │ ││ │
│  │  │  │          │  │Response) │  │  Inventory, etc.)    │ ││ │
│  │  │  └──────────┘  └──────────┘  └──────────────────────┘ ││ │
│  │  └────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     SHARED LAYER                            │ │
│  │  ┌────────────┐  ┌───────────┐  ┌─────────────────────┐  │ │
│  │  │   Config   │  │  Constants│  │  Common Components  │  │ │
│  │  │  (Roles,   │  │ (API URLs,│  │   (Button, Card,    │  │ │
│  │  │   App      │  │  Routes)  │  │    Input, Modal)    │  │ │
│  │  │  Settings) │  │           │  │                     │  │ │
│  │  └────────────┘  └───────────┘  └─────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Presentation Layer

**Location**: `src/app/*`

**Responsibilities**:
- User interface rendering
- User interactions
- Route-specific pages
- Role-based dashboards

**Components**:
- Page components (Next.js App Router)
- Layout components
- Role-specific views

### 2. Business Logic Layer

**Location**: `src/hooks/*`, `src/utils/*`

**Responsibilities**:
- Application logic
- Data transformation
- Validation
- State management
- Custom hooks

**Key Files**:
- `useAuth.js` - Authentication logic
- `useLocalStorage.js` - Persistent state
- `utils/index.js` - Utility functions

### 3. Data Access Layer

**Location**: `src/components/API_Service/*`

**Responsibilities**:
- API communication
- Request/response handling
- Authentication token management
- Error handling
- Data fetching

**Key Modules**:
- `api-utils.js` - Core API utilities
- `api-list.js` - Endpoint definitions
- Module-specific API services

### 4. Shared Layer

**Location**: `src/components/CommonComponents/*`, `src/components/config/*`

**Responsibilities**:
- Reusable components
- Configuration
- Constants
- Theme settings

---

## Authentication Flow

### Login Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter credentials
     ▼
┌─────────────────┐
│  Login Page     │
└────┬────────────┘
     │ 2. Submit form
     ▼
┌──────────────────────┐
│  API Service Layer   │
└────┬─────────────────┘
     │ 3. POST /auth/login/
     ▼
┌──────────────────────┐
│   Backend API        │
└────┬─────────────────┘
     │ 4. Validate credentials
     │    Return JWT tokens
     ▼
┌──────────────────────┐
│  API Service Layer   │
└────┬─────────────────┘
     │ 5. Store tokens
     │    (localStorage/sessionStorage)
     ▼
┌──────────────────────┐
│   Protected Route    │
└────┬─────────────────┘
     │ 6. Redirect to role dashboard
     ▼
┌──────────────────────┐
│  Role Dashboard      │
└──────────────────────┘
```

### Token Refresh Flow

```
┌─────────────────┐
│  API Request    │
└────┬────────────┘
     │ 1. Request with JWT
     ▼
┌──────────────────────┐
│   Backend API        │
└────┬─────────────────┘
     │ 2. Token expired (401)
     ▼
┌──────────────────────┐
│  API Service Layer   │
└────┬─────────────────┘
     │ 3. Detect 401 error
     │    Pause original request
     ▼
┌──────────────────────┐
│  Token Refresh       │
└────┬─────────────────┘
     │ 4. POST /auth/token/refresh/
     │    with refresh token
     ▼
┌──────────────────────┐
│   Backend API        │
└────┬─────────────────┘
     │ 5. Return new access token
     ▼
┌──────────────────────┐
│  API Service Layer   │
└────┬─────────────────┘
     │ 6. Update stored token
     │    Retry original request
     ▼
┌──────────────────────┐
│   Success Response   │
└──────────────────────┘
```

### Authentication State Management

```javascript
// Token Storage Locations
┌─────────────────────────────────────┐
│     Browser Storage                 │
│  ┌────────────┐  ┌───────────────┐ │
│  │localStorage│  │sessionStorage │ │
│  │            │  │               │ │
│  │ authToken  │  │  authToken    │ │
│  │refreshToken│  │ refreshToken  │ │
│  └────────────┘  └───────────────┘ │
│                                     │
│  Choice depends on "Remember Me"   │
└─────────────────────────────────────┘
```

---

## API Communication

### Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    API REQUEST PIPELINE                      │
│                                                              │
│  1. Component calls API function                            │
│     ↓                                                        │
│  2. API Utils adds authentication headers                   │
│     ↓                                                        │
│  3. Add CSRF token                                          │
│     ↓                                                        │
│  4. Fetch API call to backend                               │
│     ↓                                                        │
│  5. Response interceptor                                    │
│     ├─ Success (200-299) → Return data                      │
│     ├─ Auth error (401) → Token refresh → Retry             │
│     ├─ Client error (400-499) → Format error message        │
│     └─ Server error (500-599) → Graceful error handling     │
│     ↓                                                        │
│  6. Return standardized response                            │
│     { success, data, error, status }                        │
│     ↓                                                        │
│  7. Component handles response                              │
│     ├─ Success → Update UI, show toast                      │
│     └─ Error → Show error message, maintain state           │
└─────────────────────────────────────────────────────────────┘
```

### API Service Architecture

```
src/components/API_Service/
│
├── api-utils.js              # Core utilities
│   ├── apiRequest()          # Main request function
│   ├── apiGet()              # GET requests
│   ├── apiPost()             # POST requests
│   ├── apiPut()              # PUT requests
│   ├── apiPatch()            # PATCH requests
│   ├── apiDelete()           # DELETE requests
│   ├── apiUpload()           # File uploads
│   └── authUtils{}           # Token management
│
├── api-list.js               # Endpoint definitions
│
├── manufacturing-api.js      # Manufacturing endpoints
├── inventory-api.js          # Inventory endpoints
├── outsourcing-api.js        # Outsourcing endpoints
├── packing-zone-api.js       # Packing operations
├── patrol-api.js             # Quality control
├── adminService.js           # Admin operations
├── work-center-api.js        # Work centers
├── process-tracking-api.js   # Process tracking
└── notifications-api.js      # Notifications
```

---

## State Management

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Component State                        │    │
│  │         (useState, useReducer)                      │    │
│  │                                                     │    │
│  │  • Form data                                        │    │
│  │  • Loading states                                   │    │
│  │  • UI state (modals, dropdowns)                     │    │
│  │  • Local component data                             │    │
│  └────────────────────────────────────────────────────┘    │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Persistent State                            │    │
│  │      (useLocalStorage hook)                         │    │
│  │                                                     │    │
│  │  • User preferences                                 │    │
│  │  • Filter settings                                  │    │
│  │  • Draft forms                                      │    │
│  │  • Recent searches                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Authentication State                       │    │
│  │           (useAuth hook)                            │    │
│  │                                                     │    │
│  │  • Current user                                     │    │
│  │  • User role                                        │    │
│  │  • Permissions                                      │    │
│  │  • Login status                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Server State                             │    │
│  │         (API responses)                             │    │
│  │                                                     │    │
│  │  • Manufacturing orders                             │    │
│  │  • Inventory data                                   │    │
│  │  • Process information                              │    │
│  │  • User lists                                       │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Routing Strategy

### Next.js App Router Structure

```
src/app/
│
├── layout.js                 # Root layout
├── page.js                   # Landing page
├── globals.css               # Global styles
│
├── login/
│   └── page.js              # Login page
│
├── admin/
│   ├── page.js              # Admin landing
│   ├── dashboard/page.js    # User management
│   ├── work-centers/page.js
│   └── supervisor-activity/page.js
│
├── manager/
│   ├── page.js
│   ├── dashboard/page.js
│   ├── outsourcing/page.js
│   └── ...
│
├── production-head/
├── supervisor/
├── rm-store/
├── fg-store/
├── packing-zone/
├── patrol/
├── outsourcing-incharge/
├── operator/
└── ...
```

### Protected Routes

```javascript
// Route protection pattern
<ProtectedRoute allowedRoles={['admin', 'manager']}>
  <DashboardContent />
</ProtectedRoute>
```

---

## Component Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        Root Layout                           │
│                      (src/app/layout.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Conditional Header                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Page Content                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │           Protected Route Wrapper              │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │        Role-Specific Dashboard           │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │      Dashboard Components          │  │  │  │  │
│  │  │  │  │  • Stats Cards                     │  │  │  │  │
│  │  │  │  │  • Data Tables                     │  │  │  │  │
│  │  │  │  │  • Forms                           │  │  │  │  │
│  │  │  │  │  • Charts                          │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Conditional Footer                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Toast Notifications                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
│                                                              │
│  1. Transport Security (HTTPS in production)                │
│  2. Security Headers (CSP, X-Frame-Options, HSTS)           │
│  3. CSRF Protection (Token validation)                      │
│  4. Authentication (JWT tokens)                             │
│  5. Authorization (Role-based access control)               │
│  6. Input Validation (Client & server-side)                 │
│  7. Error Handling (No sensitive info exposure)             │
└─────────────────────────────────────────────────────────────┘
```

### Security Headers (Production)

```javascript
// next.config.mjs
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': '...'
}
```

---

## Deployment Architecture

### Docker Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER ARCHITECTURE                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Load Balancer / Nginx                  │    │
│  │                   (Port 80/443)                     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │         MSP Frontend Container(s)                   │    │
│  │              (Port 3000)                            │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │        Next.js Application               │     │    │
│  │  │         (Production Build)               │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Backend API Container                     │    │
│  │              (Port 8000)                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING                        │
│                                                              │
│         Load Balancer                                        │
│              │                                               │
│    ┌─────────┼─────────┐                                    │
│    │         │         │                                    │
│    ▼         ▼         ▼                                    │
│  [App1]   [App2]   [App3]  ← Multiple frontend instances   │
│    │         │         │                                    │
│    └─────────┼─────────┘                                    │
│              │                                               │
│              ▼                                               │
│         Backend API                                          │
│              │                                               │
│              ▼                                               │
│          Database                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Build Optimization

- Code splitting by route
- Dynamic imports for heavy components
- Image optimization (WebP, AVIF)
- CSS purging with TailwindCSS
- Webpack chunk optimization
- Tree shaking unused code

### Runtime Optimization

- React.memo() for expensive renders
- Lazy loading for routes
- Pagination for large datasets
- Debounced search inputs
- Request throttling
- Efficient re-rendering strategies

---

## Monitoring & Observability

### Logging Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGGING LAYERS                          │
│                                                              │
│  1. API Request/Response Logging (api-utils.js)             │
│  2. Authentication Events (useAuth.js)                      │
│  3. Error Boundaries (Production)                           │
│  4. Performance Metrics (Next.js built-in)                  │
│  5. User Actions (Analytics integration)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Architecture Considerations

- **WebSocket Integration**: Real-time notifications
- **State Management Library**: Consider Redux/Zustand for complex state
- **GraphQL**: Potential migration from REST
- **Micro-frontends**: Module federation for team scalability
- **Progressive Web App**: Offline capabilities
- **Server Components**: Leverage React Server Components more

---

## Conclusion

The MSP ERP Lite frontend architecture is designed for:
- **Maintainability**: Clear separation of concerns
- **Scalability**: Horizontal scaling with Docker
- **Security**: Multiple security layers
- **Performance**: Optimized builds and runtime
- **Developer Experience**: Standardized patterns and tools

For implementation details, refer to:
- [README.md](./README.md) - Setup and usage
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup

