const jwt = require('jsonwebtoken');
const { getModels } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Received token:', token ? 'Token present' : 'No token');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      // Verify token
      console.log('[auth middleware] Verifying token with JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'MISSING!');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);
      
      const { User, AdminUser } = getModels();
      let user;
      
      if (decoded.isAdmin) {
        // Find admin user using decoded.id
        user = await AdminUser.findById(decoded.id).select('-password'); 
        console.log('User from admin database:', user ? 'Found' : 'Not found');
        
        // Fallback check (less likely for admin token but keep consistency)
        // if (!user) {
        //   user = await User.findById(decoded.id).select('-password');
        //   console.log('User from public database (fallback):', user ? 'Found' : 'Not found');
        // }
      } else {
        // Find client user using decoded.id
        user = await User.findById(decoded.id).select('-password');
        console.log('User from public database:', user ? 'Found' : 'Not found');
        
        // Fallback check (less likely for client token but keep consistency)
        // if (!user) {
        //   user = await AdminUser.findById(decoded.id).select('-password');
        //   console.log('User from admin database (fallback):', user ? 'Found' : 'Not found');
        // }
      }
      
      if (!user) {
        console.log('No user found in either database for id:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User authenticated:', { id: user._id, role: user.role, company: user.company, isBoss: user.isCompanyBoss });
      req.user = user;
      req.token = token;
      req.isAdmin = !!decoded.isAdmin;
      next();
    } catch (error) {
      console.error('Token verification or User lookup error:', error);
      return res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('Checking role:', { userRole: req.user?.role, requiredRoles: roles });
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('User role not authorized');
      return res.status(403).json({ 
        message: 'Access denied - insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }
    
    console.log('Role check passed');
    next();
  };
};

module.exports = { auth, requireRole }; 