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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
        }
    }
};
