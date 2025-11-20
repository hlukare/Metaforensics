const OSINTService = require('../services/osintService');

const osintService = new OSINTService();

// GET handler (existing)
exports.searchPerson = async (req, res) => {
  try {
    const { name, location, main_id } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Name parameter is required' });
    }

    // Validate input
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name too long' });
    }

    if (location && location.length > 100) {
      return res.status(400).json({ error: 'Location too long' });
    }

    const report = await osintService.generateReport(name, location, main_id);
    
    if (report.error) {
      return res.status(500).json(report);
    }

    res.json(report);
  } catch (error) {
    console.error('Search Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// NEW: POST handler for JSON body
exports.searchPersonPost = async (req, res) => {
  try {
    const { name, location, main_id, metadata } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name field is required in request body' });
    }

    // Validate input
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name too long' });
    }

    if (location && location.length > 100) {
      return res.status(400).json({ error: 'Location too long' });
    }

    const report = await osintService.generateReport(name, location, main_id, metadata);
    
    if (report.error) {
      return res.status(500).json(report);
    }

    res.json(report);
  } catch (error) {
    console.error('Search Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.advancedSearch = async (req, res) => {
  try {
    const { name, location, email, phone, domain, options } = req.body;
    
    if (!name /* && !email && !phone && !domain */) {
      return res.status(400).json({ error: 'At least one search parameter is required' });
    }

    // Execute different types of searches based on parameters
    const searchPromises = [];
    
    if (name) {
      searchPromises.push(osintService.generateReport(name, location));
    }
    
    if (email) {
      searchPromises.push(osintService.emailPhoneService.searchEmails(email));
    }
    
    if (phone) {
      searchPromises.push(osintService.emailPhoneService.searchPhones(phone));
    }
    
    // if (domain) {
    //   searchPromises.push(osintService.domainService.searchDomains(domain));
    // }

    const results = await Promise.allSettled(searchPromises);
    
    const response = {
      name_search: name ? results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason.message } : null,
      email_search: email ? results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason.message } : null,
      phone_search: phone ? results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason.message } : null,
      // domain_search: domain ? results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason.message } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Advanced Search Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
