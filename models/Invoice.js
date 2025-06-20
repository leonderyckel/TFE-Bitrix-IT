const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  subDescription: String,
  quantity: Number,
  unitPrice: Number,
  total: Number
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
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
  items: [invoiceItemSchema],
  totalDiscount: Number,
  totalExclusive: Number,
  totalVAT: Number,
  subTotal: Number,
  totalDue: Number,
  notes: [String],
  bankDetails: String,
  pdfUrl: String,
  paid: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.pre('save', function(next) {
  // Permettre toutes les modifications pour les nouveaux documents
  if (this.isNew) {
    this.updatedAt = new Date();
    return next();
  }
  
  // Pour les documents existants, vérifier si la facture est verrouillée
  if (this.isLocked) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['paid', 'updatedAt'];
    const unauthorizedModifications = modifiedPaths.filter(path => !allowedModifications.includes(path));
    
    if (unauthorizedModifications.length > 0) {
      const error = new Error(`Invoice is locked and cannot be modified. Attempted to modify: ${unauthorizedModifications.join(', ')}`);
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  this.updatedAt = new Date();
  next();
});

invoiceSchema.methods.lock = function() {
  this.isLocked = true;
  return this.save();
};

module.exports = invoiceSchema; 