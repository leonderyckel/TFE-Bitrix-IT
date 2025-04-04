const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const userController = require('../controllers/userController');
const ticketController = require('../controllers/ticketController');

// Auth routes
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.get('/auth/me', auth, userController.getMe);

// User routes
router.put('/users/credentials', auth, userController.updateCredentials);

// Ticket routes
router.post('/tickets', auth, requireRole(['client']), ticketController.createTicket);
router.get('/tickets', auth, ticketController.getTickets);
router.get('/tickets/:id', auth, ticketController.getTicket);
router.put('/tickets/:id', auth, ticketController.updateTicket);
router.post('/tickets/:id/comments', auth, ticketController.addComment);
router.post('/tickets/:id/assign', auth, requireRole(['admin', 'technician']), ticketController.assignTechnician);

module.exports = router; 