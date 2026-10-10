import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import { Customer, CustomerLedgerEntry } from '../types/index.ts';
import {
  Users,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  FileText,
  DollarSign,
  X,
  CreditCard,
  Eye,
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected customer for Ledger drawer
  const [selectedCust, setSelectedCust] = useState<(Customer & { ledger?: CustomerLedgerEntry[] }) | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // New Customer Form
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    openingBalance: '0',
    creditLimit: '10000',
  });

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payDesc, setPayDesc] = useState('');

  useEffect(() => {
    if (currentBusiness) {
      loadCustomers();
    }
  }, [currentBusiness]);

  const loadCustomers = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const data = await api.getCustomers(currentBusiness.id);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerLedger = async (cust: Customer) => {
    if (!currentBusiness) return;
    try {
      setLedgerLoading(true);
      setSelectedCust(cust);
      const details = await api.getCustomer(currentBusiness.id, cust.id);
      setSelectedCust(details);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !newCust.name.trim()) return;

    try {
      await api.createCustomer(currentBusiness.id, newCust);
      setAddModalOpen(false);
      setNewCust({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        openingBalance: '0',
        creditLimit: '10000',
      });
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !selectedCust || !payAmount) return;

    try {
      await api.recordCustomerPayment(currentBusiness.id, selectedCust.id, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef || undefined,
        description: payDesc || `Khata payment received via ${payMethod}`,
      });
      setPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayDesc('');
      await loadCustomers();
      // Reload current customer ledger
      const updated = await api.getCustomer(currentBusiness.id, selectedCust.id);
      setSelectedCust(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const sendWhatsAppReminder = (cust: Customer) => {
    const due = parseFloat(cust.currentBalance);
    if (due <= 0) {
      alert('This customer has no pending dues.');
      return;
    }

    let text = `Hello *${cust.name}*,\n\n`;
    text += `This is a gentle payment reminder from *${currentBusiness?.name}*.\n`;
    text += `Your outstanding balance on our Khata ledger is *₹${due.toFixed(2)}*.\n\n`;
    if (currentBusiness?.upiId) {
      text += `You can pay online via UPI to: *${currentBusiness.upiId}*\n\n`;
    }
    text += `Thank you for your business!`;

    const phone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Customers & Khata Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Track credit sales, record customer payments, and send WhatsApp payment reminders.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Search by customer name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 focus:outline-hidden dark:text-white"
        />
      </div>

      {/* 2-Column: Customer Cards / Table and Selected Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold text-right">Khata Due Balance</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
                    const balance = parseFloat(cust.currentBalance);
                    const isDue = balance > 0;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => openCustomerLedger(cust)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          selectedCust?.id === cust.id ? 'bg-blue-50/60 dark:bg-blue-950/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {cust.name}
                          {cust.address && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">
                              {cust.address}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {cust.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-black ${
                              isDue
                                ? 'text-rose-600 dark:text-rose-400'
                                : balance < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {balance !== 0 ? `₹${Math.abs(balance).toFixed(2)} ${isDue ? 'Dr (Due)' : 'Cr (Advance)'}` : '₹0.00'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isDue && (
                              <button
                                onClick={() => sendWhatsAppReminder(cust)}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openCustomerLedger(cust)}
                              className="rounded-lg border px-2.5 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 font-semibold"
                            >
                              Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <Users className="mx-auto mb-2 h-8 w-8 stroke-1 text-slate-300" />
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Khata Ledger View */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col min-h-[400px]">
          {selectedCust ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedCust.name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedCust.phone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Balance Due</span>
                  <p
                    className={`text-base font-black ${
                      parseFloat(selectedCust.currentBalance) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    ₹{selectedCust.currentBalance}
                  </p>
                </div>
              </div>

              <div className="my-3 flex gap-2">
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </button>
                <button
                  onClick={() => sendWhatsAppReminder(selectedCust)}
                  className="rounded-xl border border-slate-200 p-2 text-emerald-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  title="WhatsApp Reminder"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>

              {/* Ledger Entries List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {ledgerLoading ? (
                  <p className="p-4 text-center text-slate-400">Loading ledger entries...</p>
                ) : selectedCust.ledger && selectedCust.ledger.length > 0 ? (
                  selectedCust.ledger.map((entry) => (
                    <div key={entry.id} className="py-2.5 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200 capitalize">
                          {entry.entryType.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{entry.description}</p>
                      <div className="flex justify-between items-center text-[11px] pt-0.5">
                        <span className="text-slate-400">Bal: ₹{entry.balance}</span>
                        {parseFloat(entry.debit) > 0 ? (
                          <span className="font-bold text-rose-600">+₹{entry.debit} (Bill)</span>
                        ) : (
                          <span className="font-bold text-emerald-600">-₹{entry.credit} (Paid)</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-6 text-center text-slate-400">No ledger transactions yet.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <FileText className="mb-2 h-8 w-8 stroke-1 text-slate-300" />
              Select a customer from the left list to view their live running ledger.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Add Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="GST number"
                    value={newCust.gstin}
                    onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Billing address"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Record Payment from {selectedCust.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Current Due: <strong className="text-rose-600">₹{selectedCust.currentBalance}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder={`e.g. ${selectedCust.currentBalance}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reference / UTR #</label>
                <input
                  type="text"
                  placeholder="Optional reference number"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  Save & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
