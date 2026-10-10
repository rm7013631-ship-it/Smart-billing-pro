import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  Wallet,
  BarChart3,
  UserCheck,
  Printer,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('newBill'), icon: ShoppingCart, highlight: true },
    { id: 'invoices', label: t('invoices'), icon: Receipt },
    { id: 'products', label: t('products'), icon: Package },
    { id: 'inventory', label: t('inventory'), icon: Boxes },
    { id: 'customers', label: t('customers'), icon: Users },
    { id: 'suppliers', label: t('suppliers'), icon: Truck },
    { id: 'purchases', label: t('purchases'), icon: ShoppingBag },
    { id: 'expenses', label: t('expenses'), icon: Wallet },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'staff', label: t('staff'), icon: UserCheck },
    { id: 'printers', label: t('printers'), icon: Printer },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-y-auto">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                item.highlight
                  ? isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50'
                  : isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${item.highlight && !isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
