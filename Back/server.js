// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import ProjectRoutes from "./routes/ProjectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teamLeadRoutes from "./routes/teamleadRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notifcationRoutes from "./routes/notifcationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.get("/", (req, res) => {
  res.send("API is running now..");
});

/* ---------------- MIDDLEWARE ---------------- */

// CORS (updated for Vercel deployment)
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      // Add your Vercel frontend URL here once deployed
      "https://your-frontend-domain.vercel.app"
    ],
    credentials: true,
  })
);

// Helmet
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);

// Rate limiting
if (process.env.NODE_ENV === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests from this IP, please try again later.",
    })
  );
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(hpp());
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

/* ---------------- ROUTES ---------------- */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teamlead", teamLeadRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notifcationRoutes);
app.use("/api/users", userRoutes);

/* ---------------- ERROR HANDLING ---------------- */

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

/* ---------------- GRACEFUL SHUTDOWN ---------------- */
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

/* ---------------- START SERVER OR EXPORT FOR VERCEL ---------------- */
const PORT = process.env.PORT || 5000;

// Only start server if not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
}

// Always export the app for Vercel
export default app;