import React, { useState, useEffect } from 'react';
import { Search, Plus, Truck } from 'lucide-react';
import api from '../lib/api';

interface Supplier {
  id: number;
  name: string;
  company: string;
  mobile: string;
  email: string;
  amountPayable: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', mobile: '', email: '', address: '', gstin: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', formData);
      setShowAddModal(false);
      setFormData({ name: '', company: '', mobile: '', email: '', address: '', gstin: '' });
      fetchSuppliers();
    } catch (error) {
      console.error("Failed to add supplier", error);
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" /> Suppliers Directory
        </h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or company..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-600 text-sm">
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Company</th>
              <th className="p-4 font-semibold">Mobile</th>
              <th className="p-4 font-semibold text-right">Amount Payable (Due)</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading suppliers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No suppliers found.</td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{s.name}</td>
                  <td className="p-4 text-gray-500">{s.company}</td>
                  <td className="p-4 text-gray-500">{s.mobile}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded font-bold ${s.amountPayable > 0 ? 'bg-red-100 text-red-700' : 'text-green-600'}`}>
                      ₹{s.amountPayable.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add Supplier</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
