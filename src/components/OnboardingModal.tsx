import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Store, Building2, Receipt, CreditCard, Sparkles, X, ArrowRight, Rocket } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { createBusiness, seedDemoData } = useBusiness();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Delhi',
    pincode: '',
    businessType: 'Retail',
    gstin: '',
    isGstRegistered: true,
    invoicePrefix: 'INV-',
    thermalWidth: '80mm' as '58mm' | '80mm',
    upiId: '',
    upiName: '',
    footerMessage: 'Thank you for shopping with us! Visit again.',
    termsAndConditions: '1. Goods once sold will not be returned without valid bill.\n2. All disputes subject to local jurisdiction.',
    seedDemo: true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      const newBiz = await createBusiness({
        name: formData.name.trim(),
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        businessType: formData.businessType,
        gstin: formData.gstin.trim(),
        isGstRegistered: formData.isGstRegistered,
        invoicePrefix: formData.invoicePrefix.trim() || 'INV-',
        thermalWidth: formData.thermalWidth,
        upiId: formData.upiId.trim(),
        upiName: formData.upiName.trim() || formData.name.trim(),
        footerMessage: formData.footerMessage,
        termsAndConditions: formData.termsAndConditions,
      });

      if (formData.seedDemo) {
        await seedDemoData();
      }

      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create business');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <h2 className="text-xl font-black tracking-tight">Business Setup Wizard</h2>
            </div>
            <p className="mt-1 text-xs text-blue-100">
              Configure your store, tax settings, and thermal printer layout in 3 simple steps.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 py-1 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">1</span>
            Store Profile
          </button>
          <span className="mx-3 text-slate-300 dark:text-slate-700">/</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 py-1 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">2</span>
            GST & Billing
          </button>
          <span className="mx-3 text-slate-300 dark:text-slate-700">/</span>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 py-1 ${step === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">3</span>
            UPI & Printing
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krishna Supermarket, Apex Retail"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="Owner / Proprietor"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Business Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Retail">General Retail</option>
                    <option value="Grocery">Grocery / Kirana</option>
                    <option value="Restaurant">Restaurant / Cafe</option>
                    <option value="Clothing">Clothing & Apparel</option>
                    <option value="Pharmacy">Pharmacy / Chemist</option>
                    <option value="Wholesale">Wholesale & B2B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@store.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store Address
                </label>
                <input
                  type="text"
                  placeholder="Shop No., Street, Market Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="110001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGstRegistered}
                    onChange={(e) => setFormData({ ...formData, isGstRegistered: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">This business is GST Registered</span>
                </label>
                <p className="mt-1 text-xs text-slate-500 pl-6">
                  Enables CGST, SGST, IGST calculations and HSN codes on tax invoices.
                </p>
              </div>

              {formData.isGstRegistered && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full font-mono uppercase rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="INV-"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Footer Thank You Note
                </label>
                <input
                  type="text"
                  value={formData.footerMessage}
                  onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID (VPA) for Instant Customer QR Payment
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourstore@okhdfcbank or 9876543210@paytm"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full font-mono rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Generates an automatic UPI QR code on receipts for fast customer payment.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thermal Receipt Paper Width
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thermalWidth: '58mm' })}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      formData.thermalWidth === '58mm'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900 dark:text-white">58mm (2-inch)</p>
                    <p className="text-xs text-slate-500">Compact handheld Bluetooth printers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thermalWidth: '80mm' })}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      formData.thermalWidth === '80mm'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900 dark:text-white">80mm (3-inch)</p>
                    <p className="text-xs text-slate-500">Standard desktop POS counter printers</p>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.seedDemo}
                    onChange={(e) => setFormData({ ...formData, seedDemo: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Pre-populate realistic catalog & items
                    </span>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Loads popular items with barcodes, stock levels, and demo customers so you can test billing right away.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Wizard Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !formData.name.trim()) {
                    alert('Please enter business name');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/35 active:scale-95 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Next Step</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-7 py-2.5 text-xs font-black tracking-wide text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95 transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Rocket className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>{saving ? 'Setting up Live Store...' : 'Launch Store & Start Billing 🚀'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
