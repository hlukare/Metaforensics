const { voterDB, panDB, aadharDB, criminalDB } = require('../config/database');

class DatabaseService {
  // Normalize name by cleaning up various formats
  normalizeName(name) {
    if (!name) return '';
    
    // Replace underscores and hyphens with spaces
    let cleaned = name.replace(/[_-]/g, ' ');
    
    // Remove LinkedIn/social media IDs (mixed alphanumeric strings like "1a889a2b8")
    // Only remove if it contains BOTH letters and numbers (social media IDs pattern)
    cleaned = cleaned.replace(/\s+[a-z0-9]*\d+[a-z0-9]*$/i, '');
    
    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  async searchVoter(name, location = '') {
    try {
      const normalizedName = this.normalizeName(name);
      console.log(`[DatabaseService] Searching voters for: "${normalizedName}" (original: "${name}")`);
      let results = await voterDB.search(normalizedName);
      console.log(`[DatabaseService] Found ${results.length} voter records`);
      
      // If location is provided, filter by location
      if (location) {
        results = results.filter(voter => {
          return voter.address && voter.address.toLowerCase().includes(location.toLowerCase());
        });
        console.log(`[DatabaseService] After location filter: ${results.length} voter records`);
      }
      
      return results;
    } catch (error) {
      console.error('Voter database search error:', error);
      return { error: 'Failed to search voter database' };
    }
  }

  async searchPan(name) {
    try {
      const normalizedName = this.normalizeName(name);
      console.log(`[DatabaseService] Searching PAN for: "${normalizedName}" (original: "${name}")`);
      const results = await panDB.search(normalizedName);
      console.log(`[DatabaseService] Found ${results.length} PAN records`);
      return results;
    } catch (error) {
      console.error('PAN database search error:', error);
      return { error: 'Failed to search PAN database' };
    }
  }

  async searchAadhar(name) {
    try {
      const normalizedName = this.normalizeName(name);
      console.log(`[DatabaseService] Searching Aadhar for: "${normalizedName}" (original: "${name}")`);
      const results = await aadharDB.search(normalizedName);
      console.log(`[DatabaseService] Found ${results.length} Aadhar records`);
      return results;
    } catch (error) {
      console.error('Aadhar database search error:', error);
      return { error: 'Failed to search Aadhar database' };
    }
  }

  async searchCriminal(name, location = '') {
    try {
      const normalizedName = this.normalizeName(name);
      console.log(`[DatabaseService] Searching criminal records for: "${normalizedName}" (original: "${name}")`);
      let results = await criminalDB.search(normalizedName);
      console.log(`[DatabaseService] Found ${results.length} criminal records`);
      
      // If location is provided, filter by location
      if (location) {
        results = results.filter(record => {
          return record.address && record.address.toLowerCase().includes(location.toLowerCase());
        });
        console.log(`[DatabaseService] After location filter: ${results.length} criminal records`);
      }
      
      return results;
    } catch (error) {
      console.error('Criminal database search error:', error);
      return { error: 'Failed to search criminal database' };
    }
  }
}

module.exports = DatabaseService;