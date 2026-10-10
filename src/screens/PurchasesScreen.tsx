import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { Purchase, Supplier, Product } from '../types/index.ts';
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  // Purchase items in modal
  const [items, setItems] = useState<{ productId: number | null; productName: string; quantity: number; unitCost: number; unit: string }[]>([]);

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const [purchList, supList, prodList] = await Promise.all([
        api.getPurchases(currentBusiness.id),
        api.getSuppliers(currentBusiness.id),
        api.getProducts(currentBusiness.id),
      ]);
      setPurchases(purchList);
      setSuppliers(supList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = (p?: Product) => {
    if (p) {
      setItems([
        ...items,
        {
          productId: p.id,
          productName: p.name,
          quantity: 10,
          unitCost: parseFloat(p.purchasePrice || '0'),
          unit: p.unit || 'pcs',
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          productId: null,
          productName: '',
          quantity: 1,
          unitCost: 0,
          unit: 'pcs',
        },
      ]);
    }
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0), 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || items.length === 0) return;

    try {
      await api.createPurchase(currentBusiness.id, {
        supplierId: supplierId ? parseInt(supplierId, 10) : null,
        invoiceNumber: invoiceNumber.trim() || `PUR-${Date.now()}`,
        purchaseDate,
        subtotal: grandTotal,
        taxAmount: 0,
        grandTotal,
        paidAmount: grandTotal,
        paymentMethod,
        notes: notes.trim() || undefined,
        items,
      });

      setModalOpen(false);
      setItems([]);
      setInvoiceNumber('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save purchase');
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Purchases & Inward Stock
          </h1>
          <p className="text-xs text-slate-500">
            Record supplier bills to automatically update inventory stock and purchase costs.
          </p>
        </div>

        <button
          onClick={() => {
            setItems([]);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Record New Purchase
        </button>
      </div>

      {/* Purchases Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Purchase Bill #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Payment Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Total Cost</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {p.purchaseDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{p.grandTotal}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <ShoppingBag className="mx-auto mb-2 h-8 w-8 stroke-1 text-slate-300" />
                    No purchase bills recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 my-auto p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Inward Purchase Bill
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">General / Local Wholesale</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bill / Invoice #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-2026-90"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Items Purchased</span>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        const prod = products.find(p => p.id.toString() === e.target.value);
                        if (prod) addItemRow(prod);
                        e.target.value = '';
                      }}
                      className="rounded-lg border bg-white px-2 py-1 text-xs font-semibold text-blue-600 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="">+ Add From Product List</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.productName}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].productName = e.target.value;
                        setItems(copy);
                      }}
                      className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantity = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs text-center"
                    />
                    <input
                      type="number"
                      placeholder="Cost"
                      value={item.unitCost}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].unitCost = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs text-right"
                    />
                    <span className="w-16 text-right font-bold">
                      ₹{(item.quantity * item.unitCost).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 font-bold text-xs border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40"
                >
                  Save Bill & Increase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
