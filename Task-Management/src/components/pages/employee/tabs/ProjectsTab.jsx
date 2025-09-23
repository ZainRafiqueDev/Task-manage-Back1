// src/components/employee/tabs/ProjectsTab.jsx
import React, { useEffect, useState } from "react";
import { getEmployeeProjects } from "../../../../services/ProjectApi";

const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await getEmployeeProjects();
    setProjects(data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📂 My Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p._id} className="p-2 border rounded mb-2">
            <strong>{p.name}</strong> – {p.description} <br />
            <span>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectsTab;
