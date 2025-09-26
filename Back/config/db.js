// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(` Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Extra safety: monitor connection events
mongoose.connection.on("connected", () => {
  console.log(" Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error(` Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn(" Mongoose disconnected");
});

export default connectDB;
