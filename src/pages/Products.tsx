// src/pages/Products.tsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    getProducts, 
    deleteProduct, 
    getProductCategories,
    createProduct,
    createProductCategory,
    updateProduct,
    getProductBatches,
    addStockLot,
    getProductById
} from '../api/apiService';
import { Product, ProductCategory, ProductFormData, StockLotFormData } from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

// --- Batch Modal Component ---
interface BatchModalProps {
    productId: string;
    productName: string;
    onClose: () => void;
}

const BatchModal: React.FC<BatchModalProps> = ({ productId, productName, onClose }) => {
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [stockForm, setStockForm] = useState<StockLotFormData>({
        poId: '',
        unitCost: 0,
        quantity: 1,
        unitPrice: undefined,
        expiryDate: '',
        notes: ''
    });
    const [batchStatusFilter, setBatchStatusFilter] = useState<string>('active');

    useEffect(() => {
        fetchBatches();
    }, [productId, batchStatusFilter]);

    const fetchBatches = async () => {
        try {
            const response = await getProductBatches(productId, batchStatusFilter);
            setBatches(response.data.batches || []);
        } catch (error: any) {
            console.error('Failed to fetch batches:', error.response?.data?.message || error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockForm.unitCost || stockForm.unitCost <= 0) {
            alert('Please enter a valid unit cost.');
            return;
        }
        if (!stockForm.quantity || stockForm.quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        try {
            await addStockLot(productId, stockForm);
            alert('Stock added successfully! Batch number generated automatically.');
            setShowAddStockModal(false);
            setStockForm({
                poId: '',
                unitCost: 0,
                quantity: 1,
                unitPrice: undefined,
                expiryDate: '',
                notes: ''
            });
            fetchBatches();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add stock.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-RW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content wide-modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3>Stock Batches: {productName}</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <select 
                                value={batchStatusFilter} 
                                onChange={(e) => setBatchStatusFilter(e.target.value)}
                                style={{ padding: '5px 10px', borderRadius: '4px' }}
                            >
                                <option value="active">Active Batches</option>
                                <option value="all">All Batches</option>
                                <option value="expired">Expired Batches</option>
                                <option value="inactive">Inactive Batches</option>
                            </select>
                            <button className="btn-success" onClick={() => setShowAddStockModal(true)}>
                                + Add Stock
                            </button>
                        </div>
                    </div>
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>

                {loading ? (
                    <p>Loading batches...</p>
                ) : batches.length === 0 ? (
                    <p>No batches found for this product.</p>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Batch Number</th>
                                    <th>Quantity</th>
                                    <th>Unit Cost</th>
                                    <th>Selling Price</th>
                                    <th>Date Acquired</th>
                                    <th>Expiry Date</th>
                                    <th>Days Left</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((batch, index) => {
                                    const daysLeft = batch.expiryDate ? calculateDaysUntilExpiry(batch.expiryDate) : null;
                                    const isExpired = daysLeft !== null && daysLeft < 0;
                                    
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <code style={{ fontSize: '0.85em' }}>{batch.batchNumber}</code>
                                                {batch.poId && (
                                                    <div style={{ fontSize: '0.75em', color: '#666' }}>
                                                        PO: {batch.poId.slice(-6)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={batch.quantity < 10 ? 'stock-low' : ''}>
                                                {batch.quantity}
                                            </td>
                                            <td>{batch.unitCost?.toLocaleString('en-RW')} RWF</td>
                                            <td>{batch.unitPrice?.toLocaleString('en-RW')} RWF</td>
                                            <td>{formatDate(batch.dateAcquired)}</td>
                                            <td>
                                                {batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}
                                            </td>
                                            <td>
                                                {daysLeft !== null && (
                                                    <span className={isExpired ? 'status-pending' : daysLeft <= 30 ? 'status-partial' : 'status-cleared'}>
                                                        {isExpired ? 'Expired' : `${daysLeft} days`}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={batch.isActive ? 'status-cleared' : 'status-pending'}>
                                                    {batch.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '200px', fontSize: '0.85em' }}>
                                                {batch.notes || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Stock Modal */}
                {showAddStockModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <h3>Add Stock to {productName}</h3>
                            <form onSubmit={handleAddStock}>
                                <div className="form-group">
                                    <label>PO ID (Optional)</label>
                                    <input 
                                        type="text"
                                        value={stockForm.poId}
                                        onChange={(e) => setStockForm({...stockForm, poId: e.target.value})}
                                        placeholder="Enter PO ID if applicable"
                                    />
                                    <small>Leave blank for non-PO stock</small>
                                </div>
                                <div className="form-group">
                                    <label>Unit Cost (RWF) *</label>
                                    <input 
                                        type="number"
                                        value={stockForm.unitCost || ''}
                                        onChange={(e) => setStockForm({...stockForm, unitCost: parseFloat(e.target.value) || 0})}
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input 
                                        type="number"
                                        value={stockForm.quantity || ''}
                                        onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 1})}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Selling Price (RWF) - Optional</label>
                                    <input 
                                        type="number"
                                        value={stockForm.unitPrice || ''}
                                        onChange={(e) => setStockForm({...stockForm, unitPrice: parseFloat(e.target.value) || undefined})}
                                        min="0"
                                        step="0.01"
                                        placeholder="Auto-calculated (30% markup) if empty"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={stockForm.expiryDate || ''}
                                        onChange={(e) => setStockForm({...stockForm, expiryDate: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea 
                                        value={stockForm.notes || ''}
                                        onChange={(e) => setStockForm({...stockForm, notes: e.target.value})}
                                        rows={2}
                                        placeholder="Any notes about this stock..."
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn-primary">
                                        Add Stock
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddStockModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Products Component ---
const initialFormData: ProductFormData = {
    category: '',
    name: '',
    description: '',
    unitOfMeasure: '',
    minStockLevel: 0
};

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedProductForBatches, setSelectedProductForBatches] = useState<{id: string, name: string} | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isBoss = useAppSelector(selectIsBoss);

    const fetchProductsAndCategories = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getProducts(),
                getProductCategories(),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
            setError(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch initial data.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductsAndCategories();
    }, []);
    
    // --- Filter products based on search ---
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Edit Product Handler ---
    const handleEdit = async (product: Product) => {
        try {
            // Fetch the full product details to get minStockLevel
            const response = await getProductById(product._id);
            const fullProduct = response.data;
            
            setEditingProduct(fullProduct);
            setFormData({
                category: fullProduct.category._id,
                name: fullProduct.name,
                description: fullProduct.description || '',
                unitOfMeasure: fullProduct.unitOfMeasure,
                minStockLevel: fullProduct.minStockLevel || 0,
                productCode: fullProduct.productCode || ''
            });
            setShowModal(true);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch product details.');
        }
    };

    // --- View Batches Handler ---
    const handleViewBatches = (product: Product) => {
        setSelectedProductForBatches({
            id: product._id,
            name: product.name
        });
        setShowBatchModal(true);
    };

    // --- Category Submission Handler ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProductCategory({ name: newCategoryName }); 
            setSuccess(`Category '${newCategoryName}' created successfully!`);
            setTimeout(() => setSuccess(null), 3000);
            setShowCategoryModal(false);
            setNewCategoryName('');
            fetchProductsAndCategories();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create category.');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!isBoss) {
            alert("Only the Boss is authorized to delete products.");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete product: ${name}? This action is permanent.`)) {
            return;
        }
        try {
            await deleteProduct(id);
            setSuccess(`Product ${name} deleted successfully!`);
            setTimeout(() => setSuccess(null), 3000);
            fetchProductsAndCategories(); 
        } catch (error: any) {
            setError(error.response?.data?.message || `Failed to delete product ${name}.`);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Updated: Handle both Create and Update ---
    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        try {
            if (editingProduct) {
                // Update existing product
                await updateProduct(editingProduct._id, formData);
                setSuccess('Product updated successfully!');
            } else {
                // Create new product
                await createProduct(formData);
                setSuccess('Product created successfully!');
            }
            
            setTimeout(() => setSuccess(null), 3000);
            setShowModal(false);
            setFormData(initialFormData);
            setEditingProduct(null);
            fetchProductsAndCategories();
        } catch (error: any) {
            setError(error.response?.data?.message || `Failed to ${editingProduct ? 'update' : 'create'} product.`);
        }
    };

    // --- Reset form when modal closes ---
    const handleCloseModal = () => {
        setShowModal(false);
        setFormData(initialFormData);
        setEditingProduct(null);
    };

    // --- Get stock status class ---
    const getStockStatusClass = (product: Product) => {
        if (product.totalStock === 0) return 'stock-out';
        if (product.isLowStock) return 'stock-low';
        return '';
    };

    if (loading) return <Layout pageTitle="Product Inventory"><div>Loading Products...</div></Layout>;

    return (
        <Layout pageTitle="Product Inventory">
            <div className="page-header">
                <div>
                    <h2>All Products ({filteredProducts.length})</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search products by name, code, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '400px', padding: '8px 12px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setShowCategoryModal(true)}>+ Add Category</button>
                    <button className="btn-success" onClick={() => setShowModal(true)}>Add New Product</button>
                </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Category</th>
                        <th>Total Stock</th>
                        <th>Current Price</th>
                        <th>UoM</th>
                        <th>Min Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product) => (
                        <tr key={product._id}>
                            <td>
                                <strong>{product.name}</strong>
                                {product.description && (
                                    <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                                        {product.description.length > 50 
                                            ? `${product.description.substring(0, 50)}...`
                                            : product.description
                                        }
                                    </div>
                                )}
                            </td>
                            <td>
                                <code style={{ background: '#f1f1f1', padding: '2px 6px', borderRadius: '3px' }}>
                                    {product.productCode || 'N/A'}
                                </code>
                            </td>
                            <td>{product.category.name}</td>
                            <td className={getStockStatusClass(product)}>
                                {product.totalStock}
                                {product.isLowStock && (
                                    <div style={{ fontSize: '0.75em', color: '#dc3545' }}>
                                        ⚠️ Low Stock
                                    </div>
                                )}
                            </td>
                            <td>{product.currentSellingPrice?.toLocaleString('en-RW') || 0} RWF</td>
                            <td>{product.unitOfMeasure}</td>
                            <td>{product.minStockLevel || 0}</td>
                            <td>
                                <span className={product.isLowStock ? 'status-partial' : 'status-cleared'}>
                                    {product.isLowStock ? 'Low Stock' : 'OK'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button 
                                        className="btn-info btn-small"
                                        onClick={() => handleViewBatches(product)}
                                    >
                                        View Batches
                                    </button>
                                    <button 
                                        className="btn-edit btn-small" 
                                        onClick={() => handleEdit(product)}
                                    >
                                        Edit
                                    </button>
                                    {isBoss && ( 
                                        <button 
                                            className="btn-delete btn-small" 
                                            onClick={() => handleDelete(product._id, product.name)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredProducts.length === 0 && searchTerm && (
                <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No products found matching "{searchTerm}"
                </p>
            )}

            {/* --- Product Modal (Add/Edit) --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        {/* DYNAMIC TITLE */}
                        <h3>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
                        <form onSubmit={handleSubmitProduct}>
                            
                            <div className="form-group">
                                <label>Category *</label>
                                <select name="category" value={formData.category} onChange={handleFormChange} required>
                                    <option value="">-- Select Category --</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Product Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Product Code (Optional)</label>
                                <input 
                                    type="text" 
                                    name="productCode" 
                                    value={formData.productCode || ''} 
                                    onChange={handleFormChange}
                                    placeholder="Auto-generated if empty"
                                />
                            </div>

                            <div className="form-group">
                                <label>Unit of Measure (e.g., kg, sack) *</label>
                                <input 
                                    type="text" 
                                    name="unitOfMeasure" 
                                    value={formData.unitOfMeasure} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleFormChange} 
                                    rows={3}
                                    placeholder="Product description..."
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Minimum Stock Level</label>
                                <input 
                                    type="number" 
                                    name="minStockLevel" 
                                    value={formData.minStockLevel || 0} 
                                    onChange={handleFormChange}
                                    min="0"
                                    step="1"
                                />
                                <small>Alerts when stock falls below this level</small>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Category Creation Modal --- */}
            {showCategoryModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Create New Category</h3>
                        <form onSubmit={handleCreateCategory}>
                            <div className="form-group">
                                <label>Category Name *</label>
                                <input 
                                    type="text" 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)} 
                                    required 
                                    placeholder="e.g., Cement, Tools, Safety Gear"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Create Category</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Batch Modal --- */}
            {showBatchModal && selectedProductForBatches && (
                <BatchModal 
                    productId={selectedProductForBatches.id}
                    productName={selectedProductForBatches.name}
                    onClose={() => { setShowBatchModal(false); setSelectedProductForBatches(null); }}
                />
            )}
        </Layout>
    );
};

export default Products;