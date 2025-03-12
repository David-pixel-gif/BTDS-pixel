// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import route files
const authRoutes = require('./routes/authRoutes'); 

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Required to parse JSON payloads

// Use routes
app.use('/api/auth', authRoutes); 

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/brain_tumor_system', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
