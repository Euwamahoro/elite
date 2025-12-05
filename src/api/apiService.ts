// src/api/apiService.ts - UPDATED WITH EXPENSE SUBTYPE FUNCTIONS
import axios, { AxiosResponse } from 'axios';
import { 
    User,
    Product, 
    ProductCategory,
    ProductFormData,
    Order,
    OrderFormData, 
    ExpenseRecord, 
    DashboardMetrics, 
    PurchaseOrder, 
    Supplier,
    SupplierFormData,
    POFormData,
    POReceiveItem,
    PaymentFormData,
    StockLotFormData,
    PODashboardStats,
    BossDashboardMetrics,
    ManagerDailyReport
} from '../types/models';

const API_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_URL) {
    throw new Error("VITE_API_BASE_URL is not defined in the environment variables.");
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Interceptor to Inject Token into All Requests ---
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- Authentication Functions ---
export const login = async (email: string, password: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.post('/users/login', { email, password });
    
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// ==================== PRODUCT API Functions ====================
export const getProducts = (): Promise<AxiosResponse<Product[]>> => api.get('/products');
export const deleteProduct = (id: string): Promise<AxiosResponse<any>> => api.delete(`/products/${id}`);
export const getProductCategories = (): Promise<AxiosResponse<ProductCategory[]>> => api.get('/products/categories');
export const createProduct = (productData: ProductFormData): Promise<AxiosResponse<Product>> => api.post('/products', productData);
export const updateProduct = (id: string, productData: ProductFormData): Promise<AxiosResponse<Product>> => 
    api.put(`/products/${id}`, productData);
export const createProductCategory = (data: {name: string}): Promise<AxiosResponse<ProductCategory>> => api.post('/products/categories', data);
export const getProductById = (id: string): Promise<AxiosResponse<Product>> => api.get(`/products/${id}`);

// --- Stock/Batch Management ---
export const addStockLot = (productId: string, stockData: StockLotFormData): Promise<AxiosResponse<any>> => 
    api.post(`/products/${productId}/add-stock`, stockData);
export const getProductBatches = (productId: string, status?: string): Promise<AxiosResponse<any>> => 
    api.get(`/products/${productId}/batches${status ? `?status=${status}` : ''}`);
export const getProductByBatchNumber = (batchNumber: string): Promise<AxiosResponse<any>> => 
    api.get(`/products/batch/${batchNumber}`);
export const updateStockLot = (productId: string, batchNumber: string, updateData: any): Promise<AxiosResponse<any>> => 
    api.put(`/products/${productId}/batch/${batchNumber}`, updateData);
export const searchBatches = (params: {
    batchNumber?: string;
    poId?: string;
    productName?: string;
    expiryBefore?: string;
    expiryAfter?: string;
}): Promise<AxiosResponse<any>> => api.get('/products/batches/search', { params });
export const getExpiringBatches = (days?: number): Promise<AxiosResponse<any>> => 
    api.get('/products/batches/expiring', { params: { days } });

// ==================== SUPPLIER API Functions ====================
export const getSuppliers = (params?: {
    search?: string;
    activeOnly?: boolean;
    hasCredit?: boolean;
    sortBy?: string;
    order?: string;
}): Promise<AxiosResponse<Supplier[]>> => api.get('/po/suppliers', { params });
export const createSupplier = (data: SupplierFormData): Promise<AxiosResponse<Supplier>> => api.post('/po/suppliers', data);
export const getSupplierById = (id: string): Promise<AxiosResponse<Supplier>> => api.get(`/po/suppliers/${id}`);
export const updateSupplier = (id: string, data: Partial<SupplierFormData>): Promise<AxiosResponse<Supplier>> => 
    api.put(`/po/suppliers/${id}`, data);
export const getSupplierStatement = (id: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}): Promise<AxiosResponse<any>> => api.get(`/po/suppliers/${id}/statement`, { params });

// ==================== PURCHASE ORDER API Functions ====================
export const getPOs = (params?: {
    status?: string;
    supplier?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
}): Promise<AxiosResponse<{pos: PurchaseOrder[], count: number, total: number, summary: any}>> => 
    api.get('/po', { params });

export const getPOById = (id: string): Promise<AxiosResponse<PurchaseOrder>> => api.get(`/po/${id}`);
export const createPO = (poData: POFormData): Promise<AxiosResponse<PurchaseOrder>> => api.post('/po', poData);
export const updatePO = (id: string, poData: Partial<POFormData>): Promise<AxiosResponse<PurchaseOrder>> => 
    api.put(`/po/${id}`, poData);
export const submitPO = (id: string): Promise<AxiosResponse<PurchaseOrder>> => api.put(`/po/${id}/submit`);
export const approvePO = (id: string): Promise<AxiosResponse<PurchaseOrder>> => api.put(`/po/${id}/approve`);
export const markAsOrdered = (id: string): Promise<AxiosResponse<PurchaseOrder>> => api.put(`/po/${id}/order`);
export const receivePO = (id: string, receivedItems?: POReceiveItem[], notes?: string): Promise<AxiosResponse<PurchaseOrder>> => 
    api.put(`/po/${id}/receive`, receivedItems ? { receivedItems, notes } : {});
export const addPayment = (id: string, paymentData: PaymentFormData): Promise<AxiosResponse<any>> => 
    api.post(`/po/${id}/payment`, paymentData);
export const cancelPO = (id: string, reason: string): Promise<AxiosResponse<PurchaseOrder>> => 
    api.put(`/po/${id}/cancel`, { reason });
export const getPODashboardStats = (): Promise<AxiosResponse<PODashboardStats>> => api.get('/po/dashboard/stats');

// ==================== ORDER API Functions ====================
export const getOrders = (): Promise<AxiosResponse<Order[]>> => api.get('/orders');
export const createOrder = (orderData: OrderFormData): Promise<AxiosResponse<Order>> => api.post('/orders', orderData);

// ==================== EXPENSE API Functions ====================
export const getExpenseRecords = (): Promise<AxiosResponse<ExpenseRecord[]>> => api.get('/expenses/records');
export const createExpenseRecord = (data: any): Promise<AxiosResponse<any>> => api.post('/expenses/records', data);
export const getExpenseTypes = (): Promise<AxiosResponse<any[]>> => api.get('/expenses/types');
export const createExpenseType = (data: {name: string, description?: string}): Promise<AxiosResponse<any>> => api.post('/expenses/types', data);
export const addExpenseSubtype = (typeId: string, data: {subtypeName: string, description?: string}): Promise<AxiosResponse<any>> => 
    api.post(`/expenses/types/${typeId}/subtypes`, data);
export const getExpenseTypeById = (id: string): Promise<AxiosResponse<any>> => api.get(`/expenses/types/${id}`);
export const getExpenseBreakdown = (params?: {startDate?: string, endDate?: string}): Promise<AxiosResponse<any>> => 
    api.get('/expenses/breakdown', { params });

// ==================== REPORT/DASHBOARD API Functions ====================
// Legacy dashboard (if still used)
export const getDashboardMetrics = (): Promise<AxiosResponse<DashboardMetrics>> => api.get('/reports/dashboard');

// Boss Dashboard - Enhanced with period parameter
export const getBossDashboardMetrics = (period: string = 'month'): Promise<AxiosResponse<BossDashboardMetrics>> => 
    api.get(`/reports/dashboard?period=${period}`);

// Manager Daily Report - with optional date parameter
export const getManagerDailyReport = (date?: string): Promise<AxiosResponse<ManagerDailyReport>> => 
    api.get(`/reports/daily${date ? `?date=${date}` : ''}`);

// Financial Report with date range
export const getFinancialReport = (params: {
    startDate: string;
    endDate: string;
}): Promise<AxiosResponse<any>> => 
    api.get('/reports/financial', { params });

export default api;