// src/components/employee/tabs/TasksTab.jsx
import React, { useState, useEffect } from "react";
import api from "../../../../services/api";

const TasksTab = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await api.get("/tasks/my");
    setTasks(data);
  };

  const markCompleted = async (id) => {
    await api.put(`/tasks/${id}/complete`);
    fetchTasks();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Tasks</h2>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t._id} className="p-3 border rounded flex justify-between">
            <div>
              <p>{t.description}</p>
              <p>Status: {t.status}</p>
            </div>
            {t.status !== "completed" && (
              <button
                onClick={() => markCompleted(t._id)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Mark Complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TasksTab;
