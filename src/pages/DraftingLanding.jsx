import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DraftingModal from '../components/DraftingModal';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';
import { toast } from 'sonner';
import { 
  Plus, UploadCloud, FolderClosed, Users, FileSignature, 
  Sparkles, Search, CheckCircle, PencilRuler, HelpCircle 
} from 'lucide-react';
import './DraftingLanding.css';

const ensureDocxFilename = (filename, fallback = 'Untitled Draft') => {
    const raw = String(filename || fallback).trim() || fallback;
    if (raw.toLowerCase().endsWith('.docx') || raw.toLowerCase().endsWith('.pdf')) {
        return raw;
    }
    return `${raw}.docx`;
};

const DraftingLanding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [initialDraftingPrompt, setInitialDraftingPrompt] = useState('');
    const fileInputRef = useRef(null);

    const saveDeskDraftRecord = (record) => {
        const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        const nextRecord = {
            ...record,
            id: record.id || record.documentKey || Date.now().toString(),
            name: record.name || record.filename || record.title || 'Untitled Draft',
            filename: ensureDocxFilename(record.filename || record.name || record.title || 'Untitled Draft'),
            documentKey: record.documentKey || record.id || '',
            lastModified: record.lastModified || new Date().toISOString(),
            status: record.status || 'In progress',
            trackingParams: record.trackingParams || {
                source: 'drafting_landing_upload',
                documentKey: record.documentKey || record.id || '',
                filename: ensureDocxFilename(record.filename || record.name || record.title || 'Untitled Draft'),
                updatedAt: record.lastModified || new Date().toISOString(),
                folderId: record.folderId ?? null,
            },
        };

        const updatedDrafts = [
            ...savedDrafts.filter((draft) => String(draft.id) !== String(nextRecord.id)),
            nextRecord,
        ];

        localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
        window.dispatchEvent(new Event('my_drafts_updated'));
    };

    useEffect(() => {
        if (location.state?.openDrafting) {
            setInitialDraftingPrompt(location.state.prompt || '');
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleCreateNewClick = () => {
        setInitialDraftingPrompt('');
        setIsModalOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        let sessionId = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('user_id');
        if (!sessionId) {
            sessionId = 'user_session_' + Date.now();
            localStorage.setItem('session_id', sessionId);
        }

        setIsUploading(true);
        const uploadToast = toast.loading(`Uploading ${files.length} document${files.length > 1 ? 's' : ''}...`);
        
        const uploadedRecords = [];

        try {
            const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/upload`;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (files.length > 1) {
                    toast.loading(`Uploading (${i + 1}/${files.length}): "${file.name}"...`, { id: uploadToast });
                }

                const formData = new FormData();
                formData.append('file', file);
                formData.append('session_id', sessionId);

                const response = await axios.post(url, formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${sessionId}`
                    },
                });
                const data = response.data;

                const record = {
                    id: data.documentKey,
                    name: data.filename,
                    filename: data.filename,
                    documentKey: data.documentKey,
                    onlyofficeConfig: data,
                    variablesDetected: data.variablesDetected || [],
                    status: 'In progress',
                    source: 'drafting_landing_upload',
                    trackingParams: {
                        source: 'drafting_landing_upload',
                        documentKey: data.documentKey,
                        filename: data.filename,
                        uploadedAt: new Date().toISOString(),
                    },
                };

                saveDeskDraftRecord(record);
                uploadedRecords.push(record);
            }

            toast.dismiss(uploadToast);
            if (uploadedRecords.length > 1) {
                toast.success(`${uploadedRecords.length} documents uploaded & saved to My Drafts!`);
            } else {
                toast.success("Document uploaded successfully!");
            }

            const firstDoc = uploadedRecords[0];
            navigate('/dashboard/workspace', {
                state: {
                    documentKey: firstDoc.documentKey,
                    filename: firstDoc.filename,
                    onlyofficeConfig: firstDoc.onlyofficeConfig,
                    variablesDetected: firstDoc.variablesDetected || [],
                    uploadedDrafts: uploadedRecords,
                    trackingParams: firstDoc.trackingParams,
                }
            });
        } catch (error) {
            console.error('Upload failed:', error);
            if (error.response?.status === 401) {
                const freshSession = 'user_session_' + Date.now();
                localStorage.setItem('session_id', freshSession);
                try {
                    const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/upload`;
                    const retryRecords = [];
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('session_id', freshSession);

                        const response = await axios.post(url, formData, {
                            headers: { 
                                'Content-Type': 'multipart/form-data',
                                'Authorization': `Bearer ${freshSession}`
                            },
                        });
                        const data = response.data;
                        const record = {
                            id: data.documentKey,
                            name: data.filename,
                            filename: data.filename,
                            documentKey: data.documentKey,
                            onlyofficeConfig: data,
                            variablesDetected: data.variablesDetected || [],
                            status: 'In progress',
                            source: 'drafting_landing_upload',
                            trackingParams: {
                                source: 'drafting_landing_upload',
                                documentKey: data.documentKey,
                                filename: data.filename,
                                uploadedAt: new Date().toISOString(),
                            },
                        };
                        saveDeskDraftRecord(record);
                        retryRecords.push(record);
                    }
                    toast.dismiss(uploadToast);
                    toast.success("Document uploaded successfully!");
                    const firstDoc = retryRecords[0];
                    navigate('/dashboard/workspace', {
                        state: {
                            documentKey: firstDoc.documentKey,
                            filename: firstDoc.filename,
                            onlyofficeConfig: firstDoc.onlyofficeConfig,
                            variablesDetected: firstDoc.variablesDetected || [],
                            uploadedDrafts: retryRecords,
                            trackingParams: firstDoc.trackingParams,
                        }
                    });
                    return;
                } catch (retryErr) {
                    console.error('Retry failed:', retryErr);
                }
            }
            toast.dismiss(uploadToast);
            const serverMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
            toast.error(`Upload failed: ${serverMsg || 'Please try again.'}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="drafting-landing-container">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".pdf,.docx,.doc,.rtf,.txt"
                multiple
                style={{ display: 'none' }} 
            />

            {/* 🚀 Hero Section */}
            <header className="drafting-hero">
                <h1 className="hero-title">
                    Draft, Research, and Collaborate—All in One Intelligent Workspace.
                </h1>
                <p className="hero-quote">
                    “A powerful, MS Word-compatible drafting engine supercharged with real-time multi-user collaboration, inline AI assistance, and instant legal research. Co-author briefs from scratch or optimize existing documents simultaneously with your team.”
                </p>
            </header>

            {/* 📥 Workspace Entry Points (Launchpad) */}
            <section className="launchpad-grid">
                {/* Card 1: Create New */}
                <div className="launchpad-card hover-lift" onClick={handleCreateNewClick}>
                    <div className="card-icon-wrapper bg-blue-50 text-blue-600">
                        <Plus className="h-6 w-6" />
                    </div>
                    <div className="card-badge bg-blue-100 text-blue-800">AI-Powered</div>
                    <h3 className="card-title">Create New Draft</h3>
                    <p className="card-desc">
                        Start a fresh document with interactive AI generation or open a blank workspace ready for live team collaboration.
                    </p>
                </div>

                {/* Card 2: Upload */}
                <div className="launchpad-card hover-lift" onClick={handleUploadClick}>
                    <div className="card-icon-wrapper bg-emerald-50 text-emerald-600">
                        <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="card-badge bg-emerald-100 text-emerald-800">Word Compatible</div>
                    <h3 className="card-title">Work on Existing Document</h3>
                    <p className="card-desc">
                        Upload a `.docx` or `.pdf` file to seamlessly continue your work in a fully collaborative, Word-compatible editor.
                    </p>
                </div>

                {/* Card 3: Review */}
                <div className="launchpad-card hover-lift" onClick={() => navigate('/dashboard/drafts')}>
                    <div className="card-icon-wrapper bg-indigo-50 text-indigo-600">
                        <FolderClosed className="h-6 w-6" />
                    </div>
                    <div className="card-badge bg-indigo-100 text-indigo-800">Team Library</div>
                    <h3 className="card-title">Review Your Drafts</h3>
                    <p className="card-desc">
                        Jump back into your previously created documents, check team edit histories, and finalize your text.
                    </p>
                </div>
            </section>

            {/* ✨ Features Highlight Grid */}
            <section className="features-grid-section">
                <h2 className="section-title">Inside the Drafting Suite</h2>
                <div className="features-grid">
                    
                    <div className="feature-card">
                        <div className="feature-header">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <h4>Real-Time Multi-User Collaboration</h4>
                        </div>
                        <p>
                            Invite partners, clients, or co-counsel to the document. Write, edit, and track changes together in perfect real-time sync.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-header">
                            <FileSignature className="h-5 w-5 text-blue-600" />
                            <h4>Familiar MS Word Compatibility</h4>
                        </div>
                        <p>
                            No learning curve. Enjoy full rich-text editing capabilities, standard legal shortcuts, and perfect document integrity with zero formatting losses.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-header">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            <h4>Contextual Inline AI Enhancer</h4>
                        </div>
                        <p>
                            Highlight any clause to rewrite, expand, or change the legal tone. Use follow-up AI prompts to polish specific paragraphs on the fly.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-header">
                            <Search className="h-5 w-5 text-amber-600" />
                            <h4>Legal Research Assistant</h4>
                        </div>
                        <p>
                            Stop jumping between tabs. A built-in sidebar lets you pull up case law, statutes, and precedents directly next to your live workspace canvas.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-header">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <h4>One-Click Auto-Formatting</h4>
                        </div>
                        <p>
                            Select text and instantly structure it into standard jurisdiction legal templates. Includes clear descriptions of applied format changes.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-header">
                            <PencilRuler className="h-5 w-5 text-rose-600" />
                            <h4>From-Scratch AI Generation</h4>
                        </div>
                        <p>
                            Stuck on a blank page? Feed the AI your core arguments and facts to automatically generate highly technical, structured legal drafts in seconds.
                        </p>
                    </div>

                </div>
            </section>

            {/* AI Generator Modal */}
            {isModalOpen && (
                <DraftingModal 
                    onClose={() => setIsModalOpen(false)} 
                    initialPrompt={initialDraftingPrompt} 
                    initialEntryMode="dashboard"
                    onDraftCreated={saveDeskDraftRecord}
                />
            )}
        </div>
    );
};

export default DraftingLanding;
