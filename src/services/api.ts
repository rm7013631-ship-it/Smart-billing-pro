import {
  Business,
  Product,
  ProductCategory,
  Invoice,
  Customer,
  Supplier,
  Purchase,
  Expense,
  BusinessMember,
} from '../types/index.ts';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Businesses
  getBusinesses() {
    return this.request<Business[]>('/businesses');
  }

  createBusiness(data: Partial<Business>) {
    return this.request<Business>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getBusiness(id: number) {
    return this.request<Business>(`/businesses/${id}`);
  }

  updateBusiness(id: number, data: Partial<Business>) {
    return this.request<Business>(`/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  seedDemo(businessId: number) {
    return this.request<{ message: string }>(`/businesses/${businessId}/seed-demo`, {
      method: 'POST',
    });
  }

  // Dashboard
  getDashboard(businessId: number, period = 'today') {
    return this.request<any>(`/businesses/${businessId}/dashboard?period=${period}`);
  }

  // Products
  getProducts(businessId: number, params: { search?: string; categoryId?: number; lowStock?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.categoryId) query.append('categoryId', params.categoryId.toString());
    if (params.lowStock) query.append('lowStock', 'true');
    return this.request<Product[]>(`/businesses/${businessId}/products?${query.toString()}`);
  }

  createProduct(businessId: number, data: any) {
    return this.request<Product>(`/businesses/${businessId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProduct(businessId: number, productId: number, data: any) {
    return this.request<Product>(`/businesses/${businessId}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  adjustStock(businessId: number, productId: number, data: { adjustmentType: string; quantity: number; reason: string }) {
    return this.request<Product>(`/businesses/${businessId}/products/${productId}/stock-adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Categories
  getCategories(businessId: number) {
    return this.request<ProductCategory[]>(`/businesses/${businessId}/categories`);
  }

  createCategory(businessId: number, data: { name: string; color?: string }) {
    return this.request<ProductCategory>(`/businesses/${businessId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Invoices & Fast Billing
  createInvoice(businessId: number, payload: any) {
    return this.request<Invoice>(`/businesses/${businessId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getInvoices(businessId: number, params: { search?: string; status?: string; paymentStatus?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    return this.request<Invoice[]>(`/businesses/${businessId}/invoices?${query.toString()}`);
  }

  getInvoice(businessId: number, invoiceId: number) {
    return this.request<Invoice>(`/businesses/${businessId}/invoices/${invoiceId}`);
  }

  cancelInvoice(businessId: number, invoiceId: number, reason: string) {
    return this.request<Invoice>(`/businesses/${businessId}/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Customers
  getCustomers(businessId: number) {
    return this.request<Customer[]>(`/businesses/${businessId}/customers`);
  }

  createCustomer(businessId: number, data: any) {
    return this.request<Customer>(`/businesses/${businessId}/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getCustomer(businessId: number, customerId: number) {
    return this.request<Customer & { ledger: any[] }>(`/businesses/${businessId}/customers/${customerId}`);
  }

  recordCustomerPayment(businessId: number, customerId: number, data: any) {
    return this.request<any>(`/businesses/${businessId}/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Suppliers & Purchases
  getSuppliers(businessId: number) {
    return this.request<Supplier[]>(`/businesses/${businessId}/suppliers`);
  }

  createSupplier(businessId: number, data: any) {
    return this.request<Supplier>(`/businesses/${businessId}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getPurchases(businessId: number) {
    return this.request<Purchase[]>(`/businesses/${businessId}/purchases`);
  }

  createPurchase(businessId: number, data: any) {
    return this.request<Purchase>(`/businesses/${businessId}/purchases`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Expenses
  getExpenses(businessId: number) {
    return this.request<Expense[]>(`/businesses/${businessId}/expenses`);
  }

  createExpense(businessId: number, data: any) {
    return this.request<Expense>(`/businesses/${businessId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteExpense(businessId: number, expenseId: number) {
    return this.request<{ success: boolean }>(`/businesses/${businessId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Reports
  getReports(businessId: number, from?: string, to?: string) {
    const query = new URLSearchParams();
    if (from) query.append('from', from);
    if (to) query.append('to', to);
    return this.request<any>(`/businesses/${businessId}/reports?${query.toString()}`);
  }

  // Staff
  getMembers(businessId: number) {
    return this.request<BusinessMember[]>(`/businesses/${businessId}/members`);
  }

  createMember(businessId: number, data: any) {
    return this.request<BusinessMember>(`/businesses/${businessId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteMember(businessId: number, memberId: number) {
    return this.request<{ success: boolean }>(`/businesses/${businessId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
