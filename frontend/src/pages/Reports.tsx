import React, { useState, useEffect } from 'react';
import { Search, Printer, FileText, Download, TrendingUp, IndianRupee, Package, DownloadCloud } from 'lucide-react';
import api from '../lib/api';

interface InvoiceListDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  hasReturn?: boolean;
  paymentDate?: string;
}

interface FinancialReport {
  grossSales: number;
  totalDiscounts: number;
  totalGst: number;
  totalReturns: number;
  netSales: number;
  totalUdhaar: number;
  grossProfit: number;
}

interface InventoryReport {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  stockValuation: number;
}

interface ReorderSuggestion {
  productId: number;
  productName: string;
  currentStock: number;
  soldLast30Days: number;
  suggestedOrderQuantity: number;
  status: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'SALES' | 'FINANCIAL' | 'INVENTORY'>('FINANCIAL');
  
  const [invoices, setInvoices] = useState<InvoiceListDto[]>([]);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'SALES') {
        const res = await api.get('/reports/sales');
        setInvoices(res.data.sort((a: any, b: any) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
      } else if (activeTab === 'FINANCIAL') {
        const res = await api.get('/reports/financial');
        setFinancial(res.data);
      } else if (activeTab === 'INVENTORY') {
        const res = await api.get('/reports/inventory');
        setInventory(res.data);
        const reorderRes = await api.get('/reports/reorder-suggestions');
        setReorderSuggestions(reorderRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (id: number) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    window.open(`${apiUrl}/invoices/${id}/pdf`, '_blank');
  };

  const markAsPaid = async (id: number) => {
    if (window.confirm("Mark this Udhaar as PAID?")) {
      try {
        await api.put(`/invoices/${id}/mark-paid`);
        alert("Marked as paid successfully!");
        fetchData();
      } catch (error) {
        console.error("Failed to mark as paid", error);
        alert("Error marking as paid");
      }
    }
  };

  // Export CSV
  const exportCSV = async () => {
    try {
      const res = await api.get('/reports/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("CSV Export failed", error);
      alert("Failed to export CSV");
    }
  };

  const exportExcel = async () => {
    try {
      // Download as CSV but name it so it's clear for Excel
      const res = await api.get('/reports/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales_report_for_excel.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Excel Export failed", error);
      alert("Failed to export Excel");
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> Report Center
        </h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="bg-white border text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-semibold shadow-sm">
            <DownloadCloud className="w-5 h-5" /> CSV
          </button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 font-semibold shadow-sm">
            <Download className="w-5 h-5" /> Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2 shadow-sm">
        <button 
          onClick={() => setActiveTab('FINANCIAL')}
          className={`px-6 py-3 font-bold border-b-4 transition-colors ${activeTab === 'FINANCIAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Financial Overview
        </button>
        <button 
          onClick={() => setActiveTab('SALES')}
          className={`px-6 py-3 font-bold border-b-4 transition-colors ${activeTab === 'SALES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Sales History
        </button>
        <button 
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-6 py-3 font-bold border-b-4 transition-colors ${activeTab === 'INVENTORY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Inventory Metrics
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500 font-bold">Loading report data...</div>
      ) : (
        <>
          {/* FINANCIAL TAB */}
          {activeTab === 'FINANCIAL' && financial && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg"><IndianRupee className="w-6 h-6 text-emerald-600" /></div>
                </div>
                <h3 className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Gross Sales</h3>
                <p className="text-3xl font-black text-gray-900">₹{financial.grossSales.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
                </div>
                <h3 className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Gross Profit (Margin)</h3>
                <p className="text-3xl font-black text-gray-900">₹{financial.grossProfit.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg"><FileText className="w-6 h-6 text-purple-600" /></div>
                </div>
                <h3 className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Net Sales (After Returns)</h3>
                <p className="text-3xl font-black text-gray-900">₹{financial.netSales.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-gray-500 text-sm font-bold mb-1">Total GST Collected</h3>
                <p className="text-2xl font-bold text-gray-900">₹{financial.totalGst.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-gray-500 text-sm font-bold mb-1">Sales Returns (Refunded)</h3>
                <p className="text-2xl font-bold text-red-600">₹{financial.totalReturns.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-gray-500 text-sm font-bold mb-1">Pending Udhaar (Risk)</h3>
                <p className="text-2xl font-bold text-orange-600">₹{financial.totalUdhaar.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'INVENTORY' && inventory && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="p-2 bg-blue-50 rounded-lg w-max mb-4"><Package className="w-6 h-6 text-blue-600" /></div>
                  <h3 className="text-gray-500 text-sm font-bold mb-1">Total Products</h3>
                  <p className="text-3xl font-black text-gray-900">{inventory.totalProducts}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="p-2 bg-emerald-50 rounded-lg w-max mb-4"><IndianRupee className="w-6 h-6 text-emerald-600" /></div>
                  <h3 className="text-gray-500 text-sm font-bold mb-1">Stock Valuation (Cost)</h3>
                  <p className="text-3xl font-black text-gray-900">₹{inventory.stockValuation.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500">
                  <div className="p-2 bg-orange-50 rounded-lg w-max mb-4"><Package className="w-6 h-6 text-orange-600" /></div>
                  <h3 className="text-gray-500 text-sm font-bold mb-1">Low Stock Items</h3>
                  <p className="text-3xl font-black text-orange-600">{inventory.lowStock}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                  <div className="p-2 bg-red-50 rounded-lg w-max mb-4"><Package className="w-6 h-6 text-red-600" /></div>
                  <h3 className="text-gray-500 text-sm font-bold mb-1">Out of Stock</h3>
                  <p className="text-3xl font-black text-red-600">{inventory.outOfStock}</p>
                </div>
              </div>

              {/* AI Smart Reorder Suggestions */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" /> Smart Reorder Analytics (AI)
                    </h2>
                    <p className="text-sm text-blue-200">Based on 30-day sales velocity and current stock minimums.</p>
                  </div>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                      <th className="p-4 font-semibold">Product Name</th>
                      <th className="p-4 font-semibold text-center">Velocity (Last 30 Days)</th>
                      <th className="p-4 font-semibold text-center">Current Stock</th>
                      <th className="p-4 font-semibold text-center">Recommended Order</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {reorderSuggestions.length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-500 font-bold">Stock levels are optimal! No reorders needed currently.</td></tr>
                    ) : (
                      reorderSuggestions.map(s => (
                        <tr key={s.productId} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{s.productName}</td>
                          <td className="p-4 text-center text-gray-600 font-medium">{s.soldLast30Days} sold</td>
                          <td className="p-4 text-center font-black">{s.currentStock}</td>
                          <td className="p-4 text-center font-black text-blue-600">+{s.suggestedOrderQuantity} units</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold 
                              ${s.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700' : 
                                s.status === 'CRITICAL' ? 'bg-orange-100 text-orange-700' : 
                                'bg-yellow-100 text-yellow-700'}`}>
                              {s.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SALES TAB */}
          {activeTab === 'SALES' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by Invoice # or Customer..."
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
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Invoice #</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Payment</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Total (₹)</th>
                      <th className="p-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredInvoices.length === 0 ? (
                      <tr><td colSpan={7} className="p-4 text-center text-gray-500">No sales found.</td></tr>
                    ) : (
                      filteredInvoices.map(inv => {
                        const dateObj = new Date(inv.invoiceDate);
                        const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        return (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-500">{formattedDate}</td>
                            <td className="p-4 font-bold text-gray-900">{inv.invoiceNumber}</td>
                            <td className="p-4 text-gray-700">{inv.customerName}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold 
                                ${inv.paymentMethod === 'UPI' ? 'bg-green-100 text-green-700' : 
                                  inv.paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-700' : 
                                  inv.paymentMethod === 'UDHAAR' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'}`}>
                                {inv.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${inv.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {inv.paymentStatus}
                                  </span>
                                  {inv.hasReturn && (
                                    <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                      RETURNED
                                    </span>
                                  )}
                                </div>
                                {inv.paymentDate && inv.paymentMethod === 'UDHAAR' && (
                                  <div className="text-[10px] text-gray-500 font-medium">
                                    Paid: {new Date(inv.paymentDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right font-black text-gray-900">₹{inv.grandTotal.toFixed(2)}</td>
                            <td className="p-4 text-center flex items-center justify-center gap-2">
                              {inv.paymentMethod === 'UDHAAR' && inv.paymentStatus === 'DUE' && (
                                <button
                                  onClick={() => markAsPaid(inv.id)}
                                  className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                                  title="Mark as Paid"
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button 
                                onClick={() => printInvoice(inv.id)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Print / Download PDF"
                              >
                                <Printer className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
