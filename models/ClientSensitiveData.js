const mongoose = require('mongoose');
const crypto = require('crypto');

const clientSensitiveDataSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  networkTopology: {
    devices: [{
      name: String,
      type: String,
      ip: String,
      mac: String,
      location: String,
      credentials: {
        type: String,  // Données chiffrées
        required: true
      }
    }],
    diagram: String,  // URL ou données du diagramme réseau
    notes: String
  },
  remoteAccess: [{
    type: {
      type: String,
      enum: ['VPN', 'RDP', 'SSH', 'OTHER']
    },
    host: String,
    port: String,
    credentials: {
      type: String,  // Données chiffrées
      required: true
    },
    notes: String
  }],
  internalNotes: String,
  securityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  lastAudit: Date,
  lastBackup: Date
}, {
  timestamps: true
});

// Fonction pour chiffrer les données sensibles
const encryptData = (data) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Fonction pour déchiffrer les données sensibles
const decryptData = (encryptedData) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Middleware pour chiffrer les données avant sauvegarde
clientSensitiveDataSchema.pre('save', function(next) {
  if (this.isModified('networkTopology.devices')) {
    this.networkTopology.devices.forEach(device => {
      if (device.credentials) {
        device.credentials = encryptData(device.credentials);
      }
    });
  }

  if (this.isModified('remoteAccess')) {
    this.remoteAccess.forEach(access => {
      if (access.credentials) {
        access.credentials = encryptData(access.credentials);
      }
    });
  }

  next();
});

// Méthode pour déchiffrer les données
clientSensitiveDataSchema.methods.getDecryptedData = function() {
  const data = this.toObject();

  if (data.networkTopology && data.networkTopology.devices) {
    data.networkTopology.devices = data.networkTopology.devices.map(device => ({
      ...device,
      credentials: device.credentials ? decryptData(device.credentials) : null
    }));
  }

  if (data.remoteAccess) {
    data.remoteAccess = data.remoteAccess.map(access => ({
      ...access,
      credentials: access.credentials ? decryptData(access.credentials) : null
    }));
  }

  return data;
};

module.exports = clientSensitiveDataSchema; 