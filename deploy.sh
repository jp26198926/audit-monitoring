#!/bin/bash

# Audit Monitoring System - Production Deployment Script
# This script helps deploy the application to Apache server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="audit-monitoring"
APP_DIR="/var/www/html/audit-monitoring"
NODE_VERSION="18"
REQUIRED_PORT="3000"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Start deployment
clear
print_header "Audit Monitoring System - Production Deployment"

# Step 1: Check prerequisites
print_header "Step 1: Checking Prerequisites"

PREREQ_OK=true

# Check Node.js
if check_command "node"; then
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -ge "$NODE_VERSION" ]; then
        print_success "Node.js version: $(node -v)"
    else
        print_error "Node.js version must be $NODE_VERSION or higher"
        PREREQ_OK=false
    fi
else
    PREREQ_OK=false
fi

# Check npm
check_command "npm" || PREREQ_OK=false

# Check MySQL
check_command "mysql" || PREREQ_OK=false

# Check Apache
if systemctl is-active --quiet apache2 || systemctl is-active --quiet httpd; then
    print_success "Apache is running"
else
    print_error "Apache is not running"
    PREREQ_OK=false
fi

# Check PM2
check_command "pm2" || PREREQ_OK=false

if [ "$PREREQ_OK" = false ]; then
    print_error "Prerequisites not met. Please install missing components."
    exit 1
fi

print_success "All prerequisites met!"

# Step 2: Verify we're in the right directory
print_header "Step 2: Verifying Application Directory"

if [ -f "package.json" ] && grep -q "audit-monitoring-system" package.json; then
    print_success "Found application in current directory: $(pwd)"
else
    print_error "Not in the audit-monitoring directory"
    print_info "Please cd to the audit-monitoring directory and run this script again"
    exit 1
fi

# Step 3: Check environment file
print_header "Step 3: Checking Environment Configuration"

if [ -f ".env" ]; then
    print_success ".env file exists"
    
    # Verify critical variables
    if grep -q "DB_NAME=audit_monitoring" .env && \
       grep -q "NODE_ENV=production" .env && \
       grep -q "BASE_PATH=" .env; then
        print_success "Environment variables configured"
    else
        print_warning "Some environment variables may be missing"
        print_info "Please verify .env file against .env.production.example"
    fi
else
    print_error ".env file not found"
    print_info "Copy .env.production.example to .env and configure it"
    exit 1
fi

# Step 4: Install dependencies
print_header "Step 4: Installing Dependencies"

print_info "Running npm install..."
if npm install; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Build application
print_header "Step 5: Building Application"

print_info "Running npm run build..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output
if [ -d ".next" ]; then
    print_success ".next directory created"
else
    print_error ".next directory not found after build"
    exit 1
fi

# Step 6: Setup uploads directory
print_header "Step 6: Setting Up Uploads Directory"

mkdir -p public/uploads/findings
chmod -R 755 public/uploads
print_success "Uploads directory created with proper permissions"

# Try to set Apache ownership (might require sudo)
if sudo chown -R www-data:www-data public/uploads 2>/dev/null; then
    print_success "Uploads directory ownership set to www-data"
else
    print_warning "Could not set www-data ownership (you may need to run manually with sudo)"
fi

# Step 7: Database check
print_header "Step 7: Checking Database Connection"

DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)

print_info "Testing database connection..."
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$(grep DB_PASSWORD .env | cut -d '=' -f2)" -e "USE $DB_NAME; SELECT 1;" &> /dev/null; then
    print_success "Database connection successful"
else
    print_warning "Could not connect to database (you may need to configure it manually)"
fi

# Step 8: PM2 deployment
print_header "Step 8: Deploying with PM2"

# Check if already running
if pm2 list | grep -q "$APP_NAME"; then
    print_info "Application is already running, restarting..."
    pm2 restart $APP_NAME
    pm2 restart audit-cron 2>/dev/null || print_warning "Cron job not running"
else
    print_info "Starting application with PM2..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 start npm --name "audit-cron" -- run cron
fi

# Save PM2 configuration
pm2 save

print_success "Application deployed with PM2"

# Step 9: Verify deployment
print_header "Step 9: Verifying Deployment"

sleep 3  # Give the app a moment to start

# Check PM2 status
if pm2 list | grep -q "$APP_NAME.*online"; then
    print_success "Application is running"
else
    print_error "Application is not running properly"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# Test localhost connection
print_info "Testing application response..."
BASE_PATH=$(grep BASE_PATH .env | cut -d '=' -f2)
if [ -z "$BASE_PATH" ]; then
    TEST_URL="http://localhost:$REQUIRED_PORT"
else
    TEST_URL="http://localhost:$REQUIRED_PORT$BASE_PATH"
fi

if curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" | grep -q "200\|301\|302"; then
    print_success "Application is responding"
else
    print_warning "Application may not be responding correctly"
fi

# Step 10: Final summary
print_header "Deployment Summary"

echo -e "${GREEN}Deployment completed successfully!${NC}\n"

print_info "Application Status:"
pm2 list

echo -e "\n${BLUE}Access Information:${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "  Local URL:  ${GREEN}$TEST_URL${NC}"
echo -e "  Server URL: ${GREEN}http://$SERVER_IP$BASE_PATH${NC}"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "  View logs:      ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "  Restart:        ${YELLOW}pm2 restart $APP_NAME${NC}"
echo -e "  Stop:           ${YELLOW}pm2 stop $APP_NAME${NC}"
echo -e "  Status:         ${YELLOW}pm2 status${NC}"
echo -e "  Apache logs:    ${YELLOW}sudo tail -f /var/log/apache2/error.log${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "  1. Configure Apache reverse proxy (see APACHE_DEPLOYMENT_GUIDE.md)"
echo "  2. Test application in browser"
echo "  3. Change default admin password"
echo "  4. Configure SSL certificate (optional but recommended)"
echo "  5. Setup automated backups"

echo -e "\n${GREEN}Deployment script finished!${NC}\n"

# Show recent logs
print_info "Showing recent application logs..."
pm2 logs $APP_NAME --lines 10 --nostream
