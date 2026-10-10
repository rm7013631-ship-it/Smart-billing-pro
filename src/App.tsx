import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { BusinessProvider, useBusiness } from './context/BusinessContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { Invoice } from './types/index.ts';

// Screens
import { DashboardScreen } from './screens/DashboardScreen.tsx';
import { POSScreen } from './screens/POSScreen.tsx';
import { InvoicesScreen } from './screens/InvoicesScreen.tsx';
import { ProductsScreen } from './screens/ProductsScreen.tsx';
import { InventoryScreen } from './screens/InventoryScreen.tsx';
import { CustomersScreen } from './screens/CustomersScreen.tsx';
import { SuppliersScreen } from './screens/SuppliersScreen.tsx';
import { PurchasesScreen } from './screens/PurchasesScreen.tsx';
import { ExpensesScreen } from './screens/ExpensesScreen.tsx';
import { ReportsScreen } from './screens/ReportsScreen.tsx';
import { StaffScreen } from './screens/StaffScreen.tsx';
import { PrintersScreen } from './screens/PrintersScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import {
  Boxes,
  Truck,
  ShoppingBag,
  Wallet,
  BarChart3,
  UserCheck,
  Printer,
  Settings,
  X,
} from 'lucide-react';

function MainApp() {
  const { currentBusiness, loading } = useBusiness();
  const { t } = useLanguage();
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Invoice Preview Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Mobile More Menu Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSaleComplete = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceModalOpen(true);
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Connecting to SMART BILLING PRO Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased font-sans">
      <Navbar
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onNavigate={(screen) => setActiveScreen(screen)}
        activeScreen={activeScreen}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={(screen) => setActiveScreen(screen)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeScreen === 'dashboard' && (
              <DashboardScreen
                onNavigate={(screen) => setActiveScreen(screen)}
                onViewInvoice={handleViewInvoice}
              />
            )}
            {activeScreen === 'pos' && (
              <POSScreen onSaleComplete={handleSaleComplete} />
            )}
            {activeScreen === 'invoices' && (
              <InvoicesScreen onViewInvoice={handleViewInvoice} />
            )}
            {activeScreen === 'products' && <ProductsScreen />}
            {activeScreen === 'inventory' && <InventoryScreen />}
            {activeScreen === 'customers' && <CustomersScreen />}
            {activeScreen === 'suppliers' && <SuppliersScreen />}
            {activeScreen === 'purchases' && <PurchasesScreen />}
            {activeScreen === 'expenses' && <ExpensesScreen />}
            {activeScreen === 'reports' && <ReportsScreen />}
            {activeScreen === 'staff' && <StaffScreen />}
            {activeScreen === 'printers' && <PrintersScreen />}
            {activeScreen === 'settings' && <SettingsScreen />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          setActiveScreen(screen);
          setMobileMenuOpen(false);
        }}
        onOpenMoreMenu={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Drawer Menu for additional screens */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Store Navigation</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
              {[
                { id: 'inventory', label: t('inventory'), icon: Boxes },
                { id: 'customers', label: t('customers'), icon: UserCheck },
                { id: 'suppliers', label: t('suppliers'), icon: Truck },
                { id: 'purchases', label: t('purchases'), icon: ShoppingBag },
                { id: 'expenses', label: t('expenses'), icon: Wallet },
                { id: 'reports', label: t('reports'), icon: BarChart3 },
                { id: 'staff', label: t('staff'), icon: UserCheck },
                { id: 'printers', label: t('printers'), icon: Printer },
                { id: 'settings', label: t('settings'), icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Invoice Preview / Print Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        business={currentBusiness}
      />

      {/* Onboarding / Store Creation Wizard */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BusinessProvider>
          <MainApp />
        </BusinessProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
