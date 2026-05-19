# Production Deployment Checklist

## Pre-Deployment Security

### Environment Variables

- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Generate strong JWT_REFRESH_SECRET (different from JWT_SECRET)
- [ ] Generate strong COOKIE_SECRET (min 32 characters)
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Update MONGODB_URI to production database
- [ ] Remove or secure Redis credentials
- [ ] Verify all secrets are in .env (not hardcoded)

### Cookie Configuration

- [ ] Verify secure: true in production
- [ ] Verify sameSite: 'none' for cross-origin
- [ ] Verify httpOnly: true on all cookies
- [ ] Verify path: '/' is set
- [ ] Test cookie expiration times

### CORS Configuration

- [ ] Set exact origin (no wildcards with credentials)
- [ ] Verify credentials: true
- [ ] Test preflight OPTIONS requests
- [ ] Verify Access-Control-Allow-Credentials header

### HTTPS/SSL

- [ ] SSL certificate installed
- [ ] Force HTTPS redirect
- [ ] Test secure cookie transmission
- [ ] Verify mixed content warnings resolved

## Backend Checklist

### Code Review

- [ ] All console.log removed (use logger)
- [ ] Error messages don't expose sensitive info
- [ ] Stack traces disabled in production
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention measures

### Database

- [ ] MongoDB indexes created
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] User collection has refreshTokens field
- [ ] Database credentials secured

### Authentication

- [ ] Token expiration times verified (15m / 30d)
- [ ] Refresh token rotation working
- [ ] Logout invalidates tokens
- [ ] Logout-all clears all tokens
- [ ] Multi-device support tested (max 5)
- [ ] Password hashing with bcrypt (12 rounds)

### Authorization

- [ ] RBAC middleware working
- [ ] Role-based routes protected
- [ ] Permission checks in place
- [ ] Admin routes secured

### Logging

- [ ] Winston logger configured
- [ ] Log rotation enabled
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Access logs enabled

### Testing

- [ ] All auth endpoints tested
- [ ] Token refresh flow tested
- [ ] Logout flow tested
- [ ] Protected routes tested
- [ ] RBAC tested for all roles
- [ ] Error scenarios tested
- [ ] Load testing completed

## Frontend Checklist

### Configuration

- [ ] NEXT_PUBLIC_API_URL set to production
- [ ] withCredentials: true in axios
- [ ] No hardcoded API URLs
- [ ] Environment variables properly loaded

### Code Review

- [ ] No localStorage token storage
- [ ] No sessionStorage token storage
- [ ] No Authorization headers
- [ ] Axios interceptor for 401 handling
- [ ] Automatic refresh implemented
- [ ] Request queue during refresh
- [ ] Error handling for failed refresh

### Security

- [ ] No tokens in Redux state
- [ ] No tokens in component state
- [ ] No tokens in URL parameters
- [ ] XSS prevention (React escaping)
- [ ] CSRF tokens if needed
- [ ] Content Security Policy configured

### User Experience

- [ ] Loading states during auth
- [ ] Error messages user-friendly
- [ ] Redirect to login on auth failure
- [ ] Remember user preference (if applicable)
- [ ] Smooth token refresh (no UI flicker)

### Testing

- [ ] Login flow tested
- [ ] Registration flow tested
- [ ] Logout flow tested
- [ ] Protected routes tested
- [ ] Automatic refresh tested
- [ ] Multi-tab behavior tested
- [ ] Network failure handling tested

## Infrastructure

### Server

- [ ] Node.js version compatible (v18+)
- [ ] PM2 or similar process manager
- [ ] Auto-restart on crash
- [ ] Memory limits configured
- [ ] CPU limits configured

### Reverse Proxy (Nginx/Apache)

- [ ] SSL termination configured
- [ ] Proxy headers forwarded
- [ ] Rate limiting at proxy level
- [ ] DDoS protection
- [ ] Static file caching

### Monitoring

- [ ] Server health monitoring
- [ ] Application performance monitoring
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Uptime monitoring
- [ ] Database monitoring
- [ ] Alert system configured

### Backup

- [ ] Database backup automated
- [ ] Backup restoration tested
- [ ] Environment variables backed up
- [ ] Code repository backed up

## Security Hardening

### Headers

- [ ] Helmet.js configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] X-XSS-Protection set
- [ ] Strict-Transport-Security set
- [ ] Content-Security-Policy set

### Rate Limiting

- [ ] Login endpoint rate limited
- [ ] Registration endpoint rate limited
- [ ] Refresh endpoint rate limited
- [ ] API endpoints rate limited
- [ ] IP-based rate limiting

### Input Validation

- [ ] Email validation
- [ ] Password strength requirements
- [ ] Phone number validation
- [ ] SQL injection prevention
- [ ] NoSQL injection prevention
- [ ] XSS prevention

### Dependencies

- [ ] npm audit run and fixed
- [ ] Dependencies up to date
- [ ] No known vulnerabilities
- [ ] Unused dependencies removed

## Performance

### Optimization

- [ ] Database queries optimized
- [ ] Indexes created
- [ ] Connection pooling enabled
- [ ] Caching strategy implemented
- [ ] Compression enabled (gzip)

### Load Testing

- [ ] Concurrent users tested
- [ ] Token refresh under load tested
- [ ] Database performance tested
- [ ] Memory leaks checked
- [ ] CPU usage monitored

## Documentation

### Internal

- [ ] API documentation updated
- [ ] Architecture diagrams created
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Incident response plan

### External

- [ ] User authentication guide
- [ ] API integration guide
- [ ] Error codes documented
- [ ] Rate limits documented

## Compliance

### Legal

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented (if EU)
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy

### Security

- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Vulnerability scan passed
- [ ] Security headers verified

## Post-Deployment

### Verification

- [ ] Health check endpoint responding
- [ ] Login flow working
- [ ] Registration flow working
- [ ] Token refresh working
- [ ] Logout working
- [ ] Protected routes working
- [ ] RBAC working
- [ ] Cookies being set correctly
- [ ] HTTPS working
- [ ] CORS working

### Monitoring

- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] Database connections stable
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] No security alerts

### Rollback Plan

- [ ] Previous version tagged
- [ ] Rollback procedure tested
- [ ] Database migration rollback ready
- [ ] DNS rollback plan
- [ ] Communication plan for downtime

## Testing Commands

### Backend Health

```bash
curl https://api.yourdomain.com/health
```

### Login Test

```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -v
```

### Protected Route Test

```bash
curl -X GET https://api.yourdomain.com/api/v1/auth/profile \
  -b cookies.txt
```

### Refresh Test

```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/refresh \
  -b cookies.txt -c cookies.txt
```

### Security Headers Test

```bash
curl -I https://api.yourdomain.com
```

### SSL Test

```bash
openssl s_client -connect api.yourdomain.com:443
```

## Emergency Contacts

- [ ] DevOps team contact info
- [ ] Database admin contact info
- [ ] Security team contact info
- [ ] On-call rotation schedule

## Sign-Off

- [ ] Backend lead approval
- [ ] Frontend lead approval
- [ ] Security team approval
- [ ] DevOps approval
- [ ] Product owner approval

---

## Production Environment Variables Template

```env
# Server
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/growthcraft?retryWrites=true&w=majority

# JWT (Generate with: openssl rand -base64 32)
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_REFRESH_SECRET=<GENERATE_DIFFERENT_SECRET>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Cookies
COOKIE_SECRET=<GENERATE_STRONG_SECRET>

# Frontend
FRONTEND_URL=https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/growthcraft/app.log

# Monitoring (Optional)
SENTRY_DSN=https://...
```

## Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

---

**Remember**: Security is not a one-time task. Regular audits, updates, and monitoring are essential for maintaining a secure production environment.
