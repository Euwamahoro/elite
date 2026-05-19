// src/pages/Orders.tsx - UPDATED with View Details Modal
import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { getOrders, createOrder, getProducts } from '../api/apiService';
import { Order, OrderFormData, Product } from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectIsBoss, selectUser } from '../store/authSlice';
import '../styles/Global.css'; 

// Payment method options
type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque' | 'Credit';

const initialFormData: OrderFormData = {
    customerName: '',
    amountPaid: 0,
    orderItems: [],
};

// Extended form data with payment method
interface OrderFormDataWithPayment extends OrderFormData {
    paymentMethod: PaymentMethod;
    mobileNumber?: string;
    mobileProvider?: string;
    referenceNumber?: string;
    bankName?: string;
    chequeNumber?: string;
}

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [formData, setFormData] = useState<OrderFormDataWithPayment>({
        ...initialFormData,
        paymentMethod: 'Cash',
    });
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [itemQuantity, setItemQuantity] = useState<number>(1);
    const [totalOrderValue, setTotalOrderValue] = useState<number>(0);

    const isBoss = useAppSelector(selectIsBoss);
    const user = useAppSelector(selectUser);

    const fetchOrdersAndProducts = async () => {
        try {
            const [ordersRes, productsRes] = await Promise.all([
                getOrders(),
                getProducts(),
            ]);
            setOrders(ordersRes.data as Order[]);
            
            // Show ALL products that have stock (both raw and finished)
            const productsWithStock = productsRes.data.filter(p => p.totalStock > 0);
            setAvailableProducts(productsWithStock);
            
            setError(null);
        } catch (error: any) {
            const backendMessage = error.response?.data?.message || 'Failed to fetch data.';
            setError(backendMessage); 
            console.error("Error Data:", error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdersAndProducts();
    }, []);

    // --- Order Item Management Logic ---

    const getProductDetails = (id: string) => availableProducts.find(p => p._id === id);

    const handleAddItem = () => {
        const product = getProductDetails(selectedProductId);
        if (!product || itemQuantity <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }

        // Check stock availability
        if (itemQuantity > product.totalStock) {
            alert(`Insufficient stock. Available: ${product.totalStock} ${product.unitOfMeasure}.`);
            return;
        }

        const newItem = { 
            product: product._id, 
            quantity: itemQuantity,
            name: product.name
        };

        setFormData(prev => ({
            ...prev,
            orderItems: [...prev.orderItems, newItem]
        }));
        
        setSelectedProductId('');
        setItemQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            orderItems: prev.orderItems.filter((_, i) => i !== index)
        }));
    };

    // --- Price Calculation Effect ---
    useEffect(() => {
        let estimatedTotal = 0;
        for (const item of formData.orderItems) {
            const product = getProductDetails(item.product);
            if (product) {
                const price = product.sellingPrice || 0;
                estimatedTotal += item.quantity * price;
            }
        }
        setTotalOrderValue(estimatedTotal);
        setFormData(prev => ({ ...prev, amountPaid: estimatedTotal })); 
    }, [formData.orderItems, availableProducts]);

    // --- Order Submission ---
    const handleSubmitOrder = async (e: FormEvent) => {
        e.preventDefault();
        
        if (formData.orderItems.length === 0) {
            setError('Order must contain at least one item.');
            return;
        }

        if (formData.amountPaid > totalOrderValue) {
            setError('Amount paid cannot exceed total order value.');
            return;
        }

        // Validate payment method specific fields
        if (formData.paymentMethod === 'Mobile Money') {
            if (!formData.mobileNumber) {
                setError('Mobile number is required for Mobile Money payment.');
                return;
            }
            if (!formData.mobileProvider) {
                setError('Mobile provider is required for Mobile Money payment.');
                return;
            }
        }
        
        if (formData.paymentMethod === 'Bank Transfer' && !formData.referenceNumber) {
            setError('Reference number is required for Bank Transfer.');
            return;
        }
        
        if (formData.paymentMethod === 'Cheque' && !formData.chequeNumber) {
            setError('Cheque number is required for Cheque payment.');
            return;
        }

        try {
            const orderData = {
                ...formData,
                paymentDetails: {
                    method: formData.paymentMethod,
                    mobileNumber: formData.mobileNumber,
                    mobileProvider: formData.mobileProvider,
                    referenceNumber: formData.referenceNumber,
                    bankName: formData.bankName,
                    chequeNumber: formData.chequeNumber,
                }
            };
            
            await createOrder(orderData as any);
            alert('Order created successfully and stock updated!');
            setShowModal(false);
            setFormData({ 
                ...initialFormData, 
                paymentMethod: 'Cash',
                amountPaid: 0,
                orderItems: []
            });
            fetchOrdersAndProducts(); 
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create order.');
            console.error(error);
        }
    };

    // --- View Order Details ---
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const getPaymentStatusClass = (status: string) => {
        if (status === 'Cleared') return 'status-cleared';
        if (status === 'Partial') return 'status-partial';
        return 'status-pending';
    };

    const getPaymentMethodIcon = (method: string) => {
        switch(method) {
            case 'Cash': return '💵';
            case 'Mobile Money': return '📱';
            case 'Bank Transfer': return '🏦';
            case 'Cheque': return '📝';
            case 'Credit': return '💳';
            default: return '💰';
        }
    };

    if (loading) return <Layout pageTitle="Sales Orders"><div>Loading Orders...</div></Layout>;

    return (
        <Layout pageTitle="Sales Orders">
            <div className="page-header">
                <h2>{isBoss ? 'All Sales Orders' : `${user?.name}'s Sales Orders`} ({orders.length})</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>Record New Sale</button>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Manager</th>
                        <th>Total Value</th>
                        <th>Paid</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order._id}>
                            <td>{order._id.substring(18)}</td>
                            <td>{order.customerName}</td>
                            <td>{order.managerName}</td>
                            <td>{order.totalAmount?.toLocaleString('en-RW')} RWF</td>
                            <td>{order.amountPaid?.toLocaleString('en-RW')} RWF</td>
                            <td>
                                <span>
                                    {getPaymentMethodIcon((order as any).paymentMethod || 'Cash')} {(order as any).paymentMethod || 'Cash'}
                                </span>
                            </td>
                            <td>
                                <span className={getPaymentStatusClass(order.paymentStatus)}>
                                    {order.paymentStatus}
                                </span>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button 
                                    className="btn-info btn-small" 
                                    onClick={() => handleViewOrder(order)}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* --- Order Creation Modal --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3>Record New Sale</h3>
                        <form onSubmit={handleSubmitOrder}>
                            
                            <div className="form-group">
                                <label>Customer Name *</label>
                                <input 
                                    type="text" 
                                    value={formData.customerName} 
                                    onChange={(e) => setFormData(prev => ({...prev, customerName: e.target.value}))} 
                                    required 
                                />
                            </div>

                            {/* --- Payment Method Selection --- */}
                            <div className="form-group">
                                <label>Payment Method *</label>
                                <select 
                                    value={formData.paymentMethod} 
                                    onChange={(e) => setFormData(prev => ({...prev, paymentMethod: e.target.value as PaymentMethod}))}
                                    required
                                >
                                    <option value="Cash">💵 Cash</option>
                                    <option value="Mobile Money">📱 Mobile Money</option>
                                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                                    <option value="Cheque">📝 Cheque</option>
                                    <option value="Credit">💳 Credit (Invoice)</option>
                                </select>
                            </div>

                            {/* Mobile Money Details */}
                            {formData.paymentMethod === 'Mobile Money' && (
                                <>
                                    <div className="form-group">
                                        <label>Mobile Provider *</label>
                                        <select 
                                            value={formData.mobileProvider || ''} 
                                            onChange={(e) => setFormData(prev => ({...prev, mobileProvider: e.target.value}))}
                                            required
                                        >
                                            <option value="">-- Select Provider --</option>
                                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                                            <option value="Airtel Money">Airtel Money</option>
                                            <option value="Tigo Cash">Tigo Cash</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mobile Number *</label>
                                        <input 
                                            type="tel" 
                                            value={formData.mobileNumber || ''} 
                                            onChange={(e) => setFormData(prev => ({...prev, mobileNumber: e.target.value}))}
                                            placeholder="e.g., 0788XXXXXX"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Bank Transfer Details */}
                            {formData.paymentMethod === 'Bank Transfer' && (
                                <>
                                    <div className="form-group">
                                        <label>Bank Name</label>
                                        <input 
                                            type="text" 
                                            value={formData.bankName || ''} 
                                            onChange={(e) => setFormData(prev => ({...prev, bankName: e.target.value}))}
                                            placeholder="e.g., Bank of Kigali"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Reference Number *</label>
                                        <input 
                                            type="text" 
                                            value={formData.referenceNumber || ''} 
                                            onChange={(e) => setFormData(prev => ({...prev, referenceNumber: e.target.value}))}
                                            placeholder="Transaction Reference Number"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Cheque Details */}
                            {formData.paymentMethod === 'Cheque' && (
                                <div className="form-group">
                                    <label>Cheque Number *</label>
                                    <input 
                                        type="text" 
                                        value={formData.chequeNumber || ''} 
                                        onChange={(e) => setFormData(prev => ({...prev, chequeNumber: e.target.value}))}
                                        placeholder="Cheque Number"
                                        required
                                    />
                                </div>
                            )}

                            {/* --- Item Selection --- */}
                            <fieldset className="fieldset-items">
                                <legend>Add Items</legend>
                                <div className="item-input-group">
                                    <select 
                                        value={selectedProductId} 
                                        onChange={(e) => setSelectedProductId(e.target.value)} 
                                        required={formData.orderItems.length === 0}
                                        style={{ flex: 2 }}
                                    >
                                        <option value="">-- Select Product --</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} ({p.totalStock} {p.unitOfMeasure} @ {p.sellingPrice?.toLocaleString('en-RW') || 0} RWF)
                                            </option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        value={itemQuantity} 
                                        min="1"
                                        onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)} 
                                        style={{ width: '80px' }}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-success btn-small" 
                                        onClick={handleAddItem} 
                                        disabled={!selectedProductId || itemQuantity <= 0}
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Items List Display */}
                                {formData.orderItems.length > 0 && (
                                    <div className="item-list-display" style={{ marginTop: '15px' }}>
                                        <table style={{ width: '100%', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                    <th style={{ textAlign: 'left' }}>Product</th>
                                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                                    <th style={{ textAlign: 'right' }}>Price</th>
                                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                                    <th style={{ textAlign: 'center' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.orderItems.map((item, index) => {
                                                    const product = getProductDetails(item.product);
                                                    const price = product?.sellingPrice || 0;
                                                    const subtotal = item.quantity * price;
                                                    return (
                                                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={{ padding: '8px 0' }}>{product?.name}</td>
                                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.quantity}</td>
                                                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{price.toLocaleString('en-RW')} RWF</td>
                                                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{subtotal.toLocaleString('en-RW')} RWF</td>
                                                            <td style={{ textAlign: 'center', padding: '8px 0' }}>
                                                                <button type="button" className="btn-delete btn-xs" onClick={() => handleRemoveItem(index)}>X</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ borderTop: '2px solid #ddd' }}>
                                                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 0' }}>Total:</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 0' }}>{totalOrderValue.toLocaleString('en-RW')} RWF</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </fieldset>

                            {/* --- Financial Summary --- */}
                            <div className="form-group">
                                <label>Amount Paid</label>
                                <input 
                                    type="number" 
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        amountPaid: parseFloat(e.target.value) || 0
                                    }))} 
                                    min="0"
                                    max={totalOrderValue}
                                    step="100"
                                    required 
                                />
                                {formData.amountPaid < totalOrderValue && (
                                    <p className="status-partial" style={{marginTop: '5px', padding: '5px', background: '#fff3cd', borderRadius: '4px'}}>
                                        ⚠️ BALANCE DUE: {(totalOrderValue - formData.amountPaid).toLocaleString('en-RW')} RWF
                                    </p>
                                )}
                                {formData.amountPaid === totalOrderValue && totalOrderValue > 0 && (
                                    <p className="status-cleared" style={{marginTop: '5px', padding: '5px', background: '#d4edda', borderRadius: '4px'}}>
                                        ✅ FULLY PAID
                                    </p>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary" disabled={formData.orderItems.length === 0}>
                                    Finalize Sale
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Order Details Modal --- */}
            {showDetailModal && selectedOrder && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Order Details</h3>
                            <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                        </div>

                        {/* Order Summary */}
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <p><strong>Order ID:</strong> {selectedOrder._id.substring(18)}</p>
                                    <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                                    <p><strong>Manager:</strong> {selectedOrder.managerName}</p>
                                    <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p><strong>Total Amount:</strong> <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{selectedOrder.totalAmount?.toLocaleString('en-RW')} RWF</span></p>
                                    <p><strong>Amount Paid:</strong> {selectedOrder.amountPaid?.toLocaleString('en-RW')} RWF</p>
                                    <p><strong>Payment Method:</strong> {getPaymentMethodIcon((selectedOrder as any).paymentMethod || 'Cash')} {(selectedOrder as any).paymentMethod || 'Cash'}</p>
                                    <p><strong>Payment Status:</strong> 
                                        <span className={getPaymentStatusClass(selectedOrder.paymentStatus)}>
                                            {' '}{selectedOrder.paymentStatus}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            {/* Payment Details for non-Cash payments */}
                            {(selectedOrder as any).paymentDetails && (selectedOrder as any).paymentDetails.method !== 'Cash' && (
                                <div style={{ marginTop: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '5px' }}>
                                    <strong>Payment Details:</strong>
                                    {(selectedOrder as any).paymentDetails.mobileNumber && (
                                        <p>📱 Mobile: {(selectedOrder as any).paymentDetails.mobileProvider} {(selectedOrder as any).paymentDetails.mobileNumber}</p>
                                    )}
                                    {(selectedOrder as any).paymentDetails.referenceNumber && (
                                        <p>🏦 Ref: {(selectedOrder as any).paymentDetails.referenceNumber}</p>
                                    )}
                                    {(selectedOrder as any).paymentDetails.chequeNumber && (
                                        <p>📝 Cheque: {(selectedOrder as any).paymentDetails.chequeNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <h4>Items Sold</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.orderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{item.unitPrice?.toLocaleString('en-RW')} RWF</td>
                                            <td style={{ textAlign: 'right' }}>{(item.quantity * (item.unitPrice || 0)).toLocaleString('en-RW')} RWF</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid #ddd' }}>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{selectedOrder.totalAmount?.toLocaleString('en-RW')} RWF</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Balance Info if not fully paid */}
                        {selectedOrder.amountPaid < selectedOrder.totalAmount && (
                            <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px' }}>
                                ⚠️ <strong>Balance Due:</strong> {(selectedOrder.totalAmount - selectedOrder.amountPaid).toLocaleString('en-RW')} RWF
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Orders;