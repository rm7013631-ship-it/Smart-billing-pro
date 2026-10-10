import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { api } from '../services/api.ts';
import { Product, ProductCategory, Customer, CartItem, Invoice } from '../types/index.ts';
import {
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  Percent,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.tsx';

interface POSScreenProps {
  onSaleComplete: (invoice: Invoice) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({ onSaleComplete }) => {
  const { currentBusiness } = useBusiness();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Bill discount
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Credit' | 'Bank Transfer'>('Cash');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');

  // Modals & Scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Hold bills
  const [heldBills, setHeldBills] = useState<{ id: string; time: string; customer: string; cart: CartItem[] }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;
    try {
      const [prods, cats, custs] = await Promise.all([
        api.getProducts(currentBusiness.id),
        api.getCategories(currentBusiness.id),
        api.getCustomers(currentBusiness.id),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
    } catch (err) {
      console.error('POS loadData error:', err);
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const trimmed = code.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed) ||
        (p.sku && p.sku.toLowerCase() === trimmed)
    );

    if (found) {
      addToCart(found);
    } else {
      setErrorMsg(`No product found with barcode: "${code}"`);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku || undefined,
          barcode: product.barcode || undefined,
          hsnSac: product.hsnSac || undefined,
          quantity: 1,
          unit: product.unit || 'pcs',
          unitPrice: parseFloat(product.sellingPrice),
          discount: 0,
          taxRate: parseFloat(product.taxRate || '0'),
          currentStock: parseFloat(product.currentStock || '0'),
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setItemQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setPaidAmountInput('');
    setPaymentReference('');
  };

  // Calculations
  const grossSubtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  let billDiscount = 0;
  if (discountType === 'percentage') {
    billDiscount = (grossSubtotal * (discountValue || 0)) / 100;
  } else {
    billDiscount = discountValue || 0;
  }

  // Tax breakdown
  let estimatedTax = 0;
  cart.forEach((item) => {
    const itemGross = item.quantity * item.unitPrice;
    if (currentBusiness?.taxInclusivePricing) {
      const taxable = item.taxRate > 0 ? itemGross / (1 + item.taxRate / 100) : itemGross;
      estimatedTax += itemGross - taxable;
    } else {
      estimatedTax += itemGross * (item.taxRate / 100);
    }
  });

  const grandTotalExact = Math.max(
    0,
    currentBusiness?.taxInclusivePricing
      ? grossSubtotal - billDiscount
      : grossSubtotal + estimatedTax - billDiscount
  );

  const grandTotal = Math.round(grandTotalExact);
  const roundOff = grandTotal - grandTotalExact;

  const actualPaidAmount = paidAmountInput !== '' ? parseFloat(paidAmountInput) : grandTotal;
  const balanceDue = Math.max(0, grandTotal - actualPaidAmount);

  // Hold Sale
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `hold_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: selectedCustomer?.name || 'Walk-in',
      cart: [...cart],
    };
    setHeldBills([...heldBills, newHold]);
    clearCart();
  };

  const handleResumeSale = (holdId: string) => {
    const target = heldBills.find((h) => h.id === holdId);
    if (!target) return;
    setCart(target.cart);
    setHeldBills(heldBills.filter((h) => h.id !== holdId));
  };

  // Quick Customer Creation
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !currentBusiness) return;
    try {
      const created = await api.createCustomer(currentBusiness.id, {
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
      });
      setCustomers([...customers, created]);
      setSelectedCustomer(created);
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    }
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    if (!currentBusiness || cart.length === 0) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Check stock limits if business denies negative stock
      if (!currentBusiness.enableNegativeStock) {
        for (const item of cart) {
          if (item.quantity > item.currentStock) {
            throw new Error(
              `Insufficient stock for "${item.productName}". Available: ${item.currentStock}, In Cart: ${item.quantity}`
            );
          }
        }
      }

      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || null,
        customerAddress: selectedCustomer?.address || null,
        customerGstin: selectedCustomer?.gstin || null,
        items: cart.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          barcode: it.barcode,
          hsnSac: it.hsnSac,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discount: it.discount,
          taxRate: it.taxRate,
        })),
        discountType,
        discountValue,
        totalDiscount: billDiscount,
        paymentMethod,
        paymentReference: paymentReference.trim() || null,
        paidAmount: actualPaidAmount,
        isInterstate: false,
      };

      const result = await api.createInvoice(currentBusiness.id, payload);
      clearCart();
      // Reload products to refresh stock count
      api.getProducts(currentBusiness.id).then(setProducts).catch(() => {});
      onSaleComplete(result);
    } catch (err: any) {
      console.error('Sale completion error:', err);
      setErrorMsg(err.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      return matchName || matchBarcode || matchSku;
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)] pb-16 lg:pb-0 overflow-hidden">
      {/* LEFT: Product Catalog / Touch Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Search & Barcode Scan Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchProduct')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 shrink-0"
            title="Scan with Camera"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{t('scanBarcode')}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-2.5 border-b border-slate-100 dark:border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all shrink-0 ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-xl px-3 py-1.5 font-bold transition-all shrink-0 ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 content-start">
          {filteredProducts.map((p) => {
            const stock = parseFloat(p.currentStock);
            const isOutOfStock = stock <= 0;

            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className={`relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all active:scale-95 ${
                  isOutOfStock && !currentBusiness?.enableNegativeStock
                    ? 'border-slate-200 opacity-60 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                    : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-blue-500'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                    {p.name}
                  </p>
                  {p.barcode && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {p.barcode}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    ₹{p.sellingPrice}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      stock <= parseFloat(p.minStockAlert || '5')
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stock} {p.unit}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: POS Bill Cart & Checkout */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 overflow-hidden">
        {/* Customer & Hold Action Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex-1 flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id.toString() === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full text-xs font-bold bg-transparent border-0 text-slate-800 focus:ring-0 dark:text-white truncate"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} {parseFloat(c.currentBalance) > 0 ? `[Due: ₹${c.currentBalance}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400"
              title="Add New Customer"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              onClick={handleHoldSale}
              disabled={cart.length === 0}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-400 disabled:opacity-40"
              title={t('holdBill')}
            >
              <PauseCircle className="h-4 w-4" />
            </button>
            {heldBills.length > 0 && (
              <button
                onClick={() => handleResumeSale(heldBills[0].id)}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-bold text-white shadow-xs"
                title="Resume Held Bill"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>{heldBills.length}</span>
              </button>
            )}
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40"
              title="Clear Cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
              <AlertCircle className="mb-2 h-8 w-8 stroke-1 text-slate-300" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bill Cart is Empty</p>
              <p className="text-xs text-slate-400 mt-1">
                Scan barcode or select items from catalog to start billing.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ₹{item.unitPrice.toFixed(2)} / {item.unit}
                    {item.taxRate > 0 && ` (${item.taxRate}% GST)`}
                  </p>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => setItemQuantity(item.productId, parseFloat(e.target.value) || 0)}
                    className="w-10 text-center font-bold text-slate-900 dark:text-white bg-transparent border-0 p-0 text-xs"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right w-16">
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-3 my-1 rounded-xl bg-rose-50 p-2 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Bill Calculations & Payment Options */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 text-xs">
          {/* Subtotal & Discount row */}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{t('subtotal')}:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ₹{grossSubtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              {t('discount')}:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-16 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              >
                {discountType === 'percentage' ? '%' : '₹'}
              </button>
            </div>
          </div>

          {estimatedTax > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>{t('tax')} ({currentBusiness?.taxInclusivePricing ? 'Included' : 'Added'}):</span>
              <span>₹{estimatedTax.toFixed(2)}</span>
            </div>
          )}

          {roundOff !== 0 && (
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Round Off:</span>
              <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2 text-base font-black text-slate-900 dark:text-white">
            <span>{t('grandTotal')}:</span>
            <span className="text-xl text-blue-600 dark:text-blue-400">
              ₹{grandTotal}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { id: 'Cash', label: t('cash'), icon: DollarSign },
              { id: 'UPI', label: t('upi'), icon: QrCode },
              { id: 'Card', label: t('card'), icon: CreditCard },
              { id: 'Credit', label: t('credit'), icon: User },
            ].map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-1.5 text-[10px] font-bold transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tendered Cash / Partial Khata input if needed */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Tendered Amount:
            </span>
            <input
              type="number"
              placeholder={`₹${grandTotal}`}
              value={paidAmountInput}
              onChange={(e) => setPaidAmountInput(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {balanceDue > 0 && (
            <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Khata Due Balance:</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          )}

          {/* Complete Bill Button */}
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-40"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{submitting ? 'Processing Bill...' : t('payAndPrint')}</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Add Customer</h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
