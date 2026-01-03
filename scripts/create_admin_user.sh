#!/bin/bash

# Script to create an admin user for JengaHacks admin portal
# This script helps you create a Supabase user and grant them admin role
#
# Prerequisites:
# - Supabase CLI installed and authenticated
# - Project reference set (or passed as argument)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project ref from argument or environment
PROJECT_REF="${1:-${SUPABASE_PROJECT_REF}}"

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error:${NC} Project reference required"
    echo "Usage: $0 <project-ref>"
    echo "   or: SUPABASE_PROJECT_REF=<project-ref> $0"
    exit 1
fi

echo -e "${GREEN}JengaHacks Admin User Setup${NC}"
echo "=================================="
echo ""

# Prompt for admin email
read -p "Enter admin email address: " ADMIN_EMAIL

if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}Error:${NC} Email address is required"
    exit 1
fi

# Prompt for password
read -sp "Enter password for admin user: " ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}Error:${NC} Password is required"
    exit 1
fi

echo ""
echo -e "${YELLOW}Creating user in Supabase Auth...${NC}"

# Create user via Supabase Management API
# Note: This requires the Supabase Management API key
# For now, we'll provide instructions to do it manually

echo ""
echo -e "${YELLOW}Manual Steps Required:${NC}"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "2. Navigate to Authentication → Users"
echo "3. Click 'Add User' → 'Create new user'"
echo "4. Enter email: ${ADMIN_EMAIL}"
echo "5. Enter password: [your password]"
echo "6. Click 'Create User'"
echo ""
echo "After creating the user, run this SQL in the Supabase SQL Editor:"
echo ""
echo -e "${GREEN}SQL to run:${NC}"
cat <<EOF
DO \$\$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := '${ADMIN_EMAIL}';
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create the user in Supabase Auth first.', admin_email;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role granted to user: % (ID: %)', admin_email, admin_user_id;
END \$\$;
EOF

echo ""
echo -e "${GREEN}Alternative: Use the SQL script directly${NC}"
echo "Run: scripts/create_admin_user.sql in Supabase SQL Editor"
echo "   (Remember to change the email address in the script)"

