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
            throw new Error(errorText || `Upload failed with status ${response.status}`);
        }

        return response.json();
    },

    /**
     * Send a chat query to the backend (non-streaming).
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
    },

    /**
     * Send a chat query with streaming response (SSE).
     * @param {string} query - The user's question.
     * @param {string} sessionId - The current session ID.
     * @param {Object} callbacks - Event callbacks { onStatus, onAnswer, onFollowups, onDone, onError }
     */
    chatStream: async (query, sessionId, callbacks = {}) => {
        const { onStatus, onAnswer, onFollowups, onDone, onError } = callbacks;

        try {
            const response = await fetch(`${API_BASE_URL}/chat/stream`, {
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
                throw new Error(`Stream failed: ${response.status} ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event = JSON.parse(line.slice(6));

                            switch (event.event) {
                                case 'status':
                                    onStatus?.(event.message);
                                    break;
                                case 'answer':
                                    onAnswer?.(event.content);
                                    break;
                                case 'followups':
                                    onFollowups?.(event.questions);
                                    break;
                                case 'done':
                                    onDone?.(event);
                                    break;
                                case 'error':
                                    onError?.(new Error(event.message));
                                    break;
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE event:', line);
                        }
                    }
                }
            }
        } catch (error) {
            onError?.(error);
            throw error;
        }
    }
};
