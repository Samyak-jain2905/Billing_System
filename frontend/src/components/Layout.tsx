import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, Truck, PackagePlus, LogOut, RotateCcw, Bell, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Admin';
  const userRole = localStorage.getItem('userRole') || 'ADMIN';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
  }, []);

  const allNavItems = [
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Sales Return', path: '/sales-return', icon: RotateCcw, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Purchases', path: '/purchases', icon: PackagePlus, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Purchase Return', path: '/purchase-return', icon: RotateCcw, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Staff & Roles', path: '/users', icon: Shield, roles: ['ADMIN'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      alert('Password changed successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      if (err.response?.status === 400) {
        setPasswordError('Incorrect current password');
      } else {
        setPasswordError('Failed to change password');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col z-20">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500 text-2xl">⚡</span> POS System
          </h2>
        </div>

        <div className="p-4 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{userName}</div>
            <div className="text-xs text-gray-400">{userRole}</div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
          <button 
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Shield className="w-5 h-5" />
            Change Password
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <div className="h-16 bg-white border-b flex justify-end items-center px-6 shadow-sm z-40 relative">
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-bold">{notifications.length}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm font-medium">No new notifications.</div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => {if(n.actionLink) navigate(n.actionLink); setShowNotifications(false);}}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {n.type === 'CRITICAL' ? '🔴' : n.type === 'WARNING' ? '🟠' : n.type === 'SUCCESS' ? '🟢' : '🔵'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6">
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                  {passwordError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
