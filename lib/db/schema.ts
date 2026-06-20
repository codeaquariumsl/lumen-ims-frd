import { pgTable, text, serial, timestamp, integer, decimal, boolean, varchar, uuid, index, foreignKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    password: text('password'),
    role: varchar('role', { length: 50 }).notNull().default('staff'), // admin, manager, staff, sales, pharmacist, optometrist, accountant
    branchId: uuid('branch_id'),
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIndex: index('users_email_idx').on(table.email),
    branchIdIndex: index('users_branch_id_idx').on(table.branchId),
  })
);

// ============================================================================
// BRANCH MANAGEMENT
// ============================================================================

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 20 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    managerId: uuid('manager_id'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    codeIndex: index('branches_code_idx').on(table.code),
    managerIdIndex: index('branches_manager_id_idx').on(table.managerId),
  })
);

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    dateOfBirth: timestamp('date_of_birth'),
    gender: varchar('gender', { length: 20 }), // male, female, other
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 20 }),
    referralSource: varchar('referral_source', { length: 100 }),
    customerType: varchar('customer_type', { length: 50 }).default('regular'), // regular, vip, wholesale
    totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0'),
    lastVisit: timestamp('last_visit'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('customers_branch_id_idx').on(table.branchId),
    phoneIndex: index('customers_phone_idx').on(table.phone),
    emailIndex: index('customers_email_idx').on(table.email),
  })
);

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }), // frames, lenses, contact-lens, accessories, etc
    subcategory: varchar('subcategory', { length: 100 }),
    description: text('description'),
    manufacturer: varchar('manufacturer', { length: 255 }),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
    sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull(),
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'),
    hsnCode: varchar('hsn_code', { length: 50 }),
    taxPercentage: decimal('tax_percentage', { precision: 5, scale: 2 }).default('0'),
    barcode: varchar('barcode', { length: 100 }),
    unit: varchar('unit', { length: 50 }).default('pcs'), // pcs, box, pair, etc
    minStock: integer('min_stock').default(5),
    maxStock: integer('max_stock').default(100),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('products_branch_id_idx').on(table.branchId),
    codeIndex: index('products_code_idx').on(table.code),
    barcodeIndex: index('products_barcode_idx').on(table.barcode),
  })
);

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull().default(0),
    batchNumber: varchar('batch_number', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    expiryDate: timestamp('expiry_date'),
    lastUpdated: timestamp('last_updated').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('inventory_branch_id_idx').on(table.branchId),
    productIdIndex: index('inventory_product_id_idx').on(table.productId),
  })
);

// ============================================================================
// SALES & POS
// ============================================================================

export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    customerId: uuid('customer_id'),
    staffId: uuid('staff_id').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0'),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
    netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }), // cash, card, upi, cheque, credit
    paymentStatus: varchar('payment_status', { length: 50 }).default('completed'), // completed, pending, failed
    notes: text('notes'),
    saleDate: timestamp('sale_date').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('sales_branch_id_idx').on(table.branchId),
    invoiceNumberIndex: index('sales_invoice_number_idx').on(table.invoiceNumber),
    saleDateIndex: index('sales_sale_date_idx').on(table.saleDate),
  })
);

export const saleItems = pgTable(
  'sale_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saleId: uuid('sale_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    taxPercentage: decimal('tax_percentage', { precision: 5, scale: 2 }).notNull(),
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'),
    lineTotal: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  }
);

// ============================================================================
// OPTICAL PRESCRIPTIONS
// ============================================================================

export const prescriptions = pgTable(
  'prescriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    optometristId: uuid('optometrist_id'),
    prescriptionDate: timestamp('prescription_date').defaultNow(),
    expiryDate: timestamp('expiry_date'),
    
    // Right Eye (OD - Oculus Dexter)
    od_sph: decimal('od_sph', { precision: 5, scale: 2 }), // Sphere
    od_cyl: decimal('od_cyl', { precision: 5, scale: 2 }), // Cylinder
    od_axis: integer('od_axis'), // Axis (0-180)
    od_add: decimal('od_add', { precision: 5, scale: 2 }), // Addition
    od_prism: decimal('od_prism', { precision: 5, scale: 2 }),
    od_base: varchar('od_base', { length: 20 }), // Base direction
    
    // Left Eye (OS - Oculus Sinister)
    os_sph: decimal('os_sph', { precision: 5, scale: 2 }),
    os_cyl: decimal('os_cyl', { precision: 5, scale: 2 }),
    os_axis: integer('os_axis'),
    os_add: decimal('os_add', { precision: 5, scale: 2 }),
    os_prism: decimal('os_prism', { precision: 5, scale: 2 }),
    os_base: varchar('os_base', { length: 20 }),
    
    // Additional Info
    pd: decimal('pd', { precision: 5, scale: 2 }), // Pupillary Distance
    intermediateAdd: decimal('intermediate_add', { precision: 5, scale: 2 }),
    nearPd: decimal('near_pd', { precision: 5, scale: 2 }),
    remarks: text('remarks'),
    prescriptionType: varchar('prescription_type', { length: 50 }), // single, bifocal, progressive
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('prescriptions_branch_id_idx').on(table.branchId),
    customerIdIndex: index('prescriptions_customer_id_idx').on(table.customerId),
  })
);

// ============================================================================
// LAB ORDERS
// ============================================================================

export const labOrders = pgTable(
  'lab_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    prescriptionId: uuid('prescription_id'),
    saleId: uuid('sale_id'),
    orderNumber: varchar('order_number', { length: 100 }).notNull(),
    frameCode: varchar('frame_code', { length: 100 }),
    lensType: varchar('lens_type', { length: 100 }),
    coating: varchar('coating', { length: 100 }),
    tintingColor: varchar('tinting_color', { length: 100 }),
    deliveryDate: timestamp('delivery_date'),
    status: varchar('status', { length: 50 }).default('pending'), // pending, in-process, completed, delivered
    totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
    labNotes: text('lab_notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('lab_orders_branch_id_idx').on(table.branchId),
    orderNumberIndex: index('lab_orders_order_number_idx').on(table.orderNumber),
  })
);

// ============================================================================
// PROCUREMENT & PURCHASE ORDERS
// ============================================================================

export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    vendorId: uuid('vendor_id').notNull(),
    poNumber: varchar('po_number', { length: 100 }).notNull(),
    orderDate: timestamp('order_date').defaultNow(),
    expectedDelivery: timestamp('expected_delivery'),
    actualDelivery: timestamp('actual_delivery'),
    status: varchar('status', { length: 50 }).default('draft'), // draft, submitted, confirmed, received, cancelled
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('purchase_orders_branch_id_idx').on(table.branchId),
    poNumberIndex: index('purchase_orders_po_number_idx').on(table.poNumber),
  })
);

export const purchaseOrderItems = pgTable(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poId: uuid('po_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
    lineTotal: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
    receivedQuantity: integer('received_quantity').default(0),
  }
);

export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    gstin: varchar('gstin', { length: 50 }),
    paymentTerms: varchar('payment_terms', { length: 100 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    branchIdIndex: index('vendors_branch_id_idx').on(table.branchId),
  })
);

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    branchId: uuid('branch_id'),
    action: varchar('action', { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, VIEW, SALE, etc
    entityType: varchar('entity_type', { length: 100 }), // Customer, Sale, Product, etc
    entityId: uuid('entity_id'),
    changes: text('changes'), // JSON string of what changed
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIndex: index('audit_logs_user_id_idx').on(table.userId),
    branchIdIndex: index('audit_logs_branch_id_idx').on(table.branchId),
    createdAtIndex: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  prescriptions: many(prescriptions),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  prescriptions: many(prescriptions),
  labOrders: many(labOrders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
  purchaseOrderItems: many(purchaseOrderItems),
  inventory: many(inventory),
}));
