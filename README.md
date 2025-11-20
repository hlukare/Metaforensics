# intel-Tracker

OSINT Investigation Tool
A comprehensive Open Source Intelligence (OSINT) tool for gathering personal information from multiple sources including social media, public records, government databases, and digital footprints.

## ⚠️ Security Notice

**IMPORTANT:** Before pushing to GitHub:

1. ✅ All secrets are now stored in `.env` file (which is gitignored)
2. ✅ Never commit the `.env` file - use `.env.example` as a template
3. ✅ All API keys and credentials have been removed from source code
4. ⚠️ Review your commit history to ensure no secrets were committed previously
5. 📖 See `SETUP.md` for complete environment setup instructions

## Features
Multi-source data collection from social media, public records, and databases

Advanced search by name, location, email, phone, and domain

Report management with main_id and sub_id tracking

JSON database integration for Indian records (Voter, PAN, Aadhar, Criminal)

Comprehensive OSINT capabilities with Google Search, social media scraping, and more

Compliance with privacy regulations (GDPR, CCPA, PDPA)

Installation
bash
git clone <repository-url>
cd osint-investigation-tool
npm install
cp .env.example .env
mkdir -p storage/reports data logs
npm run dev
API Usage
Authentication
All endpoints require API key authentication:

bash
x-api-key: your_api_key_here
Endpoints
bash
# Search by name and location
GET /api/search?name=John%20Doe&location=New%20York

# Search with JSON body
POST /api/search
Content-Type: application/json
{"name": "John Doe", "location": "New York"}

# Advanced search
POST /api/search/advanced
Content-Type: application/json
{"name": "John Doe", "email": "john@example.com"}

# List all reports
GET /api/reports

# Get specific report
GET /api/reports/report_123456789

# Delete report
DELETE /api/reports/report_123456789

# Health check
GET /api/health
Example Request
bash
curl -X GET "http://localhost:3000/api/search?name=John%20Doe&location=New%20York" \
  -H "x-api-key: your_api_key_here"
Configuration
Update the .env file with your API keys:

env
GOOGLE_API_KEY=your_google_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
API_KEY=your_secure_api_key
MONGODB_URI=mongodb://localhost:27017/osint-tool
PORT=3000
Data Sources
Google Custom Search API

Social Media Platforms (Facebook, LinkedIn, Twitter, Instagram)

Email & Phone Intelligence

Indian Databases (Voter, PAN, Aadhar, Criminal records)

Public Records

Breach Data

Domain Intelligence

Project Structure
text
osint-investigation-tool/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── models/         # Database models
├── services/       # OSINT services
├── routes/         # API routes
├── middleware/     # Custom middleware
├── utils/          # Utility functions
├── data/           # JSON databases
├── storage/        # Report storage
├── app.js          # Main application
└── package.json    # Dependencies
