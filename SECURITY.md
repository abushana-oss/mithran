# EMITHRAN Platform - Security Best Practices

## Overview

This document outlines security best practices for the EMITHRAN platform.

## Environment Variables & Secrets

### ✅ DO

- **Use strong passwords**: Minimum 32 characters, random
- **Generate unique secrets**: Never reuse across environments
- **Use `.env` files**: Keep secrets out of code
- **Add `.env` to `.gitignore`**: Never commit secrets
- **Use environment-specific files**: `.env.development`, `.env.production`

### ❌ DON'T

- Never hardcode credentials in source code
- Never commit `.env` files to version control
- Never use default passwords in production
- Never share secrets via email or chat

### Password Generation

```bash
# Generate secure password (Linux/Mac)
openssl rand -base64 32

# Generate secure password (Windows PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Network Security

### Docker Network Isolation

In production, enable network isolation:

```yaml
networks:
  backend-network:
    internal: true  # ← Enable this in production
  database-network:
    internal: true  # ← Enable this in production
```

This prevents:
- Direct external access to backend services
- Unauthorized database connections
- Service-to-service attacks

### Firewall Rules

Only expose necessary ports:

```bash
# Allow only these ports
3000  # Frontend (HTTPS in production)
4000  # Backend API (HTTPS in production)

# Block these from external access
5432  # PostgreSQL
6379  # Redis
5672  # RabbitMQ
9000  # MinIO
```

## Application Security

### CAD Engine

**File Upload Security:**
- ✅ File size limits enforced (default: 50MB)
- ✅ File type validation (extension + magic number)
- ✅ Rate limiting (default: 10 requests/minute)
- ✅ Automatic file cleanup
- ✅ Sandboxed temp directory

**Configuration:**
```env
CAD_MAX_FILE_SIZE_MB=50
CAD_RATE_LIMIT=10
```

### Backend API

**Authentication:**
- ✅ JWT tokens with expiration
- ✅ Refresh token rotation
- ✅ Supabase integration
- ✅ Rate limiting
- ✅ CORS protection

**Headers:**
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Content Security Policy

### Frontend

**Client-Side Security:**
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Secure cookie flags
- ✅ Content Security Policy

## Database Security

### PostgreSQL

**Access Control:**
```sql
-- Create dedicated user (not superuser)
CREATE USER emithran_user WITH PASSWORD 'strong_password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE emithran TO emithran_user;
GRANT USAGE ON SCHEMA public TO emithran_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO emithran_user;
```

**Backup Strategy:**
```bash
# Daily automated backups
0 2 * * * docker-compose exec postgres pg_dump -U emithran_user emithran > /backups/emithran_$(date +\%Y\%m\%d).sql

# Keep 30 days of backups
find /backups -name "emithran_*.sql" -mtime +30 -delete
```

### Redis

**Security:**
- ✅ Password authentication required
- ✅ Memory limits configured
- ✅ Network isolation
- ✅ No persistence for sensitive data

## HTTPS/SSL

### Production Setup

**Use reverse proxy (Nginx/Traefik):**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Let's Encrypt (Free SSL):**
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

## Monitoring & Logging

### Log Security

**What to Log:**
- ✅ Authentication attempts
- ✅ Failed requests
- ✅ Rate limit violations
- ✅ File upload attempts
- ✅ Database errors

**What NOT to Log:**
- ❌ Passwords
- ❌ JWT tokens
- ❌ API keys
- ❌ Personal data (GDPR)

### Log Rotation

```yaml
# docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Incident Response

### Security Breach Checklist

1. **Immediate Actions:**
   - [ ] Stop affected services
   - [ ] Rotate all credentials
   - [ ] Review access logs
   - [ ] Notify stakeholders

2. **Investigation:**
   - [ ] Identify attack vector
   - [ ] Assess data exposure
   - [ ] Document timeline
   - [ ] Preserve evidence

3. **Recovery:**
   - [ ] Patch vulnerabilities
   - [ ] Restore from backup
   - [ ] Update security measures
   - [ ] Monitor for recurrence

4. **Post-Incident:**
   - [ ] Conduct post-mortem
   - [ ] Update procedures
   - [ ] Train team
   - [ ] Implement preventive measures

## Compliance

### GDPR Considerations

- **Data Minimization**: Only collect necessary data
- **Right to Erasure**: Implement data deletion
- **Data Portability**: Export user data
- **Consent Management**: Track user consent
- **Breach Notification**: 72-hour reporting

### Data Retention

```sql
-- Delete old data (example)
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM temp_files WHERE created_at < NOW() - INTERVAL '7 days';
```

## Security Checklist

### Development

- [ ] Use `.env.example` template
- [ ] Never commit secrets
- [ ] Use strong passwords locally
- [ ] Keep dependencies updated
- [ ] Run security scans

### Staging

- [ ] Separate from production
- [ ] Use production-like security
- [ ] Test security features
- [ ] Sanitize test data
- [ ] Limit access

### Production

- [ ] All default passwords changed
- [ ] HTTPS enabled
- [ ] Network isolation enabled
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Logs reviewed regularly
- [ ] Security updates applied
- [ ] Incident response plan ready
- [ ] Team trained on security

## Regular Maintenance

### Weekly

- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Monitor resource usage
- [ ] Review rate limit violations

### Monthly

- [ ] Update dependencies
- [ ] Review user permissions
- [ ] Test backup restoration
- [ ] Security audit

### Quarterly

- [ ] Penetration testing
- [ ] Security training
- [ ] Policy review
- [ ] Disaster recovery drill

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

**Last Updated**: 2025-12-31
**EMITHRAN Security Team**
