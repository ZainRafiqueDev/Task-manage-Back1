import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Asset from "../models/Asset.js";
import Report from "../models/Report.js";
import Notification from "../models/Notification.js";

/* ----------------------- USER MANAGEMENT ----------------------- */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, cnic, phone, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, cnic, phone, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is being updated, hash it
    // Only update password if it's provided and not empty
if (password && password.trim() !== "") {
  const salt = await bcrypt.genSalt(10);
  updateData.password = await bcrypt.hash(password, salt);
}


    // Otherwise, don't touch password field
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password"); // don’t return password in response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "teamlead";
    await user.save();
    res.json({ message: "User promoted to Team Lead", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- PROJECT MANAGEMENT ----------------------- */
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- TASK MANAGEMENT ----------------------- */
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo project createdBy");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- ASSET MANAGEMENT ----------------------- */
export const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate("assignedTo");
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Asset not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Asset not found" });
    res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignAsset = async (req, res) => {
  try {
    const { userId } = req.body;
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    asset.assignedTo = userId;
    await asset.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { assignedAssets: asset._id } });

    res.json({ message: "Asset assigned", asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- REPORTS ----------------------- */
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate("createdBy forUser");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- NOTIFICATIONS ----------------------- */
export const sendNotification = async (req, res) => {
  try {
    const { recipients, message } = req.body;
    const notification = await Notification.create({ recipients, message, sender: req.user._id });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- ADMIN STATS ----------------------- */
export const getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const projects = await Project.countDocuments();
    const tasks = await Task.countDocuments();
    const reports = await Report.countDocuments();

    res.json({ users, projects, tasks, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
