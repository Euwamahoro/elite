// src/pages/Products.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    getProducts, 
    deleteProduct, 
    getProductCategories,
    createProduct,
    createProductCategory,
    updateProduct // <-- ADD THIS IMPORT
} from '../api/apiService';
import { Product, ProductCategory, ProductFormData } from '../types/models';
import { useAppSelector } from '../store/hooks';
import { selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

const initialFormData: ProductFormData = {
    category: '',
    name: '',
    description: '',
    unitOfMeasure: '',
};

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // <-- NEW STATE

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
    
    // --- Edit Product Handler ---
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            category: product.category._id,
            name: product.name,
            description: (product as any).description || '',
            unitOfMeasure: product.unitOfMeasure
        });
        setShowModal(true);
    };

    // --- Category Submission Handler ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProductCategory({ name: newCategoryName }); 
            alert(`Category '${newCategoryName}' created successfully!`);
            setShowCategoryModal(false);
            setNewCategoryName('');
            fetchProductsAndCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create category.');
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
            alert(`Product ${name} deleted successfully!`);
            fetchProductsAndCategories(); 
        } catch (error: any) {
            alert(error.response?.data?.message || `Failed to delete product ${name}.`);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Updated: Handle both Create and Update ---
    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                // Update existing product
                await updateProduct(editingProduct._id, formData);
                alert('Product updated successfully!');
            } else {
                // Create new product
                await createProduct(formData);
                alert('Product created successfully!');
            }
            
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

    if (loading) return <Layout pageTitle="Product Inventory"><div>Loading Products...</div></Layout>;

    return (
        <Layout pageTitle="Product Inventory">
            <div className="page-header">
                <h2>All Products ({products.length})</h2>
                <div>
                    <button className="btn-secondary" onClick={() => setShowCategoryModal(true)}>+ Add Category</button>
                    <button className="btn-success" onClick={() => setShowModal(true)} style={{ marginLeft: '10px' }}>Add New Product</button>
                </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Total Stock</th>
                        <th>Current Price</th>
                        <th>UoM</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p._id}>
                            <td>{p.name}</td>
                            <td>{p.category.name}</td>
                            <td className={p.totalStock < 20 ? 'stock-low' : ''}>
                                {p.totalStock}
                            </td>
                            <td>{p.currentSellingPrice?.toLocaleString('en-RW') || 0} RWF</td>
                            <td>{p.unitOfMeasure}</td>
                            <td>
                                {/* FIXED: Added onClick handler */}
                                <button 
                                    className="btn-edit" 
                                    onClick={() => handleEdit(p)}
                                >
                                    Edit
                                </button>
                                {isBoss && ( 
                                    <button 
                                        className="btn-delete" 
                                        onClick={() => handleDelete(p._id, p.name)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- Product Modal (Add/Edit) --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        {/* DYNAMIC TITLE */}
                        <h3>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
                        <form onSubmit={handleSubmitProduct}>
                            
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleFormChange} required>
                                    <option value="">-- Select Category --</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Product Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Unit of Measure (e.g., kg, sack)</label>
                                <input 
                                    type="text" 
                                    name="unitOfMeasure" 
                                    value={formData.unitOfMeasure} 
                                    onChange={handleFormChange} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleFormChange} 
                                    rows={3}
                                ></textarea>
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
                                <label>Category Name</label>
                                <input 
                                    type="text" 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)} 
                                    required 
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
        </Layout>
    );
};

export default Products;