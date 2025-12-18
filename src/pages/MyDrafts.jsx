import React, { useState, useEffect } from 'react';
import { FileText, Clock, MoreVertical, Trash2, Search, Download, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyDrafts = () => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Load drafts from localStorage
        const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        // Sort by date descending
        const sortedDrafts = savedDrafts.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        setDrafts(sortedDrafts);
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this draft?')) {
            const updatedDrafts = drafts.filter(draft => draft.id !== id);
            setDrafts(updatedDrafts);
            localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
        }
    };

    const handleOpenDraft = (draft) => {
        navigate('/editor', {
            state: {
                htmlContent: draft.content,
                // Pass other state like placeholders if saved
                placeholders: draft.placeholders || [],
                uploadDetails: `Draft: ${draft.name}`,
                isEmpty: false,
                isSavedDraft: true, // Flag to indicate exact restore
                id: draft.id
            }
        });
    };

    const filteredDrafts = drafts.filter(draft =>
        draft.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>My Drafts</h2>
                    <div className="search-box" style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            placeholder="Search drafts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '8px 12px 8px 36px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                width: '240px'
                            }}
                        />
                    </div>
                </div>

                {filteredDrafts.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        color: '#64748b'
                    }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3>No drafts found</h3>
                        <p>Drafts you save will appear here.</p>
                    </div>
                ) : (
                    <div className="drafts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredDrafts.map(draft => (
                            <div
                                key={draft.id}
                                className="draft-card glass-panel"
                                onClick={() => handleOpenDraft(draft)}
                                style={{
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div className="icon-badge" style={{ background: '#eff6ff', color: '#4f46e5', padding: '10px', borderRadius: '10px' }}>
                                        <FileText size={20} />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(draft.id, e)}
                                        className="btn-icon"
                                        style={{ color: '#ef4444', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                                    {draft.name || 'Untitled Draft'}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                                    <Clock size={12} />
                                    <span>Last edited: {new Date(draft.lastModified).toLocaleDateString()}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: '1px solid #353f4dff',
                                            background: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit size={14} /> Open
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MyDrafts;
