// models/Report.js
import mongoose from "mongoose";

// ----------------------
// Feedback Subdocument
// ----------------------
const feedbackSchema = new mongoose.Schema(
  {
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin or TeamLead
    role: { type: String, enum: ["admin", "teamlead"], required: true },
    comment: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 }, // Optional rating
  },
  { timestamps: true }
);

// ----------------------
// Submission History Subdocument
// ----------------------
const submissionHistorySchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    submittedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    fromRole: {
      type: String,
      enum: ["employee", "teamlead", "admin"],
      required: true
    },
    toRole: {
      type: String,
      enum: ["employee", "teamlead", "admin"],
      required: true
    }
  },
  { _id: true }
);

// ----------------------
// Main Report Schema
// ----------------------
const reportSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["daily", "monthly"], required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    forUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    content: { type: String, required: true, trim: true },

    tasksCompleted: { type: Number, default: 0, min: 0 },
    tasksPending: { type: Number, default: 0, min: 0 },

    projectStats: {
      done: { type: Number, default: 0, min: 0 },
      inProgress: { type: Number, default: 0, min: 0 },
      selected: { type: Number, default: 0, min: 0 },
    },

    completionStatus: {
      type: String,
      enum: ["pending", "complete", "incomplete"],
      default: "pending",
    },

    feedbacks: [feedbackSchema],

    status: {
      type: String,
      enum: ["submitted", "reviewed", "approved"],
      default: "submitted",
    },

    parentReport: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },

    // Submission and forwarding fields
    forwardedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    submittedAt: { type: Date },
    submissionHistory: [submissionHistorySchema],

    // Existing fields
    attachments: [
      {
        filename: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: Date,
      },
    ],

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: Date,
  },
  { timestamps: true }
);

// ----------------------
// Indexes
// ----------------------
reportSchema.index({ createdBy: 1 });
reportSchema.index({ forUser: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ forwardedTo: 1 });
reportSchema.index({ "submissionHistory.submittedBy": 1 });
reportSchema.index({ "submissionHistory.submittedTo": 1 });

// ----------------------
// Virtual for getting current forwarded users
// ----------------------
reportSchema.virtual('currentForwardedUsers', {
  ref: 'User',
  localField: 'forwardedTo',
  foreignField: '_id'
});

// ----------------------
// Instance method to add submission to history
// ----------------------
reportSchema.methods.addSubmission = function(submittedBy, submittedTo, fromRole, toRole) {
  if (!this.submissionHistory) {
    this.submissionHistory = [];
  }
  
  this.submissionHistory.push({
    submittedBy,
    submittedTo: Array.isArray(submittedTo) ? submittedTo : [submittedTo],
    submittedAt: new Date(),
    fromRole,
    toRole
  });
  
  this.forwardedTo = Array.isArray(submittedTo) ? submittedTo : [submittedTo];
  this.submittedAt = new Date();
  this.status = "submitted";
};

// ----------------------
// Instance method to get latest submission
// ----------------------
reportSchema.methods.getLatestSubmission = function() {
  if (!this.submissionHistory || this.submissionHistory.length === 0) {
    return null;
  }
  
  return this.submissionHistory[this.submissionHistory.length - 1];
};

export default mongoose.model("Report", reportSchema);