// src/pages/DashboardManager.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/authSlice';
import api  from '../api/apiService';
import '../styles/Global.css'; 

const DashboardManager: React.FC = () => {
    const user = useAppSelector(selectUser);
    const [report, setReport] = useState<any>(null); // Use any for simplicity here
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDailyReport = async () => {
            try {
                // Backend is configured to filter this GET request by the Manager's name
                const response = await api.get('/reports/daily'); 
                setReport(response.data);
                setError(null);
            } catch (error: any) {
                setError(error.response?.data?.message || 'Failed to fetch your daily report.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDailyReport();
    }, []);

    if (loading) return <Layout pageTitle="Manager Dashboard"><div>Loading Your Daily Report...</div></Layout>;
    if (error) return <Layout pageTitle="Manager Dashboard"><p className="error-message">{error}</p></Layout>;
    if (!report) return <Layout pageTitle="Manager Dashboard"><div>No activity recorded today.</div></Layout>;

    return (
        <Layout pageTitle={`${user?.name}'s Daily Activity Report`}>
            <h2>Report for: {report.date}</h2>
            
            <div className="card-container">
                <div className="card-metric primary">
                    <h3>Sales Collected Today</h3>
                    <p>{report.salesSummary.totalCollected.toLocaleString('en-RW')} RWF</p>
                </div>
                <div className="card-metric danger">
                    <h3>Expenses Incurred Today</h3>
                    <p>{report.expenseSummary.totalIncurred.toLocaleString('en-RW')} RWF</p>
                </div>
            </div>

            <h3>Sales Breakdown by Payment Status</h3>
            <table className="data-table">
                <thead><tr><th>Status</th><th>Total Sold Value</th><th>Collected</th></tr></thead>
                <tbody>
                    {report.salesSummary.detailsByStatus.map((item: any) => (
                        <tr key={item._id}>
                            <td>{item._id}</td>
                            <td>{item.totalAmountSold.toLocaleString('en-RW')} RWF</td>
                            <td>{item.totalAmountCollected.toLocaleString('en-RW')} RWF</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 style={{marginTop: '20px'}}>Expenses Breakdown</h3>
            <table className="data-table">
                <thead><tr><th>Expense Type</th><th>Total Amount</th></tr></thead>
                <tbody>
                    {report.expenseSummary.detailsByType.map((item: any) => (
                        <tr key={item.expenseType}>
                            <td>{item.expenseType}</td>
                            <td>{item.totalAmount.toLocaleString('en-RW')} RWF</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    );
};

export default DashboardManager;