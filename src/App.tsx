// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products'; 
import Orders from './pages/Orders'; 
import Expenses from './pages/Expenses'; // <-- FINAL IMPORT
import PurchaseOrders from './pages/PurchaseOrders'; // <-- FINAL IMPORT
import { useAppSelector } from './store/hooks';
import { selectIsAuthenticated, selectIsBoss } from './store/authSlice';
import DashboardBoss from './pages/DashboardBoss'; 
import DashboardManager from './pages/DashboardManager'; 
import Layout from './components/Layout'; 

// --- Private Route Component ---
interface PrivateRouteProps {
    allowedRoles: ('Boss' | 'Manager')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBoss = useAppSelector(selectIsBoss);
    const userRole = isBoss ? 'Boss' : 'Manager'; // Simplified role string

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.includes(userRole)) {
        return <Outlet />; // Render child routes/elements
    }
    
    // Fallback/Forbidden page
    return <Layout pageTitle="Access Denied"><p style={{color: 'red'}}>Error 403: You do not have permission to view this page.</p></Layout>; 
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
                
                {/* Redirect authenticated users from / to their dashboard */}
                <Route path="/" element={isAuthenticated ? <Navigate to={defaultDashboard} replace /> : <Navigate to="/login" replace />} />

                {/* --- Protected Routes (Boss and Manager Access) --- */}
                <Route element={<PrivateRoute allowedRoles={['Boss', 'Manager']} />}>
                    {/* General Access Routes */}
                    <Route path="/products" element={<Products />} />
                    <Route path="/orders" element={<Orders />} /> 
                    <Route path="/expenses" element={<Expenses />} /> {/* <-- FINAL ROUTE */}
                    <Route path="/po" element={<PurchaseOrders />} /> {/* <-- FINAL ROUTE */}
                </Route>

                {/* --- Role-Specific Protected Routes --- */}
                
                {/* Boss ONLY Routes */}
                <Route element={<PrivateRoute allowedRoles={['Boss']} />}>
                    <Route path="/dashboard/boss" element={<DashboardBoss />} />
                    <Route path="/users" element={<Layout pageTitle="User Management"><div>User Management Page</div></Layout>} />
                </Route>
                
                {/* Manager ONLY Routes (Dashboard is primary Manager view) */}
                <Route element={<PrivateRoute allowedRoles={['Manager']} />}>
                    <Route path="/dashboard/manager" element={<DashboardManager />} />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<Layout pageTitle="Not Found"><div>404: Page Not Found</div></Layout>} />
            </Routes>
        </Router>
    );
};

export default App;