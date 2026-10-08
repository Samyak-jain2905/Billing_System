import React, { useState, useEffect } from 'react';
import { Save, Building2, Receipt, Phone, MapPin, Mail, Hash } from 'lucide-react';
import api from '../lib/api';

export default function Settings() {
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    invoicePrefix: 'INV',
    footerMessage: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      if(res.data) setFormData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load settings", err);
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', formData);
      alert('Shop settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings", error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> Shop Settings
        </h1>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          
          {/* Section 1: Business Details */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-gray-400" /> Shop Name
                </label>
                <input required type="text" name="shopName" value={formData.shopName} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> Address
                </label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                </label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" /> Email
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Hash className="w-4 h-4 text-gray-400" /> GSTIN
                </label>
                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 uppercase" />
              </div>
            </div>
          </div>

          {/* Section 2: Invoice Preferences */}
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Invoice & Printing Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Receipt className="w-4 h-4 text-gray-400" /> Invoice Prefix
                </label>
                <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. INV or SALE" />
                <p className="text-xs text-gray-500 mt-1">Example: {formData.invoicePrefix || 'INV'}-202610-0001</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Message</label>
                <input type="text" name="footerMessage" value={formData.footerMessage} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Thank you for shopping with us!" />
              </div>
            </div>
          </div>

          {/* Section 3: Local Printer Preferences */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-500" /> Local Terminal Printer Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                <select 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                  defaultValue={localStorage.getItem('printer_size') || 'A4'}
                  onChange={(e) => localStorage.setItem('printer_size', e.target.value)}
                >
                  <option value="THERMAL_58">Thermal 58mm (Receipt)</option>
                  <option value="THERMAL_80">Thermal 80mm (Receipt)</option>
                  <option value="A5">A5 (Half Letter)</option>
                  <option value="A4">A4 (Standard)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">This setting only applies to this computer.</p>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked={localStorage.getItem('printer_auto') === 'true'} onChange={(e) => localStorage.setItem('printer_auto', String(e.target.checked))} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  Auto-print after payment
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked={localStorage.getItem('printer_duplicate') === 'true'} onChange={(e) => localStorage.setItem('printer_duplicate', String(e.target.checked))} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  Print duplicate copy
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" defaultChecked={localStorage.getItem('printer_show_gst') !== 'false'} onChange={(e) => localStorage.setItem('printer_show_gst', String(e.target.checked))} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  Show GST breakup on bill
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
