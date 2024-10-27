require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/upload');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Middleware
app.use(express.json());

// Routes
app.use('/upload', uploadRoutes);
app.use('/api', apiRoutes);

// Start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
