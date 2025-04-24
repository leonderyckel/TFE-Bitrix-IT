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
    // Récupérer les modèles depuis les connexions appropriées
    const { Ticket, AdminUser } = getModels(); // Assurez-vous que AdminUser est bien récupéré ici

    const tickets = await Ticket.find({})
      .populate('client', 'firstName lastName email company')
      // --- MODIFICATION ICI ---
      // Spécifier explicitement le modèle pour populate 'technician'
      .populate({
          path: 'technician',
          select: 'firstName lastName email', // Champs à sélectionner
          model: AdminUser // Utiliser le modèle AdminUser de la connexion admin
       })
      // --- FIN MODIFICATION ---
      .sort('-createdAt');
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets for admin:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message }); // Added error details
  }
});

// Récupérer un ticket spécifique
router.get('/tickets/:id', async (req, res) => {
  try {
    const { Ticket, AdminUser } = getModels(); // Assurez-vous que AdminUser est bien récupéré ici
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName email company')
      // --- MODIFICATION ICI ---
      // Spécifier explicitement le modèle pour populate 'technician'
      .populate({
          path: 'technician',
          select: 'firstName lastName email', // Champs à sélectionner
          model: AdminUser // Utiliser le modèle AdminUser de la connexion admin
       })
       // --- FIN MODIFICATION ---
      .populate('comments.user', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message }); // Added error details
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
    
    // --- Emit WebSocket Event ---
    const ticketId = req.params.id;
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss')
      .populate('comments.user', 'firstName lastName email') 
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser
       })
      .lean();

    if (updatedTicket) {
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId} after PUT update`);
    }
    // --- End Emit WebSocket Event ---

    res.json(updatedTicket || ticket);
  } catch (error) {
    console.error('Error updating ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un commentaire à un ticket
router.post('/tickets/:id/comments', async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticketId = req.params.id;
    let ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Add the comment using admin ID
    ticket.comments.push({
      user: req.admin._id, // Make sure this is correct field for admin comments
      content: req.body.content
    });
    
    await ticket.save();

    // --- Emit WebSocket Event ---
    // Fetch the updated ticket with necessary populated fields for the client view
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss') // Populate client
      .populate('comments.user', 'firstName lastName email') // Populate comment author
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser // Assuming AdminUser model is needed
       })
      .lean(); // Use lean for plain JS object

    if (updatedTicket) {
      // Emit to the room named after the ticket ID
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId}`);
    }
    // --- End Emit WebSocket Event ---
    
    // Send the updated ticket back in the HTTP response
    res.json(updatedTicket || ticket); // Send updated if fetched, otherwise original save result

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
    
    // --- Emit WebSocket Event ---
    const ticketId = req.params.id;
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss')
      .populate('comments.user', 'firstName lastName email') 
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser
       })
      .lean();

    if (updatedTicket) {
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId} after progress update`);
    }
    // --- End Emit WebSocket Event ---

    // Populate necessary fields before sending back (REMOVED - Already done above)
    // await ticket.populate([
    //   { path: 'client', select: 'firstName lastName email company' },
    //   { path: 'comments.user', select: 'firstName lastName email' }
    // ]);

    // Return the updated and populated ticket
    res.json(updatedTicket || ticket); // Send updated if fetched
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
    
    // --- Emit WebSocket Event ---
    const ticketId = req.params.id;
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss')
      .populate('comments.user', 'firstName lastName email') 
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser
       })
      .lean();

    if (updatedTicket) {
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId} after assign`);
    }
    // --- End Emit WebSocket Event ---

    res.json(updatedTicket || ticket);
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

    // --- Emit WebSocket Event ---
    const ticketId = req.params.id;
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss')
      .populate('comments.user', 'firstName lastName email') 
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser
       })
      .lean();

    if (updatedTicket) {
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId} after cancel`);
    }
    // --- End Emit WebSocket Event ---

    res.json(updatedTicket || ticket);
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
    
    // --- Emit WebSocket Event ---
    const ticketId = req.params.id;
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('client', 'firstName lastName email company isCompanyBoss')
      .populate('comments.user', 'firstName lastName email') 
      .populate({
          path: 'technician',
          select: 'firstName lastName email',
          model: global.models.AdminUser
       })
      .lean();

    if (updatedTicket) {
      req.io.to(ticketId).emit('ticket:updated', updatedTicket);
      console.log(`Emitted ticket:updated event to room ${ticketId} after close`);
    }
    // --- End Emit WebSocket Event ---

    res.json(updatedTicket || ticket);
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
    const clients = await User.find({ role: 'client' })
                          .select('_id firstName lastName email company address isCompanyBoss') // Added isCompanyBoss
                          .lean();
    
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
    .select('title client progress technician'); // Sélectionner les champs nécessaires + technician

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
        const technicianId = ticket.technician ? ticket.technician.toString() : null;
        events.push({
          id: ticket._id,
          title: `${clientName} - ${ticketTitle}`, // Keep original title for basic tooltip/accessibility
          clientName: clientName,
          ticketTitle: ticketTitle,
          start: latestScheduledProgress.scheduledDate, // Utiliser la date trouvée
          end: new Date(latestScheduledProgress.scheduledDate.getTime() + 60 * 60 * 1000), // Ajouter 1h pour l'affichage
          description: latestScheduledProgress.description || 'Scheduled event', // Utiliser la description du progrès
          resource: { ticketId: ticket._id }, // Ressource optionnelle
          technicianId: technicianId
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

// --- CLIENT CRUD by Admin ---

// POST /admin/clients - Create a new client user
router.post('/clients', async (req, res) => {
  // Check if the logged-in user is a technician
  if (req.admin.role !== 'technician') {
      return res.status(403).json({ message: 'Forbidden: Only technicians can create clients.' });
  }
  
  try {
    const { User, AdminUser } = getModels();
    // Destructure address
    const { email, password, firstName, lastName, company, address } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Missing required fields: email, password, firstName, lastName.' });
    }

    // Check if user already exists in either database
    const existingUser = await User.findOne({ email });
    const existingAdmin = await AdminUser.findOne({ email });

    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Create the new client user in the main User collection
    const newUser = await User.create({
      email,
      password, // Password will be hashed by the pre-save hook in User model
      firstName,
      lastName,
      company, // Company is optional based on schema, handle if required
      address, // Add address
      role: 'client' // Explicitly set role
    });

    // Return only necessary info, exclude password
    res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        company: newUser.company,
        address: newUser.address, // Return address
        role: newUser.role
    });

  } catch (error) {
    console.error('Error creating client by admin:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while creating client', error: error.message });
  }
});

// PUT /admin/clients/:clientId - Update an existing client user
router.put('/clients/:clientId', async (req, res) => {
  try {
    const { User } = getModels();
    const { clientId } = req.params;
    // Destructure isCompanyBoss from body, remove role
    const { firstName, lastName, email, company, address, isCompanyBoss } = req.body;

    // --- Security Check: Only Admins or Technicians can change the boss flag ---
    const allowedRoles = ['admin', 'technician'];
    // Check if isCompanyBoss is provided and user is not an allowed role
    if (isCompanyBoss !== undefined && !allowedRoles.includes(req.admin.role)) {
        return res.status(403).json({ message: 'Forbidden: Only administrators or technicians can change the boss status.' });
    }
    // Basic type validation if provided
    if (isCompanyBoss !== undefined && typeof isCompanyBoss !== 'boolean') {
        return res.status(400).json({ message: 'Invalid value for isCompanyBoss. Must be true or false.' });
    }
    // --- End Security Check ---

    // Construct update object (role is no longer updated here)
    const updateData = {
      firstName,
      lastName,
      email,
      company,
      address
    };

    // Add isCompanyBoss to updateData ONLY if it was provided AND the user is an allowed role
    if (isCompanyBoss !== undefined && allowedRoles.includes(req.admin.role)) {
        updateData.isCompanyBoss = isCompanyBoss;
    }

    // Remove undefined fields to avoid overwriting existing data with null
    // (Except isCompanyBoss which might intentionally be set to false)
    Object.keys(updateData).forEach(key => {
        if (key !== 'isCompanyBoss' && updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      clientId,
      { $set: updateData },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Return updated user data (including the boss status)
    res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        company: updatedUser.company,
        address: updatedUser.address,
        role: updatedUser.role, // Role is always 'client' now
        isCompanyBoss: updatedUser.isCompanyBoss // Include the boss status
    });

  } catch (error) {
    console.error('Error updating client:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Server error while updating client', error: error.message });
  }
});

// DELETE /admin/clients/:clientId - Delete a client user
router.delete('/clients/:clientId', async (req, res) => {
    // Only admins should delete clients
    if (req.admin.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete clients.' });
    }

    try {
        const { User, Ticket } = getModels();
        const { clientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            return res.status(400).json({ message: 'Invalid client ID format' });
        }

        // Find the client to delete
        const client = await User.findById(clientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({ message: 'Client not found' });
        }

        // --- Consideration: What to do with tickets associated with this client? ---
        // Option 1: Delete them (potentially destructive)
        // await Ticket.deleteMany({ client: clientId });
        // Option 2: Unassign them or assign to a default admin (safer)
        // await Ticket.updateMany({ client: clientId }, { $unset: { client: "" } }); // Example: remove client ref
        // Option 3: Prevent deletion if tickets exist (safest)
        const associatedTickets = await Ticket.countDocuments({ client: clientId });
        if (associatedTickets > 0) {
             return res.status(400).json({ message: `Cannot delete client: They have ${associatedTickets} associated ticket(s). Reassign or delete tickets first.` });
        }
        // --- End Consideration ---

        // If deletion is allowed (e.g., no associated tickets)
        await User.findByIdAndDelete(clientId);

        res.status(200).json({ message: 'Client deleted successfully' });

    } catch (error) {
        console.error('Error deleting client by admin:', error);
        res.status(500).json({ message: 'Server error while deleting client', error: error.message });
    }
});

// --- END CLIENT CRUD ---

module.exports = router; 