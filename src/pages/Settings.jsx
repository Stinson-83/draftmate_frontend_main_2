import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniEditor from '../components/MiniEditor';

const Settings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        headerText: '', // Now stores HTML
        footerText: '', // Now stores HTML
        companyName: '',
    });

    useEffect(() => {
        const saved = localStorage.getItem('user_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    // Helper for MiniEditor changes
    const handleEditorChange = (field, htmlContent) => {
        setSettings(prev => ({ ...prev, [field]: htmlContent }));
    };

    const handleSave = () => {
        localStorage.setItem('user_settings', JSON.stringify(settings));
        toast.success('Settings saved successfully!');
    };

    return (
        <div className="settings-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="settings-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1>Document Settings</h1>
            </div>

            <div className="settings-section glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Letterhead & Footer</h2>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Header / Letterhead Content
                        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>(Appears on First Page only)</span>
                    </label>
                    <MiniEditor
                        value={settings.headerText}
                        onChange={(html) => handleEditorChange('headerText', html)}
                        placeholder="Enter company name, address..."
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Footer Content
                        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>(Appears on Last Page only)</span>
                    </label>
                    <MiniEditor
                        value={settings.footerText}
                        onChange={(html) => handleEditorChange('footerText', html)}
                        placeholder="Confidentiality notice, etc..."
                    />
                </div>

                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.8rem 1.5rem',
                        fontSize: '1rem'
                    }}
                >
                    <Save size={18} />
                    Save Preferences
                </button>
            </div>
        </div>
    );
};

export default Settings;
