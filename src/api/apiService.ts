// src/api/apiService.ts
import axios, { AxiosResponse } from 'axios';
// --- FIX: Import the missing types here ---
import { User,
     Product, 
     ProductCategory,
     ProductFormData,
     Order,
     OrderFormData, 
     ExpenseRecord, 
     DashboardMetrics, 
     PurchaseOrder, 
     Supplier } from '../types/models';
// Use environment variable for the base URL
// Note: This access method is specific to your build tool (like Vite)
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

export const getProducts = (): Promise<AxiosResponse<Product[]>> => api.get('/products');
export const deleteProduct = (id: string): Promise<AxiosResponse<any>> => api.delete(`/products/${id}`);
export const getProductCategories = (): Promise<AxiosResponse<ProductCategory[]>> => api.get('/products/categories');
export const createProduct = (productData: ProductFormData): Promise<AxiosResponse<Product>> => api.post('/products', productData);
export const createProductCategory = (data: {name: string}): Promise<AxiosResponse<ProductCategory>> => api.post('/products/categories', data);
export const getOrders = (): Promise<AxiosResponse<Order[]>> => api.get('/orders');
export const createOrder = (orderData: OrderFormData): Promise<AxiosResponse<Order>> => api.post('/orders', orderData);

// --- EXPENSE API Functions (Required for Expenses.tsx) ---
export const getExpenseRecords = (): Promise<AxiosResponse<ExpenseRecord[]>> => api.get('/expenses/records');
export const createExpenseRecord = (data: any): Promise<AxiosResponse<any>> => api.post('/expenses/records', data);
export const getExpenseTypes = (): Promise<AxiosResponse<ProductCategory[]>> => api.get('/expenses/types');
export const createExpenseType = (data: {name: string}): Promise<AxiosResponse<any>> => api.post('/expenses/types', data);

// --- PO API Functions (Required for PurchaseOrders.tsx) ---
export const getPOs = (): Promise<AxiosResponse<PurchaseOrder[]>> => api.get('/po');
export const getSuppliers = (): Promise<AxiosResponse<Supplier[]>> => api.get('/po/suppliers');
export const createSupplier = (data: {name: string}): Promise<AxiosResponse<Supplier>> => api.post('/po/suppliers', data);
export const receivePO = (id: string): Promise<AxiosResponse<any>> => api.put(`/po/${id}/receive`);
export const createPO = (poData: any): Promise<AxiosResponse<PurchaseOrder>> => api.post('/po', poData); 



// --- REPORT API Functions (Required for DashboardBoss.tsx) ---
export const getDashboardMetrics = (): Promise<AxiosResponse<DashboardMetrics>> => api.get('/reports/dashboard'); // <-- This was missing


export default api;