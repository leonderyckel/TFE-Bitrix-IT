const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const UserSchema = require('./User');
const TicketSchema = require('./Ticket');
const adminUserSchema = require('./AdminUser');
const clientSensitiveDataSchema = require('./ClientSensitiveData');
const NotificationSchemaDefinition = require('./Notification');

let models = null;

const initializeModels = async () => {
  try {
    if (models) return models;

    // Connexion à la base de données publique (Proxmox)
    const publicUri = process.env.MONGODB_PUBLIC_URI;
    const mainConnection = await connectDB(publicUri);
    console.log('MongoDB Public Database Connected');

    // Connexion à la base de données admin (MongoDB Atlas)
    const adminUri = process.env.MONGODB_ADMIN_URI;
    const adminConnection = await connectDB(adminUri);
    console.log('MongoDB Admin Database Connected');

    // Création des schémas Mongoose
    const userMongooseSchema = new mongoose.Schema(UserSchema);
    const ticketMongooseSchema = new mongoose.Schema(TicketSchema);
    const adminUserMongooseSchema = new mongoose.Schema(adminUserSchema);
    const clientSensitiveDataMongooseSchema = new mongoose.Schema(clientSensitiveDataSchema);
    const notificationMongooseSchema = new mongoose.Schema(NotificationSchemaDefinition, { timestamps: true });

    // Ajout des hooks aux schémas
    ticketMongooseSchema.pre('save', function(next) {
      this.updatedAt = new Date();
      next();
    });

    // Initialisation des modèles publics
    const User = mainConnection.model('User', userMongooseSchema);
    const Ticket = mainConnection.model('Ticket', ticketMongooseSchema);
    const Notification = mainConnection.model('Notification', notificationMongooseSchema);

    // Initialisation des modèles admin
    const AdminUser = adminConnection.model('AdminUser', adminUserMongooseSchema);
    const ClientSensitiveData = adminConnection.model('ClientSensitiveData', clientSensitiveDataMongooseSchema);

    models = {
      User,
      Ticket,
      AdminUser,
      ClientSensitiveData,
      Notification,
      mainConnection,
      adminConnection
    };

    return models;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const getModels = () => {
  if (!models) {
    throw new Error('Models not initialized. Call initializeModels first.');
  }
  return models;
};

module.exports = { initializeModels, getModels }; 