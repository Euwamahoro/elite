// src/components/Production/ProcessProductionModal.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    fetchAvailableRawMaterials,
    processProduction,
    clearProductionError,
    resetProduction
} from '../../store/productionSlice';
import { getProducts } from '../../api/apiService';
import { Product } from '../../types/models';

interface ProcessProductionModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const ProcessProductionModal: React.FC<ProcessProductionModalProps> = ({ onClose, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { availableBatches, isLoadingBatches, isProcessing, error, lastProduction } =
        useAppSelector((state) => state.production);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedRawStockId, setSelectedRawStockId] = useState('');
    const [selectedFinishedProduct, setSelectedFinishedProduct] = useState('');
    const [quantityToConsume, setQuantityToConsume] = useState<number>(0);
    const [quantityToProduce, setQuantityToProduce] = useState<number>(0);
    const [unitCost, setUnitCost] = useState<number | undefined>(undefined);
    const [expiryDate, setExpiryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch available raw materials and products on mount
    useEffect(() => {
        dispatch(fetchAvailableRawMaterials());
        loadProducts();
        return () => {
            dispatch(clearProductionError());
            dispatch(resetProduction());
        };
    }, []);

    const loadProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    };

    // Update selected batch when selection changes
    useEffect(() => {
        if (selectedRawStockId && availableBatches.length) {
            const batch = availableBatches.find(b => b.stockId === selectedRawStockId);
            setSelectedBatch(batch || null);
            setQuantityToConsume(0);
        }
    }, [selectedRawStockId, availableBatches]);

    // Handle successful production
    useEffect(() => {
        if (lastProduction) {
            setSuccessMessage(`✅ Success! Produced ${lastProduction.produced.quantity} ${lastProduction.produced.unitOfMeasure} of ${lastProduction.produced.productName}`);
            // Reset form
            setSelectedRawStockId('');
            setSelectedFinishedProduct('');
            setQuantityToConsume(0);
            setQuantityToProduce(0);
            setUnitCost(undefined);
            setExpiryDate('');
            setNotes('');
            // Refresh available batches
            dispatch(fetchAvailableRawMaterials());
            if (onSuccess) onSuccess();
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    }, [lastProduction, dispatch, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedRawStockId || !selectedFinishedProduct || !quantityToConsume || !quantityToProduce) {
            alert('Please fill all required fields');
            return;
        }

        if (selectedBatch && quantityToConsume > selectedBatch.quantity) {
            alert(`Cannot consume more than available. Available: ${selectedBatch.quantity} kg`);
            return;
        }

        const productionData = {
            rawStockId: selectedRawStockId,
            finishedProductId: selectedFinishedProduct,
            quantityToConsume: quantityToConsume,
            quantityToProduce: quantityToProduce,
            unitCost: unitCost,
            expiryDate: expiryDate || undefined,
            notes: notes || undefined
        };

        await dispatch(processProduction(productionData));
    };

    // Filter finished products (exclude raw materials by name)
    const finishedProducts = products.filter(p => 
        p.name.toLowerCase().includes('flour') || 
        p.name.toLowerCase().includes('bran') ||
        p.name.toLowerCase().includes('meal') ||
        (p.name.toLowerCase() !== 'maize' && !p.name.toLowerCase().includes('raw'))
    );

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '550px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                        🏭 Process Production
                    </h3>
                    <button 
                        className="prod-btn prod-btn--ghost" 
                        onClick={onClose} 
                        style={{ padding: '4px 12px', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="prod-alert prod-alert--error" style={{ marginBottom: '16px', padding: '10px', background: '#fee', color: '#c00', borderRadius: '8px' }}>
                        ❌ {error}
                    </div>
                )}

                {successMessage && (
                    <div className="prod-alert prod-alert--success" style={{ marginBottom: '16px', padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px' }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Select Raw Material Batch */}
                    <div className="form-group">
                        <label>Raw Material Batch <span style={{ color: '#A32D2D' }}>*</span></label>
                        <select
                            value={selectedRawStockId}
                            onChange={(e) => setSelectedRawStockId(e.target.value)}
                            required
                            disabled={isLoadingBatches}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="">— Select Raw Material Batch —</option>
                            {availableBatches.map(batch => (
                                <option key={batch.stockId} value={batch.stockId}>
                                    {batch.productName} - PO: {batch.poNumber} ({batch.quantity} kg @ {batch.unitCost.toLocaleString()} RWF/kg)
                                </option>
                            ))}
                        </select>
                        {isLoadingBatches && <small>Loading raw materials...</small>}
                        {availableBatches.length === 0 && !isLoadingBatches && (
                            <small style={{ color: '#A32D2D' }}>
                                No raw materials available. Please receive a PO first.
                            </small>
                        )}
                    </div>

                    {/* Quantity to Consume */}
                    {selectedBatch && (
                        <div className="form-group">
                            <label>Quantity to Consume (kg) <span style={{ color: '#A32D2D' }}>*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                value={quantityToConsume || ''}
                                onChange={(e) => setQuantityToConsume(parseFloat(e.target.value) || 0)}
                                required
                                min="0.01"
                                max={selectedBatch.quantity}
                                placeholder={`Max: ${selectedBatch.quantity} kg`}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <small>
                                Available: {selectedBatch.quantity} kg @ {selectedBatch.unitCost.toLocaleString()} RWF/kg
                            </small>
                        </div>
                    )}

                    {/* Finished Product */}
                    <div className="form-group">
                        <label>Finished Product <span style={{ color: '#A32D2D' }}>*</span></label>
                        <select
                            value={selectedFinishedProduct}
                            onChange={(e) => setSelectedFinishedProduct(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="">— Select Product —</option>
                            {finishedProducts.map(product => (
                                <option key={product._id} value={product._id}>
                                    {product.name} - {product.sellingPrice?.toLocaleString()} RWF
                                </option>
                            ))}
                        </select>
                        {finishedProducts.length === 0 && (
                            <small>Create finished products (flour, bran) first</small>
                        )}
                    </div>

                    {/* Quantity to Produce */}
                    <div className="form-group">
                        <label>Quantity Produced (kg) <span style={{ color: '#A32D2D' }}>*</span></label>
                        <input
                            type="number"
                            step="0.01"
                            value={quantityToProduce || ''}
                            onChange={(e) => setQuantityToProduce(parseFloat(e.target.value) || 0)}
                            required
                            min="0.01"
                            placeholder="e.g., 400"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <small>Example: 600kg raw → 400kg flour</small>
                    </div>

                    {/* Unit Cost (Optional) */}
                    <div className="form-group">
                        <label>Unit Cost (RWF/kg) <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
                        <input
                            type="number"
                            step="0.01"
                            value={unitCost || ''}
                            onChange={(e) => setUnitCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="Leave empty to auto-calculate"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    {/* Expiry Date */}
                    <div className="form-group">
                        <label>Expiry Date <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label>Notes <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Production notes..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="prod-btn prod-btn--primary"
                            disabled={isProcessing || availableBatches.length === 0}
                            style={{ background: '#8B5CF6', borderColor: '#8B5CF6', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            {isProcessing ? '⏳ Processing...' : '🏭 Process Production'}
                        </button>
                        <button
                            type="button"
                            className="prod-btn prod-btn--ghost"
                            onClick={onClose}
                            disabled={isProcessing}
                            style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {/* Production Guide */}
                <div style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
                    <strong>💡 How it works:</strong>
                    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                        <li>Raw materials come from received Purchase Orders</li>
                        <li>Each PO batch is tracked separately (different costs)</li>
                        <li>When you produce, raw stock is consumed</li>
                        <li>Finished product gets a new batch with calculated cost</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ProcessProductionModal;