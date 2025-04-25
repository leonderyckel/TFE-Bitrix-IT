const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Dynamically references either 'User' (client) or 'AdminUser'
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel' // Tells Mongoose which model to look at based on userModel field
    },
    // Specifies which model the userRef refers to
    userModel: {
        type: String,
        required: true,
        enum: ['User', 'AdminUser'] // Ensure only valid model names are used
    },
    text: { 
        type: String, 
        required: true 
    },
    read: { 
        type: Boolean, 
        default: false 
    },
    // Optional link for navigation (e.g., '/tickets/:id' or '/admin/tickets/:id')
    link: { 
        type: String 
    },
}, { 
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for efficient querying of user's notifications, sorted by creation date
notificationSchema.index({ userRef: 1, userModel: 1, createdAt: -1 });
// Index to quickly find unread notifications for a user
notificationSchema.index({ userRef: 1, userModel: 1, read: 1, createdAt: -1 });

// 'Notification' will create a 'notifications' collection in MongoDB
// module.exports = mongoose.model('Notification', notificationSchema); 

// Export the schema definition object instead of the compiled model
module.exports = notificationSchema.obj; 