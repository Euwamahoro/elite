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
import ProcessProductionModal from '../components/Production/ProcessProductionModal';
import '../styles/Global.css';
import '../styles/proucts.css'; 

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
            setStockForm({ poId: '', unitCost: 0, quantity: 1, unitPrice: undefined, expiryDate: '', notes: '' });
            fetchBatches();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add stock.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' });
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
                {/* Batch Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Stock Batches
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{productName}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
                            <select
                                value={batchStatusFilter}
                                onChange={(e) => setBatchStatusFilter(e.target.value)}
                                style={{
                                    padding: '7px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    background: 'var(--background)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="active">Active Batches</option>
                                <option value="all">All Batches</option>
                                <option value="expired">Expired Batches</option>
                                <option value="inactive">Inactive Batches</option>
                            </select>
                            <button className="prod-btn prod-btn--success" onClick={() => setShowAddStockModal(true)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                Add Stock
                            </button>
                        </div>
                    </div>
                    <button className="prod-btn prod-btn--ghost" onClick={onClose}>Close</button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading batches…</p>
                ) : batches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                        <p style={{ margin: 0, fontSize: '14px' }}>No batches found for this product.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <table className="prod-table">
                            <thead>
                                <tr>
                                    <th>Batch #</th>
                                    <th>Qty</th>
                                    <th>Unit Cost</th>
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
                                                <code className="prod-code">{batch.batchNumber}</code>
                                                {batch.poId && (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        PO: {batch.poId.slice(-6)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: batch.quantity < 10 ? '#A32D2D' : 'var(--text-primary)' }}>
                                                    {batch.quantity}
                                                </span>
                                            </td>
                                            <td>{batch.unitCost?.toLocaleString('en-RW')} RWF</td>
                                            <td>{formatDate(batch.dateAcquired)}</td>
                                            <td>{batch.expiryDate ? formatDate(batch.expiryDate) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>
                                                {daysLeft !== null && (
                                                    <span className={`prod-badge ${isExpired ? 'prod-badge--danger' : daysLeft <= 30 ? 'prod-badge--warning' : 'prod-badge--success'}`}>
                                                        {isExpired ? 'Expired' : `${daysLeft}d`}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`prod-badge ${batch.isActive ? 'prod-badge--success' : 'prod-badge--danger'}`}>
                                                    {batch.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '160px' }}>
                                                {batch.notes || <span style={{ color: 'var(--text-muted)' }}>—</span>}
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
                            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Add Stock — {productName}</h3>
                            <form onSubmit={handleAddStock}>
                                <div className="form-group">
                                    <label>PO ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                    <input type="text" value={stockForm.poId} onChange={(e) => setStockForm({...stockForm, poId: e.target.value})} placeholder="Enter PO ID if applicable" />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Leave blank for non-PO stock</small>
                                </div>
                                <div className="form-group">
                                    <label>Unit Cost (RWF) <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input type="number" value={stockForm.unitCost || ''} onChange={(e) => setStockForm({...stockForm, unitCost: parseFloat(e.target.value) || 0})} min="0.01" step="0.01" required />
                                </div>
                                <div className="form-group">
                                    <label>Quantity <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input type="number" value={stockForm.quantity || ''} onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 1})} min="1" required />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                    <input type="date" value={stockForm.expiryDate || ''} onChange={(e) => setStockForm({...stockForm, expiryDate: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                    <textarea value={stockForm.notes || ''} onChange={(e) => setStockForm({...stockForm, notes: e.target.value})} rows={2} placeholder="Any notes about this stock…" />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="prod-btn prod-btn--primary">Add Stock</button>
                                    <button type="button" className="prod-btn prod-btn--ghost" onClick={() => setShowAddStockModal(false)}>Cancel</button>
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
    minStockLevel: 0,
    sellingPrice: 0
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
    const [showProcessModal, setShowProcessModal] = useState(false);
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
        // Only show finished products (productType === 'finished')
        const finishedProducts = productsRes.data.filter(p => p.productType === 'finished');
        setProducts(finishedProducts);
        setCategories(categoriesRes.data);
        setError(null);
    } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch initial data.');
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchProductsAndCategories();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = async (product: Product) => {
        try {
            const response = await getProductById(product._id);
            const fullProduct = response.data;
            setEditingProduct(fullProduct);
            setFormData({
                category: fullProduct.category._id,
                name: fullProduct.name,
                description: fullProduct.description || '',
                unitOfMeasure: fullProduct.unitOfMeasure,
                minStockLevel: fullProduct.minStockLevel || 0,
                productCode: fullProduct.productCode || '',
                sellingPrice: fullProduct.sellingPrice || 0
            });
            setShowModal(true);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch product details.');
        }
    };

    const handleViewBatches = (product: Product) => {
        setSelectedProductForBatches({ id: product._id, name: product.name });
        setShowBatchModal(true);
    };

    const handleProcessProduction = () => {
        setShowProcessModal(true);
    };

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
        if (!isBoss) { alert("Only the Boss is authorized to delete products."); return; }
        if (!window.confirm(`Are you sure you want to delete product: ${name}? This action is permanent.`)) return;
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

    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (editingProduct) {
                await updateProduct(editingProduct._id, formData);
                setSuccess('Product updated successfully!');
            } else {
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

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData(initialFormData);
        setEditingProduct(null);
    };

    if (loading) return <Layout pageTitle="Product Inventory"><div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading Products…</div></Layout>;

    return (
        <Layout pageTitle="Product Inventory">
            <div style={{ padding: '28px 30px', maxWidth: '1600px', margin: '0 auto' }}>

                {/* ── Page Header ─────────────────────────────────── */}
                <div className="prod-page-header">
                    <div>
                        <h1 className="prod-page-title">
                            Product Inventory
                            <span className="prod-count-badge">{filteredProducts.length}</span>
                        </h1>
                        <p className="prod-page-sub">Manage your products, stock levels and batches</p>
                        {/* Search */}
                        <div className="prod-search-wrap">
                            <svg className="prod-search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path d="M6.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM13 13l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                className="prod-search"
                                placeholder="Search by name, code or category…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <button className="prod-btn prod-btn--ghost" onClick={() => setShowCategoryModal(true)}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            Add Category
                        </button>
                        <button className="prod-btn prod-btn--primary" onClick={() => setShowModal(true)}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                            New Product
                        </button>
                        <button 
                            className="prod-btn prod-btn--primary" 
                            onClick={handleProcessProduction} 
                            style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}
                        >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M1 6.5h11M6.5 1v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            Process Production
                        </button>
                    </div>
                </div>

                {/* ── Alerts ──────────────────────────────────────── */}
                {error   && <div className="prod-alert prod-alert--error">{error}</div>}
                {success && <div className="prod-alert prod-alert--success">{success}</div>}

                {/* ── Table ───────────────────────────────────────── */}
                <div className="prod-table-wrap">
                    <table className="prod-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Category</th>
                                <th>Total Stock</th>
                                <th>Selling Price</th>
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
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
                                        {product.description && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {product.description.length > 55
                                                    ? `${product.description.substring(0, 55)}…`
                                                    : product.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <code className="prod-code">{product.productCode || '—'}</code>
                                    </td>
                                    <td>
                                        <span className="prod-category-pill">{product.category.name}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: product.isLowStock ? '#A32D2D' : 'var(--text-primary)' }}>
                                            {product.totalStock}
                                        </span>
                                        {product.isLowStock && (
                                            <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L1 9.5h9L5.5 1z" stroke="#A32D2D" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5.5 4.5v2M5.5 8h.01" stroke="#A32D2D" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                                Low Stock
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{(product.sellingPrice ?? 0).toLocaleString('en-RW')} RWF</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{product.unitOfMeasure}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{product.minStockLevel || 0}</td>
                                    <td>
                                        <span className={`prod-badge ${product.isLowStock ? 'prod-badge--warning' : 'prod-badge--success'}`}>
                                            {product.isLowStock ? 'Low Stock' : 'OK'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="prod-actions">
                                            <button className="prod-btn prod-btn--info prod-btn--sm" onClick={() => handleViewBatches(product)}>
                                                Batches
                                            </button>
                                            <button className="prod-btn prod-btn--success prod-btn--sm" onClick={() => handleEdit(product)}>
                                                Edit
                                            </button>
                                            {/* Process button for all products - shows production modal */}
                                            <button 
                                                className="prod-btn prod-btn--primary prod-btn--sm" 
                                                onClick={handleProcessProduction}
                                                style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}
                                            >
                                                Process
                                            </button>
                                            {isBoss && (
                                                <button className="prod-btn prod-btn--danger prod-btn--sm" onClick={() => handleDelete(product._id, product.name)}>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                            {searchTerm
                                ? <><div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div><p style={{ margin: 0, fontSize: '14px' }}>No products matching "<strong>{searchTerm}</strong>"</p></>
                                : <><div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div><p style={{ margin: 0, fontSize: '14px' }}>No products yet. Add your first product.</p></>
                            }
                        </div>
                    )}
                </div>

                {/* ── Product Modal (Add / Edit) ───────────────────── */}
                {showModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
                                {editingProduct ? 'Edit Product' : 'New Product'}
                            </h3>
                            <form onSubmit={handleSubmitProduct}>
                                <div className="form-group">
                                    <label>Category <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <select name="category" value={formData.category} onChange={handleFormChange} required>
                                        <option value="">— Select Category —</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Product Name <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Standard Selling Price (RWF) <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input type="number" name="sellingPrice" value={formData.sellingPrice || ''} onChange={handleFormChange} min="0" required placeholder="e.g. 500" />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Used when selling from any batch.</small>
                                </div>
                                <div className="form-group">
                                    <label>Product Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                    <input type="text" name="productCode" value={formData.productCode || ''} onChange={handleFormChange} placeholder="Auto-generated if empty" />
                                </div>
                                <div className="form-group">
                                    <label>Unit of Measure <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input type="text" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleFormChange} required placeholder="e.g. kg, sack, piece" />
                                </div>
                                <div className="form-group">
                                    <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} placeholder="Product description…" />
                                </div>
                                <div className="form-group">
                                    <label>Minimum Stock Level</label>
                                    <input type="number" name="minStockLevel" value={formData.minStockLevel || 0} onChange={handleFormChange} min="0" step="1" />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Alert when stock falls below this level.</small>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="prod-btn prod-btn--primary">
                                        {editingProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                    <button type="button" className="prod-btn prod-btn--ghost" onClick={handleCloseModal}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Category Modal ───────────────────────────────── */}
                {showCategoryModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>New Category</h3>
                            <form onSubmit={handleCreateCategory}>
                                <div className="form-group">
                                    <label>Category Name <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        required
                                        placeholder="e.g. Cement, Tools, Safety Gear"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="prod-btn prod-btn--primary">Create Category</button>
                                    <button type="button" className="prod-btn prod-btn--ghost" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Batch Modal ──────────────────────────────────── */}
                {showBatchModal && selectedProductForBatches && (
                    <BatchModal
                        productId={selectedProductForBatches.id}
                        productName={selectedProductForBatches.name}
                        onClose={() => { setShowBatchModal(false); setSelectedProductForBatches(null); }}
                    />
                )}

                {/* ── Process Production Modal ──────────────────────── */}
                {showProcessModal && (
                    <ProcessProductionModal
                        onClose={() => setShowProcessModal(false)}
                        onSuccess={() => {
                            fetchProductsAndCategories();
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Products;