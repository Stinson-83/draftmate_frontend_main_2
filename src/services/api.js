import { API_CONFIG } from './endpoints';

const API_BASE_URL = API_CONFIG.LEX_BOT.BASE_URL;

export const api = {
    /**
     * Upload a PDF file to the backend.
     * @param {File} file - The file object to upload.
     * @param {string} sessionId - The current session ID.
     * @returns {Promise<Object>} - The JSON response from the server.
     */
    uploadFile: async (file, sessionId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', sessionId);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }

        return response.json();
    },

    /**
     * Send a chat query to the backend.
     * @param {string} query - The user's question.
     * @param {string} sessionId - The current session ID.
     * @returns {Promise<Object>} - The JSON response containing the answer.
     */
    chat: async (query, sessionId) => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Chat failed: ${response.status} ${errorText}`);
        }

        return response.json();
    }
};
