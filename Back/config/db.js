// config/db.js - Optimized for Vercel Serverless
import mongoose from "mongoose";

// Global variable to cache the connection
let cachedConnection = null;

const connectDB = async () => {
  // If we have a cached connection and it's ready, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log(" Using existing database connection");
    return cachedConnection;
  }

  // If MongoDB URI is not provided
  if (!process.env.MONGO_URI) {
    console.error(" MONGO_URI environment variable is not defined");
    throw new Error("MONGO_URI environment variable is not defined");
  }

  try {
    console.log(" Creating new database connection...");
    
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0,   // Disable mongoose buffering  
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 1, // Limit to 1 connection for serverless
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    
    cachedConnection = conn;
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error(" Database connection error:", error.message);
    // Don't exit process in serverless environment
    throw error;
  }
};

export default connectDB;


