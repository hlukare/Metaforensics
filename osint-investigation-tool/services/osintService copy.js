const GoogleSearchService = require('./googleSearch');
const DatabaseService = require('./databaseService');
const SocialMediaService = require('./socialMediaService');
const EmailPhoneService = require('./emailPhoneService');
const DomainService = require('./domainService');
const PublicRecordsService = require('./publicRecordsService');
const ImageService = require('./imageService');
const BreachService = require('./breachService');
const GeolocationService = require('./geolocationService');
const fs = require('fs-extra');
const path = require('path');

class OSINTService {
  constructor() {
    this.googleSearch = new GoogleSearchService();
    this.databaseService = new DatabaseService();
    this.socialMediaService = new SocialMediaService();
    this.emailPhoneService = new EmailPhoneService();
    this.domainService = new DomainService();
    this.publicRecordsService = new PublicRecordsService();
    this.imageService = new ImageService();
    this.breachService = new BreachService();
    this.geolocationService = new GeolocationService();
  }

  async generateReport(name, location = '', mainId = null) {
    try {
      // Execute all searches in parallel
      const [
        googleResults,
        socialMediaResults,
        emailPhoneResults,
        domainResults,
        publicRecordsResults,
        breachResults,
        voterData,
        panData,
        aadharData,
        criminalData
      ] = await Promise.all([
        this.googleSearch.searchPerson(name, location),
        this.socialMediaService.searchPerson(name, location),
        this.emailPhoneService.searchPerson(name, location),
        this.domainService.searchPerson(name, location),
        this.publicRecordsService.searchPerson(name, location),
        this.breachService.searchPerson(name, location),
        this.databaseService.searchVoter(name, location),
        this.databaseService.searchPan(name),
        this.databaseService.searchAadhar(name),
        this.databaseService.searchCriminal(name, location)
      ]);

      // Compile the report
      const report = {
        personal_info: {
          name,
          location,
          extracted_from: {}
        },
        digital_footprint: {
          google: googleResults,
          social_media: socialMediaResults,
          email_phone: emailPhoneResults,
          domains: domainResults
        },
        public_records: publicRecordsResults,
        breach_data: breachResults,
        database_records: {
          voter: voterData,
          pan: panData,
          aadhar: aadharData,
          criminal: criminalData
        },
        summary: this.generateSummary(
          voterData, 
          panData, 
          aadharData, 
          criminalData, 
          googleResults,
          socialMediaResults
        ),
        generated_at: new Date().toISOString()
      };

      // Generate IDs if not provided
      const main_id = mainId || this.generateId(name, location);
      const sub_id = this.generateSubId();
      
      // Save the report if it's a new request
      if (!mainId) {
        await this.saveReport(main_id, sub_id, report);
      }

      return {
        main_id,
        sub_id,
        ...report
      };
    } catch (error) {
      console.error('OSINT Service Error:', error);
      return { error: 'Failed to generate OSINT report' };
    }
  }

  generateSummary(voter, pan, aadhar, criminal, google, socialMedia) {
    const summary = {
      identity_verified: false,
      digital_presence: false,
      criminal_records: criminal.length > 0 ? criminal.length : 0,
      data_sources_matched: []
    };

    // Check if identity is verified across multiple sources
    if (voter.length > 0) summary.data_sources_matched.push('voter');
    if (pan.length > 0) summary.data_sources_matched.push('pan');
    if (aadhar.length > 0) summary.data_sources_matched.push('aadhar');

    summary.identity_verified = summary.data_sources_matched.length >= 2;

    // Check digital presence
    if (google.social_media.length > 0 || 
        google.work_profiles.length > 0 ||
        socialMedia.profiles.length > 0) {
      summary.digital_presence = true;
    }

    return summary;
  }

  generateId(name, location) {
    // Create a simple hash-based ID
    const str = `${name}-${location}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `report_${Math.abs(hash)}`;
  }

  generateSubId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveReport(mainId, subId, report) {
    try {
      const reportPath = path.join('./storage/reports', `${mainId}.json`);
      
      let existingData = {};
      if (await fs.pathExists(reportPath)) {
        existingData = await fs.readJson(reportPath);
      }
      
      // Add new sub-report
      if (!existingData.reports) {
        existingData.reports = {};
      }
      
      existingData.reports[subId] = report;
      existingData.last_updated = new Date().toISOString();
      
      await fs.writeJson(reportPath, existingData, { spaces: 2 });
      console.log(`Report saved: ${mainId}/${subId}`);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  async getReport(mainId) {
    try {
      const reportPath = path.join('./storage/reports', `${mainId}.json`);
      
      if (await fs.pathExists(reportPath)) {
        return await fs.readJson(reportPath);
      } else {
        return { error: 'Report not found' };
      }
    } catch (error) {
      console.error('Error reading report:', error);
      return { error: 'Failed to read report' };
    }
  }
}

module.exports = OSINTService;