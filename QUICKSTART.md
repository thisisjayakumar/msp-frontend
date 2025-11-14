# Quick Start Guide - MSP ERP Lite Frontend

Get up and running with MSP ERP Lite in 5 minutes!

## 🚀 Fast Track Setup

### Step 1: Prerequisites Check

```bash
# Check Node.js version (need v20+)
node --version

# Check npm version (need v10+)
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

---

### Step 2: Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd msp-frontend

# Install dependencies
npm install
```

---

### Step 3: Environment Setup

Create a `.env.local` file in the project root:

```bash
# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
```

**Important**: Make sure your backend API server is running on `http://localhost:8000`

---

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Default Login Credentials

The application supports multiple user roles. Default credentials (check with your backend team):

| Role | Username | Password | Dashboard Path |
|------|----------|----------|----------------|
| Admin | `admin` | - | `/admin` |
| Manager | `manager` | - | `/manager` |
| Production Head | `prod_head` | - | `/production-head` |
| Supervisor | `supervisor` | - | `/supervisor` |
| RM Store | `rm_store` | - | `/rm-store` |
| FG Store | `fg_store` | - | `/fg-store` |
| Packing Zone | `packing` | - | `/packing-zone` |
| Patrol | `patrol` | - | `/patrol` |
| Outsourcing | `outsourcing` | - | `/outsourcing-incharge` |

---

## 🎯 First Steps After Login

### For Admins
1. Navigate to `/admin/dashboard`
2. Create users and assign roles
3. Configure work centers

### For Managers
1. Navigate to `/manager/dashboard`
2. View manufacturing orders
3. Review stock allocation

### For Production Head
1. Navigate to `/production-head/dashboard`
2. Create manufacturing orders
3. Assign processes to orders
4. View production analytics

---

## 🐳 Docker Quick Start

### Development with Docker

```bash
# Build and run
docker build -t msp-frontend:dev -f Dockerfile .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:8000/api \
  msp-frontend:dev
```

### Production with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

---

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

---

## 📂 Project Structure Overview

```
msp-frontend/
├── src/
│   ├── app/              # Pages (Next.js App Router)
│   │   ├── admin/        # Admin dashboard
│   │   ├── manager/      # Manager dashboard
│   │   ├── production-head/
│   │   ├── supervisor/
│   │   ├── rm-store/
│   │   ├── fg-store/
│   │   ├── packing-zone/
│   │   ├── patrol/
│   │   └── login/        # Authentication
│   │
│   ├── components/       # Reusable components
│   │   ├── API_Service/  # API integration
│   │   ├── CommonComponents/
│   │   └── [role-specific]/
│   │
│   └── hooks/           # Custom React hooks
│
├── public/              # Static assets
└── package.json         # Dependencies
```

---

## 🎨 Key Features to Try

### 1. Manufacturing Orders
- **Path**: `/production-head/create-mo`
- **Action**: Create a new manufacturing order
- **Features**: Part selection, quantity, priority, process assignment

### 2. Inventory Management
- **Path**: `/rm-store/dashboard`
- **Action**: View raw material inventory
- **Features**: Stock levels, transactions, material requirements

### 3. Process Tracking
- **Path**: `/supervisor/dashboard`
- **Action**: Monitor production processes
- **Features**: Batch tracking, quality checks, machine allocation

### 4. Quality Control
- **Path**: `/patrol/dashboard`
- **Action**: Upload QC sheets
- **Features**: Process monitoring, scheduled uploads, quality documentation

### 5. Packing & Dispatch
- **Path**: `/packing-zone/dashboard`
- **Action**: Manage packing operations
- **Features**: Batch verification, labeling, dispatch

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Failed

1. Check backend server is running: `http://localhost:8000`
2. Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Check browser console for detailed errors
4. Verify CORS settings on backend

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Authentication Issues

```bash
# Clear browser storage
# Open browser console and run:
localStorage.clear();
sessionStorage.clear();
# Then refresh the page
```

---

## 📚 Next Steps

1. **Read Full Documentation**: Check `README.md` for comprehensive guide
2. **Explore API Layer**: Review `src/components/API_Service/`
3. **Check Contributing Guide**: See `CONTRIBUTING.md` for development guidelines
4. **Review Role Configurations**: See `src/components/config/roles.js`

---

## 🔗 Important URLs (Local Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Admin Portal | http://localhost:3000/admin |
| Manager Dashboard | http://localhost:3000/manager |
| Production Head | http://localhost:3000/production-head |

---

## 💡 Pro Tips

1. **Hot Reload**: Changes auto-refresh in dev mode
2. **Browser DevTools**: Use React DevTools extension
3. **Network Tab**: Monitor API calls in browser DevTools
4. **Console Logs**: Check browser console for errors
5. **Toast Notifications**: Success/error messages appear top-right

---

## 📞 Need Help?

- **Documentation**: Full README.md in project root
- **API Integration**: Check `src/components/API_Service/api-utils.js`
- **Component Examples**: Browse `src/components/`
- **Issue Tracker**: Report bugs and request features

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Development server runs on http://localhost:3000
- [ ] Backend API is accessible
- [ ] Login page loads correctly
- [ ] Can authenticate with valid credentials
- [ ] Dashboard redirects to correct role page
- [ ] No console errors in browser DevTools
- [ ] API requests work (check Network tab)
- [ ] Toast notifications appear for actions

---

**You're all set! Start building amazing features! 🎉**

For detailed information, refer to the main [README.md](./README.md)

