const axios = require('axios');

class EmailPhoneService {
  constructor() {
    // These would be actual API keys in production
    this.hunterApiKey = process.env.HUNTER_API_KEY;
    this.numverifyApiKey = process.env.NUMVERIFY_API_KEY;
  }

  async searchPerson(name, location = '') {
    try {
      const results = {
        emails: await this.searchEmails(name, location),
        phones: await this.searchPhones(name, location),
        breaches: await this.checkBreaches(name)
      };

      return results;
    } catch (error) {
      console.error('Email/Phone Service Error:', error);
      return this.getMockData(name, location);
    }
  }

  async searchEmails(name, location) {
    try {
      if (!this.hunterApiKey) {
        return this.getMockEmails(name, location);
      }

      const response = await axios.get('https://api.hunter.io/v2/email-finder', {
        params: {
          domain: this.extractDomainFromName(name, location),
          api_key: this.hunterApiKey,
          full_name: name
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Email search error:', error);
      return this.getMockEmails(name, location);
    }
  }

  async searchPhones(name, location) {
    try {
      if (!this.numverifyApiKey) {
        return this.getMockPhones(name, location);
      }

      // This would be a more sophisticated search in production
      const response = await axios.get('http://apilayer.net/api/validate', {
        params: {
          access_key: this.numverifyApiKey,
          number: this.generatePhoneNumber(location)
        }
      });

      return response.data.valid ? [response.data] : [];
    } catch (error) {
      console.error('Phone search error:', error);
      return this.getMockPhones(name, location);
    }
  }

  async checkBreaches(name) {
    try {
      // Check Have I Been Pwned (simplified)
      const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(name)}`, {
        headers: {
          'hibp-api-key': process.env.HIBP_API_KEY || '',
          'User-Agent': 'OSINT-Investigation-Tool'
        }
      });

      return response.data || [];
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return []; // No breaches found
      }
      console.error('Breach check error:', error);
      return [];
    }
  }

  extractDomainFromName(name, location) {
    // Simple domain extraction logic
    const domainMap = {
      'hyderabad': 'hyderabad.com',
      'mumbai': 'mumbai.com',
      'delhi': 'delhi.com',
      'bangalore': 'bangalore.com'
    };

    return domainMap[location.toLowerCase()] || 'example.com';
  }

  generatePhoneNumber(location) {
    // Simple phone number generation based on location
    const areaCodeMap = {
      'hyderabad': '40',
      'mumbai': '22',
      'delhi': '11',
      'bangalore': '80'
    };

    const areaCode = areaCodeMap[location.toLowerCase()] || '99';
    return `+91${areaCode}${Math.floor(1000000 + Math.random() * 9000000)}`;
  }

  getMockData(name, location) {
    return {
      emails: this.getMockEmails(name, location),
      phones: this.getMockPhones(name, location),
      breaches: []
    };
  }

  getMockEmails(name, location) {
    const username = name.replace(/\s+/g, '.').toLowerCase();
    return [
      {
        value: `${username}@gmail.com`,
        type: 'personal',
        confidence: 85
      },
      {
        value: `${username}@${location.toLowerCase().replace(/\s+/g, '')}.com`,
        type: 'work',
        confidence: 75
      }
    ];
  }

  getMockPhones(name, location) {
    return [
      {
        number: this.generatePhoneNumber(location),
        local_format: this.generatePhoneNumber(location).replace('+91', '0'),
        international_format: this.generatePhoneNumber(location),
        country_prefix: '+91',
        country_code: 'IN',
        country_name: 'India',
        location: location,
        carrier: 'Airtel',
        line_type: 'mobile',
        valid: true
      }
    ];
  }
}

module.exports = EmailPhoneService;