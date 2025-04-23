const { getModels } = require('../models');

// Create new ticket
exports.createTicket = async (req, res) => {
  try {
    const { Ticket } = getModels();
    
    // Add initial progress tracking entry
    const ticketData = {
      ...req.body,
      client: req.user.id,
      progress: [{
        status: 'logged',
        description: 'Ticket submitted',
        date: new Date(),
        updatedBy: req.user.id
      }]
    };
    
    const ticket = await Ticket.create(ticketData);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
};

// Get tickets (for clients, potentially showing company tickets for bosses)
exports.getTickets = async (req, res) => {
  try {
    const { Ticket, User } = getModels(); // Need User model as well
    const userId = req.user.id;
    const userIsBoss = req.user.isCompanyBoss;
    const userCompany = req.user.company;

    let myTickets = [];
    let companyTickets = [];

    if (userIsBoss && userCompany) {
      // --- Boss Logic --- 
      console.log(`User ${userId} is boss of company ${userCompany}. Fetching all company tickets.`);
      
      // 1. Find all users in the same company
      const companyUsers = await User.find({ company: userCompany }).select('_id');
      const companyUserIds = companyUsers.map(u => u._id);
      console.log(`Found ${companyUserIds.length} users in the company.`);

      // 2. Find all tickets for these users
      const allCompanyTickets = await Ticket.find({ client: { $in: companyUserIds } })
        .populate('client', 'firstName lastName email company isCompanyBoss') // Populate needed client fields
        .sort('-createdAt');
      console.log(`Found ${allCompanyTickets.length} total tickets for the company.`);

      // 3. Separate own tickets from others' tickets
      myTickets = allCompanyTickets.filter(ticket => ticket.client._id.toString() === userId.toString());
      companyTickets = allCompanyTickets.filter(ticket => ticket.client._id.toString() !== userId.toString());
      console.log(`Separated into ${myTickets.length} own tickets and ${companyTickets.length} other company tickets.`);

    } else {
      // --- Regular Client Logic --- 
      console.log(`User ${userId} is not a boss or has no company. Fetching only own tickets.`);
      myTickets = await Ticket.find({ client: userId })
        .populate('client', 'firstName lastName email company isCompanyBoss')
        .sort('-createdAt');
      companyTickets = []; // Ensure companyTickets is an empty array
    }

    // Return the structured response
    res.json({ myTickets, companyTickets });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get single ticket
exports.getTicket = async (req, res) => {
  try {
    const { Ticket, AdminUser, User } = getModels(); // Need User model too for company check
    
    // Fetch the ticket and populate the client FULLY (including company and isCompanyBoss)
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName email company isCompanyBoss') // Ensure company/isBoss is populated
      .populate('comments.user', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // --- Access Control Logic --- 
    const loggedInUser = req.user;
    const ticketClient = ticket.client; // Client associated with the ticket

    let hasAccess = false;

    // 1. Check if the logged-in user is the client who created the ticket
    if (ticketClient && ticketClient._id.toString() === loggedInUser.id.toString()) {
      hasAccess = true;
    }

    // 2. If not the creator, check if the logged-in user is a boss of the same company
    if (!hasAccess && 
        loggedInUser.isCompanyBoss && 
        loggedInUser.company && 
        ticketClient && // Ensure the ticket has a client associated
        ticketClient.company === loggedInUser.company) {
      hasAccess = true;
    }

    // 3. If still no access, deny
    if (!hasAccess) {
       console.log(`Access denied for user ${loggedInUser.id} to ticket ${ticket._id}. User isBoss: ${loggedInUser.isCompanyBoss}, User Company: ${loggedInUser.company}, Ticket Client Company: ${ticketClient?.company}`);
       return res.status(403).json({ message: 'Access denied' });
    }
    // --- End Access Control Logic ---

    // Manually fetch technician details from the Admin DB if assigned (keep this logic)
    let ticketObject = ticket.toObject(); 
    if (ticketObject.technician) {
      try {
        // Use AdminUser model to find technician
        const technicianDetails = await AdminUser.findById(ticketObject.technician).select('_id firstName lastName').lean();
        if (technicianDetails) {
          ticketObject.technician = technicianDetails; 
        } else {
          ticketObject.technician = null; 
        }
      } catch (adminDbError) {
        console.error('Error fetching technician details from admin DB:', adminDbError);
        ticketObject.technician = null; 
      }
    } else {
       ticketObject.technician = null; 
    }

    res.json(ticketObject); 

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
};

// Update ticket
exports.updateTicket = async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has permission to update
    if (req.user.role === 'client' && ticket.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update ticket
    Object.assign(ticket, req.body);
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Error updating ticket', error: error.message });
  }
};

// Add comment to ticket
exports.addComment = async (req, res) => {
  try {
    const { Ticket } = getModels();
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to the ticket
    if (req.user.role === 'client' && ticket.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    ticket.comments.push({
      user: req.user.id,
      content: req.body.content
    });

    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Assign technician to ticket
exports.assignTechnician = async (req, res) => {
  try {
    const { Ticket, User } = getModels();
    const ticket = await Ticket.findById(req.params.id);
    const technician = await User.findById(req.body.technicianId);

    if (!ticket || !technician) {
      return res.status(404).json({ message: 'Ticket or technician not found' });
    }

    if (technician.role !== 'technician') {
      return res.status(400).json({ message: 'User is not a technician' });
    }

    ticket.technician = technician._id;
    ticket.status = 'in-progress';
    
    // Add progress entry for technician assignment
    ticket.progress.push({
      status: 'assigned',
      description: `Ticket assigned to technician ${technician.firstName} ${technician.lastName}`,
      date: new Date(),
      updatedBy: req.user.id
    });
    
    // Add a second progress entry for status change to in-progress
    ticket.progress.push({
      status: 'in-progress',
      description: 'Ticket is now in progress',
      date: new Date(),
      updatedBy: req.user.id
    });
    
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({ message: 'Error assigning technician', error: error.message });
  }
}; 