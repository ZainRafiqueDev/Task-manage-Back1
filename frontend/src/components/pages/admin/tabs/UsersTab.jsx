import React, { useEffect, useState } from "react";
import api from "../../../../services/api";

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cnic: "",
    phone: "",
    role: "employee",
  });

  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      console.error("Fetch Users Error:", err.response?.data || err.message);
    }
  };

  // ✅ Input change handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Create new user
  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", form);
      setForm({ name: "", email: "", password: "", cnic: "", phone: "", role: "employee" });
      fetchUsers();
    } catch (err) {
      console.error("Create User Error:", err.response?.data || err.message);
    }
  };

  // ✅ Start editing user
  const startEdit = (user) => {
    setEditMode(true);
    setEditUserId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: "", // leave empty if not changing
      cnic: user.cnic,
      phone: user.phone,
      role: user.role,
    });
  };

  // ✅ Update user
  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editUserId}`, form);
      setEditMode(false);
      setEditUserId(null);
      setForm({ name: "", email: "", password: "", cnic: "", phone: "", role: "employee" });
      fetchUsers();
    } catch (err) {
      console.error("Update User Error:", err.response?.data || err.message);
    }
  };

  // ✅ Promote user
  const promoteToTeamLead = async (id) => {
    try {
      await api.put(`/admin/users/${id}/promote`);
      fetchUsers();
    } catch (err) {
      console.error("Promote User Error:", err.response?.data || err.message);
    }
  };

  // ✅ Delete user
  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Delete User Error:", err.response?.data || err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* User Creation / Update Form */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-3">
          {editMode ? "Edit User" : "Add New User"}
        </h2>
        <form onSubmit={editMode ? updateUser : createUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="border p-2 rounded" required />
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded" required />
          {!editMode && (
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" className="border p-2 rounded" required />
          )}
          <input type="text" name="cnic" value={form.cnic} onChange={handleChange} placeholder="CNIC (12345-1234567-1)" className="border p-2 rounded" required />
          <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (03XXXXXXXXX)" className="border p-2 rounded" required />
          <select name="role" value={form.role} onChange={handleChange} className="border p-2 rounded">
            <option value="employee">Employee</option>
            <option value="teamlead">TeamLead</option>
            <option value="admin">Admin</option>
          </select>
          <div className="col-span-full flex space-x-2">
            <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
              {editMode ? "Update User" : "Create User"}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setEditUserId(null);
                  setForm({ name: "", email: "", password: "", cnic: "", phone: "", role: "employee" });
                }}
                className="bg-gray-400 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* User List */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u._id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p>Email: {u.email}</p>
                <p>CNIC: {u.cnic}</p>
                <p>Phone: {u.phone}</p>
                <p>Role: <span className="font-bold">{u.role}</span></p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => startEdit(u)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                {u.role === "employee" && (
                  <button
                    onClick={() => promoteToTeamLead(u._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Promote
                  </button>
                )}
                <button
                  onClick={() => deleteUser(u._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UsersTab;
