pm# Quick Start - Apache Production Deployment

This is a condensed guide for quick deployment. For detailed instructions, see [APACHE_DEPLOYMENT_GUIDE.md](APACHE_DEPLOYMENT_GUIDE.md).

## Prerequisites

- Node.js 18+, MySQL 8.0+, Apache 2.4+, PM2
- Apache modules enabled: `proxy`, `proxy_http`, `rewrite`, `headers`

## Quick Deployment (5 Steps)

### 1. Setup Directory & Files

```bash
cd /var/www/html/audit-monitoring
# Copy your application files here
```

### 2. Configure Environment

```bash
# Copy and edit .env file
cp .env.production.example .env
nano .env

# Update these values:
# - DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - APP_URL=http://YOUR_SERVER_IP/audit-monitoring
# - BASE_PATH=/audit-monitoring
# - EMAIL settings
```

### 3. Setup Database

```bash
# Create database
mysql -u root -p <<EOF
CREATE DATABASE audit_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'audit_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON audit_monitoring.* TO 'audit_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import schema
mysql -u audit_user -p audit_monitoring < database/schema.sql
```

### 4. Build & Deploy

```bash
# Run the deployment script
chmod +x deploy.sh
./deploy.sh

# Or manually:
npm install
npm run build
pm2 start npm --name "audit-monitoring" -- start
pm2 save
```

### 5. Configure Apache

```bash
sudo nano /etc/apache2/sites-available/000-default.conf
```

Add inside `<VirtualHost *:80>`:

```apache
<Location /audit-monitoring>
    ProxyPreserveHost On
    ProxyPass http://localhost:3000/audit-monitoring
    ProxyPassReverse http://localhost:3000/audit-monitoring
</Location>
```

Reload Apache:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## Access Application

Visit: `http://YOUR_SERVER_IP/audit-monitoring/`

## Verify Deployment

```bash
pm2 status                          # Check if running
pm2 logs audit-monitoring           # View logs
curl http://localhost:3000/audit-monitoring  # Test directly
curl http://localhost/audit-monitoring       # Test through Apache
```

## troubleshooting

**502 Bad Gateway?**

```bash
pm2 restart audit-monitoring
pm2 logs audit-monitoring
```

**Static files not loading?**

```bash
# Check BASE_PATH in .env matches your folder name
grep BASE_PATH .env
npm run build
pm2 restart audit-monitoring
```

**Database connection error?**

```bash
# Test database
mysql -u audit_user -p audit_monitoring -e "SELECT 1;"
```

## Common Commands

```bash
pm2 logs audit-monitoring           # View logs
pm2 restart audit-monitoring        # Restart app
pm2 stop audit-monitoring           # Stop app
pm2 status                          # Check status
sudo systemctl reload apache2       # Reload Apache
```

## Next Steps

1. ✓ Application deployed
2. Change default admin password
3. Setup SSL certificate: `sudo certbot --apache`
4. Configure automated backups
5. Review security settings

## Full Documentation

- **Complete Guide:** [APACHE_DEPLOYMENT_GUIDE.md](APACHE_DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
