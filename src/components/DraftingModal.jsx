import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, PenTool, Lock, Eye, EyeOff, FileText, Loader2, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './DraftingModal.css';

const DraftingModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [prompt, setPrompt] = useState('');
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [previewingFormat, setPreviewingFormat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(100);
    const previewRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Backend converter URL
    const CONVERTER_API_URL = "http://127.0.0.1:8000";

    // Zoom handlers
    const handleZoomIn = () => {
        setPreviewZoom(prev => Math.min(prev + 20, 200));
    };

    const handleZoomOut = () => {
        setPreviewZoom(prev => Math.max(prev - 20, 60));
    };

    // Wheel zoom handler (works with trackpad pinch and Ctrl+scroll)
    useEffect(() => {
        const previewElement = previewRef.current;
        if (!previewElement) return;

        const handleWheel = (e) => {
            // Check for pinch gesture (ctrlKey is set for trackpad pinch)
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                setPreviewZoom(prev => Math.min(200, Math.max(60, prev + delta)));
            }
        };

        previewElement.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            previewElement.removeEventListener('wheel', handleWheel);
        };
    }, [previewingFormat]);

    // Mock data for top 3 formats - will be replaced with backend data later
    const mockFormats = [
        {
            id: 1,
            name: 'Affidavit',
            description: 'A written statement confirmed by oath or affirmation, used as evidence in court.',
            preview: `AFFIDAVIT

I, [Full Name], aged about [Age] years,
S/o, D/o, W/o [Father's/Husband's Name],
R/o [Complete Address],

do hereby solemnly affirm and state as follows:

1. That I am the deponent herein and am fully conversant with the facts of this case.

2. That [state the relevant facts].

3. That [additional facts as required].

4. That the contents of this affidavit are true to my knowledge and belief and nothing material has been concealed therefrom.

VERIFICATION:

I, the above-named deponent, do hereby verify that the contents of this affidavit are true and correct to my knowledge and belief, and nothing material has been concealed therefrom.

Verified at [Place] on this [Day] day of [Month], [Year].

DEPONENT

Identified by me:

[Advocate Name]
Advocate`
        },
        {
            id: 2,
            name: 'Legal Notice',
            description: 'Formal communication to assert legal rights or demand action.',
            preview: `LEGAL NOTICE

Date: [DD/MM/YYYY]

To,
[Recipient Full Name]
[Designation, if any]
[Complete Address]
[City, State - PIN Code]

Subject: Legal Notice for [Brief Subject Matter]

Ref: [Reference Number, if any]

Sir/Madam,

Under instructions from and on behalf of my client, [Client Name], I hereby serve upon you the following Legal Notice:

1. That my client is [brief description of client].

2. That [state the facts giving rise to the dispute].

3. That despite repeated requests, you have failed to [specific grievance].

4. That your actions/inactions constitute a violation of [relevant law/agreement].

You are hereby called upon to [specific demand] within [number] days from the receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you, civil and/or criminal, at your risk, cost and consequences.

Please treat this notice as final.

Yours faithfully,

[Advocate Name]
Advocate
[Bar Council Enrollment No.]
[Office Address]
[Contact Details]`
        },
        {
            id: 3,
            name: 'Petition',
            description: 'A formal written request submitted to a court or authority.',
            preview: `IN THE COURT OF [Court Name]
[City/District]

Petition No. _____ of 20__

IN THE MATTER OF:

[Petitioner Name]
S/o, D/o, W/o [Parent/Spouse Name]
R/o [Full Address]
... PETITIONER

VERSUS

[Respondent Name]
[Designation/Relationship]
[Address]
... RESPONDENT

HUMBLE PETITION UNDER [Relevant Section/Act]

Most Respectfully Showeth:

1. That the Petitioner is a law-abiding citizen of India.

2. That the facts and circumstances of the case are as follows:
   [Detailed facts of the matter]

3. That the Petitioner has a valid cause of action.

PRAYER:

It is therefore most respectfully prayed that this Hon'ble Court may be pleased to:

a) Grant the relief as prayed for;
b) Pass any other order deemed fit.

AND FOR THIS ACT OF KINDNESS, THE PETITIONER SHALL EVER PRAY.

Petitioner
Through Counsel

Place: ___________
Date: ___________`
        },
    ];

    const handleOptionSelect = (option) => {
        if (option === 'type') {
            setStep(2);
        } else if (option === 'upload') {
            fileInputRef.current?.click();
        }
    };



    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Exact extension logic from reference
        const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

        // Exact allowed extensions from reference
        const allowedExts = [".html", ".htm", ".pdf", ".rtf", ".doc", ".docx", ".txt"];

        if (!allowedExts.includes(ext)) {
            toast.error("Unsupported file type");
            return;
        }

        // For HTML files, read directly as text
        if (ext === ".html" || ext === ".htm") {
            try {
                const text = await file.text();
                // Navigate immediately for HTML
                navigate('/editor', {
                    state: {
                        htmlContent: text,
                        uploadDetails: `Uploaded file: ${file.name}`,
                        isEmpty: false
                    }
                });
            } catch (error) {
                toast.error("Failed to read HTML file");
                console.error(error);
            }
            return;
        }

        // For all other supported files, use the converter backend
        try {
            setIsUploading(true);
            toast.loading("Loading...");

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${CONVERTER_API_URL}/convert`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Conversion failed: ${response.statusText}`);
            }

            const htmlContent = await response.text();

            toast.dismiss();
            toast.success("File converted successfully!");

            navigate('/editor', {
                state: {
                    htmlContent: htmlContent,
                    uploadDetails: `Uploaded file: ${file.name}`,
                    isEmpty: false
                }
            });

        } catch (error) {
            toast.dismiss();
            toast.error("Failed to convert file. Make sure the converter service is running.");
            console.error("Conversion error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = () => {
        // Move to format selection step instead of navigating directly
        setStep(3);
    };

    const handleFormatSelect = (format) => {
        setSelectedFormat(format);
    };

    const handlePreviewToggle = (formatId) => {
        if (previewingFormat === formatId) {
            setPreviewingFormat(null);
        } else {
            setPreviewingFormat(formatId);
        }
    };

    const handleContinue = () => {
        if (!selectedFormat) return;

        setIsLoading(true);
        // Simulate AI draft generation delay
        setTimeout(() => {
            navigate('/editor', {
                state: {
                    prompt,
                    selectedFormat: selectedFormat.name
                }
            });
        }, 1500);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                {isUploading ? (
                    <div className="step-content fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                        <Loader2 size={48} className="spinner" style={{ marginBottom: '16px', color: '#4f46e5' }} />
                        <h2 className="modal-title">Processing your file...</h2>
                        <p className="modal-subtitle">Converting document to editable format</p>
                    </div>
                ) : step === 1 ? (
                    <div className="step-content fade-in">
                        <h2 className="modal-title">Start drafting by</h2>
                        <div className="options-grid">
                            <button className="option-card" onClick={() => handleOptionSelect('upload')}>
                                <div className="icon-box upload">
                                    <Upload size={24} />
                                </div>
                                <div className="text-content">
                                    <h3>Uploading reference documents</h3>
                                    <p>Upload existing documents to use as reference for your draft</p>
                                </div>
                            </button>
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".html,.htm,.pdf,.doc,.docx,.rtf,.txt"
                                onChange={handleFileUpload}
                            />

                            <button className="option-card" onClick={() => handleOptionSelect('type')}>
                                <div className="icon-box type">
                                    <PenTool size={24} />
                                </div>
                                <div className="text-content">
                                    <h3>Typing facts of the matter</h3>
                                    <p>Start fresh by providing the facts and details of your case</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : step === 2 ? (
                    <div className="step-content fade-in">
                        <div className="modal-header">
                            <div className="icon-badge">
                                <PenTool size={20} />
                            </div>
                            <h2 className="modal-title">Please tell us more about what you want to draft</h2>
                        </div>

                        <p className="modal-subtitle">Do include which legal document you want to draft and the facts of the case</p>

                        <div className="input-area">
                            <textarea
                                placeholder="e.g. My client has been charged with Section 6 POCSO and rape charges..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={6}
                            />
                        </div>

                        <div className="modal-controls">
                            <div className="control-group">
                                <label>Draft in</label>
                                <select className="select-input">
                                    <option>English</option>
                                    <option>Hindi</option>
                                    <option>Spanish</option>
                                </select>
                            </div>

                            <div className="premium-feature">
                                <input type="checkbox" disabled />
                                <div className="feature-info">
                                    <span className="feature-title">Deep thinking (more accurate draft generation but takes longer)</span>
                                    <span className="feature-sub">Available with a paid plan.</span>
                                </div>
                                <Lock size={16} className="lock-icon" />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
                        </div>
                    </div>
                ) : step === 3 ? (
                    // Step 3: Format Selection
                    <div className="step-content fade-in">
                        {isLoading ? (
                            <div className="loading-state">
                                <Loader2 size={48} className="spinner" />
                                <h3 style={{ marginTop: '16px', fontSize: '1.2rem', fontWeight: 600 }}>Generating your draft...</h3>
                                <p style={{ color: '#666', marginTop: '8px' }}>Our AI is preparing your {selectedFormat?.name} based on your prompt.</p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <div className="icon-badge">
                                        <FileText size={20} />
                                    </div>
                                    <h2 className="modal-title">Choose a format for your draft</h2>
                                </div>

                                <p className="modal-subtitle">Based on your prompt, here are the best matching formats:</p>

                                <div className="format-selection-layout">
                                    <div className="formats-grid">
                                        {mockFormats.map((format) => (
                                            <button
                                                key={format.id}
                                                className={`format-card ${selectedFormat?.id === format.id ? 'selected' : ''}`}
                                                onClick={() => handleFormatSelect(format)}
                                            >
                                                <div className="format-header">
                                                    <div className="format-icon">
                                                        <FileText size={20} />
                                                    </div>
                                                    {selectedFormat?.id === format.id && (
                                                        <div className="selected-badge">
                                                            <Check size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3>{format.name}</h3>
                                                <p>{format.description}</p>
                                                <button
                                                    className="preview-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePreviewToggle(format.id);
                                                    }}
                                                >
                                                    {previewingFormat === format.id ? (
                                                        <><EyeOff size={14} /> Hide Preview</>
                                                    ) : (
                                                        <><Eye size={14} /> Preview</>
                                                    )}
                                                </button>
                                            </button>
                                        ))}
                                    </div>

                                    {previewingFormat && (
                                        <div className="preview-panel" ref={previewRef}>
                                            <div className="preview-header">
                                                <span>Document Preview</span>
                                                <div className="zoom-controls">
                                                    <button onClick={handleZoomOut} title="Zoom Out">
                                                        <ZoomOut size={14} />
                                                    </button>
                                                    <span className="zoom-level">{previewZoom}%</span>
                                                    <button onClick={handleZoomIn} title="Zoom In">
                                                        <ZoomIn size={14} />
                                                    </button>
                                                </div>
                                                <button onClick={() => setPreviewingFormat(null)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="preview-content">
                                                <div
                                                    className="zoom-wrapper"
                                                    style={{
                                                        width: `${280 * previewZoom / 100}px`,
                                                        height: `${396 * previewZoom / 100}px`
                                                    }}
                                                >
                                                    <div className="a4-page" style={{ transform: `scale(${previewZoom / 100})` }}>
                                                        <pre>{mockFormats.find(f => f.id === previewingFormat)?.preview}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleContinue}
                                        disabled={!selectedFormat}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default DraftingModal;
