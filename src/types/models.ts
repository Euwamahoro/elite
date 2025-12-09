// src/types/models.ts - UPDATED VERSION WITH DASHBOARD TYPES

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

// --- Enhanced Supplier with Credit ---
export interface Supplier {
    _id: string;
    name: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    address: string;
    taxId?: string;
    creditLimit: number;
    currentBalance: number;
    paymentTerms: 'Cash on Delivery' | 'Credit 7 days' | 'Credit 15 days' | 'Credit 30 days' | 'Credit 60 days' | 'Credit 90 days';
    isActive: boolean;
    totalOrders: number;
    totalSpent: number;
    availableCredit: number; // Virtual
    creditUtilization: number; // Virtual
}

// --- Enhanced Stock Lot with Batch Numbers ---
export interface StockLot {
    _id: string;
    poId: string;
    batchNumber: string;
    unitCost: number;
    quantity: number;
    unitPrice: number;
    dateAcquired: Date;
    expiryDate?: Date;
    isActive: boolean;
    notes?: string;
}

export interface Product {
    _id: string;
    category: ProductCategory;
    name: string;
    productCode: string;
    description?: string;
    unitOfMeasure: string;
    stockLayers: StockLot[];
    minStockLevel: number;
    // UPDATED: Added real sellingPrice field from backend
    sellingPrice: number; 
    totalStock: number;          
    currentSellingPrice: number; 
    isLowStock: boolean;         
}


// --- Product Form Data ---
export interface ProductFormData {
    category: string; 
    name: string;
    description: string;
    unitOfMeasure: string;
    minStockLevel?: number;
    productCode?: string;
    // UPDATED: Added sellingPrice to form
    sellingPrice: number; 
}

// --- Order Entities ---
export interface OrderItem {
    product: string; // The Product ID when creating an order
    name: string; // Product name at time of sale
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export type PaymentStatus = 'Cleared' | 'Pending' | 'Partial';

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

export interface OrderFormData {
    customerName: string;
    amountPaid: number;
    orderItems: {
        product: string; // Only the Product ID
        quantity: number;
    }[];
}

export interface OrderDisplayItem {
    product: { _id: string; name: string; unitOfMeasure: string };
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
    expenseName?: string;
    expenseSubtype?: string; // New: Subtype field
    expenseTypeName?: string; // New: For direct display
    expenseSubtypeName?: string;
    expenseType: { _id: string; name: string; };
    managerName: string;
    amount: number;

    dateOfExpense: string;
    notes: string;
    createdAt: string;
}

// --- Enhanced Purchase Order with Workflow ---
export interface POItem {
    _id: string;
    product: string | Product;
    name: string;
    quantity: number;
    quantityReceived: number;
    unitCost: number;
    unitPrice: number;
    subtotal: number;
    batchNumbers: string[];
    receivedDates: Date[];
    notes?: string;
}

export type POStatus = 'Draft' | 'Submitted' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
export type POPaymentStatus = 'Unpaid' | 'Partial' | 'Paid';
export type PaymentTerms = 'Cash on Delivery' | 'Credit 7 days' | 'Credit 15 days' | 'Credit 30 days' | 'Credit 60 days' | 'Credit 90 days';

export interface PurchaseOrder {
    _id: string;
    poNumber: string;
    supplier: Supplier | string;
    managerName: string;
    managerId: string;
    poItems: POItem[];
    totalCost: number;
    taxRate: number;
    taxAmount: number;
    shippingCost: number;
    discount: number;
    grandTotal: number;
    status: POStatus;
    paymentTerms: PaymentTerms;
    paymentStatus: POPaymentStatus;
    amountPaid: number;
    balanceDue: number;
    dueDate?: Date;
    submittedDate?: Date;
    approvedDate?: Date;
    approvedBy?: string;
    orderedDate?: Date;
    expectedDeliveryDate?: Date;
    receivedDate?: Date;
    deliveryAddress?: string;
    deliveryNotes?: string;
    notes?: string;
    itemsCount: number;
    isFullyReceived: boolean;
    createdAt: string;
    updatedAt: string;
    
    // Virtual properties
    daysOverdue?: number;
    paymentPercentage?: number;
    receivingPercentage?: number;
}

// --- Payment Records ---
export type PaymentMethod = 'Cash' | 'Cheque' | 'Bank Transfer' | 'Mobile Money' | 'Credit Card' | 'Other';

export interface Payment {
    _id: string;
    poId: string;
    supplier: string | Supplier;
    paymentNumber: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    paymentStatus: 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
    referenceNumber?: string;
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    transactionId?: string;
    mobileProvider?: 'M-Pesa' | 'Airtel Money' | 'Tigo Pesa' | 'Halopesa' | 'Ezy Pesa' | 'Other';
    mobileNumber?: string;
    notes?: string;
    paidBy: string;
    verifiedBy?: string;
    verifiedDate?: Date;
}

// --- Batch Details ---
export interface BatchDetails {
    productId: string;
    productName: string;
    productCode: string;
    category: { _id: string; name: string };
    batchNumber: string;
    quantity: number;
    unitCost: number;
    dateAcquired: Date;
    expiryDate?: Date;
}

// --- Dashboard & Reports Types ---

export interface LowStockItem {
    _id: string;
    name: string;
    productCode: string;
    totalStock: number;
    minStockLevel: number;
}

export interface TopProduct {
    _id: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export interface SupplierBalance {
    _id: string;
    supplierName: string;
    totalDue: number;
    poCount: number;
}

export interface RecentPO {
    _id: string;
    poNumber: string;
    supplier: { _id: string; name: string };
    grandTotal: number;
    status: POStatus;
    createdAt: string;
}

export interface RecentPayment {
    _id: string;
    paymentNumber: string;
    supplier: { _id: string; name: string };
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
}

export interface Financials {
    totalRevenue: number;
    totalExpenses: number;
    totalPurchases: number;
    netProfit: number;
}

export interface Inventory {
    totalProducts: number;
    totalQuantityInStock: number;
    lowStockItems: LowStockItem[];
}

export interface PODashboardStats {
    byStatus: Record<string, { count: number; total: number }>;
    byPaymentStatus: Record<string, { count: number; totalDue: number }>;
    supplierBalances: SupplierBalance[];
}

export interface SalesStats {
    topProducts: TopProduct[];
    pendingCollections: {
        amount: number;
        count: number;
    };
}

export interface RecentActivity {
    orders: Order[];
    purchaseOrders: RecentPO[];
    payments: RecentPayment[];
}

// Boss Dashboard Metrics
export interface BossDashboardMetrics {
    period: string;
    financials: {
        allTime: Financials;
        period: Financials;
    };
    purchaseOrders: PODashboardStats;
    inventory: Inventory;
    sales: SalesStats;
    recentActivity: RecentActivity;
}

// Manager Daily Report Types
export interface SalesByStatus {
    _id: PaymentStatus;
    count: number;
    totalAmountSold: number;
    totalAmountCollected: number;
}

export interface ExpenseByType {
    expenseType: string;
    totalAmount: number;
    count: number;
}

export interface ProductSold {
    _id: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    avgPrice: number;
}

export interface DailySummary {
    totalSalesValue: number;
    totalCollected: number;
    totalExpenses: number;
    netCashFlow: number;
    pendingAmount: number;
}

export interface ManagerDailyReport {
    date: string;
    user: string;
    role: UserRole;
    summary: DailySummary;
    salesSummary: {
        totalCollected: number;
        totalSoldValue: number;
        detailsByStatus: SalesByStatus[];
        orders: Order[];
    };
    expenseSummary: {
        totalIncurred: number;
        detailsByType: ExpenseByType[];
        expenses: ExpenseRecord[];
    };
    productsSold: ProductSold[];
}

export interface DashboardMetrics {
    financials: Financials;
    inventory: Inventory;
    recentOrders: Order[];
    poStats?: PODashboardStats;
}

// --- Form Types ---
export interface SupplierFormData {
    name: string;
    contactPerson: string;
    phoneNumber: string;
    email?: string;
    address: string;
    taxId?: string;
    creditLimit?: number;
    paymentTerms?: PaymentTerms;
    bankName?: string;
    accountNumber?: string;
    notes?: string;
}

export interface POFormData {
    supplier: string;
    poItems: Array<{
        product: string;
        quantity: number;
        unitCost: number;
        unitPrice?: number;
    }>;
    paymentTerms?: PaymentTerms;
    expectedDeliveryDate?: string;
    deliveryAddress?: string;
    deliveryNotes?: string;
    notes?: string;
    grandTotal?: number;
}

export interface POReceiveItem {
    poItemId: string;
    quantity: number;
    notes?: string;
}

export interface PaymentFormData {
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    chequeDate?: string;
    transactionId?: string;
    mobileProvider?: 'M-Pesa' | 'Airtel Money' | 'Tigo Pesa' | 'Halopesa' | 'Ezy Pesa' | 'Other';
    mobileNumber?: string;
    notes?: string;
}

export interface StockLotFormData {
    poId: string;
    unitCost: number;
    quantity: number;
    unitPrice?: number;
    expiryDate?: string;
    notes?: string;
}