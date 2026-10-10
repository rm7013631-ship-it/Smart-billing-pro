export interface Business {
  id: number;
  ownerId: string;
  name: string;
  ownerName: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  isGstRegistered: boolean;
  invoicePrefix: string;
  invoiceNextNumber: number;
  currency: string;
  thermalWidth: '58mm' | '80mm';
  businessType: string;
  upiId: string | null;
  upiName: string | null;
  termsAndConditions: string | null;
  footerMessage: string | null;
  enableNegativeStock: boolean;
  taxInclusivePricing: boolean;
  createdAt?: string;
}

export interface ProductCategory {
  id: number;
  businessId: number;
  name: string;
  color?: string;
}

export interface Product {
  id: number;
  businessId: number;
  categoryId: number | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  description: string | null;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  mrp: string | null;
  wholesalePrice: string | null;
  taxRate: string;
  isTaxInclusive: boolean;
  hsnSac: string | null;
  openingStock: string;
  currentStock: string;
  minStockAlert: string;
  batchNo: string | null;
  expiryDate: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CartItem {
  productId: number;
  productName: string;
  sku?: string;
  barcode?: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  currentStock: number;
}

export interface Customer {
  id: number;
  businessId: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  openingBalance: string;
  currentBalance: string;
  creditLimit: string;
  notes: string | null;
}

export interface CustomerLedgerEntry {
  id: number;
  businessId: number;
  customerId: number;
  entryType: 'invoice' | 'payment' | 'credit_note' | 'opening_balance';
  referenceId: string | null;
  debit: string;
  credit: string;
  balance: string;
  description: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number | null;
  productName: string;
  sku: string | null;
  barcode: string | null;
  hsnSac: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  taxableAmount: string;
  total: string;
}

export interface Invoice {
  id: number;
  businessId: number;
  branchId: number | null;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerGstin: string | null;
  subtotal: string;
  discountType: string;
  discountValue: string;
  totalDiscount: string;
  totalTax: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  roundOff: string;
  grandTotal: string;
  paidAmount: string;
  balanceAmount: string;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit';
  paymentReference: string | null;
  isTaxInclusive: boolean;
  isInterstate: boolean;
  status: 'completed' | 'draft' | 'held' | 'cancelled';
  cancellationReason: string | null;
  notes: string | null;
  cashierName: string | null;
  createdAt: string;
  items?: InvoiceItem[];
}

export interface Supplier {
  id: number;
  businessId: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  currentBalance: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number | null;
  productName: string;
  quantity: string;
  unit: string;
  unitCost: string;
  total: string;
}

export interface Purchase {
  id: number;
  businessId: number;
  supplierId: number | null;
  invoiceNumber: string;
  purchaseDate: string;
  subtotal: string;
  taxAmount: string;
  discount: string;
  grandTotal: string;
  paidAmount: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

export interface Expense {
  id: number;
  businessId: number;
  category: string;
  amount: string;
  expenseDate: string;
  paymentMethod: string;
  description: string | null;
  referenceNumber: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface BusinessMember {
  id: number;
  businessId: number;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  role: 'Owner' | 'Admin' | 'Manager' | 'Cashier' | 'Staff';
  createdAt: string;
}
