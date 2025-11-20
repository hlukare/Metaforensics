// const puppeteer = require('puppeteer');
// const cheerio = require('cheerio');
// const axios = require('axios');

// module.exports = {
//   // Initialize browser instance
//   initBrowser: async (headless = true) => {
//     return await puppeteer.launch({
//       headless: headless,
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-accelerated-2d-canvas',
//         '--no-first-run',
//         '--no-zygote',
//         '--single-process',
//         '--disable-gpu'
//       ]
//     });
//   },

//   // Scrape website with Puppeteer
//   scrapeWithPuppeteer: async (url, waitForSelector = null) => {
//     const browser = await module.exports.initBrowser();
//     try {
//       const page = await browser.newPage();
      
//       // Set realistic headers
//       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
//       await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
//       if (waitForSelector) {
//         await page.waitForSelector(waitForSelector, { timeout: 10000 });
//       }
      
//       const content = await page.content();
//       await browser.close();
      
//       return content;
//     } catch (error) {
//       await browser.close();
//       throw error;
//     }
//   },

//   // Scrape website with Cheerio
//   scrapeWithCheerio: async (url) => {
//     try {
//       const response = await axios.get(url, {
//         headers: {
//           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//         },
//         timeout: 10000
//       });
      
//       return cheerio.load(response.data);
//     } catch (error) {
//       throw error;
//     }
//   },

//   // Extract social media links from page
//   extractSocialLinks: ($) => {
//     const socialLinks = {
//       facebook: [],
//       twitter: [],
//       linkedin: [],
//       instagram: [],
//       youtube: [],
//       other: []
//     };

//     $('a[href*="facebook.com"]').each((i, el) => {
//       socialLinks.facebook.push($(el).attr('href'));
//     });

//     $('a[href*="twitter.com"]').each((i, el) => {
//       socialLinks.twitter.push($(el).attr('href'));
//     });

//     $('a[href*="linkedin.com"]').each((i, el) => {
//       socialLinks.linkedin.push($(el).attr('href'));
//     });

//     $('a[href*="instagram.com"]').each((i, el) => {
//       socialLinks.instagram.push($(el).attr('href'));
//     });

//     $('a[href*="youtube.com"]').each((i, el) => {
//       socialLinks.youtube.push($(el).attr('href'));
//     });

//     // Other social media platforms
//     const otherPlatforms = ['pinterest', 'reddit', 'tiktok', 'snapchat'];
//     otherPlatforms.forEach(platform => {
//       $(`a[href*="${platform}.com"]`).each((i, el) => {
//         socialLinks.other.push($(el).attr('href'));
//       });
//     });

//     return socialLinks;
//   },

//   // Extract email addresses from page
//   extractEmails: ($) => {
//     const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
//     const text = $.text();
//     const emails = text.match(emailRegex) || [];
//     return [...new Set(emails)]; // Remove duplicates
//   },

//   // Extract phone numbers from page
//   extractPhones: ($) => {
//     const phoneRegex = /[\+]?[1-9][\d]{0,2}[\s]?[\(]?[\d]{3}[\)]?[\s]?[\d]{3}[\s]?[\d]{4}/g;
//     const text = $.text();
//     const phones = text.match(phoneRegex) || [];
//     return [...new Set(phones)]; // Remove duplicates
//   },

//   // Extract metadata from page
//   extractMetadata: ($) => {
//     const metadata = {};
    
//     // Title
//     metadata.title = $('title').text();
    
//     // Meta description
//     metadata.description = $('meta[name="description"]').attr('content');
    
//     // Open Graph data
//     metadata.og = {};
//     $('meta[property^="og:"]').each((i, el) => {
//       const property = $(el).attr('property').replace('og:', '');
//       metadata.og[property] = $(el).attr('content');
//     });
    
//     // Twitter Card data
//     metadata.twitter = {};
//     $('meta[name^="twitter:"]').each((i, el) => {
//       const name = $(el).attr('name').replace('twitter:', '');
//       metadata.twitter[name] = $(el).attr('content');
//     });
    
//     // Keywords
//     metadata.keywords = $('meta[name="keywords"]').attr('content');
    
//     return metadata;
//   },

//   // Take screenshot of page
//   takeScreenshot: async (url, path) => {
//     const browser = await module.exports.initBrowser();
//     try {
//       const page = await browser.newPage();
//       await page.goto(url, { waitUntil: 'networkidle2' });
//       await page.screenshot({ path: path, fullPage: true });
//       await browser.close();
//     } catch (error) {
//       await browser.close();
//       throw error;
//     }
//   }
// };


const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

module.exports = {
  // Initialize browser instance
  initBrowser: async (headless = true) => {
    return await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
  },

  // Scrape website with Puppeteer
  scrapeWithPuppeteer: async (url, waitForSelector = null) => {
    const browser = await module.exports.initBrowser();
    try {
      const page = await browser.newPage();
      
      // Set realistic headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      
      const content = await page.content();
      await browser.close();
      
      return content;
    } catch (error) {
      await browser.close();
      throw error;
    }
  },

  // Scrape website with Cheerio
  scrapeWithCheerio: async (url) => {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      return cheerio.load(response.data);
    } catch (error) {
      throw error;
    }
  },

  // Extract social media links from page
  extractSocialLinks: ($) => {
    const socialLinks = {
      facebook: [],
      twitter: [],
      linkedin: [],
      instagram: [],
      youtube: [],
      other: []
    };

    $('a[href*="facebook.com"]').each((i, el) => {
      socialLinks.facebook.push($(el).attr('href'));
    });

    $('a[href*="twitter.com"]').each((i, el) => {
      socialLinks.twitter.push($(el).attr('href'));
    });

    $('a[href*="linkedin.com"]').each((i, el) => {
      socialLinks.linkedin.push($(el).attr('href'));
    });

    $('a[href*="instagram.com"]').each((i, el) => {
      socialLinks.instagram.push($(el).attr('href'));
    });

    $('a[href*="youtube.com"]').each((i, el) => {
      socialLinks.youtube.push($(el).attr('href'));
    });

    // Other social media platforms
    const otherPlatforms = ['pinterest', 'reddit', 'tiktok', 'snapchat'];
    otherPlatforms.forEach(platform => {
      $(`a[href*="${platform}.com"]`).each((i, el) => {
        socialLinks.other.push($(el).attr('href'));
      });
    });

    return socialLinks;
  },

  // Extract email addresses from page
  extractEmails: ($) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = $.text();
    const emails = text.match(emailRegex) || [];
    return [...new Set(emails)]; // Remove duplicates
  },

  // Extract phone numbers from page
  extractPhones: ($) => {
    const phoneRegex = /[\+]?[1-9][\d]{0,2}[\s]?[\(]?[\d]{3}[\)]?[\s]?[\d]{3}[\s]?[\d]{4}/g;
    const text = $.text();
    const phones = text.match(phoneRegex) || [];
    return [...new Set(phones)]; // Remove duplicates
  },

  // Extract metadata from page
  extractMetadata: ($) => {
    const metadata = {};
    
    // Title
    metadata.title = $('title').text();
    
    // Meta description
    metadata.description = $('meta[name="description"]').attr('content');
    
    // Open Graph data
    metadata.og = {};
    $('meta[property^="og:"]').each((i, el) => {
      const property = $(el).attr('property').replace('og:', '');
      metadata.og[property] = $(el).attr('content');
    });
    
    // Twitter Card data
    metadata.twitter = {};
    $('meta[name^="twitter:"]').each((i, el) => {
      const name = $(el).attr('name').replace('twitter:', '');
      metadata.twitter[name] = $(el).attr('content');
    });
    
    // Keywords
    metadata.keywords = $('meta[name="keywords"]').attr('content');
    
    return metadata;
  },

  // Take screenshot of page
  takeScreenshot: async (url, path) => {
    const browser = await module.exports.initBrowser();
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path, fullPage: true });
      await browser.close();
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
};