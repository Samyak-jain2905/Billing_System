import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Trash2, Shield } from 'lucide-react';
import api from '../lib/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'CASHIER',
    mobile: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // For security, do not display passwords
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (username === 'admin') {
      alert("Cannot delete the root admin user.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert("Failed to delete user");
      }
    }
  };

  const handleRoleChange = async (id: number, username: string, newRole: string) => {
    if (username === 'admin') {
      alert("Cannot change the role of the root admin user.");
      return;
    }
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user role");
    }
  };

  const handleMobileChange = async (id: number, currentMobile: string) => {
    const newMobile = window.prompt("Enter new WhatsApp mobile number for this user:", currentMobile || '');
    if (newMobile !== null) {
      try {
        await api.put(`/users/${id}/mobile`, { mobile: newMobile });
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert("Failed to update user mobile");
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setShowAddModal(false);
      setNewUser({ username: '', password: '', role: 'CASHIER', mobile: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to add user. Username might already exist.");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" /> User & Role Management
        </h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">ID</th>
              <th className="p-4 font-semibold text-gray-600">Username</th>
              <th className="p-4 font-semibold text-gray-600">Mobile</th>
              <th className="p-4 font-semibold text-gray-600">Role</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500">#{u.id}</td>
                  <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    {u.username}
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{u.mobile || 'Not Set'}</span>
                      <button 
                        onClick={() => handleMobileChange(u.id, u.mobile)} 
                        className="text-blue-500 hover:text-blue-700 text-xs underline"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.username === 'admin' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                        {u.role}
                      </span>
                    ) : (
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id, u.username, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${
                          u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' : 
                          u.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                          'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        <option value="CASHIER">CASHIER</option>
                        <option value="STAFF">STAFF</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {u.username !== 'admin' && (
                      <button 
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  value={newUser.mobile}
                  onChange={e => setNewUser({...newUser, mobile: e.target.value})}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="CASHIER">CASHIER (Only POS & Customers)</option>
                  <option value="STAFF">STAFF (Only Products & Purchases)</option>
                  <option value="MANAGER">MANAGER (All except Staff & Roles)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
