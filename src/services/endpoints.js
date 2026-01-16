/**
 * Consolidated Backend Endpoints Configuration
 * 
 * This file contains the API configuration for all backend microservices.
 * 
 * IMPORTANT: 
 * - All services are now routed through a single Nginx Reverse Proxy.
 * - Base URL is determined by VITE_API_BASE_URL env var.
 * - Path prefixes map to specific services (e.g., /converter -> port 8000).
 */

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
let BASE_URL = envBaseUrl !== undefined ? envBaseUrl : '';

// Remove trailing slash if present to avoid double slashes (e.g. //auth)
// which browsers interpret as protocol-relative URLs
if (BASE_URL.endsWith('/')) {
    BASE_URL = BASE_URL.slice(0, -1);
}

export const API_CONFIG = {
    // Service: backend/converter (Port 8000)
    CONVERTER: {
        BASE_URL: `${BASE_URL}/converter`,
        ENDPOINTS: {
            CONVERT: '/convert', // POST
        }
    },

    // Service: backend/Drafter (Port 8003)
    DRAFTER: {
        BASE_URL: `${BASE_URL}/drafter`,
        ENDPOINTS: {
            GENERATE: '/generate', // POST
        }
    },

    // Service: backend/query (Port 8001)
    QUERY: {
        BASE_URL: `${BASE_URL}/query`,
        ENDPOINTS: {
            HEALTH: '/', // GET
            DIAGNOSTICS: '/diag', // GET
            SEARCH: '/search', // POST
            DOWNLOAD_TEMPLATE: '/download-template', // POST
            DOWNLOAD_TEMPLATE_HTML: '/download-template-html', // POST
        }
    },

    // Service: backend/Enhance_bot (Port 8002)
    ENHANCE_BOT: {
        // Direct local address to avoid Nginx requirement for dev
        BASE_URL: `${BASE_URL}/enhance`,
        ENDPOINTS: {
            ENHANCE_CONTENT: '/enhance_content', // POST
            ENHANCE_CLAUSE: '/enhance_clause', // POST
            CREATE_PLACEHOLDERS: '/create_placeholders', // POST
        }
    },

    // Service: backend/Deep_research/lex_bot (Port 8004)
    LEX_BOT: {
        BASE_URL: `${BASE_URL}/lexbot`,
        ENDPOINTS: {
            HEALTH: '/', // GET
            CONFIG_LLM: '/config/llm', // GET, POST
            CHAT: '/chat', // POST
            CHAT_REASONING: '/chat/reasoning', // POST
            SESSIONS: '/sessions', // POST
            UPLOAD: '/upload', // POST
            MEMORY: '/memory', // POST

            // Dynamic endpoints helpers
            getSession: (sessionId, userId) => `/sessions/${sessionId}?user_id=${userId}`, // GET
            deleteSession: (sessionId, userId) => `/sessions/${sessionId}?user_id=${userId}`, // DELETE
            getUserSessions: (userId) => `/users/${userId}/sessions`, // GET
        }
    },

    // Service: backend/PDF_Editor (Port 8005)
    PDF_EDITOR_API: {
        BASE_URL: `${BASE_URL}/pdf`,
        ENDPOINTS: {
            MERGE: '/merge', // POST
            SPLIT: '/split', // POST
            COMPRESS: '/compress', // POST
            PDF_TO_WORD: '/pdf-to-word', // POST
            WORD_TO_PDF: '/word-to-pdf', // POST
            ROTATE: '/rotate', // POST
            PREVIEW: '/preview', // POST
            REORDER: '/reorder', // POST
            WATERMARK: '/watermark', // POST
            ASSEMBLE: '/assemble', // POST
            ADD_PAGE_NUMBERS: '/add_page_numbers', // POST
        }
    },

    // Service: backend/login_db (Port 8009)
    AUTH: {
        BASE_URL: `${BASE_URL}/auth`,
        ENDPOINTS: {
            LOGIN: '/login', // POST
            REGISTER: '/register', // POST
            GOOGLE_LOGIN: '/google-login', // POST
            LOGOUT: '/logout', // POST
            VERIFY_SESSION: '/verify_session', // GET
        }
    },

    // Service: backend/Notification (Port 8015)
    NOTIFICATION: {
        BASE_URL: `${BASE_URL}/notification`,
        ENDPOINTS: {
            GET_ALL: (userId) => `/notifications/${userId}`,
            GET_COUNT: (userId) => `/notifications/${userId}/count`,
            CREATE: '/notifications',
            MARK_READ: (notificationId) => `/notifications/${notificationId}/read`,
            MARK_ALL_READ: (userId) => `/notifications/${userId}/read-all`,
            DELETE: (notificationId) => `/notifications/${notificationId}`,
            DELETE_ALL: (userId) => `/notifications/${userId}/all`,
        }
    }
};
