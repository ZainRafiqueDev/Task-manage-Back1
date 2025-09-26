import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true }, // short title
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    receivers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one receiver is required",
      },
    },

    message: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["info", "warning", "alert", "task", "report", "asset"],
      default: "info",
      lowercase: true,
    },

    // users who have read this notification
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Optional deep-link and meta
    actionLink: { type: String, trim: true }, // e.g. "/tasks/:id" or external link
    meta: { type: mongoose.Schema.Types.Mixed }, // free-form JSON for UI

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      lowercase: true,
    },

    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for current user read state will be set by controller
notificationSchema.virtual("isRead").get(function () {
  return this._isRead || false;
});

// Indexes
notificationSchema.index({ receivers: 1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance helper: mark read by a user
notificationSchema.methods.markRead = function (userId) {
  const uid = userId.toString();
  if (!this.readBy.map(String).includes(uid)) {
    this.readBy.push(userId);
  }
  return this.save();
};

// Static helper: send notification
notificationSchema.statics.send = async function ({ sender, receivers, title, message, type, actionLink, meta, priority, expiresAt }) {
  if (!receivers || receivers.length === 0) throw new Error("Receivers required");
  return this.create({ sender, receivers, title, message, type, actionLink, meta, priority, expiresAt });
};

export default mongoose.model("Notification", notificationSchema);
