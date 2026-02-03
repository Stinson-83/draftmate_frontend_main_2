import { load } from '@cashfreepayments/cashfree-js';

// Singleton instance
let cashfree = null;

export const initializeCashfree = async (mode) => {
    // Priority: Argument > Env Var > Default 'sandbox'
    const targetMode = mode || import.meta.env.VITE_CASHFREE_MODE || 'sandbox';

    if (!cashfree) {
        cashfree = await load({
            mode: targetMode
        });
    }
    return cashfree;
};

// API Base URL
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const createOrder = async (planId, sessionId) => {
    try {
        const response = await fetch(`${API_URL}/subscriptions/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, plan_id: planId })
        });

        if (!response.ok) throw new Error('Failed to create order');
        return await response.json();
    } catch (error) {
        console.error("Create Order Error:", error);
        throw error;
    }
};

export const verifyPayment = async (orderId) => {
    try {
        const response = await fetch(`${API_URL}/subscriptions/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });
        return await response.json();
    } catch (error) {
        console.error("Verify Payment Error:", error);
        throw error;
    }
};

export const getSubscriptionStatus = async (sessionId) => {
    try {
        const response = await fetch(`${API_URL}/subscriptions/current-status?session_id=${sessionId}`);
        return await response.json();
    } catch (error) {
        console.error("Get Status Error:", error);
        throw error;
    }
};

export const doPayment = async (paymentSessionId) => {
    if (!cashfree) await initializeCashfree(); // Ensure initialized
    return cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self" // Standard Full Page Redirect
    });
};
