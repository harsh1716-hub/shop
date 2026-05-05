import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Save, X, AlertTriangle, CheckCircle, TrendingDown, Filter, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Cookies & Biscuits', 'Cakes & Pastries', 'Savory Puffs & Snacks', 'Breads & Buns', 'Chocolates & Sweets', 'Raw Materials', 'Uncategorized'];

const getStockStatus = (stock, threshold) => {
  if (stock === 0) return { label: 'Out of Stock', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' };
  if (stock <= threshold) return { label: 'Low Stock', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' };
  return { label: 'In Stock', color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' };
};

const EMPTY_FORM = { name: '', price: '', stock: '', threshold: '10', barcode: '', category: 'Uncategorized', is_raw_material: 0 };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      showToast('❌ Could not load products. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData({ ...product });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`https://shop-h7pf.onrender.com/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...editData } : p));
        setEditingId(null);
        showToast('✅ Product updated successfully!');
      } else {
        showToast('❌ Failed to update product.', 'error');
      }
    } catch {
      showToast('❌ Connection error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || newProduct.stock === '') {
      showToast('⚠️ Name, price and stock are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('https://shop-h7pf.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          threshold: parseInt(newProduct.threshold) || 10,
        })
      });
      if (res.ok) {
        showToast('✅ Product added successfully!');
        setNewProduct(EMPTY_FORM);
        setShowAddForm(false);
        fetchProducts();
      } else {
        const d = await res.json();
        showToast('❌ ' + (d.error || 'Failed to add product.'), 'error');
      }
    } catch {
      showToast('❌ Connection error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || p.category === category;
    return matchSearch && matchCategory;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock <= p.threshold && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    healthy: products.filter(p => p.stock > p.threshold).length,
  };

  const inputStyle = {
    background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '6px 10px', color: '#1e293b', fontSize: 13,
    fontFamily: 'Inter, sans-serif', width: '100%', caretColor: '#6366f1'
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        .inv-row { transition: background 0.15s; }
        .inv-row:hover { background: #f8fafc !important; }
        .inv-input:focus { outline: none; border-color: rgba(245,158,11,0.6) !important; }
        .inv-btn { transition: all 0.15s; cursor: pointer; border: none; }
        .inv-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        select option { background: #fff; color: #1e293b; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        .inv-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#1e0a0a' : '#0a1e12',
          border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#10b981'}`,
          borderRadius: 12, padding: '12px 20px',
          color: toast.type === 'error' ? '#ef4444' : '#10b981',
          fontSize: 14, fontWeight: 600,
          animation: 'toastIn 0.3s ease forwards',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#1e293b' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)'
          }}>
            <Package size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
              Inventory
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              {products.length} products · Manage stock & prices
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="inv-btn" onClick={fetchProducts} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 12, color: '#64748b', fontSize: 13, fontWeight: 600,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="inv-btn" onClick={() => setShowAddForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)'
          }}>
            <Plus size={17} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: stats.total, color: '#6366f1', icon: <Package size={18} /> },
          { label: 'Healthy Stock', value: stats.healthy, color: '#10b981', icon: <CheckCircle size={18} /> },
          { label: 'Low Stock', value: stats.lowStock, color: '#f59e0b', icon: <TrendingDown size={18} /> },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#ef4444', icon: <AlertTriangle size={18} /> },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: '18px 20px',
            border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            animation: `fadeIn 0.4s ease ${i * 0.08}s both`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div style={{
          background: '#fff', borderRadius: 20, padding: 24,
          border: '1px solid #e0e7ff', marginBottom: 20,
          boxShadow: '0 4px 24px rgba(99,102,241,0.1)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: 16, fontWeight: 700 }}>➕ Add New Product</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>PRODUCT NAME *</label>
              <input className="inv-input" style={inputStyle} placeholder="e.g. Almond Cookies"
                value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>PRICE (₹) *</label>
              <input className="inv-input" style={inputStyle} type="number" placeholder="0.00"
                value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>STOCK *</label>
              <input className="inv-input" style={inputStyle} type="number" placeholder="0"
                value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>LOW STOCK ALERT</label>
              <input className="inv-input" style={inputStyle} type="number" placeholder="10"
                value={newProduct.threshold} onChange={e => setNewProduct(p => ({ ...p, threshold: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>CATEGORY</label>
              <select className="inv-input" style={{ ...inputStyle, cursor: 'pointer' }}
                value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>BARCODE (optional)</label>
              <input className="inv-input" style={inputStyle} placeholder="e.g. BAKED099"
                value={newProduct.barcode} onChange={e => setNewProduct(p => ({ ...p, barcode: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>TYPE</label>
              <select className="inv-input" style={{ ...inputStyle, cursor: 'pointer' }}
                value={newProduct.is_raw_material} onChange={e => setNewProduct(p => ({ ...p, is_raw_material: parseInt(e.target.value) }))}>
                <option value={0}>Baked Good</option>
                <option value={1}>Raw Material</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="inv-btn" onClick={addProduct} disabled={saving} style={{
              padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700
            }}>
              {saving ? 'Adding...' : '✅ Add Product'}
            </button>
            <button className="inv-btn" onClick={() => { setShowAddForm(false); setNewProduct(EMPTY_FORM); }} style={{
              padding: '10px 20px', background: '#f1f5f9',
              border: '1px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 14
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="inv-input" style={{ ...inputStyle, paddingLeft: 40, borderRadius: 12 }}
            placeholder="Search by name or barcode..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <select className="inv-input" style={{ ...inputStyle, paddingLeft: 34, borderRadius: 12, minWidth: 200, cursor: 'pointer' }}
            value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid #e2e8f0', overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.5fr 1fr 100px',
          padding: '12px 20px', background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {['Product', 'Category', 'Price', 'Stock', 'Status', 'Threshold', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
            <p style={{ margin: 0 }}>Loading products...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
            <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15 }}>No products found</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((product, i) => {
          const isEditing = editingId === product.id;
          const status = getStockStatus(product.stock, product.threshold);

          return (
            <div key={product.id} className="inv-row" style={{
              display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.5fr 1fr 100px',
              padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
              alignItems: 'center', background: isEditing ? '#eef2ff' : '#fff',
              animation: `fadeIn 0.3s ease ${i * 0.03}s both`
            }}>

              {/* Name */}
              <div>
                {isEditing ? (
                  <input className="inv-input" style={{ ...inputStyle, fontSize: 13 }}
                    value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{product.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{product.barcode || '—'}</p>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                {isEditing ? (
                  <select className="inv-input" style={{ ...inputStyle, fontSize: 12 }}
                    value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{product.category}</span>
                )}
              </div>

              {/* Price */}
              <div>
                {isEditing ? (
                  <input className="inv-input" style={{ ...inputStyle, fontSize: 13 }} type="number"
                    value={editData.price} onChange={e => setEditData(d => ({ ...d, price: parseFloat(e.target.value) }))} />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>₹{product.price}</span>
                )}
              </div>

              {/* Stock */}
              <div>
                {isEditing ? (
                  <input className="inv-input" style={{ ...inputStyle, fontSize: 13 }} type="number"
                    value={editData.stock} onChange={e => setEditData(d => ({ ...d, stock: parseInt(e.target.value) }))} />
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 700, color: status.color }}>{product.stock}</span>
                )}
              </div>

              {/* Status Badge */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  background: status.bg, color: status.color,
                  display: 'inline-flex', alignItems: 'center', gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, display: 'inline-block' }} />
                  {status.label}
                </span>
              </div>

              {/* Threshold */}
              <div>
                {isEditing ? (
                  <input className="inv-input" style={{ ...inputStyle, fontSize: 13 }} type="number"
                    value={editData.threshold} onChange={e => setEditData(d => ({ ...d, threshold: parseInt(e.target.value) }))} />
                ) : (
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{product.threshold}</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                {isEditing ? (
                  <>
                    <button className="inv-btn" onClick={saveEdit} disabled={saving} title="Save" style={{
                      width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Save size={14} />
                    </button>
                    <button className="inv-btn" onClick={cancelEdit} title="Cancel" style={{
                      width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button className="inv-btn" onClick={() => startEdit(product)} title="Edit" style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer count */}
      {!loading && (
        <p style={{ margin: '12px 4px 0', fontSize: 12, color: '#475569' }}>
          Showing {filtered.length} of {products.length} products
        </p>
      )}
    </div>
  );
}
