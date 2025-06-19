const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Custom email validation function that accepts .co.za domains and is case-insensitive
const validateEmail = (email) => {
  if (!email) return false;
  
  // Convert to lowercase for validation
  const emailLower = email.toLowerCase();
  
  // Basic email format validation (case-insensitive)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(emailLower)) {
    return false;
  }
  
  // Additional validation for specific domains like .co.za
  const domainPart = emailLower.split('@')[1];
  if (!domainPart) return false;
  
  // Allow common TLDs and multi-part domains like .co.za
  const validDomainRegex = /^[a-z0-9.-]+\.([a-z]{2,}|[a-z]{2}\.[a-z]{2})$/;
  return validDomainRegex.test(domainPart);
};

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validateEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'client',
    immutable: true
  },
  company: {
    type: String,
    trim: true
  },
  companyKey: {
    type: String,
    trim: true,
    index: true
  },
  address: {
    type: String,
    trim: true
  },
  vat: {
    type: String,
    trim: true,
    default: ''
  },
  isCompanyBoss: {
    type: Boolean,
    default: false
  },
  credentials: {
    type: Map,
    of: String,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }]
});

// Combine password hashing and role setting in a single pre-save hook
userSchema.pre('save', async function(next) {
  // Set role to 'client'
  this.role = 'client';
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = userSchema; 