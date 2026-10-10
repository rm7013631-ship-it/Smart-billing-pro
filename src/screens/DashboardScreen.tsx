import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { api } from '../services/api.ts';
import { Invoice } from '../types/index.ts';
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
  CreditCard,
  QrCode,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
} from 'lucide-react';
import { pdfGenerator } from '../utils/pdfGenerator.ts';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onViewInvoice,
}) => {
  const { currentBusiness } = useBusiness();
  const { t } = useLanguage();
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBusiness) {
      loadDashboard();
    }
  }, [currentBusiness, period]);

  const loadDashboard = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const res = await api.getDashboard(currentBusiness.id, period);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentBusiness) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading business data...
      </div>
    );
  }

  const paymentBreakdown = data?.paymentBreakdown || {};

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance for <strong className="text-slate-700 dark:text-slate-300">{currentBusiness.name}</strong>
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-white p-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                period === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-xl shadow-blue-500/10">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Fast POS Counter is Ready</h2>
          <p className="text-xs text-blue-100 max-w-xl">
            Quickly bill customers with barcode scanning, instant GST breakdown, UPI QR code generator, and thermal receipt printing.
          </p>
        </div>
        <button
          onClick={() => onNavigate('pos')}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-blue-600 shadow-md hover:bg-blue-50 active:scale-95 transition-transform"
        >
          <ShoppingCart className="h-4 w-4" />
          Open Billing Counter
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Sales</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              ₹{loading ? '...' : (data?.totalSales || '0.00')}
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              {data?.totalBills || 0} completed invoices
            </p>
          </div>
        </div>

        {/* Collected Payments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Collected Cash & Digital</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{loading ? '...' : (data?.totalCollected || '0.00')}
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              Net collected payments
            </p>
          </div>
        </div>

        {/* Pending Customer Khata */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Customer Due</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{loading ? '...' : (data?.pendingDue || '0.00')}
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              Receivables in Khata ledger
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              ₹{loading ? '...' : (data?.totalExpenses || '0.00')}
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              Recorded operational costs
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if items exist */}
      {data?.lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                {data.lowStockCount} Products are Below Minimum Stock Level
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Restock soon to avoid running out of inventory during peak counter sales.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* 2-Column Analytics: Payment Breakdown & Best Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Payment Method Collections
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Cash', icon: DollarSign, amount: paymentBreakdown['Cash'] || 0, color: 'bg-emerald-500' },
              { name: 'UPI / QR', icon: QrCode, amount: paymentBreakdown['UPI'] || 0, color: 'bg-blue-500' },
              { name: 'Card', icon: CreditCard, amount: paymentBreakdown['Card'] || 0, color: 'bg-indigo-500' },
              { name: 'Bank Transfer', icon: ArrowUpRight, amount: paymentBreakdown['Bank Transfer'] || 0, color: 'bg-purple-500' },
            ].map((method) => {
              const Icon = method.icon;
              const total = parseFloat(data?.totalCollected || '1') || 1;
              const percent = Math.min(100, Math.round((method.amount / total) * 100));

              return (
                <div key={method.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      {method.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{method.amount.toFixed(2)} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${method.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Best-Selling Products
          </h3>
          {data?.topSellingItems && data.topSellingItems.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.topSellingItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">₹{item.amount}</span>
                    <p className="text-[10px] text-slate-400">{item.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-xs text-slate-400">
              <Receipt className="mb-2 h-8 w-8 stroke-[1.5]" />
              No sales recorded for this period
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Invoices</h3>
            <p className="text-xs text-slate-400">Latest completed and processed customer bills</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All Bills →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Bill #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                data.recentInvoices.map((inv: Invoice) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {inv.customerName || 'Walk-in'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                      ₹{inv.grandTotal}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : inv.paymentStatus === 'Partial'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold"
                          title="View Invoice"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        <button
                          onClick={async () => {
                            if (!currentBusiness) return;
                            try {
                              const detailed = await api.getInvoice(currentBusiness.id, inv.id);
                              pdfGenerator.generate3InchThermalInvoicePdf(currentBusiness, detailed);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold"
                          title="Instant Download 3-Inch Thermal POS Receipt PDF"
                        >
                          <Download className="h-3 w-3 text-amber-400" />
                          3" PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No recent bills found. Start billing from the POS counter!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
