const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initializeModels } = require('./models');
// Import http and socket.io
const http = require('http');
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

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

  // Example: Joining a room based on ticket ID (we'll implement this later)
  socket.on('joinTicketRoom', (ticketId) => {
    socket.join(ticketId); // Join a room named after the ticket ID
    console.log(`Socket ${socket.id} joined room ${ticketId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
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