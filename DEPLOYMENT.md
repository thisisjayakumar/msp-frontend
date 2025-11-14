# Deployment Guide - MSP ERP Lite Frontend

This guide covers deployment strategies for MSP ERP Lite frontend across different environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Local Production Build](#local-production-build)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Rollback Strategy](#rollback-strategy)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Code Quality
- [ ] All tests pass locally
- [ ] No linting errors: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Code reviewed and approved
- [ ] No console.log statements in production code

### Environment Variables
- [ ] All required environment variables configured
- [ ] API endpoints point to production backend
- [ ] Secrets are secure (not in code)
- [ ] Environment-specific configs verified

### Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Authentication working correctly
- [ ] CORS configured on backend

### Performance
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] Lazy loading implemented
- [ ] Code splitting verified

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] Deployment notes documented

---

## Environment Configuration

### Development Environment

`.env.development` or `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Staging Environment

`.env.staging`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://staging-api.your-domain.com/api
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional
NEXT_PUBLIC_GA_ID=your-staging-ga-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Production Environment

`.env.production`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Analytics
NEXT_PUBLIC_GA_ID=your-production-ga-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Local Production Build

### Test Production Build Locally

```bash
# Build for production
npm run build

# Start production server
npm start

# Application runs on http://localhost:3000
```

### Verify Production Build

1. **Check bundle sizes**:
   ```bash
   # Build output shows bundle sizes
   npm run build
   ```

2. **Test all routes**:
   - Login functionality
   - All role dashboards
   - API integration
   - Error handling

3. **Performance check**:
   - Use Lighthouse in Chrome DevTools
   - Target: 90+ performance score

---

## Docker Deployment

### Option 1: Development Docker

**Use Case**: Quick testing with development features

```bash
# Build image
docker build -t msp-frontend:dev -f Dockerfile .

# Run container
docker run -d \
  --name msp-frontend-dev \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://backend:8000/api \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  msp-frontend:dev

# View logs
docker logs -f msp-frontend-dev

# Stop container
docker stop msp-frontend-dev
docker rm msp-frontend-dev
```

### Option 2: Production Docker (Multi-stage Build)

**Use Case**: Optimized production deployment

```bash
# Build production image
docker build -t msp-frontend:prod \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -f Dockerfile.production .

# Run container
docker run -d \
  --name msp-frontend-prod \
  -p 3000:3000 \
  --restart unless-stopped \
  msp-frontend:prod

# Health check
curl http://localhost:3000
```

### Option 3: Docker Compose

**Use Case**: Multi-container deployment with backend

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.production
      args:
        NEXT_PUBLIC_API_BASE_URL: https://api.your-domain.com/api
        NEXT_PUBLIC_APP_URL: https://your-domain.com
    container_name: msp-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - msp-network
    depends_on:
      - backend

  backend:
    image: msp-backend:latest
    container_name: msp-backend
    ports:
      - "8000:8000"
    networks:
      - msp-network
    restart: unless-stopped

networks:
  msp-network:
    driver: bridge
```

**Deploy**:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Cloud Deployment

### AWS (EC2)

#### Step 1: Launch EC2 Instance

```bash
# Instance type: t3.medium or larger
# OS: Ubuntu 22.04 LTS
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

#### Step 2: SSH into Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx
```

#### Step 4: Deploy Application

**Option A: Direct Node.js**

```bash
# Clone repository
git clone <repository-url>
cd msp-frontend

# Install dependencies
npm ci --production

# Build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start npm --name "msp-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup

# Application runs on port 3000
```

**Option B: Docker**

```bash
# Clone repository
git clone <repository-url>
cd msp-frontend

# Build and run
docker build -t msp-frontend:prod -f Dockerfile.production .
docker run -d -p 3000:3000 --name msp-frontend msp-frontend:prod
```

#### Step 5: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/msp-frontend
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/msp-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Vercel (Recommended for Easy Deployment)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Step 3: Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all required variables:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - etc.

### DigitalOcean

#### Using App Platform

1. **Connect Repository**:
   - Link GitHub/GitLab repository

2. **Configure Build**:
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Environment Variables**:
   - Add all required environment variables

4. **Deploy**:
   - Click "Deploy"
   - Automatic deployments on git push

#### Using Droplet (Similar to EC2)

Follow AWS EC2 steps with DigitalOcean Droplet.

### Google Cloud Platform (Cloud Run)

#### Step 1: Build Container

```bash
# Build for Cloud Run
docker build -t gcr.io/YOUR_PROJECT_ID/msp-frontend:latest \
  -f Dockerfile.production .
```

#### Step 2: Push to Container Registry

```bash
# Authenticate
gcloud auth configure-docker

# Push image
docker push gcr.io/YOUR_PROJECT_ID/msp-frontend:latest
```

#### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy msp-frontend \
  --image gcr.io/YOUR_PROJECT_ID/msp-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api
```

---

## Reverse Proxy Setup

### Nginx Configuration

**Full configuration** (`/etc/nginx/sites-available/msp-frontend`):

```nginx
# Upstream configuration
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Logging
    access_log /var/log/nginx/msp-frontend-access.log;
    error_log /var/log/nginx/msp-frontend-error.log;

    # Client max body size
    client_max_body_size 10M;

    # Proxy to Next.js
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files cache
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Public assets cache
    location /public {
        proxy_pass http://frontend;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

#### Install Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx
```

#### Obtain Certificate

```bash
# For Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts
# Choose to redirect HTTP to HTTPS
```

#### Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

### Manual SSL Certificate

If using commercial SSL certificate:

```nginx
ssl_certificate /path/to/your/certificate.crt;
ssl_certificate_key /path/to/your/private.key;
ssl_trusted_certificate /path/to/ca-bundle.crt;
```

---

## Monitoring & Logging

### Application Logging

#### PM2 Logs

```bash
# View logs
pm2 logs msp-frontend

# Save logs to file
pm2 logs msp-frontend > logs.txt
```

#### Docker Logs

```bash
# Follow logs
docker logs -f msp-frontend

# Last 100 lines
docker logs --tail 100 msp-frontend
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/msp-frontend-access.log

# Error logs
sudo tail -f /var/log/nginx/msp-frontend-error.log
```

### Health Checks

```bash
# Manual health check
curl http://localhost:3000

# Automated monitoring (cron job)
*/5 * * * * curl -f http://localhost:3000 || systemctl restart msp-frontend
```

### Monitoring Tools

#### Sentry (Error Tracking)

```javascript
// next.config.mjs
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Google Analytics

```javascript
// Add to layout.js or _app.js
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

---

## Rollback Strategy

### Docker Rollback

```bash
# Tag images with versions
docker tag msp-frontend:prod msp-frontend:v1.0.0

# Rollback to previous version
docker stop msp-frontend
docker rm msp-frontend
docker run -d -p 3000:3000 --name msp-frontend msp-frontend:v0.9.0
```

### Git-based Rollback

```bash
# Checkout previous version
git checkout v1.0.0

# Rebuild and deploy
npm run build
pm2 restart msp-frontend
```

### Blue-Green Deployment

```bash
# Deploy new version to port 3001
pm2 start npm --name "msp-frontend-green" -- start -- -p 3001

# Test new version
curl http://localhost:3001

# Switch Nginx upstream to port 3001
sudo nano /etc/nginx/sites-available/msp-frontend
# Update: proxy_pass http://localhost:3001;

# Reload Nginx
sudo nginx -s reload

# Stop old version
pm2 stop msp-frontend-blue
```

---

## Troubleshooting

### Build Failures

**Issue**: Build fails with memory errors

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Port Conflicts

**Issue**: Port 3000 already in use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Environment Variable Issues

**Issue**: Environment variables not loaded

```bash
# Verify .env.production exists
ls -la .env.production

# Rebuild with explicit env
NEXT_PUBLIC_API_BASE_URL=https://api.domain.com/api npm run build
```

### API Connection Issues

**Issue**: Cannot connect to backend

1. Check backend is running
2. Verify CORS settings on backend
3. Check firewall rules
4. Verify SSL certificates
5. Test with curl:

```bash
curl -I https://api.your-domain.com/api
```

### SSL Certificate Issues

**Issue**: SSL certificate not working

```bash
# Check certificate validity
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt
sudo certbot renew --force-renewal
```

### Performance Issues

**Issue**: Slow page loads

1. **Check bundle sizes**: `npm run build`
2. **Enable compression**: Verify gzip in Nginx
3. **CDN**: Consider using CDN for static assets
4. **Caching**: Implement proper caching headers

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.APP_URL }}
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/msp-frontend
            git pull
            npm ci
            npm run build
            pm2 restart msp-frontend
```

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Application accessible at domain
- [ ] HTTPS working correctly
- [ ] All pages load without errors
- [ ] Login functionality works
- [ ] API integration working
- [ ] No console errors in browser
- [ ] Mobile responsiveness
- [ ] Performance metrics acceptable
- [ ] Monitoring tools active
- [ ] Logs being captured
- [ ] Backup strategy in place

---

## Support

For deployment issues:
- Check [TROUBLESHOOTING](#troubleshooting) section
- Review logs (application, Nginx, system)
- Consult [README.md](./README.md) for general setup
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

---

**Deployment completed successfully! 🚀**

