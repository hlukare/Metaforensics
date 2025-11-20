const axios = require('axios');

class GoogleSearchService {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY;
    this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async searchPerson(name, location = '') {
    try {
      const query = `${name} ${location} site:linkedin.com OR site:facebook.com OR site:twitter.com OR site:instagram.com`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: 10
        }
      });

      return this.parseResults(response.data);
    } catch (error) {
      console.error('Google Search API Error:', error.message);
      // Return mock data for development
      return this.getMockData(name, location);
    }
  }

  parseResults(data) {
    const results = {
      social_media: [],
      work_profiles: [],
      other_info: []
    };

    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const result = {
          title: item.title,
          link: item.link,
          snippet: item.snippet
        };

        if (item.link.includes('linkedin.com')) {
          results.work_profiles.push(result);
        } else if (
          item.link.includes('facebook.com') ||
          item.link.includes('twitter.com') ||
          item.link.includes('instagram.com')
        ) {
          results.social_media.push(result);
        } else {
          results.other_info.push(result);
        }
      });
    }

    return results;
  }

  // Mock data for development when API keys are not available
  getMockData(name, location) {
    return {
      social_media: [
        {
          title: `${name} | Facebook`,
          link: `https://facebook.com/${name.replace(/\s+/g, '').toLowerCase()}`,
          snippet: `Profile of ${name} on Facebook`
        }
      ],
      work_profiles: [
        {
          title: `${name} | LinkedIn`,
          link: `https://linkedin.com/in/${name.replace(/\s+/g, '').toLowerCase()}`,
          snippet: `Professional profile of ${name} on LinkedIn`
        }
      ],
      other_info: [
        {
          title: `${name} - Personal Blog`,
          link: `https://${name.replace(/\s+/g, '').toLowerCase()}.blogspot.com`,
          snippet: `Personal blog of ${name} from ${location}`
        }
      ]
    };
  }
}

module.exports = GoogleSearchService;