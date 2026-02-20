# Apache Server Deployment - Overview

This directory contains everything you need to deploy the Audit Monitoring System to your Apache production server.

## 📚 Deployment Resources

### Main Deployment Guides

1. **[APACHE_DEPLOYMENT_GUIDE.md](APACHE_DEPLOYMENT_GUIDE.md)** ⭐
   - **Complete step-by-step deployment guide**
   - Detailed instructions for each step
   - Troubleshooting section
   - Security recommendations
   - Maintenance procedures
   - **Start here for your first deployment**

2. **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** 🚀
   - Quick reference for experienced users
   - 5-step condensed deployment process
   - Essential commands only
   - For repeat deployments

3. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** ✅
   - Printable checklist format
   - Verify each step completed
   - Pre-deployment requirements
   - Post-deployment verification
   - Maintenance schedule

### Configuration Files

4. **[.env.production.example](.env.production.example)**
   - Production environment template
   - Copy to `.env` and customize
   - All required environment variables
   - Comments explaining each setting

5. **[apache-config.conf](apache-config.conf)**
   - Ready-to-use Apache configuration
   - Copy/paste into your VirtualHost
   - Includes proxy settings
   - WebSocket support included

6. **[ecosystem.config.js](ecosystem.config.js)**
   - PM2 process manager configuration
   - Already configured for production
   - Handles both app and cron job

### Helper Scripts

7. **[deploy.sh](deploy.sh)**
   - Automated deployment script
   - Checks prerequisites
   - Builds and deploys application
   - Verifies successful deployment
   - Use: `chmod +x deploy.sh && ./deploy.sh`

## 🎯 Quick Start (Choose Your Path)

### Path 1: First Time Deployment (Recommended)

```bash
# 1. Read the complete guide
cat APACHE_DEPLOYMENT_GUIDE.md

# 2. Use the checklist
cat DEPLOYMENT_CHECKLIST.md

# 3. Follow each step carefully
```

### Path 2: Experienced Users

```bash
# 1. Quick deploy guide
cat QUICK_DEPLOY.md

# 2. Run deployment script
chmod +x deploy.sh
./deploy.sh

# 3. Configure Apache
sudo nano /etc/apache2/sites-available/000-default.conf
# Copy content from apache-config.conf
```

### Path 3: Automated Deployment

```bash
# 1. Setup environment
cp .env.production.example .env
nano .env  # Edit configuration

# 2. Run deployment script
./deploy.sh

# 3. Configure Apache from apache-config.conf
# 4. Done!
```

## 📋 Deployment Overview

Your deployment will result in:

```
Architecture:
┌─────────────────────────────────────────┐
│  User Browser                            │
└─────────────────┬───────────────────────┘
                  │
                  │ http://server-ip/audit-monitoring/
                  ▼
┌─────────────────────────────────────────┐
│  Apache Server (Port 80)                │
│  - Handles incoming HTTP requests       │
│  - Serves other apps from /var/www/html│
│  - Reverse proxy for audit-monitoring   │
└─────────────────┬───────────────────────┘
                  │
                  │ Proxy to localhost:3000
                  ▼
┌─────────────────────────────────────────┐
│  Next.js Application (Port 3000)        │
│  - Managed by PM2                       │
│  - Runs as Node.js server               │
│  - Handles API routes & rendering       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  MySQL Database                          │
│  - audit_monitoring database            │
│  - Stores all application data          │
└─────────────────────────────────────────┘
```

## 🔧 Configuration Checklist

Before deployment, prepare:

- [ ] Server IP address
- [ ] Subdirectory name (e.g., `audit-monitoring`)
- [ ] MySQL root password
- [ ] New database user credentials
- [ ] Email account for notifications (Gmail with App Password)
- [ ] JWT secret (generate with: `openssl rand -base64 32`)

## 📁 File Structure After Deployment

```
/var/www/html/audit-monitoring/
├── .env                    # Your production config (DO NOT COMMIT)
├── .next/                  # Built application
├── node_modules/           # Dependencies
├── public/
│   └── uploads/           # User uploaded files
├── src/                   # Application source code
├── database/              # Database schema & migrations
├── package.json
└── ecosystem.config.js    # PM2 configuration
```

## 🌐 Accessing Your Application

After deployment, access via:

- **Internal:** `http://localhost:3000/audit-monitoring`
- **External:** `http://YOUR_SERVER_IP/audit-monitoring/`

## 🛠️ Common Commands

```bash
# Application Management
pm2 status                          # Check status
pm2 logs audit-monitoring           # View logs
pm2 restart audit-monitoring        # Restart app
pm2 stop audit-monitoring           # Stop app
pm2 start audit-monitoring          # Start app

# Apache Management
sudo systemctl status apache2       # Check status
sudo systemctl restart apache2      # Restart Apache
sudo apache2ctl configtest         # Test config
sudo tail -f /var/log/apache2/error.log  # View logs

# Database Management
mysql -u audit_user -p audit_monitoring  # Connect
mysqldump -u audit_user -p audit_monitoring > backup.sql  # Backup

# Updates
cd /var/www/html/audit-monitoring
git pull
npm install
npm run build
pm2 restart audit-monitoring
```

## ⚠️ Important Notes

1. **Port 3000:** Must NOT be exposed externally (only Apache proxy uses it)
2. **BASE_PATH:** Must match your Apache Location path
3. **Uploads Directory:** Needs write permissions for www-data user
4. **Database:** Create dedicated user (don't use root in production)
5. **SSL:** Highly recommended for production (use certbot)
6. **Backups:** Setup automated database and uploads backups

## 🔒 Security Checklist

After deployment:

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Secure JWT_SECRET (min 32 random characters)
- [ ] Configure firewall (allow only 22, 80, 443)
- [ ] Set restrictive file permissions
- [ ] Consider SSL certificate setup
- [ ] Run security audit: `npm audit`
- [ ] Regular backups configured

## 📞 Need Help?

### Troubleshooting Resources

1. Check logs: `pm2 logs audit-monitoring`
2. Check Apache logs: `sudo tail -f /var/log/apache2/error.log`
3. Verify configuration: Review `.env` and Apache config
4. See **Troubleshooting** section in APACHE_DEPLOYMENT_GUIDE.md

### Common Issues

- **502 Bad Gateway:** App not running - `pm2 restart audit-monitoring`
- **404 on static files:** Wrong BASE_PATH - rebuild app
- **Database errors:** Check credentials in `.env`
- **Upload errors:** Check directory permissions

## 📊 Deployment Timeline

Estimated time for complete deployment:

- **Prerequisites setup:** 15-30 minutes
- **Application deployment:** 15-20 minutes
- **Configuration & testing:** 10-15 minutes
- **Total:** ~45-60 minutes

## 🎯 Post-Deployment

After successful deployment:

1. ✅ Test all features (login, CRUD operations, uploads)
2. ✅ Change default passwords
3. ✅ Setup SSL certificate (recommended)
4. ✅ Configure automated backups
5. ✅ Setup monitoring/alerts
6. ✅ Document deployment details
7. ✅ Create rollback plan

## 📖 Additional Resources

- **Backend API:** See [API_ENDPOINTS.md](API_ENDPOINTS.md)
- **Frontend Details:** See [FRONTEND.md](FRONTEND.md)
- **General Setup:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Quick Start:** See [QUICKSTART.md](QUICKSTART.md)

## ✨ Success Indicators

Your deployment is successful when:

- ✅ `pm2 status` shows app as "online"
- ✅ No errors in `pm2 logs`
- ✅ Browser shows login page at `http://server-ip/audit-monitoring/`
- ✅ Static assets (CSS, JS, images) load properly
- ✅ Can login and access dashboard
- ✅ All CRUD operations work
- ✅ File uploads work

---

**Ready to deploy?** Start with [APACHE_DEPLOYMENT_GUIDE.md](APACHE_DEPLOYMENT_GUIDE.md)

**Questions?** Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed steps.

**Quick deployment?** Use [QUICK_DEPLOY.md](QUICK_DEPLOY.md) and run `./deploy.sh`
