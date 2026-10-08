import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';

interface Product {
  id: number;
  name: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  gstRate: number;
  currentStock: number;
  minimumStock?: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    purchasePrice: 0,
    sellingPrice: 0,
    gstRate: 18,
    currentStock: 0,
  });

  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchProducts();
    
    // Parse URL for filters
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('filter') === 'low-stock') {
      setFilterType('low-stock');
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowModal(false);
      setEditingId(null);
      fetchProducts();
      // Reset form
      setFormData({
        name: '', barcode: '', category: '', purchasePrice: 0, sellingPrice: 0, gstRate: 18, currentStock: 0
      });
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Error saving product!");
    }
  };

  const handleEditClick = (product: Product) => {
    setFormData({
      name: product.name || '',
      barcode: product.barcode || '',
      category: product.category || '',
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice || 0,
      gstRate: product.gstRate || 18,
      currentStock: product.currentStock || 0
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
        alert("Error deleting product!");
      }
    }
  };

  let filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  if (filterType === 'low-stock') {
    filteredProducts = filteredProducts.filter(p => p.currentStock <= (p.minimumStock || 20));
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <button 
          onClick={() => {
            setFormData({ name: '', barcode: '', category: '', purchasePrice: 0, sellingPrice: 0, gstRate: 18, currentStock: 0 });
            setEditingId(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterType('all')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Products
          </button>
          <button 
            onClick={() => setFilterType('low-stock')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filterType === 'low-stock' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            Low Stock Alerts
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-600 text-sm">
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Barcode</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold text-right">Price (₹)</th>
              <th className="p-4 font-semibold text-right">Stock</th>
              <th className="p-4 font-semibold text-right">GST %</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">No products found.</td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{product.name}</td>
                  <td className="p-4 text-gray-500">{product.barcode || '-'}</td>
                  <td className="p-4 text-gray-500">{product.category || '-'}</td>
                  <td className="p-4 text-right font-medium">₹{product.sellingPrice}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.currentStock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-500">{product.gstRate}%</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleEditClick(product)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input required type="number" step="0.01" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
                  <input type="number" step="0.01" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value)})}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">{editingId ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
