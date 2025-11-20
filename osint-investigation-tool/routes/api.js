const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Apply rate limiting to all API routes
router.use(auth.rateLimit(100, 60000)); // 100 requests per minute per IP

// Apply request logging
router.use(auth.requestLogger);

// Search routes - Support both GET with query params and POST with JSON body
router.get('/search', auth.verifyApiKey, searchController.searchPerson);
router.post('/search', auth.verifyApiKey, searchController.searchPersonPost); // NEW: POST endpoint
router.post('/search/advanced', auth.verifyApiKey, searchController.advancedSearch);

// Overall/Complete report endpoint (formatted)
router.post('/overall', auth.verifyApiKey, searchController.searchPersonPost); // Same as search, returns formatted report
router.get('/overall', auth.verifyApiKey, searchController.searchPerson); // Same as search, returns formatted report

// Report routes
router.get('/reports', auth.verifyApiKey, reportController.listReports);
router.get('/reports/:main_id', auth.verifyApiKey, reportController.getReport);
router.delete('/reports/:main_id', auth.verifyApiKey, reportController.deleteReport);
router.get('/reports/:main_id/export/:format', auth.verifyApiKey, reportController.exportReport);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    endpoints: {
      '/api/search': {
        method: 'GET or POST',
        description: 'Search for a person by name and location',
        parameters: {
          name: 'Required. The name of the person to search for',
          location: 'Optional. The location to narrow down the search',
          main_id: 'Optional. Add to an existing report with this main_id'
        }
      },
      '/api/overall': {
        method: 'GET or POST',
        description: 'Get complete formatted OSINT report for a person (same as /search but with clean formatting)',
        parameters: {
          name: 'Required. The name of the person to search for',
          location: 'Optional. The location to narrow down the search',
          main_id: 'Optional. Add to an existing report with this main_id'
        }
      },
      '/api/search/advanced': {
        method: 'POST',
        description: 'Advanced search with multiple parameters',
        parameters: {
          name: 'Optional. The name of the person to search for',
          location: 'Optional. The location to narrow down the search',
          email: 'Optional. Email address to search for',
          phone: 'Optional. Phone number to search for',
          domain: 'Optional. Domain name to search for'
        }
      },
      '/api/reports': {
        method: 'GET',
        description: 'List all reports with pagination',
        parameters: {
          limit: 'Optional. Number of results to return (default: 10)',
          offset: 'Optional. Offset for pagination (default: 0)'
        }
      },
      '/api/reports/:main_id': {
        method: 'GET',
        description: 'Get a specific report by main_id'
      },
      '/api/reports/:main_id/export/:format': {
        method: 'GET',
        description: 'Export a report in different formats',
        parameters: {
          format: 'Required. Export format (json, csv, pdf)'
        }
      }
    }
  });
});

module.exports = router;