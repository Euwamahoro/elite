import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, AlertTriangle, Download } from 'lucide-react';
import { BossDashboardMetrics } from '../types/models';
import { getBossDashboardMetrics } from '../api/apiService'; // ADD THIS IMPORT
import Layout from '../components/Layout';

const DashboardBoss = () => {
    const [metrics, setMetrics] = useState<BossDashboardMetrics | null>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMetrics();
    }, [period]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await getBossDashboardMetrics(period); // USE THE SERVICE
            setMetrics(response.data);
            setError(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch dashboard metrics');
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportDashboard = () => {
        if (!metrics) return;
        
        let csv = `Elite Movers Dashboard Report\n`;
        csv += `Period: ${period}\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        csv += `ALL TIME FINANCIALS\n`;
        csv += `Total Revenue,${metrics.financials.allTime.totalRevenue}\n`;
        csv += `Total Expenses,${metrics.financials.allTime.totalExpenses}\n`;
        csv += `Total Purchases,${metrics.financials.allTime.totalPurchases}\n`;
        csv += `Net Profit,${metrics.financials.allTime.netProfit}\n\n`;
        
        csv += `PERIOD FINANCIALS (${period.toUpperCase()})\n`;
        csv += `Revenue,${metrics.financials.period.totalRevenue}\n`;
        csv += `Expenses,${metrics.financials.period.totalExpenses}\n`;
        csv += `Purchases,${metrics.financials.period.totalPurchases}\n`;
        csv += `Net Profit,${metrics.financials.period.netProfit}\n\n`;
        
        csv += `INVENTORY\n`;
        csv += `Total Products,${metrics.inventory.totalProducts}\n`;
        csv += `Total Stock,${metrics.inventory.totalQuantityInStock}\n\n`;
        
        csv += `LOW STOCK ITEMS\n`;
        csv += `Product,Code,Current Stock,Min Level\n`;
        metrics.inventory.lowStockItems.forEach(item => {
            csv += `${item.name},${item.productCode},${item.totalStock},${item.minStockLevel}\n`;
        });
        csv += `\n`;
        
        csv += `TOP PRODUCTS (${period.toUpperCase()})\n`;
        csv += `Product,Quantity Sold,Revenue\n`;
        metrics.sales.topProducts.forEach(product => {
            csv += `${product.productName},${product.totalQuantity},${product.totalRevenue}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dashboard_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Layout pageTitle="Business Dashboard">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#666' }}>Loading dashboard...</div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout pageTitle="Business Dashboard">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ color: '#dc3545', fontSize: '18px' }}>{error}</div>
                </div>
            </Layout>
        );
    }
    if (!metrics) return null;

    return (
        <Layout pageTitle="Business Dashboard">
            <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>Business Dashboard</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>Comprehensive overview of your business</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                        <option value="year">Last Year</option>
                    </select>
                    <button 
                        onClick={exportDashboard}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* All Time Metrics */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>All Time Performance</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '28px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <DollarSign size={32} />
                            <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>Total Revenue</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                            {metrics.financials.allTime.totalRevenue.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '28px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px rgba(240, 147, 251, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <TrendingDown size={32} />
                            <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>Total Expenses</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                            {metrics.financials.allTime.totalExpenses.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', padding: '28px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px rgba(250, 112, 154, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <ShoppingBag size={32} />
                            <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>Total Purchases</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                            {metrics.financials.allTime.totalPurchases.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: metrics.financials.allTime.netProfit >= 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', padding: '28px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px rgba(79, 172, 254, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <TrendingUp size={32} />
                            <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>Net Profit</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                            {metrics.financials.allTime.netProfit.toLocaleString('en-RW')} RWF
                        </p>
                    </div>
                </div>
            </div>

            {/* Period Metrics */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                    {period === 'week' ? 'Last Week' : period === 'month' ? 'Last Month' : period === 'quarter' ? 'Last Quarter' : 'Last Year'} Performance
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #667eea' }}>
                        <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Revenue</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                            {metrics.financials.period.totalRevenue.toLocaleString('en-RW')} RWF
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f5576c' }}>
                        <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Expenses</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                            {metrics.financials.period.totalExpenses.toLocaleString('en-RW')} RWF
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #fee140' }}>
                        <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Purchases</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                            {metrics.financials.period.totalPurchases.toLocaleString('en-RW')} RWF
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${metrics.financials.period.netProfit >= 0 ? '#00f2fe' : '#ff5858'}` }}>
                        <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Net Profit</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: metrics.financials.period.netProfit >= 0 ? '#00c851' : '#ff3547' }}>
                            {metrics.financials.period.netProfit.toLocaleString('en-RW')} RWF
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Top Products */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={22} />
                        Top Selling Products
                    </h2>
                    <div style={{ maxHeight: '350px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Product</th>
                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Qty</th>
                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.sales.topProducts.map((product, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                        <td style={{ padding: '10px', fontSize: '14px' }}>{product.productName}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>{product.totalQuantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>
                                            {product.totalRevenue.toLocaleString('en-RW')} RWF
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Items */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', color: '#dc3545' }}>
                        <AlertTriangle size={22} />
                        Low Stock Alert
                    </h2>
                    <div style={{ maxHeight: '350px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Product</th>
                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Current</th>
                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Min Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.inventory.lowStockItems.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                        <td style={{ padding: '10px', fontSize: '14px' }}>
                                            <div style={{ fontWeight: '500' }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{item.productCode}</div>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#dc3545' }}>
                                            {item.totalStock}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                                            {item.minStockLevel}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Supplier Balances */}
            {metrics.purchaseOrders.supplierBalances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Outstanding Supplier Payments</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Supplier</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>POs Count</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Amount Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.purchaseOrders.supplierBalances.map((supplier, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{supplier.supplierName}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{supplier.poCount}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#dc3545' }}>
                                        {supplier.totalDue.toLocaleString('en-RW')} RWF
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
                {/* Recent Orders */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Recent Sales Orders</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {metrics.recentActivity.orders.map((order, index) => (
                            <div key={index} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #667eea' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.customerName}</span>
                                    <span style={{ fontSize: '13px', color: '#666' }}>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#666' }}>by {order.managerName}</span>
                                    <span style={{ fontWeight: '600' }}>{order.totalAmount.toLocaleString('en-RW')} RWF</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent POs */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Recent Purchase Orders</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {metrics.recentActivity.purchaseOrders.map((po, index) => (
                            <div key={index} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #f5576c' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{po.poNumber}</span>
                                    <span style={{ fontSize: '13px', color: '#666' }}>
                                        {new Date(po.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#666' }}>{po.supplier.name}</span>
                                    <span style={{ fontWeight: '600' }}>{po.grandTotal.toLocaleString('en-RW')} RWF</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </Layout>
        
    );
};

export default DashboardBoss;