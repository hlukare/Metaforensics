const axios = require('axios');

class BreachService {
  constructor() {
    this.hibpApiKey = process.env.HIBP_API_KEY;
    this.dehashedApiKey = process.env.DEHASHED_API_KEY;
  }

  async searchPerson(name, location = '') {
    try {
      const email = this.generateEmailFromName(name);
      
      const results = {
        breaches: await this.checkBreaches(email),
        leaked_data: await this.searchLeakedData(name, email),
        password_exposure: await this.checkPasswordExposure(email),
        recommendations: this.generateRecommendations()
      };

      return results;
    } catch (error) {
      console.error('Breach Service Error:', error);
      return this.getMockData(name, location);
    }
  }

  async checkBreaches(email) {
    try {
      const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
        headers: {
          'hibp-api-key': this.hibpApiKey || '',
          'User-Agent': 'OSINT-Investigation-Tool'
        }
      });

      return response.data.map(breach => ({
        name: breach.Name,
        domain: breach.Domain,
        breach_date: breach.BreachDate,
        added_date: breach.AddedDate,
        compromised_data: breach.DataClasses,
        description: breach.Description
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return []; // No breaches found
      }
      console.error('Breach check error:', error);
      return this.getMockBreaches();
    }
  }

  async searchLeakedData(name, email) {
    try {
      if (!this.dehashedApiKey) {
        return this.getMockLeakedData();
      }

      const response = await axios.get('https://api.dehashed.com/search', {
        params: {
          query: `email:"${email}" OR name:"${name}"`
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.dehashedApiKey}:`).toString('base64')}`
        }
      });

      return response.data.entries || [];
    } catch (error) {
      console.error('Leaked data search error:', error);
      return this.getMockLeakedData();
    }
  }

  async checkPasswordExposure(email) {
    try {
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${this.hashPassword(email)}`);
      
      // This is a simplified check - in reality you'd check specific password hashes
      return response.data.includes(':') ? 'exposed' : 'not_exposed';
    } catch (error) {
      console.error('Password exposure check error:', error);
      return 'unknown';
    }
  }

  generateRecommendations() {
    return [
      "Change passwords for compromised accounts",
      "Enable two-factor authentication",
      "Monitor financial accounts for suspicious activity",
      "Use a password manager to generate strong, unique passwords",
      "Consider credit monitoring services"
    ];
  }

  generateEmailFromName(name) {
    const username = name.replace(/\s+/g, '.').toLowerCase();
    return `${username}@example.com`;
  }

  hashPassword(password) {
    // This is a simplified version - use proper crypto in production
    return require('crypto').createHash('sha1').update(password).digest('hex').toUpperCase().substring(0, 5);
  }

  getMockData(name, location) {
    return {
      breaches: this.getMockBreaches(),
      leaked_data: this.getMockLeakedData(),
      password_exposure: 'exposed',
      recommendations: this.generateRecommendations()
    };
  }

  getMockBreaches() {
    return [
      {
        name: "ExampleBreach2020",
        domain: "example.com",
        breach_date: "2020-07-15",
        added_date: "2020-08-20",
        compromised_data: ["email-addresses", "passwords", "usernames"],
        description: "Example breach description"
      }
    ];
  }

  getMockLeakedData() {
    return [
      {
        id: "12345",
        email: "example@example.com",
        name: "Example User",
        password: "hashed_password",
        hashed_password: true,
        ip_address: "192.0.2.1",
        database_name: "ExampleBreach2020"
      }
    ];
  }
}

module.exports = BreachService;