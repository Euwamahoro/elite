import { getManagerDailyReport } from '../api/apiService';
import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { ManagerDailyReport } from '../types/models';
import Layout from '../components/Layout'; // ADD THIS IMPORT

const DashboardManager = () => {
    const [report, setReport] = useState<ManagerDailyReport | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchDailyReport();
    }, [selectedDate]);

    const fetchDailyReport = async () => {
    try {
        setLoading(true);
        // Use the service function instead of raw fetch
        const response = await getManagerDailyReport(selectedDate);
        setReport(response.data); // Axios returns data in .data
        setError(null);
    } catch (error: any) {
        console.error('Fetch error:', error);
        setError('Failed to fetch daily report');
    } finally {
        setLoading(false);
    }
};

    const exportToCSV = () => {
        if (!report) return;
        
        setExporting(true);
        
        // Prepare CSV content
        let csv = `Daily Activity Report - ${report.date}\n`;
        csv += `Manager: ${report.user}\n\n`;
        
        csv += `SUMMARY\n`;
        csv += `Total Sales Value,${report.summary.totalSalesValue}\n`;
        csv += `Total Collected,${report.summary.totalCollected}\n`;
        csv += `Total Expenses,${report.summary.totalExpenses}\n`;
        csv += `Net Cash Flow,${report.summary.netCashFlow}\n`;
        csv += `Pending Amount,${report.summary.pendingAmount}\n\n`;
        
        csv += `SALES BY STATUS\n`;
        csv += `Status,Count,Total Sold,Collected\n`;
        report.salesSummary.detailsByStatus.forEach(item => {
            csv += `${item._id},${item.count},${item.totalAmountSold},${item.totalAmountCollected}\n`;
        });
        csv += `\n`;
        
        csv += `SALES DETAILS\n`;
        csv += `Time,Customer,Total Amount,Paid,Status\n`;
        report.salesSummary.orders.forEach(order => {
            csv += `${new Date(order.createdAt).toLocaleTimeString()},${order.customerName},${order.totalAmount},${order.amountPaid},${order.paymentStatus}\n`;
        });
        csv += `\n`;
        
        csv += `EXPENSES BY TYPE\n`;
        csv += `Type,Count,Total Amount\n`;
        report.expenseSummary.detailsByType.forEach(item => {
            csv += `${item.expenseType},${item.count},${item.totalAmount}\n`;
        });
        csv += `\n`;
        
        csv += `EXPENSE DETAILS\n`;
        csv += `Time,Type,Amount,Notes\n`;
        report.expenseSummary.expenses.forEach(expense => {
            csv += `${new Date(expense.createdAt).toLocaleTimeString()},${expense.expenseType.name},${expense.amount},"${expense.notes || ''}"\n`;
        });
        csv += `\n`;
        
        csv += `PRODUCTS SOLD\n`;
        csv += `Product,Quantity,Revenue,Avg Price\n`;
        report.productsSold.forEach(product => {
            csv += `${product.productName},${product.totalQuantity},${product.totalRevenue},${product.avgPrice.toFixed(2)}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daily_Report_${report.date}_${report.user.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setExporting(false);
    };

    const printReport = () => {
        window.print();
    };

    if (loading) {
        return (
            <Layout pageTitle="Manager Dashboard"> {/* ADD LAYOUT WRAPPER */}
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#666' }}>Loading report...</div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout pageTitle="Manager Dashboard"> {/* ADD LAYOUT WRAPPER */}
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ color: '#dc3545', fontSize: '18px' }}>{error}</div>
                </div>
            </Layout>
        );
    }

    if (!report) {
        return (
            <Layout pageTitle="Manager Dashboard"> {/* ADD LAYOUT WRAPPER */}
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#666' }}>No activity recorded</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout pageTitle="Manager Dashboard"> {/* ADD LAYOUT WRAPPER */}
            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}>Daily Activity Report</h1>
                        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>Manager: {report.user}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        />
                        <button 
                            onClick={exportToCSV}
                            disabled={exporting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: exporting ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                opacity: exporting ? 0.6 : 1
                            }}
                        >
                            <Download size={18} />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button 
                            onClick={printReport}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                            className="no-print"
                        >
                            <FileText size={18} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <DollarSign size={24} />
                            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Total Sales Value</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                            {report.summary.totalSalesValue.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '24px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <TrendingUp size={24} />
                            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Collected</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                            {report.summary.totalCollected.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', padding: '24px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <TrendingDown size={24} />
                            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Expenses</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                            {report.summary.totalExpenses.toLocaleString('en-RW')} RWF
                        </p>
                    </div>

                    <div style={{ background: report.summary.netCashFlow >= 0 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', padding: '24px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <ShoppingCart size={24} />
                            <h3 style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>Net Cash Flow</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                            {report.summary.netCashFlow.toLocaleString('en-RW')} RWF
                        </p>
                    </div>
                </div>

                {/* Sales Section */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Sales Breakdown</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Count</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total Sold</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Collected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.salesSummary.detailsByStatus.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            background: item._id === 'Cleared' ? '#d4edda' : item._id === 'Partial' ? '#fff3cd' : '#f8d7da',
                                            color: item._id === 'Cleared' ? '#155724' : item._id === 'Partial' ? '#856404' : '#721c24'
                                        }}>
                                            {item._id}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.count}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.totalAmountSold.toLocaleString('en-RW')} RWF</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.totalAmountCollected.toLocaleString('en-RW')} RWF</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sales Details */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Sales Details</h2>
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Time</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Paid</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.salesSummary.orders.map((order, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                        <td style={{ padding: '12px' }}>{new Date(order.createdAt).toLocaleTimeString()}</td>
                                        <td style={{ padding: '12px' }}>{order.customerName}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{order.totalAmount.toLocaleString('en-RW')} RWF</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{order.amountPaid.toLocaleString('en-RW')} RWF</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                background: order.paymentStatus === 'Cleared' ? '#d4edda' : order.paymentStatus === 'Partial' ? '#fff3cd' : '#f8d7da',
                                                color: order.paymentStatus === 'Cleared' ? '#155724' : order.paymentStatus === 'Partial' ? '#856404' : '#721c24'
                                            }}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expenses Section */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Expenses Breakdown</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Expense Type</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Count</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.expenseSummary.detailsByType.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '12px' }}>{item.expenseType}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.count}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{item.totalAmount.toLocaleString('en-RW')} RWF</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Products Sold */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={24} />
                        Products Sold Today
                    </h2>
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Product</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Quantity</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Revenue</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Avg Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.productsSold.map((product, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{product.productName}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{product.totalQuantity}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{product.totalRevenue.toLocaleString('en-RW')} RWF</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{product.avgPrice.toFixed(2)} RWF</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style>{`
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        body {
                            background: white;
                        }
                    }
                `}</style>
            </div>
        </Layout> // CLOSE LAYOUT WRAPPER
    );
};

export default DashboardManager;