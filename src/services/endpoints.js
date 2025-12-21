/**
 * Consolidated Backend Endpoints Configuration
 * 
 * This file contains the API configuration for all backend microservices.
 * 
 * IMPORTANT: 
 * - Ports have been resolved to avoid conflicts.
 * - DRAFTER: 8003
 * - PDF_EDITOR_API: 8005
 */

export const API_CONFIG = {
    // Service: backend/converter
    CONVERTER: {
        BASE_URL: 'http://localhost:8000',
        ENDPOINTS: {
            CONVERT: '/convert', // POST
        }
    },

    // Service: backend/Drafter
    DRAFTER: {
        BASE_URL: 'http://localhost:8003', // Resolved port
        ENDPOINTS: {
            GENERATE: '/generate', // POST
        }
    },

    // Service: backend/query
    QUERY: {
        BASE_URL: 'http://localhost:8001',
        ENDPOINTS: {
            HEALTH: '/', // GET
            DIAGNOSTICS: '/diag', // GET
            SEARCH: '/search', // POST
            DOWNLOAD_TEMPLATE: '/download-template', // POST
            DOWNLOAD_TEMPLATE_HTML: '/download-template-html', // POST
        }
    },

    // Service: backend/Enhance_bot
    ENHANCE_BOT: {
        BASE_URL: 'http://localhost:8002',
        ENDPOINTS: {
            ENHANCE_CONTENT: '/enhance_content', // POST
            ENHANCE_CLAUSE: '/enhance_clause', // POST
            CREATE_PLACEHOLDERS: '/create_placeholders', // POST
        }
    },

    // Service: backend/Deep_research/lex_bot
    LEX_BOT: {
        BASE_URL: 'http://localhost:8004',
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

    // Service: backend/PDF_Editor
    // Note: This service is configured to run on port 8005
    PDF_EDITOR_API: {
        BASE_URL: 'http://localhost:8005',
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
