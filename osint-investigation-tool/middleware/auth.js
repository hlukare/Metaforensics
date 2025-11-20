const jwt = require('jsonwebtoken');

module.exports = {
  // Verify API key with debugging
verifyApiKey: (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  console.log('Received API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');
  console.log('Expected API key:', process.env.API_KEY ? `${process.env.API_KEY.substring(0, 10)}...` : 'Not set');
  
  if (!apiKey) {
    console.log('API key required');
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== process.env.API_KEY) {
    console.log('Invalid API key');
    return res.status(403).json({ 
      error: 'Invalid API key',
      hint: 'Check that your API key matches exactly what is in your .env file'
    });
  }

  console.log('API key validated successfully');
  next();
},

  // Verify JWT token
  verifyToken: (req, res, next) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  },

  // Check user permissions
  checkPermissions: (requiredPermissions) => {
    return (req, res, next) => {
      if (!req.user || !req.user.permissions) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const hasPermission = requiredPermissions.every(permission => 
        req.user.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  },

  // Rate limiting middleware
  rateLimit: (maxRequests, windowMs) => {
    const requests = new Map();
    
    return (req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, timestamps] of requests.entries()) {
        const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        if (recentTimestamps.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, recentTimestamps);
        }
      }

      // Check current IP
      if (!requests.has(ip)) {
        requests.set(ip, [now]);
      } else {
        const timestamps = requests.get(ip);
        timestamps.push(now);
        
        if (timestamps.length > maxRequests) {
          return res.status(429).json({ 
            error: 'Too many requests', 
            retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000) 
          });
        }
      }

      next();
    };
  },

  // Request logging middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
  },

  // Error handling middleware
  errorHandler: (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: err.message });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};