// src/store/productionSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/apiService';

// Types for the NEW RawMaterialStock system
interface AvailableBatch {
    stockId: string;           // ID from RawMaterialStock
    poNumber: string;
    batchNumber: string;
    productName: string;
    quantity: number;
    unitCost: number;
    receivedDate: string;
}

interface ProductionData {
    rawStockId: string;        // Changed from rawProductId + poId + rawBatchNumber
    finishedProductId: string;
    quantityToConsume: number;
    quantityToProduce: number;
    unitCost?: number;
    expiryDate?: string;
    notes?: string;
}

interface ProductionResult {
    consumed: {
        stockId: string;
        productName: string;
        batchNumber: string;
        quantity: number;
        remainingQuantity: number;
    };
    produced: {
        productId: string;
        productName: string;
        batchNumber: string;
        quantity: number;
        unitCost: number;
        unitOfMeasure: string;
    };
    poNumber: string;
    poId: string;
}

interface ProductionState {
    availableBatches: AvailableBatch[];
    isLoadingBatches: boolean;
    isProcessing: boolean;
    lastProduction: ProductionResult | null;
    error: string | null;
}

const initialState: ProductionState = {
    availableBatches: [],
    isLoadingBatches: false,
    isProcessing: false,
    lastProduction: null,
    error: null,
};

// Async Thunks - Using NEW RawMaterialStock endpoints
export const fetchAvailableRawMaterials = createAsyncThunk(
    'production/fetchAvailableRawMaterials',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/raw-materials/available');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch raw materials');
        }
    }
);

export const processProduction = createAsyncThunk(
    'production/process',
    async (productionData: ProductionData, { rejectWithValue }) => {
        try {
            const response = await api.post('/products/process', productionData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Production failed');
        }
    }
);

// Slice
const productionSlice = createSlice({
    name: 'production',
    initialState,
    reducers: {
        clearProductionError: (state) => {
            state.error = null;
        },
        resetProduction: (state) => {
            state.lastProduction = null;
            state.availableBatches = [];
        },
        clearAvailableBatches: (state) => {
            state.availableBatches = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Available Raw Materials
            .addCase(fetchAvailableRawMaterials.pending, (state) => {
                state.isLoadingBatches = true;
                state.error = null;
            })
            .addCase(fetchAvailableRawMaterials.fulfilled, (state, action) => {
                state.isLoadingBatches = false;
                state.availableBatches = action.payload.batches || [];
            })
            .addCase(fetchAvailableRawMaterials.rejected, (state, action) => {
                state.isLoadingBatches = false;
                state.error = action.payload as string;
            })
            // Process Production
            .addCase(processProduction.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(processProduction.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.lastProduction = action.payload.data;
            })
            .addCase(processProduction.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearProductionError, resetProduction, clearAvailableBatches } = productionSlice.actions;
export default productionSlice.reducer;