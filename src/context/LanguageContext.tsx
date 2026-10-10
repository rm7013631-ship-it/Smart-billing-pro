import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  newBill: { en: 'New Bill (POS)', hi: 'नया बिल (पीओएस)' },
  invoices: { en: 'Invoices', hi: 'बिल / इनवॉइस' },
  products: { en: 'Products', hi: 'सामान / उत्पाद' },
  inventory: { en: 'Inventory', hi: 'स्टॉक / इन्वेंटरी' },
  customers: { en: 'Customers (Khata)', hi: 'ग्राहक (खाता)' },
  suppliers: { en: 'Suppliers', hi: 'सप्लायर्स' },
  purchases: { en: 'Purchases', hi: 'खरीदारी' },
  expenses: { en: 'Expenses', hi: 'खर्चे' },
  reports: { en: 'Reports', hi: 'रिपोर्ट्स' },
  staff: { en: 'Staff & Roles', hi: 'कर्मचारी' },
  printers: { en: 'Printers', hi: 'प्रिंटर' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  todaySales: { en: "Today's Sales", hi: 'आज की बिक्री' },
  totalBills: { en: 'Total Bills', hi: 'कुल बिल' },
  collected: { en: 'Collected Payments', hi: 'प्राप्त भुगतान' },
  pendingKhata: { en: 'Pending Customer Due', hi: 'बाकी खाता राशि' },
  lowStockAlert: { en: 'Low Stock Items', hi: 'कम स्टॉक आइटम' },
  searchProduct: { en: 'Search by Name, SKU or Barcode...', hi: 'नाम, बारकोड या कोड से खोजें...' },
  addToCart: { en: 'Add', hi: 'जोड़ें' },
  cart: { en: 'Bill Cart', hi: 'बिल कार्ट' },
  subtotal: { en: 'Subtotal', hi: 'उप-योग' },
  discount: { en: 'Discount', hi: 'छूट' },
  tax: { en: 'GST / Tax', hi: 'जीएसटी / कर' },
  grandTotal: { en: 'Grand Total', hi: 'कुल योग' },
  payAndPrint: { en: 'Complete & Print', hi: 'बिल पूरा करें और प्रिंट करें' },
  holdBill: { en: 'Hold Sale', hi: 'बिल रोकें' },
  resumeBill: { en: 'Resume Sale', hi: 'रोका बिल लाएं' },
  cash: { en: 'Cash', hi: 'नकद (Cash)' },
  upi: { en: 'UPI QR', hi: 'यूपीआई (UPI)' },
  card: { en: 'Card', hi: 'कार्ड (Card)' },
  credit: { en: 'Khata / Credit', hi: 'उधार / खाता' },
  scanBarcode: { en: 'Scan Barcode', hi: 'बारकोड स्कैन करें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('smart_pos_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smart_pos_lang', lang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
