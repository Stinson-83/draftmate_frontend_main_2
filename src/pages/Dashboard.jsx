import React, { useState } from 'react';
import { PenTool, FilePlus, Search, Upload, MessageSquare, FileText, Scale, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import DraftingModal from '../components/DraftingModal';
import UploadModal from '../components/UploadModal';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const fileInputRef = React.useRef(null);

    const handleDraftingClick = () => {
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
            const response = await axios.post('http://localhost:8000/convert', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setHtmlContent(response.data);
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
                        icon={Search}
                        title="Review Your Draft"
                        description="Upload your draft and let AI improve grammar and check errors."
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
                        icon={FileText}
                        title="Legal Memo"
                        description="Prepare comprehensive Legal Memo with citations."
                    />
                    <ActionCard
                        icon={MessageSquare}
                        title="Chat with PDF"
                        description="Upload a PDF and ask questions about it."
                    />
                    <ActionCard
                        icon={BookOpen}
                        title="Generate Arguments"
                        description="Tell AI about the case and generate arguments."
                    />
                </div>
            </section>

            {isModalOpen && <DraftingModal onClose={() => setIsModalOpen(false)} />}

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
