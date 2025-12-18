
import React, { useState } from 'react';
import { X, Calculator, RotateCcw } from 'lucide-react';
import './DraftingModal.css'; // Reusing modal styles for consistency
import { getCourtFee, supportedStates } from '../utils/courtFeeLogic';

const CourtFeeModal = ({ onClose }) => {
    const [state, setState] = useState('');
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        setError('');
        setResult(null);

        if (!state) {
            setError('Please select a state.');
            return;
        }
        if (!amount || isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        const res = getCourtFee(state, amount);
        if (res.error) {
            setError(res.error);
        } else {
            setResult(res);
        }
    };

    const handleReset = () => {
        setState('');
        setAmount('');
        setResult(null);
        setError('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header" style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="icon-wrapper" style={{ margin: '0 0 12px 0', width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calculator size={24} color="#4f46e5" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Court Fee Calculator</h2>
                    <p style={{ marginTop: '4px', color: '#64748b', fontSize: '14px', maxWidth: '90%' }}>
                        Calculate Ad-Valorem Court Fees for law suits across different states in India.
                    </p>
                </div>

                <div className="modal-body">
                    {/* State Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="input-label" style={{ fontSize: '14px', marginBottom: '6px', display: 'block' }}>Select State</label>
                        <select
                            className="input-field"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                        >
                            <option value="">Select State</option>
                            {supportedStates.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label className="input-label" style={{ fontSize: '14px', marginBottom: '6px', display: 'block' }}>Enter Amount (₹)</label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="e.g. 100000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                        />
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            Do not use commas or special characters.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '12px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div style={{
                            padding: '16px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <h4 style={{ color: '#1e40af', margin: '0 0 4px 0', fontSize: '14px' }}>Result</h4>
                            <p style={{ margin: 0, color: '#1e293b', fontSize: '14px' }}>
                                Ad-Valorem Court Fees for valuation of <span style={{ fontWeight: 600 }}>₹{result.amount}</span>
                                <br />for <span style={{ fontWeight: 600 }}>{result.state}</span> is:
                            </p>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#2563eb',
                                marginTop: '12px'
                            }}>
                                ₹{result.courtFees}/-
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', lineHeight: '1.4', fontStyle: 'italic' }}>
                                "The calculations is based on publicly available information and have been prepared with due care. Users are advised to independently verify the calculated court fee. We bear no responsibility of any error of any kind."
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleCalculate}
                            style={{ flex: 1, justifyContent: 'center', background: '#e11d48', border: 'none', padding: '12px', fontSize: '15px' }}
                        >
                            Calculate
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={handleReset}
                            style={{ flex: 1, justifyContent: 'center', color: '#e11d48', border: '1px solid #e11d48', background: 'transparent', padding: '12px', fontSize: '15px' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourtFeeModal;
