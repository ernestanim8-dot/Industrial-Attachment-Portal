# Deployment Guide - TTU Industrial Attachment Portal

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18.x or higher installed
- ✅ Git for version control
- ✅ Build tools configured
- ✅ Deployment platform account (Vercel/Netlify/etc.)

---

## Local Development

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd ttu-industrial-attachment-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### 2. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

---

## Production Build

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `/dist` directory.

### Test Production Build Locally

```bash
npm run preview
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

#### Why Vercel?

- ✅ Optimized for Vite
- ✅ Zero configuration
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier available

### Vercel Steps

#### Method A: GitHub Integration

1. Push code to GitHub repository
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables (if any)
7. Click "Deploy"

#### Method B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment

- Custom domain: Settings â†’ Domains
- Environment variables: Settings â†’ Environment Variables
- Analytics: Enable in dashboard

---

### Option 2: Netlify

#### Netlify Steps

#### Method A: Drag & Drop

1. Build locally: `npm run build`
2. Visit [netlify.com](https://netlify.com)
3. Drag `/dist` folder to deploy area

#### Method B: GitHub Integration

1. Push code to GitHub
2. Click "New site from Git"
3. Connect GitHub repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy

#### Method C: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Configuration File

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: GitHub Pages

#### GitHub Pages Steps

1. Install gh-pages:

```bash
npm install --save-dev gh-pages
```

1. Add to `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/repository-name"
}
```

1. Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/repository-name/',
  // ... other config
});
```

1. Deploy:

```bash
npm run deploy
```

1. Enable GitHub Pages:
   - Repository â†’ Settings â†’ Pages
   - Source: `gh-pages` branch

---

### Option 4: AWS Amplify

#### AWS Amplify Steps

1. Visit [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" â†’ "Host web app"
3. Connect GitHub repository
4. Build settings:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

5. Save and deploy

---

### Option 5: Traditional Web Server

#### Using Nginx

1. Build application:

```bash
npm run build
```

1. Copy `/dist` to server:

```bash
scp -r dist/* user@server:/var/www/html/
```

1. Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;
}
```

1. Restart Nginx:

```bash
sudo systemctl restart nginx
```

### Using Apache

`.htaccess` file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Post-Deployment Checklist

### Functionality Testing

- [ ] All pages load correctly
- [ ] Login works for all user roles
- [ ] Reports can be submitted
- [ ] Reports can be graded
- [ ] Users can be added (admin)
- [ ] Notifications work
- [ ] Search and filters function
- [ ] Charts and analytics display
- [ ] Calendar view works
- [ ] Document preview opens
- [ ] Bulk download functions
- [ ] Print reports work
- [ ] Mobile responsiveness verified

### Performance

- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Assets loading correctly
- [ ] Images optimized

### SEO & Metadata

- [ ] Page title set
- [ ] Meta description added
- [ ] Favicon configured
- [ ] Open Graph tags (optional)

### Security

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] API keys not exposed

---

## Environment Variables

### Production Settings

Create environment variables in your deployment platform:

```env
VITE_APP_ENVIRONMENT=production
VITE_API_URL=https://api.yourdomain.com
VITE_DEBUG_MODE=false
VITE_SHOW_MOCK_DATA_WARNING=true
```

**Important:**

- Only variables prefixed with `VITE_` are exposed to client
- Never commit `.env` to version control
- Use platform-specific environment variable settings

---

### Custom Domain Setup

#### Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records:

```text
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Netlify

1. Domain Settings → Custom domains
2. Add domain
3. Update DNS:

```text
Type: A
Name: @
Value: 75.2.60.5
```

---

## SSL Certificate

Most platforms provide automatic SSL:

- ✅ Vercel: Automatic
- ✅ Netlify: Automatic
- ✅ AWS Amplify: Automatic
- ✅ GitHub Pages: Automatic (custom domains)

For traditional servers, use [Let's Encrypt](https://letsencrypt.org/):

```bash
# Using Certbot
sudo certbot --nginx -d yourdomain.com
```

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID}}
        vercel-project-id: ${{ secrets.PROJECT_ID}}
        vercel-args: '--prod'
```

---

## Monitoring & Analytics

### Recommended Tools

**Error Tracking:**

- [Sentry](https://sentry.io) - Real-time error monitoring
- [LogRocket](https://logrocket.com) - Session replay

**Analytics:**

- Google Analytics 4
- Vercel Analytics
- Plausible Analytics (privacy-focused)

**Performance:**

- Lighthouse CI
- WebPageTest
- GTmetrix

### Implementation

**Google Analytics:**

Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## Backup & Recovery

### Database Backups (When backend is added)

```bash
# Automated daily backups
0 2 * * * /usr/bin/pg_dump dbname > /backups/db_$(date +\%Y\%m\%d).sql
```

### Code Backups

- ✅ GitHub repository (primary)
- ✅ Mirror repository (backup)
- ✅ Local backup copy

---

## Rollback Strategy

### Vercel/Netlify

1. Go to Deployments
2. Select previous deployment
3. Click "Promote to Production"

#### Git-based Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>
git push -f origin main
```

---

## Scaling Considerations

### CDN Configuration

- Enable CDN for static assets
- Set appropriate cache headers
- Use image optimization services

### Performance Optimization

1. **Code Splitting:**

```tsx
import { lazy, Suspense } from 'react';

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

<Suspense fallback={<Loading />}>
  <StudentDashboard />
</Suspense>
```

1. **Asset Optimization:**

- Compress images
- Minify CSS/JS
- Enable Gzip/Brotli

1. **Caching Strategy:**

```text
Cache-Control: public, max-age=31536000, immutable
```

---

## Troubleshooting

### Common Issues

**404 on Refresh:**

- Solution: Configure server for SPA routing
- Add redirect rules (see platform-specific configs)

**Environment Variables Not Working:**

- Ensure prefix is `VITE_`
- Rebuild after changes
- Check platform environment settings

**Build Fails:**

- Check Node version
- Clear `node_modules` and reinstall
- Review build logs

**Slow Load Times:**

- Enable compression
- Optimize images
- Use CDN
- Check Lighthouse report

---

## Support

### Getting Help

#### Documentation

- Vite: <https://vitejs.dev>
- React Router: <https://reactrouter.com>
- Tailwind CSS: <https://tailwindcss.com>

**Community:**

- GitHub Issues
- Stack Overflow
- Discord servers

**Professional Support:**

- Contact: <support@ttu.edu.gh>
- Phone: +233 (0)XX XXX XXXX

---

## Maintenance Schedule

### Regular Tasks

**Daily:**

- Monitor error logs
- Check uptime
- Review analytics

**Weekly:**

- Review performance metrics
- Check for dependency updates
- Backup verification

**Monthly:**

- Security audit
- Update dependencies
- User feedback review
- Performance optimization

**Quarterly:**

- Major version updates
- Feature planning
- Comprehensive testing

---

## 🌐 Deployment to Vercel & Render

The application is pre-configured with `vercel.json` and `render.yaml` for rapid deployment.

### 1. Backend (Render.com)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect this GitHub repository.
3. Render will automatically detect `render.yaml` in the root.
4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string for authentication.
   - `CORS_ORIGIN`: Your production URL (e.g., `https://ttu-portal.vercel.app`).

### 2. Frontend (Vercel)
1. Import the project into [Vercel](https://vercel.com).
2. Vercel will use Vite and `vercel.json` for routing.
3. Set Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://attachment-portal-api.onrender.com`).

---

## Completed Phase 3 Features

1. **Full-Stack Data Integration**: Express/Node.js API connected to MongoDB.
2. **Real-time Notifications**: Background polling for submissions and grades.
3. **PDF Generation**: Integrated PDF export for all report types.
4. **Data Persistence**: Removed all mock-data reliance.

---

### Items Under Consideration

1. **Email Integration**: Automated SMTP alerts for supervisors.
2. **Advanced Analytics**: Cross-department performance tracking.
3. **Mobile App**: Native iOS/Android wrapping.

#### Performance Enhancements

1. Service Worker
2. Offline support

#### Security Enhancements

1. Two-factor authentication
2. Advanced encryption
3. Audit logging

---

## Compliance & Legal

### Data Protection

- GDPR compliance (if applicable)
- Data retention policies
- User privacy rights
- Terms of service

### Accessibility

- WCAG 2.1 Level AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast standards

---

**Deployment Guide Version:** 1.0
**Last Updated:** March 2026
**Maintained by:** TTU ICT Department

Copyright 2026 Takoradi Technical University
