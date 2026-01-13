import React, { useState } from 'react';
import { X, Printer, Download, FileText, Settings2 } from 'lucide-react';
import './PrintModal.css';

const PrintModal = ({
    isOpen,
    onClose,
    onPrint,
    onDownloadPDF,
    onDownloadWord,
    totalPages = 1
}) => {
    const [pageRange, setPageRange] = useState('all'); // 'all', 'current', 'custom'
    const [fromPage, setFromPage] = useState(1);
    const [toPage, setToPage] = useState(totalPages);
    const [orientation, setOrientation] = useState('portrait'); // 'portrait', 'landscape'
    const [paperSize, setPaperSize] = useState('a4'); // 'a4', 'letter', 'legal'
    const [includePageNumbers, setIncludePageNumbers] = useState(true);
    const [includeHeaders, setIncludeHeaders] = useState(true);

    if (!isOpen) return null;

    const handlePrint = () => {
        const options = {
            pageRange: pageRange === 'custom' ? { from: fromPage, to: toPage } : pageRange,
            orientation,
            paperSize,
            includePageNumbers,
            includeHeaders
        };
        onPrint(options);
        onClose();
    };

    const handleDownloadPDF = () => {
        const options = {
            pageRange: pageRange === 'custom' ? { from: fromPage, to: toPage } : pageRange,
            orientation,
            paperSize,
            includePageNumbers,
            includeHeaders
        };
        onDownloadPDF(options);
        onClose();
    };

    return (
        <div className="print-modal-overlay" onClick={onClose}>
            <div className="print-modal glass-panel" onClick={e => e.stopPropagation()}>
                <div className="print-modal-header">
                    <h2><Printer size={20} /> Print & Download</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="print-modal-body">
                    {/* Page Range Section */}
                    <div className="print-section">
                        <h3><FileText size={16} /> Page Range</h3>
                        <div className="print-options">
                            <label className={`print-option ${pageRange === 'all' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="pageRange"
                                    checked={pageRange === 'all'}
                                    onChange={() => setPageRange('all')}
                                />
                                <span>All Pages</span>
                                <small>1 - {totalPages}</small>
                            </label>
                            <label className={`print-option ${pageRange === 'current' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="pageRange"
                                    checked={pageRange === 'current'}
                                    onChange={() => setPageRange('current')}
                                />
                                <span>Current Page</span>
                            </label>
                            <label className={`print-option ${pageRange === 'custom' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="pageRange"
                                    checked={pageRange === 'custom'}
                                    onChange={() => setPageRange('custom')}
                                />
                                <span>Custom Range</span>
                            </label>
                        </div>

                        {pageRange === 'custom' && (
                            <div className="custom-range">
                                <div className="range-input">
                                    <label>From</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={fromPage}
                                        onChange={e => setFromPage(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalPages)))}
                                    />
                                </div>
                                <span className="range-separator">to</span>
                                <div className="range-input">
                                    <label>To</label>
                                    <input
                                        type="number"
                                        min={fromPage}
                                        max={totalPages}
                                        value={toPage}
                                        onChange={e => setToPage(Math.max(fromPage, Math.min(parseInt(e.target.value) || totalPages, totalPages)))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Layout Section */}
                    <div className="print-section">
                        <h3><Settings2 size={16} /> Layout</h3>
                        <div className="layout-options">
                            <div className="orientation-selector">
                                <label>Orientation</label>
                                <div className="orientation-buttons">
                                    <button
                                        className={`orientation-btn ${orientation === 'portrait' ? 'active' : ''}`}
                                        onClick={() => setOrientation('portrait')}
                                    >
                                        <div className="orientation-icon portrait"></div>
                                        Portrait
                                    </button>
                                    <button
                                        className={`orientation-btn ${orientation === 'landscape' ? 'active' : ''}`}
                                        onClick={() => setOrientation('landscape')}
                                    >
                                        <div className="orientation-icon landscape"></div>
                                        Landscape
                                    </button>
                                </div>
                            </div>

                            <div className="paper-selector">
                                <label>Paper Size</label>
                                <select value={paperSize} onChange={e => setPaperSize(e.target.value)}>
                                    <option value="a4">A4 (210 × 297 mm)</option>
                                    <option value="letter">Letter (8.5 × 11 in)</option>
                                    <option value="legal">Legal (8.5 × 14 in)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Options Section */}
                    <div className="print-section">
                        <h3>Options</h3>
                        <div className="checkbox-options">
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={includePageNumbers}
                                    onChange={e => setIncludePageNumbers(e.target.checked)}
                                />
                                <span>Include Page Numbers</span>
                            </label>
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={includeHeaders}
                                    onChange={e => setIncludeHeaders(e.target.checked)}
                                />
                                <span>Include Headers & Footers</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="print-modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <div className="action-buttons">
                        <button className="btn btn-outline" onClick={handleDownloadPDF}>
                            <Download size={16} />
                            Download PDF
                        </button>
                        {onDownloadWord && (
                            <button className="btn btn-outline" onClick={() => { onDownloadWord(); onClose(); }}>
                                <FileText size={16} />
                                Download Word
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={handlePrint}>
                            <Printer size={16} />
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintModal;
