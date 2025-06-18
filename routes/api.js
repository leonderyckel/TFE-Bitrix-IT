const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const userController = require('../controllers/userController');
const ticketController = require('../controllers/ticketController');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');
const { getModels } = require('../models/index');

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
router.get('/users/me', auth, userController.getMe);
router.put('/users/profile', auth, userController.updateProfile);
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

// Route pour afficher le HTML d'une facture pour le client connecté
router.get('/invoice/html/:id', auth, async (req, res) => {
  try {
    const { Invoice, Ticket, User } = getModels();
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    // Vérifie que la facture appartient bien au client connecté
    if (invoice.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const ticket = await Ticket.findById(invoice.ticket);
    const user = await User.findById(invoice.client);

    // Lis le template HTML
    const templatePath = path.join(__dirname, '../templates/invoiceTemplate.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // Prépare les données comme dans la route admin
    const data = {
      ...invoice.toObject(),
      clientName: user.firstName + ' ' + user.lastName,
      clientAddress: user.address,
      clientVAT: user.vat,
      reference: invoice.reference || (ticket ? ticket.title : ''),
    };

    const html = template(data);
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: 'Error generating invoice HTML.' });
  }
});

// Route pour récupérer les factures sauvegardées du client connecté
router.get('/billing/invoices', auth, async (req, res) => {
  try {
    const { Ticket, Invoice } = getModels();
    // On récupère les factures dont le ticket appartient au client connecté et qui sont marquées comme saved
    const tickets = await Ticket.find({ client: req.user.id, 'invoice.saved': true }).select('_id');
    const ticketIds = tickets.map(t => t._id);
    const invoices = await Invoice.find({ ticket: { $in: ticketIds } }).sort({ date: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Error loading invoices.' });
  }
});

// Route pour récupérer les devis sauvegardés du client connecté
router.get('/billing/quotes', auth, async (req, res) => {
  try {
    const { Ticket, Quote } = getModels();
    // On récupère les devis dont le ticket appartient au client connecté et qui sont marqués comme saved
    const tickets = await Ticket.find({ client: req.user.id, 'quote.saved': true }).select('_id');
    const ticketIds = tickets.map(t => t._id);
    const quotes = await Quote.find({ ticket: { $in: ticketIds } }).sort({ date: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: 'Error loading quotes.' });
  }
});

// Route pour afficher le HTML d'un devis pour le client connecté
router.get('/quote/html/:id', auth, async (req, res) => {
  try {
    const { Quote, Ticket, User } = getModels();
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });

    // Vérifie que le devis appartient bien au client connecté
    if (quote.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const ticket = await Ticket.findById(quote.ticket);
    const user = await User.findById(quote.client);

    // Lis le template HTML
    const templatePath = path.join(__dirname, '../templates/invoiceTemplate.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // Prépare les données comme dans la route admin
    const data = {
      ...quote.toObject(),
      clientName: user.firstName + ' ' + user.lastName,
      clientAddress: user.address,
      clientVAT: user.vat,
      reference: quote.reference || (ticket ? ticket.title : ''),
      isQuote: true // Flag pour différencier du template facture
    };

    const html = template(data);
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: 'Error generating quote HTML.' });
  }
});

// Route pour marquer un devis comme accepté
router.patch('/quote/mark-accepted/:id', auth, async (req, res) => {
  try {
    const { Quote } = getModels();
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });
    if (quote.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    quote.accepted = true;
    await quote.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating quote status.' });
  }
});

// Route pour marquer un devis comme accepté et payé
router.patch('/quote/mark-accepted-paid/:id', auth, async (req, res) => {
  try {
    const { Quote } = getModels();
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });
    if (quote.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    quote.accepted = true;
    quote.paid = true;
    await quote.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating quote status.' });
  }
});

router.patch('/invoice/mark-paid/:id', auth, async (req, res) => {
  try {
    const { Invoice } = getModels();
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    if (invoice.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    invoice.paid = true;
    await invoice.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating invoice status.' });
  }
});

module.exports = router; 