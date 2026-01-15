import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'draftmate_saved_watermarks';

/**
 * Custom hook for managing saved watermarks in localStorage
 * Stores watermark configurations for quick reuse
 */
export const useWatermarkStorage = () => {
    const [savedWatermarks, setSavedWatermarks] = useState([]);

    // Load saved watermarks from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSavedWatermarks(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading saved watermarks:', error);
        }
    }, []);

    // Save watermarks to localStorage whenever they change
    const persistToStorage = useCallback((watermarks) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(watermarks));
        } catch (error) {
            console.error('Error saving watermarks:', error);
        }
    }, []);

    /**
     * Save a new watermark configuration
     * @param {Object} config - Watermark configuration
     * @param {string} config.name - Display name for the watermark
     * @param {string} config.type - 'text', 'image', or 'both'
     * @param {string} config.text - Watermark text (if applicable)
     * @param {string} config.imageDataUrl - Base64 image data (if applicable)
     * @param {string} config.colorMode - 'original', 'grayscale', or 'bw'
     * @param {number} config.opacity - Opacity value (0.1 - 1.0)
     * @param {number} config.rotation - Rotation angle (0 - 360)
     * @param {number} config.scale - Scale factor (0.05 - 1.0)
     */
    const saveWatermark = useCallback((config) => {
        const newWatermark = {
            id: `wm_${Date.now()}`,
            name: config.name || `Watermark ${savedWatermarks.length + 1}`,
            type: config.type || 'text',
            text: config.text || '',
            imageDataUrl: config.imageDataUrl || null,
            colorMode: config.colorMode || 'grayscale',
            opacity: config.opacity ?? 0.3,
            rotation: config.rotation ?? 45,
            scale: config.scale ?? 1.0,
            createdAt: new Date().toISOString(),
        };

        const updated = [...savedWatermarks, newWatermark];
        setSavedWatermarks(updated);
        persistToStorage(updated);
        return newWatermark;
    }, [savedWatermarks, persistToStorage]);

    /**
     * Delete a saved watermark by ID
     */
    const deleteWatermark = useCallback((id) => {
        const updated = savedWatermarks.filter(wm => wm.id !== id);
        setSavedWatermarks(updated);
        persistToStorage(updated);
    }, [savedWatermarks, persistToStorage]);

    /**
     * Update an existing watermark
     */
    const updateWatermark = useCallback((id, updates) => {
        const updated = savedWatermarks.map(wm =>
            wm.id === id ? { ...wm, ...updates } : wm
        );
        setSavedWatermarks(updated);
        persistToStorage(updated);
    }, [savedWatermarks, persistToStorage]);

    /**
     * Get a watermark by ID
     */
    const getWatermark = useCallback((id) => {
        return savedWatermarks.find(wm => wm.id === id);
    }, [savedWatermarks]);

    /**
     * Clear all saved watermarks
     */
    const clearAll = useCallback(() => {
        setSavedWatermarks([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        savedWatermarks,
        saveWatermark,
        deleteWatermark,
        updateWatermark,
        getWatermark,
        clearAll,
    };
};

export default useWatermarkStorage;
