const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const userController = require('../controllers/userController');
const ticketController = require('../controllers/ticketController');

/**
 * @swagger
 * tags:
 *   name: Public API
 *   description: API publique pour les clients
 * 
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouveau client
 *     tags: [Public API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - companyName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               companyName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client créé avec succès
 *       400:
 *         description: Données invalides
 * 
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Public API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 * 
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Récupérer les tickets du client
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des tickets récupérée
 *       401:
 *         description: Non autorisé
 * 
 *   post:
 *     summary: Créer un nouveau ticket
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Récupérer tous les clients (Admin ou Client)
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clients récupérée
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/users/credentials:
 *   put:
 *     summary: Mettre à jour les identifiants ou le mot de passe
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Identifiants mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Récupérer le détail d'un ticket
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du ticket
 *     responses:
 *       200:
 *         description: Détail du ticket récupéré
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Ticket non trouvé
 *   put:
 *     summary: Mettre à jour un ticket
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Ticket non trouvé
 * 
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Ajouter un commentaire à un ticket
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Commentaire ajouté
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Ticket non trouvé
 * 
 * @swagger
 * /api/tickets/{id}/assign:
 *   post:
 *     summary: Assigner un technicien à un ticket (public)
 *     tags: [Public API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               technicianId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Technicien assigné
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Ticket ou technicien non trouvé
 */

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

// GET /api/clients - Récupérer tous les clients
// (Ajoute ici la route si elle existe, sinon à ajouter dans le code)

module.exports = router; 