const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class SpiderFootService {
  constructor() {
    this.spiderfootPath = process.env.SPIDERFOOT_PATH || 'spiderfoot';
    this.outputDir = './storage/spiderfoot_reports';
  }

  async runScan(target, scanType = 'all') {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      fs.ensureDirSync(this.outputDir);
      
      const outputFile = path.join(this.outputDir, `report_${Date.now()}.json`);
      const command = `${this.spiderfootPath} -s ${target} -t ${scanType} -o json -f ${outputFile}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('SpiderFoot execution error:', error);
          reject(error);
          return;
        }
        
        // Read and parse the generated report
        try {
          const reportData = fs.readJsonSync(outputFile);
          resolve(reportData);
        } catch (parseError) {
          console.error('Error parsing SpiderFoot report:', parseError);
          reject(parseError);
        }
      });
    });
  }

  async searchPerson(name, location = '') {
    try {
      const target = `${name} ${location}`.trim();
      const scanResults = await this.runScan(target);
      
      return this.parseResults(scanResults);
    } catch (error) {
      console.error('SpiderFoot search error:', error);
      return { error: 'Failed to gather OSINT data via SpiderFoot' };
    }
  }

  parseResults(data) {
    // This is a simplified parser - you'd need to adjust based on SpiderFoot's actual output format
    const results = {
      social_media: [],
      work_profiles: [],
      other_info: [],
      emails: [],
      phones: []
    };

    if (data && data.modules) {
      Object.values(data.modules).forEach(moduleData => {
        if (moduleData.data) {
          moduleData.data.forEach(item => {
            const result = {
              type: item.type,
              data: item.data,
              source: item.module
            };

            // Categorize based on data type
            if (item.type.includes('email')) {
              results.emails.push(result);
            } else if (item.type.includes('phone')) {
              results.phones.push(result);
            } else if (item.data.includes('linkedin.com') || item.type.includes('employment')) {
              results.work_profiles.push(result);
            } else if (
              item.data.includes('facebook.com') ||
              item.data.includes('twitter.com') ||
              item.data.includes('instagram.com')
            ) {
              results.social_media.push(result);
            } else {
              results.other_info.push(result);
            }
          });
        }
      });
    }

    return results;
  }
}

module.exports = SpiderFootService;