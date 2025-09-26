// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc Protect routes (require login)
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check for Bearer token in Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Or check HttpOnly cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ No token found
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Fetch user (exclude password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * @desc Restrict route access to specific roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

export default { protect, authorizeRoles };

// Optional: Team Lead specific middleware for additional validation
export const requireTeamLead = (req, res, next) => {
  if (req.user && req.user.role === 'teamlead') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Team Lead role required.'
    });
  }
};

// Optional: Project ownership validation middleware
export const validateProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({
      _id: projectId,
      teamLead: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not the team lead for this project'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating project ownership',
      error: error.message
    });
  }
};