import React, { useState } from 'react';
import { RotateCcw, Search, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';

export default function PurchaseReturn() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchase, setPurchase] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // return state
  const [returnItems, setReturnItems] = useState<{purchaseItemId: number, returnedQuantity: number, maxQty: number, product: any, purchasePrice: number}[]>([]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UDHAAR_ADJUSTMENT'>('UDHAAR_ADJUSTMENT');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPurchase(null);
    setReturnItems([]);
    
    try {
      const res = await api.get(`/purchases/search?number=${invoiceNumber}`);
      const data = res.data;
      setPurchase(data);
      
      const items = data.items.map((item: any) => ({
        purchaseItemId: item.id,
        returnedQuantity: 0,
        maxQty: item.quantity,
        product: item.product,
        purchasePrice: item.purchasePrice
      }));
      setReturnItems(items);
      
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Purchase Invoice not found. Please check the invoice number.");
      } else {
        setError("Failed to fetch purchase details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id: number, val: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.purchaseItemId === id) {
        return { ...item, returnedQuantity: Math.min(Math.max(0, val), item.maxQty) };
      }
      return item;
    }));
  };

  const totalRefund = returnItems.reduce((sum, item) => sum + (item.returnedQuantity * item.purchasePrice), 0);

  const handleSubmit = async () => {
    if (totalRefund <= 0) {
      alert("Please specify at least one item to return.");
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        purchaseInvoiceNumber: purchase.purchaseInvoiceNumber,
        refundMethod,
        returnItems: returnItems.filter(i => i.returnedQuantity > 0).map(i => ({
          purchaseItemId: i.purchaseItemId,
          returnedQuantity: i.returnedQuantity
        }))
      };

      await api.post('/purchase-returns', payload);
      alert(`Purchase Return Processed Successfully!\nTotal Refund: ₹${totalRefund}\nStock has been deducted.`);
      
      // Reset
      setPurchase(null);
      setInvoiceNumber('');
      setReturnItems([]);
    } catch (err) {
      console.error(err);
      alert("Failed to process purchase return.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <RotateCcw className="w-6 h-6 text-orange-600" /> Process Purchase Return (RTV)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6 h-max">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Find Purchase Invoice</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. PUR-12345678" 
              className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-orange-500"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="bg-orange-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-700 disabled:bg-gray-400">
              <Search className="w-5 h-5" />
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {purchase && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Purchase Details</p>
              <p className="font-bold text-lg text-gray-900">{purchase.purchaseInvoiceNumber}</p>
              <p className="text-sm text-gray-600 mt-1">Supplier: {purchase.supplier?.name} ({purchase.supplier?.company})</p>
              <p className="text-sm text-gray-600 mt-1">Grand Total: ₹{purchase.grandTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Paid: ₹{purchase.amountPaid.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Return Panel */}
        {purchase && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Select Items to Return to Supplier</h2>
            
            <div className="flex-1 overflow-auto border rounded-lg mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="p-3 font-semibold">Product</th>
                    <th className="p-3 font-semibold text-center w-24">Purchased</th>
                    <th className="p-3 font-semibold text-right w-32">Unit Price</th>
                    <th className="p-3 font-semibold text-center w-32">Return Qty</th>
                    <th className="p-3 font-semibold text-right w-32">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {returnItems.map(item => (
                    <tr key={item.purchaseItemId} className="bg-white">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">Stock: {item.product?.currentStock}</p>
                      </td>
                      <td className="p-3 text-center text-gray-500">{item.maxQty}</td>
                      <td className="p-3 text-right text-gray-500">₹{item.purchasePrice.toFixed(2)}</td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          min="0" 
                          max={item.maxQty}
                          className="w-full border p-2 rounded text-center focus:ring-2 focus:ring-orange-500"
                          value={item.returnedQuantity}
                          onChange={e => handleQtyChange(item.purchaseItemId, parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-orange-600">
                        ₹{(item.returnedQuantity * item.purchasePrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-sm font-bold text-gray-500 mb-2">Refund Method from Supplier</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="refund" checked={refundMethod === 'UDHAAR_ADJUSTMENT'} onChange={() => setRefundMethod('UDHAAR_ADJUSTMENT')} className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Adjust Supplier Payable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="refund" checked={refundMethod === 'CASH'} onChange={() => setRefundMethod('CASH')} className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Cash / Bank Received</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <p className="text-sm font-bold text-gray-500">Total Refund</p>
                <p className="text-3xl font-black text-gray-900 mb-3">₹{totalRefund.toFixed(2)}</p>
                <button 
                  onClick={handleSubmit}
                  disabled={isProcessing || totalRefund === 0}
                  className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} /> 
                  {isProcessing ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
