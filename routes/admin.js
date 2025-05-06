const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getModels } = require('../models');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter for custom SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper to send notification email
async function sendNotificationEmail(to, subject, text, currentStatus) {
  if (!to) return;
  const logoUrl = 'https://i.imgur.com/anor60B.jpeg';
  const allSteps = ['logged', 'assigned', 'quote sent', 'hardware ordered', 'scheduled', 'closed'];
  const statusLabels = {
    'logged': 'Logged',
    'assigned': 'Assigned',
    'quote sent': 'Quote Sent',
    'hardware ordered': 'Hardware Ordered',
    'scheduled': 'Scheduled',
    'closed': 'Closed',
    'in-progress': 'In Progress'
  };
  const current = (currentStatus||'').toLowerCase();
  const isClosed = current === 'closed';
  const firstLabel = text;
  // Si fermé, second rond vert 'Closed', sinon orange 'In Progress'
  const secondLabel = isClosed ? 'Closed' : 'In Progress';
  const secondColor = isClosed ? '#43a047' : '#FFA726';
  const secondLabelColor = isClosed ? '#43a047' : '#FFA726';
  const progressBarHtml = isClosed ? `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 32px 0;">
      <tr>
        <td align="center" style="padding: 0 5px; vertical-align: top; width: 40%;">
          <div style=\"width: 30px; height: 30px; border-radius: 50%; background: #1976d2; margin: 0 auto 6px auto;\"></div>
          <div style=\"font-size: 12px; color: #1976d2; text-align: center; font-weight: bold; line-height: 1.3;\">${firstLabel}</div>
        </td>
        <td align="center" style="width: 20%; padding: 0; vertical-align: middle;">
          <div style=\"height: 2px; background: #1976d2; width: 100%; margin-bottom: 20px; /* Ajuste pour centrer verticalement avec les labels */\"></div>
        </td>
        <td align="center" style="padding: 0 5px; vertical-align: top; width: 40%;">
          <div style=\"width: 30px; height: 30px; border-radius: 50%; background: #43a047; margin: 0 auto 6px auto;\"></div>
          <div style=\"font-size: 12px; color: #43a047; text-align: center; font-weight: bold; line-height: 1.3;\">Closed</div>
        </td>
      </tr>
    </table>
  ` : `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 32px 0;">
      <tr>
        <td align="center" style="padding: 0 5px; vertical-align: top; width: 40%;">
          <div style=\"width: 30px; height: 30px; border-radius: 50%; background: #1976d2; margin: 0 auto 6px auto;\"></div>
          <div style=\"font-size: 12px; color: #1976d2; text-align: center; font-weight: bold; line-height: 1.3;\">${firstLabel}</div>
        </td>
        <td align="center" style="width: 20%; padding: 0; vertical-align: middle;">
          <div style=\"height: 2px; background: #1976d2; width: 100%; margin-bottom: 20px; /* Ajuste pour centrer verticalement avec les labels */\"></div>
        </td>
        <td align="center" style="padding: 0 5px; vertical-align: top; width: 40%;">
          <div style=\"width: 30px; height: 30px; border-radius: 50%; background: ${secondColor}; margin: 0 auto 6px auto;\"></div>
          <div style=\"font-size: 12px; color: ${secondLabelColor}; text-align: center; font-weight: bold; line-height: 1.3;\">${secondLabel}</div>
        </td>
      </tr>
    </table>
  `;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: `
        <div style=\"font-family: Arial, sans-serif; color: #222; background: #f7f7f7; padding: 24px;\">
          <div style=\"background: #fff; border-radius: 8px; max-width: 480px; margin: auto; box-shadow: 0 2px 8px #0001; padding: 32px 24px;\">
            <div style=\"display: flex; align-items: center; margin-bottom: 16px;\">
              <img src=\"${logoUrl}\" alt=\"Bitrix Logo\" width=\"80\" height=\"80\" style=\"max-width: 80px; max-height: 80px; width: 80px; height: 80px; display: block; margin: 0; border: 0;\" />
              <h2 style=\"color: #1976d2; margin: 0 0 0 16px; font-size: 1.5em; flex: 1; text-align: left;\">Bitrix IT Support</h2>
            </div>
            ${progressBarHtml}
            <div style=\"font-size: 1.15em; color: #222; text-align: center; margin-bottom: 32px; margin-top: 24px;\">
              ${text.replace(/\n/g, '<br>')}
            </div>
            <hr style=\"margin: 32px 0; border: none; border-top: 1px solid #eee;\" />
            <div style=\"font-size: 0.95em; color: #888; text-align: center;\">
              This is an automatic notification from Bitrix IT Support.<br>
              Please do not reply directly to this email.
            </div>
          </div>
        </div>
      `
    });
    console.log(`[Email] Notification sent to ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send notification to ${to}:`, err.message);
  }
}

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
      // Include a generic notification text for direct PUT updates
      const notificationText = `Ticket ${updatedTicket.title || 'untitled'} details updated`;
      req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
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
  console.log(`[Admin Comment] Received comment request for ticket ${req.params.id} by admin ${req.admin._id}`); // Log start
  try {
    // Get models (Ticket from main connection, Notification from main, AdminUser from admin)
    const { Ticket, Notification, AdminUser } = getModels(); 
    const ticketId = req.params.id;
    let ticket = await Ticket.findById(ticketId); // Get the ticket instance
    
    if (!ticket) {
      console.log(`[Admin Comment] Ticket ${ticketId} not found.`);
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Add the comment using admin ID
    const newComment = {
      user: req.admin._id, // Use admin ID from auth middleware
      content: req.body.content,
      // userModel: 'AdminUser' // Store user model if needed for comment population
    };
    ticket.comments.push(newComment);
    console.log(`[Admin Comment] Pushed comment to ticket ${ticketId}. Saving...`);
    
    await ticket.save(); // Save the ticket with the new comment
    console.log(`[Admin Comment] Ticket ${ticketId} saved successfully.`);

    // --- Emit WebSocket Event & Create Notification --- 
    try {
      console.log(`[Admin Comment] Populating ticket ${ticketId} for notification/emit...`);
      // Fetch the updated ticket with populated fields for emitting and notification logic
      // Ensure client and potentially technician are populated
      const updatedTicket = await Ticket.findById(ticketId)
        .populate('client', '_id firstName lastName email') // Need client ID for notification
        .populate('comments.user', 'firstName lastName email') // Populate comment author if needed for WS
        .populate({ // Keep technician populated for WS event consistency
            path: 'technician',
            select: '_id firstName lastName email',
            model: AdminUser // Use AdminUser model for population
         })
        .lean();

      if (!updatedTicket) {
        console.error(`[Admin Comment] CRITICAL: Ticket ${ticketId} not found AFTER saving comment!`);
        throw new Error('Ticket not found after saving admin comment');
      }
      console.log(`[Admin Comment] Ticket ${ticketId} populated. Client: ${updatedTicket.client?._id}, Technician: ${updatedTicket.technician?._id}`);

      // Emit WebSocket event first
      if (req.io) {
        // Include notification text in the payload
        req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
        console.log(`[Admin Comment] Emitted ticket:updated event to room ${ticketId}`);
      } else {
        console.error('[Admin Comment] req.io not found.');
      }

      // Prepare notification details
      const commenterName = req.admin.firstName || 'Admin/Technician';
      // Use English and specific format, no ID
      const notificationText = `New comment from ${commenterName} on ticket ${updatedTicket.title || 'untitled'}`;
      const notificationLink = `/tickets/${ticketId}`;
      console.log(`[Admin Comment] Preparing notification. Text: "${notificationText}", Link: ${notificationLink}`);

      let notificationsToCreate = [];
      const commenterId = req.admin._id.toString();
      console.log(`[Admin Comment] Commenter ID: ${commenterId}`);

      // Notify the client (User model)
      if (updatedTicket.client && updatedTicket.client._id) {
          console.log(`[Admin Comment] Client found (${updatedTicket.client._id}). Adding notification.`);
          notificationsToCreate.push({
              userRef: updatedTicket.client._id,
              userModel: 'User', 
              text: notificationText,
              link: notificationLink
          });
      } else {
          console.warn(`[Admin Comment] Ticket ${ticketId} has no client assigned, cannot notify.`);
      }

      // Don't notify the technician about their own comment
      console.log(`[Admin Comment] Checking technician notification. Assigned Tech: ${updatedTicket.technician?._id}`);
      if (updatedTicket.technician && updatedTicket.technician._id.toString() !== commenterId) {
          console.log(`[Admin Comment] Technician (${updatedTicket.technician._id}) is different from commenter. Notifying technician is NOT YET IMPLEMENTED HERE for admin comments, only client.`);
          // If you want admins/techs to notify other admins/techs (except themselves), add logic here:
          // notificationsToCreate.push({ userRef: updatedTicket.technician._id, userModel: 'AdminUser', text: notificationText, link: adminNotificationLink });
      } else if (updatedTicket.technician) {
           console.log(`[Admin Comment] Technician ID is the same as commenter. Not notifying technician.`);
      }
      // Could potentially notify OTHER admins here if required

      // Create notifications in the database
      console.log(`[Admin Comment] Number of notifications to create: ${notificationsToCreate.length}`);
      if (notificationsToCreate.length > 0) {
        console.log(`[Admin Comment] Attempting to insert ${notificationsToCreate.length} notifications into DB...`);
        await Notification.insertMany(notificationsToCreate);
        console.log(`[Admin Comment] Successfully created ${notificationsToCreate.length} notifications in DB for ticket ${ticketId} admin comment`);
        // Send email notification to client if present
        if (updatedTicket.client && updatedTicket.client.email) {
          await sendNotificationEmail(
            updatedTicket.client.email,
            notificationText,
            notificationText,
            updatedTicket.status
          );
        }
      }

      // Send HTTP response back with the updated ticket
      console.log(`[Admin Comment] Sending HTTP response for ticket ${ticketId}`);
      res.json(updatedTicket); 

    } catch (error) {
      console.error('[Admin Comment] Error during notification/population stage:', error);
      // Fallback: send original ticket save result if population/notification failed
      res.status(500).json(ticket.toObject()); // Send plain object
    }
    // --- End Emit & Create ---

  } catch (error) {
    console.error('[Admin Comment] Top-level error adding comment:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
    
    // --- Emit WebSocket Event & Create Notification --- 
    const ticketId = req.params.id;
    const { Notification, AdminUser } = getModels(); 

    try {
      const updatedTicket = await Ticket.findById(ticketId)
        .populate('client', '_id firstName lastName email')
        .populate('comments.user', 'firstName lastName email') 
        .populate({
            path: 'technician',
            select: 'firstName lastName email',
            model: AdminUser
         })
        .lean();

      // Define notificationText BEFORE emitting
      let notificationText = '';
      if (status === 'assigned') {
        const techName = updatedTicket?.technician ? `${updatedTicket.technician.firstName} ${updatedTicket.technician.lastName}` : 'a technician';
        notificationText = `Ticket ${updatedTicket?.title || 'untitled'} assigned to ${techName}`;
      } else {
        const statusLabelsProgress = {
          'logged': 'logged',
          'quote-sent': 'quote sent',
          'hardware-ordered': 'hardware ordered',
          'scheduled': 'scheduled',
          'rescheduled': 'rescheduled',
          'closed': 'closed'
        };
        const statusLabel = statusLabelsProgress[status] || status;
        if (finalDescription && finalDescription.trim()) {
          if (finalDescription.trim().toLowerCase().includes(statusLabel.toLowerCase())) {
            notificationText = `Ticket ${updatedTicket?.title || 'untitled'} ${finalDescription.trim()}`;
          } else {
            notificationText = `Ticket ${updatedTicket?.title || 'untitled'} ${statusLabel} ${finalDescription.trim()}`;
          }
        } else {
          notificationText = `Ticket ${updatedTicket?.title || 'untitled'} ${statusLabel}`;
        }
      }

      if (updatedTicket) {
        // Emit WebSocket first
        if(req.io) {
            req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
            console.log(`Emitted ticket:updated event to room ${ticketId} after progress update`);
        } else {
            console.error('req.io not found in admin progress update');
        }

        // Create Notification for the client, ONLY IF STATUS IS NOT 'assigned'
        if (status !== 'assigned' && updatedTicket.client && updatedTicket.client._id) {
          const notificationLink = `/tickets/${ticketId}`;
          await Notification.create({
            userRef: updatedTicket.client._id,
            userModel: 'User',
            text: notificationText, // Use the already defined text
            link: notificationLink
          });
          if (updatedTicket.client.email) {
            await sendNotificationEmail(
              updatedTicket.client.email,
              notificationText,
              notificationText,
              updatedTicket.status
            );
          }
          console.log(`Created notification for client ${updatedTicket.client._id} about progress update (status: ${status}).`);
        } else if (status === 'assigned') {
          console.log(`Notification for 'assigned' status skipped in progress route, handled by /assign route.`);
        } else {
           console.warn(`Ticket ${ticketId} has no client assigned, cannot notify about progress (status: ${status}).`);
        }
      } else {
          console.error(`Failed to fetch updated ticket ${ticketId} after progress save.`);
      }
      res.json(updatedTicket || ticket.toObject());

    } catch(error) {
        console.error('Error during notification/emit after progress update:', error);
        res.status(500).json(ticket.toObject());
    }
    // --- End Emit & Create ---

  } catch (error) {
    console.error('Error adding progress update:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Assigner un technicien à un ticket
router.post('/tickets/:id/assign', async (req, res) => {
  console.log(`[Assign] Attempting assign for ticket ${req.params.id}`);
  try {
    const { Ticket, AdminUser, Notification } = getModels(); // Ensure Notification is here
    
    const ticket = await Ticket.findById(req.params.id);
    const technician = await AdminUser.findById(req.body.technicianId);
    
    if (!ticket) {
      console.error(`[Assign] Ticket ${req.params.id} not found.`);
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (!technician) {
      console.error(`[Assign] Technician ${req.body.technicianId} not found.`);
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    if (technician.role !== 'technician') {
      console.warn(`[Assign] User ${technician._id} is not a technician.`);
      return res.status(400).json({ message: 'User is not a technician' });
    }
    
    ticket.technician = technician._id;
    ticket.status = 'in-progress';
    console.log(`[Assign] Updating ticket ${ticket._id} status to in-progress and assigning tech ${technician._id}.`);
    // Add a progress entry for the assignment
    ticket.progress.push({
        status: 'assigned',
        description: `Assigned to technician ${technician.firstName} ${technician.lastName}`,
        date: new Date(),
        updatedBy: req.admin._id // Admin who performed the assignment
    });
    await ticket.save();
    
    // --- Emit WebSocket Event & Create Notification --- 
    const ticketId = req.params.id;

    try {
      console.log(`[Assign] Populating ticket ${ticketId} for notification/emit...`);
      const updatedTicket = await Ticket.findById(ticketId)
        .populate('client', '_id firstName lastName email') // Ensure email is populated
        .populate('comments.user', 'firstName lastName email') 
        .populate({
            path: 'technician',
            select: 'firstName lastName email',
            model: AdminUser
         })
        .lean();

      if (!updatedTicket) {
         console.error(`[Assign] CRITICAL: Failed to fetch updated ticket ${ticketId} after assignment save.`);
         // Still send response, but log critical error
         return res.status(500).json(ticket.toObject()); 
      }
      
      // Prepare notification text FIRST
      const techName = updatedTicket.technician ? `${updatedTicket.technician.firstName} ${updatedTicket.technician.lastName}` : 'a technician';
      const notificationText = `Ticket ${updatedTicket.title || 'untitled'} assigned to ${techName}`;
      console.log(`[Assign] Prepared notification text: "${notificationText}"`);

      // Emit WebSocket first (include notification text)
      if (req.io) {
          req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
          console.log(`[Assign] Emitted ticket:updated event to room ${ticketId}`);
      } else {
          console.error('[Assign] req.io not found');
      }
      
      // Create Notification for the client
      if (updatedTicket.client && updatedTicket.client._id) {
        console.log(`[Assign] Client found (${updatedTicket.client._id}). Creating notification...`);
        const notificationLink = `/tickets/${ticketId}`;
        await Notification.create({
          userRef: updatedTicket.client._id,
          userModel: 'User',
          text: notificationText, // Use the specific text
          link: notificationLink
        });
        console.log(`[Assign] Notification created for client ${updatedTicket.client._id}.`);
        
        // Send email notification to client
        if (updatedTicket.client.email) {
          console.log(`[Assign] Client email found (${updatedTicket.client.email}). Sending email...`);
          await sendNotificationEmail(
            updatedTicket.client.email,
            notificationText,
            notificationText,
            updatedTicket.status
          );
        } else {
          console.warn(`[Assign] Client email not found for client ${updatedTicket.client._id}. Cannot send email.`);
        }
      } else {
         console.warn(`[Assign] Ticket ${ticketId} has no client assigned, cannot notify.`);
      }
      
      // Send response
      console.log(`[Assign] Sending success response for ticket ${ticketId}.`);
      res.json(updatedTicket);

    } catch(error) {
        console.error('[Assign] Error during notification/emit stage:', error);
        // Fallback response even if notification fails
        res.status(500).json(ticket.toObject()); 
    }
    // --- End Emit & Create ---

  } catch (error) {
    console.error('[Assign] Top-level error assigning technician:', error);
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

    // --- Emit WebSocket Event & Create Notification --- 
    const ticketId = req.params.id;
    const { Notification, AdminUser } = getModels(); // Add Notification model
    
    try {
        const updatedTicket = await Ticket.findById(ticketId)
          .populate('client', '_id firstName lastName email') // Populate client
          .populate('comments.user', 'firstName lastName email') 
          .populate({
              path: 'technician',
              select: 'firstName lastName email',
              model: AdminUser // Use AdminUser model
           })
          .lean();

        if (updatedTicket) {
            // Emit WebSocket first
            if (req.io) {
                // Include notification text in the payload
                req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
                console.log(`Emitted ticket:updated event to room ${ticketId} after cancel`);
            } else {
                 console.error('req.io not found in admin cancel');
            }

            // Create Notification for the client
            if (updatedTicket.client && updatedTicket.client._id) {
              const adminName = req.admin.firstName || 'Admin';
              let notificationText = `Ticket ${updatedTicket.title || 'untitled'} cancelled by ${adminName}`;
              if (reason && reason.trim()) {
                notificationText += `: ${reason.trim()}`;
              }
              await Notification.create({
                userRef: updatedTicket.client._id,
                userModel: 'User',
                text: notificationText,
                // link: notificationLink // Omit link or set to null
              });
              // Send email notification to client
              if (updatedTicket.client.email) {
                await sendNotificationEmail(
                  updatedTicket.client.email,
                  notificationText,
                  notificationText,
                  updatedTicket.status
                );
              }
              console.log(`Created notification for client ${updatedTicket.client._id} about cancellation.`);
            } else {
               console.warn(`Ticket ${ticketId} has no client assigned, cannot notify about cancellation.`);
            }
        } else {
             console.error(`Failed to fetch updated ticket ${ticketId} after cancel save.`);
        }
        // Send response
        res.json(updatedTicket || ticket.toObject());

    } catch(error) {
        console.error('Error during notification/emit after cancellation:', error);
        res.status(500).json(ticket.toObject()); // Fallback response
    }
    // --- End Emit & Create ---

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
    
    // --- Emit WebSocket Event & Create Notification --- 
    const ticketId = req.params.id;
    const { Notification, AdminUser } = getModels(); // Add Notification model

    try {
        const updatedTicket = await Ticket.findById(ticketId)
          .populate('client', '_id firstName lastName email') // Populate client
          .populate('comments.user', 'firstName lastName email') 
          .populate({
              path: 'technician',
              select: 'firstName lastName email',
              model: AdminUser // Use AdminUser model
           })
          .lean();

        if (updatedTicket) {
            // Emit WebSocket first
            if (req.io) {
                // Include notification text in the payload
                req.io.to(ticketId).emit('ticket:updated', { ...updatedTicket, notificationText });
                console.log(`Emitted ticket:updated event to room ${ticketId} after close`);
            } else {
                 console.error('req.io not found in admin close');
            }

            // Create Notification for the client
            if (updatedTicket.client && updatedTicket.client._id) {
              let notificationText = `Ticket ${updatedTicket.title || 'untitled'} closed`;
              if (req.body.resolutionDescription && req.body.resolutionDescription.trim()) {
                notificationText += `: ${req.body.resolutionDescription.trim()}`;
              }
              const notificationLink = `/tickets/${ticketId}`;
              await Notification.create({
                userRef: updatedTicket.client._id,
                userModel: 'User',
                text: notificationText,
                link: notificationLink 
              });
              // Send email notification to client
              if (updatedTicket.client.email) {
                await sendNotificationEmail(
                  updatedTicket.client.email,
                  notificationText,
                  notificationText,
                  updatedTicket.status
                );
              }
              console.log(`Created notification for client ${updatedTicket.client._id} about closure.`);
            } else {
               console.warn(`Ticket ${ticketId} has no client assigned, cannot notify about closure.`);
            }
        } else {
             console.error(`Failed to fetch updated ticket ${ticketId} after close save.`);
        }
        // Send response
        res.json(updatedTicket || ticket.toObject());

    } catch(error) {
        console.error('Error during notification/emit after closure:', error);
        res.status(500).json(ticket.toObject()); // Fallback response
    }
    // --- End Emit & Create ---

  } catch (error) {
    console.error('Error closing ticket for admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les données sensibles d'un client
router.get('/client-data/:clientId', async (req, res) => {
  try {
    const { CompanySensitiveData } = getModels(); // Renamed
    
    const companyData = await CompanySensitiveData.findOne({ // Renamed
      clientId: req.params.clientId
    });

    if (!companyData) {
      return res.status(404).json({ message: 'Data not found' });
    }

    res.json(companyData.getDecryptedData());
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer/Mettre à jour les données sensibles d'un client
router.post('/client-data/:clientId', async (req, res) => {
  try {
    const { CompanySensitiveData } = getModels(); // Renamed
    
    const companyData = await CompanySensitiveData.findOneAndUpdate( // Renamed
      { clientId: req.params.clientId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(companyData.getDecryptedData());
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

// POST /api/admin/companies - Create a new company entry (INCHANGÉ)
router.post('/companies', async (req, res) => {
    const { companyName } = req.body;
    console.log(`[Admin Companies POST] Received request to create company: ${companyName}`); // Log 1: Entrée dans la route

    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
        console.log('[Admin Companies POST] Validation failed: Company name missing or invalid.');
        return res.status(400).json({ message: 'Company name is required and must be a non-empty string.' });
    }

    const trimmedCompanyName = companyName.trim();
    console.log(`[Admin Companies POST] Trimmed name: ${trimmedCompanyName}`); // Log 2: Nom traité

    try {
        console.log('[Admin Companies POST] Getting models...'); // Log 3: Avant getModels
        const { CompanySensitiveData } = getModels();
        console.log('[Admin Companies POST] Models retrieved. Checking for existing company...'); // Log 4: Avant findOne

        // Vérifie si une compagnie avec ce nom existe déjà
        const existingCompany = await CompanySensitiveData.findOne({ companyName: trimmedCompanyName });
        console.log('[Admin Companies POST] findOne completed. Existing company found:', existingCompany ? existingCompany._id : 'None'); // Log 5: Après findOne

        if (existingCompany) {
            console.log(`[Admin Companies POST] Company '${trimmedCompanyName}' already exists. Sending 409.`);
            return res.status(409).json({ message: `Company '${trimmedCompanyName}' already exists.` });
        }

        console.log(`[Admin Companies POST] Creating new CompanySensitiveData instance for '${trimmedCompanyName}'...`); // Log 6: Avant new
        const newCompanyEntry = new CompanySensitiveData({
            companyName: trimmedCompanyName,
        });
        console.log('[Admin Companies POST] Instance created. Attempting to save...'); // Log 7: Avant save

        await newCompanyEntry.save();
        console.log(`[Admin Companies POST] Save successful for '${trimmedCompanyName}', id: ${newCompanyEntry._id}. Sending 201.`); // Log 8: Après save

        res.status(201).json(newCompanyEntry.toJSON()); 

    } catch (error) {
        // Log d'erreur détaillé
        console.error('[Admin Companies POST] Error caught in POST /companies:', error);
        console.error('[Admin Companies POST] Error Name:', error.name);
        console.error('[Admin Companies POST] Error Message:', error.message);
        console.error('[Admin Companies POST] Error Stack:', error.stack);
        
        if (error.code === 11000) {
             console.log('[Admin Companies POST] Duplicate key error (11000). Sending 409.')
             return res.status(409).json({ message: 'A company with this identifier already exists.' });
        }
        console.log('[Admin Companies POST] Sending generic 500 error.');
        res.status(500).json({ message: 'Server error creating company', error: error.message });
    }
});

// GET /api/admin/companies-with-data - Fetch companies and their sensitive data (SIMPLIFIÉ)
router.get('/companies-with-data', async (req, res) => {
    console.log('[Admin Companies GET - Simple] Fetching companies from Sensitive Data only...');
    try {
        const { CompanySensitiveData } = getModels(); // Pas besoin de User ici

        // 1. Get unique company names ONLY from CompanySensitiveData
        const sensitiveDataCompanies = await CompanySensitiveData.distinct('companyName');
        console.log(`[Admin Companies GET - Simple] Found ${sensitiveDataCompanies.length} unique company names from Sensitive Data.`);

        const allCompanyNames = sensitiveDataCompanies.sort(); // Trie les noms trouvés

        // 2. Fetch sensitive data for each company name
        const companiesData = [];
        for (const name of allCompanyNames) {
            // Fetch associated sensitive data entries by companyName
            const sensitiveDataEntries = await CompanySensitiveData.find({ companyName: name });
            const sensitiveData = sensitiveDataEntries.map(entry => entry.toJSON()); // Applique les getters

            companiesData.push({
                name: name,
                // users: [], // On ne retourne plus les utilisateurs
                sensitiveData: sensitiveData // Retourne les données sensibles trouvées
            });
        }

        console.log(`[Admin Companies GET - Simple] Processed data for ${companiesData.length} companies.`);
        res.json(companiesData);

    } catch (error) {
        console.error('[Admin Companies GET - Simple] Error fetching companies data:', error);
        res.status(500).json({ message: 'Server error fetching company data', error: error.message });
    }
});

// GET /api/admin/companies/:companyName/diagram - Fetch diagram data for a company
router.get('/companies/:companyName/diagram', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    console.log(`[Admin Diagram GET] Fetching diagram for company: ${decodedCompanyName}`);

    try {
        const { CompanySensitiveData } = getModels();
        // Trouve la première entrée correspondante (normalement une seule par nom)
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            console.log(`[Admin Diagram GET] Company not found: ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Company not found.' });
        }

        console.log(`[Admin Diagram GET] Diagram data found for ${decodedCompanyName}`);
        // Retourne les données du diagramme (ou null si elles n'existent pas)
        res.json(companyEntry.diagramData || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }); // Retourne une structure vide par défaut

    } catch (error) {
        console.error(`[Admin Diagram GET] Error fetching diagram for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error fetching diagram data', error: error.message });
    }
});

// PUT /api/admin/companies/:companyName/diagram - Save/Update diagram data for a company
router.put('/companies/:companyName/diagram', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    const diagramData = req.body; // Attend l'objet JSON de React Flow { nodes, edges, viewport }
    console.log(`[Admin Diagram PUT] Saving diagram for company: ${decodedCompanyName}`);

    // Validation simple de la structure attendue
    if (!diagramData || typeof diagramData !== 'object' || !Array.isArray(diagramData.nodes) || !Array.isArray(diagramData.edges) || typeof diagramData.viewport !== 'object') {
        console.log('[Admin Diagram PUT] Invalid diagram data received.');
        return res.status(400).json({ message: 'Invalid diagram data format. Expected { nodes: [], edges: [], viewport: {} }.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        // Trouve et met à jour l'entrée correspondante
        const updatedCompanyEntry = await CompanySensitiveData.findOneAndUpdate(
            { companyName: decodedCompanyName }, // Filtre
            { $set: { diagramData: diagramData } }, // Mise à jour
            { new: true } // Retourne le document mis à jour
        );

        if (!updatedCompanyEntry) {
            console.log(`[Admin Diagram PUT] Company not found: ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Company not found.' });
        }

        console.log(`[Admin Diagram PUT] Diagram saved successfully for ${decodedCompanyName}`);
        res.status(200).json({ message: 'Diagram saved successfully.', diagramData: updatedCompanyEntry.diagramData });

    } catch (error) {
        console.error(`[Admin Diagram PUT] Error saving diagram for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error saving diagram data', error: error.message });
    }
});

// GET /api/admin/companies/:companyName/layout - Fetch tldraw layout data
router.get('/companies/:companyName/layout', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    console.log(`[Admin Layout GET] Fetching layout for company: ${decodedCompanyName}`);

    try {
        const { CompanySensitiveData } = getModels();
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            return res.status(404).json({ message: 'Company not found.' });
        }
        
        // Retourne les données layoutData (ou null)
        res.json(companyEntry.layoutData || null); // tldraw gère bien l'état initial si null

    } catch (error) {
        console.error(`[Admin Layout GET] Error fetching layout for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error fetching layout data', error: error.message });
    }
});

// PUT /api/admin/companies/:companyName/layout - Save/Update tldraw layout data
router.put('/companies/:companyName/layout', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    const layoutData = req.body; // Attend le snapshot JSON de tldraw
    console.log(`[Admin Layout PUT] Saving layout for company: ${decodedCompanyName}`);

    // Validation très basique (juste vérifier que c'est un objet)
    if (!layoutData || typeof layoutData !== 'object') {
        return res.status(400).json({ message: 'Invalid layout data format. Expected tldraw snapshot object.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        const updatedCompanyEntry = await CompanySensitiveData.findOneAndUpdate(
            { companyName: decodedCompanyName },
            { $set: { layoutData: layoutData } }, // Met à jour layoutData
            { new: true }
        );

        if (!updatedCompanyEntry) {
            return res.status(404).json({ message: 'Company not found.' });
        }

        console.log(`[Admin Layout PUT] Layout saved successfully for ${decodedCompanyName}`);
        res.status(200).json({ message: 'Layout saved successfully.' }); // Pas besoin de renvoyer les données

    } catch (error) {
        console.error(`[Admin Layout PUT] Error saving layout for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error saving layout data', error: error.message });
    }
});

// GET /api/admin/companies/:companyName/credentials - Fetch all credentials for a company
router.get('/companies/:companyName/credentials', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    console.log(`[Admin Credentials GET] Fetching credentials for company: ${decodedCompanyName}`);

    try {
        const { CompanySensitiveData } = getModels();
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            console.log(`[Admin Credentials GET] Company not found: ${decodedCompanyName}`);
            return res.json([]); // Return empty array if company or credentials don't exist
        }

        console.log(`[Admin Credentials GET] Credentials found for ${decodedCompanyName}`);
        res.json(companyEntry.credentials || []); 
    } catch (error) {
        console.error(`[Admin Credentials GET] Error fetching credentials for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error fetching credentials', error: error.message });
    }
});

// POST /api/admin/companies/:companyName/credentials - Add a new credential for a company
router.post('/companies/:companyName/credentials', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    const { service, username, password } = req.body; // 'service' from frontend is 'title'

    console.log(`[Admin Credentials POST] Adding credential for company: ${decodedCompanyName}`);

    if (!service || !username || !password) {
        return res.status(400).json({ message: 'Service (title), username, and password are required.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        let companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            console.log(`[Admin Credentials POST] Company not found: ${decodedCompanyName}. Cannot add credential.`);
            return res.status(404).json({ message: 'Company sensitive data entry not found. Cannot add credential.' });
        }

        const newCredential = { service, username, password }; // Encryption handled by schema setters
        companyEntry.credentials.push(newCredential);
        
        await companyEntry.save();
        
        const addedCredential = companyEntry.credentials[companyEntry.credentials.length - 1];

        console.log(`[Admin Credentials POST] Credential added successfully for ${decodedCompanyName}`);
        res.status(201).json(addedCredential.toJSON()); // Ensure getters are applied

    } catch (error) {
        console.error(`[Admin Credentials POST] Error adding credential for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error adding credential', error: error.message });
    }
});

// DELETE /api/admin/companies/:companyName/credentials/:credentialId - Delete a specific credential
router.delete('/companies/:companyName/credentials/:credentialId', async (req, res) => {
    const { companyName, credentialId } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);

    console.log(`[Admin Credentials DELETE] Deleting credential ${credentialId} for company: ${decodedCompanyName}`);

    if (!mongoose.Types.ObjectId.isValid(credentialId)) {
        return res.status(400).json({ message: 'Invalid credential ID format.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            console.log(`[Admin Credentials DELETE] Company not found: ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Company not found.' });
        }

        const credentialExists = companyEntry.credentials.some(cred => cred._id.toString() === credentialId);
        if (!credentialExists) {
            console.log(`[Admin Credentials DELETE] Credential ${credentialId} not found in company ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Credential not found.' });
        }
        
        companyEntry.credentials.pull({ _id: credentialId });
        await companyEntry.save();

        console.log(`[Admin Credentials DELETE] Credential ${credentialId} deleted successfully for ${decodedCompanyName}`);
        res.status(200).json({ message: 'Credential deleted successfully.' });

    } catch (error) {
        console.error(`[Admin Credentials DELETE] Error deleting credential for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error deleting credential', error: error.message });
    }
});

// GET /api/admin/companies/:companyName/remote-access - Fetch all remote access details for a company
router.get('/companies/:companyName/remote-access', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    console.log(`[Admin RemoteAccess GET] Fetching remote access details for company: ${decodedCompanyName}`);

    try {
        const { CompanySensitiveData } = getModels();
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry || !companyEntry.remoteAccessDetails) {
            console.log(`[Admin RemoteAccess GET] No remote access details found for: ${decodedCompanyName}`);
            return res.json([]); 
        }

        console.log(`[Admin RemoteAccess GET] Remote access details found for ${decodedCompanyName}`);
        res.json(companyEntry.remoteAccessDetails); // Getters s'appliquent grâce à toJSON dans le schéma
    } catch (error) {
        console.error(`[Admin RemoteAccess GET] Error fetching remote access details for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error fetching remote access details', error: error.message });
    }
});

// POST /api/admin/companies/:companyName/remote-access - Add a new remote access detail
router.post('/companies/:companyName/remote-access', async (req, res) => {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);
    // AJOUTER accessType à la déstructuration
    const { title, identifier, password, notes, accessType } = req.body;

    console.log(`[Admin RemoteAccess POST] Adding remote access detail for company: ${decodedCompanyName}`);

    if (!title || !identifier) { 
        return res.status(400).json({ message: 'Title and Identifier are required for remote access details.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        let companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry) {
            console.log(`[Admin RemoteAccess POST] Company not found: ${decodedCompanyName}. Cannot add remote access detail.`);
            return res.status(404).json({ message: 'Company sensitive data entry not found.' });
        }

        const newRemoteAccess = {
            title,
            accessType: accessType || 'other', // S'assurer qu'il y a une valeur par défaut si non fournie
            identifier, 
            password,   
            notes       
        };
        companyEntry.remoteAccessDetails.push(newRemoteAccess);
        
        await companyEntry.save();
        
        const addedRemoteAccess = companyEntry.remoteAccessDetails[companyEntry.remoteAccessDetails.length - 1];

        console.log(`[Admin RemoteAccess POST] Remote access detail added successfully for ${decodedCompanyName}`);
        res.status(201).json(addedRemoteAccess.toJSON()); // Assure que les getters sont appliqués

    } catch (error) {
        console.error(`[Admin RemoteAccess POST] Error adding remote access detail for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error adding remote access detail', error: error.message });
    }
});

// DELETE /api/admin/companies/:companyName/remote-access/:accessId - Delete a specific remote access detail
router.delete('/companies/:companyName/remote-access/:accessId', async (req, res) => {
    const { companyName, accessId } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);

    console.log(`[Admin RemoteAccess DELETE] Deleting remote access detail ${accessId} for company: ${decodedCompanyName}`);

    if (!mongoose.Types.ObjectId.isValid(accessId)) {
        return res.status(400).json({ message: 'Invalid remote access ID format.' });
    }

    try {
        const { CompanySensitiveData } = getModels();
        const companyEntry = await CompanySensitiveData.findOne({ companyName: decodedCompanyName });

        if (!companyEntry || !companyEntry.remoteAccessDetails) {
            console.log(`[Admin RemoteAccess DELETE] Company or remote access details not found for: ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Company or remote access details not found.' });
        }

        const initialCount = companyEntry.remoteAccessDetails.length;
        companyEntry.remoteAccessDetails.pull({ _id: accessId });
        
        if (companyEntry.remoteAccessDetails.length === initialCount) {
            console.log(`[Admin RemoteAccess DELETE] Remote access detail ${accessId} not found for company ${decodedCompanyName}`);
            return res.status(404).json({ message: 'Remote access detail not found.' });
        }
        
        await companyEntry.save();

        console.log(`[Admin RemoteAccess DELETE] Remote access detail ${accessId} deleted successfully for ${decodedCompanyName}`);
        res.status(200).json({ message: 'Remote access detail deleted successfully.' });

    } catch (error) {
        console.error(`[Admin RemoteAccess DELETE] Error deleting remote access detail for ${decodedCompanyName}:`, error);
        res.status(500).json({ message: 'Server error deleting remote access detail', error: error.message });
    }
});

module.exports = router; 