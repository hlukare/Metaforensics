const crypto = require('crypto');

module.exports = {
  // Generate a unique ID
  generateId: (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Sanitize input to prevent injection attacks
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>"'`;()]/g, '');
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number format (Indian)
  validatePhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Format date to ISO string
  formatDate: (date) => {
    return new Date(date).toISOString();
  },

  // Hash data for privacy
  hashData: (data, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(data).digest('hex');
  },

  // Delay function for rate limiting
  delay: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Parse name into components
  parseName: (fullName) => {
    const names = fullName.trim().split(/\s+/);
    return {
      first: names[0],
      middle: names.length > 2 ? names.slice(1, -1).join(' ') : '',
      last: names.length > 1 ? names[names.length - 1] : ''
    };
  },

  // Generate search queries from name
  generateSearchQueries: (name, location = '') => {
    const names = module.exports.parseName(name);
    const queries = [];

    // Full name variations
    queries.push(`"${name}"`);
    queries.push(`${name}`);
    
    // With location
    if (location) {
      queries.push(`"${name}" "${location}"`);
      queries.push(`${name} ${location}`);
    }

    // Name component variations
    if (names.middle) {
      queries.push(`"${names.first} ${names.last}"`);
      queries.push(`${names.first} ${names.last}`);
    }

    return queries;
  },

  // Calculate age from date of birth
  calculateAge: (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
};