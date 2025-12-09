// src/pages/Orders.tsx - UPDATED
import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { getOrders, createOrder, getProducts } from '../api/apiService';
import { Order, OrderFormData, Product} from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectIsBoss, selectUser } from '../store/authSlice';
import '../styles/Global.css'; 

const initialFormData: OrderFormData = {
    customerName: '',
    amountPaid: 0,
    orderItems: [],
};

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<OrderFormData>(initialFormData);
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
            setAvailableProducts(productsRes.data);
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
                // UPDATED: Use the master sellingPrice
                const price = product.sellingPrice || 0;
                estimatedTotal += item.quantity * price;
            }
        }
        setTotalOrderValue(estimatedTotal);
        // Auto-fill amount paid to total (can be edited)
        setFormData(prev => ({ ...prev, amountPaid: estimatedTotal })); 
    }, [formData.orderItems, availableProducts]);

    // --- Order Submission ---
    const handleSubmitOrder = async (e: FormEvent) => {
        e.preventDefault();
        
        if (formData.orderItems.length === 0) {
            setError('Order must contain at least one item.');
            return;
        }

        try {
            await createOrder(formData);
            alert('Order created successfully and stock updated!');
            setShowModal(false);
            setFormData(initialFormData);
            fetchOrdersAndProducts(); 
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create order.');
            console.error(error);
        }
    };

    const getPaymentStatusClass = (status: string) => {
        if (status === 'Cleared') return 'status-cleared';
        if (status === 'Partial') return 'status-partial';
        return 'status-pending';
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
                                <span className={getPaymentStatusClass(order.paymentStatus)}>
                                    {order.paymentStatus}
                                </span>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td><button className="btn-secondary btn-small">View</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* --- Order Creation Modal --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Record New Sale</h3>
                        <form onSubmit={handleSubmitOrder}>
                            
                            <div className="form-group">
                                <label>Customer Name</label>
                                <input 
                                    type="text" 
                                    value={formData.customerName} 
                                    onChange={(e) => setFormData(prev => ({...prev, customerName: e.target.value}))} 
                                    required 
                                />
                            </div>

                            {/* --- Item Selection --- */}
                            <fieldset className="fieldset-items">
                                <legend>Add Items</legend>
                                <div className="item-input-group">
                                    <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required={formData.orderItems.length === 0}>
                                        <option value="">-- Select Product --</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id} disabled={p.totalStock === 0}>
                                                {/* UPDATED DISPLAY: Name - Stock - Selling Price */}
                                                {p.name} ({p.totalStock} {p.unitOfMeasure} @ {p.sellingPrice?.toLocaleString('en-RW') || 0} RWF)
                                            </option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        value={itemQuantity} 
                                        min="1"
                                        onChange={(e) => setItemQuantity(parseInt(e.target.value))} 
                                        style={{ width: '80px' }}
                                    />
                                    <button type="button" className="btn-success btn-small" onClick={handleAddItem} disabled={!selectedProductId || itemQuantity <= 0}>Add</button>
                                </div>

                                {/* Items List Display */}
                                <div className="item-list-display">
                                    {formData.orderItems.map((item, index) => {
                                        const product = getProductDetails(item.product);
                                        // UPDATED: use sellingPrice
                                        const price = product?.sellingPrice || 0;
                                        const subtotal = item.quantity * price;
                                        return (
                                            <div key={index} className="item-tag">
                                                <span>{item.quantity} x {product?.name}</span>
                                                <span>{subtotal.toLocaleString('en-RW')} RWF</span>
                                                <button type="button" className="btn-delete btn-xs" onClick={() => handleRemoveItem(index)}>X</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            {/* --- Financial Summary --- */}
                            <div className="financial-summary">
                                <p><strong>Estimated Total Value:</strong> {totalOrderValue.toLocaleString('en-RW')} RWF</p>
                            </div>

                            <div className="form-group">
                                <label>Amount Paid</label>
                                <input 
                                    type="text" 
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        amountPaid: parseFloat(e.target.value) || 0
                                    }))} 
                                    required 
                                />
                                {formData.amountPaid < totalOrderValue && (
                                    <p className="status-partial" style={{marginTop: '5px', padding: '5px'}}>
                                        BALANCE DUE: {(totalOrderValue - formData.amountPaid).toLocaleString('en-RW')} RWF
                                    </p>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary" disabled={formData.orderItems.length === 0}>Finalize Sale</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Orders;