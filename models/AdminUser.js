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

const adminUserSchema = new mongoose.Schema({
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
    enum: ['admin', 'technician'],
    required: true
  },
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_tickets', 'view_analytics', 'manage_technicians']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = adminUserSchema; 