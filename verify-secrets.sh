#!/bin/bash

# Security Verification Script
# This script checks if all secrets have been properly secured

echo "🔐 Security Verification Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check 1: .env file exists
echo "📋 Check 1: Verifying .env file..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 2: .env is in .gitignore
echo "📋 Check 2: Verifying .env is in .gitignore..."
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ .env is NOT in .gitignore${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check 3: Check for hardcoded secrets in code
echo "📋 Check 3: Scanning for hardcoded secrets..."
SECRET_PATTERNS=(
    "mongodb\+srv://[^@]+:[^@]+@"
    "AIzaSy[a-zA-Z0-9_-]{33}"
    "sk-[a-zA-Z0-9]{48}"
    "92ae2ffd0bd050a21d59be1766cdf7411666b36850fa1bc5057fa314f1471dc3"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    # Exclude .env files, node_modules, documentation, and this script from search
    MATCHES=$(grep -r -E "$pattern" . \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=venv \
        --exclude-dir=env \
        --exclude="*.env" \
        --exclude="*.env.*" \
        --exclude="verify-secrets.sh" \
        --exclude="SECURITY_AUDIT.md" \
        --exclude="SETUP.md" \
        --exclude="README.md" \
        --exclude="*.md" \
        2>/dev/null || true)
    
    if [ ! -z "$MATCHES" ]; then
        echo -e "${RED}❌ Found potential secret:${NC}"
        echo "$MATCHES"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No hardcoded secrets found in source code${NC}"
fi
echo ""

# Check 4: Verify required environment variables in .env
echo "📋 Check 4: Checking required environment variables in .env..."
REQUIRED_VARS=(
    "MONGODB_URI"
    "API_KEY"
    "GOOGLE_API_KEY"
    "GOOGLE_SEARCH_ENGINE_ID"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env 2>/dev/null; then
        # Check if it has a value (not empty or just a placeholder)
        VALUE=$(grep "^$var=" .env | cut -d'=' -f2-)
        if [ -z "$VALUE" ] || [[ "$VALUE" =~ ^your_.*_here$ ]]; then
            echo -e "${YELLOW}⚠️  $var is set but has placeholder value${NC}"
        else
            echo -e "${GREEN}✅ $var is configured${NC}"
        fi
    else
        echo -e "${RED}❌ $var is missing from .env${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + MISSING_VARS))
fi
echo ""

# Check 5: Verify .env.example exists and has no real secrets
echo "📋 Check 5: Verifying .env.example..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
    
    # Check if .env.example has real values (it shouldn't)
    if grep -E "mongodb\+srv://olive:|AIzaSyDsluZhn|92ae2ffd0bd050a" .env.example >/dev/null 2>&1; then
        echo -e "${RED}❌ .env.example contains real secrets!${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ .env.example contains only placeholders${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.example not found (recommended to have one)${NC}"
fi
echo ""

# Check 6: Verify dependencies are installed
echo "📋 Check 6: Checking dependencies..."

# Check Node.js dependencies
if [ -f "osint-investigation-tool/package.json" ]; then
    if grep -q "dotenv" osint-investigation-tool/package.json; then
        echo -e "${GREEN}✅ dotenv is in Node.js dependencies${NC}"
    else
        echo -e "${YELLOW}⚠️  dotenv not found in Node.js dependencies${NC}"
    fi
fi

# Check Python dependencies
if [ -f "Face_Recognition/requirements.txt" ]; then
    if grep -q "python-dotenv" Face_Recognition/requirements.txt; then
        echo -e "${GREEN}✅ python-dotenv is in Python requirements${NC}"
    else
        echo -e "${RED}❌ python-dotenv not in Python requirements${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi
echo ""

# Check 7: Git status check
echo "📋 Check 7: Checking git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Check if .env is staged
    if git diff --cached --name-only | grep -q "\.env$"; then
        echo -e "${RED}❌ WARNING: .env file is staged for commit!${NC}"
        echo "   Run: git reset HEAD .env"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ .env is not staged for commit${NC}"
    fi
    
    # Check if .env is tracked
    if git ls-files --error-unmatch .env >/dev/null 2>&1; then
        echo -e "${RED}❌ WARNING: .env file is tracked by git!${NC}"
        echo "   Run: git rm --cached .env"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ .env is not tracked by git${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
fi
echo ""

# Final Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo -e "${GREEN}🚀 Safe to push to GitHub${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s)${NC}"
    echo -e "${RED}⚠️  DO NOT push to GitHub until issues are resolved${NC}"
    exit 1
fi
