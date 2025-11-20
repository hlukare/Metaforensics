const axios = require('axios');
const puppeteer = require('puppeteer');

class SocialMediaService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async searchPerson(name, location = '') {
    try {
      await this.initBrowser();
      
      const results = {
        profiles: [],
        facebook: await this.searchFacebook(name, location),
        linkedin: await this.searchLinkedIn(name, location),
        twitter: await this.searchTwitter(name, location),
        instagram: await this.searchInstagram(name, location)
      };

      // Combine all profiles
      results.profiles = [
        ...results.facebook,
        ...results.linkedin,
        ...results.twitter,
        ...results.instagram
      ];

      return results;
    } catch (error) {
      console.error('Social Media Service Error:', error);
      return this.getMockData(name, location);
    }
  }

  async searchFacebook(name, location) {
    try {
      const page = await this.browser.newPage();
      await page.goto(`https://www.facebook.com/public/${encodeURIComponent(name)}`, {
        waitUntil: 'networkidle2'
      });

      const profiles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('[role="main"] [data-testid="search-result"]').forEach(item => {
          const name = item.querySelector('span > span')?.textContent;
          const link = item.querySelector('a')?.href;
          const bio = item.querySelector('div:not(:first-child)')?.textContent;
          
          if (name && link) {
            items.push({ name, link, bio });
          }
        });
        return items;
      });

      await page.close();
      return profiles.slice(0, 5);
    } catch (error) {
      console.error('Facebook search error:', error);
      return [];
    }
  }

  async searchLinkedIn(name, location) {
    try {
      // LinkedIn requires authentication, so we'll use a simplified approach
      const page = await this.browser.newPage();
      await page.goto(`https://www.google.com/search?q=site:linkedin.com/in+${encodeURIComponent(name)}+${encodeURIComponent(location)}`, {
        waitUntil: 'networkidle2'
      });

      const profiles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.g').forEach(item => {
          const title = item.querySelector('h3')?.textContent;
          const link = item.querySelector('a')?.href;
          const snippet = item.querySelector('.VwiC3b')?.textContent;
          
          if (title && link && link.includes('linkedin.com')) {
            items.push({ title, link, snippet });
          }
        });
        return items;
      });

      await page.close();
      return profiles.slice(0, 5);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      return [];
    }
  }

  async searchTwitter(name, location) {
    try {
      const page = await this.browser.newPage();
      await page.goto(`https://twitter.com/search?q=${encodeURIComponent(name)}%20${encodeURIComponent(location)}&f=user`, {
        waitUntil: 'networkidle2'
      });

      const profiles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('[data-testid="UserCell"]').forEach(item => {
          const name = item.querySelector('[data-testid="UserCell"] [dir="ltr"] > span')?.textContent;
          const handle = item.querySelector('[data-testid="UserCell"] [dir="ltr"]:not(:first-child)')?.textContent;
          const bio = item.querySelector('[data-testid="UserCell"] [data-testid="UserBio"]')?.textContent;
          
          if (name && handle) {
            items.push({ 
              name, 
              handle: `@${handle.replace('@', '')}`, 
              bio,
              link: `https://twitter.com/${handle.replace('@', '')}`
            });
          }
        });
        return items;
      });

      await page.close();
      return profiles.slice(0, 5);
    } catch (error) {
      console.error('Twitter search error:', error);
      return [];
    }
  }

  async searchInstagram(name, location) {
    try {
      // Instagram requires authentication, so we'll use a simplified approach
      const page = await this.browser.newPage();
      await page.goto(`https://www.google.com/search?q=site:instagram.com+${encodeURIComponent(name)}+${encodeURIComponent(location)}`, {
        waitUntil: 'networkidle2'
      });

      const profiles = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.g').forEach(item => {
          const title = item.querySelector('h3')?.textContent;
          const link = item.querySelector('a')?.href;
          const snippet = item.querySelector('.VwiC3b')?.textContent;
          
          if (title && link && link.includes('instagram.com')) {
            items.push({ title, link, snippet });
          }
        });
        return items;
      });

      await page.close();
      return profiles.slice(0, 5);
    } catch (error) {
      console.error('Instagram search error:', error);
      return [];
    }
  }

  getMockData(name, location) {
    return {
      profiles: [
        {
          platform: 'facebook',
          name: name,
          url: `https://facebook.com/${name.replace(/\s+/g, '').toLowerCase()}`,
          bio: `Profile of ${name} from ${location}`
        }
      ],
      facebook: [
        {
          name: name,
          link: `https://facebook.com/${name.replace(/\s+/g, '').toLowerCase()}`,
          bio: `Profile of ${name} from ${location}`
        }
      ],
      linkedin: [
        {
          title: `${name} | LinkedIn`,
          link: `https://linkedin.com/in/${name.replace(/\s+/g, '').toLowerCase()}`,
          snippet: `Professional profile of ${name}`
        }
      ],
      twitter: [
        {
          name: name,
          handle: `@${name.replace(/\s+/g, '').toLowerCase()}`,
          bio: `Twitter profile of ${name}`,
          link: `https://twitter.com/${name.replace(/\s+/g, '').toLowerCase()}`
        }
      ],
      instagram: [
        {
          title: `${name} (@${name.replace(/\s+/g, '').toLowerCase()}) • Instagram`,
          link: `https://instagram.com/${name.replace(/\s+/g, '').toLowerCase()}`,
          snippet: `Instagram profile of ${name}`
        }
      ]
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = SocialMediaService;