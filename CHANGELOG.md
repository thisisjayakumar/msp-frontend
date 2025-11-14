# Changelog

All notable changes to MSP ERP Lite Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Real-time notifications with WebSocket
- Advanced analytics dashboard with charts
- Export reports to PDF/Excel
- Multi-language support (i18n)
- Dark mode theme
- Offline mode support
- Mobile app version

---

## [1.0.0] - 2024-11-14

### Added

#### Core Features
- Multi-role authentication system with JWT
- Automatic token refresh mechanism
- Role-based access control (RBAC) for 9 user roles
- Comprehensive API integration layer
- Toast notification system
- Protected route components

#### User Roles
- **Admin**: System administration and user management
- **Manager**: Manufacturing order and stock management
- **Production Head**: Full production oversight with analytics
- **Supervisor**: Process-level supervision and quality checks
- **RM Store**: Raw material inventory management
- **FG Store**: Finished goods and dispatch operations
- **Packing Zone**: Packing, labeling, and verification
- **Outsourcing Incharge**: Outsourcing operations management
- **Patrol**: Quality control monitoring and QC uploads

#### Manufacturing Management
- Manufacturing Order (MO) creation and tracking
- Purchase Order (PO) management
- Process assignment workflow
- Batch processing and heat number management
- MO priority management
- Resource allocation panel
- Manufacturing order approval workflow
- MO detail views with complete tracking

#### Inventory Management
- Raw material store dashboard
- Finished goods store dashboard
- Stock level monitoring and alerts
- Real-time inventory tracking
- Stock adjustments and transfers
- Transaction logging and history
- Low stock alerts
- Material requirement planning

#### Production Operations
- Process execution interface for operators
- Supervisor dashboard for process monitoring
- Final inspection workflow
- Incoming material verification
- Machine allocation management
- Batch tracking and monitoring
- Process flow visualization
- Real-time production metrics

#### Quality Control
- Patrol duty management
- QC sheet upload system
- Quality checkpoints throughout production
- Final inspection and verification
- Scheduled patrol monitoring
- Quality documentation tracking

#### Outsourcing Operations
- Send batches to outsourcing vendors
- Receive materials from outsourcing
- Track outsourcing quantities and timelines
- Outsourcing clearance workflow
- Vendor operation coordination

#### Packing & Dispatch
- Batch verification before packing
- Packing operations interface
- Loose stock management
- Heat number merge requests
- Stock adjustment requests
- Label generation system
- Dispatch management with confirmations
- FG stock level monitoring

#### Analytics & Reporting
- Production head analytics dashboard
- Real-time operational metrics
- Supervisor activity monitoring
- Performance tracking
- Process tracking summaries
- Workflow tracker

#### Admin Features
- User management (CRUD operations)
- Role assignment and management
- Work center configuration and management
- System settings
- Supervisor activity dashboard
- Global system administration

#### Technical Features
- Next.js 15.5.3 with App Router
- React 19.1.0
- TailwindCSS 3.4.18 for styling
- Turbopack for faster development builds
- Docker support with multi-stage builds
- Production-ready Dockerfile
- Docker Compose configuration
- Security headers in production
- Image optimization (WebP, AVIF)
- Code splitting and bundle optimization
- Health check endpoints
- CSRF protection
- Rate limiting utilities
- Throttled API requests
- Local storage management hooks
- Custom authentication hooks
- Permission utilities

#### UI Components
- Reusable Button component
- Card component with variants
- Input component with validation
- Modal/Dialog system
- Table component with sorting
- Loading states and skeletons
- Notification bell
- Date picker integration
- Form components
- Conditional header/footer
- Responsive navigation
- Sidebar navigation

#### API Integration
- Centralized API service layer
- Automatic authentication header injection
- Request/response interceptors
- Error handling and retry logic
- Token refresh on 401 responses
- Graceful error messages
- File upload utilities
- CRUD operation helpers
- Manufacturing API endpoints
- Inventory API endpoints
- Outsourcing API endpoints
- Packing zone API endpoints
- Patrol API endpoints
- Admin service APIs
- Work center APIs
- Process tracking APIs
- Notification APIs

#### Configuration
- Environment-based configuration
- Role definitions and permissions
- API endpoint configuration
- Theme configuration
- Feature flags system
- Validation rules
- Route definitions

#### Developer Experience
- Comprehensive README documentation
- Quick start guide
- Contributing guidelines
- Docker setup instructions
- Code style guidelines
- Commit message conventions
- PR templates and processes
- ESLint configuration
- Environment variable documentation

### Changed
- Updated to Next.js 15.5.3
- Upgraded to React 19.1.0
- Improved authentication flow with refresh tokens
- Enhanced error handling across all API calls
- Optimized build configuration for production
- Improved Docker builds with caching

### Security
- Implemented JWT-based authentication
- Added CSRF protection
- Configured security headers (X-Frame-Options, CSP, etc.)
- Added HSTS in production
- Implemented token refresh mechanism
- Secure token storage (localStorage/sessionStorage)
- Protected routes with authentication checks
- Role-based permission validation

### Performance
- Enabled Turbopack for development
- Implemented code splitting
- Optimized bundle sizes with webpack configuration
- Image optimization (WebP, AVIF formats)
- Lazy loading for routes and components
- Request throttling and rate limiting
- Efficient API caching strategies

---

## Version History

### [1.0.0] - 2024-11-14
- Initial release with complete ERP functionality

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
- **Performance** for performance improvements

---

## Support

For questions about specific versions or features, please refer to:
- [README.md](./README.md) - Main documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide

