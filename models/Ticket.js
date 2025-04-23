const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'waiting-client', 'diagnosing', 'resolved', 'closed', 'cancelled'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  category: {
    type: String,
    required: true,
    enum: ['hardware', 'software', 'network', 'security', 'other']
  },
  suggestedDate: {
    type: Date,
    required: false
  },
  progress: [{
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['logged', 'assigned', 'quote-sent', 'hardware-ordered', 'scheduled', 'closed'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId
    },
    scheduledDate: {
      type: Date
    }
  }],
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    description: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  invoice: {
    generated: {
      type: Boolean,
      default: false
    },
    amount: Number,
    sageInvoiceId: String,
    generatedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = ticketSchema; 