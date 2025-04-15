const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Drop the problematic index
      await mongoose.connection.collection('users').dropIndex('userId_1');
      console.log('Successfully dropped userId_1 index');
    } catch (error) {
      console.error('Error dropping index:', error.message);
    }
    
    // Close the connection
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 