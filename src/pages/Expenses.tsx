// src/pages/Expenses.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { getExpenseRecords, createExpenseRecord, getExpenseTypes, createExpenseType } from '../api/apiService';
import { ExpenseRecord, ProductCategory } from '../types/models'; // ProductCategory is used as a generic ExpenseType interface
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

const initialExpenseFormData = {
    expenseType: '',
    amount: 0,
    notes: '',
};

const Expenses: React.FC = () => {
    const [records, setRecords] = useState<ExpenseRecord[]>([]);
    const [types, setTypes] = useState<ProductCategory[]>([]); // Using ProductCategory interface for expense types
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [recordFormData, setRecordFormData] = useState(initialExpenseFormData);
    const [typeName, setTypeName] = useState('');

    const isBoss = useAppSelector(selectIsBoss);
    const user = useAppSelector(selectUser);

    const fetchExpenses = async () => {
        try {
            const [recordsRes, typesRes] = await Promise.all([
                getExpenseRecords(),
                getExpenseTypes(),
            ]);
            setRecords(recordsRes.data as ExpenseRecord[]);
            setTypes(typesRes.data);
            setError(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch expenses/types.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleRecordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await createExpenseRecord({
                ...recordFormData,
                amount: parseFloat(recordFormData.amount.toString()),
            });
            alert('Expense recorded successfully!');
            setShowRecordModal(false);
            setRecordFormData(initialExpenseFormData);
            fetchExpenses();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to record expense.');
        }
    };
    
    const handleTypeSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            // Backend will perform Boss-Only 'Salary' check
            await createExpenseType({ name: typeName });
            alert('Expense Type created successfully!');
            setShowTypeModal(false);
            setTypeName('');
            fetchExpenses();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create expense type.');
        }
    };

    if (loading) return <Layout pageTitle="Accounting & Expenses"><div>Loading Expenses...</div></Layout>;

    return (
        <Layout pageTitle="Accounting & Expenses">
            <div className="page-header">
                <h2>Expense Records ({records.length})</h2>
                <div>
                    <button className="btn-secondary" onClick={() => setShowTypeModal(true)}>+ Add Expense Type</button>
                    <button className="btn-primary" onClick={() => setShowRecordModal(true)} style={{ marginLeft: '10px' }}>Record Expense</button>
                </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Recorded By</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r) => (
                        <tr key={r._id}>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            {/* Assuming expenseType is populated on the backend */}
                            <td>{(r as any).expenseType?.name || 'N/A'}</td> 
                            <td style={{ fontWeight: 'bold' }}>{r.amount?.toLocaleString('en-RW')} RWF</td>
                            <td>{r.managerName}</td>
                            <td>{r.notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- Record Expense Modal --- */}
            {showRecordModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Record Expense (Logged in as {user?.name})</h3>
                        <form onSubmit={handleRecordSubmit}>
                            <div className="form-group">
                                <label>Expense Type</label>
                                <select name="expenseType" value={recordFormData.expenseType} onChange={(e) => setRecordFormData({...recordFormData, expenseType: e.target.value})} required>
                                    <option value="">-- Select Type --</option>
                                    {types.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount (RWF)</label>
                                <input type="text" value={recordFormData.amount} onChange={(e) => setRecordFormData({...recordFormData, amount: parseFloat(e.target.value) || 0})} required min="1"/>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea value={recordFormData.notes} onChange={(e) => setRecordFormData({...recordFormData, notes: e.target.value})} />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Record</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowRecordModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* --- Add Expense Type Modal --- */}
            {showTypeModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Add New Expense Type</h3>
                        <form onSubmit={handleTypeSubmit}>
                            <div className="form-group">
                                <label>Type Name (e.g., Fuel, Wages, Salary)</label>
                                <input type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} required />
                                {typeName.toLowerCase().includes('salary') && !isBoss && (
                                    <p className="status-pending" style={{marginTop: '5px', padding: '5px'}}>
                                        Warning: Only the Boss can save 'Salary' types.
                                    </p>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Create Type</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowTypeModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Expenses;