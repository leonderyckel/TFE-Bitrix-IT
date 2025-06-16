const dotenv = require('dotenv');
dotenv.config(); // Load environment variables FIRST

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeModels, getModels } = require('./models');
// Import http and socket.io
const http = require('http');
const { Server } = require("socket.io");
// Import Swagger
const swaggerUi = require('swagger-ui-express');
const { publicSpecs, adminSpecs, notifSpecs, allSpecs } = require('./swagger-config');
const auth = require('./middleware/auth');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
app.set('trust proxy', true); // Pour que req.ip reflète la vraie IP du client derrière Nginx
// Create HTTP server
const server = http.createServer(app);

// Swagger Documentation unique (toutes les routes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(allSpecs));

// --- CORS origins setup ---
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL, 'https://bitrix.mainserver.co.za']
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://bitrix.mainserver.co.za'
    ];

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  }
});

// Middleware d'authentification pour socket.io
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('Socket connection attempt without token');
    return next(new Error('Authentication error: No token'));
  }
  try {
    console.log('Verifying socket token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User, AdminUser } = getModels();
    let user;
    if (decoded.isAdmin) {
      user = await AdminUser.findById(decoded.id).select('-password');
    } else {
      user = await User.findById(decoded.id).select('-password');
    }
    if (!user) {
      console.log('Socket authentication failed: User not found');
      return next(new Error('Authentication error: User not found'));
    }
    console.log('Socket authenticated successfully for user:', user._id);
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Basic connection listener
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Auto-join user to their personal room
  if (socket.user) {
    const userRoom = `user_${socket.user._id}`;
    socket.join(userRoom);
    console.log(`Socket ${socket.id} auto-joined user room ${userRoom}`);
  }

  // === Ticket-Specific Room Logic ===
  // Listen for clients/admins wanting to join a ticket-specific room
  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(ticketId); 
    console.log(`Socket ${socket.id} joined ticket room ${ticketId}`);
  });

  // Listen for clients/admins wanting to leave a ticket-specific room
  socket.on('leaveTicketRoom', (ticketId) => {
    socket.leave(ticketId); 
    console.log(`Socket ${socket.id} left ticket room ${ticketId}`);
  });

  // === Admin-Specific Room Logic ===
  // Listen for admins wanting to join the general admin room
  socket.on('joinAdminRoom', () => {
    socket.join('adminRoom');
    console.log(`Socket ${socket.id} joined adminRoom`);
  });

  // Listen for admins wanting to leave the general admin room
  socket.on('leaveAdminRoom', () => {
    socket.leave('adminRoom');
    console.log(`Socket ${socket.id} left adminRoom`);
  });
  // ==================================

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Note: socket.io automatically handles leaving rooms on disconnect
  });
});
// --- End Socket.io Setup ---

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true
}));

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// --- Make io accessible in routes ---
app.use((req, res, next) => {
  req.io = io;
  res.setHeader(
    'Content-Security-Policy',
    "img-src 'self' data: https://i.imgur.com;"
  );
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
});
// --- End middleware ---

// Initialize databases and start server
const startServer = async () => {
  try {
    // Initialiser les modèles et les connexions aux bases de données
    const models = await initializeModels();
    global.models = models;  // Rendre les modèles disponibles globalement
    
    // Routes
    app.use('/api', require('./routes/api'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/notifications', require('./routes/notificationRoutes'));

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!' });
    });

    // Servir le frontend React UNIQUEMENT en production, tout à la fin
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, 'client/build')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
      });
    }
    
    const PORT = process.env.PORT || 5001;
    // Use the HTTP server to listen, not the Express app 
    server.listen(PORT, () => { 
      console.log(`Server is running on port ${PORT}`);
      console.log('Socket.IO server initialized and listening.');
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Trop de tentatives, réessayez plus tard.'
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/admin/login', loginLimiter);

startServer(); 