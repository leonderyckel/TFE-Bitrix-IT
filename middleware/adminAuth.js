const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

const isPrivateNetwork = (ip) => {
  // Liste des plages d'IP privées
  const privateRanges = [
    /^10\./,          // 10.0.0.0 - 10.255.255.255
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0 - 172.31.255.255
    /^192\.168\./,    // 192.168.0.0 - 192.168.255.255
    /^127\./,         // localhost
    /^::1$/           // localhost IPv6
  ];

  return privateRanges.some(range => range.test(ip));
};

const adminAuth = async (req, res, next) => {
  try {
    // Vérifier si la requête vient d'un réseau privé
    const clientIP = req.ip;
    if (!isPrivateNetwork(clientIP)) {
      return res.status(403).json({
        message: 'Accès restreint au réseau privé'
      });
    }

    // Vérifier le token JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findOne({ _id: decoded._id });

    if (!admin || !admin.isActive) {
      throw new Error();
    }

    // Mettre à jour la date de dernière connexion
    admin.lastLogin = new Date();
    await admin.save();

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Veuillez vous authentifier en tant qu\'administrateur'
    });
  }
};

module.exports = adminAuth; 