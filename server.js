const dotenv = require('dotenv');
dotenv.config(); // Load environment variables FIRST

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeModels } = require('./models');
// Import http and socket.io
const http = require('http');
const { Server } = require("socket.io");

// Initialize Express app
const app = express();
// Create HTTP server
const server = http.createServer(app);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], // Allow frontend origins
    methods: ["GET", "POST"]
  }
});

// Basic connection listener
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

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
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Make io accessible in routes ---
app.use((req, res, next) => {
  req.io = io;
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
    
    const PORT = process.env.PORT || 5001;
    // Use the HTTP server to listen, not the Express app directly
    server.listen(PORT, () => { 
      console.log(`Server is running on port ${PORT}`);
      console.log('Socket.IO server initialized and listening.');
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer(); 