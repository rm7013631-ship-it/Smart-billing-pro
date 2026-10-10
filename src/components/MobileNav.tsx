import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  MoreHorizontal,
} from 'lucide-react';

interface MobileNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onOpenMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeScreen,
  onNavigate,
  onOpenMoreMenu,
}) => {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
          activeScreen === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>{t('dashboard')}</span>
      </button>

      <button
        onClick={() => onNavigate('pos')}
        className={`relative -top-3 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95`}
      >
        <ShoppingCart className="h-6 w-6" />
        <span className="text-[9px] font-bold">POS</span>
      </button>

      <button
        onClick={() => onNavigate('invoices')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
          activeScreen === 'invoices' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
        }`}
      >
        <Receipt className="h-5 w-5" />
        <span>{t('invoices')}</span>
      </button>

      <button
        onClick={() => onNavigate('products')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
          activeScreen === 'products' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
        }`}
      >
        <Package className="h-5 w-5" />
        <span>{t('products')}</span>
      </button>

      <button
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-slate-500"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
