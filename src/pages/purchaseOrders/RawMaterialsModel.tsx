// src/components/PurchaseOrders/RawMaterialsModal.tsx
import React, { useState, useEffect } from 'react';
import { createProduct, getProducts, getProductCategories } from '../../api/apiService';
import { Product, ProductCategory } from '../../types/models';

interface RawMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RawMaterialsModal: React.FC<RawMaterialsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [rawMaterials, setRawMaterials] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    const [newRawMaterial, setNewRawMaterial] = useState({
        name: '',
        unitOfMeasure: 'kg',
        description: ''
    });

    // Helper function to check if a product is a raw material
    const isRawMaterial = (product: Product): boolean => {
        const finishedKeywords = ['flour', 'bran', 'meal', 'processed', 'packaged'];
        
        const productNameLower = product.name.toLowerCase();
        const isFinished = finishedKeywords.some(keyword => productNameLower.includes(keyword));
        if (isFinished) return false;
        
        return !isFinished;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                getProducts(),
                getProductCategories()
            ]);
            
            const raw = productsRes.data.filter(p => isRawMaterial(p) || p.sellingPrice === 0);
            setRawMaterials(raw);
            setCategories(categoriesRes.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleCreateRawMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRawMaterial.name.trim()) {
            setError('Please enter raw material name');
            return;
        }

        // Find or use existing category
        let rawMaterialCategory = categories.find(c => c.name === 'RAW MATERIALS');
        if (!rawMaterialCategory && categories.length > 0) {
            rawMaterialCategory = categories[0];
        }
        
        if (!rawMaterialCategory) {
            setError('Please create a category first in Products page');
            return;
        }

        setIsCreating(true);
        setError(null);
        
        try {
            await createProduct({
                name: newRawMaterial.name.toUpperCase(),
                category: rawMaterialCategory._id,
                unitOfMeasure: newRawMaterial.unitOfMeasure,
                sellingPrice: 0,
                minStockLevel: 0,
                description: newRawMaterial.description
            } as any);
            
            setSuccess(`Raw material "${newRawMaterial.name}" created successfully!`);
            setNewRawMaterial({ name: '', unitOfMeasure: 'kg', description: '' });
            
            // Refresh the list
            await fetchData();
            onSuccess();
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create raw material');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>🌾 Raw Materials</h3>
                    <button className="btn-secondary" onClick={onClose} style={{ padding: '4px 12px' }}>✕</button>
                </div>
                
                {error && (
                    <div className="error-message" style={{ marginBottom: '15px', padding: '8px', background: '#fee', color: '#c00', borderRadius: '5px' }}>
                        ❌ {error}
                    </div>
                )}
                
                {success && (
                    <div className="success-message" style={{ marginBottom: '15px', padding: '8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '5px' }}>
                        ✅ {success}
                    </div>
                )}
                
                {/* List existing raw materials */}
                <div style={{ marginBottom: '20px' }}>
                    <h4>Existing Raw Materials</h4>
                    {loading ? (
                        <p>Loading...</p>
                    ) : rawMaterials.length === 0 ? (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>No raw materials yet. Create one below.</p>
                    ) : (
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Name</th>
                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Unit</th>
                                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawMaterials.map(mat => (
                                    <tr key={mat._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 0' }}><strong>{mat.name}</strong></td>
                                        <td style={{ padding: '8px 0' }}>{mat.unitOfMeasure}</td>
                                        <td style={{ padding: '8px 0' }}><code>{mat.productCode || '—'}</code></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <hr />
                
                {/* Create new raw material form */}
                <h4>Add New Raw Material</h4>
                <form onSubmit={handleCreateRawMaterial}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={newRawMaterial.name}
                            onChange={(e) => setNewRawMaterial({...newRawMaterial, name: e.target.value})}
                            placeholder="e.g., MAIZE, CASSAVA, WHEAT"
                            required
                            autoFocus
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Unit of Measure *</label>
                        <select 
                            value={newRawMaterial.unitOfMeasure}
                            onChange={(e) => setNewRawMaterial({...newRawMaterial, unitOfMeasure: e.target.value})}
                            required
                        >
                            <option value="kg">Kilogram (kg)</option>
                            <option value="ton">Ton (1000kg)</option>
                            <option value="sack">Sack</option>
                            <option value="bag">Bag</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea
                            value={newRawMaterial.description}
                            onChange={(e) => setNewRawMaterial({...newRawMaterial, description: e.target.value})}
                            rows={2}
                            placeholder="e.g., Raw cassava for flour production"
                        />
                    </div>
                    
                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button type="submit" className="btn-primary" disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Raw Material'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
                
                <div style={{ marginTop: '15px', padding: '10px', background: '#e8f4f8', borderRadius: '5px', fontSize: '12px' }}>
                    💡 <strong>Note:</strong> Raw materials are products with selling price = 0. 
                    They only appear in Purchase Orders, not in Sales.
                </div>
            </div>
        </div>
    );
};

export default RawMaterialsModal;