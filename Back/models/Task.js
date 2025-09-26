import mongoose from "mongoose";

// Log and employeeResponse remain mostly as you wrote them
const logSchema = new mongoose.Schema(
  {
    update: { type: String, required: true }, // What was updated/done
    startTime: Date,
    endTime: Date,
    totalTime: { type: Number, default: 0 }, // minutes
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

logSchema.pre("save", function (next) {
  if (this.startTime && this.endTime) {
    this.totalTime = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

const employeeResponseSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String, enum: ["progress", "issue", "pending-info"], default: "progress" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    specialInstructions: { type: String, trim: true },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Employee
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, // Project link

    status: {
      type: String,
      enum: ["pending", "in-progress", "review", "completed", "blocked"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    dueDate: Date,
    estimatedStartDate: Date,
    projectLink: { type: String, trim: true },

    // Attachments (store path/URL or GridFS ref)
    attachments: [{ filename: String, url: String, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, uploadedAt: Date }],

    // Tags/labels and blockers
    labels: [String],
    blockers: [{ message: String, reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, createdAt: Date }],

    logs: [logSchema],
    employeeResponses: [employeeResponseSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // cached / derived field for quick reads
    actualHours: { type: Number, default: 0 }, // hours computed from logs (minutes -> hours)
  },
  { timestamps: true }
);

// Indexes
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });

// Instance: add a log (keeps actualHours in sync)
taskSchema.methods.addLog = async function (logData) {
  this.logs.push(logData);
  // update actualHours in hours
  const totalMinutes = this.logs.reduce((sum, l) => sum + (l.totalTime || 0), 0);
  this.actualHours = Math.round((totalMinutes / 60) * 100) / 100; // 2 decimal hours
  return this.save();
};

// Instance: calculate total logged minutes (utility)
taskSchema.methods.totalLoggedMinutes = function () {
  return this.logs.reduce((sum, l) => sum + (l.totalTime || 0), 0);
};

export default mongoose.model("Task", taskSchema);
