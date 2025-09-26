// src/components/admin/tabs/TasksTab.jsx
import React, { useState, useEffect } from "react";
import api from "../../../../services/api";

const TasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    specialInstructions: "",
    assignedTo: "",
    project: "",
    dueDate: "",
    projectLink: ""
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await api.get("/admin/tasks");
    setTasks(data.tasks || []);
  };

  const createTask = async (e) => {
    e.preventDefault();
    await api.post("/admin/tasks", form);
    setForm({
      title: "",
      description: "",
      specialInstructions: "",
      assignedTo: "",
      project: "",
      dueDate: "",
      projectLink: ""
    });
    fetchTasks();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📝 Task Management</h2>

      {/* Task Creation Form */}
      <form onSubmit={createTask} className="space-y-2 mb-6 border p-4 rounded shadow">
        <input
          type="text"
          placeholder="Task Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Special Instructions"
          value={form.specialInstructions}
          onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Employee ID"
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Project ID"
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="url"
          placeholder="Project Link (Optional)"
          value={form.projectLink}
          onChange={(e) => setForm({ ...form, projectLink: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Create Task
        </button>
      </form>

      {/* Task List */}
      <ul className="space-y-3">
        {tasks.map((t) => (
          <li key={t._id} className="p-3 border rounded shadow-sm">
            <h3 className="font-bold">{t.title}</h3>
            <p>{t.description}</p>
            <p className="text-sm text-gray-600">Status: {t.status}</p>
            <p className="text-sm">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksTab;
