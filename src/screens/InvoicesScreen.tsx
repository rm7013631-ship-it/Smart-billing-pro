import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { Invoice } from '../types/index.ts';
import {
  Search,
  Receipt,
  Eye,
  XCircle,
  Download,
  Share2,
  Calendar,
  Filter,
} from 'lucide-react';
import { pdfGenerator } from '../utils/pdfGenerator.ts';

interface InvoicesScreenProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ onViewInvoice }) => {
  const { currentBusiness } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Cancel invoice modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      loadInvoices();
    }
  }, [currentBusiness, search, paymentStatusFilter, statusFilter]);

  const loadInvoices = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const data = await api.getInvoices(currentBusiness.id, {
        search: search.trim() || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        status: statusFilter || undefined,
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !selectedInvoiceForCancel) return;

    try {
      setCancelling(true);
      await api.cancelInvoice(
        currentBusiness.id,
        selectedInvoiceForCancel.id,
        cancelReason || 'Cancelled by customer'
      );
      setCancelModalOpen(false);
      setSelectedInvoiceForCancel(null);
      setCancelReason('');
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handleDirectShare = async (inv: Invoice) => {
    if (!currentBusiness) return;
    try {
      const detailed = await api.getInvoice(currentBusiness.id, inv.id);
      let text = `*${currentBusiness.name.toUpperCase()}*\n`;
      if (currentBusiness.phone) text += `📞 Phone: ${currentBusiness.phone}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `*INVOICE: ${detailed.invoiceNumber}*\n`;
      text += `Date: ${detailed.invoiceDate}\n`;
      text += `Customer: ${detailed.customerName || 'Valued Customer'}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `*ITEMS:*\n`;
      if (detailed.items) {
        detailed.items.forEach((item, idx) => {
          text += `${idx + 1}. ${item.productName} (${item.quantity} ${item.unit}) - ₹${item.total}\n`;
        });
      }
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `*Subtotal:* ₹${detailed.subtotal}\n`;
      if (parseFloat(detailed.totalDiscount) > 0) text += `*Discount:* -₹${detailed.totalDiscount}\n`;
      if (parseFloat(detailed.totalTax) > 0) text += `*GST Tax:* ₹${detailed.totalTax}\n`;
      text += `*GRAND TOTAL: ₹${detailed.grandTotal}*\n`;
      text += `*Paid Amount:* ₹${detailed.paidAmount}\n`;
      if (parseFloat(detailed.balanceAmount) > 0) text += `*Balance Due:* ₹${detailed.balanceAmount}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${currentBusiness.footerMessage || 'Thank you for shopping with us!'}`;

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: `Invoice #${detailed.invoiceNumber} - ${currentBusiness.name}`,
            text: text,
          });
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return;
        }
      }

      // WhatsApp fallback
      const phone = detailed.customerPhone ? detailed.customerPhone.replace(/[^0-9]/g, '') : '';
      const encoded = encodeURIComponent(text);
      const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error sharing invoice:', err);
    }
  };

  const handleDirect3InchPdf = async (inv: Invoice) => {
    if (!currentBusiness) return;
    try {
      const detailed = await api.getInvoice(currentBusiness.id, inv.id);
      pdfGenerator.generate3InchThermalInvoicePdf(currentBusiness, detailed);
    } catch (err) {
      console.error('Error exporting 3-inch PDF:', err);
    }
  };

  const exportCSV = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice No', 'Date', 'Customer', 'Phone', 'Grand Total', 'Paid', 'Balance', 'Method', 'Status'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      i.invoiceDate,
      `"${i.customerName || 'Walk-in'}"`,
      i.customerPhone || '',
      i.grandTotal,
      i.paidAmount,
      i.balanceAmount,
      i.paymentMethod,
      i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invoices_${currentBusiness?.name || 'store'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Invoices & Sales History
          </h1>
          <p className="text-xs text-slate-500">
            View, reprint, share on WhatsApp, or process returns & cancellations.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={invoices.length === 0}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export Invoices CSV
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Payment status filter */}
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial Due</option>
          <option value="Unpaid">Unpaid</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Bill #</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Total</th>
                <th className="py-3 px-4 font-semibold text-right">Paid</th>
                <th className="py-3 px-4 font-semibold text-right">Due</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      inv.status === 'cancelled' ? 'opacity-60 bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {inv.customerName || 'Walk-in'}
                      {inv.customerPhone && (
                        <span className="block text-[10px] text-slate-400">{inv.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{inv.grandTotal}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{inv.paidAmount}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {parseFloat(inv.balanceAmount) > 0 ? `₹${inv.balanceAmount}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {inv.status === 'cancelled' ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          Cancelled
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : inv.paymentStatus === 'Partial'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            // Fetch full details with items
                            const detailed = await api.getInvoice(currentBusiness!.id, inv.id);
                            onViewInvoice(detailed);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold"
                          title="View Invoice & Full Print"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>

                        <button
                          onClick={() => handleDirect3InchPdf(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold"
                          title="Instant Download 3-Inch (80mm) Thermal POS PDF"
                        >
                          <Download className="h-3 w-3 text-amber-400" />
                          3" PDF
                        </button>

                        <button
                          onClick={() => handleDirectShare(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700 font-semibold shadow-xs"
                          title="Single Share Invoice via WhatsApp or Native Share"
                        >
                          <Share2 className="h-3 w-3" />
                          Share
                        </button>

                        {inv.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForCancel(inv);
                              setCancelModalOpen(true);
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            title="Cancel / Return Sale"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <Receipt className="mx-auto mb-2 h-8 w-8 stroke-1 text-slate-300" />
                    No invoices matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Invoice Confirmation Modal */}
      {cancelModalOpen && selectedInvoiceForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Cancel Bill #{selectedInvoiceForCancel.invoiceNumber}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cancelling this sale will automatically restore inventory stock for all items and reverse any Khata ledger debit balance.
            </p>

            <form onSubmit={handleCancelInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer returned goods, Wrong items entered"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelling ? 'Reverting...' : 'Confirm Cancel & Restore Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
