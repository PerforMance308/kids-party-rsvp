#!/bin/bash

# Kid Party RSVP Deployment Script
# This script helps prepare and deploy the application to production

set -e  # Exit on any error

echo "🎉 Kid Party RSVP Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands exist
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    print_success "All dependencies found!"
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed!"
}

# Run tests and linting
run_tests() {
    print_status "Running tests and linting..."
    
    # Run linting
    if npm run lint; then
        print_success "Linting passed!"
    else
        print_error "Linting failed. Please fix the issues before deploying."
        exit 1
    fi
    
    # Check TypeScript
    if npm run build; then
        print_success "TypeScript compilation passed!"
    else
        print_error "TypeScript compilation failed. Please fix the issues before deploying."
        exit 1
    fi
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set. Skipping database setup."
        print_warning "Make sure to set up your Neon database and run migrations manually."
        return
    fi
    
    print_status "Running database migrations..."
    npx prisma db push
    print_success "Database setup completed!"
}

# Generate production build
build_production() {
    print_status "Building production bundle..."
    
    # Copy production config if it exists
    if [ -f "next.config.production.js" ]; then
        cp next.config.production.js next.config.js
        print_status "Using production Next.js configuration"
    fi
    
    # Build the application
    npm run build
    print_success "Production build completed!"
}

# Deployment instructions
show_deployment_instructions() {
    echo ""
    echo "🚀 Deployment Instructions"
    echo "========================="
    echo ""
    echo "Your application is ready for deployment! Choose one of the following options:"
    echo ""
    echo "Option 1: Cloudflare Pages (Recommended)"
    echo "----------------------------------------"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Navigate to Pages > Create a project"
    echo "3. Connect your GitHub repository"
    echo "4. Build settings:"
    echo "   - Build command: npm run build"
    echo "   - Output directory: .next"
    echo "   - Root directory: /"
    echo "5. Add environment variables (see .env.production template)"
    echo "6. Deploy!"
    echo ""
    echo "Option 2: Zeabur"
    echo "---------------"
    echo "1. Go to https://zeabur.com"
    echo "2. Create new project"
    echo "3. Connect GitHub repository"
    echo "4. Add environment variables"
    echo "5. Deploy!"
    echo ""
    echo "Option 3: Vercel"
    echo "---------------"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Run: vercel"
    echo "3. Follow the prompts"
    echo ""
    echo "📋 Pre-deployment Checklist:"
    echo "- [ ] Neon database created and configured"
    echo "- [ ] Environment variables set in hosting platform"
    echo "- [ ] Google OAuth client configured with production URLs"
    echo "- [ ] Gmail app password generated for SMTP"
    echo "- [ ] Hyperswitch account set up (if using payments)"
    echo "- [ ] Custom domain configured (optional)"
    echo ""
    echo "📖 For detailed instructions, see docs/deployment-guide.md"
}

# Environment check
check_environment() {
    print_status "Checking environment setup..."
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET" 
        "JWT_SECRET"
        "SMTP_USER"
        "SMTP_PASS"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "The following environment variables are not set:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Make sure to set these in your hosting platform."
    else
        print_success "All required environment variables are set!"
    fi
}

# Main deployment flow
main() {
    echo ""
    print_status "Starting deployment preparation..."
    echo ""
    
    check_dependencies
    install_deps
    run_tests
    setup_database
    build_production
    check_environment
    
    echo ""
    print_success "🎉 Deployment preparation completed successfully!"
    show_deployment_instructions
}

# Run main function
main "$@"