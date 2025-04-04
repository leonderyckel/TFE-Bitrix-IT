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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);
      
      // Get models
      const { User, AdminUser } = getModels();
      
      let user;
      
      // Déterminer quelle base de données vérifier en premier
      if (decoded.isAdmin) {
        // Si c'est un token admin, vérifier d'abord la base de données admin
        user = await AdminUser.findById(decoded._id).select('-password');
        console.log('User from admin database:', user ? 'Found' : 'Not found');
        
        if (!user) {
          user = await User.findById(decoded._id || decoded.id).select('-password');
          console.log('User from public database:', user ? 'Found' : 'Not found');
        }
      } else {
        // Si ce n'est pas un token admin, vérifier d'abord la base de données publique
        user = await User.findById(decoded.id || decoded._id).select('-password');
        console.log('User from public database:', user ? 'Found' : 'Not found');
        
        if (!user) {
          user = await AdminUser.findById(decoded._id || decoded.id).select('-password');
          console.log('User from admin database:', user ? 'Found' : 'Not found');
        }
      }
      
      if (!user) {
        console.log('No user found in either database');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User authenticated:', { id: user._id, role: user.role });
      req.user = user;
      req.token = token;
      req.isAdmin = !!decoded.isAdmin;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Token is not valid', error: error.message });
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