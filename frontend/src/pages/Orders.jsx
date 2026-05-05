import { useState, useEffect } from 'react';
import { CalendarClock, User, CakeSlice } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    product_details: '',
    pickup_date: ''
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ customer_name: '', customer_phone: '', product_details: '', pickup_date: '' });
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`https://shop-h7pf.onrender.com/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <CalendarClock className="text-purple-500" size={32} /> Advanced Orders
        </h2>
        <p className="text-slate-500 mt-1">Manage custom cake bookings and pickups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Booking Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Book New Order</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg pl-10 pr-4 py-2.5 text-sm"
                  value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
              <input 
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-4 py-2.5 text-sm"
                value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cake / Product Details</label>
              <div className="relative">
                <CakeSlice size={16} className="absolute left-3 top-3 text-slate-400" />
                <textarea 
                  required rows="3"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg pl-10 pr-4 py-2.5 text-sm"
                  value={formData.product_details} onChange={e => setFormData({...formData, product_details: e.target.value})}
                  placeholder="e.g. 2kg Choco Truffle with 'Happy Birthday'"
                ></textarea>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Date & Time</label>
              <input 
                type="datetime-local" required
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-4 py-2.5 text-sm"
                value={formData.pickup_date} onChange={e => setFormData({...formData, pickup_date: e.target.value})}
              />
            </div>

            <button type="submit" className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all text-sm">
              Save Booking
            </button>
          </form>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Upcoming Pickups</h3>
          {orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-purple-300 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-800">{order.customer_name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{order.product_details}</p>
                <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><CalendarClock size={14}/> {new Date(order.pickup_date).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><User size={14}/> {order.customer_phone}</span>
                </div>
              </div>
              
              <div className="pl-6 border-l border-slate-100 flex flex-col gap-2">
                {order.status !== 'Completed' && (
                  <button onClick={() => updateStatus(order.id, 'Completed')} className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-600">
                    Mark Done
                  </button>
                )}
                <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">
                  Edit
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              No advanced orders booked yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
