// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      unique: true,
      index: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      enum: ["admin", "teamlead", "employee"],
      default: "employee",
    },

    cnic: {
      type: String,
      required: [true, "CNIC is required"],
      unique: true,
      index: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d$/, "Please enter a valid CNIC format (12345-1234567-1)"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^(03[0-9]{9}|(\+923[0-9]{9}))$/, "Please enter a valid Pakistani phone number"],
    },

    isActive: { type: Boolean, default: true },

    assignedAssets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Asset" }],

    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    lastLogin: { type: Date, default: null },
    profilePicture: { type: String, default: null },

    designation: { type: String, trim: true, default: "Employee" },
    joinedAt: { type: Date, default: Date.now },
    employmentStatus: {
      type: String,
      enum: ["active", "on-leave", "resigned", "terminated"],
      default: "active",
    },
    lastSeen: { type: Date, default: null },

    roleHistory: [
      {
        role: { type: String, enum: ["admin", "teamlead", "employee"] },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ teamLead: 1, role: 1 });

// Virtual: team members
userSchema.virtual("teamMembers", {
  ref: "User",
  localField: "_id",
  foreignField: "teamLead",
});

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Role history tracking
userSchema.pre("save", async function (next) {
  if (this.isModified("role")) {
    this.roleHistory = this.roleHistory || [];
    this.roleHistory.push({ role: this.role, changedAt: new Date() });
  }
  next();
});

// Methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.safeProfile = function () {
  const u = this.toObject();
  delete u.password;
  delete u.resetPasswordToken;
  delete u.resetPasswordExpire;
  return u;
};

// Statics - Modified to get all employees based on role only
userSchema.statics.findAllEmployees = function () {
  return this.find({
    role: "employee",
  }).select("-password");
};

userSchema.statics.findAvailableEmployees = function () {
  return this.find({
    role: "employee",
    isActive: true,
    $or: [{ teamLead: { $exists: false } }, { teamLead: null }],
  }).select("-password");
};

userSchema.statics.findTeamMembers = function (teamLeadId) {
  return this.find({
    teamLead: teamLeadId,
    role: "employee",
    isActive: true,
  }).select("-password");
};

export default mongoose.model("User", userSchema);