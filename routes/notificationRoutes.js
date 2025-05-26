const express = require('express');
const { getModels } = require('../models');
const { auth } = require('../middleware/auth'); // Assuming client auth middleware
const { authAdmin } = require('../middleware/adminAuth'); // Corrected import path

/**
 * @swagger
 * tags:
 *   name: Notification API
 *   description: API de gestion des notifications
 * 
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer les notifications de l'utilisateur
 *     tags: [Notification API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut de lecture
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre maximum de notifications à récupérer
 *     responses:
 *       200:
 *         description: Liste des notifications récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       message:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Marquer des notifications comme lues
 *     tags: [Notification API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des IDs de notifications à marquer comme lues
 *     responses:
 *       200:
 *         description: Notifications marquées comme lues
 *       400:
 *         description: IDs de notifications invalides
 *       401:
 *         description: Non autorisé
 * 
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notification API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *       401:
 *         description: Non autorisé
 */

const router = express.Router();

// Middleware to determine user type and ID
const getUserInfo = (req, res, next) => {
  if (req.user) { // Client user from auth middleware
    req.userId = req.user.id;
    req.userModelName = 'User';
  } else if (req.admin) { // Admin/Tech user from authAdmin middleware
    req.userId = req.admin._id;
    req.userModelName = 'AdminUser';
  } else {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Middleware to protect routes - requires either client or admin login
const requireAuth = (req, res, next) => {
  // Use auth first, if it fails, try authAdmin
  auth(req, res, (clientErr) => {
    if (!req.user) { // No client user found, try admin
       authAdmin(req, res, (adminErr) => {
         if (!req.admin) { // No admin user either
            return res.status(401).json({ message: 'Authentication required' });
         } 
         // Admin user found, proceed
         getUserInfo(req, res, next);
       });
    } else {
      // Client user found, proceed
      getUserInfo(req, res, next);
    }
  });
};


// GET /api/notifications - Fetch user's notifications
router.get('/', requireAuth, async (req, res) => {
  const { Notification } = getModels();
  const { read } = req.query; // Filter by read status (e.g., ?read=false)
  const limit = parseInt(req.query.limit) || 20; // Limit results

  try {
    const query = {
      userRef: req.userId,
      userModel: req.userModelName,
    };

    if (read !== undefined) {
      query.read = read === 'true'; // Convert query string to boolean
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit)
      .lean(); // Use lean for performance

    // Optionally get unread count separately for efficiency if needed elsewhere
    const unreadCount = await Notification.countDocuments({
        ...query,
        read: false
    });

    res.json({ notifications, unreadCount });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// POST /api/notifications/mark-read - Mark specific notifications as read
router.post('/mark-read', requireAuth, async (req, res) => {
  const { Notification } = getModels();
  const { ids } = req.body; // Expecting an array of notification IDs

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid notification IDs provided' });
  }

  try {
    const result = await Notification.updateMany(
      { 
        _id: { $in: ids }, 
        userRef: req.userId, // Ensure user can only mark their own notifications
        userModel: req.userModelName,
        read: false 
      },
      { $set: { read: true } }
    );

    res.json({ message: 'Notifications marked as read', modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

// POST /api/notifications/mark-all-read - Mark all user's notifications as read
router.post('/mark-all-read', requireAuth, async (req, res) => {
  const { Notification } = getModels();

  try {
    const result = await Notification.updateMany(
      { 
        userRef: req.userId,
        userModel: req.userModelName,
        read: false 
      },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

module.exports = router; 