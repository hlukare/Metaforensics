const axios = require('axios');
const whois = require('whois-json');

class DomainService {
  constructor() {
    this.virustotalApiKey = process.env.VIRUSTOTAL_API_KEY;
  }

  async searchPerson(name, location = '') {
    try {
      const domain = this.generateDomainFromName(name);
      
      const results = {
        domains: await this.searchDomains(name),
        whois: await this.getWhoisInfo(domain),
        dns: await this.getDnsInfo(domain),
        security: await this.getSecurityInfo(domain)
      };

      return results;
    } catch (error) {
      console.error('Domain Service Error:', error);
      return this.getMockData(name, location);
    }
  }

  async searchDomains(name) {
    try {
      const domain = this.generateDomainFromName(name);
      const response = await axios.get(`https://api.whoapi.com/domains`, {
        params: {
          domain: domain,
          apikey: process.env.WHOAPI_KEY || 'test'
        }
      });

      return response.data.domains || [];
    } catch (error) {
      console.error('Domain search error:', error);
      return [this.generateDomainFromName(name)];
    }
  }

  async getWhoisInfo(domain) {
    try {
      const whoisData = await whois(domain);
      return {
        registrar: whoisData.registrar,
        created: whoisData.creationDate,
        expires: whoisData.expirationDate,
        nameservers: whoisData.nameServers,
        status: whoisData.domainStatus
      };
    } catch (error) {
      console.error('WHOIS lookup error:', error);
      return this.getMockWhois(domain);
    }
  }

  async getDnsInfo(domain) {
    try {
      // This would use a proper DNS lookup library in production
      return {
        a: [`192.0.2.1`],
        mx: [`mail.${domain}`],
        ns: [`ns1.${domain}`, `ns2.${domain}`],
        txt: [`v=spf1 include:${domain} ~all`]
      };
    } catch (error) {
      console.error('DNS lookup error:', error);
      return this.getMockDns(domain);
    }
  }

  async getSecurityInfo(domain) {
    try {
      if (!this.virustotalApiKey) {
        return this.getMockSecurityInfo(domain);
      }

      const response = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, {
        headers: {
          'x-apikey': this.virustotalApiKey
        }
      });

      return response.data.data.attributes || {};
    } catch (error) {
      console.error('Security info error:', error);
      return this.getMockSecurityInfo(domain);
    }
  }

  generateDomainFromName(name) {
    const username = name.replace(/\s+/g, '').toLowerCase();
    return `${username}.com`;
  }

  getMockData(name, location) {
    const domain = this.generateDomainFromName(name);
    return {
      domains: [domain],
      whois: this.getMockWhois(domain),
      dns: this.getMockDns(domain),
      security: this.getMockSecurityInfo(domain)
    };
  }

  getMockWhois(domain) {
    return {
      registrar: "GoDaddy",
      created: "2020-01-15",
      expires: "2025-01-15",
      nameservers: [`ns1.${domain}`, `ns2.${domain}`],
      status: "active"
    };
  }

  getMockDns(domain) {
    return {
      a: [`192.0.2.1`],
      mx: [`mail.${domain}`],
      ns: [`ns1.${domain}`, `ns2.${domain}`],
      txt: [`v=spf1 include:${domain} ~all`]
    };
  }

  getMockSecurityInfo(domain) {
    return {
      last_analysis_stats: {
        harmless: 65,
        malicious: 0,
        suspicious: 0,
        undetected: 5,
        timeout: 0
      },
      reputation: 85,
      categories: {
        "Forcepoint ThreatSeeker": "information technology",
        "AlphaMountain.ai": "business"
      }
    };
  }
}

module.exports = DomainService;