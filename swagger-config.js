const swaggerJsdoc = require('swagger-jsdoc');

const serverUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://192.168.80.20:5001/'
    : 'http://localhost:5001';

// Configuration pour la documentation unique (toutes les routes)
const allOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IT Support API Documentation - Complète',
      version: '1.0.0',
      description: 'Documentation complète de l\'API (clients, admin, notifications)',
    },
    servers: [
      {
        url: serverUrl,
        description: process.env.NODE_ENV === 'production'
          ? 'Serveur de production'
          : 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/api.js', './routes/admin.js', './routes/notificationRoutes.js'],
};

const allSpecs = swaggerJsdoc(allOptions);

module.exports = {
  allSpecs
}; 