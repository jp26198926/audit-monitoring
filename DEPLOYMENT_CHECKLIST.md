# Deployment Checklist

Use this checklist to ensure all steps are completed for production deployment.

## Pre-Deployment Checklist

### Server Requirements

- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Apache 2.4+ installed and running
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Git installed (if deploying from repository)

### Apache Modules

- [ ] mod_proxy enabled
- [ ] mod_proxy_http enabled
- [ ] mod_proxy_wstunnel enabled
- [ ] mod_rewrite enabled
- [ ] mod_headers enabled

**Enable command:**

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
sudo systemctl restart apache2
```

---

## Deployment Steps

### 1. Directory Setup

- [ ] Created directory: `/var/www/html/audit-monitoring`
- [ ] Set proper ownership: `sudo chown -R $USER:$USER /var/www/html/audit-monitoring`
- [ ] Application files copied/cloned to directory

### 2. Database Setup

- [ ] MySQL database created: `audit_monitoring`
- [ ] Database user created with proper privileges
- [ ] Schema imported: `mysql -u root -p audit_monitoring < database/schema.sql`
- [ ] Tables verified: `SHOW TABLES;` shows all required tables

### 3. Environment Configuration

- [ ] `.env` file created from `.env.production.example`
- [ ] Database credentials configured
- [ ] JWT_SECRET generated (min 32 characters): `openssl rand -base64 32`
- [ ] Email settings configured
- [ ] APP_URL set to: `http://[your-server-ip]/audit-monitoring`
- [ ] BASE_PATH set to: `/audit-monitoring`
- [ ] PORT set (default: 3000)
- [ ] NODE_ENV set to: `production`

### 4. Application Build

- [ ] Dependencies installed: `npm install`
- [ ] Application built successfully: `npm run build`
- [ ] `.next` directory created and contains build files

### 5. File Permissions

- [ ] Uploads directory created: `mkdir -p public/uploads/findings`
- [ ] Upload permissions set: `chmod -R 755 public/uploads`
- [ ] Upload ownership set: `sudo chown -R www-data:www-data public/uploads`

### 6. Apache Configuration

- [ ] Apache config file edited (000-default.conf or custom)
- [ ] Proxy configuration added for `/audit-monitoring`
- [ ] Proxy directives point to: `http://localhost:3000/audit-monitoring`
- [ ] Configuration syntax tested: `sudo apache2ctl configtest`
- [ ] Apache reloaded: `sudo systemctl reload apache2`

### 7. PM2 Process Management

- [ ] Application started: `pm2 start npm --name "audit-monitoring" -- start`
- [ ] Cron job started: `pm2 start npm --name "audit-cron" -- run cron`
- [ ] PM2 configuration saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup systemd` (follow output instructions)
- [ ] Processes verified running: `pm2 status`

### 8. Firewall Configuration

- [ ] Port 80 allowed: `sudo ufw allow 80/tcp`
- [ ] Port 443 allowed (if using SSL): `sudo ufw allow 443/tcp`
- [ ] Port 3000 NOT exposed externally (internal use only)
- [ ] Firewall rules verified: `sudo ufw status`

---

## Verification Steps

### Test Application

- [ ] PM2 status shows **online**: `pm2 status`
- [ ] No errors in logs: `pm2 logs audit-monitoring --lines 50`
- [ ] Direct server test works: `curl http://localhost:3000/audit-monitoring`
- [ ] Apache proxy test works: `curl http://localhost/audit-monitoring`
- [ ] Browser access works: `http://[server-ip]/audit-monitoring/`
- [ ] Login page displays correctly
- [ ] Static assets (CSS, JS) load properly
- [ ] Images load correctly

### Test Database

- [ ] Database connection successful
- [ ] Can create test user
- [ ] Can login with test user
- [ ] All CRUD operations work

### Test Features

- [ ] User authentication works
- [ ] Dashboard loads
- [ ] File uploads work
- [ ] Email notifications work (check spam folder)
- [ ] Cron jobs scheduled: `pm2 logs audit-cron`

---

## Post-Deployment Checklist

### Security

- [ ] Changed default admin password
- [ ] Strong database user password set
- [ ] JWT_SECRET is secure (min 32 characters, random)
- [ ] MySQL secure installation run: `sudo mysql_secure_installation`
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] File permissions are restrictive (755 for app, 755 for uploads)
- [ ] `.env` file is not web-accessible
- [ ] Consider SSL/HTTPS setup
- [ ] Security audit run: `npm audit`

### Backup Strategy

- [ ] Database backup script created
- [ ] Automated backup scheduled (cron job)
- [ ] Backup location configured
- [ ] Uploads directory backup configured
- [ ] Backup restoration tested

### Monitoring

- [ ] PM2 monitoring setup
- [ ] Apache logs location known: `/var/log/apache2/`
- [ ] Application logs accessible: `pm2 logs`
- [ ] Disk space monitoring configured
- [ ] Server resources monitored (CPU, RAM, Disk)

### Documentation

- [ ] Deployment details documented
- [ ] Admin credentials stored securely
- [ ] Database credentials stored securely
- [ ] Server access credentials documented
- [ ] Emergency contacts listed

---

## Common Issues & Solutions

### Issue: 502 Bad Gateway

**Check:**

- [ ] PM2 process is running: `pm2 status`
- [ ] Correct port in Apache config (3000)
- [ ] Logs for errors: `pm2 logs audit-monitoring`

**Fix:**

```bash
pm2 restart audit-monitoring
pm2 logs audit-monitoring
```

### Issue: Static files not loading (404)

**Check:**

- [ ] BASE_PATH matches folder name
- [ ] Application rebuilt after config change
- [ ] Apache proxy includes `/_next` location

**Fix:**

```bash
# Verify .env
grep BASE_PATH .env

# Rebuild
npm run build
pm2 restart audit-monitoring
```

### Issue: Database connection failed

**Check:**

- [ ] MySQL service running: `sudo systemctl status mysql`
- [ ] Database exists: `mysql -e "SHOW DATABASES;"`
- [ ] Credentials correct in .env
- [ ] User has permissions

**Fix:**

```bash
# Test connection
mysql -u audit_user -p audit_monitoring -e "SELECT 1;"

# Grant permissions if needed
mysql -u root -p
GRANT ALL PRIVILEGES ON audit_monitoring.* TO 'audit_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: File uploads failing

**Check:**

- [ ] Upload directory exists: `ls -la public/uploads`
- [ ] Correct permissions: `755` on directory
- [ ] Correct ownership: `www-data:www-data`
- [ ] Disk space available: `df -h`

**Fix:**

```bash
mkdir -p public/uploads/findings
sudo chown -R www-data:www-data public/uploads
sudo chmod -R 755 public/uploads
```

---

## Rollback Plan

If deployment fails and you need to rollback:

1. **Stop Application:**

   ```bash
   pm2 stop audit-monitoring
   pm2 stop audit-cron
   ```

2. **Restore Previous Version:**

   ```bash
   # If using git
   cd /var/www/html/audit-monitoring
   git checkout previous-stable-tag
   npm install
   npm run build
   ```

3. **Restore Database:**

   ```bash
   mysql -u audit_user -p audit_monitoring < backup_YYYYMMDD.sql
   ```

4. **Restart Application:**
   ```bash
   pm2 restart audit-monitoring
   pm2 restart audit-cron
   ```

---

## Maintenance Schedule

### Daily

- [ ] Check PM2 status: `pm2 status`
- [ ] Review logs for errors: `pm2 logs --lines 100`
- [ ] Check disk space: `df -h`

### Weekly

- [ ] Database backup verification
- [ ] Check application updates: `npm outdated`
- [ ] Review Apache logs: `sudo tail -100 /var/log/apache2/error.log`
- [ ] Security audit: `npm audit`

### Monthly

- [ ] Update dependencies (if needed)
- [ ] Test backup restoration
- [ ] Review server resources (CPU, RAM, Disk trends)
- [ ] Certificate renewal (if using SSL)

---

## Quick Commands Reference

```bash
# PM2 Management
pm2 status                          # Check all processes
pm2 logs audit-monitoring           # View application logs
pm2 restart audit-monitoring        # Restart application
pm2 stop audit-monitoring           # Stop application
pm2 start audit-monitoring          # Start application
pm2 monit                          # Monitor resources

# Apache Management
sudo systemctl status apache2       # Check Apache status
sudo systemctl restart apache2      # Restart Apache
sudo apache2ctl configtest         # Test configuration
sudo tail -f /var/log/apache2/error.log  # Watch error logs

# Database
mysql -u audit_user -p audit_monitoring  # Connect to database
mysqldump -u audit_user -p audit_monitoring > backup.sql  # Backup
mysql -u audit_user -p audit_monitoring < backup.sql      # Restore

# Application Updates
cd /var/www/html/audit-monitoring
git pull                           # Get latest code
npm install                        # Install dependencies
npm run build                      # Build application
pm2 restart audit-monitoring       # Restart

# System
df -h                              # Check disk space
free -m                            # Check memory
top                                # Check CPU usage
```

---

## Contact Information

**System Administrator:**

- Name: ******\_\_\_******
- Email: ******\_\_\_******
- Phone: ******\_\_\_******

**Database Administrator:**

- Name: ******\_\_\_******
- Email: ******\_\_\_******

**Emergency Contacts:**

- ***
- ***

---

## Deployment Date

- **Deployed By:** ******\_\_\_******
- **Date:** ******\_\_\_******
- **Version:** ******\_\_\_******
- **Notes:** ******\_\_\_******

---

**Status:** [ ] Ready for Production

**Approved By:** ******\_\_\_******

**Date:** ******\_\_\_******
