# Security Configuration Guide

## Overview
This project now uses environment variables to securely store API keys and sensitive configuration data.

## Setup Instructions

### 1. Environment Variables
All sensitive data is stored in the `.env` file, which is **NOT** committed to git.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`:
   - API keys
   - Firebase credentials
   - API endpoints

### 2. File Structure
```
.env                  # Your actual secrets (gitignored)
.env.example          # Template file (committed to git)
utils/api.ts          # Uses environment variables
utils/firebase-config.ts  # Uses environment variables
```

### 3. Important Security Notes

✅ **DO:**
- Keep `.env` file local only
- Never commit `.env` to version control
- Use `.env.example` as a template for team members
- Rotate API keys regularly
- Use different keys for development and production

❌ **DON'T:**
- Commit real API keys to git
- Share `.env` file publicly
- Hardcode secrets in source code
- Use production keys in development

### 4. Environment Variables Used

#### API Configuration
- `EXPO_PUBLIC_API_BASE_URL` - Main API endpoint
- `EXPO_PUBLIC_API_KEY` - API authentication key
- `EXPO_PUBLIC_SEARCH_API_BASE` - Search service endpoint

#### Firebase Configuration
- `EXPO_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL` - Realtime database URL
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Storage bucket
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` - Analytics measurement ID

### 5. How It Works

The app loads configuration from environment variables at build time:

```typescript
// Example from api.ts
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';
```

Expo automatically loads variables prefixed with `EXPO_PUBLIC_` from your `.env` file.

### 6. Verification

After setup, check the console for warnings:
- ⚠️ If you see "API_KEY is not set" - check your `.env` file
- ⚠️ If you see "Firebase configuration is incomplete" - verify Firebase variables

### 7. Production Deployment

For production builds:
1. Set environment variables in your CI/CD platform
2. Use different keys than development
3. Enable Firebase security rules
4. Implement rate limiting on API endpoints

### 8. Team Collaboration

When sharing this project:
1. Only share `.env.example` (template)
2. Each team member creates their own `.env`
3. Never commit or share actual `.env` files
4. Document any new environment variables in `.env.example`

## Migration Completed ✅

- ✅ API keys moved to environment variables
- ✅ Firebase config secured
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` created as template
- ✅ Validation warnings added
- ✅ Documentation created

## Need Help?

If you see any warnings or errors, verify that:
1. `.env` file exists in the project root
2. All required variables are set
3. No syntax errors in `.env` file
4. Restart the Expo development server after changes
