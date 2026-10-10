import express from 'express';
import { db } from '../db/index.ts';
import {
  users,
  businesses,
  businessMembers,
  branches,
  productCategories,
  products,
  stockMovements,
  customers,
  customerLedger,
  suppliers,
  purchases,
  purchaseItems,
  invoices,
  invoiceItems,
  invoicePayments,
  expenses,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

export const apiRouter = express.Router();

// Apply auth middleware to all /api routes
apiRouter.use(requireAuth);

// Middleware to check business access
async function verifyBusinessAccess(req: AuthRequest, res: any, next: any) {
  const businessId = parseInt(req.params.businessId || req.body.businessId, 10);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: 'Valid Business ID is required' });
  }

  try {
    const userUid = req.user!.uid;
    // Check if user is owner
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business[0].ownerId === userUid) {
      req.businessId = businessId;
      return next();
    }

    // Check membership
    const member = await db.select().from(businessMembers).where(
      and(eq(businessMembers.businessId, businessId), eq(businessMembers.userId, userUid))
    ).limit(1);

    if (!member.length) {
      return res.status(403).json({ error: 'Access denied to this business' });
    }

    req.businessId = businessId;
    next();
  } catch (error: any) {
    console.error('verifyBusinessAccess error:', error);
    res.status(500).json({ error: 'Authorization verification failed' });
  }
}

// ----------------------------------------------------
// BUSINESS SETUP & PROFILE
// ----------------------------------------------------

apiRouter.get('/businesses', async (req: AuthRequest, res) => {
  try {
    const userUid = req.user!.uid;
    // Find businesses owned or member of
    const owned = await db.select().from(businesses).where(eq(businesses.ownerId, userUid));
    const memberRows = await db
      .select({ business: businesses })
      .from(businessMembers)
      .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
      .where(eq(businessMembers.userId, userUid));

    const memberBusinesses = memberRows.map(r => r.business);
    const all = [...owned, ...memberBusinesses];
    // Remove duplicates
    const unique = Array.from(new Map(all.map(b => [b.id, b])).values());
    res.json(unique);
  } catch (error: any) {
    console.error('Fetch businesses failed:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

apiRouter.post('/businesses', async (req: AuthRequest, res) => {
  try {
    const userUid = req.user!.uid;
    const {
      name,
      ownerName,
      logoUrl,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstin,
      isGstRegistered,
      invoicePrefix,
      currency,
      thermalWidth,
      businessType,
      upiId,
      upiName,
      termsAndConditions,
      footerMessage,
      enableNegativeStock,
      taxInclusivePricing,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Insert business inside transaction
    const newBiz = await db.transaction(async (tx) => {
      const created = await tx.insert(businesses).values({
        ownerId: userUid,
        name: name.trim(),
        ownerName: ownerName?.trim() || req.user?.displayName || 'Store Owner',
        logoUrl: logoUrl || '',
        phone: phone || '',
        email: email || req.user?.email || '',
        address: address || '',
        city: city || '',
        state: state || 'Delhi',
        pincode: pincode || '',
        gstin: gstin ? gstin.toUpperCase().trim() : '',
        isGstRegistered: isGstRegistered !== false,
        invoicePrefix: invoicePrefix || 'INV-',
        invoiceNextNumber: 1001,
        currency: currency || 'INR',
        thermalWidth: thermalWidth || '80mm',
        businessType: businessType || 'Retail',
        upiId: upiId || '',
        upiName: upiName || name.trim(),
        termsAndConditions: termsAndConditions || 'Goods once sold will not be returned without valid receipt.',
        footerMessage: footerMessage || 'Thank you for shopping with us! Visit again.',
        enableNegativeStock: !!enableNegativeStock,
        taxInclusivePricing: taxInclusivePricing !== false,
      }).returning();

      const bizId = created[0].id;

      // Create owner member
      await tx.insert(businessMembers).values({
        businessId: bizId,
        userId: userUid,
        userEmail: req.user?.email || '',
        userName: req.user?.displayName || 'Owner',
        role: 'Owner',
      });

      // Create default Main Branch
      await tx.insert(branches).values({
        businessId: bizId,
        name: 'Main Store',
        code: 'MAIN',
        address: address || '',
        phone: phone || '',
        invoicePrefix: invoicePrefix || 'INV-',
        isMain: true,
      });

      // Create initial categories based on business type
      const defaultCategories = businessType === 'Restaurant'
        ? ['Beverages', 'Starters', 'Main Course', 'Desserts', 'Breads']
        : businessType === 'Pharmacy'
        ? ['Tablets & Capsules', 'Syrups', 'First Aid', 'Personal Care', 'Baby Care']
        : businessType === 'Clothing'
        ? ['Men Wear', 'Women Wear', 'Kids Wear', 'Accessories', 'Footwear']
        : ['Groceries', 'Beverages', 'Packaged Foods', 'Dairy & Bakery', 'Personal Care', 'Household'];

      for (const catName of defaultCategories) {
        await tx.insert(productCategories).values({
          businessId: bizId,
          name: catName,
        });
      }

      return created[0];
    });

    res.status(201).json(newBiz);
  } catch (error: any) {
    console.error('Create business failed:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

apiRouter.get('/businesses/:businessId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.id, req.businessId!)).limit(1);
    res.json(biz[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business details' });
  }
});

apiRouter.put('/businesses/:businessId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.ownerId;
    delete updateData.createdAt;

    const updated = await db
      .update(businesses)
      .set(updateData)
      .where(eq(businesses.id, req.businessId!))
      .returning();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Update business failed:', error);
    res.status(500).json({ error: 'Failed to update business settings' });
  }
});

// Seed demo data for realistic store experience
apiRouter.post('/businesses/:businessId/seed-demo', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    await db.transaction(async (tx) => {
      // Fetch or create categories
      let cats = await tx.select().from(productCategories).where(eq(productCategories.businessId, bizId));
      if (!cats.length) {
        const c1 = await tx.insert(productCategories).values({ businessId: bizId, name: 'Groceries' }).returning();
        const c2 = await tx.insert(productCategories).values({ businessId: bizId, name: 'Beverages' }).returning();
        const c3 = await tx.insert(productCategories).values({ businessId: bizId, name: 'Snacks' }).returning();
        cats = [...c1, ...c2, ...c3];
      }

      // Sample products
      const demoProducts = [
        { name: 'Basmati Rice (Premium)', categoryId: cats[0].id, sku: 'RICE-01', barcode: '890103001', unit: 'kg', purchasePrice: '80.00', sellingPrice: '110.00', mrp: '120.00', taxRate: '5.00', hsnSac: '1006', currentStock: '50.000', minStockAlert: '10.000' },
        { name: 'Sunflower Oil 1L', categoryId: cats[0].id, sku: 'OIL-01', barcode: '890103002', unit: 'ltr', purchasePrice: '120.00', sellingPrice: '145.00', mrp: '160.00', taxRate: '5.00', hsnSac: '1512', currentStock: '30.000', minStockAlert: '5.000' },
        { name: 'Masala Chai Tea 500g', categoryId: cats[1].id, sku: 'TEA-01', barcode: '890103003', unit: 'pkt', purchasePrice: '160.00', sellingPrice: '220.00', mrp: '240.00', taxRate: '5.00', hsnSac: '0902', currentStock: '25.000', minStockAlert: '5.000' },
        { name: 'Whole Wheat Atta 10kg', categoryId: cats[0].id, sku: 'ATTA-10', barcode: '890103004', unit: 'pkt', purchasePrice: '320.00', sellingPrice: '380.00', mrp: '410.00', taxRate: '5.00', hsnSac: '1101', currentStock: '15.000', minStockAlert: '4.000' },
        { name: 'Dark Chocolate Biscuit Pack', categoryId: cats[2].id, sku: 'BIS-01', barcode: '890103005', unit: 'pkt', purchasePrice: '30.00', sellingPrice: '40.00', mrp: '40.00', taxRate: '18.00', hsnSac: '1905', currentStock: '60.000', minStockAlert: '12.000' },
        { name: 'Mineral Water 1L Bottle', categoryId: cats[1].id, sku: 'WTR-01', barcode: '890103006', unit: 'pcs', purchasePrice: '12.00', sellingPrice: '20.00', mrp: '20.00', taxRate: '18.00', hsnSac: '2201', currentStock: '45.000', minStockAlert: '10.000' },
      ];

      for (const p of demoProducts) {
        const prod = await tx.insert(products).values({
          businessId: bizId,
          ...p,
          openingStock: p.currentStock,
          isTaxInclusive: true,
          isActive: true,
        }).returning();

        await tx.insert(stockMovements).values({
          businessId: bizId,
          productId: prod[0].id,
          movementType: 'initial',
          quantity: p.currentStock,
          previousStock: '0.000',
          newStock: p.currentStock,
          reason: 'Initial setup stock',
          createdBy: req.user?.displayName || 'System',
        });
      }

      // Sample customer
      const cust = await tx.insert(customers).values({
        businessId: bizId,
        name: 'Rahul Sharma',
        phone: '+91 9876543210',
        email: 'rahul.s@example.com',
        address: 'Sector 14, Commercial Lane, New Delhi',
        currentBalance: '0.00',
        creditLimit: '15000.00',
      }).returning();

      // Sample supplier
      await tx.insert(suppliers).values({
        businessId: bizId,
        name: 'Apex Wholesale Traders',
        contactPerson: 'Vikas Gupta',
        phone: '+91 9811223344',
        email: 'apex.wholesale@example.com',
        address: 'Khari Baoli, Old Delhi',
        gstin: '07AAAAA0000A1Z5',
      });
    });

    res.json({ message: 'Demo catalog seeded successfully' });
  } catch (error: any) {
    console.error('Seed demo failed:', error);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

// ----------------------------------------------------
// DASHBOARD ANALYTICS (REAL DATABASE QUERIES)
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/dashboard', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const period = (req.query.period as string) || 'today';
    const now = new Date();
    let startDateStr = now.toISOString().split('T')[0];

    if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDateStr = y.toISOString().split('T')[0];
    } else if (period === 'this_week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      startDateStr = w.toISOString().split('T')[0];
    } else if (period === 'this_month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateStr = m.toISOString().split('T')[0];
    } else if (period === 'all') {
      startDateStr = '2000-01-01';
    }

    // 1. Invoices metrics
    const invList = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, bizId),
          eq(invoices.status, 'completed'),
          gte(invoices.invoiceDate, startDateStr)
        )
      );

    let totalSales = 0;
    let totalBills = invList.length;
    let totalCollected = 0;
    let pendingDue = 0;

    const paymentMethodsMap: Record<string, number> = {
      Cash: 0,
      UPI: 0,
      Card: 0,
      'Bank Transfer': 0,
      Credit: 0,
    };

    invList.forEach((inv) => {
      const grand = parseFloat(inv.grandTotal || '0');
      const paid = parseFloat(inv.paidAmount || '0');
      const bal = parseFloat(inv.balanceAmount || '0');
      totalSales += grand;
      totalCollected += paid;
      pendingDue += bal;

      const method = inv.paymentMethod || 'Cash';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + paid;
    });

    // 2. Expenses
    const expenseList = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.businessId, bizId),
          gte(expenses.expenseDate, startDateStr)
        )
      );
    const totalExpenses = expenseList.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

    // 3. Low stock count
    const allProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.businessId, bizId), eq(products.isActive, true)));

    const lowStockItems = allProducts.filter((p) => {
      const curr = parseFloat(p.currentStock);
      const min = parseFloat(p.minStockAlert || '5');
      return curr <= min;
    });

    // 4. Recent invoices
    const recentInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, bizId))
      .orderBy(desc(invoices.id))
      .limit(6);

    // 5. Best selling products (from completed invoices)
    const topItems = await db
      .select({
        productName: invoiceItems.productName,
        totalQty: sql<string>`sum(${invoiceItems.quantity})`,
        totalSales: sql<string>`sum(${invoiceItems.total})`,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.businessId, bizId),
          eq(invoices.status, 'completed'),
          gte(invoices.invoiceDate, startDateStr)
        )
      )
      .groupBy(invoiceItems.productName)
      .orderBy(sql`sum(${invoiceItems.quantity}) desc`)
      .limit(5);

    res.json({
      totalSales: totalSales.toFixed(2),
      totalBills,
      totalCollected: totalCollected.toFixed(2),
      pendingDue: pendingDue.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      paymentBreakdown: paymentMethodsMap,
      recentInvoices,
      topSellingItems: topItems.map(item => ({
        name: item.productName,
        quantity: parseFloat(item.totalQty || '0'),
        amount: parseFloat(item.totalSales || '0').toFixed(2),
      })),
    });
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to calculate dashboard statistics' });
  }
});

// ----------------------------------------------------
// PRODUCTS & INVENTORY
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/products', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const search = (req.query.search as string)?.toLowerCase().trim();
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : null;
    const lowStockOnly = req.query.lowStock === 'true';

    let prods = await db
      .select()
      .from(products)
      .where(and(eq(products.businessId, bizId), eq(products.isActive, true)))
      .orderBy(products.name);

    if (categoryId) {
      prods = prods.filter(p => p.categoryId === categoryId);
    }

    if (search) {
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.toLowerCase().includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search))
      );
    }

    if (lowStockOnly) {
      prods = prods.filter(p => parseFloat(p.currentStock) <= parseFloat(p.minStockAlert || '5'));
    }

    res.json(prods);
  } catch (error: any) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

apiRouter.post('/businesses/:businessId/products', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const {
      name,
      categoryId,
      sku,
      barcode,
      brand,
      description,
      unit,
      purchasePrice,
      sellingPrice,
      mrp,
      wholesalePrice,
      taxRate,
      isTaxInclusive,
      hsnSac,
      openingStock,
      minStockAlert,
      batchNo,
      expiryDate,
      imageUrl,
    } = req.body;

    if (!name || !sellingPrice) {
      return res.status(400).json({ error: 'Product name and selling price are required' });
    }

    const stock = openingStock ? parseFloat(openingStock).toFixed(3) : '0.000';

    const newProd = await db.transaction(async (tx) => {
      const created = await tx.insert(products).values({
        businessId: bizId,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        name: name.trim(),
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        brand: brand?.trim() || null,
        description: description?.trim() || null,
        unit: unit || 'pcs',
        purchasePrice: (parseFloat(purchasePrice) || 0).toFixed(2),
        sellingPrice: (parseFloat(sellingPrice) || 0).toFixed(2),
        mrp: mrp ? (parseFloat(mrp) || 0).toFixed(2) : null,
        wholesalePrice: wholesalePrice ? (parseFloat(wholesalePrice) || 0).toFixed(2) : null,
        taxRate: (parseFloat(taxRate) || 0).toFixed(2),
        isTaxInclusive: isTaxInclusive !== false,
        hsnSac: hsnSac?.trim() || null,
        openingStock: stock,
        currentStock: stock,
        minStockAlert: minStockAlert ? parseFloat(minStockAlert).toFixed(3) : '5.000',
        batchNo: batchNo || null,
        expiryDate: expiryDate || null,
        imageUrl: imageUrl || null,
        isActive: true,
      }).returning();

      if (parseFloat(stock) > 0) {
        await tx.insert(stockMovements).values({
          businessId: bizId,
          productId: created[0].id,
          movementType: 'initial',
          quantity: stock,
          previousStock: '0.000',
          newStock: stock,
          reason: 'Initial opening stock',
          createdBy: req.user?.displayName || 'User',
        });
      }

      return created[0];
    });

    res.status(201).json(newProd);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

apiRouter.put('/businesses/:businessId/products/:productId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const prodId = parseInt(req.params.productId, 10);
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.businessId;
    delete updateData.currentStock; // Stock must be updated via adjustments or purchase/sale

    const updated = await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, prodId), eq(products.businessId, req.businessId!)))
      .returning();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

apiRouter.post('/businesses/:businessId/products/:productId/stock-adjust', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const prodId = parseInt(req.params.productId, 10);
    const { adjustmentType, quantity, reason } = req.body;
    // adjustmentType: 'add', 'subtract', 'damage', 'returned', 'set'

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ error: 'Valid positive quantity required' });
    }

    const updatedProd = await db.transaction(async (tx) => {
      const existing = await tx.select().from(products).where(
        and(eq(products.id, prodId), eq(products.businessId, bizId))
      ).limit(1);

      if (!existing.length) {
        throw new Error('Product not found');
      }

      const prod = existing[0];
      const prevStock = parseFloat(prod.currentStock);
      let newStock = prevStock;

      if (adjustmentType === 'add') {
        newStock = prevStock + numQty;
      } else if (adjustmentType === 'subtract' || adjustmentType === 'damage') {
        newStock = prevStock - numQty;
      } else if (adjustmentType === 'set') {
        newStock = numQty;
      }

      const updated = await tx
        .update(products)
        .set({ currentStock: newStock.toFixed(3) })
        .where(eq(products.id, prodId))
        .returning();

      await tx.insert(stockMovements).values({
        businessId: bizId,
        productId: prodId,
        movementType: adjustmentType === 'damage' ? 'damage' : 'adjustment',
        quantity: numQty.toFixed(3),
        previousStock: prevStock.toFixed(3),
        newStock: newStock.toFixed(3),
        reason: reason || `Manual adjustment: ${adjustmentType}`,
        createdBy: req.user?.displayName || 'User',
      });

      return updated[0];
    });

    res.json(updatedProd);
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({ error: error.message || 'Stock adjustment failed' });
  }
});

apiRouter.get('/businesses/:businessId/categories', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const cats = await db.select().from(productCategories).where(eq(productCategories.businessId, req.businessId!));
    res.json(cats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

apiRouter.post('/businesses/:businessId/categories', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const created = await db.insert(productCategories).values({
      businessId: req.businessId!,
      name: name.trim(),
      color: color || '#2563eb',
    }).returning();
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ----------------------------------------------------
// INVOICES & FAST BILLING (TRANSACTION PROTECTED)
// ----------------------------------------------------

apiRouter.post('/businesses/:businessId/invoices', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const {
      branchId,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      customerGstin,
      items,
      discountType,
      discountValue,
      totalDiscount,
      paymentMethod,
      paymentReference,
      paidAmount,
      isInterstate,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required in the cart' });
    }

    // Fetch business settings
    const bizArr = await db.select().from(businesses).where(eq(businesses.id, bizId)).limit(1);
    if (!bizArr.length) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const biz = bizArr[0];

    // Compute bill server-side to guarantee integrity
    let calculatedSubtotal = 0;
    let calculatedTotalTax = 0;
    let calculatedCgst = 0;
    let calculatedSgst = 0;
    let calculatedIgst = 0;

    const validatedItems: any[] = [];

    for (const item of items) {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      const itemDisc = parseFloat(item.discount || 0);
      const taxRate = parseFloat(item.taxRate || 0);

      if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
        return res.status(400).json({ error: `Invalid quantity or price for ${item.productName}` });
      }

      const grossAmount = qty * price - itemDisc;
      let taxable = grossAmount;
      let taxAmount = 0;

      if (biz.taxInclusivePricing) {
        taxable = taxRate > 0 ? grossAmount / (1 + taxRate / 100) : grossAmount;
        taxAmount = grossAmount - taxable;
      } else {
        taxAmount = taxable * (taxRate / 100);
      }

      calculatedSubtotal += taxable;
      calculatedTotalTax += taxAmount;

      let cgstRate = 0, sgstRate = 0, igstRate = 0;
      let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;

      if (taxRate > 0) {
        if (isInterstate) {
          igstRate = taxRate;
          igstAmt = taxAmount;
          calculatedIgst += igstAmt;
        } else {
          cgstRate = taxRate / 2;
          sgstRate = taxRate / 2;
          cgstAmt = taxAmount / 2;
          sgstAmt = taxAmount / 2;
          calculatedCgst += cgstAmt;
          calculatedSgst += sgstAmt;
        }
      }

      const lineTotal = biz.taxInclusivePricing ? grossAmount : taxable + taxAmount;

      validatedItems.push({
        productId: item.productId ? parseInt(item.productId, 10) : null,
        productName: item.productName,
        sku: item.sku || null,
        barcode: item.barcode || null,
        hsnSac: item.hsnSac || null,
        quantity: qty.toFixed(3),
        unit: item.unit || 'pcs',
        unitPrice: price.toFixed(2),
        discount: itemDisc.toFixed(2),
        taxRate: taxRate.toFixed(2),
        cgstRate: cgstRate.toFixed(2),
        cgstAmount: cgstAmt.toFixed(2),
        sgstRate: sgstRate.toFixed(2),
        sgstAmount: sgstAmt.toFixed(2),
        igstRate: igstRate.toFixed(2),
        igstAmount: igstAmt.toFixed(2),
        taxableAmount: taxable.toFixed(2),
        total: lineTotal.toFixed(2),
      });
    }

    const billDiscount = parseFloat(totalDiscount || 0);
    const preRoundTotal = (biz.taxInclusivePricing
      ? validatedItems.reduce((acc, it) => acc + parseFloat(it.total), 0)
      : calculatedSubtotal + calculatedTotalTax) - billDiscount;

    const grandTotal = Math.round(preRoundTotal);
    const roundOff = grandTotal - preRoundTotal;

    const paid = parseFloat(paidAmount !== undefined ? paidAmount : grandTotal);
    const balance = Math.max(0, grandTotal - paid);

    let paymentStatus = 'Paid';
    if (balance > 0 && paid > 0) paymentStatus = 'Partial';
    else if (balance >= grandTotal) paymentStatus = 'Unpaid';

    // Atomic transaction for invoice + stock update + khata ledger
    const completedInvoice = await db.transaction(async (tx) => {
      // 1. Generate next invoice number atomically
      const currentNext = biz.invoiceNextNumber || 1001;
      const prefix = biz.invoicePrefix || 'INV-';
      const invoiceNumber = `${prefix}${currentNext}`;

      await tx
        .update(businesses)
        .set({ invoiceNextNumber: currentNext + 1 })
        .where(eq(businesses.id, bizId));

      const todayStr = new Date().toISOString().split('T')[0];

      // 2. Insert invoice header
      const createdInv = await tx.insert(invoices).values({
        businessId: bizId,
        branchId: branchId ? parseInt(branchId, 10) : null,
        invoiceNumber,
        invoiceDate: todayStr,
        customerId: customerId ? parseInt(customerId, 10) : null,
        customerName: customerName?.trim() || 'Walk-in Customer',
        customerPhone: customerPhone?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        customerGstin: customerGstin?.trim() || null,
        subtotal: calculatedSubtotal.toFixed(2),
        discountType: discountType || 'fixed',
        discountValue: (parseFloat(discountValue) || 0).toFixed(2),
        totalDiscount: billDiscount.toFixed(2),
        totalTax: calculatedTotalTax.toFixed(2),
        cgstAmount: calculatedCgst.toFixed(2),
        sgstAmount: calculatedSgst.toFixed(2),
        igstAmount: calculatedIgst.toFixed(2),
        roundOff: roundOff.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        paidAmount: paid.toFixed(2),
        balanceAmount: balance.toFixed(2),
        paymentStatus,
        paymentMethod: paymentMethod || 'Cash',
        paymentReference: paymentReference || null,
        isTaxInclusive: !!biz.taxInclusivePricing,
        isInterstate: !!isInterstate,
        status: 'completed',
        notes: notes || null,
        cashierName: req.user?.displayName || 'Cashier',
        createdBy: req.user?.uid || 'user',
      }).returning();

      const invoiceId = createdInv[0].id;

      // 3. Insert invoice items and deduct stock
      for (const item of validatedItems) {
        await tx.insert(invoiceItems).values({
          ...item,
          invoiceId,
        });

        if (item.productId) {
          const prodRows = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
          if (prodRows.length) {
            const currentStockNum = parseFloat(prodRows[0].currentStock);
            const deductQty = parseFloat(item.quantity);
            const remainingStock = currentStockNum - deductQty;

            if (remainingStock < 0 && !biz.enableNegativeStock) {
              throw new Error(`Insufficient stock for "${item.productName}". Available: ${currentStockNum}, Required: ${deductQty}`);
            }

            await tx.update(products)
              .set({ currentStock: remainingStock.toFixed(3) })
              .where(eq(products.id, item.productId));

            await tx.insert(stockMovements).values({
              businessId: bizId,
              productId: item.productId,
              movementType: 'sale',
              quantity: deductQty.toFixed(3),
              previousStock: currentStockNum.toFixed(3),
              newStock: remainingStock.toFixed(3),
              referenceId: invoiceNumber,
              reason: `Sale on invoice ${invoiceNumber}`,
              createdBy: req.user?.displayName || 'Cashier',
            });
          }
        }
      }

      // 4. Record invoice payment if paid > 0
      if (paid > 0) {
        await tx.insert(invoicePayments).values({
          invoiceId,
          businessId: bizId,
          customerId: customerId ? parseInt(customerId, 10) : null,
          paymentDate: todayStr,
          amount: paid.toFixed(2),
          paymentMethod: paymentMethod || 'Cash',
          referenceNumber: paymentReference || null,
          notes: 'Initial sale payment',
        });
      }

      // 5. Update customer ledger & balance if customer is attached
      if (customerId) {
        const custRows = await tx.select().from(customers).where(eq(customers.id, parseInt(customerId, 10))).limit(1);
        if (custRows.length) {
          const prevBalance = parseFloat(custRows[0].currentBalance || '0');
          // Customer balance increases by unpaid balance amount
          const newBalance = prevBalance + balance;

          await tx.update(customers)
            .set({ currentBalance: newBalance.toFixed(2) })
            .where(eq(customers.id, parseInt(customerId, 10)));

          // Add ledger entry
          await tx.insert(customerLedger).values({
            businessId: bizId,
            customerId: parseInt(customerId, 10),
            entryType: 'invoice',
            referenceId: invoiceNumber,
            debit: grandTotal.toFixed(2),
            credit: paid.toFixed(2),
            balance: newBalance.toFixed(2),
            description: `Invoice #${invoiceNumber} (Paid: ₹${paid.toFixed(2)}, Due: ₹${balance.toFixed(2)})`,
            paymentMethod: paymentMethod || 'Cash',
          });
        }
      }

      return {
        ...createdInv[0],
        items: validatedItems,
      };
    });

    res.status(201).json(completedInvoice);
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    res.status(400).json({ error: error.message || 'Failed to complete sale' });
  }
});

apiRouter.get('/businesses/:businessId/invoices', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const search = (req.query.search as string)?.toLowerCase().trim();
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;

    let invs = await db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, bizId))
      .orderBy(desc(invoices.id))
      .limit(100);

    if (status) {
      invs = invs.filter(i => i.status === status);
    }
    if (paymentStatus) {
      invs = invs.filter(i => i.paymentStatus === paymentStatus);
    }
    if (search) {
      invs = invs.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search) ||
        (i.customerName && i.customerName.toLowerCase().includes(search)) ||
        (i.customerPhone && i.customerPhone.includes(search))
      );
    }

    res.json(invs);
  } catch (error: any) {
    console.error('Fetch invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

apiRouter.get('/businesses/:businessId/invoices/:invoiceId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const invId = parseInt(req.params.invoiceId, 10);
    const invRows = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invId), eq(invoices.businessId, req.businessId!)))
      .limit(1);

    if (!invRows.length) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invId));
    const payments = await db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invId));

    res.json({
      ...invRows[0],
      items,
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// Cancel invoice with automatic stock restoration and ledger correction
apiRouter.post('/businesses/:businessId/invoices/:invoiceId/cancel', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const invId = parseInt(req.params.invoiceId, 10);
    const { reason } = req.body;

    const cancelledInv = await db.transaction(async (tx) => {
      const invRows = await tx.select().from(invoices).where(
        and(eq(invoices.id, invId), eq(invoices.businessId, bizId))
      ).limit(1);

      if (!invRows.length) {
        throw new Error('Invoice not found');
      }

      const inv = invRows[0];
      if (inv.status === 'cancelled') {
        throw new Error('Invoice is already cancelled');
      }

      // Restore items to stock
      const items = await tx.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invId));
      for (const item of items) {
        if (item.productId) {
          const prod = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
          if (prod.length) {
            const currentStockNum = parseFloat(prod[0].currentStock);
            const restoredQty = parseFloat(item.quantity);
            const newStock = currentStockNum + restoredQty;

            await tx.update(products)
              .set({ currentStock: newStock.toFixed(3) })
              .where(eq(products.id, item.productId));

            await tx.insert(stockMovements).values({
              businessId: bizId,
              productId: item.productId,
              movementType: 'sale_return',
              quantity: restoredQty.toFixed(3),
              previousStock: currentStockNum.toFixed(3),
              newStock: newStock.toFixed(3),
              referenceId: inv.invoiceNumber,
              reason: `Sale cancelled: ${reason || 'Customer cancellation'}`,
              createdBy: req.user?.displayName || 'User',
            });
          }
        }
      }

      // Revert customer balance if credit was used
      if (inv.customerId) {
        const custRows = await tx.select().from(customers).where(eq(customers.id, inv.customerId)).limit(1);
        if (custRows.length) {
          const prevBal = parseFloat(custRows[0].currentBalance || '0');
          const unpaid = parseFloat(inv.balanceAmount || '0');
          const newBal = prevBal - unpaid;

          await tx.update(customers).set({ currentBalance: newBal.toFixed(2) }).where(eq(customers.id, inv.customerId));

          await tx.insert(customerLedger).values({
            businessId: bizId,
            customerId: inv.customerId,
            entryType: 'credit_note',
            referenceId: `CN-${inv.invoiceNumber}`,
            debit: '0.00',
            credit: unpaid.toFixed(2),
            balance: newBal.toFixed(2),
            description: `Cancelled Invoice #${inv.invoiceNumber} (${reason || 'Reversed'})`,
          });
        }
      }

      const updated = await tx
        .update(invoices)
        .set({
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by user',
        })
        .where(eq(invoices.id, invId))
        .returning();

      return updated[0];
    });

    res.json(cancelledInv);
  } catch (error: any) {
    console.error('Cancel invoice error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel invoice' });
  }
});

// ----------------------------------------------------
// CUSTOMERS & KHATA LEDGER
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/customers', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const custs = await db
      .select()
      .from(customers)
      .where(eq(customers.businessId, req.businessId!))
      .orderBy(customers.name);
    res.json(custs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

apiRouter.post('/businesses/:businessId/customers', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const { name, phone, email, address, gstin, openingBalance, creditLimit, notes } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const openBal = openingBalance ? parseFloat(openingBalance).toFixed(2) : '0.00';
    const created = await db.transaction(async (tx) => {
      const cust = await tx.insert(customers).values({
        businessId: req.businessId!,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        gstin: gstin?.trim() || null,
        openingBalance: openBal,
        currentBalance: openBal,
        creditLimit: creditLimit ? parseFloat(creditLimit).toFixed(2) : '10000.00',
        notes: notes || null,
      }).returning();

      if (parseFloat(openBal) !== 0) {
        await tx.insert(customerLedger).values({
          businessId: req.businessId!,
          customerId: cust[0].id,
          entryType: 'opening_balance',
          debit: parseFloat(openBal) > 0 ? openBal : '0.00',
          credit: parseFloat(openBal) < 0 ? Math.abs(parseFloat(openBal)).toFixed(2) : '0.00',
          balance: openBal,
          description: 'Opening Balance',
        });
      }

      return cust[0];
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

apiRouter.get('/businesses/:businessId/customers/:customerId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const custId = parseInt(req.params.customerId, 10);
    const cust = await db.select().from(customers).where(
      and(eq(customers.id, custId), eq(customers.businessId, req.businessId!))
    ).limit(1);

    if (!cust.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ledger = await db.select().from(customerLedger).where(
      and(eq(customerLedger.customerId, custId), eq(customerLedger.businessId, req.businessId!))
    ).orderBy(desc(customerLedger.id));

    res.json({
      ...cust[0],
      ledger,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// Record Khata Payment / Advance
apiRouter.post('/businesses/:businessId/customers/:customerId/payments', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const custId = parseInt(req.params.customerId, 10);
    const { amount, paymentMethod, referenceNumber, description } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive payment amount required' });
    }

    const result = await db.transaction(async (tx) => {
      const custRows = await tx.select().from(customers).where(
        and(eq(customers.id, custId), eq(customers.businessId, bizId))
      ).limit(1);

      if (!custRows.length) {
        throw new Error('Customer not found');
      }

      const prevBal = parseFloat(custRows[0].currentBalance || '0');
      const newBal = prevBal - numAmount;

      await tx.update(customers).set({ currentBalance: newBal.toFixed(2) }).where(eq(customers.id, custId));

      const entry = await tx.insert(customerLedger).values({
        businessId: bizId,
        customerId: custId,
        entryType: 'payment',
        referenceId: referenceNumber || null,
        debit: '0.00',
        credit: numAmount.toFixed(2),
        balance: newBal.toFixed(2),
        description: description || `Payment received via ${paymentMethod || 'Cash'}`,
        paymentMethod: paymentMethod || 'Cash',
      }).returning();

      return {
        customerBalance: newBal.toFixed(2),
        entry: entry[0],
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Customer payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to record customer payment' });
  }
});

// ----------------------------------------------------
// SUPPLIERS & PURCHASES
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/suppliers', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const sups = await db.select().from(suppliers).where(eq(suppliers.businessId, req.businessId!)).orderBy(suppliers.name);
    res.json(sups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

apiRouter.post('/businesses/:businessId/suppliers', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const { name, contactPerson, phone, email, address, gstin } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    const sup = await db.insert(suppliers).values({
      businessId: req.businessId!,
      name: name.trim(),
      contactPerson: contactPerson?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      gstin: gstin?.trim() || null,
    }).returning();
    res.status(201).json(sup[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

apiRouter.get('/businesses/:businessId/purchases', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const purchs = await db.select().from(purchases).where(eq(purchases.businessId, req.businessId!)).orderBy(desc(purchases.id));
    res.json(purchs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

apiRouter.post('/businesses/:businessId/purchases', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const { supplierId, invoiceNumber, purchaseDate, items, subtotal, taxAmount, grandTotal, paidAmount, paymentMethod, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one purchase item is required' });
    }

    const created = await db.transaction(async (tx) => {
      const pHeader = await tx.insert(purchases).values({
        businessId: bizId,
        supplierId: supplierId ? parseInt(supplierId, 10) : null,
        invoiceNumber: invoiceNumber || `PUR-${Date.now()}`,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        subtotal: (parseFloat(subtotal) || 0).toFixed(2),
        taxAmount: (parseFloat(taxAmount) || 0).toFixed(2),
        grandTotal: (parseFloat(grandTotal) || 0).toFixed(2),
        paidAmount: (parseFloat(paidAmount) || 0).toFixed(2),
        paymentMethod: paymentMethod || 'Bank Transfer',
        notes: notes || null,
      }).returning();

      const purchaseId = pHeader[0].id;

      for (const item of items) {
        const qty = parseFloat(item.quantity);
        const cost = parseFloat(item.unitCost);
        const total = qty * cost;

        await tx.insert(purchaseItems).values({
          purchaseId,
          productId: item.productId ? parseInt(item.productId, 10) : null,
          productName: item.productName,
          quantity: qty.toFixed(3),
          unit: item.unit || 'pcs',
          unitCost: cost.toFixed(2),
          total: total.toFixed(2),
        });

        // Increment product stock
        if (item.productId) {
          const prod = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
          if (prod.length) {
            const currentStockNum = parseFloat(prod[0].currentStock);
            const newStock = currentStockNum + qty;

            await tx.update(products).set({
              currentStock: newStock.toFixed(3),
              purchasePrice: cost.toFixed(2),
            }).where(eq(products.id, item.productId));

            await tx.insert(stockMovements).values({
              businessId: bizId,
              productId: item.productId,
              movementType: 'purchase',
              quantity: qty.toFixed(3),
              previousStock: currentStockNum.toFixed(3),
              newStock: newStock.toFixed(3),
              referenceId: invoiceNumber,
              reason: `Stock from purchase bill ${invoiceNumber}`,
              createdBy: req.user?.displayName || 'User',
            });
          }
        }
      }

      return pHeader[0];
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to record purchase' });
  }
});

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/expenses', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const exps = await db.select().from(expenses).where(eq(expenses.businessId, req.businessId!)).orderBy(desc(expenses.id));
    res.json(exps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

apiRouter.post('/businesses/:businessId/expenses', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const { category, amount, expenseDate, paymentMethod, description, referenceNumber } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const exp = await db.insert(expenses).values({
      businessId: req.businessId!,
      category: category.trim(),
      amount: (parseFloat(amount) || 0).toFixed(2),
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Cash',
      description: description || null,
      referenceNumber: referenceNumber || null,
      createdBy: req.user?.displayName || 'User',
    }).returning();

    res.status(201).json(exp[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

apiRouter.delete('/businesses/:businessId/expenses/:expenseId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const expId = parseInt(req.params.expenseId, 10);
    await db.delete(expenses).where(
      and(eq(expenses.id, expId), eq(expenses.businessId, req.businessId!))
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ----------------------------------------------------
// REPORTS & GST SUMMARY
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/reports', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const bizId = req.businessId!;
    const from = (req.query.from as string) || '2000-01-01';
    const to = (req.query.to as string) || '2099-12-31';

    // Invoices in range
    const invList = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, bizId),
          eq(invoices.status, 'completed'),
          gte(invoices.invoiceDate, from),
          lte(invoices.invoiceDate, to)
        )
      );

    const totalSales = invList.reduce((acc, i) => acc + parseFloat(i.grandTotal || '0'), 0);
    const totalTax = invList.reduce((acc, i) => acc + parseFloat(i.totalTax || '0'), 0);
    const totalDiscount = invList.reduce((acc, i) => acc + parseFloat(i.totalDiscount || '0'), 0);
    const totalCollected = invList.reduce((acc, i) => acc + parseFloat(i.paidAmount || '0'), 0);
    const totalPending = invList.reduce((acc, i) => acc + parseFloat(i.balanceAmount || '0'), 0);

    // GST slab breakdown
    const itemsList = await db
      .select({
        taxRate: invoiceItems.taxRate,
        taxable: sql<string>`sum(${invoiceItems.taxableAmount})`,
        cgst: sql<string>`sum(${invoiceItems.cgstAmount})`,
        sgst: sql<string>`sum(${invoiceItems.sgstAmount})`,
        igst: sql<string>`sum(${invoiceItems.igstAmount})`,
        total: sql<string>`sum(${invoiceItems.total})`,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.businessId, bizId),
          eq(invoices.status, 'completed'),
          gte(invoices.invoiceDate, from),
          lte(invoices.invoiceDate, to)
        )
      )
      .groupBy(invoiceItems.taxRate);

    // Expenses in range
    const expList = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.businessId, bizId),
          gte(expenses.expenseDate, from),
          lte(expenses.expenseDate, to)
        )
      );
    const totalExpenseAmount = expList.reduce((acc, e) => acc + parseFloat(e.amount), 0);

    // Inventory valuation
    const prods = await db.select().from(products).where(eq(products.businessId, bizId));
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    prods.forEach((p) => {
      const stock = parseFloat(p.currentStock);
      if (stock > 0) {
        inventoryCostValue += stock * parseFloat(p.purchasePrice || '0');
        inventoryRetailValue += stock * parseFloat(p.sellingPrice);
      }
    });

    res.json({
      summary: {
        totalSales: totalSales.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalCollected: totalCollected.toFixed(2),
        totalPending: totalPending.toFixed(2),
        totalBills: invList.length,
        totalExpenses: totalExpenseAmount.toFixed(2),
        estimatedNetProfit: (totalSales - totalExpenseAmount).toFixed(2),
        inventoryCostValue: inventoryCostValue.toFixed(2),
        inventoryRetailValue: inventoryRetailValue.toFixed(2),
      },
      gstBreakdown: itemsList.map(item => ({
        slab: `${item.taxRate}%`,
        taxable: parseFloat(item.taxable || '0').toFixed(2),
        cgst: parseFloat(item.cgst || '0').toFixed(2),
        sgst: parseFloat(item.sgst || '0').toFixed(2),
        igst: parseFloat(item.igst || '0').toFixed(2),
        totalTax: (parseFloat(item.cgst || '0') + parseFloat(item.sgst || '0') + parseFloat(item.igst || '0')).toFixed(2),
      })),
      invoices: invList,
    });
  } catch (error: any) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ----------------------------------------------------
// STAFF & MEMBERS
// ----------------------------------------------------

apiRouter.get('/businesses/:businessId/members', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const members = await db.select().from(businessMembers).where(eq(businessMembers.businessId, req.businessId!));
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

apiRouter.post('/businesses/:businessId/members', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const { email, name, role } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Staff email is required' });
    }

    const created = await db.insert(businessMembers).values({
      businessId: req.businessId!,
      userId: `staff_${Date.now()}`,
      userEmail: email.trim(),
      userName: name?.trim() || email.split('@')[0],
      role: role || 'Cashier',
    }).returning();

    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

apiRouter.delete('/businesses/:businessId/members/:memberId', verifyBusinessAccess, async (req: AuthRequest, res) => {
  try {
    const mId = parseInt(req.params.memberId, 10);
    await db.delete(businessMembers).where(
      and(eq(businessMembers.id, mId), eq(businessMembers.businessId, req.businessId!))
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});
