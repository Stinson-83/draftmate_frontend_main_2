import React from 'react';

const SubscriptionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#101622] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#f0f2f4] dark:border-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 md:p-8 flex flex-col items-center text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                    </div>

                    <h2 className="text-2xl font-black text-[#111318] dark:text-white mb-2">
                        Unlock Premium Access
                    </h2>

                    <p className="text-[#616f89] dark:text-gray-400 text-sm mb-6">
                        Get full access to all DraftMate features, unlimited AI drafting, and exclusive legal templates for your practice.
                    </p>

                    <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col items-center mb-6 border border-blue-100 dark:border-blue-800/30">
                        <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Subscription unlocks at</div>
                        <div className="text-4xl font-black text-[#111318] dark:text-white flex items-baseline gap-1">
                            <span>₹799</span>
                            <span className="text-sm font-medium text-[#616f89] dark:text-gray-400">/mo</span>
                        </div>
                    </div>

                    <ul className="flex flex-col gap-3 w-full text-left mb-8">
                        <li className="flex items-center gap-3 text-[#111318] dark:text-gray-300 text-sm font-medium">
                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                            Unlimited AI Legal Drafting
                        </li>
                        <li className="flex items-center gap-3 text-[#111318] dark:text-gray-300 text-sm font-medium">
                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                            Advanced Lex Bot Research
                        </li>
                        <li className="flex items-center gap-3 text-[#111318] dark:text-gray-300 text-sm font-medium">
                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                            100% Verified Citations
                        </li>
                        <li className="flex items-center gap-3 text-[#111318] dark:text-gray-300 text-sm font-medium">
                            <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                            Chat with Multiple PDFs
                        </li>
                    </ul>

                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-primary/30"
                    >
                        Got It
                    </button>
                    <p className="text-xs text-[#616f89] dark:text-gray-500 mt-4">
                        Cancel anytime. No hidden fees.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;
