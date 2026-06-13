/**
 * Advocate API Client
 *
 * Single source of truth for all advocate-related API calls.
 * Handles:
 *  - Token storage / retrieval
 *  - Automatic token refresh on 401
 *  - Redirect to login on refresh failure
 *  - Consistent error normalisation
 */

import { API_CONFIG } from './endpoints';

const BASE = API_CONFIG.ADVOCATE.BASE_URL;
const EP   = API_CONFIG.ADVOCATE.ENDPOINTS;

// ── Token helpers ─────────────────────────────────────────────────────────────
export const tokens = {
    getAccess:   () => localStorage.getItem('advocate_token'),
    getRefresh:  () => localStorage.getItem('advocate_refresh_token'),
    setAccess:   (t) => localStorage.setItem('advocate_token', t),
    setRefresh:  (t) => localStorage.setItem('advocate_refresh_token', t),
    clear: () => {
        localStorage.removeItem('advocate_token');
        localStorage.removeItem('advocate_refresh_token');
    },
};

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns true on success, false otherwise.
 */
async function _tryRefresh() {
    const refresh = tokens.getRefresh();
    if (!refresh) return false;
    try {
        const res = await fetch(`${BASE}${EP.REFRESH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        tokens.setAccess(data.access_token);
        tokens.setRefresh(data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

/**
 * Core fetch wrapper with automatic 401 → refresh → retry logic.
 * Redirects to /advocate/login if refresh also fails.
 */
async function _fetch(url, options = {}, isRetry = false) {
    const access = tokens.getAccess();
    const headers = {
        ...options.headers,
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && !isRetry) {
        const refreshed = await _tryRefresh();
        if (refreshed) {
            return _fetch(url, options, true);
        }
        // Refresh failed — clear tokens and redirect
        tokens.clear();
        window.location.href = '/advocate/login?session_expired=1';
        throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
            const err = await res.json();
            detail = err.detail || err.message || detail;
        } catch { /* ignore */ }
        throw new Error(detail);
    }

    return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const advocateAuth = {
    register: (payload) =>
        fetch(`${BASE}${EP.REGISTER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed');
            return data;
        }),

    login: (payload) =>
        fetch(`${BASE}${EP.LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');
            return data;
        }),

    logout: async () => {
        try {
            await _fetch(`${BASE}${EP.LOGOUT}`, { method: 'POST' });
        } catch { /* best-effort */ }
        tokens.clear();
    },

    saveTokens: ({ access_token, refresh_token }) => {
        tokens.setAccess(access_token);
        tokens.setRefresh(refresh_token);
    },
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const advocateProfile = {
    getMe: () => _fetch(`${BASE}${EP.MY_PROFILE}`),

    updateMe: (payload) =>
        _fetch(`${BASE}${EP.MY_PROFILE}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),

    completeOnboarding: (payload) =>
        _fetch(`${BASE}${EP.COMPLETE_ONBOARDING}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),

    updatePracticeAreas: (practiceAreas) =>
        _fetch(`${BASE}${EP.UPDATE_PRACTICE_AREAS}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ practice_areas: practiceAreas }),
        }),

    updateDetails: (data) =>
        _fetch(`${BASE}${EP.UPDATE_DETAILS}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),

    uploadImage: (file) => {
        const form = new FormData();
        form.append('file', file);
        return _fetch(`${BASE}${EP.UPLOAD_IMAGE}`, { method: 'POST', body: form });
    },

    getPublic: (slug) => _fetch(`${BASE}${EP.PUBLIC_PROFILE(slug)}`),
};

// ── Discovery ─────────────────────────────────────────────────────────────────
export const advocateDiscovery = {
    search: (params) => {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== false && v !== undefined))
        ).toString();
        return _fetch(`${BASE}${EP.SEARCH}?${qs}`);
    },
    featured:    (limit = 5) => _fetch(`${BASE}${EP.FEATURED}?limit=${limit}`),
    trending:    (limit = 5) => _fetch(`${BASE}${EP.TRENDING}?limit=${limit}`),
    recent:      (limit = 5) => _fetch(`${BASE}${EP.RECENT}?limit=${limit}`),
    recommended: (limit = 5) => _fetch(`${BASE}${EP.RECOMMENDED}?limit=${limit}`),
    practiceAreas: ()        => _fetch(`${BASE}${EP.PRACTICE_AREAS}`),
};

// ── Consultations ─────────────────────────────────────────────────────────────
export const advocateConsultations = {
    request: (payload) =>
        _fetch(`${BASE}${EP.CONSULTATION_REQUEST}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),

    getMyConsultations: () => _fetch(`${BASE}${EP.MY_CONSULTATIONS}`),

    updateStatus: (id, status) =>
        _fetch(`${BASE}${EP.UPDATE_CONSULTATION_STATUS(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const advocateMessages = {
    // Legacy endpoints
    send: (payload) =>
        _fetch(`${BASE}${EP.CONTACT_REQUEST}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),

    getMyMessages: () => _fetch(`${BASE}${EP.MY_MESSAGES}`),

    updateStatus: (id, status) =>
        _fetch(`${BASE}${EP.UPDATE_MESSAGE_STATUS(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        }),

    // New Messaging System
    getConversations: () => _fetch(`${BASE}${EP.MESSAGES_CONVERSATIONS}`),

    getConversation: (email) => _fetch(`${BASE}${EP.MESSAGES_CONVERSATION(email)}`),

    sendMessage: (payload) =>
        _fetch(`${BASE}${EP.MESSAGES_SEND}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }),

    reply: (email, message) =>
        _fetch(`${BASE}${EP.MESSAGES_REPLY(email)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        }),

    markRead: (messageId) =>
        _fetch(`${BASE}${EP.MESSAGES_READ(messageId)}`, { method: 'PUT' }),

    markConversationRead: (email) =>
        _fetch(`${BASE}${EP.MESSAGES_CONVERSATION_READ(email)}`, { method: 'PUT' }),

    archiveConversation: (email) =>
        _fetch(`${BASE}${EP.MESSAGES_CONVERSATION_ARCHIVE(email)}`, { method: 'PUT' }),
};

// ── Verification ──────────────────────────────────────────────────────────────
export const advocateVerification = {
    submit: (file) => {
        const form = new FormData();
        form.append('file', file);
        return _fetch(`${BASE}${EP.SUBMIT_VERIFICATION}`, { method: 'POST', body: form });
    },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const advocateAnalytics = {
    trackView:  (payload) => fetch(`${BASE}${EP.TRACK_VIEW}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => {}), // fire-and-forget

    trackShare: (payload) => fetch(`${BASE}${EP.TRACK_SHARE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => {}),

    getDashboard: () => _fetch(`${BASE}${EP.MY_ANALYTICS}`),
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────
export const advocateBookmarks = {
    add:    (advocateId) => _fetch(`${BASE}${EP.BOOKMARKS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocate_id: advocateId }),
    }),
    remove: (advocateId) => _fetch(`${BASE}${EP.REMOVE_BOOKMARK(advocateId)}`, { method: 'DELETE' }),
};
