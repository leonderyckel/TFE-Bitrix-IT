const swaggerJsdoc = require('swagger-jsdoc');

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
        url: 'http://localhost:5001',
        description: 'Serveur de développement',
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