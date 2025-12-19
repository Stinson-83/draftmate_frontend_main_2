import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, PenTool, Lock, Eye, EyeOff, FileText, Loader2, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './DraftingModal.css';

const DraftingModal = ({ onClose }) => {
    const [step, setStep] = useState(2);
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

    // State for formats
    const [formats, setFormats] = useState([]);

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

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter details about what you want to draft");
            return;
        }

        try {
            setIsLoading(true);
            // Move to step 3 immediately so user sees loading state there if preferred, 
            // OR keep a loading toast here. 
            // Current design calls for a loading spinner in step 3... 
            // BUT existing code showed step 3 -> loading.
            // Let's set step 3 and reuse the loading state there.
            setStep(3);

            const response = await fetch(`${CONVERTER_API_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_query: prompt })
            });

            if (!response.ok) throw new Error('Search failed');

            const result = await response.json();

            // Format best match
            const bestMatch = {
                id: result.doc_id,
                name: result.title,
                description: 'Best Match found based on your requirements.',
                s3_path: result.s3_path,
                preview: null // Lazy load
            };

            // Format alternatives (take top 2)
            const alternatives = (result.alternatives || []).slice(0, 2).map((alt, index) => ({
                id: alt.doc_id || `alt-${index}`,
                name: alt.title,
                description: 'Alternative format that might suit your needs.',
                s3_path: alt.s3_path,
                preview: null
            }));

            setFormats([bestMatch, ...alternatives]);

        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to find formats. Please try again.");
            // Fallback to empty or handle gracefully? 
            // For now, staying on step 3 but empty formats might be bad.
            // Maybe go back? or show retry?
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormatSelect = (format) => {
        setSelectedFormat(format);
    };

    const handlePreviewToggle = async (formatId) => {
        if (previewingFormat === formatId) {
            setPreviewingFormat(null);
            return;
        }

        const formatToPreview = formats.find(f => f.id === formatId);
        if (!formatToPreview) return;

        setPreviewingFormat(formatId);

        // Fetch preview content if not already loaded
        if (!formatToPreview.preview && formatToPreview.s3_path) {
            try {
                // Show a loading indicator in the preview area? 
                // For now we just wait for the fetch.
                const response = await fetch(`${CONVERTER_API_URL}/download-template-html`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s3_path: formatToPreview.s3_path })
                });

                if (response.ok) {
                    const htmlText = await response.text();

                    // Update state with new preview content
                    setFormats(prev => prev.map(f =>
                        f.id === formatId ? { ...f, preview: htmlText } : f
                    ));
                }
            } catch (error) {
                console.error("Preview fetch error:", error);
                toast.error("Failed to load preview.");
            }
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
                    selectedFormat: selectedFormat.name,
                    // If we have the HTML content already (from preview), we could pass it?
                    // But typically generation is a separate process.
                    // For now, sticking to current flow.
                }
            });
        }, 1500);
    };

    // Drafter API URL
    const DRAFTER_API_URL = "http://127.0.0.1:8001";

    const handleGenerateViaAI = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter details about what you want to draft");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${DRAFTER_API_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_context: prompt,
                    document_type: selectedFormat?.name || "Legal Document",
                    // legal_documents: ... (if we had specific reference docs selected, could pass them here)
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Generation failed');
            }

            const data = await response.json();

            // Assume data.draft contains the generated HTML/text
            navigate('/editor', {
                state: {
                    htmlContent: data.draft, // The API returns markdown/text, Editor might expect HTML. 
                    // If the Editor expects raw HTML, we might need to convert MD to HTML or ensure API returns what's expected.
                    // Based on legal_draft.py it returns text. If Editor handles text/html indiscriminately or uses a markdown viewer, great.
                    // Looking at previous step 41, it passes `htmlContent`.
                    uploadDetails: `AI Generated Draft: ${selectedFormat?.name || 'Custom'}`,
                    isEmpty: false,
                    prompt: prompt
                }
            });
            toast.success("Draft generated successfully!");

        } catch (error) {
            console.error("AI Generation error:", error);
            toast.error(`Failed to generate draft: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
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

                        <p className="modal-subtitle">Include important details and facts of the case to get accurate format for the Draft</p>

                        <div className="input-area">
                            <textarea
                                placeholder="e.g. My client wants to file a petition for divorce"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={6}
                            />
                        </div>

                        <div className="modal-controls">
                            {/* can be used to give language options */}
                            {/* <div className="control-group">
                                <label>Draft in</label>
                                <select className="select-input">
                                    <option>English</option>
                                    <option>Hindi</option>
                                    <option>Spanish</option>
                                </select>
                            </div> */}

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
                                <p style={{ color: '#666', marginTop: '8px' }}>Our AI is preparing your {selectedFormat?.name || 'custom draft'} based on your prompt.</p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <div className="icon-badge">
                                        <FileText size={20} />
                                    </div>
                                    <h2 className="modal-title">Choose a format for your draft</h2>
                                </div>

                                <p className="modal-subtitle">Here are the best matching formats according to your draft:</p>

                                <div className="format-selection-layout">
                                    <div className="formats-grid">
                                        {formats.map((format) => (
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
                                                        {formats.find(f => f.id === previewingFormat)?.preview ? (
                                                            <div dangerouslySetInnerHTML={{ __html: formats.find(f => f.id === previewingFormat).preview }} />
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                                <Loader2 className="spinner" size={32} style={{ color: '#4f46e5' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                                    <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={handleGenerateViaAI}
                                            style={{ border: '1px solid #e2e8f0' }}
                                        >
                                            Generate via AI
                                        </button>

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleContinue}
                                            disabled={!selectedFormat}
                                        >
                                            Continue
                                        </button>
                                    </div>
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
