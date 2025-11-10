// src/pages/DashboardBoss.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getDashboardMetrics } from '../api/apiService';
import { DashboardMetrics, Order } from '../types/models';
import '../styles/Global.css'; 

const DashboardBoss: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await getDashboardMetrics();
                setMetrics(response.data);
                setError(null);
            } catch (error: any) {
                setError(error.response?.data?.message || 'Failed to fetch Boss Dashboard metrics.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <Layout pageTitle="Boss Dashboard"><div>Loading Metrics...</div></Layout>;
    if (error) return <Layout pageTitle="Boss Dashboard"><p className="error-message">{error}</p></Layout>;
    if (!metrics) return <Layout pageTitle="Boss Dashboard"><div>No data available.</div></Layout>;

    return (
        <Layout pageTitle="Boss Dashboard (All Business Metrics)">
            <h2>Financial Overview</h2>
            <div className="card-container">
                <div className="card-metric primary">
                    <h3>Total Revenue Collected</h3>
                    <p>{metrics.financials.totalRevenue.toLocaleString('en-RW')} RWF</p>
                </div>
                <div className="card-metric danger">
                    <h3>Total Expenses Incurred</h3>
                    <p>{metrics.financials.totalExpenses.toLocaleString('en-RW')} RWF</p>
                </div>
                <div className="card-metric success">
                    <h3>Net Profit</h3>
                    <p>{metrics.financials.netProfit.toLocaleString('en-RW')} RWF</p>
                </div>
            </div>

            <h2>Inventory Summary</h2>
            <div className="card-container">
                <div className="card-metric secondary">
                    <h3>Total Products</h3>
                    <p>{metrics.inventory.totalProducts}</p>
                </div>
                <div className="card-metric info">
                    <h3>Total Stock Qty</h3>
                    <p>{metrics.inventory.totalQuantityInStock.toLocaleString()}</p>
                </div>
                <div className="card-metric warning">
                    <h3>Low Stock Items</h3>
                    <p>{metrics.inventory.lowStockItems.length} Product(s)</p>
                </div>
            </div>

            <h2>Recent Activity</h2>
            <table className="data-table">
                <thead>
                    <tr><th>Customer</th><th>Manager</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                    {metrics.recentOrders.map((order: Order) => (
                        <tr key={order._id}>
                            <td>{order.customerName}</td>
                            <td>{order.managerName}</td>
                            <td>{order.totalAmount.toLocaleString('en-RW')} RWF</td>
                            <td><span className={`status-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span></td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    );
};

export default DashboardBoss;