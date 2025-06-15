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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = invoiceSchema; 