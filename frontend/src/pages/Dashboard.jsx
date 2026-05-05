import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { AlertTriangle, TrendingUp, Croissant, ShoppingCart, Clock, Package, RefreshCw } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [freshnessAlerts, setFreshnessAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, freshRes] = await Promise.all([
        fetch('https://shop-h7pf.onrender.com/api/dashboard'),
        fetch('https://shop-h7pf.onrender.com/api/bakery/freshness')
      ]);
      const dashData = await dashRes.json();
      const freshData = await freshRes.json();

      setStats(dashData);

      // Process freshness alerts
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const alerts = (freshData.batches || []).map(b => {
        const exp = new Date(b.expiry_date);
        return {
          ...b,
          parsedExp: exp,
          isExpired: exp <= now,
          isExpiringSoon: exp > now && exp <= tomorrow
        };
      }).filter(b => b.isExpired || b.isExpiringSoon);
      setFreshnessAlerts(alerts);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // Build chart data from weekProfit
  const buildChartData = () => {
    const profitByDay = {};
    (stats?.weekProfit || []).forEach(r => {
      profitByDay[r.dow] = Math.round(r.profit);
    });

    // Show last 7 days
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dow = d.getDay().toString();
      labels.push(DAY_LABELS[d.getDay()]);
      data.push(profitByDay[dow] || 0);
    }
    return { labels, data };
  };

  const { labels: chartLabels, data: chartData } = buildChartData();

  const barData = {
    labels: chartLabels,
    datasets: [{
      label: 'Daily Profit (₹)',
      data: chartData,
      backgroundColor: 'rgba(245, 158, 11, 0.85)',
      borderRadius: 8,
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => '₹' + v } },
      x: { grid: { display: false } }
    },
  };

  const statCards = [
    {
      title: 'Total Sales Today',
      value: stats ? `₹${(stats.today?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '...',
      sub: stats ? `${stats.today?.count || 0} transactions` : '',
      icon: <ShoppingCart size={24} />, color: 'bg-slate-800'
    },
    {
      title: 'Est. Profit Today',
      value: stats ? `₹${Math.round(stats.todayProfit || 0).toLocaleString('en-IN')}` : '...',
      sub: '~30% margin',
      icon: <TrendingUp size={24} />, color: 'bg-emerald-500'
    },
    {
      title: 'Total Baked Goods',
      value: stats ? (stats.totalBaked || 0).toString() : '...',
      sub: 'items in stock',
      icon: <Croissant size={24} />, color: 'bg-amber-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Shop Overview</h2>
          <p className="text-slate-500 mt-1">Live metrics and batch freshness for your Bakery.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`${stat.color} p-4 rounded-xl text-white shadow-inner flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 leading-none">
                {loading ? <span className="inline-block w-20 h-6 bg-slate-100 rounded animate-pulse" /> : stat.value}
              </h3>
              {stat.sub && <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Daily Profits</h3>
              {stats && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Total this week: ₹{(stats.weekProfit || []).reduce((s, r) => s + r.profit, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
            <span className="text-sm px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-bold">This Week</span>
          </div>
          <div className="h-72">
            {loading
              ? <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
              : <Bar data={barData} options={chartOptions} />
            }
          </div>

          {/* Low Stock Warnings */}
          {stats?.lowStock?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" /> Low Stock Alert
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.lowStock.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg font-medium">
                    {p.name} — {p.stock} left
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Freshness Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-amber-500" /> Freshness Tracker
            </h3>
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-bold tracking-wider">QC Mode</span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {freshnessAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2 py-8">
                <Croissant size={40} />
                <p className="text-sm font-medium text-center">
                  {loading ? 'Loading...' : 'All batches are fresh!\nAdd batches via the Bake feature.'}
                </p>
              </div>
            ) : freshnessAlerts.map((batch, idx) => (
              <div key={idx} className={`flex items-start p-4 rounded-xl border ${
                batch.isExpired ? 'bg-red-50/50 border-red-200' : 'bg-amber-50 border-amber-300 shadow-sm'
              }`}>
                <AlertTriangle className={`mt-0.5 mr-3 shrink-0 ${batch.isExpired ? 'text-red-500' : 'text-amber-500'}`} size={18} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 mb-1 leading-none">{batch.name} (Batch #{batch.id})</h4>
                  <p className={`text-xs font-semibold ${batch.isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                    {batch.isExpired ? `Expired ${batch.parsedExp.toLocaleDateString()}` : 'Expires within 24 hours!'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Qty Remaining: {batch.remaining_quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Orders count */}
          {stats?.pendingOrders > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <Package size={16} className="text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700 font-semibold">
                {stats.pendingOrders} pending advanced order{stats.pendingOrders > 1 ? 's' : ''}
              </p>
            </div>
          )}

          <button
            onClick={fetchDashboard}
            className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
