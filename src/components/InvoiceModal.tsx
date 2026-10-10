import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Business } from '../types/index.ts';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  Smartphone,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { printerService } from '../services/printer.ts';
import { pdfGenerator } from '../utils/pdfGenerator.ts';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  business: Business | null;
}

type TemplateType = 'retail' | 'gst' | 'thermal' | 'restaurant' | 'wholesale';

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  business,
}) => {
  const [template, setTemplate] = useState<TemplateType>('retail');
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoice && business?.upiId) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.upiName || business.name)}&am=${invoice.grandTotal}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;
      QRCode.toDataURL(upiUrl, { margin: 1, width: 140 })
        .then((url) => setUpiQrUrl(url))
        .catch(() => setUpiQrUrl(''));
    } else {
      setUpiQrUrl('');
    }
  }, [invoice, business]);

  if (!isOpen || !invoice || !business) return null;

  const handlePrint = () => {
    printerService.printBrowser();
  };

  const generateWhatsAppText = () => {
    let text = `*${business.name.toUpperCase()}*\n`;
    if (business.phone) text += `📞 Phone: ${business.phone}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*INVOICE: ${invoice.invoiceNumber}*\n`;
    text += `Date: ${invoice.invoiceDate}\n`;
    text += `Customer: ${invoice.customerName || 'Valued Customer'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*ITEMS:*\n`;

    if (invoice.items) {
      invoice.items.forEach((item, idx) => {
        text += `${idx + 1}. ${item.productName} (${item.quantity} ${item.unit}) - ₹${item.total}\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Subtotal:* ₹${invoice.subtotal}\n`;
    if (parseFloat(invoice.totalDiscount) > 0) {
      text += `*Discount:* -₹${invoice.totalDiscount}\n`;
    }
    if (parseFloat(invoice.totalTax) > 0) {
      text += `*GST Tax:* ₹${invoice.totalTax}\n`;
    }
    text += `*GRAND TOTAL: ₹${invoice.grandTotal}*\n`;
    text += `*Paid Amount:* ₹${invoice.paidAmount}\n`;

    if (parseFloat(invoice.balanceAmount) > 0) {
      text += `*Balance Due:* ₹${invoice.balanceAmount}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `${business.footerMessage || 'Thank you for shopping with us!'}`;
    return encodeURIComponent(text);
  };

  const handleWhatsAppShare = () => {
    const text = generateWhatsAppText();
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const text = decodeURIComponent(generateWhatsAppText());
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Single Share Action: tries native Web Share sheet, falls back to direct WhatsApp
  const handleSingleShare = async () => {
    const shareText = decodeURIComponent(generateWhatsAppText());
    const shareTitle = `Invoice #${invoice.invoiceNumber} - ${business.name}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        });
        return;
      } catch (err: any) {
        // If user actively cancelled, do nothing
        if (err.name === 'AbortError') return;
      }
    }

    // Direct WhatsApp fallback for desktop or non-share devices
    handleWhatsAppShare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 my-auto max-h-[92vh] flex flex-col">
        {/* Header Controls (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between border-b border-slate-200 p-3 sm:p-4 dark:border-slate-800 gap-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Invoice #{invoice.invoiceNumber}
            </h3>
          </div>

          {/* Template Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
            {(['retail', 'gst', 'thermal', 'restaurant'] as TemplateType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                  template === t
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* 1. Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs active:scale-95 transition-all"
              title="Print via thermal / system printer"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            {/* 2. 3-Inch (80mm) Thermal POS PDF Export */}
            <button
              onClick={() => pdfGenerator.generate3InchThermalInvoicePdf(business, invoice, upiQrUrl)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all"
              title="Download 3-Inch (80mm) Thermal POS Roll PDF"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>3" PDF</span>
            </button>

            {/* 3. Standard A4 PDF Export */}
            <button
              onClick={() => pdfGenerator.generateSingleInvoicePdf(business, invoice)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 active:scale-95 transition-all"
              title="Download standard full-page A4 PDF"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>A4 PDF</span>
            </button>

            {/* 4. Single Share Option Button */}
            <div className="relative inline-flex rounded-xl shadow-xs">
              <button
                onClick={handleSingleShare}
                className="flex items-center gap-1.5 rounded-l-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all"
                title="Single Share Invoice (Native Share / WhatsApp)"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="rounded-r-xl border-l border-emerald-500/40 bg-teal-600 px-1.5 py-2 text-white hover:bg-teal-700 transition-all"
                title="More Share Options"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Single Share Options
                  </div>

                  {/* 1. Instant Single Share (System) */}
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      handleSingleShare();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    <span>Single Share (1-Tap)</span>
                  </button>

                  {/* 2. Direct WhatsApp */}
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      handleWhatsAppShare();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>Send via WhatsApp</span>
                  </button>

                  {/* 3. Export 3-Inch PDF */}
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      pdfGenerator.generate3InchThermalInvoicePdf(business, invoice, upiQrUrl);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 text-amber-500" />
                    <span>Download 3" PDF</span>
                  </button>

                  {/* 4. Export A4 PDF */}
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      pdfGenerator.generateSingleInvoicePdf(business, invoice);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Download A4 PDF</span>
                  </button>

                  {/* 5. Copy Bill Summary */}
                  <button
                    onClick={() => {
                      handleCopySummary();
                      setTimeout(() => setShowShareMenu(false), 800);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Bill Summary'}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body Viewable & Printable */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/50 flex-1">
          {template === 'thermal' && (
            <div className="no-print max-w-[420px] mx-auto mb-3 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
              <span className="font-semibold">3-Inch (80mm) Continuous Thermal Roll Preview</span>
              <button
                onClick={() => pdfGenerator.generate3InchThermalInvoicePdf(business, invoice, upiQrUrl)}
                className="inline-flex items-center gap-1 font-bold rounded-lg bg-amber-600 px-2.5 py-1 text-white hover:bg-amber-700 shadow-xs"
              >
                <Download className="h-3 w-3" />
                Export 3" PDF
              </button>
            </div>
          )}

          <div
            ref={printRef}
            id="printable-invoice"
            className={`mx-auto bg-white p-6 shadow-sm border border-slate-200 text-slate-900 transition-all ${
              template === 'thermal'
                ? business.thermalWidth === '58mm'
                  ? 'max-w-[340px] text-xs font-mono p-3'
                  : 'max-w-[420px] text-xs font-mono p-4'
                : 'max-w-2xl'
            }`}
          >
            {/* Business Header */}
            <div className="text-center border-b pb-4 border-slate-200">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                {business.name}
              </h1>
              {business.address && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {business.address}, {business.city} {business.pincode}
                </p>
              )}
              <div className="mt-1 flex flex-wrap justify-center gap-x-3 text-xs text-slate-600">
                {business.phone && <span>Ph: {business.phone}</span>}
                {business.email && <span>Email: {business.email}</span>}
              </div>
              {business.isGstRegistered && business.gstin && (
                <p className="mt-1 text-xs font-bold text-blue-700">
                  GSTIN: {business.gstin}
                </p>
              )}
              <div className="mt-2 inline-block rounded-sm bg-slate-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {template === 'thermal' ? '3-INCH THERMAL RECEIPT' : template === 'gst' ? 'TAX INVOICE' : template === 'restaurant' ? 'KITCHEN / GUEST BILL' : 'RETAIL INVOICE'}
              </div>
            </div>

            {/* Meta Details: Invoice #, Date, Customer */}
            <div className="my-3 grid grid-cols-2 text-xs border-b pb-3 border-slate-200 gap-2">
              <div>
                <p><span className="font-semibold text-slate-600">Invoice No:</span> <strong className="text-slate-900">{invoice.invoiceNumber}</strong></p>
                <p><span className="font-semibold text-slate-600">Date:</span> {invoice.invoiceDate}</p>
                <p><span className="font-semibold text-slate-600">Cashier:</span> {invoice.cashierName || 'Admin'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{invoice.customerName || 'Walk-in Customer'}</p>
                {invoice.customerPhone && <p className="text-slate-600">Ph: {invoice.customerPhone}</p>}
                {invoice.customerGstin && <p className="font-semibold text-blue-700">GSTIN: {invoice.customerGstin}</p>}
                {invoice.customerAddress && <p className="text-slate-600 truncate">{invoice.customerAddress}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="py-1.5 font-semibold">Item</th>
                    {template === 'gst' && <th className="py-1.5 font-semibold">HSN</th>}
                    <th className="py-1.5 text-right font-semibold">Qty</th>
                    <th className="py-1.5 text-right font-semibold">Rate</th>
                    {template === 'gst' && <th className="py-1.5 text-right font-semibold">GST%</th>}
                    <th className="py-1.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 font-medium text-slate-900">
                          {it.productName}
                          {parseFloat(it.discount) > 0 && (
                            <span className="block text-[10px] text-emerald-600">Disc: -₹{it.discount}</span>
                          )}
                        </td>
                        {template === 'gst' && <td className="py-1.5 text-slate-500">{it.hsnSac || '-'}</td>}
                        <td className="py-1.5 text-right text-slate-700">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-1.5 text-right text-slate-700">₹{it.unitPrice}</td>
                        {template === 'gst' && <td className="py-1.5 text-right text-slate-700">{it.taxRate}%</td>}
                        <td className="py-1.5 text-right font-semibold text-slate-900">₹{it.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-400">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex justify-between py-0.5 text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{invoice.subtotal}</span>
              </div>
              {parseFloat(invoice.totalDiscount) > 0 && (
                <div className="flex justify-between py-0.5 text-xs text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-₹{invoice.totalDiscount}</span>
                </div>
              )}
              {parseFloat(invoice.totalTax) > 0 && (
                <>
                  {parseFloat(invoice.cgstAmount) > 0 && (
                    <div className="flex justify-between py-0.5 text-xs text-slate-600">
                      <span>CGST:</span>
                      <span>₹{invoice.cgstAmount}</span>
                    </div>
                  )}
                  {parseFloat(invoice.sgstAmount) > 0 && (
                    <div className="flex justify-between py-0.5 text-xs text-slate-600">
                      <span>SGST:</span>
                      <span>₹{invoice.sgstAmount}</span>
                    </div>
                  )}
                  {parseFloat(invoice.igstAmount) > 0 && (
                    <div className="flex justify-between py-0.5 text-xs text-slate-600">
                      <span>IGST:</span>
                      <span>₹{invoice.igstAmount}</span>
                    </div>
                  )}
                </>
              )}
              {parseFloat(invoice.roundOff) !== 0 && (
                <div className="flex justify-between py-0.5 text-xs text-slate-500">
                  <span>Round Off:</span>
                  <span>{parseFloat(invoice.roundOff) > 0 ? `+₹${invoice.roundOff}` : `-₹${Math.abs(parseFloat(invoice.roundOff))}`}</span>
                </div>
              )}
              <div className="mt-1.5 flex justify-between border-t border-b border-slate-300 py-2 text-base font-black text-slate-900">
                <span>GRAND TOTAL:</span>
                <span className="text-blue-700">₹{invoice.grandTotal}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-slate-700">
                <span>Payment Mode:</span>
                <span className="font-semibold">{invoice.paymentMethod} ({invoice.paymentStatus})</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Paid Amount:</span>
                <span className="font-semibold text-emerald-700">₹{invoice.paidAmount}</span>
              </div>
              {parseFloat(invoice.balanceAmount) > 0 && (
                <div className="flex justify-between text-xs text-amber-700 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{invoice.balanceAmount}</span>
                </div>
              )}
            </div>

            {/* UPI QR & Payment Prompt */}
            {upiQrUrl && parseFloat(invoice.balanceAmount) > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-left text-xs">
                  <p className="font-bold text-slate-900">Scan UPI to Pay</p>
                  <p className="text-[11px] text-slate-600">GPay, PhonePe, Paytm, BHIM</p>
                  <p className="text-[10px] text-blue-600 font-mono mt-0.5">{business.upiId}</p>
                </div>
                <img src={upiQrUrl} alt="UPI QR Code" className="h-16 w-16 rounded-md border" />
              </div>
            )}

            {/* Footer & Terms */}
            <div className="mt-4 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
              <p className="font-medium text-slate-700">{business.footerMessage || 'Thank you! Visit again.'}</p>
              {business.termsAndConditions && (
                <p className="mt-1 whitespace-pre-line text-slate-400">
                  {business.termsAndConditions}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
