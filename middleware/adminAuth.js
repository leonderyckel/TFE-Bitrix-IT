const jwt = require('jsonwebtoken');
const { getModels } = require('../models');

const adminAuth = async (req, res, next) => {
  try {
    // Vérifier le token JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('Admin auth: No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Admin auth: Token decoded', decoded);
    
    // Vérifier si c'est un admin
    if (!decoded.isAdmin) {
      console.log('Admin auth: User is not an admin');
      return res.status(401).json({ message: 'Not authorized as admin' });
    }

    // Obtenir le modèle AdminUser depuis la fonction getModels
    const { AdminUser } = getModels();
    
    if (!AdminUser) {
      console.log('Admin auth: AdminUser model not found');
      return res.status(500).json({ message: 'AdminUser model not found' });
    }

    console.log('Admin auth: Looking for admin with id', decoded.id);
    const admin = await AdminUser.findById(decoded.id);
    console.log('Admin auth: Admin object:', admin);
    
    if (!admin) {
      console.log('Admin auth: Admin not found');
      return res.status(401).json({ message: 'Admin not found' });
    }

    // Ajouter l'admin à la requête
    req.admin = admin;
    
    console.log('Admin auth: Authentication successful');
    next();
  } catch (error) {
    console.log('Admin auth error:', error.message);
    return res.status(401).json({ 
      message: 'Not authorized as admin', 
      error: error.message 
    });
  }
};

module.exports = adminAuth; 