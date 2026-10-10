import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';

interface BusinessContextType {
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  error: string | null;
  setCurrentBusiness: (biz: Business) => void;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (data: Partial<Business>) => Promise<Business>;
  updateCurrentBusiness: (data: Partial<Business>) => Promise<Business>;
  seedDemoData: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  currentBusiness: null,
  loading: true,
  error: null,
  setCurrentBusiness: () => {},
  refreshBusinesses: async () => {},
  createBusiness: async () => ({} as Business),
  updateCurrentBusiness: async () => ({} as Business),
  seedDemoData: async () => {},
});

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.setToken(token);
    if (token) {
      loadBusinesses();
    } else {
      setBusinesses([]);
      setCurrentBusinessState(null);
      setLoading(false);
    }
  }, [token]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getBusinesses();
      setBusinesses(list);

      if (list.length > 0) {
        // Restore selected business from localStorage if exists
        const savedId = localStorage.getItem('smart_pos_active_biz');
        const found = list.find(b => b.id.toString() === savedId);
        setCurrentBusinessState(found || list[0]);
      } else {
        // Auto-create initial default store for user
        const newStore = await api.createBusiness({
          name: 'Smart Retail Supermarket',
          ownerName: user?.displayName || 'Store Owner',
          phone: '+91 9876543210',
          email: user?.email || 'store@smartbillingpro.in',
          address: 'Main Market Road, Block B',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          gstin: '07AAAAA0000A1Z5',
          isGstRegistered: true,
          invoicePrefix: 'INV-',
          currency: 'INR',
          thermalWidth: '80mm',
          businessType: 'Retail',
          upiId: 'retailstore@upi',
          upiName: 'Smart Retail Store',
          termsAndConditions: '1. Goods once sold will not be returned without bill.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.',
          footerMessage: 'Thank you for shopping with us! Visit again.',
          enableNegativeStock: false,
          taxInclusivePricing: true,
        });

        // Seed realistic demo products & customer
        await api.seedDemo(newStore.id);
        const refreshedList = await api.getBusinesses();
        setBusinesses(refreshedList);
        setCurrentBusinessState(refreshedList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
      setError(err.message || 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentBusiness = (biz: Business) => {
    setCurrentBusinessState(biz);
    localStorage.setItem('smart_pos_active_biz', biz.id.toString());
  };

  const refreshBusinesses = async () => {
    await loadBusinesses();
  };

  const createBusiness = async (data: Partial<Business>) => {
    const created = await api.createBusiness(data);
    await loadBusinesses();
    setCurrentBusiness(created);
    return created;
  };

  const updateCurrentBusiness = async (data: Partial<Business>) => {
    if (!currentBusiness) throw new Error('No active business');
    const updated = await api.updateBusiness(currentBusiness.id, data);
    setCurrentBusinessState(updated);
    setBusinesses(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    return updated;
  };

  const seedDemoData = async () => {
    if (!currentBusiness) return;
    await api.seedDemo(currentBusiness.id);
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusiness,
        loading,
        error,
        setCurrentBusiness,
        refreshBusinesses,
        createBusiness,
        updateCurrentBusiness,
        seedDemoData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
