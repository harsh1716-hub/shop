import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, FileText, PackageSearch, AlertTriangle } from 'lucide-react';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://shop-h7pf.onrender.com/api/products');
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load products. Make sure the backend server is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setSuccessMsg('');
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Not enough stock available!');
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      if (product.stock <= 0) {
        alert('Product is out of stock!');
        return;
      }
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        maxStock: product.stock
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.maxStock) {
          return { ...item, quantity: newQ };
        }
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const response = await fetch('https://shop-h7pf.onrender.com/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, customer_id: null })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to checkout');
      
      setSuccessMsg(`Sale complete! Bill ID: #${data.saleId}. Total: ₹${data.grandTotal}`);
      setLastSale({
        id: data.saleId,
        items: [...cart],
        subtotal: totalAmount,
        gst: gstAmount,
        grandTotal: grandTotal,
        date: new Date().toLocaleString()
      });
      setCart([]);
      setWhatsappNumber(''); // Reset phone number for the new receipt
      fetchProducts(); // Refresh products to show updated stock
    } catch (err) {
      alert(err.message);
    }
  };

  const sendWhatsApp = () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      alert('Please enter a valid 10-digit WhatsApp number');
      return;
    }
    
    let message = `*Bakery Shop - Digital Receipt*\nBill ID: #${lastSale.id}\nDate: ${lastSale.date.split(',')[0]}\n\n*Items:*\n`;
    
    lastSale.items.forEach(item => {
      message += `- ${item.name} (x${item.quantity}): ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal:* ₹${lastSale.subtotal.toFixed(2)}`;
    message += `\n*GST (12%):* ₹${lastSale.gst.toFixed(2)}`;
    message += `\n*GRAND TOTAL:* ₹${lastSale.grandTotal.toFixed(2)}\n\nThank you for shopping with us! Have a sweet day 🧁`;
    
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = totalAmount * 0.12;
  const grandTotal = totalAmount + gstAmount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] print:block print:h-auto">
      
      {/* Product Selection */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full overflow-hidden print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <PackageSearch className="mr-2 text-blue-500" /> Catalog
          </h2>
          <input 
            type="text" 
            placeholder="Scan Barcode / Search..." 
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center mb-4">
            <AlertTriangle className="mr-2" size={18} /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6">
          {/* Dynamically group by ALL categories from loaded products */}
          {[...new Set(products.map(p => p.category))].sort((a, b) => {
            // Show Uncategorized & Raw Materials last
            if (a === 'Uncategorized') return 1;
            if (b === 'Uncategorized') return -1;
            if (a === 'Raw Materials') return 1;
            if (b === 'Raw Materials') return -1;
            return a.localeCompare(b);
          }).map(cat => {
            const catProducts = products.filter(p =>
              p.category === cat &&
              p.is_raw_material !== 1 &&
              (p.name.toLowerCase().includes(barcodeInput.toLowerCase()) ||
               (p.barcode && p.barcode.toLowerCase().includes(barcodeInput.toLowerCase())))
            );

            if (catProducts.length === 0) return null;

            return (
              <div key={cat} className="mb-2">
                <h3 className="text-lg font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">{cat}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {catProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="border border-slate-100 bg-slate-50 p-4 rounded-xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all relative group flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800 leading-tight mb-1">{p.name}</h4>
                        <p className="text-blue-600 font-bold mb-3">₹{p.price}</p>
                      </div>
                      <span className={`w-fit text-xs px-2 py-1 rounded-md font-medium ${p.stock < p.threshold ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {products.filter(p => p.name.toLowerCase().includes(barcodeInput.toLowerCase()) && p.is_raw_material !== 1).length === 0 && (
            <div className="text-center text-slate-500 mt-10">No items found matching "{barcodeInput}"</div>
          )}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full print:shadow-none print:border-none print:w-full max-w-sm mx-auto">
        {lastSale ? (
          <div className="flex flex-col h-full print:h-auto font-mono text-sm leading-snug">
            {/* Receipt Header */}
            <div className="p-6 text-center border-b-2 border-dashed border-slate-300 print:px-0">
              <h1 className="text-2xl font-bold tracking-tight mb-1">Bakery Shop</h1>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Store Receipt</p>
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Bill: #{lastSale.id}</span>
                <span>{lastSale.date.split(',')[0]}</span>
              </div>
            </div>

            {/* Receipt Items */}
            <div className="p-6 flex-1 overflow-y-auto print:px-0">
              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 font-semibold text-center">Qty</th>
                    <th className="pb-2 font-semibold text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lastSale.items.map(item => (
                    <tr key={item.productId} className="text-slate-700">
                      <td className="py-2 pr-2 truncate max-w-[120px]" title={item.name}>{item.name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 mb-6 text-slate-600 border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{lastSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (12%)</span>
                  <span>₹{lastSale.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-800 pt-2 mt-2">
                  <span>TOTAL PAID</span>
                  <span>₹{lastSale.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 italic mt-8 border-t border-dashed border-slate-300 pt-4">
                Thank you for visiting!<br/>Please come again.
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl print:hidden flex flex-col space-y-3">
              <div className="flex space-x-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Print Invoice
                </button>
                <button 
                  onClick={() => setLastSale(null)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  New Sale
                </button>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-3.5 text-slate-400 font-medium">+91</span>
                  <input 
                    type="text" 
                    placeholder="Enter phone number..." 
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full border border-emerald-300 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                    maxLength="10"
                  />
                </div>
                <button 
                  onClick={sendWhatsApp}
                  className="py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md whitespace-nowrap text-sm"
                >
                  WhatsApp Bill
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <ShoppingCart className="mr-2 text-blue-500" /> Current Bill
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart size={48} className="mb-3 opacity-20" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-700 truncate w-32" title={item.name}>{item.name}</h4>
                      <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-500 hover:text-red-500"><Minus size={14}/></button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-500 hover:text-emerald-500"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="ml-3 text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (12%)</span>
                  <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-800 text-lg pt-2 border-t border-slate-200 mt-2">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-bold text-blue-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {successMsg && <div className="mb-4 text-center text-sm font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">{successMsg}</div>}

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center text-lg"
              >
                <FileText className="mr-2" size={20} /> Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;
