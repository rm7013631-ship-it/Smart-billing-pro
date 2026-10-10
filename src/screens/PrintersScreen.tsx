import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { printerService } from '../services/printer.ts';
import {
  Printer,
  Bluetooth,
  Usb,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCw,
  Sliders,
} from 'lucide-react';

export const PrintersScreen: React.FC = () => {
  const { currentBusiness, updateCurrentBusiness } = useBusiness();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (currentBusiness?.thermalWidth) {
      setPaperWidth(currentBusiness.thermalWidth);
      printerService.setPaperWidth(currentBusiness.thermalWidth);
    }
  }, [currentBusiness]);

  const handleWidthChange = async (w: '58mm' | '80mm') => {
    setPaperWidth(w);
    printerService.setPaperWidth(w);
    if (currentBusiness) {
      await updateCurrentBusiness({ thermalWidth: w });
    }
  };

  const handleConnectBluetooth = async () => {
    setConnecting(true);
    setStatusMessage(null);
    setIsError(false);

    const res = await printerService.connectBluetooth();
    setConnecting(false);

    if (res.success) {
      setConnectedDevice(res.name);
      setStatusMessage(`Connected to ${res.name} successfully via Web Bluetooth.`);
      setIsError(false);
    } else {
      setStatusMessage(res.error || 'Failed to connect');
      setIsError(true);
    }
  };

  const handleTestPrint = async () => {
    const sampleText =
      `================================\n` +
      `       SMART BILLING PRO\n` +
      `   ${currentBusiness?.name || 'Retail POS Store'}\n` +
      `================================\n` +
      `TEST THERMAL PRINT - ${paperWidth}\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `--------------------------------\n` +
      `Item 1 x 1                Rs 150.00\n` +
      `Item 2 x 2                Rs 300.00\n` +
      `--------------------------------\n` +
      `TOTAL:                    Rs 450.00\n` +
      `GST Tax (5%):              Rs 22.50\n` +
      `================================\n` +
      `Thank you for shopping with us!\n\n\n\n`;

    const rawData = printerService.generateEscPosData(sampleText);
    const res = await printerService.printRaw(rawData);

    if (res.fallback) {
      setStatusMessage('Standard browser print window opened as fallback.');
      setIsError(false);
    } else if (res.success) {
      setStatusMessage('Test page sent to thermal printer successfully!');
      setIsError(false);
    }
  };

  const isBluetoothSupported = printerService.isWebBluetoothSupported();

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Thermal Printer Management
        </h1>
        <p className="text-xs text-slate-500">
          Connect ESC/POS Bluetooth, USB, or Network thermal receipt printers for fast counter printing.
        </p>
      </div>

      {/* Printer Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paper Width Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Paper Roll Width
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleWidthChange('58mm')}
              className={`rounded-xl border p-4 text-left transition-all ${
                paperWidth === '58mm'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
              }`}
            >
              <span className="text-sm font-black text-slate-900 dark:text-white block">
                58mm (2-inch)
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Compact handheld Bluetooth wireless thermal printers (32 characters/line).
              </span>
            </button>

            <button
              onClick={() => handleWidthChange('80mm')}
              className={`rounded-xl border p-4 text-left transition-all ${
                paperWidth === '80mm'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
              }`}
            >
              <span className="text-sm font-black text-slate-900 dark:text-white block">
                80mm (3-inch)
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Standard retail POS counter thermal printers (48 characters/line with auto-cutter).
              </span>
            </button>
          </div>
        </div>

        {/* Wireless Bluetooth Connection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Web Bluetooth ESC/POS
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Direct wireless pairing with compatible ESC/POS Bluetooth printers (supported on Chrome for Android and desktop).
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnectBluetooth}
              disabled={connecting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              <Bluetooth className="h-4 w-4" />
              {connecting ? 'Searching Device...' : connectedDevice ? 'Re-pair Printer' : 'Scan & Pair Bluetooth'}
            </button>

            {connectedDevice ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {connectedDevice}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Not connected</span>
            )}
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 ${
            isError
              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          {isError ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
          <div>
            <p>{statusMessage}</p>
            {isError && (
              <p className="mt-1 text-[11px] font-normal text-amber-700 dark:text-amber-400">
                Alternative: All desktop, Android, and iOS browsers support instant 58mm/80mm receipt generation via standard system print and PDF export.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Test Print Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Run Receipt Test Print
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sends an ESC/POS formatted test slip with store details, item lines, and alignment checks to test font rendering.
          </p>
        </div>

        <button
          onClick={handleTestPrint}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 shrink-0"
        >
          <Printer className="h-4 w-4" />
          Print Test Page
        </button>
      </div>
    </div>
  );
};
