import { API_CONFIG } from './endpoints';

const API_BASE_URL = API_CONFIG.LEX_BOT.BASE_URL;
const NOTIFICATION_BASE_URL = 'http://localhost:8015';

export const api = {
    /**
     * Get current LLM configuration.
     * @returns {Promise<Object>} - { current_model, available_models, modes }
     */
    getLLMConfig: async () => {
        const response = await fetch(`${API_BASE_URL}/config/llm`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to get LLM config: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Set LLM model at runtime.
     * @param {string} model - The model to switch to.
     * @returns {Promise<Object>} - Updated configuration.
     */
    setLLMConfig: async (model) => {
        const response = await fetch(`${API_BASE_URL}/config/llm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to set LLM config: ${errorText}`);
        }

        return response.json();
    },

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
     * @param {boolean} reasoning - Whether to use reasoning mode.
     * @returns {Promise<Object>} - The JSON response containing the answer.
     */
    chat: async (query, sessionId, reasoning = false) => {
        const endpoint = reasoning ? '/chat/reasoning' : '/chat';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
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
        const { onStatus, onToken, onAnswer, onFollowups, onSources, onDone, onError } = callbacks;

        try {
            const response = await fetch(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
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
                                    onStatus?.(event.message, event.quote);
                                    break;
                                case 'token':
                                    onToken?.(event.chunk, event.accumulated);
                                    break;
                                case 'answer_complete':
                                    onAnswer?.(event.content);
                                    break;
                                case 'answer':
                                    onAnswer?.(event.content);
                                    break;
                                case 'followups':
                                    onFollowups?.(event.questions);
                                    break;
                                case 'sources':
                                    onSources?.(event.sources);
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
    },
    /**
     * Get list of user sessions.
     * @returns {Promise<Object>} - { sessions: [], total: int }
     */
    getSessions: async () => {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Get history for a specific session.
     * @param {string} sessionId 
     * @returns {Promise<Object>} - Session object with messages
     */
    getSessionHistory: async (sessionId) => {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch session history: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Send email notification for calendar event.
     * @param {string} toEmail - Recipient email
     * @param {string} subject - Email subject
     * @param {string} body - Email body
     */
    sendEmailNotification: async (toEmail, subject, body) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: toEmail,
                subject: subject,
                body: body
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send email notification');
        }
        return response.json();
    },

    // =======================================================================
    // NOTIFICATION CRUD API
    // =======================================================================

    /**
     * Get all notifications for a user.
     * @param {string} userId - User identifier
     * @param {Object} options - Filter options { type, unreadOnly, limit }
     * @returns {Promise<Array>} - List of notifications
     */
    getNotifications: async (userId, options = {}) => {
        const params = new URLSearchParams();
        if (options.type) params.append('type', options.type);
        if (options.unreadOnly) params.append('unread_only', 'true');
        if (options.limit) params.append('limit', options.limit.toString());

        const queryString = params.toString();
        const url = `${NOTIFICATION_BASE_URL}/notifications/${userId}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        return response.json();
    },

    /**
     * Get unread notification count.
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} - { user_id, unread_count }
     */
    getUnreadCount: async (userId) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/${userId}/count`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch unread count');
        }
        return response.json();
    },

    /**
     * Create a new notification.
     * @param {Object} notification - { user_id, type, title, message, metadata }
     * @returns {Promise<Object>} - Created notification
     */
    createNotification: async (notification) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notification),
        });

        if (!response.ok) {
            throw new Error('Failed to create notification');
        }
        return response.json();
    },

    /**
     * Mark a notification as read.
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} - Updated notification
     */
    markNotificationRead: async (notificationId) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to mark notification as read');
        }
        return response.json();
    },

    /**
     * Mark all notifications as read for a user.
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} - { success, message, affected_count }
     */
    markAllNotificationsRead: async (userId) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/${userId}/read-all`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to mark all as read');
        }
        return response.json();
    },

    /**
     * Delete a notification.
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} - { success, message }
     */
    deleteNotification: async (notificationId) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }
        return response.json();
    },

    /**
     * Delete all notifications for a user.
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} - { success, message, affected_count }
     */
    deleteAllNotifications: async (userId) => {
        const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/${userId}/all`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete all notifications');
        }
        return response.json();
    },
};

