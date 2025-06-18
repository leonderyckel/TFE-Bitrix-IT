const { getModels } = require('../models');
const jwt = require('jsonwebtoken');
const { normalizeCompanyName } = require('../utils/normalizeCompany');

// Generate JWT token
const generateToken = (id, isAdmin = false) => {
  console.log('[generateToken] Using JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'MISSING!'); // Log secret presence
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { User, AdminUser } = getModels();
    const { email, password, firstName, lastName, role, company, address } = req.body;

    // Check if user already exists in either database
    const existingUser = await User.findOne({ email });
    const existingAdmin = await AdminUser.findOne({ email });

    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // If role is admin or technician, create in admin database
    if (role === 'admin' || role === 'technician') {
      const adminUser = await AdminUser.create({
        email,
        password,
        firstName,
        lastName,
        role,
        permissions: role === 'admin' ? ['manage_users', 'manage_tickets', 'view_analytics', 'manage_technicians'] : ['manage_tickets']
      });

      const token = generateToken(adminUser._id, true);

      return res.status(201).json({
        user: {
          id: adminUser._id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
          permissions: adminUser.permissions
        },
        token
      });
    }

    // Create regular user (always client role)
    const companyKey = company ? normalizeCompanyName(company) : undefined;
    let companyNameToUse = company;
    if (companyKey) {
      const existingCompanyUser = await User.findOne({ companyKey });
      if (existingCompanyUser && existingCompanyUser.company) {
        companyNameToUse = existingCompanyUser.company;
      }
    }
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      company: companyNameToUse,
      companyKey,
      address
    });

    const token = generateToken(user._id, false);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'client',
        company: user.company,
        address: user.address
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { User } = getModels();
    const { email, password } = req.body;

    // Chercher uniquement dans la base de données des utilisateurs réguliers
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Generate token (toujours isAdmin = false pour cette route)
    const token = generateToken(user._id, false);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'client',
        company: user.company
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de connexion', error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const { User, AdminUser } = getModels();
    const isAdmin = req.user.isAdmin;
    
    const user = await (isAdmin ? AdminUser : User).findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: isAdmin ? user.role : 'client',
      ...(isAdmin && { permissions: user.permissions }),
      ...(!isAdmin && { company: user.company })
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update user credentials
exports.updateCredentials = async (req, res) => {
  try {
    const { User } = getModels();
    const { credentials } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin users cannot update credentials' });
    }

    user.credentials = { ...user.credentials, ...credentials };
    await user.save();

    res.json({ message: 'Credentials updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating credentials', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { User } = getModels();
    const { firstName, lastName, email, company, vat, address, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mettre à jour les champs de base
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (company !== undefined) user.company = company;
    if (vat !== undefined) user.vat = vat;
    if (address !== undefined) user.address = address;

    // Gérer le changement de mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      
      // Valider la force du nouveau mot de passe
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ message: 'Password must contain at least one number' });
      }
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({ message: 'Password must contain at least one special character' });
      }
      
      const bcrypt = require('bcryptjs');
      const userWithPassword = await User.findById(req.user.id).select('+password');
      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Le hachage du mot de passe sera fait automatiquement par le pre-save middleware
      user.password = newPassword;
    }

    await user.save();

    // Retourner les données mises à jour (sans le mot de passe)
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      vat: user.vat,
      address: user.address,
      role: 'client',
      isCompanyBoss: user.isCompanyBoss
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
}; 