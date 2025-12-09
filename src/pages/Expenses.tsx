// src/pages/Expenses.tsx - UPDATED WITH EXPENSE NAME
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import { 
    getExpenseRecords, 
    createExpenseRecord, 
    getExpenseTypes, 
    createExpenseType,
    addExpenseSubtype,
    getExpenseNames
} from '../api/apiService';
import { ExpenseRecord, ProductCategory } from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

interface ExpenseTypeWithSubtypes extends ProductCategory {
    subtypes?: Array<{ _id?: string; name: string; description?: string }>;
    hasSubtypes?: boolean;
}

interface ExpenseNameOption {
    name: string;
    type: string;
    subtype?: string;
    count: number;
    lastUsed: string;
}

const initialExpenseFormData = {
    expenseType: '',
    expenseSubtype: '',
    expenseName: '',
    amount: 0,
    notes: '',
};

const Expenses: React.FC = () => {
    const [records, setRecords] = useState<ExpenseRecord[]>([]);
    const [types, setTypes] = useState<ExpenseTypeWithSubtypes[]>([]);
    const [selectedType, setSelectedType] = useState<ExpenseTypeWithSubtypes | null>(null);
    const [subtypes, setSubtypes] = useState<Array<{ _id?: string; name: string }>>([]);
    const [expenseNames, setExpenseNames] = useState<ExpenseNameOption[]>([]);
    const [filteredExpenseNames, setFilteredExpenseNames] = useState<ExpenseNameOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showSubtypeModal, setShowSubtypeModal] = useState(false);
    const [recordFormData, setRecordFormData] = useState(initialExpenseFormData);
    const [typeName, setTypeName] = useState('');
    const [subtypeName, setSubtypeName] = useState('');
    const [useCustomSubtype, setUseCustomSubtype] = useState(false);
    const [customSubtype, setCustomSubtype] = useState('');
    const [useCustomExpenseName, setUseCustomExpenseName] = useState(false);
    const [customExpenseName, setCustomExpenseName] = useState('');
    const [showExpenseNameSuggestions, setShowExpenseNameSuggestions] = useState(false);

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

    // Fetch expense names when type or subtype changes
    const fetchExpenseNames = async (expenseType?: string, expenseSubtype?: string) => {
        try {
            const params: any = {};
            if (expenseType) params.expenseType = expenseType;
            if (expenseSubtype) params.expenseSubtype = expenseSubtype;
            
            const response = await getExpenseNames(params);
            setExpenseNames(response.data);
            setFilteredExpenseNames(response.data);
        } catch (error: any) {
            console.error('Failed to fetch expense names:', error);
            setExpenseNames([]);
            setFilteredExpenseNames([]);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Update subtypes when expense type changes
    useEffect(() => {
        if (recordFormData.expenseType) {
            const type = types.find(t => t._id === recordFormData.expenseType);
            setSelectedType(type || null);
            setSubtypes(type?.subtypes || []);
            // Reset subtype and expense name when type changes
            setRecordFormData(prev => ({ 
                ...prev, 
                expenseSubtype: '',
                expenseName: ''
            }));
            setUseCustomSubtype(false);
            setCustomSubtype('');
            setUseCustomExpenseName(false);
            setCustomExpenseName('');
            
            // Fetch expense names for this type
            fetchExpenseNames(recordFormData.expenseType);
        }
    }, [recordFormData.expenseType, types]);

    // Fetch expense names when subtype changes
    useEffect(() => {
        if (recordFormData.expenseType && recordFormData.expenseSubtype && !useCustomSubtype) {
            // expenseSubtype is now the ID, use it directly
            fetchExpenseNames(recordFormData.expenseType, recordFormData.expenseSubtype);
            // Reset expense name when subtype changes
            setRecordFormData(prev => ({ ...prev, expenseName: '' }));
            setUseCustomExpenseName(false);
            setCustomExpenseName('');
        }
    }, [recordFormData.expenseSubtype, recordFormData.expenseType, useCustomSubtype]);

    // Filter expense names based on input
    const handleExpenseNameInput = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRecordFormData({ ...recordFormData, expenseName: value });
        
        if (value.trim()) {
            const filtered = expenseNames.filter(en => 
                en.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredExpenseNames(filtered);
            setShowExpenseNameSuggestions(true);
        } else {
            setFilteredExpenseNames(expenseNames);
            setShowExpenseNameSuggestions(false);
        }
    };

    const selectExpenseName = (name: string) => {
        setRecordFormData({ ...recordFormData, expenseName: name });
        setShowExpenseNameSuggestions(false);
    };

    const handleRecordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const subtypeToUse = useCustomSubtype ? customSubtype : recordFormData.expenseSubtype;
            const expenseNameToUse = useCustomExpenseName ? customExpenseName : recordFormData.expenseName;
            
            await createExpenseRecord({
                ...recordFormData,
                expenseSubtype: subtypeToUse,
                expenseName: expenseNameToUse,
                amount: parseFloat(recordFormData.amount.toString()),
            });
            
            alert('Expense recorded successfully!');
            setShowRecordModal(false);
            setRecordFormData(initialExpenseFormData);
            setUseCustomSubtype(false);
            setCustomSubtype('');
            setUseCustomExpenseName(false);
            setCustomExpenseName('');
            fetchExpenses();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to record expense.');
        }
    };
    
    const handleTypeSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await createExpenseType({ name: typeName });
            alert('Expense Type created successfully!');
            setShowTypeModal(false);
            setTypeName('');
            fetchExpenses();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create expense type.');
        }
    };

    const handleSubtypeSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedType || !subtypeName.trim()) return;
        
        try {
            await addExpenseSubtype(selectedType._id, { name: subtypeName });
            alert('Subtype added successfully!');
            setShowSubtypeModal(false);
            setSubtypeName('');
            fetchExpenses();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to add subtype.');
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
                        <th>Subtype</th>
                        <th>Expense Name</th>
                        <th>Amount</th>
                        <th>Recorded By</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r) => (
                        <tr key={r._id}>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td>{(r as any).expenseType?.name || r.expenseTypeName || 'N/A'}</td>
                            <td>{r.expenseSubtypeName || '—'}</td>
                            <td>{r.expenseName || '—'}</td>
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
                            {/* Main Expense Type */}
                            <div className="form-group">
                                <label>Expense Type *</label>
                                <select 
                                    value={recordFormData.expenseType} 
                                    onChange={(e) => setRecordFormData({...recordFormData, expenseType: e.target.value})} 
                                    required
                                >
                                    <option value="">-- Select Main Type --</option>
                                    {types.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subtype Selection */}
                            {selectedType && (
                                <div className="form-group">
                                    <label>Expense Subtype (Optional)</label>
                                    
                                    {subtypes.length > 0 && (
                                        <>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input 
                                                        type="radio" 
                                                        checked={!useCustomSubtype} 
                                                        onChange={() => setUseCustomSubtype(false)} 
                                                    />
                                                    Select from existing subtypes
                                                </label>
                                                
                                                {!useCustomSubtype && (
                                                    <select 
                                                        value={recordFormData.expenseSubtype} 
                                                        onChange={(e) => setRecordFormData({...recordFormData, expenseSubtype: e.target.value})}
                                                        style={{ marginTop: '5px', width: '100%' }}
                                                    >
                                                        <option value="">-- Select Subtype --</option>
                                                        {subtypes.map((sub, idx) => (
                                                            <option key={idx} value={sub._id || sub.name}>{sub.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="radio" 
                                                checked={useCustomSubtype} 
                                                onChange={() => setUseCustomSubtype(true)} 
                                            />
                                            Add new subtype
                                        </label>
                                        
                                        {useCustomSubtype && (
                                            <div style={{ marginTop: '5px' }}>
                                                <input 
                                                    type="text" 
                                                    value={customSubtype} 
                                                    onChange={(e) => setCustomSubtype(e.target.value)}
                                                    placeholder="Enter new subtype name"
                                                    style={{ width: '100%' }}
                                                />
                                                <small style={{ color: '#666' }}>
                                                    This will be saved for future use
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{ marginTop: '10px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-secondary btn-small"
                                            onClick={() => setShowSubtypeModal(true)}
                                        >
                                            + Manage Subtypes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Expense Name Selection */}
                            {selectedType && (
                                <div className="form-group">
                                    <label>Expense Name (Optional)</label>
                                    <small style={{ display: 'block', color: '#666', marginBottom: '5px' }}>
                                        e.g., "Car Tires", "Office Rent", "Electricity Bill"
                                    </small>
                                    
                                    {expenseNames.length > 0 && (
                                        <>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input 
                                                        type="radio" 
                                                        checked={!useCustomExpenseName} 
                                                        onChange={() => setUseCustomExpenseName(false)} 
                                                    />
                                                    Select from existing expense names
                                                </label>
                                                
                                                {!useCustomExpenseName && (
                                                    <div style={{ position: 'relative', marginTop: '5px' }}>
                                                        <input 
                                                            type="text" 
                                                            value={recordFormData.expenseName}
                                                            onChange={handleExpenseNameInput}
                                                            onFocus={() => setShowExpenseNameSuggestions(true)}
                                                            placeholder="Start typing or select..."
                                                            style={{ width: '100%' }}
                                                        />
                                                        {showExpenseNameSuggestions && filteredExpenseNames.length > 0 && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                right: 0,
                                                                backgroundColor: 'white',
                                                                border: '1px solid #ddd',
                                                                borderTop: 'none',
                                                                maxHeight: '200px',
                                                                overflowY: 'auto',
                                                                zIndex: 1000,
                                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                            }}>
                                                                {filteredExpenseNames.map((en, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => selectExpenseName(en.name)}
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            cursor: 'pointer',
                                                                            borderBottom: '1px solid #f0f0f0',
                                                                            backgroundColor: 'white'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                                    >
                                                                        <strong>{en.name}</strong>
                                                                        <small style={{ display: 'block', color: '#666' }}>
                                                                            {en.subtype ? `${en.type} → ${en.subtype}` : en.type} • Used {en.count} time(s)
                                                                        </small>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="radio" 
                                                checked={useCustomExpenseName} 
                                                onChange={() => {
                                                    setUseCustomExpenseName(true);
                                                    setShowExpenseNameSuggestions(false);
                                                }} 
                                            />
                                            Add new expense name
                                        </label>
                                        
                                        {useCustomExpenseName && (
                                            <div style={{ marginTop: '5px' }}>
                                                <input 
                                                    type="text" 
                                                    value={customExpenseName} 
                                                    onChange={(e) => setCustomExpenseName(e.target.value)}
                                                    placeholder="Enter new expense name"
                                                    style={{ width: '100%' }}
                                                />
                                                <small style={{ color: '#666' }}>
                                                    This will be saved for future use
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Amount and Notes */}
                            <div className="form-group">
                                <label>Amount (RWF) *</label>
                                <input 
                                    type="number" 
                                    value={recordFormData.amount} 
                                    onChange={(e) => setRecordFormData({...recordFormData, amount: parseFloat(e.target.value) || 0})} 
                                    required 
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea 
                                    value={recordFormData.notes} 
                                    onChange={(e) => setRecordFormData({...recordFormData, notes: e.target.value})} 
                                    rows={3}
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Record Expense</button>
                                <button type="button" className="btn-secondary" onClick={() => {
                                    setShowRecordModal(false);
                                    setShowExpenseNameSuggestions(false);
                                }}>Cancel</button>
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
                                <label>Type Name (e.g., Fuel, Wages, Office Supplies)</label>
                                <input 
                                    type="text" 
                                    value={typeName} 
                                    onChange={(e) => setTypeName(e.target.value)} 
                                    required 
                                />
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
            
            {/* --- Add Subtype Modal --- */}
            {showSubtypeModal && selectedType && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Add Subtype to {selectedType.name}</h3>
                        <form onSubmit={handleSubtypeSubmit}>
                            <div className="form-group">
                                <label>Subtype Name</label>
                                <input 
                                    type="text" 
                                    value={subtypeName} 
                                    onChange={(e) => setSubtypeName(e.target.value)} 
                                    placeholder="e.g., Diesel, Petrol for Fuel type"
                                    required 
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Add Subtype</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowSubtypeModal(false)}>Cancel</button>
                            </div>
                        </form>
                        
                        {selectedType.subtypes && selectedType.subtypes.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4>Existing Subtypes</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedType.subtypes.map((sub, idx) => (
                                        <li key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                                            {sub.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Expenses;