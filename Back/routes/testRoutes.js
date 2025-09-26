// Backend/routes/testRoutes.js
import express from 'express';
import connectDB from '../config/db.js';
import mongoose from 'mongoose';

const router = express.Router();

// Test database connection endpoint
router.get('/test-db', async (req, res) => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test the database connection
    await connectDB();
    
    // If we get here, connection succeeded
    res.status(200).json({
      message: "API is running now...",
      database: "Connected",
      timestamp: new Date().toISOString(),
      mongoState: mongoose.connection.readyState,
      mongoStateText: getConnectionStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name,
      port: mongoose.connection.port
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    res.status(500).json({
      message: "API is running but database connection failed",
      database: "Disconnected", 
      error: error.message,
      timestamp: new Date().toISOString(),
      mongoState: mongoose.connection.readyState,
      mongoStateText: getConnectionStateText(mongoose.connection.readyState),
      envCheck: process.env.MONGO_URI ? "MONGO_URI is set" : "MONGO_URI is missing",
      mongoUriStart: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 30) + "..." : "Not found"
    });
  }
});

// Debug environment variables endpoint
router.get('/debug', (req, res) => {
  res.status(200).json({
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    },
    mongoConnection: {
      mongoUriExists: !!process.env.MONGO_URI,
      mongoUriStart: process.env.MONGO_URI ? 
        process.env.MONGO_URI.substring(0, 30) + "..." : 
        "MONGO_URI not found",
      mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0
    },
    allEnvKeys: {
      total: Object.keys(process.env).length,
      mongoRelated: Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('mongo') || 
        key.toLowerCase().includes('database') || 
        key.toLowerCase().includes('db')
      )
    },
    timestamp: new Date().toISOString()
  });
});

// Helper function to get readable connection state
function getConnectionStateText(state) {
  const states = {
    0: 'Disconnected',
    1: 'Connected', 
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[state] || 'Unknown';
}

export default router;
