const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    const conn = await mongoose.createConnection(uri);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = { connectDB }; 