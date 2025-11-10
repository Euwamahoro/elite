// src/pages/PurchaseOrders.tsx - FINAL PO IMPLEMENTATION WITH DYNAMIC SUPPLIER/ITEM CREATION
import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
// Import all necessary functions and the base 'api' instance
import { getPOs, receivePO, getSuppliers, createPO, getProducts, createSupplier } from '../api/apiService'; 
import { Supplier, Product } from '../types/models'; 
import '../styles/Global.css'; 

// --- PO ITEM SUB-COMPONENT ---
interface POItemForm {
    product: string; // Product ID
    quantity: number;
    unitCost: number;
}

const initialPOFormData = {
    supplier: '', // Supplier ID or new supplier name string
    isNewSupplier: false, // Flag for UI
    poNumber: '',
    items: [] as POItemForm[],
};

const PurchaseOrders: React.FC = () => {
    const [pos, setPos] = useState<any[]>([]); 
    const [suppliers, setSuppliers] = useState<Supplier[]>([]); 
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]); // New state
    const [loading, setLoading] = useState(true);
    const [showCreatePOModal, setShowCreatePOModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [poFormData, setPoFormData] = useState(initialPOFormData);
    
    // States for adding a single item
    const [itemProduct, setItemProduct] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemCost, setItemCost] = useState(0);

    const fetchAllData = async () => {
        try {
            const [poRes, supplierRes, productRes] = await Promise.all([
                getPOs(),
                getSuppliers(),
                getProducts(),
            ]);
            setPos(poRes.data);
            setSuppliers(supplierRes.data);
            setAvailableProducts(productRes.data);
            setError(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch initial data.');
            console.error(error);
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
            alert('Please select product, quantity, and cost.');
            return;
        }
        
        const newItem: POItemForm = {
            product: itemProduct,
            quantity: itemQuantity,
            unitCost: itemCost,
        };

        setPoFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Reset item fields
        setItemProduct('');
        setItemQuantity(1);
        setItemCost(0);
    };

    // --- Core PO Submission Logic ---
    const handleCreatePO = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!poFormData.supplier || !poFormData.poNumber || poFormData.items.length === 0) {
            setError('Missing Supplier, PO Number, or Items.');
            return;
        }

        let finalSupplierId = poFormData.supplier;
        
        try {
            // 1. DYNAMIC SUPPLIER CREATION/LOOKUP
            if (poFormData.isNewSupplier && poFormData.supplier) {
                const newSupplierRes = await createSupplier({ name: poFormData.supplier });
                finalSupplierId = newSupplierRes.data._id;
            }

            // 2. CREATE PO (Backend injects managerName)
            await createPO({
                supplier: finalSupplierId,
                poNumber: poFormData.poNumber,
                poItems: poFormData.items, // Send the fully-formed item array
            });
            
            alert('Purchase Order created successfully!');
            setShowCreatePOModal(false);
            setPoFormData(initialPOFormData);
            fetchAllData(); // Refresh all lists
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create Purchase Order.');
        }
    };

    // --- Po Receive Logic ---
    const handleReceivePO = async (id: string, poNumber: string) => {
        if (!window.confirm(`Confirm receipt of PO ${poNumber}? This will increase stock.`)) {
            return;
        }
        try {
            await receivePO(id); 
            alert(`PO ${poNumber} received and stock updated successfully!`);
            fetchAllData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to receive PO.');
        }
    };

    const getStatusClass = (status: string) => {
        if (status === 'Received') return 'status-cleared';
        if (status === 'Cancelled') return 'status-pending';
        return 'status-partial';
    };

    if (loading) return <Layout pageTitle="Purchase Orders"><div>Loading POs...</div></Layout>;

    return (
        <Layout pageTitle="Purchase Orders (Stock Inflow)">
            <div className="page-header">
                <h2>Purchase Orders ({pos.length})</h2>
                <button className="btn-success" onClick={() => {setShowCreatePOModal(true); setError(null);}}>Create New PO</button>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>PO #</th>
                        <th>Supplier</th>
                        <th>Manager</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                        <th>Date Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pos.map((p) => (
                        <tr key={p._id}>
                            <td>{p.poNumber}</td>
                            <td>{p.supplier?.name || 'N/A'}</td>
                            <td>{p.managerName}</td>
                            <td>{p.totalCost?.toLocaleString('en-RW')} RWF</td>
                            <td><span className={getStatusClass(p.status)}>{p.status}</span></td>
                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td>
                                {p.status === 'Pending' && (
                                    <button 
                                        className="btn-primary btn-small"
                                        onClick={() => handleReceivePO(p._id, p.poNumber)}
                                    >
                                        Receive Stock
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* --- Create PO Modal --- */}
            {showCreatePOModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Create New Purchase Order</h3>
                        {error && <p className="error-message">{error}</p>}
                        <form onSubmit={handleCreatePO}>
                            
                            {/* 1. SUPPLIER SELECTION/CREATION */}
                            <div className="form-group">
                                <label>Supplier</label>
                                <select 
                                    value={poFormData.isNewSupplier ? 'new' : poFormData.supplier} 
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPoFormData({...poFormData, supplier: value === 'new' ? '' : value, isNewSupplier: value === 'new'});
                                    }}
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    <option value="new">-- Add New Supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {poFormData.isNewSupplier && (
                                <div className="form-group">
                                    <label>New Supplier Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter New Supplier Name"
                                        value={poFormData.supplier}
                                        onChange={(e) => setPoFormData({...poFormData, supplier: e.target.value})}
                                        required 
                                    />
                                </div>
                            )}

                            {/* 2. PO NUMBER */}
                            <div className="form-group">
                                <label>PO Number (e.g., PO-001)</label>
                                <input 
                                    type="text" 
                                    value={poFormData.poNumber}
                                    onChange={(e) => setPoFormData({...poFormData, poNumber: e.target.value})}
                                    required 
                                />
                            </div>

                            {/* 3. ITEM SELECTION (Dynamic) */}
                            <fieldset className="fieldset-items">
                                <legend>Add Items (Cost/Qty)</legend>
                                <div className="item-input-group" style={{ marginBottom: '15px' }}>
                                    <select value={itemProduct} onChange={(e) => setItemProduct(e.target.value)} style={{ width: '40%' }}>
                                        <option value="">-- Select Product --</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} ({p.unitOfMeasure})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="text" // Using text to allow free typing
                                        placeholder="Quantity" 
                                        value={itemQuantity} 
                                        onChange={(e) => setItemQuantity(parseInt(e.target.value.replace(/,/g, '')) || 0)} 
                                        style={{ width: '25%' }}
                                    />
                                    <input 
                                        type="text" // Using text to allow free typing
                                        placeholder="Unit Cost (RWF)" 
                                        value={itemCost} 
                                        onChange={(e) => setItemCost(parseFloat(e.target.value.replace(/,/g, '')) || 0)} 
                                        style={{ width: '25%' }}
                                    />
                                    <button type="button" className="btn-success" onClick={handleAddItem} disabled={!itemProduct || itemQuantity <= 0 || itemCost <= 0}>Add</button>
                                </div>
                                
                                {/* Current Items List */}
                                <ul style={{ listStyle: 'none' }}>
                                    {poFormData.items.map((item, index) => {
                                        const product = availableProducts.find(p => p._id === item.product);
                                        const subtotal = item.quantity * item.unitCost;
                                        return (
                                            <li key={index} className="item-tag" style={{ justifyContent: 'space-between' }}>
                                                <span>{item.quantity} x {product?.name} @ {item.unitCost.toLocaleString('en-RW')} RWF</span>
                                                <span style={{ fontWeight: 'bold' }}>Total: {subtotal.toLocaleString('en-RW')} RWF</span>
                                                <button type="button" className="btn-delete btn-xs" onClick={() => setPoFormData(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}))}>X</button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                                    Grand Total Cost: {(poFormData.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)).toLocaleString('en-RW')} RWF
                                </p>
                            </fieldset>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary" disabled={poFormData.items.length === 0}>Submit PO</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowCreatePOModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PurchaseOrders;