// models/Project.js
import mongoose from "mongoose";

/* ---------------------------- SUB-SCHEMAS ---------------------------- */


// Time entry for hourly projects
const timeEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hours: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  taskType: {
    type: String,
    enum: [
      "development", "testing", "design", "meeting",
      "research", "documentation", "bug-fixing", "deployment"
    ],
    default: "development"
  },
  approved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedAt: { type: Date, default: Date.now }
});

// Milestone schema
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  deliverables: String,
  status: { type: String, enum: ["pending", "in-progress", "completed", "overdue"], default: "pending" },
  completedDate: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  order: { type: Number, default: 0 }
});

// Payment schema
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank-transfer", "credit-card", "paypal", "stripe", "other"],
    default: "bank-transfer"
  },
  transactionId: String,
  notes: String,
  milestoneId: { type: mongoose.Schema.Types.ObjectId },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedAt: { type: Date, default: Date.now }
});

// Task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  dueDate: Date,
  completed: { type: Boolean, default: false },
  milestoneId: { type: mongoose.Schema.Types.ObjectId },
  estimatedHours: Number,
  actualHours: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

/* ---------------------------- PROJECT SCHEMA ---------------------------- */
const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true, maxlength: 200 },
  description: String,
  deadline: Date,
  clientName: { type: String, required: true, trim: true, maxlength: 200 },
  clientEmail: String,
  clientPhone: String,
  projectPlatform: String,
  profile: String,
  budget: { type: Number, min: 0 },
  timeline: String,

  // Embedded subdocs
  timeEntries: [timeEntrySchema],
  milestones: [milestoneSchema],
  payments: [paymentSchema],
  tasks: [taskSchema],

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "archived", "active", "on-hold", "cancelled"],
    default: "pending"
  },
  category: { type: String, enum: ["fixed", "hourly", "milestone"], required: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  fixedAmount: { type: Number, default: 0 },
  paymentSchedule: { type: String, enum: ["upfront", "50-50", "milestone"], default: "upfront" },
  scopePolicy: String,
  hourlyRate: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },

  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  visibleToTeamLeads: { type: Boolean, default: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  technologies: [String],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Add these fields to your Project schema (models/Project.js)


  // ... existing fields ...
  
  // Team Lead assignment
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - projects can exist without team leads
  },
  
  // When the project was picked by a team lead
  pickedAt: {
    type: Date,
    required: false
  },
  
  // Release history tracking
  releaseHistory: [{
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    releasedAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: false
    }
  }],
  
  // Who created this project (should be admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ... rest of existing fields ...
  

}, { timestamps: true });

/* ---------------------- METHODS ---------------------- */
// Add Payment
projectSchema.methods.addPayment = function (paymentData, userId) {
  this.payments.push({ 
    ...paymentData, 
    addedBy: userId, 
    paymentDate: paymentData.paymentDate || new Date(),
    addedAt: new Date() 
  });
  this.paidAmount += paymentData.amount;
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

// Update & Delete Payment
projectSchema.methods.updatePayment = function (paymentId, updateData) {
  const payment = this.payments.id(paymentId);
  if (!payment) throw new Error("Payment not found");
  Object.assign(payment, updateData);
  return this.save();
};

projectSchema.methods.deletePayment = function (paymentId) {
  const payment = this.payments.id(paymentId);
  if (!payment) throw new Error("Payment not found");
  this.paidAmount -= payment.amount;
  payment.deleteOne();
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

// Add / Update / Delete Time Entry
projectSchema.methods.addTimeEntry = function (entryData, userId) {
  this.timeEntries.push({ ...entryData, addedBy: userId });
  this.actualHours += entryData.hours || 0;
  this.totalAmount = this.hourlyRate * this.actualHours;
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

projectSchema.methods.updateTimeEntry = function (entryId, updateData) {
  const entry = this.timeEntries.id(entryId);
  if (!entry) throw new Error("Time entry not found");
  Object.assign(entry, updateData);
  return this.save();
};

projectSchema.methods.deleteTimeEntry = function (entryId) {
  const entry = this.timeEntries.id(entryId);
  if (!entry) throw new Error("Time entry not found");
  this.actualHours -= entry.hours || 0;
  entry.deleteOne();
  this.totalAmount = this.hourlyRate * this.actualHours;
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

// Add / Update / Delete Milestone
projectSchema.methods.addMilestone = function (milestoneData) {
  this.milestones.push(milestoneData);
  this.totalAmount = this.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};


projectSchema.methods.updateMilestone = function (milestoneId, updateData) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) throw new Error("Milestone not found");
  Object.assign(milestone, updateData);
  return this.save();
};

projectSchema.methods.deleteMilestone = function (milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) throw new Error("Milestone not found");
  this.totalAmount -= milestone.amount || 0;
  milestone.deleteOne();
  this.pendingAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

/* ---------------------- EXPORT MODELS ---------------------- */
export const Project = mongoose.model("Project", projectSchema);

export const ProjectDetails = mongoose.model(
  "ProjectDetails",
  new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    totalPrice: Number,
    onBoardDate: Date,
    profile: String,
    projectPlatform: String
  }, { timestamps: true })
);

export const ProjectGroup = mongoose.model(
  "ProjectGroup",
  new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    mainProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    pricingModel: { type: String, enum: ["fixed", "hourly", "milestone"], required: true },
    totalValue: { type: Number, default: 0 },
    clientName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  }, { timestamps: true })
);
// (use your full Project.js content; add the following snippets into it)

// Ensure employees array uniqueness via pre-save:
projectSchema.pre("save", function (next) {
  if (Array.isArray(this.employees)) {
    this.employees = [...new Set(this.employees.map((id) => id.toString()))];
  }
  next();
});

// Virtual: task counts by status (counts tasks subdocuments if embedded)
projectSchema.virtual("taskSummary").get(function () {
  const summary = { pending: 0, "in-progress": 0, completed: 0, review: 0, blocked: 0 };
  if (Array.isArray(this.tasks)) {
    this.tasks.forEach((t) => {
      const s = t.status || "pending";
      summary[s] = (summary[s] || 0) + 1;
    });
  }
  return summary;
});

// Method: return limited view for a specific employee (filters tasks)
projectSchema.methods.forEmployee = function (employeeId) {
  const obj = this.toObject();
  // If tasks are embedded:
  if (Array.isArray(obj.tasks)) {
    obj.tasks = obj.tasks.filter((t) => String(t.assignedTo) === String(employeeId));
  }
  return obj;
};

export default Project;
