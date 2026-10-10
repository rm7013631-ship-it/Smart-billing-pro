import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('Owner'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Businesses table
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  logoUrl: text('logo_url'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  gstin: text('gstin'),
  isGstRegistered: boolean('is_gst_registered').default(true),
  invoicePrefix: text('invoice_prefix').default('INV-'),
  invoiceNextNumber: integer('invoice_next_number').default(1001),
  currency: text('currency').default('INR'),
  thermalWidth: text('thermal_width').default('80mm'), // '58mm' or '80mm'
  businessType: text('business_type').default('Retail'), // Retail, Grocery, Restaurant, Clothing, Pharmacy, Wholesale
  upiId: text('upi_id'),
  upiName: text('upi_name'),
  termsAndConditions: text('terms_and_conditions').default('Goods once sold will not be taken back without valid bill. All disputes subject to local jurisdiction.'),
  footerMessage: text('footer_message').default('Thank you for shopping with us! Visit again.'),
  enableNegativeStock: boolean('enable_negative_stock').default(false),
  taxInclusivePricing: boolean('tax_inclusive_pricing').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Business Members (Role-Based Access)
export const businessMembers = pgTable('business_members', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  userEmail: text('user_email'),
  userName: text('user_name'),
  role: text('role').notNull().default('Staff'), // Owner, Admin, Manager, Cashier, Staff
  createdAt: timestamp('created_at').defaultNow(),
});

// Branches / Outlets
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  address: text('address'),
  phone: text('phone'),
  invoicePrefix: text('invoice_prefix'),
  isMain: boolean('is_main').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Product Categories
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#2563eb'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products & Inventory
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => productCategories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  brand: text('brand'),
  description: text('description'),
  unit: text('unit').default('pcs'), // pcs, kg, g, ltr, ml, box, pkt, pack, meter, pair
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }).notNull().default('0'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
  mrp: numeric('mrp', { precision: 12, scale: 2 }),
  wholesalePrice: numeric('wholesale_price', { precision: 12, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'), // 0, 5, 12, 18, 28
  isTaxInclusive: boolean('is_tax_inclusive').default(true),
  hsnSac: text('hsn_sac'),
  openingStock: numeric('opening_stock', { precision: 12, scale: 3 }).default('0'),
  currentStock: numeric('current_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  minStockAlert: numeric('min_stock_alert', { precision: 12, scale: 3 }).default('5'),
  batchNo: text('batch_no'),
  expiryDate: text('expiry_date'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Stock Movements Log
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  movementType: text('movement_type').notNull(), // sale, purchase, sale_return, purchase_return, damage, adjustment, initial
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  previousStock: numeric('previous_stock', { precision: 12, scale: 3 }).notNull(),
  newStock: numeric('new_stock', { precision: 12, scale: 3 }).notNull(),
  referenceId: text('reference_id'),
  reason: text('reason'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers & Khata Ledger
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  gstin: text('gstin'),
  openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).default('0'),
  currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('0'), // Positive = Customer owes store (Debit), Negative = Advance (Credit)
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).default('10000'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const customerLedger = pgTable('customer_ledger', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  entryType: text('entry_type').notNull(), // invoice, payment, credit_note, opening_balance
  referenceId: text('reference_id'),
  debit: numeric('debit', { precision: 12, scale: 2 }).default('0'), // Invoice total
  credit: numeric('credit', { precision: 12, scale: 2 }).default('0'), // Payment received
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Suppliers & Purchases
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  gstin: text('gstin'),
  currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull(),
  purchaseDate: text('purchase_date').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0'),
  paymentStatus: text('payment_status').default('Paid'), // Paid, Partial, Unpaid
  paymentMethod: text('payment_method').default('Bank Transfer'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').default('pcs'),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
});

// Invoices & Billing
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  branchId: integer('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  customerAddress: text('customer_address'),
  customerGstin: text('customer_gstin'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountType: text('discount_type').default('fixed'), // fixed, percentage
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).default('0'),
  totalDiscount: numeric('total_discount', { precision: 12, scale: 2 }).default('0'),
  totalTax: numeric('total_tax', { precision: 12, scale: 2 }).default('0'),
  cgstAmount: numeric('cgst_amount', { precision: 12, scale: 2 }).default('0'),
  sgstAmount: numeric('sgst_amount', { precision: 12, scale: 2 }).default('0'),
  igstAmount: numeric('igst_amount', { precision: 12, scale: 2 }).default('0'),
  roundOff: numeric('round_off', { precision: 12, scale: 2 }).default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0'),
  balanceAmount: numeric('balance_amount', { precision: 12, scale: 2 }).default('0'),
  paymentStatus: text('payment_status').default('Paid'), // Paid, Partial, Unpaid
  paymentMethod: text('payment_method').default('Cash'), // Cash, UPI, Card, Bank Transfer, Credit
  paymentReference: text('payment_reference'),
  isTaxInclusive: boolean('is_tax_inclusive').default(true),
  isInterstate: boolean('is_interstate').default(false),
  status: text('status').default('completed'), // completed, draft, held, cancelled
  cancellationReason: text('cancellation_reason'),
  notes: text('notes'),
  cashierName: text('cashier_name'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  hsnSac: text('hsn_sac'),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unit: text('unit').default('pcs'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  cgstRate: numeric('cgst_rate', { precision: 5, scale: 2 }).default('0'),
  cgstAmount: numeric('cgst_amount', { precision: 12, scale: 2 }).default('0'),
  sgstRate: numeric('sgst_rate', { precision: 5, scale: 2 }).default('0'),
  sgstAmount: numeric('sgst_amount', { precision: 12, scale: 2 }).default('0'),
  igstRate: numeric('igst_rate', { precision: 5, scale: 2 }).default('0'),
  igstAmount: numeric('igst_amount', { precision: 12, scale: 2 }).default('0'),
  taxableAmount: numeric('taxable_amount', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
});

export const invoicePayments = pgTable('invoice_payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  paymentDate: text('payment_date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // Rent, Electricity, Transport, Salary, Packaging, Maintenance, Miscellaneous
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  expenseDate: text('expense_date').notNull(),
  paymentMethod: text('payment_method').default('Cash'),
  description: text('description'),
  referenceNumber: text('reference_number'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const businessRelations = relations(businesses, ({ many }) => ({
  members: many(businessMembers),
  branches: many(branches),
  products: many(products),
  categories: many(productCategories),
  customers: many(customers),
  suppliers: many(suppliers),
  invoices: many(invoices),
  expenses: many(expenses),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(invoicePayments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  business: one(businesses, {
    fields: [purchases.businessId],
    references: [businesses.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
}));
