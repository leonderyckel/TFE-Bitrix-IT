const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getModels } = require('../models');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Route de connexion admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt for:', email);
    
    // Obtenir le modèle AdminUser
    const { AdminUser } = getModels();
    
    // Vérifier que le modèle existe
    if (!AdminUser) {
      console.error('AdminUser model not found');
      return res.status(500).json({ message: 'Server error: AdminUser model not found' });
    }
    
    // Rechercher l'admin par email
    const admin = await AdminUser.findOne({ email }).select('+password');

    if (!admin) {
      console.log('Admin not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Création du token avec l'information isAdmin: true
    const token = jwt.sign(
      { 
        id: admin._id.toString(),
        isAdmin: true
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    console.log('Admin login successful for:', admin.email);
    console.log('Token generated:', { id: admin._id.toString(), isAdmin: true });

    res.json({
      admin: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Routes protégées par authentification admin
router.use(adminAuth);

// Récupérer le profil admin
router.get('/profile', (req, res) => {
  try {
    // req.admin est défini par le middleware adminAuth
    const admin = req.admin;
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Retourner les données de l'admin (sans le mot de passe)
    res.json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// TICKET MANAGEMENT ROUTES

// Récupérer tous les tickets
router.get('/tickets', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const tickets = await Ticket.find({})
      .populate('client', 'firstName lastName email company')
      .populate('technician', 'firstName lastName email')
      .sort('-createdAt');
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un ticket spécifique
router.get('/tickets/:id', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName email company')
      .populate('technician', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un ticket
router.put('/tickets/:id', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Update ticket
    Object.assign(ticket, req.body);
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un commentaire à un ticket
router.post('/tickets/:id/comments', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    ticket.comments.push({
      user: req.admin._id,
      content: req.body.content
    });
    
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error adding comment for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une mise à jour de progression à un ticket
router.post('/tickets/:id/progress', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const { status, description: providedDescription, technicianId: reqTechnicianId, scheduledDate: reqScheduledDate } = req.body;

    // Validate the status
    const validStatuses = ['logged', 'assigned', 'quote-sent', 'hardware-ordered', 'scheduled', 'rescheduled', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status', valid: validStatuses });
    }
    
    let finalDescription = providedDescription;
    let technicianId = null;
    let scheduledDate = null;

    // Handle 'assigned' status
    if (status === 'assigned') {
      if (!reqTechnicianId) {
        return res.status(400).json({ message: 'Technician ID is required when assigning' });
      }
      if (!mongoose.Types.ObjectId.isValid(reqTechnicianId)) {
         return res.status(400).json({ message: 'Invalid Technician ID format' });
      }
      technicianId = reqTechnicianId;
      // Optionally generate default description if none provided for assignment
      if (!finalDescription) {
         finalDescription = `Ticket assigned`; // Or fetch tech name if needed
      }
    }

    // Handle 'scheduled' or 'rescheduled' status
    if (['scheduled', 'rescheduled'].includes(status)) {
      if (!reqScheduledDate) {
        return res.status(400).json({ message: 'Scheduled date is required for this status' });
      }
      scheduledDate = new Date(reqScheduledDate);
      if (isNaN(scheduledDate.getTime())) { // Check if the date is valid
        return res.status(400).json({ message: 'Invalid scheduled date format' });
      }
      // --- CHANGE HERE: Generate default description if none provided (in English) ---
      if (!finalDescription) {
        const formattedDate = scheduledDate.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }); // Changed locale to en-US
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize status
        finalDescription = `${statusLabel} on ${formattedDate}`; // Changed "le" to "on"
      }
      // --- END CHANGE ---
    }

    // --- CHANGE HERE: Final check for description after potential defaults ---
    // Vérifier que la description est présente (après génération potentielle par défaut)
    if (!finalDescription) {
       // Generate a very basic default if somehow still missing
       finalDescription = `Status updated to ${status}`;
       // Or return an error if a description is absolutely mandatory even after defaults
       // return res.status(400).json({ message: 'Description could not be generated and is required' });
    }
    // --- END CHANGE ---

    // Prepare progress update data
    const progressData = {
      status: status,
      description: finalDescription, // Use the final description
      date: new Date(),
      updatedBy: req.admin._id
    };

    // Add scheduledDate if applicable
    if (scheduledDate) {
      progressData.scheduledDate = scheduledDate;
    }

    // Add progress update
    ticket.progress.push(progressData);
    
    // Update ticket status and technician if needed
    if (status === 'closed') {
      ticket.status = 'closed';
    } else if (status === 'assigned' && technicianId) {
      ticket.status = 'in-progress'; // Keep or adjust as needed
      ticket.technician = technicianId; // Assign technician
    }
    
    await ticket.save();
    
    // Populate necessary fields before sending back
    await ticket.populate([
      { path: 'client', select: 'firstName lastName email company' },
      { path: 'comments.user', select: 'firstName lastName email' }
    ]);

    // Return the updated and populated ticket
    res.json(ticket);
  } catch (error) {
    console.error('Error adding progress update:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Assigner un technicien à un ticket
router.post('/tickets/:id/assign', async (req, res) => {
  try {
    const { Ticket, AdminUser } = getModels();
    
    const ticket = await Ticket.findById(req.params.id);
    const technician = await AdminUser.findById(req.body.technicianId);
    
    if (!ticket || !technician) {
      return res.status(404).json({ message: 'Ticket or technician not found' });
    }
    
    if (technician.role !== 'technician') {
      return res.status(400).json({ message: 'User is not a technician' });
    }
    
    ticket.technician = technician._id;
    ticket.status = 'in-progress';
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error assigning technician for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Annuler un ticket
router.post('/tickets/:id/cancel', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const { reason } = req.body; // Get reason from request body

    // Check if reason is provided
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return res.status(400).json({ message: 'Cancellation reason is required.' });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if ticket is already cancelled or closed
    if (['closed', 'cancelled'].includes(ticket.status)) {
      return res.status(400).json({ message: `Ticket is already ${ticket.status}` });
    }

    ticket.status = 'cancelled';
    // Optionally add a dedicated field later: ticket.cancellationReason = reason.trim();
    await ticket.save();

    // Add automatic comment for cancellation including the reason
    ticket.comments.push({
      user: req.admin._id,
      content: `Ticket cancelled by admin. Reason: ${reason.trim()}`
    });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clôturer un ticket
router.post('/tickets/:id/close', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    ticket.status = 'closed';
    ticket.resolution = {
      description: req.body.resolutionDescription,
      resolvedAt: new Date(),
      resolvedBy: req.admin._id
    };
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    console.error('Error closing ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les données sensibles d'un client
router.get('/client-data/:clientId', async (req, res) => {
  try {
    const { ClientSensitiveData } = getModels();
    
    const clientData = await ClientSensitiveData.findOne({
      clientId: req.params.clientId
    });

    if (!clientData) {
      return res.status(404).json({ message: 'Data not found' });
    }

    res.json(clientData.getDecryptedData());
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer/Mettre à jour les données sensibles d'un client
router.post('/client-data/:clientId', async (req, res) => {
  try {
    const { ClientSensitiveData } = getModels();
    
    const clientData = await ClientSensitiveData.findOneAndUpdate(
      { clientId: req.params.clientId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(clientData.getDecryptedData());
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer la liste des administrateurs
router.get('/admins', async (req, res) => {
  try {
    const { AdminUser } = getModels();
    
    const admins = await AdminUser.find({}, '-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer la liste des clients (utilisateurs avec rôle client)
router.get('/clients', async (req, res) => {
  try {
    // Assurez-vous que getModels() peut accéder au modèle User de la base de données client
    const { User } = getModels(); 
    
    // Récupérer uniquement les utilisateurs avec le rôle 'client'
    // Sélectionnez les champs nécessaires pour l'affichage (id, nom, email)
    const clients = await User.find({ role: 'client' }).select('_id firstName lastName email').lean();
    
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients for admin:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des clients', error: error.message });
  }
});

// Créer un nouvel administrateur
router.post('/admins', async (req, res) => {
  try {
    const { AdminUser } = getModels();
    
    const admin = new AdminUser(req.body);
    await admin.save();
    res.status(201).json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouveau ticket pour un client spécifique (par l'admin)
router.post('/tickets', async (req, res) => {
  try {
    const { title, description, priority, category, clientId } = req.body;
    // Assurez-vous que getModels() peut accéder aux deux modèles
    const { Ticket, User } = getModels(); 

    // Validation simple des champs requis
    if (!title || !description || !priority || !category || !clientId) {
      return res.status(400).json({ message: 'Missing required fields (title, description, priority, category, clientId)' });
    }

    // Vérifier que le clientId correspond à un utilisateur existant
    const clientExists = await User.findById(clientId);
    if (!clientExists) {
      return res.status(404).json({ message: 'Client specified by clientId not found' });
    }
    // Optionnel : Vérifier que l'utilisateur trouvé est bien un client
    // if (clientExists.role !== 'client') {
    //   return res.status(400).json({ message: 'Specified user is not a client' });
    // }

    // Créer le ticket
    const newTicket = new Ticket({
      title,
      description,
      priority,
      category,
      client: clientId, // Assigner le client spécifié
      status: 'open', // Statut initial
      progress: [{
        status: 'logged',
        description: 'Ticket created by admin',
        date: new Date(),
        updatedBy: req.admin._id // L'admin qui a créé le ticket
      }]
    });

    await newTicket.save();
    res.status(201).json(newTicket);

  } catch (error) {
    console.error('Error creating ticket for client by admin:', error);
    res.status(500).json({ message: 'Server error creating ticket', error: error.message });
  }
});

// Route pour récupérer les tickets à afficher dans le calendrier
router.get('/calendar-tickets', async (req, res) => {
  console.log('[Calendar] Received request for calendar events'); // Log request start
  try {
    const { Ticket } = getModels();

    // Trouver les tickets qui ont une étape 'scheduled' ou 'rescheduled' avec une scheduledDate
    // On ne récupère que les champs nécessaires pour l'efficacité
    const tickets = await Ticket.find({
      status: { $ne: 'cancelled' }, // Exclure les tickets annulés
      progress: {
        $elemMatch: {
          status: { $in: ['scheduled', 'rescheduled'] },
          scheduledDate: { $exists: true, $ne: null }
        }
      }
    })
    .populate('client', 'firstName lastName') // Populater le client pour le titre
    .select('title client progress'); // Sélectionner les champs nécessaires

    console.log(`[Calendar] Found ${tickets.length} potential tickets`); // Log number of tickets found

    const events = [];
    tickets.forEach(ticket => {
      // Trouver la dernière date planifiée dans l'historique de progression
      let latestScheduledProgress = null;
      for (let i = ticket.progress.length - 1; i >= 0; i--) {
        const progress = ticket.progress[i];
        if (['scheduled', 'rescheduled'].includes(progress.status) && progress.scheduledDate) {
          latestScheduledProgress = progress;
          break; // Prendre la plus récente
        }
      }

      console.log(`[Calendar] Processing ticket ${ticket._id}. Latest progress:`, latestScheduledProgress);

      if (latestScheduledProgress) {
        const clientName = ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A';
        const ticketTitle = ticket.title;
        events.push({
          id: ticket._id,
          title: `${clientName} - ${ticketTitle}`, // Keep original title for basic tooltip/accessibility
          clientName: clientName,
          ticketTitle: ticketTitle,
          start: latestScheduledProgress.scheduledDate, // Utiliser la date trouvée
          end: new Date(latestScheduledProgress.scheduledDate.getTime() + 60 * 60 * 1000), // Ajouter 1h pour l'affichage
          description: latestScheduledProgress.description || 'Scheduled event', // Utiliser la description du progrès
          resource: { ticketId: ticket._id } // Ressource optionnelle
        });
      }
    });

    console.log(`[Calendar] Generated ${events.length} events:`, events); // Log generated events

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar tickets:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements du calendrier' });
  }
});

module.exports = router; 