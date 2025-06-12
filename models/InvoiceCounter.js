const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1 }
});

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema); 