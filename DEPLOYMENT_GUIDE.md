# Deployment Guide - OralVis Healthcare

## 🚀 Vercel Deployment (Recommended)

### Prerequisites
- GitHub account
- Vercel account
- Supabase production project

### Step 1: Prepare Repository
\`\`\`bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
\`\`\`

### Step 2: Create Production Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for production
3. Run the database migrations:
   - Copy contents of `scripts/001_create_tables.sql`
   - Run in Supabase SQL Editor
   - Copy contents of `scripts/002_create_storage.sql`
   - Run in Supabase SQL Editor

### Step 3: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
\`\`\`

5. Click "Deploy"

### Step 4: Configure Supabase for Production
1. Go to Authentication → URL Configuration
2. Add your Vercel domain to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Step 5: Test Production Deployment
1. Visit your deployed app
2. Test user registration and login
3. Test file uploads and PDF generation
4. Verify all features work correctly

## 🐳 Docker Deployment

### Dockerfile
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Docker Compose
\`\`\`yaml
version: '3.8'
services:
  oralvis:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

## 🌐 Custom Domain Setup

### Vercel Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Supabase URL configuration

### SSL Certificate
Vercel automatically provides SSL certificates for custom domains.

## 📊 Monitoring and Analytics

### Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Add analytics tracking to your app

### Error Monitoring
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Vercel's built-in monitoring

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's environment variable management
- Rotate API keys regularly

### Database Security
- Enable Row Level Security (RLS) in Supabase
- Regularly audit database permissions
- Monitor unusual access patterns

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Implement rate limiting

## 🚀 Performance Optimization

### Image Optimization
- Use Next.js Image component
- Implement lazy loading
- Compress images before upload

### Caching Strategy
- Enable Vercel Edge Caching
- Implement Redis for session storage
- Use CDN for static assets

### Database Optimization
- Add database indexes for frequently queried fields
- Implement connection pooling
- Monitor query performance

## 📈 Scaling Considerations

### Horizontal Scaling
- Vercel automatically handles scaling
- Consider Supabase Pro for higher limits
- Implement proper error handling

### Database Scaling
- Monitor Supabase usage metrics
- Consider read replicas for heavy read workloads
- Implement proper indexing strategy

## 🔄 CI/CD Pipeline

### GitHub Actions Example
\`\`\`yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
\`\`\`

## 📋 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Authentication working correctly
- [ ] File uploads functioning
- [ ] PDF generation working
- [ ] Email notifications configured
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and analytics enabled
- [ ] Backup strategy implemented
- [ ] Security audit completed

## 🆘 Troubleshooting

### Common Deployment Issues

#### Build Failures
- Check for TypeScript errors
- Verify all dependencies are installed
- Review build logs in Vercel dashboard

#### Environment Variable Issues
- Ensure all required variables are set
- Check variable names match exactly
- Verify Supabase project is active

#### Database Connection Issues
- Verify Supabase URL and keys
- Check database migrations completed
- Ensure RLS policies are correct

#### File Upload Issues
- Verify storage bucket configuration
- Check file size limits
- Ensure proper permissions set
