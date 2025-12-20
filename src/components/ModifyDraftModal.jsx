import React, { useState } from 'react';
import { X, Wand2 } from 'lucide-react';

const ModifyDraftModal = ({ isOpen, onClose, onConfirm }) => {
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!context.trim()) return;
        setIsLoading(true);
        await onConfirm(context);
        setIsLoading(false);
        setContext(''); // Reset after success
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="modal-header">
                    <h3><Wand2 size={20} className="icon-mr" /> Modify Draft</h3>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <p className="text-sm text-muted">
                        Provide instructions on how you want to modify this entire draft.
                        The AI will rewrite the content while preserving your placeholders (e.g., [Date], [Name]).
                    </p>

                    <textarea
                        className="form-control mt-3"
                        rows={6}
                        placeholder="E.g., Make the tone more formal, ensure it complies with the latest arbitration act, and fix any grammar issues..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={isLoading || !context.trim()}
                    >
                        {isLoading ? 'Enhancing...' : 'Modify Draft'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifyDraftModal;
