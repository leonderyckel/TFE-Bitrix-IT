const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  description: String,
  subDescription: String,
  quantity: Number,
  unitPrice: Number,
  total: Number
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  quoteNumber: { type: String, required: true, unique: true },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: String,
  companyAddress: [String],
  companyVAT: String,
  clientName: String,
  clientAddress: String,
  clientVAT: String,
  date: String,
  dueDate: String,
  reference: String,
  salesRep: String,
  discount: Number,
  items: [quoteItemSchema],
  totalDiscount: Number,
  totalExclusive: Number,
  totalVAT: Number,
  subTotal: Number,
  totalDue: Number,
  notes: [String],
  bankDetails: String,
  pdfUrl: String,
  accepted: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  validUntil: { type: Date }, // Date d'expiration du devis
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quoteSchema.pre('save', function(next) {
  // Permettre toutes les modifications pour les nouveaux documents
  if (this.isNew) {
    this.updatedAt = new Date();
    return next();
  }
  
  // Pour les documents existants, vérifier si le devis est verrouillé
  if (this.isLocked) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['accepted', 'paid', 'updatedAt'];
    const unauthorizedModifications = modifiedPaths.filter(path => !allowedModifications.includes(path));
    
    if (unauthorizedModifications.length > 0) {
      const error = new Error(`Quote is locked and cannot be modified. Attempted to modify: ${unauthorizedModifications.join(', ')}`);
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  this.updatedAt = new Date();
  next();
});

quoteSchema.methods.lock = function() {
  this.isLocked = true;
  return this.save();
};

module.exports = quoteSchema; 