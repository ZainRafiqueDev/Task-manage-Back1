// config/db.js - Optimized for Vercel Serverless
import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
  // Reuse existing connection if already open
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log(" Using existing database connection");
    return cachedConnection;
  }

  if (!process.env.MONGO_URI) {
    console.error(" MONGO_URI environment variable is not defined");
    throw new Error("MONGO_URI environment variable is not defined");
  }

  try {
    console.log(" Creating new database connection...");

    // Modern options (Mongoose 6+ sets most defaults automatically)
    const opts = {
      maxPoolSize: 1, // limit connections for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4 only
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);

    cachedConnection = conn;
    console.log(` MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(" Database connection error:", error.message);
    throw error;
  }
};

export default connectDB;
