# Production Deployment Checklist

This checklist ensures your application is production-ready before deploying to Vercel.

## ✅ Pre-Deployment Checklist

### Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel environment variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (server-side only) in Vercel environment variables
- [ ] Set `BOOTSTRAP_SECRET` for one-time administrator bootstrap route
- [ ] Set `NEXT_PUBLIC_APP_DOMAIN` to your production domain (e.g., `finestafrica.ai`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL (e.g., `https://www.finestafrica.ai`)
- [ ] (Recommended) Set `RESEND_API_KEY` to enable automated admin invite emails
- [ ] (Optional) Set `INVITE_EMAIL_FROM` to control the sender identity
- [ ] (Optional) Set `UPSTASH_REDIS_REST_URL` for caching
- [ ] (Optional) Set `UPSTASH_REDIS_REST_TOKEN` for caching
- [ ] Verify no hardcoded credentials in source code

### Database Setup
- [ ] Supabase database tables created (run migration scripts)
- [ ] Run `supabase-admin-security.sql` to install `profiles`, `invitations`, and triggers
- [ ] Invoke `/api/bootstrap-admin` once to create the initial administrator, then secure the secret
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Test authentication flow in Supabase
- [ ] Verify agency creation works with proper authentication
- [ ] Test form submissions save correctly

### DNS Configuration
- [ ] Main domain (finestafrica.ai) points to Vercel
- [ ] Wildcard subdomain (*.finestafrica.ai) configured for agency subdomains
- [ ] SSL/TLS certificates configured (Vercel handles this automatically)
- [ ] Test www redirect (www.finestafrica.ai → finestafrica.ai)

### Code Quality
- [ ] No console.log statements in production code (except errors)
- [ ] All TypeScript errors resolved
- [ ] Linting passes without errors
- [ ] Build completes successfully locally (`npm run build`)
- [ ] Error boundaries implemented
- [ ] Loading states added for async operations

### Security
- [ ] Environment variables use `NEXT_PUBLIC_` prefix only for non-sensitive data
- [ ] No API keys or secrets exposed in client-side code
- [ ] Security headers configured in middleware
- [ ] CORS properly configured if needed
- [ ] Supabase RLS policies tested and working
- [ ] Admin routes require authentication
- [ ] Disable public email/password sign-ups in Supabase Auth provider settings
- [ ] Verify invitation flow creates admins only for pre-approved emails

### Testing
- [ ] Test main form submission (predefined routes)
- [ ] Test main form submission (trip design)
- [ ] Test agency subdomain routing
- [ ] Test admin panel agency creation
- [ ] Test authentication flow
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test error states and error boundaries

### Performance
- [ ] Images optimized (using Next.js Image component)
- [ ] Redis caching configured (optional but recommended)
- [ ] Database queries optimized
- [ ] No unnecessary re-renders in React components

### Monitoring
- [ ] Error logging service configured (e.g., Sentry) - TODO
- [ ] Analytics configured if needed
- [ ] Vercel deployment logs reviewed

## 🚀 Deployment Steps

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Vercel will automatically deploy when you push to main
   - Or manually deploy via Vercel dashboard

3. **Verify Deployment**
   - Check deployment logs in Vercel
   - Visit your production URL
   - Test all critical flows

4. **Post-Deployment**
   - Monitor for errors in Vercel logs
   - Test all features in production
   - Verify agency subdomains work

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use different credentials for development and production
   - Rotate keys periodically

2. **Database Security**
   - Enable RLS on all Supabase tables
   - Test policies to ensure data isolation
   - Regularly review and update policies

3. **API Security**
   - Validate all user inputs
   - Use Zod schemas for validation
   - Implement rate limiting if needed
   - Add CSRF protection for sensitive operations

4. **Client Security**
   - Keep dependencies updated
   - Regular security audits with `npm audit`
   - Use Content Security Policy (CSP) headers

## 🐛 Common Issues & Solutions

### Issue: "Agency not found" error
**Solution:** Check that wildcard DNS is configured and `NEXT_PUBLIC_APP_DOMAIN` is set correctly

### Issue: Database connection errors
**Solution:** Verify Supabase environment variables are set in Vercel

### Issue: WWW redirect loop
**Solution:** Ensure middleware properly handles www subdomain (should be fixed in current code)

### Issue: Images not loading
**Solution:** Check that image URLs are accessible and Next.js image domains are configured in `next.config.js`

### Issue: Build fails in Vercel
**Solution:** 
- Check build logs for specific errors
- Ensure all dependencies are in package.json
- Run `npm run build` locally to reproduce

## 📊 Performance Monitoring

After deployment, monitor:
- Page load times
- API response times
- Database query performance
- Error rates
- User behavior (if analytics configured)

## 🔄 Rollback Plan

If something goes wrong:
1. Revert to previous deployment in Vercel dashboard
2. Check error logs to identify issue
3. Fix locally and redeploy
4. Consider implementing deployment previews for testing

## ✨ Post-Launch Tasks

- [ ] Set up automated backups for Supabase
- [ ] Configure monitoring and alerting
- [ ] Document common admin tasks
- [ ] Create user documentation
- [ ] Plan for regular updates and maintenance

---

Last Updated: $(date)
Generated for: Finest Africa Travel Platform

