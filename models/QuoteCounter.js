const mongoose = require('mongoose');

const quoteCounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1 }
});

module.exports = mongoose.model('QuoteCounter', quoteCounterSchema); 