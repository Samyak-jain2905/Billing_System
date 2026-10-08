import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Printer, X, CreditCard, Banknote, Smartphone, Receipt, Keyboard } from 'lucide-react';
import api from '../lib/api';

interface Product {
  id: number;
  name: string;
  barcode: string;
  sellingPrice: number;
  gstRate: number;
  currentStock?: number;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);
  const [billGstRate, setBillGstRate] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F4: Focus Customer
      if (e.key === 'F4') {
        e.preventDefault();
        customerInputRef.current?.focus();
      }
      // F8: Open Payment
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      // F10: Complete Sale
      if (e.key === 'F10') {
        e.preventDefault();
        if (isPaymentModalOpen) {
          handleCheckout();
        }
      }
      // Esc: Close Modal
      if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, paymentMethod, cashReceived, customerMobile, customerName, billGstRate]);

  const fetchProducts = async () => {
    try {
      if (searchTerm.trim() === '') {
        const res = await api.get('/products');
        setProducts(res.data);
      } else {
        const res = await api.get(`/products/search?query=${searchTerm}`);
        if (res.data.length === 1 && res.data[0].barcode === searchTerm) {
          addToCart(res.data[0]);
          setSearchTerm('');
        }
        setProducts(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };
  
  const clearCart = () => {
    if(window.confirm("Are you sure you want to clear the cart?")) {
      setCart([]);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    cart.forEach((item) => {
      const itemTotal = item.sellingPrice * item.quantity;
      const itemDiscount = item.discount * item.quantity;
      const taxableAmount = itemTotal - itemDiscount;
      
      const effectiveGstRate = billGstRate !== null ? billGstRate : item.gstRate;
      const gstAmount = (taxableAmount * effectiveGstRate) / 100;

      subtotal += itemTotal;
      totalDiscount += itemDiscount;
      totalGst += gstAmount;
    });

    return {
      subtotal,
      totalDiscount,
      totalGst,
      grandTotal: subtotal - totalDiscount + totalGst,
    };
  };

  const totals = calculateTotals();

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setIsProcessing(true);

    try {
      const payload = {
        customerMobile,
        customerName,
        paymentMethod,
        billGstRate,
        amountPaid: paymentMethod === 'UDHAAR' ? 0 : totals.grandTotal, 
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/invoices', payload);
      const newInvoice = res.data;

      // Instead of clearing state immediately, show the success modal
      setCompletedInvoice(newInvoice);
      setIsPaymentModalOpen(false);

      if (localStorage.getItem('printer_auto') === 'true') {
        const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const apiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;
        window.open(`${apiUrl}/invoices/${newInvoice.id}/pdf`, '_blank');
      }
      
    } catch (error) {
      console.error("Checkout failed", error);
      alert("Failed to process invoice!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setCustomerMobile('');
    setCustomerName('');
    setCashReceived('');
    setPaymentMethod('CASH');
    setCompletedInvoice(null);
    setBillGstRate(null);
  };

  const sendWhatsApp = () => {
    if (!completedInvoice || !completedInvoice.customerMobile) {
      alert("No customer mobile number provided for this bill.");
      return;
    }
    
    // Construct WhatsApp message
    const message = `*SAUMYA SALES*\n\nThank you for your purchase!\n\n*Invoice:* ${completedInvoice.invoiceNumber}\n*Amount:* ₹${completedInvoice.grandTotal}\n\nHave a great day!`;
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${completedInvoice.customerMobile}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const changeAmount = cashReceived !== '' ? Number(cashReceived) - totals.grandTotal : 0;

  return (
    <div className="flex-1 flex w-full h-full bg-gray-100 overflow-hidden text-sm">
      {/* Left side: Products search & list */}
      <div className="w-2/3 flex flex-col h-full bg-white border-r">
        <div className="p-4 border-b flex flex-col gap-2 bg-gray-50">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1"><Keyboard className="w-3 h-3"/> Shortcuts: <b>F2</b> Search | <b>F4</b> Customer | <b>F8</b> Payment | <b>F10</b> Complete</span>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by Product Name or Scan Barcode... (F2)"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm transition-shadow hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-3 gap-4 auto-rows-max">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="border rounded-xl p-4 cursor-pointer hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg transition-all bg-white flex flex-col justify-between h-32 relative overflow-hidden group"
            >
              <h3 className="font-semibold text-gray-800 text-lg line-clamp-2 group-hover:text-blue-700">{p.name}</h3>
              <div className="flex justify-between items-end">
                <div className="text-blue-600 font-bold text-xl">₹{p.sellingPrice}</div>
                {p.currentStock !== undefined && (
                   <div className={`text-xs font-semibold px-2 py-1 rounded ${p.currentStock <= 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                     {p.currentStock} in stock
                   </div>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 mt-10">
              No products found. Add products from the Products menu.
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart & Checkout */}
      <div className="w-1/3 flex flex-col h-full bg-gray-50">
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center shadow-md z-10">
          <h2 className="font-bold text-lg flex items-center gap-2"><Receipt className="w-5 h-5"/> Current Bill</h2>
          <div className="flex gap-2">
            <span className="bg-gray-800 px-3 py-1 rounded text-sm border border-gray-700">Cashier: Samyak</span>
            {cart.length > 0 && (
              <button onClick={clearCart} className="bg-red-900/50 hover:bg-red-800 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 text-red-200">
                <Trash2 className="w-3 h-3"/> Clear
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-4 py-3 bg-white border-b flex gap-2 shadow-sm z-10">
          <input 
            ref={customerInputRef}
            type="text" 
            placeholder="Mobile (F4)" 
            className="flex-1 border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={customerMobile}
            onChange={(e) => setCustomerMobile(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Name" 
            className="flex-1 border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 flex flex-col items-center gap-2">
              <Receipt className="w-12 h-12 text-gray-300" />
              <p>Bill is empty</p>
              <p className="text-xs">Scan a barcode or search to add items</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2 group">
                <div className="flex justify-between font-semibold">
                  <span className="line-clamp-1 pr-2">{item.name}</span>
                  <span>₹{(item.sellingPrice * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 mt-1">
                  <div className="flex items-center gap-1 border rounded-md p-1 bg-gray-50">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-10 text-center bg-transparent border-none focus:outline-none font-semibold text-gray-800"
                      min="1"
                    />
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors opacity-50 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary */}
        <div className="bg-white border-t p-4 flex flex-col gap-2 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm">
            <span>GST Amount</span>
            <span>₹{totals.totalGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-500 text-sm mt-1">
            <span>Override GST</span>
            <select 
              className="border rounded p-1 bg-gray-50 text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
              value={billGstRate === null ? 'AUTO' : billGstRate}
              onChange={(e) => setBillGstRate(e.target.value === 'AUTO' ? null : Number(e.target.value))}
            >
              <option value="AUTO">Auto (Per Item)</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="12">12%</option>
              <option value="14">14%</option>
              <option value="18">18%</option>
              <option value="20">20%</option>
            </select>
          </div>
          <div className="flex justify-between font-black text-3xl mt-2 pt-3 border-t-2 border-dashed border-gray-200 text-gray-900">
            <span>Payable</span>
            <span className="text-blue-700">₹{totals.grandTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none text-xl transition-all"
          >
            <Banknote className="w-6 h-6" /> PAY (F8)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-xl tracking-wide">COMPLETE SALE</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Amounts */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-lg">Total Amount</span>
                <span className="text-3xl font-black text-gray-900">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 block">Payment Method</label>
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => setPaymentMethod('CASH')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <Banknote className="w-6 h-6" />
                    <span className="font-bold text-sm">CASH</span>
                  </button>
                  <button onClick={() => setPaymentMethod('UPI')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'UPI' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <Smartphone className="w-6 h-6" />
                    <span className="font-bold text-sm">UPI</span>
                  </button>
                  <button onClick={() => setPaymentMethod('CARD')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <CreditCard className="w-6 h-6" />
                    <span className="font-bold text-sm">CARD</span>
                  </button>
                  <button onClick={() => setPaymentMethod('UDHAAR')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'UDHAAR' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <Receipt className="w-6 h-6" />
                    <span className="font-bold text-sm">UDHAAR</span>
                  </button>
                </div>
              </div>

              {/* Cash specific fields */}
              {paymentMethod === 'CASH' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Cash Received</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input 
                        type="number" 
                        className="w-full pl-8 pr-4 py-3 rounded-lg border-gray-300 border focus:ring-2 focus:ring-blue-500 font-bold text-xl"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Change to Return</label>
                    <div className={`w-full py-3 px-4 rounded-lg font-black text-2xl flex items-center ${changeAmount >= 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                      ₹{changeAmount >= 0 ? changeAmount.toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing || (paymentMethod === 'CASH' && cashReceived !== '' && Number(cashReceived) < totals.grandTotal)}
                  className="flex-[2] py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'PROCESSING...' : (
                    <>
                      <Printer className="w-5 h-5" /> COMPLETE (F10)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300">
            
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="font-black text-2xl text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 font-medium mb-6">Invoice #{completedInvoice.invoiceNumber}</p>
            
            <div className="w-full bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Amount Paid</p>
              <p className="text-4xl font-black text-gray-900">₹{completedInvoice.grandTotal.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => {
                  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const apiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;
                  window.open(`${apiUrl}/invoices/${completedInvoice.id}/pdf`, '_blank');
                }}
                className="py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 shadow-lg"
              >
                <Printer className="w-5 h-5" /> PRINT
              </button>
              
              <button 
                onClick={sendWhatsApp}
                className="py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors flex justify-center items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.383-.05c.108-.123.47-548.566-.666.694-.783.126-.087.643-.518.729-.942.086-.425 2.155 1.109 2.213 1.25.059.141.139.222.241.225s.167-.015.233-.086c.068-.074.258-.33.342-.423.084-.093.161-.077.298-.026 1.077.399 1.168.455 1.211.52.043.064.043.376-.101.781z"/></svg>
                WHATSAPP
              </button>
            </div>

            <button 
              onClick={handleNewSale}
              className="mt-4 py-4 w-full bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
            >
              <Plus className="w-5 h-5" /> NEW SALE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
