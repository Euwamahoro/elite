// src/App.tsx - UPDATED (Components handle their own Layout)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products'; 
import Orders from './pages/Orders'; 
import Expenses from './pages/Expenses';
import PurchaseOrders from './pages/PurchaseOrders';
import Suppliers from './pages/Supplier';
import { useAppSelector } from './store/hooks';
import { selectIsAuthenticated, selectIsBoss } from './store/authSlice';
import DashboardBoss from './pages/DashboardBoss'; 
import DashboardManager from './pages/DashboardManager'; 

// Simple auth check without Layout
const ProtectedRoute = ({ children, allowedRoles }: { 
    children: React.ReactNode, 
    allowedRoles: ('Boss' | 'Manager')[] 
}) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBoss = useAppSelector(selectIsBoss);
    const userRole = isBoss ? 'Boss' : 'Manager';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(userRole)) {
        // Return just the error without Layout since your components handle Layout
        return <p style={{color: 'red', padding: '20px'}}>Error 403: You do not have permission to view this page.</p>;
    }
    
    return <>{children}</>;
};

const App: React.FC = () => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBoss = useAppSelector(selectIsBoss);
    
    const defaultDashboard = isBoss ? '/dashboard/boss' : '/dashboard/manager';

    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />
                
                {/* Redirect */}
                <Route path="/" element={
                    isAuthenticated ? 
                    <Navigate to={defaultDashboard} replace /> : 
                    <Navigate to="/login" replace />
                } />

                {/* --- Individual Protected Routes --- */}
                {/* NO LAYOUT WRAPPER - Components handle Layout themselves */}
                
                {/* Dashboard Routes */}
                <Route path="/dashboard/boss" element={
                    <ProtectedRoute allowedRoles={['Boss']}>
                        <DashboardBoss />
                    </ProtectedRoute>
                } />
                
                <Route path="/dashboard/manager" element={
                    <ProtectedRoute allowedRoles={['Manager']}>
                        <DashboardManager />
                    </ProtectedRoute>
                } />
                
                {/* Other Routes */}
                <Route path="/products" element={
                    <ProtectedRoute allowedRoles={['Boss', 'Manager']}>
                        <Products />
                    </ProtectedRoute>
                } />
                
                <Route path="/orders" element={
                    <ProtectedRoute allowedRoles={['Boss', 'Manager']}>
                        <Orders />
                    </ProtectedRoute>
                } />
                
                <Route path="/expenses" element={
                    <ProtectedRoute allowedRoles={['Boss', 'Manager']}>
                        <Expenses />
                    </ProtectedRoute>
                } />
                
                <Route path="/po" element={
                    <ProtectedRoute allowedRoles={['Boss', 'Manager']}>
                        <PurchaseOrders />
                    </ProtectedRoute>
                } />
                
                <Route path="/suppliers" element={
                    <ProtectedRoute allowedRoles={['Boss', 'Manager']}>
                        <Suppliers />
                    </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={['Boss']}>
                        {/* User Management Page - Add Layout if this component doesn't have it */}
                        <div style={{ padding: '20px' }}>
                            <h1>User Management Page</h1>
                            <p>This page would need Layout wrapper if you create a component</p>
                        </div>
                    </ProtectedRoute>
                } />

                {/* 404 - Just simple error since no Layout */}
                <Route path="*" element={
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <h1>404: Page Not Found</h1>
                    </div>
                } />
            </Routes>
        </Router>
    );
};

export default App;