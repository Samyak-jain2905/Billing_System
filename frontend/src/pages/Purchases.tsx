import React, { useState, useEffect } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';

export default function Purchases() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Purchase Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<{productId: string, quantity: number, purchasePrice: number}[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  useEffect(() => {
    api.get('/suppliers').then(res => setSuppliers(res.data));
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, purchasePrice: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill purchase price if product is selected
    if (field === 'productId') {
      const prod = products.find(p => p.id.toString() === value.toString());
      if (prod) {
        newItems[index].purchasePrice = prod.purchasePrice || 0;
      }
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return alert("Please select a supplier");
    if (items.length === 0) return alert("Please add at least one item");

    try {
      const payload = {
        supplierId: parseInt(supplierId),
        purchaseInvoiceNumber: invoiceNumber || `PUR-${Date.now()}`,
        amountPaid,
        items: items.map(item => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          purchasePrice: item.purchasePrice
        }))
      };

      await api.post('/purchases', payload);
      alert("Purchase recorded successfully! Stock has been updated.");
      
      // Reset form
      setSupplierId('');
      setInvoiceNumber('');
      setItems([]);
      setAmountPaid(0);
    } catch (error) {
      console.error("Failed to record purchase", error);
      alert("Error recording purchase!");
    }
  };

  const grandTotal = calculateTotal();

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PackagePlus className="w-6 h-6 text-blue-600" /> Record Purchase (Restock)
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Invoice Number</label>
              <input type="text" placeholder="Leave blank to auto-generate" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Products *</label>
              <button type="button" onClick={handleAddItem} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-100">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-sm text-gray-600">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-32">Qty</th>
                    <th className="p-3 w-40">Unit Price (₹)</th>
                    <th className="p-3 w-32 text-right">Total</th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2">
                        <select required className="w-full border p-2 rounded text-sm" value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)}>
                          <option value="">Select Product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input required type="number" min="1" className="w-full border p-2 rounded text-sm" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)} />
                      </td>
                      <td className="p-2">
                        <input required type="number" step="0.01" className="w-full border p-2 rounded text-sm" value={item.purchasePrice} onChange={e => handleItemChange(idx, 'purchasePrice', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="p-2 text-right font-medium">
                        ₹{(item.quantity * item.purchasePrice).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No items added. Click 'Add Item' to begin.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now (₹)</label>
                <input type="number" step="0.01" max={grandTotal} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} />
                <p className="text-xs text-gray-500 mt-1">If paying less, remainder adds to Udhaar payable to supplier.</p>
              </div>
              <button type="submit" disabled={items.length === 0} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 mt-2">
                Confirm Purchase & Restock
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
