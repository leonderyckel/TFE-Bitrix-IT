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

// Get all tickets
exports.getTickets = async (req, res) => {
  try {
    const { Ticket } = getModels();
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'technician') {
      query.$or = [
        { technician: req.user.id },
        { technician: null }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('client', 'firstName lastName email company')
      .sort('-createdAt');

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get single ticket
exports.getTicket = async (req, res) => {
  try {
    // Assuming getModels() can access models from both databases
    // If not, we need the correct way to access AdminUser model from the second DB
    const { Ticket, AdminUser } = getModels(); 
    
    // Fetch the ticket *without* populating technician initially
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'firstName lastName email company')
      // .populate('technician', 'firstName lastName email') // Removed populate for cross-DB reference
      .populate('comments.user', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has access to the ticket (Client access check)
    if (req.user.role === 'client' && ticket.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Manually fetch technician details from the Admin DB if assigned
    let ticketObject = ticket.toObject(); // Convert to plain object to modify

    if (ticketObject.technician) {
      try {
        const technicianDetails = await AdminUser.findById(ticketObject.technician).select('_id firstName lastName').lean();
        if (technicianDetails) {
          ticketObject.technician = technicianDetails; // Replace ID with details object
        } else {
          // Technician ID exists but not found in AdminUser DB (handle gracefully)
          ticketObject.technician = null; 
        }
      } catch (adminDbError) {
        console.error('Error fetching technician details from admin DB:', adminDbError);
        // Decide how to handle error - maybe return ticket without technician details
        ticketObject.technician = null; 
      }
    } else {
       ticketObject.technician = null; // Ensure it's explicitly null if not assigned
    }

    res.json(ticketObject); // Send the modified object
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