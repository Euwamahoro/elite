// src/types/models.ts

// --- Core Entities ---

export type UserRole = 'Boss' | 'Manager';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    token: string;
}

export interface ProductCategory {
    _id: string;
    name: string;
}

export interface Product {
    _id: string;
    category: ProductCategory;
    name: string;
    unitOfMeasure: string;
    stockLayers: StockLot[];
    totalStock: number;          // Virtual property
    currentSellingPrice: number; // Virtual property
}

export interface StockLot {
    poId: string;
    unitCost: number;
    quantity: number;
    unitPrice: number;
    dateAcquired: Date;
}
// --- Product Form Data ---
export interface ProductFormData {
    category: string; // The category ID
    name: string;
    description: string;
    unitOfMeasure: string;
}

// src/types/models.ts (Add these interfaces)

export interface OrderItem {
    product: string; // The Product ID when creating an order
    name: string; // Product name at time of sale
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export type PaymentStatus = 'Cleared' | 'Pending' | 'Partial';

// Structure for the full Order object returned by the API
export interface Order {
    _id: string;
    managerName: string;
    customerName: string;
    orderItems: OrderItem[];
    totalAmount: number;
    amountPaid: number;
    paymentStatus: PaymentStatus;
    createdAt: string;
}

// Structure for the Order Creation Form (what we send to the backend)
export interface OrderFormData {
    customerName: string;
    amountPaid: number;
    orderItems: {
        product: string; // Only the Product ID
        quantity: number;
    }[];
}

// Minimal type for Order List Display
export interface OrderDisplayItem {
    product: { _id: string; name: string; unitOfMeasure: string }; // Populated product details
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface OrderDisplay extends Omit<Order, 'orderItems'> {
    orderItems: OrderDisplayItem[];
}

// --- Expense Entities ---

export interface ExpenseRecord {
    _id: string;
    expenseType: { _id: string; name: string; }; // Populated Type
    managerName: string;
    amount: number;
    dateOfExpense: string;
    notes: string;
    createdAt: string;
}

// --- Purchase Order (PO) Entities ---

export interface Supplier {
    _id: string;
    name: string;
    // ... other supplier fields
}

export interface PurchaseOrder {
    _id: string;
    supplier: Supplier;
    managerName: string;
    poNumber: string;
    totalCost: number;
    status: 'Pending' | 'Received' | 'Cancelled';
    createdAt: string;
    // ... poItems etc.
}


// --- Report Entities (Required for DashboardBoss) ---

export interface Financials {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
}

export interface Inventory {
    totalProducts: number;
    totalQuantityInStock: number;
    lowStockItems: Product[];
}

export interface DashboardMetrics { // <-- This was missing
    financials: Financials;
    inventory: Inventory;
    recentOrders: Order[];
}
