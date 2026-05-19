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
    getProductById,
    addStockLot,
} from '../api/apiService';
import { Product, ProductCategory, ProductFormData } from '../types/models';
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
                                            <td>{batch.unitCost?.toLocaleString('en-RW')} RWF\n</td>
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
            </div>
        </div>
    );
};

// --- Simple Add Stock Modal for Other Products ---
interface SimpleAddStockModalProps {
    productId: string;
    productName: string;
    sellingPrice: number;
    onClose: () => void;
    onSuccess: () => void;
}

const SimpleAddStockModal: React.FC<SimpleAddStockModalProps> = ({ productId, productName, sellingPrice, onClose, onSuccess }) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [isAdding, setIsAdding] = useState(false);

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }

        setIsAdding(true);
        try {
            // Don't send poId for manual stock - only unitCost, quantity, unitPrice
            await addStockLot(productId, {
                unitCost: sellingPrice,
                quantity: quantity,
                unitPrice: sellingPrice,
                notes: `Manual stock addition for ${productName}`
            });
            alert(`Added ${quantity} units to ${productName}`);
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add stock.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Add Stock to {productName}</h3>
                <form onSubmit={handleAddStock}>
                    <div className="form-group">
                        <label>Quantity *</label>
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                            min="1" 
                            required 
                        />
                        <small>Selling price: {sellingPrice.toLocaleString('en-RW')} RWF per unit</small>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="prod-btn prod-btn--primary" disabled={isAdding}>
                            {isAdding ? 'Adding...' : 'Add Stock'}
                        </button>
                        <button type="button" className="prod-btn prod-btn--ghost" onClick={onClose}>Cancel</button>
                    </div>
                </form>
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
    const [rawMaterials, setRawMaterials] = useState<Product[]>([]);
    const [otherProducts, setOtherProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showSimpleAddStockModal, setShowSimpleAddStockModal] = useState(false);
    const [selectedProductForBatches, setSelectedProductForBatches] = useState<{id: string, name: string} | null>(null);
    const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'finished' | 'raw' | 'other'>('finished');

    const isBoss = useAppSelector(selectIsBoss);

    const fetchProductsAndCategories = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getProducts(),
                getProductCategories(),
            ]);
            
            const finished = productsRes.data.filter(p => p.productType === 'finished');
            const raw = productsRes.data.filter(p => p.productType === 'raw');
            const other = productsRes.data.filter(p => p.productType === 'other');
            
            setProducts(finished);
            setRawMaterials(raw);
            setOtherProducts(other);
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

    const getFilteredProducts = () => {
        const productList = activeTab === 'finished' ? products : activeTab === 'raw' ? rawMaterials : otherProducts;
        return productList.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filteredProducts = getFilteredProducts();

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
                sellingPrice: fullProduct.sellingPrice || 0,
                productType: fullProduct.productType || 'finished'
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

    const handleOpenSimpleAddStock = (product: Product) => {
        setSelectedProductForStock(product);
        setShowSimpleAddStockModal(true);
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

                {/* ── Tabs ───────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                    <button
                        onClick={() => setActiveTab('finished')}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'finished' ? '2px solid #4caf50' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'finished' ? 'bold' : 'normal',
                            color: activeTab === 'finished' ? '#4caf50' : '#666'
                        }}
                    >
                        🏭 Finished Products ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'raw' ? '2px solid #4caf50' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'raw' ? 'bold' : 'normal',
                            color: activeTab === 'raw' ? '#4caf50' : '#666'
                        }}
                    >
                        🌾 Raw Materials ({rawMaterials.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'other' ? '2px solid #ff9800' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'other' ? 'bold' : 'normal',
                            color: activeTab === 'other' ? '#ff9800' : '#666'
                        }}
                    >
                        📦 Other Products ({otherProducts.length})
                    </button>
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
                                    <td style={{ fontWeight: 500 }}>{(product.sellingPrice ?? 0).toLocaleString('en-RW')} RWF\n</td>
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
                                            {activeTab === 'finished' && (
                                                <button 
                                                    className="prod-btn prod-btn--primary prod-btn--sm" 
                                                    onClick={handleProcessProduction}
                                                    style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}
                                                >
                                                    Process
                                                </button>
                                            )}
                                            {activeTab === 'other' && (
                                                <button 
                                                    className="prod-btn prod-btn--primary prod-btn--sm" 
                                                    onClick={() => handleOpenSimpleAddStock(product)}
                                                    style={{ background: '#ff9800', borderColor: '#ff9800' }}
                                                >
                                                    Add Stock
                                                </button>
                                            )}
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
                                : activeTab === 'finished'
                                    ? <><div style={{ fontSize: '28px', marginBottom: '8px' }}>🏭</div><p style={{ margin: 0, fontSize: '14px' }}>No finished products yet. Create your first product.</p></>
                                    : activeTab === 'raw'
                                        ? <><div style={{ fontSize: '28px', marginBottom: '8px' }}>🌾</div><p style={{ margin: 0, fontSize: '14px' }}>No raw materials yet. Create raw materials in Purchase Orders page.</p></>
                                        : <><div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div><p style={{ margin: 0, fontSize: '14px' }}>No other products yet. Click "New Product" to add sacks, weighing service, etc.</p></>
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
                                    <label>Product Type <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <select name="productType" value={formData.productType || 'finished'} onChange={handleFormChange} required>
                                        <option value="finished">🏭 Finished Product (from production)</option>
                                        <option value="raw">🌾 Raw Material (purchased, can be sold or processed)</option>
                                        <option value="other">📦 Other Product (sacks, services, etc.)</option>
                                    </select>
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {formData.productType === 'raw' 
                                            ? 'Raw materials can be sold directly or processed into finished goods.'
                                            : formData.productType === 'other'
                                                ? 'Other products are items like sacks, weighing services, etc. Add stock manually.'
                                                : 'Finished products are created by processing raw materials.'}
                                    </small>
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

                {/* ── Simple Add Stock Modal (for Other Products) ──────── */}
                {showSimpleAddStockModal && selectedProductForStock && (
                    <SimpleAddStockModal
                        productId={selectedProductForStock._id}
                        productName={selectedProductForStock.name}
                        sellingPrice={selectedProductForStock.sellingPrice}
                        onClose={() => {
                            setShowSimpleAddStockModal(false);
                            setSelectedProductForStock(null);
                        }}
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