import React, { useEffect, useState } from 'react';
import { IndianRupee, FileText, AlertTriangle, Clock, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

interface DashboardStats {
  totalSales: number;
  totalProfit?: number;
  totalBills: number;
  pendingPayments: number;
  lowStockCount: number;
  salesTrend: { date: string; totalSales: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-red-500">Failed to load dashboard data.</div>;
  }

  const statCards = [
    { title: "Total Sales", value: `₹${stats.totalSales.toFixed(2)}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Profit", value: `₹${(stats.totalProfit || 0).toFixed(2)}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Bills", value: stats.totalBills, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Udhaar (Due)", value: `₹${stats.pendingPayments.toFixed(2)}`, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Low Stock Items", value: stats.lowStockCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", link: "/products?filter=low-stock" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Dashboard</h1>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const CardContent = (
            <div className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 ${card.link ? 'hover:shadow-md hover:border-red-300 transition-all cursor-pointer' : ''}`}>
              <div className={`p-4 rounded-full ${card.bg} ${card.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              </div>
            </div>
          );
          
          if (card.link) {
            return <a key={idx} href={card.link} className="block">{CardContent}</a>;
          }
          return <div key={idx}>{CardContent}</div>;
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Sales Trend (Last 7 Days)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="totalSales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <a href="/pos" className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 flex items-center gap-3 transition-colors">
                <IndianRupee className="w-5 h-5" /> New Sale
              </a>
              <a href="/products" className="px-4 py-3 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 flex items-center gap-3 transition-colors">
                <Package className="w-5 h-5" /> Add Product
              </a>
              <a href="/reports" className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 flex items-center gap-3 transition-colors">
                <FileText className="w-5 h-5" /> Analytics & Reports
              </a>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 flex flex-col justify-center items-center text-center">
            <p className="text-sm font-bold text-gray-500 mb-1">Fast / Slow Moving Items</p>
            <p className="text-xs text-gray-400 mb-3">View detailed velocity metrics in the Report Center.</p>
            <a href="/reports" className="text-blue-600 font-bold text-sm hover:underline">View Smart Reorder Analytics &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
