export type UserRole = 'admin' | 'manager' | 'staff' | 'sales' | 'pharmacist' | 'optometrist' | 'accountant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  branchId?: string;
}

export type CustomerType = 'regular' | 'vip' | 'wholesale';

export interface Customer {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  referralSource: string | null;
  customerType: CustomerType;
  totalSpent: number;
  lastVisit: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  branchId: string;
  customerId: string;
  optometristId?: string;
  prescriptionDate: Date;
  expiryDate?: Date;
  
  // Right Eye
  od_sph?: number;
  od_cyl?: number;
  od_axis?: number;
  od_add?: number;
  od_prism?: number;
  od_base?: string;
  
  // Left Eye
  os_sph?: number;
  os_cyl?: number;
  os_axis?: number;
  os_add?: number;
  os_prism?: number;
  os_base?: string;
  
  // Additional Info
  pd?: number;
  intermediateAdd?: number;
  nearPd?: number;
  remarks?: string;
  prescriptionType?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  branchId: string;
  code: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  manufacturer?: string;
  costPrice: number;
  sellingPrice: number;
  discountPercentage: number;
  hsnCode?: string;
  taxPercentage: number;
  barcode?: string;
  unit: string;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  branchId: string;
  customerId?: string;
  staffId: string;
  invoiceNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  notes?: string;
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  discountPercentage: number;
  lineTotal: number;
  createdAt: Date;
}

export interface LabOrder {
  id: string;
  branchId: string;
  customerId: string;
  prescriptionId?: string;
  saleId?: string;
  orderNumber: string;
  frameCode?: string;
  lensType?: string;
  coating?: string;
  tintingColor?: string;
  deliveryDate?: Date;
  status: string;
  totalCost?: number;
  labNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
