import React, { useState, useEffect } from 'react';
import { PenTool, FilePlus, Search, Upload, MessageSquare, FileText, Scale, BookOpen, Calculator } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import DraftingModal from '../components/DraftingModal';
import UploadModal from '../components/UploadModal';
import CourtFeeModal from '../components/CourtFeeModal';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [initialDraftingPrompt, setInitialDraftingPrompt] = useState('');
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (location.state?.openDrafting) {
            setInitialDraftingPrompt(location.state.prompt || '');
            setIsModalOpen(true);
            // Clear state so it doesn't reopen on refresh? 
            // React Router state persists on refresh usually, but clearing it might be good.
            // But modifying history is side-effect. Let's just consume it.
            // Actually, better to clear it to avoid reopening if they close and navigate back/forth?
            // For now, just opening is enough.
            window.history.replaceState({}, document.title)
        }
    }, [location]);

    const handleDraftingClick = () => {
        setInitialDraftingPrompt('');
        setIsModalOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Show loading state if needed, for now just blocking
            const url = `${API_CONFIG.CONVERTER.BASE_URL}${API_CONFIG.CONVERTER.ENDPOINTS.CONVERT}`;
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setHtmlContent(response.data);
            // DEBUG: Show content length
            // alert(`Uploaded content length: ${response.data?.length}`);
            console.log('Uploaded content:', response.data);
            setIsUploadModalOpen(true);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload and convert document. Please try again.');
        }
    };

    const handleUploadSubmit = ({ details, supportingDocs }) => {
        navigate('/editor', {
            state: {
                htmlContent,
                uploadDetails: details,
                supportingDocs
            }
        });
    };

    const handleUploadSkip = () => {
        navigate('/editor', { state: { htmlContent } });
    };

    const ActionCard = ({ icon: Icon, title, description, primary = false, onClick }) => (
        <div className={`action-card ${primary ? 'primary' : ''}`} onClick={onClick}>
            <div className="icon-wrapper">
                <Icon size={24} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );

    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <h2 className="section-title">Draft</h2>
                <div className="cards-grid">
                    <ActionCard
                        icon={PenTool}
                        title="AI Legal Drafting"
                        description="Start by drafting and do legal research side by side."
                        primary={true}
                        onClick={handleDraftingClick}
                    />
                    <ActionCard
                        icon={FilePlus}
                        title="Empty Document"
                        description="Start with an empty document without a prompt."
                        onClick={() => navigate('/editor', { state: { isEmpty: true } })}
                    />
                    <ActionCard
                        icon={FileText}
                        title="Review Your Draft"
                        description="Review you previously created drafts."
                        onClick={() => navigate('/drafts')}
                    />
                    <ActionCard
                        icon={Upload}
                        title="Upload your Draft"
                        description="Upload your own draft and start doing drafting and legal research."
                        onClick={handleUploadClick}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                        accept=".pdf,.docx,.doc,.rtf,.txt"
                    />
                </div>
            </section>

            <section className="dashboard-section">
                <h2 className="section-title">Research</h2>
                <div className="cards-grid">
                    <ActionCard
                        icon={Scale}
                        title="AI Legal Research"
                        description="Do accurate legal research by talking to our AI."
                        onClick={() => navigate('/research')}
                    />
                    <ActionCard
                        icon={Calculator}
                        title="Court Fee Calculator"
                        description="Calculate Ad-Valorem Court Fees for your jurisdiction."
                        onClick={() => setIsCourtFeeModalOpen(true)}
                    />

                    <ActionCard
                        icon={BookOpen}
                        title="PDF Toolkit"
                        description="Merge PDFs, Rearrange pages and Convert to DOCX format."
                        onClick={() => navigate('/pdf-editor')}
                    />
                </div>
            </section>

            {isModalOpen && <DraftingModal onClose={() => setIsModalOpen(false)} initialPrompt={initialDraftingPrompt} />}
            {isCourtFeeModalOpen && <CourtFeeModal onClose={() => setIsCourtFeeModalOpen(false)} />}

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSkip={handleUploadSkip}
                onSubmit={handleUploadSubmit}
                fileName={uploadedFileName}
            />
        </div>
    );
};

export default Dashboard;
