// src/components/Supplier/SupplierDocuments.tsx
import React, { useState, useEffect } from 'react';
import { 
    getSupplierDocuments, 
    uploadSupplierDocument, 
    deleteSupplierDocument,
    downloadSupplierDocument
} from '../../api/apiService';
import { SupplierDocument } from '../../types/models';

interface SupplierDocumentsProps {
    supplierId: string;
    supplierName?: string;  
}

const SupplierDocuments: React.FC<SupplierDocumentsProps> = ({ supplierId }) => {
    const [documents, setDocuments] = useState<SupplierDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('Other');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await getSupplierDocuments(supplierId);
            const data = response.data;
            const normalizedDocuments: SupplierDocument[] = (data.documents || []).map((doc: any) => ({
                ...doc,
                uploadedBy: doc.uploadedBy || '',
            }));
            setDocuments(normalizedDocuments);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (supplierId) {
            fetchDocuments();
        }
    }, [supplierId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        
        try {
            await uploadSupplierDocument(supplierId, selectedFile, documentType, description);
            setSuccess('Document uploaded successfully!');
            setShowUploadModal(false);
            setSelectedFile(null);
            setDocumentType('Other');
            setDescription('');
            fetchDocuments();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: SupplierDocument) => {
        try {
            const response = await downloadSupplierDocument(supplierId, doc._id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Failed to download document');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDelete = async (doc: SupplierDocument) => {
        if (!window.confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;
        
        try {
            await deleteSupplierDocument(supplierId, doc._id);
            setSuccess('Document deleted successfully');
            fetchDocuments();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Delete failed');
            setTimeout(() => setError(null), 3000);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getDocumentTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            'Tax Certificate': '#e8f4f8',
            'Business License': '#e8f5e9',
            'Contract': '#fff3e0',
            'ID/Passport': '#fce4ec',
            'Bank Details': '#e3f2fd',
            'Other': '#f5f5f5'
        };
        return {
            backgroundColor: colors[type] || '#f5f5f5',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500
        };
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0 }}>Documents</h4>
                <button className="btn-primary" onClick={() => setShowUploadModal(true)} style={{ padding: '8px 16px' }}>
                    + Upload Document
                </button>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '15px', padding: '10px', background: '#fee', color: '#c00', borderRadius: '5px' }}>
                    ❌ {error}
                </div>
            )}
            
            {success && (
                <div className="success-message" style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '5px' }}>
                    ✅ {success}
                </div>
            )}

            {/* Documents Table */}
            {loading ? (
                <p>Loading documents...</p>
            ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px dashed #ddd', borderRadius: '8px' }}>
                    📄 No documents uploaded yet
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Document Name</th>
                                <th>Size</th>
                                <th>Uploaded By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc._id}>
                                    <td>
                                        <span style={getDocumentTypeBadge(doc.documentType)}>
                                            {doc.documentType}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{doc.originalName}</div>
                                        {doc.description && (
                                            <div style={{ fontSize: '11px', color: '#666' }}>{doc.description}</div>
                                        )}
                                        {doc.compressedSize && (
                                            <div style={{ fontSize: '10px', color: '#4caf50' }}>
                                                Compressed: {formatFileSize(doc.fileSize)} 
                                                (Saved {((1 - doc.fileSize / (doc.compressedSize || doc.fileSize)) * 100).toFixed(0)}%)
                                            </div>
                                        )}
                                    </td>
                                    <td>{formatFileSize(doc.fileSize)}</td>
                                    <td>{doc.uploadedByName}</td>
                                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn-info btn-small" 
                                                onClick={() => handleDownload(doc)}
                                                title="Download"
                                            >
                                                📥
                                            </button>
                                            <button 
                                                className="btn-delete btn-small" 
                                                onClick={() => handleDelete(doc)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Upload Document</h3>
                            <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>✕</button>
                        </div>

                        <div className="form-group">
                            <label>Document Type *</label>
                            <select 
                                value={documentType} 
                                onChange={(e) => setDocumentType(e.target.value)}
                                required
                            >
                                <option value="Tax Certificate">Tax Certificate</option>
                                <option value="Business License">Business License</option>
                                <option value="Contract">Contract</option>
                                <option value="ID/Passport">ID/Passport</option>
                                <option value="Bank Details">Bank Details</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Brief description of the document..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Select File *</label>
                            <input 
                                type="file" 
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                required
                            />
                            <small>Accepted formats: PDF, JPG, PNG, DOC (Max 10MB)</small>
                        </div>

                        {selectedFile && (
                            <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px', marginBottom: '15px' }}>
                                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </div>
                        )}

                        <div style={{ padding: '10px', background: '#e8f4f8', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
                            💡 <strong>Note:</strong> Files will be automatically compressed to save storage space.
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn-primary" 
                                onClick={handleUpload} 
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                            <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierDocuments;