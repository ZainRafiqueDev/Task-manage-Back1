import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["laptop", "imac", "mouse", "keyboard", "headphone", "charger", "bag"],
      required: true,
      lowercase: true,
    },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, unique: true, required: true, trim: true },
    specification: { type: String, trim: true },

    processor: { type: String, trim: true },
    ram: { type: String, trim: true },
    rom: { type: String, trim: true },

    conditionStatus: {
      type: String,
      enum: ["good", "bad", "repair", "broken"],
      default: "good",
    },

    assignmentStatus: {
      type: String,
      enum: ["assigned", "unassigned"],
      default: "unassigned",
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    returnRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    returnRequestedAt: Date,
    returnReason: { type: String, trim: true },
    returnStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "cancelled", "returned"],
      default: "none",
    },
    returnRequestedNotes: { type: String, trim: true },

    returnedAt: Date,
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    plannedReturnDate: Date,

    // 🆕 HISTORY FIELD
    history: [
      {
        action: { type: String, required: true }, // e.g. 'assigned', 'returned', 'created'
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        notes: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);


// Indexes
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ assignmentStatus: 1 });
assetSchema.index({ returnStatus: 1 });

// Instance method: request return
assetSchema.methods.requestReturn = function (userId, reason, notes) {
  if (!this.assignedTo) throw new Error("Asset is not assigned");
  if (this.assignedTo.toString() !== userId.toString()) {
    // allow teamlead to request as well if they have asset assigned to them
    // or if you want teamlead to request for their team member, controller should authorize
  }
  this.returnRequestedBy = userId;
  this.returnRequestedAt = new Date();
  this.returnReason = reason || "";
  this.returnRequestedNotes = notes || "";
  this.returnStatus = "requested";
  return this.save();
};

// Instance method: admin approves return
assetSchema.methods.approveReturn = function (adminId) {
  this.returnStatus = "approved";
  // keep returnedAt for when asset actually handed over
  this.returnedBy = adminId;
  this.returnedAt = new Date();
  // unassign asset
  this.assignedTo = null;
  this.assignmentStatus = "unassigned";
  return this.save();
};

export default mongoose.model("Asset", assetSchema);
