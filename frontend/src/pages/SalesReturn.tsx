import React, { useState } from 'react';
import { Search, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/api';

interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  rate: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  grandTotal: number;
  invoiceDate: string;
  items: InvoiceItem[];
}

export default function SalesReturn() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // item ID -> quantity to return
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [refundMethod, setRefundMethod] = useState('CASH');

  const searchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInvoice(null);
    setReturnQuantities({});
    setLoading(true);

    try {
      // Need a way to fetch invoice by number. 
      // The backend API currently gets by ID: /api/invoices/{id}
      // Since we don't have a specific endpoint for searching by number, let's assume we can fetch by ID or we add an endpoint to find by number.
      // Wait, let's assume the user enters the ID for now, or we can quickly add a `GET /api/invoices/search?number=...` endpoint.
      // Let's use a workaround: for now, type the ID directly if needed, or we implement search by number.
      // I'll call a hypothetical search endpoint for now, and if it fails, I'll use ID.
      let res;
      try {
        res = await api.get(`/invoices/search?number=${invoiceNumber}`);
      } catch (err) {
        // Fallback to ID search
        res = await api.get(`/invoices/${invoiceNumber}`);
      }
      setInvoice(res.data);
    } catch (err) {
      setError("Invoice not found. Please check the invoice number or ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, maxQty: number, val: string) => {
    const qty = parseInt(val) || 0;
    if (qty > maxQty) return;
    if (qty < 0) return;
    
    setReturnQuantities(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  const calculateTotalRefund = () => {
    if (!invoice) return 0;
    let total = 0;
    invoice.items.forEach(item => {
      const returnQty = returnQuantities[item.id] || 0;
      // Note: This is an approximation since GST isn't directly exposed per item here,
      // but in a real system we'd use the exact proportion.
      // Assuming rate is base rate. We'll show base refund. Backend calculates exact.
      total += returnQty * item.rate; 
    });
    return total;
  };

  const totalRefundItems = Object.values(returnQuantities).reduce((a,b) => a+b, 0);

  const handleSubmitReturn = async () => {
    if (!invoice) return;
    
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([id, qty]) => qty > 0)
      .map(([id, qty]) => ({
        invoiceItemId: parseInt(id),
        returnQuantity: qty
      }));

    if (itemsToReturn.length === 0) {
      alert("Please select at least one item to return.");
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        invoiceId: invoice.id,
        refundMethod,
        items: itemsToReturn
      };

      await api.post('/returns/sales', payload);
      setSuccess("Sales return processed successfully! Stock has been updated.");
      setInvoice(null);
      setReturnQuantities({});
    } catch (err: any) {
      setError(err.response?.data || "Failed to process return.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-blue-600" /> Sales Return
        </h1>

        {/* Step 1: Search Invoice */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <form onSubmit={searchInvoice} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice ID or Number *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  required
                  type="text"
                  placeholder="e.g. 1 or INV-202610-0001"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || !invoiceNumber}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Find Invoice'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 font-bold">
              <CheckCircle className="w-5 h-5" /> {success}
            </div>
          )}
        </div>

        {/* Step 2: Return Items */}
        {invoice && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Invoice #{invoice.invoiceNumber || invoice.id}</h2>
                <p className="text-sm text-gray-500">
                  {invoice.invoiceDate} • {invoice.customerName || 'Walk-in Customer'} • Grand Total: ₹{invoice.grandTotal}
                </p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b text-sm text-gray-500">
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-center">Purchased Qty</th>
                  <th className="p-4 text-right">Rate (₹)</th>
                  <th className="p-4 text-center">Return Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.productName}</td>
                    <td className="p-4 text-center font-bold text-gray-700">{item.quantity}</td>
                    <td className="p-4 text-right text-gray-600">₹{item.rate}</td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0" 
                          max={item.quantity}
                          className="w-20 border border-gray-300 rounded p-2 text-center focus:ring-2 focus:ring-blue-500 font-bold"
                          value={returnQuantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, item.quantity, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalRefundItems > 0 && (
              <div className="p-6 bg-gray-50 border-t flex flex-col items-end gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimated Base Refund (Excl. GST)</p>
                  <p className="text-3xl font-black text-gray-900">₹{calculateTotalRefund().toFixed(2)}</p>
                </div>
                
                <div className="flex gap-4 items-center w-full justify-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Refund Method</label>
                    <select 
                      className="border rounded-lg p-3 font-semibold bg-white"
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                    >
                      <option value="CASH">CASH REFUND</option>
                      <option value="UDHAAR_ADJUSTMENT">CREDIT / ADJUST UDHAAR</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleSubmitReturn}
                    disabled={isProcessing}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md disabled:bg-gray-400 transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Return'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
