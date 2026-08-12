import React, { useState } from 'react';
import { X, Upload, FileText, ArrowRight } from 'lucide-react';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onSkip, onSubmit, fileName }) => {
    const [details, setDetails] = useState('');
    const [supportingDocs, setSupportingDocs] = useState([]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSupportingDocs(Array.from(e.target.files));
        }
    };

    const handleSubmit = () => {
        onSubmit({ details, supportingDocs });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <div className="modal-header">
                    <h2>Additional Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="upload-success-message">
                        <FileText size={20} className="text-success" />
                        <span>Draft <strong>{fileName}</strong> uploaded successfully!</span>
                    </div>

                    <p className="modal-description">
                        Would you like to provide any specific details or supporting documents to help the AI understand your case better?
                    </p>

                    <div className="form-group">
                        <label>Case Details / Context (Optional)</label>
                        <textarea
                            placeholder="e.g., This is a rental dispute regarding..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Supporting Documents (Optional)</label>
                        <div className="file-upload-box">
                            <input
                                type="file"
                                multiple
                                id="supporting-docs"
                                className="hidden-input"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="supporting-docs" className="upload-label">
                                <Upload size={20} />
                                <span>
                                    {supportingDocs.length > 0
                                        ? `${supportingDocs.length} file(s) selected`
                                        : "Click to upload files"}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onSkip}>
                        Skip
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        Continue <ArrowRight size={16} style={{ marginLeft: 8 }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
