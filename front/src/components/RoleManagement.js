import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [userRoles, setUserRoles] = useState({});
  const navigate = useNavigate();

  // Fetch roles, permissions, and users on component load
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/roles');
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const createRole = async () => {
    if (!newRole) {
      alert("Role name is required.");
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/roles', { name: newRole, permissions: selectedPermissions });
      setNewRole('');
      setSelectedPermissions([]);
      fetchRoles();
      alert("Role created successfully.");
    } catch (error) {
      console.error("Error creating role:", error);
    }
  };

  const assignRoleToUser = async (userId, roleId) => {
    try {
      await axios.post('http://localhost:5000/api/users/assign-role', { userId, roleId });
      fetchUsers();
      alert("Role assigned to user successfully.");
    } catch (error) {
      console.error("Error assigning role to user:", error);
    }
  };

  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
  };

  const editRole = (role) => {
    setSelectedRole(role.id);
    setNewRole(role.name);
    setSelectedPermissions(role.permissions.map(p => p.id));
  };

  const updateRole = async () => {
    if (!selectedRole) {
      alert("Please select a role to update.");
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/roles/${selectedRole}`, { name: newRole, permissions: selectedPermissions });
      fetchRoles();
      alert("Role updated successfully.");
      setSelectedRole('');
      setNewRole('');
      setSelectedPermissions([]);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Role Management</h2>

      {/* Create or Edit Role */}
      <div className="card mb-4">
        <div className="card-body">
          <h4>{selectedRole ? "Edit Role" : "Create New Role"}</h4>
          <div className="mb-3">
            <label htmlFor="roleName" className="form-label">Role Name</label>
            <input
              type="text"
              id="roleName"
              className="form-control"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Permissions</label>
            <div className="form-check">
              {permissions.map(permission => (
                <div key={permission.id} className="form-check">
                  <input
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    className="form-check-input"
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => handlePermissionChange(permission.id)}
                  />
                  <label htmlFor={`permission-${permission.id}`} className="form-check-label">
                    {permission.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <button onClick={selectedRole ? updateRole : createRole} className="btn btn-primary">
            {selectedRole ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>

      {/* Role List */}
      <div className="card mb-4">
        <div className="card-body">
          <h4>Existing Roles</h4>
          <ul className="list-group">
            {roles.map(role => (
              <li key={role.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{role.name}</span>
                <button onClick={() => editRole(role)} className="btn btn-secondary btn-sm">
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Assign Role to User */}
      <div className="card">
        <div className="card-body">
          <h4>Assign Role to User</h4>
          <div className="mb-3">
            <label htmlFor="userSelect" className="form-label">Select User</label>
            <select
              id="userSelect"
              className="form-select"
              onChange={(e) => setUserRoles({ ...userRoles, userId: e.target.value })}
              value={userRoles.userId || ''}
            >
              <option value="">Choose User...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="roleSelect" className="form-label">Select Role</label>
            <select
              id="roleSelect"
              className="form-select"
              onChange={(e) => setUserRoles({ ...userRoles, roleId: e.target.value })}
              value={userRoles.roleId || ''}
            >
              <option value="">Choose Role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => assignRoleToUser(userRoles.userId, userRoles.roleId)} className="btn btn-success">
            Assign Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
