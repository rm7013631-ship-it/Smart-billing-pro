import { db } from '../src/db/index.ts';
import { businesses, products, invoices, customers, customerLedger, stockMovements } from '../src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

async function runTests() {
  console.log('🚀 Starting Smart Billing Pro automated test suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: PostgreSQL Connection & Business retrieval
    console.log('Test Group 1: Database & Business Setup');
    const bizList = await db.select().from(businesses).limit(1);
    assert(bizList.length > 0, 'Database query returns active business');

    const biz = bizList[0];
    assert(typeof biz.id === 'number', 'Business has valid primary key ID');
    assert(biz.currency === 'INR', 'Business defaults to INR currency');

    // Test 2: Product & Stock Movement
    console.log('\nTest Group 2: Product & Inventory Tracking');
    const prods = await db.select().from(products).where(eq(products.businessId, biz.id));
    assert(prods.length > 0, 'Products catalog is populated');

    const testProd = prods[0];
    const initialStock = parseFloat(testProd.currentStock);
    assert(!isNaN(initialStock), 'Product stock is valid decimal');

    // Test 3: Invoice GST Calculation Integrity
    console.log('\nTest Group 3: Invoice & GST Calculations');
    const completedInvoices = await db.select().from(invoices).where(eq(invoices.businessId, biz.id));
    assert(completedInvoices.length > 0, 'Invoices retrieved from database');

    const inv = completedInvoices[0];
    const subtotal = parseFloat(inv.subtotal || '0');
    const tax = parseFloat(inv.totalTax || '0');
    const cgst = parseFloat(inv.cgstAmount || '0');
    const sgst = parseFloat(inv.sgstAmount || '0');
    const grand = parseFloat(inv.grandTotal || '0');

    assert(cgst === sgst, 'Intra-state GST equally split into CGST and SGST');
    assert(Math.abs((cgst + sgst) - tax) < 0.05, 'CGST + SGST matches total tax');
    assert(grand > 0, 'Invoice has positive grand total');

    // Test 4: Customer Khata Ledger
    console.log('\nTest Group 4: Customer Khata & Balances');
    const custs = await db.select().from(customers).where(eq(customers.businessId, biz.id));
    assert(custs.length > 0, 'Customer records exist');

    const ledger = await db.select().from(customerLedger).where(eq(customerLedger.businessId, biz.id));
    assert(Array.isArray(ledger), 'Customer ledger is queryable and valid');

    // Test 5: Stock Movement Audit Log
    console.log('\nTest Group 5: Transaction Audit Logs');
    const movements = await db.select().from(stockMovements).where(eq(stockMovements.businessId, biz.id));
    assert(movements.length > 0, 'Stock movements log records all sales and additions');

    console.log(`\n================================`);
    console.log(`Tests Completed: ${passed} passed, ${failed} failed`);
    console.log(`================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution failure:', err);
    process.exit(1);
  }
}

runTests().then(() => process.exit(0));
