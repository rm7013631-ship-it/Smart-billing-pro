import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { Product } from '../types/index.ts';
import {
  Boxes,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Stock Adjust Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (currentBusiness) {
      loadProducts();
    }
  }, [currentBusiness]);

  const loadProducts = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const data = await api.getProducts(currentBusiness.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load inventory products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !selectedProduct || !quantity) return;

    try {
      await api.adjustStock(currentBusiness.id, selectedProduct.id, {
        adjustmentType: adjustType,
        quantity: parseFloat(quantity),
        reason: reason || `Manual adjustment: ${adjustType}`,
      });
      setAdjustModalOpen(false);
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Inventory & Stock Audit
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock balance, damage/returns tracking, and physical inventory count adjustments.
          </p>
        </div>

        <button
          onClick={loadProducts}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Stock
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Filter stock by product name, SKU, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 focus:outline-hidden dark:text-white"
        />
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU / Barcode</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-4 font-semibold text-right">Available Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Stock Valuation</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const stock = parseFloat(p.currentStock);
                  const cost = parseFloat(p.purchasePrice || '0');
                  const valuation = (stock > 0 ? stock * cost : 0).toFixed(2);
                  const isLow = stock <= parseFloat(p.minStockAlert || '5');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {p.sku || p.barcode || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                        ₹{p.purchasePrice}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                        ₹{p.sellingPrice}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-black inline-block px-2 py-0.5 rounded-full ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ₹{valuation}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustModalOpen(true);
                          }}
                          className="rounded-lg border px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 font-semibold"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Boxes className="mx-auto mb-2 h-8 w-8 stroke-1 text-slate-300" />
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Adjust Stock: {selectedProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Current Balance: <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="add">Add Stock (Restock)</option>
                  <option value="subtract">Subtract Stock (Correction)</option>
                  <option value="damage">Damaged / Expired Goods</option>
                  <option value="set">Set Exact Physical Count</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Expired batch removal, Inventory physical count"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
