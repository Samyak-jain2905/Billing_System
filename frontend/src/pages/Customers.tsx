import React, { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, UserCheck, X, FileText, Calendar, IndianRupee } from 'lucide-react';
import api from '../lib/api';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  address: string;
  totalPurchases: number;
  totalDue: number;
}

interface InvoiceHistory {
  id: number;
  invoiceNumber: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  invoiceDate: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '' });

  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<InvoiceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      setHistoryLoading(true);
      const res = await api.get(`/customers/${customer.id}/history`);
      setCustomerHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      setShowAddModal(false);
      setFormData({ name: '', mobile: '', address: '' });
      fetchCustomers();
    } catch (error) {
      console.error("Failed to add customer", error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || paymentAmount === '') return;
    
    try {
      await api.post(`/customers/${showPaymentModal.id}/payment`, { amount: paymentAmount });
      setShowPaymentModal(null);
      setPaymentAmount('');
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.id === showPaymentModal.id) {
        // Refresh selected customer state
        setSelectedCustomer({...selectedCustomer, totalDue: selectedCustomer.totalDue - Number(paymentAmount)});
      }
    } catch (error) {
      console.error("Failed to record payment", error);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ${selectedCustomer ? 'pr-96' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" /> Customers & Udhaar
          </h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" /> Add Customer
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
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
                <th className="p-4 font-semibold">Mobile</th>
                <th className="p-4 font-semibold text-right">Total Purchases</th>
                <th className="p-4 font-semibold text-right">Udhaar (Due)</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No customers found.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50' : ''}`}
                    onClick={() => loadCustomerHistory(c)}
                  >
                    <td className="p-4 font-medium text-gray-900">{c.name}</td>
                    <td className="p-4 text-gray-500">{c.mobile}</td>
                    <td className="p-4 text-right font-medium">₹{c.totalPurchases.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded font-bold ${c.totalDue > 0 ? 'bg-red-100 text-red-700' : 'text-green-600'}`}>
                        ₹{c.totalDue.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {c.totalDue > 0 && (
                        <button 
                          onClick={() => setShowPaymentModal(c)}
                          className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1 mx-auto"
                        >
                          <CreditCard className="w-3 h-3" /> Pay Due
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Customer Profile Panel */}
      <div className={`fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl border-l transform transition-transform duration-300 z-40 ${selectedCustomer ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedCustomer && (
          <div className="h-full flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                <p className="opacity-90">{selectedCustomer.mobile}</p>
                <p className="text-sm opacity-80 mt-1">{selectedCustomer.address}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-blue-700 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4 border-b">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-sm text-gray-500 mb-1">Total Purchases</p>
                <p className="text-xl font-bold">₹{selectedCustomer.totalPurchases.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm text-red-600 mb-1">Total Udhaar</p>
                <p className="text-xl font-bold text-red-700">₹{selectedCustomer.totalDue.toFixed(2)}</p>
              </div>
            </div>

            {selectedCustomer.totalDue > 0 && (
              <div className="p-4 border-b">
                <button 
                  onClick={() => setShowPaymentModal(selectedCustomer)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex justify-center items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Record Payment
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4"/> Purchase History
              </h3>
              
              {historyLoading ? (
                <p className="text-gray-500 text-center py-4">Loading history...</p>
              ) : customerHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No purchases yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {customerHistory.map(inv => (
                    <div key={inv.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{inv.invoiceNumber}</span>
                        <span className="font-bold">₹{inv.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {inv.invoiceDate || 'N/A'}</span>
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          inv.paymentMethod === 'UDHAAR' ? 'bg-orange-100 text-orange-700' : 
                          inv.paymentMethod === 'CASH' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {inv.paymentMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add Customer</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b bg-green-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                <IndianRupee className="w-6 h-6"/> Record Payment
              </h2>
              <button onClick={() => setShowPaymentModal(null)} className="p-1 hover:bg-green-100 rounded-full">
                <X className="w-5 h-5 text-green-700" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold text-lg">{showPaymentModal.name} <span className="text-sm font-normal text-gray-500">({showPaymentModal.mobile})</span></p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 mb-1">Current Udhaar (Due)</p>
                <p className="font-bold text-red-700 text-2xl">₹{showPaymentModal.totalDue.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mt-2">Amount Paying Now (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    max={showPaymentModal.totalDue} 
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(parseFloat(e.target.value))} 
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl transition-colors">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
