// src/pages/PurchaseOrders.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { 
    getPOs, 
    receivePO, 
    getSuppliers, 
    createPO, 
    getProducts,
    submitPO,
    approvePO,
    markAsOrdered,
    addPayment,
    cancelPO,
    getPOById,
    getPODashboardStats
} from '../api/apiService'; 
import { 
    Supplier, 
    Product, 
    PurchaseOrder,
    POFormData,
    POReceiveItem,
    PaymentFormData
} from '../types/models'; 
import { useAppSelector } from '../store/hooks';
import { selectIsBoss, selectUser } from '../store/authSlice';
import '../styles/Global.css'; 

// --- PO ITEM SUB-COMPONENT ---
interface POItemForm {
    product: string;
    quantity: number;
    unitCost: number;
    // Removed unitPrice (selling price)
}

const initialPOFormData: POFormData = {
    supplier: '', 
    poItems: [],
    paymentTerms: 'Credit 30 days',
};

const PurchaseOrders: React.FC = () => {
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]); 
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]); 
    const [loading, setLoading] = useState(true);
    const [showCreatePOModal, setShowCreatePOModal] = useState(false);
    const [showPODetailModal, setShowPODetailModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [poFormData, setPoFormData] = useState<POFormData>(initialPOFormData);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    
    // States for adding a single item
    const [itemProduct, setItemProduct] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemCost, setItemCost] = useState(0);
    // Removed itemSellingPrice state

    // Receive states
    const [receiveNotes, setReceiveNotes] = useState('');
    const [receivedItems, setReceivedItems] = useState<POReceiveItem[]>([]);

    // Payment states
    const [paymentData, setPaymentData] = useState<PaymentFormData>({
        amount: 0,
        paymentMethod: 'Cash',
    });

    // Cancel state
    const [cancelReason, setCancelReason] = useState('');

    const isBoss = useAppSelector(selectIsBoss);
    const user = useAppSelector(selectUser);

    const fetchAllData = async () => {
        try {
            const [poRes, supplierRes, productRes, statsRes] = await Promise.all([
                getPOs({ page: 1, limit: 50, sortBy: 'createdAt', order: 'desc' }),
                getSuppliers({ activeOnly: true }),
                getProducts(),
                getPODashboardStats()
            ]);
            
            setPos(poRes.data.pos || poRes.data || []);
            
            // Handle different supplier response structures
            const supplierData: any = supplierRes.data;
            if (supplierData && Array.isArray(supplierData)) {
                setSuppliers(supplierData);
            } else if (supplierData && Array.isArray(supplierData.suppliers)) {
                setSuppliers(supplierData.suppliers);
            } else if (supplierData && Array.isArray(supplierData.data)) {
                setSuppliers(supplierData.data);
            } else {
                setSuppliers([]);
            }
            
            setAvailableProducts(productRes.data || []);
            setDashboardStats(statsRes.data || {});
            setError(null);
        } catch (error: any) {
            console.error('Fetch error:', error);
            setError(error.response?.data?.message || 'Failed to fetch initial data.');
            setSuppliers([]);
            setAvailableProducts([]);
            setPos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // --- PO Item Management ---
    const handleAddItem = () => {
        if (!itemProduct || itemQuantity <= 0 || itemCost <= 0) {
            alert('Please select product, quantity, and unit cost.');
            return;
        }
        
        const newItem: POItemForm = {
            product: itemProduct,
            quantity: itemQuantity,
            unitCost: itemCost,
        };

        setPoFormData(prev => ({
            ...prev,
            poItems: [...prev.poItems, newItem]
        }));

        setItemProduct('');
        setItemQuantity(1);
        setItemCost(0);
    };

    // --- Core PO Submission Logic ---
   const handleCreatePO = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!poFormData.supplier || poFormData.poItems.length === 0) {
        setError('Missing Supplier or Items.');
        return;
    }

    try {
        // Calculate totals
        const itemsTotal = poFormData.poItems.reduce((sum, item) => 
            sum + (item.quantity * item.unitCost), 0
        );
        
        const payload = {
            supplier: poFormData.supplier,
            paymentTerms: poFormData.paymentTerms || 'Credit 30 days',
            poItems: poFormData.poItems.map(item => ({
                product: item.product,
                name: '', // Backend will fill this
                quantity: item.quantity,
                unitCost: item.unitCost,
                // No unitPrice here, strictly cost
                subtotal: item.quantity * item.unitCost
            })),
            totalCost: itemsTotal,
            grandTotal: itemsTotal,
            taxAmount: 0,
            shippingCost: 0,
            discount: 0
        };

        const response = await createPO(payload);
        
        setSuccess(`Purchase Order ${response.data.poNumber} created successfully as Draft!`);
        setTimeout(() => {
            setShowCreatePOModal(false);
            setPoFormData(initialPOFormData);
            fetchAllData();
        }, 2000);
        
    } catch (error: any) {
        console.error("PO Creation Failed:", error);
        setError(error.response?.data?.message || 'Failed to create Purchase Order.');
    }
};

    // --- PO Workflow Actions ---
    const handleSubmitPO = async (id: string) => {
        if (!window.confirm('Submit this PO for approval?')) return;
        try {
            await submitPO(id);
            setSuccess('PO submitted for approval successfully!');
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to submit PO.');
        }
    };

    const handleApprovePO = async (id: string) => {
        if (!window.confirm('Approve this PO? This will check credit limits.')) return;
        try {
            await approvePO(id);
            setSuccess('PO approved successfully!');
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to approve PO.');
        }
    };

    const handleMarkAsOrdered = async (id: string) => {
        if (!window.confirm('Mark this PO as Ordered?')) return;
        try {
            await markAsOrdered(id);
            setSuccess('PO marked as Ordered!');
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to mark PO as ordered.');
        }
    };

    const handleCancelPO = async () => {
        if (!selectedPO || !cancelReason.trim()) {
            setError('Please provide a cancellation reason.');
            return;
        }
        if (!window.confirm(`Cancel PO ${selectedPO.poNumber}? This action cannot be undone.`)) return;
        
        try {
            await cancelPO(selectedPO._id, cancelReason);
            setSuccess(`PO ${selectedPO.poNumber} cancelled successfully.`);
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedPO(null);
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to cancel PO.');
        }
    };

    // --- PO Receive Logic ---
    const handleOpenReceiveModal = async (po: PurchaseOrder) => {
        setSelectedPO(po);
        setReceiveNotes('');
        const items: POReceiveItem[] = po.poItems.map((item: any) => ({
            poItemId: item._id,
            quantity: item.quantity - (item.quantityReceived || 0),
            notes: ''
        }));
        setReceivedItems(items);
        setShowReceiveModal(true);
    };

    const handleReceivePO = async () => {
        if (!selectedPO) return;
        const itemsToReceive = receivedItems.filter(item => item.quantity > 0);
        
        if (itemsToReceive.length === 0) {
            setError('Please specify quantities to receive.');
            return;
        }

        if (!window.confirm(`Receive ${itemsToReceive.reduce((sum, item) => sum + item.quantity, 0)} items from PO ${selectedPO.poNumber}?`)) {
            return;
        }

        try {
            await receivePO(selectedPO._id, itemsToReceive, receiveNotes);
            setSuccess(`Items received from PO ${selectedPO.poNumber} successfully!`);
            setShowReceiveModal(false);
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to receive items.');
        }
    };

    // --- Payment Processing ---
    const handleOpenPaymentModal = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setPaymentData({
            amount: po.balanceDue || 0,
            paymentMethod: 'Cash',
        });
        setShowPaymentModal(true);
    };

    const handleAddPayment = async () => {
        if (!selectedPO || paymentData.amount <= 0) {
            setError('Please enter a valid payment amount.');
            return;
        }
        if (paymentData.amount > (selectedPO.balanceDue || 0)) {
            setError(`Payment amount cannot exceed balance due: ${selectedPO.balanceDue}`);
            return;
        }
        try {
            await addPayment(selectedPO._id, paymentData);
            setSuccess(`Payment of ${paymentData.amount} recorded for PO ${selectedPO.poNumber}`);
            setShowPaymentModal(false);
            fetchAllData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to record payment.');
        }
    };

    // --- View PO Details ---
    const handleViewPODetails = async (id: string) => {
        try {
            const response = await getPOById(id);
            setSelectedPO(response.data);
            setShowPODetailModal(true);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch PO details.');
        }
    };

    // --- UI Helpers ---
    const getStatusClass = (status: string) => {
        const classes: Record<string, string> = {
            'Draft': 'status-pending',
            'Submitted': 'status-partial',
            'Approved': 'status-partial',
            'Ordered': 'status-partial',
            'Partially Received': 'status-partial',
            'Received': 'status-cleared',
            'Cancelled': 'status-cancelled',
        };
        return classes[status] || 'status-pending';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, string> = {
            'Draft': '📝',
            'Submitted': '📤',
            'Approved': '✅',
            'Ordered': '📦',
            'Partially Received': '📥',
            'Received': '🏁',
            'Cancelled': '❌',
        };
        return icons[status] || '❓';
    };

    const getPaymentStatusClass = (status: string) => {
        if (status === 'Paid') return 'status-cleared';
        if (status === 'Partial') return 'status-partial';
        return 'status-pending';
    };

    const canSubmit = (po: PurchaseOrder) => po.status === 'Draft' && po.managerId === user?._id;
    const canApprove = (po: PurchaseOrder) => po.status === 'Submitted' && isBoss;
    const canOrder = (po: PurchaseOrder) => po.status === 'Approved';
    const canReceive = (po: PurchaseOrder) => ['Ordered', 'Partially Received'].includes(po.status);
    const canPay = (po: PurchaseOrder) => po.paymentStatus !== 'Paid' && po.balanceDue > 0;
    const canCancel = (po: PurchaseOrder) => ['Draft', 'Submitted', 'Approved', 'Ordered'].includes(po.status) && (isBoss || po.managerId === user?._id);

    if (loading) return <Layout pageTitle="Purchase Orders"><div>Loading POs...</div></Layout>;

    return (
        <Layout pageTitle="Purchase Orders (Stock Inflow)">
            <div className="page-header">
                <div>
                    <h2>Purchase Orders ({pos.length})</h2>
                    {dashboardStats && (
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <span className="status-badge">Draft: {dashboardStats.byStatus?.Draft || 0}</span>
                            <span className="status-badge">Pending: {dashboardStats.byStatus?.Submitted || 0}</span>
                            <span className="status-badge">Ordered: {dashboardStats.byStatus?.Ordered || 0}</span>
                            <span className="status-badge">Overdue: {dashboardStats.overdue?.count || 0}</span>
                        </div>
                    )}
                </div>
                <button className="btn-success" onClick={() => {setShowCreatePOModal(true); setError(null); setSuccess(null);}}>
                    Create New PO
                </button>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>PO #</th>
                        <th>Supplier</th>
                        <th>Manager</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Balance</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pos.map((po) => (
                        <tr key={po._id}>
                            <td>
                                <strong>{po.poNumber}</strong>
                                <div style={{ fontSize: '0.8em', color: '#666' }}>
                                    {getStatusIcon(po.status)} {po.status}
                                </div>
                            </td>
                            <td>{(po.supplier as Supplier)?.name || 'N/A'}</td>
                            <td>{po.managerName}</td>
                            <td>{po.grandTotal?.toLocaleString('en-RW')} RWF</td>
                            <td>
                                <span className={getStatusClass(po.status)}>
                                    {po.status}
                                </span>
                            </td>
                            <td>
                                <span className={getPaymentStatusClass(po.paymentStatus)}>
                                    {po.paymentStatus}
                                </span>
                                <div style={{ fontSize: '0.8em' }}>
                                    {po.paymentPercentage?.toFixed(0) || 0}% paid
                                </div>
                            </td>
                            <td>
                                {po.balanceDue?.toLocaleString('en-RW')} RWF
                                {po.dueDate && (
                                    <div style={{ fontSize: '0.8em', color: po.daysOverdue ? 'red' : '#666' }}>
                                        Due: {new Date(po.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </td>
                            <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button className="btn-info btn-small" onClick={() => handleViewPODetails(po._id)}>View</button>
                                    {canSubmit(po) && <button className="btn-secondary btn-small" onClick={() => handleSubmitPO(po._id)}>Submit</button>}
                                    {canApprove(po) && <button className="btn-success btn-small" onClick={() => handleApprovePO(po._id)}>Approve</button>}
                                    {canOrder(po) && <button className="btn-primary btn-small" onClick={() => handleMarkAsOrdered(po._id)}>Order</button>}
                                    {canReceive(po) && <button className="btn-warning btn-small" onClick={() => handleOpenReceiveModal(po)}>Receive</button>}
                                    {canPay(po) && <button className="btn-success btn-small" onClick={() => handleOpenPaymentModal(po)}>Pay</button>}
                                    {canCancel(po) && <button className="btn-delete btn-small" onClick={() => {setSelectedPO(po); setShowCancelModal(true);}}>Cancel</button>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* --- Create PO Modal --- */}
            {showCreatePOModal && (
                <div className="modal-backdrop">
                    <div className="modal-content wide-modal">
                        <h3>Create New Purchase Order</h3>
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                        <form onSubmit={handleCreatePO}>
                            
                            {/* 1. SUPPLIER SELECTION */}
                            <div className="form-group">
                                <label>Supplier *</label>
                                <select 
                                    value={poFormData.supplier} 
                                    onChange={(e) => setPoFormData({...poFormData, supplier: e.target.value})}
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {Array.isArray(suppliers) && suppliers.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} {s.creditLimit > 0 ? `(Credit: ${s.availableCredit?.toLocaleString()})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. PAYMENT TERMS */}
                            <div className="form-group">
                                <label>Payment Terms</label>
                                <select 
                                    value={poFormData.paymentTerms} 
                                    onChange={(e) => setPoFormData({...poFormData, paymentTerms: e.target.value as any})}
                                >
                                    <option value="Cash on Delivery">Cash on Delivery</option>
                                    <option value="Credit 7 days">Credit 7 days</option>
                                    <option value="Credit 15 days">Credit 15 days</option>
                                    <option value="Credit 30 days">Credit 30 days</option>
                                    <option value="Credit 60 days">Credit 60 days</option>
                                    <option value="Credit 90 days">Credit 90 days</option>
                                </select>
                            </div>

                            {/* 3. ITEM SELECTION */}
                            <fieldset className="fieldset-items">
                                <legend>Add Items *</legend>
                                <div className="item-input-group">
                                    <select 
                                        value={itemProduct} 
                                        onChange={(e) => setItemProduct(e.target.value)}
                                        style={{ width: '45%' }}
                                    >
                                        <option value="">-- Product --</option>
                                        {Array.isArray(availableProducts) && availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} ({p.productCode}) - Stock: {p.totalStock}
                                            </option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Quantity" 
                                        value={itemQuantity} 
                                        onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                                        style={{ width: '15%' }}
                                        min="1"
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Unit Cost (Buying Price)" 
                                        value={itemCost} 
                                        onChange={(e) => setItemCost(Math.max(0, parseFloat(e.target.value) || 0))} 
                                        style={{ width: '20%' }}
                                        min="0"
                                        step="0.01"
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-success" 
                                        onClick={handleAddItem}
                                        style={{ width: '20%' }}
                                    >
                                        Add Item
                                    </button>
                                </div>
                                
                                {/* Current Items List */}
                                <div style={{ marginTop: '15px' }}>
                                    {poFormData.poItems.length === 0 ? (
                                        <p style={{ color: '#999', fontStyle: 'italic' }}>No items added yet</p>
                                    ) : (
                                        <table style={{ width: '100%', fontSize: '0.9em' }}>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Qty</th>
                                                    <th>Cost/Unit</th>
                                                    <th>Subtotal</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {poFormData.poItems.map((item, index) => {
                                                    const product = Array.isArray(availableProducts) 
                                                        ? availableProducts.find(p => p._id === item.product)
                                                        : null;
                                                    const subtotal = item.quantity * item.unitCost;
                                                    return (
                                                        <tr key={index}>
                                                            <td>{product?.name || 'Unknown Product'}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.unitCost.toLocaleString('en-RW')}</td>
                                                            <td>{subtotal.toLocaleString('en-RW')} RWF</td>
                                                            <td>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn-delete btn-xs"
                                                                    onClick={() => setPoFormData(prev => ({
                                                                        ...prev, 
                                                                        poItems: prev.poItems.filter((_, i) => i !== index)
                                                                    }))}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Cost:</td>
                                                    <td colSpan={2} style={{ fontWeight: 'bold' }}>
                                                        {poFormData.poItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toLocaleString('en-RW')} RWF
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>
                            </fieldset>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary" disabled={poFormData.poItems.length === 0}>
                                    Create PO (Draft)
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowCreatePOModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PO Detail Modal --- */}
            {showPODetailModal && selectedPO && (
                <div className="modal-backdrop">
                    <div className="modal-content wide-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>PO Details: {selectedPO.poNumber}</h3>
                            <button className="btn-secondary" onClick={() => setShowPODetailModal(false)}>Close</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <h4>Basic Information</h4>
                                <p><strong>Supplier:</strong> {(selectedPO.supplier as Supplier)?.name || 'N/A'}</p>
                                <p><strong>Manager:</strong> {selectedPO.managerName}</p>
                                <p><strong>Status:</strong> <span className={getStatusClass(selectedPO.status)}>{selectedPO.status}</span></p>
                            </div>
                            <div>
                                <h4>Financial Information</h4>
                                <p><strong>Total Cost:</strong> {selectedPO.grandTotal?.toLocaleString('en-RW')} RWF</p>
                                <p><strong>Balance Due:</strong> {selectedPO.balanceDue?.toLocaleString('en-RW')} RWF</p>
                            </div>
                        </div>

                        <h4>Items</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Ordered</th>
                                    <th>Received</th>
                                    <th>Unit Cost</th>
                                    <th>Subtotal</th>
                                    <th>Batches</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPO.poItems.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.quantityReceived || 0}</td>
                                        <td>{item.unitCost?.toLocaleString('en-RW')}</td>
                                        <td>{item.subtotal?.toLocaleString('en-RW')} RWF</td>
                                        <td>
                                            {item.batchNumbers?.length > 0 ? (
                                                <div style={{ fontSize: '0.8em' }}>
                                                    {item.batchNumbers.map((batch: string, i: number) => (
                                                        <div key={i} title={`Received: ${new Date(item.receivedDates?.[i]).toLocaleDateString()}`}>
                                                            {batch}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : 'None'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="modal-actions">
                            {canReceive(selectedPO) && (
                                <button className="btn-warning" onClick={() => {setShowPODetailModal(false); handleOpenReceiveModal(selectedPO);}}>
                                    Receive Items
                                </button>
                            )}
                            {canPay(selectedPO) && (
                                <button className="btn-success" onClick={() => {setShowPODetailModal(false); handleOpenPaymentModal(selectedPO);}}>
                                    Make Payment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Receive Modal --- */}
            {showReceiveModal && selectedPO && (
                <div className="modal-backdrop">
                    <div className="modal-content wide-modal">
                        <h3>Receive Items from PO: {selectedPO.poNumber}</h3>
                        
                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea 
                                value={receiveNotes}
                                onChange={(e) => setReceiveNotes(e.target.value)}
                                rows={3}
                                placeholder="Enter any notes about this receipt..."
                            />
                        </div>

                        <h4>Items to Receive</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Ordered</th>
                                    <th>Remaining</th>
                                    <th>Quantity to Receive</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPO.poItems.map((item: any, index: number) => {
                                    const receivedItem = receivedItems.find(ri => ri.poItemId === item._id);
                                    const remaining = item.quantity - (item.quantityReceived || 0);
                                    return (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{remaining}</td>
                                            <td>
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    value={receivedItem?.quantity || 0}
                                                    onChange={(e) => {
                                                        const newQty = Math.max(0, Math.min(remaining, parseInt(e.target.value) || 0));
                                                        setReceivedItems(prev => 
                                                            prev.map(ri => 
                                                                ri.poItemId === item._id 
                                                                    ? { ...ri, quantity: newQty }
                                                                    : ri
                                                            )
                                                        );
                                                    }}
                                                    style={{ width: '100px' }}
                                                    disabled={remaining === 0}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={handleReceivePO}>
                                Receive Selected Items
                            </button>
                            <button className="btn-secondary" onClick={() => setShowReceiveModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Payment Modal --- */}
            {showPaymentModal && selectedPO && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Make Payment for PO: {selectedPO.poNumber}</h3>
                        
                        <div className="form-group">
                            <label>Payment Amount *</label>
                            <input 
                                type="number"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                                min="0.01"
                                max={selectedPO.balanceDue || 0}
                                step="0.01"
                                required
                            />
                            <small>Balance Due: {selectedPO.balanceDue?.toLocaleString('en-RW')} RWF</small>
                        </div>

                        <div className="form-group">
                            <label>Payment Method *</label>
                            <select 
                                value={paymentData.paymentMethod}
                                onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value as any})}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {paymentData.paymentMethod === 'Bank Transfer' && (
                            <div className="form-group">
                                <label>Reference Number</label>
                                <input 
                                    type="text"
                                    value={paymentData.referenceNumber || ''}
                                    onChange={(e) => setPaymentData({...paymentData, referenceNumber: e.target.value})}
                                    placeholder="e.g., TRX123456"
                                />
                            </div>
                        )}

                        {paymentData.paymentMethod === 'Mobile Money' && (
                            <>
                                <div className="form-group">
                                    <label>Mobile Provider</label>
                                    <select 
                                        value={paymentData.mobileProvider || ''}
                                        onChange={(e) => setPaymentData({...paymentData, mobileProvider: e.target.value as any})}
                                    >
                                        <option value="">-- Select Provider --</option>
                                        <option value="M-Pesa">M-Pesa</option>
                                        <option value="Airtel Money">Airtel Money</option>
                                        <option value="Tigo Pesa">Tigo Pesa</option>
                                        <option value="Halopesa">Halopesa</option>
                                        <option value="Ezy Pesa">Ezy Pesa</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input 
                                        type="text"
                                        value={paymentData.mobileNumber || ''}
                                        onChange={(e) => setPaymentData({...paymentData, mobileNumber: e.target.value})}
                                        placeholder="e.g., 0712345678"
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea 
                                value={paymentData.notes || ''}
                                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                                rows={2}
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-success" onClick={handleAddPayment}>
                                Record Payment
                            </button>
                            <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Cancel Modal --- */}
            {showCancelModal && selectedPO && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Cancel PO: {selectedPO.poNumber}</h3>
                        
                        <div className="form-group">
                            <label>Cancellation Reason *</label>
                            <textarea 
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                placeholder="Please provide a reason for cancellation..."
                                required
                            />
                        </div>

                        <div className="warning-box" style={{ background: '#fff3cd', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                            ⚠️ <strong>Warning:</strong> This action cannot be undone. Any received stock will need to be returned separately.
                        </div>

                        <div className="modal-actions">
                            <button className="btn-delete" onClick={handleCancelPO} disabled={!cancelReason.trim()}>
                                Confirm Cancellation
                            </button>
                            <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PurchaseOrders;