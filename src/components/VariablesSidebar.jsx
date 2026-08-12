import React from 'react';
import { ChevronLeft, ChevronRight, Trash2, RotateCcw } from 'lucide-react';

const VariablesSidebar = ({
    isOpen,
    toggle,
    placeholders,
    deletedPlaceholders,
    variablesBold,
    setVariablesBold,
    onPlaceholderChange,
    onRemovePlaceholder,
    onRestorePlaceholder
}) => {
    return (
        <div className={`editor-sidebar left glass-panel ${!isOpen ? 'collapsed' : ''}`}>
            <div className="sidebar-title">
                {isOpen && <h3>Variables</h3>}
                <button className="toggle-btn" onClick={toggle}>
                    {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>
            {isOpen && (
                <>
                    <div className="sidebar-header-content">
                        <span
                            className="badge"
                            style={{
                                backgroundColor: placeholders.filter(p => !p.value).length === 0 ? '#10b981' : undefined,
                                color: placeholders.filter(p => !p.value).length === 0 ? 'white' : undefined
                            }}
                        >
                            {placeholders.filter(p => !p.value).length === 0
                                ? 'All filled'
                                : `${placeholders.filter(p => !p.value).length} missing`
                            }
                        </span>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer', marginLeft: 'auto', color: '#666' }}>
                            <input
                                type="checkbox"
                                checked={variablesBold}
                                onChange={(e) => setVariablesBold(e.target.checked)}
                                style={{ marginRight: '5px' }}
                            />
                            Bold Variables
                        </label>
                    </div>
                    <div className="placeholders-list">
                        {placeholders.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                                <p>No placeholders detected</p>
                            </div>
                        ) : (
                            placeholders.map(p => (
                                <div key={p.key} className="placeholder-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ marginBottom: 0 }}>{p.label}</label>
                                        <button
                                            onClick={() => onRemovePlaceholder(p.key)}
                                            className="btn-ghost"
                                            title="Remove variable"
                                            style={{ padding: '2px', height: 'auto', color: '#999' }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={p.value}
                                        onChange={(e) => onPlaceholderChange(p.key, e.target.value)}
                                        placeholder={`Enter ${p.label}`}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {deletedPlaceholders.length > 0 && (
                        <div className="deleted-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
                            <h4 style={{ fontSize: '12px', color: '#999', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Deleted Variables
                            </h4>
                            {deletedPlaceholders.map(p => (
                                <div key={p.key} className="placeholder-item deleted" style={{ opacity: 0.7 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ textDecoration: 'line-through', color: '#999', marginBottom: 0 }}>{p.label}</label>
                                        <button
                                            onClick={() => onRestorePlaceholder(p.key)}
                                            className="btn-ghost"
                                            title="Restore variable"
                                            style={{ padding: '2px', height: 'auto', color: '#4caf50' }}
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VariablesSidebar;
