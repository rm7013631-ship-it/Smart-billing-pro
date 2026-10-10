import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { api } from '../services/api.ts';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Percent,
  Boxes,
  FileText,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import { pdfGenerator } from '../utils/pdfGenerator.ts';

export const ReportsScreen: React.FC = () => {
  const { currentBusiness } = useBusiness();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      loadReport();
    }
  }, [currentBusiness, fromDate, toDate]);

  const loadReport = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const [res, prodList] = await Promise.all([
        api.getReports(currentBusiness.id, fromDate, toDate),
        api.getProducts(currentBusiness.id),
      ]);
      setReport(res);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFinancialPdf = () => {
    if (!currentBusiness || !report) return;
    pdfGenerator.generateFinancialSummaryPdf(currentBusiness, report, fromDate, toDate);
    setShowPdfMenu(false);
  };

  const handleDownloadGstPdf = () => {
    if (!currentBusiness || !report) return;
    pdfGenerator.generateGstReportPdf(currentBusiness, report, fromDate, toDate);
    setShowPdfMenu(false);
  };

  const handleDownloadInventoryPdf = () => {
    if (!currentBusiness || products.length === 0) return;
    pdfGenerator.generateInventoryValuationPdf(currentBusiness, products);
    setShowPdfMenu(false);
  };

  const exportGstCSV = () => {
    if (!report?.gstBreakdown) return;
    const headers = ['GST Slab', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST Tax'];
    const rows = report.gstBreakdown.map((g: any) => [
      g.slab,
      g.taxable,
      g.cgst,
      g.sgst,
      g.igst,
      g.totalTax,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `gst_summary_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = report?.summary || {};
  const gstBreakdown = report?.gstBreakdown || [];

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header & Date Range Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Reports & Tax Analytics
          </h1>
          <p className="text-xs text-slate-500">
            GST GSTR-1 summaries, profit estimates, and inventory valuation based on real stored records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 text-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-slate-400 font-semibold px-1">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white focus:outline-hidden"
            />
            <span className="text-slate-400 font-semibold px-1">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white focus:outline-hidden"
            />
          </div>

          {/* PDF Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <FileDown className="h-4 w-4" />
              <span>Download PDF</span>
              <ChevronDown className="h-3.5 w-3.5 text-blue-200" />
            </button>

            {showPdfMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select PDF Report
                </div>

                <button
                  onClick={handleDownloadFinancialPdf}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-bold">Financial Sales Summary</p>
                    <p className="text-[10px] text-slate-400">Executive metrics & invoices</p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadGstPdf}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Percent className="h-4 w-4 text-indigo-600" />
                  <div>
                    <p className="font-bold">GST GSTR-1 Tax Report</p>
                    <p className="text-[10px] text-slate-400">CGST, SGST, IGST rate slabs</p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadInventoryPdf}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Boxes className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-bold">Stock & Inventory Valuation</p>
                    <p className="text-[10px] text-slate-400">Unit cost vs retail valuation</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={exportGstCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500">Net Sales Turnover</span>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ₹{summary.totalSales || '0.00'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{summary.totalBills || 0} Bills issued</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500">Total GST Collected</span>
          <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹{summary.totalTax || '0.00'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">CGST + SGST + IGST liability</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500">Estimated Net Profit</span>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{summary.estimatedNetProfit || '0.00'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Sales minus shop expenses</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500">Inventory Valuation</span>
          <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            ₹{summary.inventoryRetailValue || '0.00'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Cost value: ₹{summary.inventoryCostValue || '0.00'}
          </p>
        </div>
      </div>

      {/* GST Slab Breakdown (Indian GSTR-1 format) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            GST Slabs Tax Summary (GSTR-1 Format)
          </h3>
          <p className="text-xs text-slate-400">
            Taxable supplies breakdown per rate slab for sales made in the selected period.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Tax Slab</th>
                <th className="py-3 px-4 font-semibold text-right">Taxable Value</th>
                <th className="py-3 px-4 font-semibold text-right">CGST</th>
                <th className="py-3 px-4 font-semibold text-right">SGST</th>
                <th className="py-3 px-4 font-semibold text-right">IGST</th>
                <th className="py-3 px-4 font-semibold text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {gstBreakdown.length > 0 ? (
                gstBreakdown.map((g: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {g.slab}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      ₹{g.taxable}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      ₹{g.cgst}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      ₹{g.sgst}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      ₹{g.igst}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-blue-600 dark:text-blue-400">
                      ₹{g.totalTax}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No taxable sales in the selected period.
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
