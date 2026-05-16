// src/pages/Suppliers.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    getSuppliers, 
    createSupplier, 
    getSupplierById, 
    updateSupplier,
    getSupplierStatement
} from '../api/apiService';
import { Supplier, SupplierFormData } from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectIsBoss } from '../store/authSlice';
import SupplierDocuments from '../components/Supplier/SupplierDocuments';
import '../styles/Global.css';

const initialSupplierForm: SupplierFormData = {
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    creditLimit: 0,
    paymentTerms: 'Credit 30 days',
};

const Suppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [statement, setStatement] = useState<any>(null);
    const [formData, setFormData] = useState<SupplierFormData>(initialSupplierForm);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
    
    const [search, setSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState(true);

    const isBoss = useAppSelector(selectIsBoss);

    const fetchSuppliers = async () => {
        try {
            const response = await getSuppliers({ 
                search, 
                activeOnly,
                sortBy: 'name',
                order: 'asc'
            });
            
            let suppliersData: Supplier[] = [];
            
            // Handle API response structure
            if (response && response.data) {
                const data = response.data;
                // Check if data has suppliers array
                if (data.suppliers && Array.isArray(data.suppliers)) {
                    suppliersData = data.suppliers;
                } 
                // If data itself is an array
                else if (Array.isArray(data)) {
                    suppliersData = data;
                }
                // If data has data property that is array
                else if (data.data && Array.isArray(data.data)) {
                    suppliersData = data.data;
                }
            } 
            // If response itself is an array
            else if (Array.isArray(response)) {
                suppliersData = response;
            }
            
            setSuppliers(suppliersData);
            setError(null);
        } catch (error: any) {
            console.error('Error fetching suppliers:', error);
            setError(error.response?.data?.message || 'Failed to fetch suppliers.');
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [search, activeOnly]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            if (editing && selectedSupplier) {
                await updateSupplier(selectedSupplier._id, formData);
                setSuccess(`Supplier ${formData.name} updated successfully!`);
            } else {
                await createSupplier(formData);
                setSuccess(`Supplier ${formData.name} created successfully!`);
            }
            
            setShowModal(false);
            setFormData(initialSupplierForm);
            setEditing(false);
            fetchSuppliers();
            
        } catch (error: any) {
            setError(error.response?.data?.message || `Failed to ${editing ? 'update' : 'create'} supplier.`);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            phoneNumber: supplier.phoneNumber,
            email: supplier.email || '',
            address: supplier.address,
            creditLimit: supplier.creditLimit,
            paymentTerms: supplier.paymentTerms,
            taxId: supplier.taxId,
        });
        setSelectedSupplier(supplier);
        setEditing(true);
        setShowModal(true);
    };

    const handleViewDetails = async (supplier: Supplier) => {
        try {
            const [supplierRes, statementRes] = await Promise.all([
                getSupplierById(supplier._id),
                getSupplierStatement(supplier._id)
            ]);
            
            const supplierData = (supplierRes as any).data?.data || (supplierRes as any).data || supplierRes;
            const statementData = (statementRes as any).data?.data || (statementRes as any).data || statementRes;
            
            setSelectedSupplier(supplierData as Supplier);
            setSelectedSupplierId(supplier._id);
            setStatement(statementData);
            setActiveTab('info');
            setShowDetailModal(true);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch supplier details.');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData(initialSupplierForm);
        setEditing(false);
        setSelectedSupplier(null);
    };

    const getCreditUtilizationClass = (utilization: number) => {
        if (utilization >= 90) return 'status-pending';
        if (utilization >= 70) return 'status-partial';
        return 'status-cleared';
    };

    const getDocumentCount = (supplier: Supplier) => {
        return supplier.documents?.length || 0;
    };

    if (loading) return <Layout pageTitle="Supplier Management"><div>Loading Suppliers...</div></Layout>;

    return (
        <Layout pageTitle="Supplier Management">
            <div className="page-header">
                <div>
                    <h2>Suppliers ({suppliers.length})</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '300px', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="checkbox"
                                checked={activeOnly}
                                onChange={(e) => setActiveOnly(e.target.checked)}
                            />
                            Active Only
                        </label>
                    </div>
                </div>
                <button 
                    className="btn-success" 
                    onClick={() => { setShowModal(true); setEditing(false); setFormData(initialSupplierForm); }}
                >
                    + Add Supplier
                </button>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Credit Limit</th>
                        <th>Balance</th>
                        <th>Available</th>
                        <th>Utilization</th>
                        <th>Payment Terms</th>
                        <th>Status</th>
                        <th>Docs</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers && Array.isArray(suppliers) && suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                            <tr key={supplier._id}>
                                <td><strong>{supplier.name}</strong></td>
                                <td>{supplier.contactPerson}</td>
                                <td>{supplier.phoneNumber}</td>
                                <td>{supplier.creditLimit?.toLocaleString('en-RW')} RWF</td>
                                <td>{supplier.currentBalance?.toLocaleString('en-RW')} RWF</td>
                                <td>{supplier.availableCredit?.toLocaleString('en-RW')} RWF</td>
                                <td>
                                    <span className={getCreditUtilizationClass(supplier.creditUtilization || 0)}>
                                        {supplier.creditUtilization?.toFixed(1) || 0}%
                                    </span>
                                </td>
                                <td>{supplier.paymentTerms}</td>
                                <td>
                                    <span className={supplier.isActive ? 'status-cleared' : 'status-pending'}>
                                        {supplier.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {getDocumentCount(supplier) > 0 ? (
                                        <span style={{ 
                                            background: '#4caf50', 
                                            color: 'white', 
                                            padding: '2px 8px', 
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            {getDocumentCount(supplier)}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '11px' }}>—</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button 
                                            className="btn-info btn-small"
                                            onClick={() => handleViewDetails(supplier)}
                                        >
                                            View
                                        </button>
                                        {isBoss && (
                                            <button 
                                                className="btn-edit btn-small"
                                                onClick={() => handleEdit(supplier)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                                {!loading ? 'No suppliers found.' : 'Loading...'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* --- Supplier Form Modal --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>{editing ? 'Edit Supplier' : 'Create New Supplier'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Supplier Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Person *</label>
                                <input 
                                    type="text" 
                                    name="contactPerson" 
                                    value={formData.contactPerson} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input 
                                    type="text" 
                                    name="phoneNumber" 
                                    value={formData.phoneNumber} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email || ''} 
                                    onChange={handleFormChange} 
                                />
                            </div>

                            <div className="form-group">
                                <label>Address *</label>
                                <textarea 
                                    name="address" 
                                    value={formData.address} 
                                    onChange={handleFormChange} 
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Credit Limit (RWF)</label>
                                <input 
                                    type="number" 
                                    name="creditLimit" 
                                    value={formData.creditLimit || 0} 
                                    onChange={handleFormChange} 
                                    min="0"
                                    step="1000"
                                />
                                <small>0 means no credit limit</small>
                            </div>

                            <div className="form-group">
                                <label>Payment Terms</label>
                                <select 
                                    name="paymentTerms" 
                                    value={formData.paymentTerms} 
                                    onChange={handleFormChange}
                                >
                                    <option value="Cash on Delivery">Cash on Delivery</option>
                                    <option value="Credit 7 days">Credit 7 days</option>
                                    <option value="Credit 15 days">Credit 15 days</option>
                                    <option value="Credit 30 days">Credit 30 days</option>
                                    <option value="Credit 60 days">Credit 60 days</option>
                                    <option value="Credit 90 days">Credit 90 days</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tax ID (Optional)</label>
                                <input 
                                    type="text" 
                                    name="taxId" 
                                    value={formData.taxId || ''} 
                                    onChange={handleFormChange} 
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">
                                    {editing ? 'Update Supplier' : 'Create Supplier'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Supplier Detail Modal --- */}
            {showDetailModal && selectedSupplier && selectedSupplierId && (
                <div className="modal-backdrop">
                    <div className="modal-content wide-modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Supplier Details: {selectedSupplier.name}</h3>
                            <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                            <button
                                onClick={() => setActiveTab('info')}
                                style={{
                                    padding: '10px 20px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'info' ? '2px solid #4caf50' : 'none',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === 'info' ? 'bold' : 'normal',
                                    color: activeTab === 'info' ? '#4caf50' : '#666'
                                }}
                            >
                                📋 Basic Information
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                style={{
                                    padding: '10px 20px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === 'documents' ? '2px solid #4caf50' : 'none',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === 'documents' ? 'bold' : 'normal',
                                    color: activeTab === 'documents' ? '#4caf50' : '#666'
                                }}
                            >
                                📄 Documents ({selectedSupplier.documents?.length || 0})
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'info' ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <h4>Contact Information</h4>
                                        <p><strong>Contact Person:</strong> {selectedSupplier.contactPerson}</p>
                                        <p><strong>Phone:</strong> {selectedSupplier.phoneNumber}</p>
                                        <p><strong>Email:</strong> {selectedSupplier.email || 'N/A'}</p>
                                        <p><strong>Address:</strong> {selectedSupplier.address}</p>
                                        <p><strong>Tax ID:</strong> {selectedSupplier.taxId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4>Credit Information</h4>
                                        <p><strong>Credit Limit:</strong> {selectedSupplier.creditLimit?.toLocaleString('en-RW')} RWF</p>
                                        <p><strong>Current Balance:</strong> {selectedSupplier.currentBalance?.toLocaleString('en-RW')} RWF</p>
                                        <p><strong>Available Credit:</strong> {selectedSupplier.availableCredit?.toLocaleString('en-RW')} RWF</p>
                                        <p><strong>Credit Utilization:</strong> 
                                            <span className={getCreditUtilizationClass(selectedSupplier.creditUtilization || 0)}>
                                                {' '}{selectedSupplier.creditUtilization?.toFixed(1) || 0}%
                                            </span>
                                        </p>
                                        <p><strong>Payment Terms:</strong> {selectedSupplier.paymentTerms}</p>
                                        <p><strong>Status:</strong> 
                                            <span className={selectedSupplier.isActive ? 'status-cleared' : 'status-pending'}>
                                                {' '}{selectedSupplier.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {statement && statement.purchaseOrders && statement.purchaseOrders.length > 0 && (
                                    <>
                                        <h4>Recent Transactions</h4>
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>PO Number</th>
                                                        <th>Date</th>
                                                        <th>Amount</th>
                                                        <th>Paid</th>
                                                        <th>Balance</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {statement.purchaseOrders.map((po: any) => (
                                                        <tr key={po._id}>
                                                            <td>{po.poNumber}</td>
                                                            <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                                                            <td>{po.grandTotal?.toLocaleString('en-RW')} RWF</td>
                                                            <td>{po.amountPaid?.toLocaleString('en-RW')} RWF</td>
                                                            <td>{po.balanceDue?.toLocaleString('en-RW')} RWF</td>
                                                            <td>
                                                                <span className={po.paymentStatus === 'Paid' ? 'status-cleared' : 'status-pending'}>
                                                                    {po.paymentStatus}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <SupplierDocuments supplierId={selectedSupplierId} />
                        )}

                        <div className="modal-actions">
                            {isBoss && (
                                <button className="btn-edit" onClick={() => {setShowDetailModal(false); handleEdit(selectedSupplier);}}>
                                    Edit Supplier
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Suppliers;