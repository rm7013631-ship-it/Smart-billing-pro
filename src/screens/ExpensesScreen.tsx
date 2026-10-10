import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { Expense } from '../types/index.ts';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  X,
  CreditCard,
  DollarSign,
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (currentBusiness) {
      loadExpenses();
    }
  }, [currentBusiness]);

  const loadExpenses = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const data = await api.getExpenses(currentBusiness.id);
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !amount) return;

    try {
      await api.createExpense(currentBusiness.id, {
        category,
        amount: parseFloat(amount),
        expenseDate,
        paymentMethod,
        description: description.trim() || undefined,
      });

      setModalOpen(false);
      setAmount('');
      setDescription('');
      await loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!currentBusiness || !confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(currentBusiness.id, id);
      await loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Track daily shop costs like rent, electricity, transport, salaries, and packaging.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Record Expense
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-950 dark:bg-rose-950/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Total Recorded Expenses</p>
            <p className="text-xl font-black text-rose-900 dark:text-white">
              ₹{totalExpense.toFixed(2)}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
          {expenses.length} records
        </span>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {e.expenseDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {e.category}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                      {e.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                      ₹{e.amount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Record Expense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Rent">Shop Rent</option>
                  <option value="Electricity">Electricity & Utility</option>
                  <option value="Salary">Staff Salary / Wage</option>
                  <option value="Transport">Transport & Delivery</option>
                  <option value="Packaging">Packaging Materials</option>
                  <option value="Maintenance">Repair & Maintenance</option>
                  <option value="Tea & Snacks">Tea & Refreshments</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Paid Via</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. October store electricity bill"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
