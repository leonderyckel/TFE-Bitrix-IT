const jwt = require('jsonwebtoken');
const { getModels } = require('../models');

const isPrivateNetwork = (ip) => {
  // Liste des plages d'IP privées
  const privateRanges = [
    /^10\./,          // 10.0.0.0 - 10.255.255.255
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0 - 172.31.255.255
    /^192\.168\./,    // 192.168.0.0 - 192.168.255.255
    /^127\./,         // localhost
    /^::1$/,          // localhost IPv6
    /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./ // 100.64.0.0/10 (WireGuard/Tailscale/CGNAT)
  ];

  return privateRanges.some(range => range.test(ip));
};

const adminAuth = async (req, res, next) => {
  try {
    // Vérifier si la requête vient d'un réseau privé
    const clientIP = req.ip;
    console.log('Admin auth: Client IP', clientIP);
    
    if (!isPrivateNetwork(clientIP)) {
      return res.status(403).json({
        message: 'Access restricted to private network'
      });
    }

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