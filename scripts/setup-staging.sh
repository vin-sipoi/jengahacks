#!/bin/bash
# Staging environment setup script
# Helps automate the initial staging setup process

set -e

echo "🚀 JengaHacks Hub - Staging Environment Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisite() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗${NC} $1 not found. Please install it first."
        return 1
    else
        echo -e "${GREEN}✓${NC} $1 found"
        return 0
    fi
}

echo "Checking prerequisites..."
check_prerequisite "node" || exit 1
check_prerequisite "npm" || exit 1
check_prerequisite "supabase" || echo -e "${YELLOW}⚠${NC} Supabase CLI not found. Install with: npm install -g supabase"
echo ""

# Step 1: Create staging environment file
echo "Step 1: Creating staging environment file..."
if [ -f ".env.staging" ]; then
    echo -e "${YELLOW}⚠${NC} .env.staging already exists. Skipping..."
else
    if [ -f ".env.staging.example" ]; then
        cp .env.staging.example .env.staging
        echo -e "${GREEN}✓${NC} Created .env.staging from example"
        echo -e "${YELLOW}⚠${NC} Please edit .env.staging with your staging values"
    else
        echo -e "${RED}✗${NC} .env.staging.example not found"
    fi
fi
echo ""

# Step 2: Supabase project setup
echo "Step 2: Supabase Project Setup"
echo "Please create a new Supabase project for staging:"
echo "1. Go to https://app.supabase.com"
echo "2. Click 'New Project'"
echo "3. Name it 'jengahacks-staging'"
echo "4. Choose the same region as production"
echo ""
read -p "Enter your staging Supabase project reference: " STAGING_PROJECT_REF

if [ -z "$STAGING_PROJECT_REF" ]; then
    echo -e "${RED}✗${NC} Project reference is required"
    exit 1
fi

echo ""
echo "Linking to staging project..."
if supabase link --project-ref "$STAGING_PROJECT_REF" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Linked to staging project"
else
    echo -e "${YELLOW}⚠${NC} Could not link automatically. Please run manually:"
    echo "   supabase link --project-ref $STAGING_PROJECT_REF"
fi
echo ""

# Step 3: Apply migrations
echo "Step 3: Applying database migrations..."
read -p "Apply migrations to staging database? (y/n): " APPLY_MIGRATIONS

if [ "$APPLY_MIGRATIONS" = "y" ] || [ "$APPLY_MIGRATIONS" = "Y" ]; then
    if supabase db push --project-ref "$STAGING_PROJECT_REF"; then
        echo -e "${GREEN}✓${NC} Migrations applied successfully"
    else
        echo -e "${RED}✗${NC} Migration failed. Please check the error above"
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipping migrations. Run manually with:"
    echo "   supabase db push --project-ref $STAGING_PROJECT_REF"
fi
echo ""

# Step 4: Deploy Edge Functions
echo "Step 4: Deploying Edge Functions..."
read -p "Deploy Edge Functions to staging? (y/n): " DEPLOY_FUNCTIONS

if [ "$DEPLOY_FUNCTIONS" = "y" ] || [ "$DEPLOY_FUNCTIONS" = "Y" ]; then
    echo "Deploying register-with-ip..."
    supabase functions deploy register-with-ip --project-ref "$STAGING_PROJECT_REF" || echo -e "${YELLOW}⚠${NC} Failed to deploy register-with-ip"
    
    echo "Deploying verify-recaptcha..."
    supabase functions deploy verify-recaptcha --project-ref "$STAGING_PROJECT_REF" || echo -e "${YELLOW}⚠${NC} Failed to deploy verify-recaptcha"
    
    echo "Deploying get-resume-url..."
    supabase functions deploy get-resume-url --project-ref "$STAGING_PROJECT_REF" || echo -e "${YELLOW}⚠${NC} Failed to deploy get-resume-url"
    
    echo -e "${GREEN}✓${NC} Edge Functions deployment completed"
else
    echo -e "${YELLOW}⚠${NC} Skipping Edge Functions deployment. Deploy manually with:"
    echo "   supabase functions deploy <function-name> --project-ref $STAGING_PROJECT_REF"
fi
echo ""

# Step 5: Set Edge Function secrets
echo "Step 5: Setting Edge Function secrets..."
read -p "Set Edge Function secrets? (y/n): " SET_SECRETS

if [ "$SET_SECRETS" = "y" ] || [ "$SET_SECRETS" = "Y" ]; then
    read -p "Enter reCAPTCHA secret key (or press Enter to use test key): " RECAPTCHA_SECRET
    RECAPTCHA_SECRET=${RECAPTCHA_SECRET:-6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe}
    
    read -sp "Enter admin password: " ADMIN_PASSWORD
    echo ""
    
    supabase secrets set RECAPTCHA_SECRET_KEY="$RECAPTCHA_SECRET" --project-ref "$STAGING_PROJECT_REF" || echo -e "${YELLOW}⚠${NC} Failed to set RECAPTCHA_SECRET_KEY"
    supabase secrets set ADMIN_PASSWORD="$ADMIN_PASSWORD" --project-ref "$STAGING_PROJECT_REF" || echo -e "${YELLOW}⚠${NC} Failed to set ADMIN_PASSWORD"
    
    echo -e "${GREEN}✓${NC} Secrets set"
else
    echo -e "${YELLOW}⚠${NC} Skipping secrets. Set manually with:"
    echo "   supabase secrets set RECAPTCHA_SECRET_KEY=<key> --project-ref $STAGING_PROJECT_REF"
    echo "   supabase secrets set ADMIN_PASSWORD=<password> --project-ref $STAGING_PROJECT_REF"
fi
echo ""

# Step 6: GitHub Secrets reminder
echo "Step 6: GitHub Secrets Setup"
echo "Don't forget to set the following GitHub Secrets for CI/CD:"
echo ""
echo "Required:"
echo "  - STAGING_SUPABASE_URL"
echo "  - STAGING_SUPABASE_ANON_KEY"
echo "  - STAGING_SUPABASE_PROJECT_REF"
echo "  - STAGING_RECAPTCHA_SITE_KEY"
echo "  - STAGING_RECAPTCHA_SECRET_KEY"
echo ""
echo "Optional:"
echo "  - STAGING_SENTRY_DSN"
echo "  - STAGING_GA_MEASUREMENT_ID"
echo "  - STAGING_ADMIN_PASSWORD"
echo "  - VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_STAGING_PROJECT_ID"
echo "  - NETLIFY_AUTH_TOKEN, NETLIFY_STAGING_SITE_ID"
echo ""
echo "Go to: Repository Settings → Secrets and variables → Actions"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}Setup Summary${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Edit .env.staging with your staging values"
echo "2. Set up GitHub Secrets (see above)"
echo "3. Configure hosting platform (Vercel/Netlify)"
echo "4. Push to 'develop' branch to trigger staging deployment"
echo ""
echo "Documentation:"
echo "  - See STAGING_SETUP.md for detailed instructions"
echo "  - See DEPLOYMENT.md for production deployment"
echo ""
echo -e "${GREEN}✓${NC} Staging setup script completed!"

