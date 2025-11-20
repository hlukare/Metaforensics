/**
 * Report Formatter Service
 * Formats raw OSINT data into a clean, structured format
 * with only relevant information and concise descriptions
 */

class ReportFormatter {
  /**
   * Formats the complete OSINT report
   * @param {Object} rawReport - The raw report data from osintService
   * @returns {Object} - Formatted report with clean structure
   */
  formatReport(rawReport) {
    const formatted = {
      main_id: rawReport.main_id,
      sub_id: rawReport.sub_id,
      personal_info: {
        name: rawReport.personal_info?.name || 'Unknown',
        location: rawReport.personal_info?.location || 'Unknown'
      },
      other: this.formatOtherSection(rawReport),
      database_records: this.formatDatabaseRecords(rawReport.database_records),
      social_media: this.formatSocialMedia(rawReport.digital_footprint),
      public_records: this.formatPublicRecords(rawReport.public_records),
      metadata: this.formatMetadata(rawReport.metadata), // Add formatted metadata
      summary: this.formatSummary(rawReport),
      generated_at: rawReport.generated_at || new Date().toISOString()
    };

    return formatted;
  }

  /**
   * Formats the "other" section with Google search results
   * Each entry has one link and a 10-word description
   */
  formatOtherSection(rawReport) {
    const otherItems = [];
    
    // Extract Google search results
    if (rawReport.digital_footprint?.google) {
      const google = rawReport.digital_footprint.google;
      
      // Add work profiles
      if (google.work_profiles && google.work_profiles.length > 0) {
        google.work_profiles.slice(0, 3).forEach(profile => {
          otherItems.push({
            source: 'Google Search - Work Profile',
            link: profile.link,
            description: this.truncateDescription(profile.snippet || profile.title, 10)
          });
        });
      }
      
      // Add other info
      if (google.other_info && google.other_info.length > 0) {
        google.other_info.slice(0, 3).forEach(info => {
          otherItems.push({
            source: 'Google Search - Other',
            link: info.link,
            description: this.truncateDescription(info.snippet || info.title, 10)
          });
        });
      }
    }

    // Add email/phone related data
    if (rawReport.digital_footprint?.email_phone) {
      const emailPhone = rawReport.digital_footprint.email_phone;
      
      if (emailPhone.emails && emailPhone.emails.length > 0) {
        emailPhone.emails.slice(0, 2).forEach(email => {
          otherItems.push({
            source: 'Email Search',
            link: email.link || email.source || '#',
            description: this.truncateDescription(email.description || `Email: ${email.email}`, 10)
          });
        });
      }
    }

    // Add breach data
    if (rawReport.breach_data && rawReport.breach_data.breaches) {
      rawReport.breach_data.breaches.slice(0, 2).forEach(breach => {
        otherItems.push({
          source: 'Data Breach',
          link: breach.link || '#',
          description: this.truncateDescription(breach.description || `Breach: ${breach.name}`, 10)
        });
      });
    }

    return otherItems;
  }

  /**
   * Formats database records section
   */
  formatDatabaseRecords(databaseRecords) {
    if (!databaseRecords) {
      return {
        aadhar: [],
        criminal: [],
        pan: [],
        voter: []
      };
    }

    return {
      aadhar: this.formatAadharRecords(databaseRecords.aadhar || []),
      criminal: this.formatCriminalRecords(databaseRecords.criminal || []),
      pan: this.formatPanRecords(databaseRecords.pan || []),
      voter: this.formatVoterRecords(databaseRecords.voter || [])
    };
  }

  /**
   * Format Aadhar records - return actual data if found
   */
  formatAadharRecords(records) {
    return records.map(record => ({
      ref_id: record.ref_id,
      status: record.status,
      name: record.name,
      dob: record.dob,
      address: record.address,
      email: record.email || 'N/A',
      gender: record.gender,
      year_of_birth: record.year_of_birth
    }));
  }

  /**
   * Format Criminal records - return actual data if found
   */
  formatCriminalRecords(records) {
    return records.map(record => ({
      name: record.name,
      case_number: record.case_details?.[0]?.case_number || 'N/A',
      status: record.case_details?.[0]?.status || 'Unknown',
      charges: record.case_details?.[0]?.charges || [],
      filing_date: record.case_details?.[0]?.filing_date || 'N/A',
      court: record.case_details?.[0]?.court || 'N/A',
      address: record.address
    }));
  }

  /**
   * Format PAN records - return actual data if found
   */
  formatPanRecords(records) {
    return records.map(record => ({
      pan_number: record.pan_number,
      name: record.name,
      dob: record.dob,
      father_name: record.father_name,
      date_of_issue: record.date_of_issue,
      photo_link: record.photo_link
    }));
  }

  /**
   * Format Voter records - return actual data if found
   */
  formatVoterRecords(records) {
    return records.map(record => ({
      epic_number: record.epic_number,
      name: record.name,
      age: record.age,
      dob: record.dob,
      gender: record.gender,
      address: record.address,
      father_name: record.father_name || record.relation_name,
      state: record.state,
      assembly_constituency: record.assembly_constituency,
      parliamentary_constituency: record.parliamentary_constituency,
      part_number: record.part_number,
      serial_number: record.serial_number,
      polling_station: record.polling_station
    }));
  }

  /**
   * Formats social media section with one relevant link per platform
   */
  formatSocialMedia(digitalFootprint) {
    const socialMedia = {
      facebook: null,
      instagram: null,
      linkedin: null,
      twitter: null
    };

    if (!digitalFootprint) {
      return socialMedia;
    }

    // Extract from social_media service results
    if (digitalFootprint.social_media) {
      const sm = digitalFootprint.social_media;
      
      // Facebook
      if (sm.facebook && sm.facebook.length > 0) {
        const fb = sm.facebook[0];
        socialMedia.facebook = {
          link: fb.link,
          description: this.truncateDescription(fb.bio || fb.name || 'Facebook profile found', 10)
        };
      }

      // Instagram
      if (sm.instagram && sm.instagram.length > 0) {
        const ig = sm.instagram[0];
        socialMedia.instagram = {
          link: ig.link,
          description: this.truncateDescription(ig.snippet || ig.title || 'Instagram profile found', 10)
        };
      }

      // LinkedIn
      if (sm.linkedin && sm.linkedin.length > 0) {
        const li = sm.linkedin[0];
        socialMedia.linkedin = {
          link: li.link,
          description: this.truncateDescription(li.snippet || li.title || 'LinkedIn profile found', 10)
        };
      }

      // Twitter
      if (sm.twitter && sm.twitter.length > 0) {
        const tw = sm.twitter[0];
        socialMedia.twitter = {
          link: tw.link,
          description: this.truncateDescription(tw.bio || `Twitter: ${tw.handle}` || 'Twitter profile found', 10)
        };
      }
    }

    // Also check Google results for social media
    if (digitalFootprint.google?.social_media) {
      digitalFootprint.google.social_media.forEach(profile => {
        const link = profile.link.toLowerCase();
        
        if (link.includes('facebook.com') && !socialMedia.facebook) {
          socialMedia.facebook = {
            link: profile.link,
            description: this.truncateDescription(profile.snippet || profile.title, 10)
          };
        } else if (link.includes('instagram.com') && !socialMedia.instagram) {
          socialMedia.instagram = {
            link: profile.link,
            description: this.truncateDescription(profile.snippet || profile.title, 10)
          };
        } else if (link.includes('linkedin.com') && !socialMedia.linkedin) {
          socialMedia.linkedin = {
            link: profile.link,
            description: this.truncateDescription(profile.snippet || profile.title, 10)
          };
        } else if (link.includes('twitter.com') && !socialMedia.twitter) {
          socialMedia.twitter = {
            link: profile.link,
            description: this.truncateDescription(profile.snippet || profile.title, 10)
          };
        }
      });
    }

    return socialMedia;
  }

  /**
   * Formats public records section
   */
  formatPublicRecords(publicRecords) {
    const formatted = {
      business_records: null,
      property_records: null
    };

    if (!publicRecords) {
      return formatted;
    }

    // Business records
    if (publicRecords.business_records && publicRecords.business_records.length > 0) {
      const business = publicRecords.business_records[0];
      formatted.business_records = {
        link: business.link || business.source || '#',
        description: this.truncateDescription(
          business.description || business.company_name || 'Business registration found',
          10
        )
      };
    }

    // Property records
    if (publicRecords.property_records && publicRecords.property_records.length > 0) {
      const property = publicRecords.property_records[0];
      formatted.property_records = {
        link: property.link || property.source || '#',
        description: this.truncateDescription(
          property.description || property.address || 'Property ownership record found',
          10
        )
      };
    }

    return formatted;
  }

  /**
   * Formats the summary section
   */
  formatSummary(rawReport) {
    const summary = {
      criminal_records: 0,
      data_sources_matched: [],
      digital_presence: false,
      identity_verified: false
    };

    if (rawReport.summary) {
      summary.criminal_records = rawReport.summary.criminal_records || 0;
      summary.data_sources_matched = rawReport.summary.data_sources_matched || [];
      summary.digital_presence = rawReport.summary.digital_presence || false;
      summary.identity_verified = rawReport.summary.identity_verified || false;
    }

    return summary;
  }

  /**
   * Formats the metadata section from image
   */
  formatMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }

    const formatted = {};

    // Basic image info
    if (metadata.Software) {
      formatted.software = metadata.Software;
    }

    if (metadata.DateTime) {
      formatted.datetime = metadata.DateTime;
    }

    if (metadata.Orientation) {
      formatted.orientation = metadata.Orientation;
    }

    if (metadata.XResolution) {
      formatted.x_resolution = metadata.XResolution;
    }

    if (metadata.YResolution) {
      formatted.y_resolution = metadata.YResolution;
    }

    // Camera information
    if (metadata.Make || metadata.Model) {
      formatted.camera = `${metadata.Make || ''} ${metadata.Model || ''}`.trim();
    }

    // Location information
    if (metadata.location && typeof metadata.location === 'object') {
      const loc = metadata.location;
      formatted.location = {};

      if (loc.latitude !== undefined) {
        formatted.location.latitude = loc.latitude;
      }

      if (loc.longitude !== undefined) {
        formatted.location.longitude = loc.longitude;
      }

      if (loc.altitude !== undefined) {
        formatted.location.altitude = loc.altitude;
      }

      // Location name details
      if (loc.location_name && typeof loc.location_name === 'object') {
        const locName = loc.location_name;
        
        if (locName.formatted_address) {
          formatted.location.formatted_address = locName.formatted_address;
        }

        if (locName.city) {
          formatted.location.city = locName.city;
        }

        if (locName.state) {
          formatted.location.state = locName.state;
        }

        if (locName.country) {
          formatted.location.country = locName.country;
        }

        if (locName.country_code) {
          formatted.location.country_code = locName.country_code;
        }

        if (locName.postcode) {
          formatted.location.postcode = locName.postcode;
        }
      }
    }

    // Return null if no meaningful data was extracted
    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  /**
   * Truncates text to specified number of words
   * @param {String} text - Text to truncate
   * @param {Number} wordLimit - Maximum number of words (default: 10)
   * @returns {String} - Truncated text
   */
  truncateDescription(text, wordLimit = 10) {
    if (!text) return 'No description available';
    
    // Remove extra whitespace and newlines
    const cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Split into words
    const words = cleaned.split(' ');
    
    // If already within limit, return as is
    if (words.length <= wordLimit) {
      return cleaned;
    }
    
    // Truncate and add ellipsis
    return words.slice(0, wordLimit).join(' ') + '...';
  }

  /**
   * Extract the most relevant link from an array of items
   * Prioritizes official sources and verified profiles
   */
  getMostRelevantLink(items) {
    if (!items || items.length === 0) return null;
    
    // Priority order for sources
    const priorities = [
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'github.com',
      'official',
      'verified'
    ];

    // Try to find a high-priority link
    for (const priority of priorities) {
      const found = items.find(item => 
        (item.link && item.link.toLowerCase().includes(priority)) ||
        (item.url && item.url.toLowerCase().includes(priority))
      );
      if (found) return found.link || found.url;
    }

    // Return first available link
    return items[0].link || items[0].url || '#';
  }
}

module.exports = ReportFormatter;
