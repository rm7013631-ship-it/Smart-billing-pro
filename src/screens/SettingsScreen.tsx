import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import {
  Settings,
  Store,
  Receipt,
  QrCode,
  Sliders,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { currentBusiness, updateCurrentBusiness, seedDemoData } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    isGstRegistered: true,
    invoicePrefix: 'INV-',
    thermalWidth: '80mm' as '58mm' | '80mm',
    businessType: 'Retail',
    upiId: '',
    upiName: '',
    footerMessage: '',
    termsAndConditions: '',
    enableNegativeStock: false,
    taxInclusivePricing: true,
  });

  useEffect(() => {
    if (currentBusiness) {
      setFormData({
        name: currentBusiness.name || '',
        ownerName: currentBusiness.ownerName || '',
        phone: currentBusiness.phone || '',
        email: currentBusiness.email || '',
        address: currentBusiness.address || '',
        city: currentBusiness.city || '',
        state: currentBusiness.state || '',
        pincode: currentBusiness.pincode || '',
        gstin: currentBusiness.gstin || '',
        isGstRegistered: currentBusiness.isGstRegistered,
        invoicePrefix: currentBusiness.invoicePrefix || 'INV-',
        thermalWidth: currentBusiness.thermalWidth || '80mm',
        businessType: currentBusiness.businessType || 'Retail',
        upiId: currentBusiness.upiId || '',
        upiName: currentBusiness.upiName || '',
        footerMessage: currentBusiness.footerMessage || '',
        termsAndConditions: currentBusiness.termsAndConditions || '',
        enableNegativeStock: currentBusiness.enableNegativeStock,
        taxInclusivePricing: currentBusiness.taxInclusivePricing,
      });
    }
  }, [currentBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    try {
      setSaving(true);
      await updateCurrentBusiness(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!confirm('This will load additional popular retail items and sample customers into this store. Proceed?')) return;
    try {
      await seedDemoData();
      alert('Demo catalog items seeded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Store & POS Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure GSTIN, receipt layout, UPI payment QR code, and business preferences.
          </p>
        </div>

        <button
          onClick={handleSeedDemo}
          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
        >
          <Sparkles className="h-4 w-4 text-blue-600" />
          Seed Demo Products
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
          <CheckCircle className="h-4 w-4" />
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Store className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Business Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store / Business Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Proprietor / Owner Name</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* GST & Invoice Numbering */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Receipt className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              GST & Invoice Numbering
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isGst"
              checked={formData.isGstRegistered}
              onChange={(e) => setFormData({ ...formData, isGstRegistered: e.target.checked })}
              className="h-4 w-4 rounded-sm text-blue-600"
            />
            <label htmlFor="isGst" className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
              Business is GST Registered
            </label>
          </div>

          {formData.isGstRegistered && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN</label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full font-mono uppercase rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax Pricing Mode</label>
              <select
                value={formData.taxInclusivePricing ? 'inclusive' : 'exclusive'}
                onChange={(e) => setFormData({ ...formData, taxInclusivePricing: e.target.value === 'inclusive' })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="inclusive">Tax Inclusive (Prices include GST)</option>
                <option value="exclusive">Tax Exclusive (GST added at checkout)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="negStock"
              checked={formData.enableNegativeStock}
              onChange={(e) => setFormData({ ...formData, enableNegativeStock: e.target.checked })}
              className="h-4 w-4 rounded-sm text-blue-600"
            />
            <label htmlFor="negStock" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Allow Negative Stock (Sell items even when calculated stock is 0)
            </label>
          </div>
        </div>

        {/* UPI Payments & Receipts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <QrCode className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              UPI QR Code & Thermal Receipts
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                placeholder="store@upi"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full font-mono rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payee Name</label>
              <input
                type="text"
                placeholder="Merchant Name"
                value={formData.upiName}
                onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bill Footer Thank You Note</label>
            <input
              type="text"
              value={formData.footerMessage}
              onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions</label>
            <textarea
              rows={3}
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
