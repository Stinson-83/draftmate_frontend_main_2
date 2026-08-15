import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DraftingModal from '../components/DraftingModal';
import UploadModal from '../components/UploadModal';
import CourtFeeModal from '../components/CourtFeeModal';
import InvoiceModal from '../components/InvoiceModal';
import DictationModal from '../components/DictationModal';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';
import './Tools.css';

const ensureDocxFilename = (filename, fallback = 'Untitled Draft') => {
    const raw = String(filename || fallback).trim() || fallback;
    if (raw.toLowerCase().endsWith('.docx') || raw.toLowerCase().endsWith('.pdf')) {
        return raw;
    }
    return `${raw}.docx`;
};

// ════════ ANIMATION VARIANTS ════════
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.2 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 22 }
    }
};

const calculatorGridVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const calcCardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    exit: {
        opacity: 0, scale: 0.8, y: -20,
        transition: { duration: 0.2 }
    }
};

const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalContentVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 25 }
    },
    exit: {
        opacity: 0, scale: 0.9, y: 30,
        transition: { duration: 0.2 }
    }
};

// ════════ GST CALCULATOR ════════
const GSTCalculator = ({ onClose }) => {
    const [amount, setAmount] = useState('');
    const [gstRate, setGstRate] = useState(18);
    const [calcType, setCalcType] = useState('exclusive');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) return;

        let gstAmount, totalAmount, baseAmount;

        if (calcType === 'exclusive') {
            gstAmount = (amt * gstRate) / 100;
            totalAmount = amt + gstAmount;
            baseAmount = amt;
        } else {
            baseAmount = (amt * 100) / (100 + gstRate);
            gstAmount = amt - baseAmount;
            totalAmount = amt;
        }

        setResult({
            baseAmount: baseAmount.toFixed(2),
            cgst: (gstAmount / 2).toFixed(2),
            sgst: (gstAmount / 2).toFixed(2),
            totalGst: gstAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        });
    };

    const reset = () => {
        setAmount('');
        setGstRate(18);
        setCalcType('exclusive');
        setResult(null);
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tools-modal-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalContentVariants}
                    className="tools-modal-content tools-calc-modal"
                >
                    {/* Header */}
                    <div className="tools-calc-modal-header" style={{ '--accent': '#f59e0b' }}>
                        <div className="tools-calc-modal-header-bg" />
                        <div className="tools-calc-modal-header-content">
                            <div className="tools-calc-modal-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div>
                                <h2>GST Calculator</h2>
                                <p>Calculate GST with CGST & SGST breakdown</p>
                            </div>
                        </div>
                        <button className="tools-calc-modal-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="tools-calc-modal-body">
                        {/* Type Toggle */}
                        <div className="tools-calc-toggle-group">
                            <button
                                className={`tools-calc-toggle-btn ${calcType === 'exclusive' ? 'active' : ''}`}
                                onClick={() => { setCalcType('exclusive'); setResult(null); }}
                                style={{ '--accent': '#f59e0b' }}
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                GST Exclusive
                            </button>
                            <button
                                className={`tools-calc-toggle-btn ${calcType === 'inclusive' ? 'active' : ''}`}
                                onClick={() => { setCalcType('inclusive'); setResult(null); }}
                                style={{ '--accent': '#f59e0b' }}
                            >
                                <span className="material-symbols-outlined">remove_circle</span>
                                GST Inclusive
                            </button>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">currency_rupee</span>
                                {calcType === 'exclusive' ? 'Amount (Before GST)' : 'Amount (Including GST)'}
                            </label>
                            <div className="tools-calc-input-wrapper">
                                <span className="tools-calc-input-prefix">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => { setAmount(e.target.value); setResult(null); }}
                                    placeholder="Enter amount"
                                    className="tools-calc-input"
                                />
                            </div>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">percent</span>
                                GST Rate
                            </label>
                            <div className="tools-calc-rate-chips">
                                {[5, 12, 18, 28].map(rate => (
                                    <motion.button
                                        key={rate}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`tools-calc-chip ${gstRate === rate ? 'active' : ''}`}
                                        onClick={() => { setGstRate(rate); setResult(null); }}
                                        style={{ '--accent': '#f59e0b' }}
                                    >
                                        {rate}%
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="tools-calc-btn-row">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-primary"
                                onClick={calculate}
                                style={{ '--accent': '#f59e0b' }}
                            >
                                <span className="material-symbols-outlined">calculate</span>
                                Calculate GST
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-secondary"
                                onClick={reset}
                            >
                                <span className="material-symbols-outlined">refresh</span>
                                Reset
                            </motion.button>
                        </div>

                        {/* Result */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="tools-calc-result-card"
                                    style={{ '--accent': '#f59e0b' }}
                                >
                                    <div className="tools-calc-result-header">
                                        <span className="material-symbols-outlined">analytics</span>
                                        GST Breakdown
                                    </div>
                                    <div className="tools-calc-result-grid">
                                        <div className="tools-calc-result-item">
                                            <span className="label">Base Amount</span>
                                            <span className="value">₹{Number(result.baseAmount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item">
                                            <span className="label">CGST ({gstRate / 2}%)</span>
                                            <span className="value">₹{Number(result.cgst).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item">
                                            <span className="label">SGST ({gstRate / 2}%)</span>
                                            <span className="value">₹{Number(result.sgst).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item">
                                            <span className="label">Total GST ({gstRate}%)</span>
                                            <span className="value highlight">₹{Number(result.totalGst).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item total">
                                            <span className="label">Total Amount</span>
                                            <span className="value total-value">₹{Number(result.totalAmount).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ════════ SIP CALCULATOR ════════
const SIPCalculator = ({ onClose }) => {
    const [monthlyInvestment, setMonthlyInvestment] = useState('');
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [result, setResult] = useState(null);

    const calculate = () => {
        const P = parseFloat(monthlyInvestment);
        const r = parseFloat(expectedReturn) / 100 / 12;
        const n = parseInt(timePeriod) * 12;

        if (isNaN(P) || P <= 0) return;

        const maturityAmount = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        const totalInvested = P * n;
        const wealthGained = maturityAmount - totalInvested;

        setResult({
            totalInvested: totalInvested.toFixed(0),
            wealthGained: wealthGained.toFixed(0),
            maturityAmount: maturityAmount.toFixed(0),
            percentage: ((wealthGained / maturityAmount) * 100).toFixed(1)
        });
    };

    const reset = () => {
        setMonthlyInvestment('');
        setExpectedReturn(12);
        setTimePeriod(10);
        setResult(null);
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tools-modal-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalContentVariants}
                    className="tools-modal-content tools-calc-modal"
                >
                    <div className="tools-calc-modal-header" style={{ '--accent': '#10b981' }}>
                        <div className="tools-calc-modal-header-bg" />
                        <div className="tools-calc-modal-header-content">
                            <div className="tools-calc-modal-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>
                                <span className="material-symbols-outlined">trending_up</span>
                            </div>
                            <div>
                                <h2>SIP Calculator</h2>
                                <p>Plan your mutual fund SIP investments</p>
                            </div>
                        </div>
                        <button className="tools-calc-modal-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="tools-calc-modal-body">
                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">savings</span>
                                Monthly Investment
                            </label>
                            <div className="tools-calc-input-wrapper">
                                <span className="tools-calc-input-prefix">₹</span>
                                <input
                                    type="number"
                                    value={monthlyInvestment}
                                    onChange={(e) => { setMonthlyInvestment(e.target.value); setResult(null); }}
                                    placeholder="e.g. 5000"
                                    className="tools-calc-input"
                                />
                            </div>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">percent</span>
                                Expected Annual Return: <strong>{expectedReturn}%</strong>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={expectedReturn}
                                onChange={(e) => { setExpectedReturn(Number(e.target.value)); setResult(null); }}
                                className="tools-calc-slider"
                                style={{ '--accent': '#10b981', '--progress': `${((expectedReturn - 1) / 29) * 100}%` }}
                            />
                            <div className="tools-calc-slider-labels">
                                <span>1%</span>
                                <span>30%</span>
                            </div>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">schedule</span>
                                Time Period: <strong>{timePeriod} Years</strong>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="40"
                                value={timePeriod}
                                onChange={(e) => { setTimePeriod(Number(e.target.value)); setResult(null); }}
                                className="tools-calc-slider"
                                style={{ '--accent': '#10b981', '--progress': `${((timePeriod - 1) / 39) * 100}%` }}
                            />
                            <div className="tools-calc-slider-labels">
                                <span>1 Year</span>
                                <span>40 Years</span>
                            </div>
                        </div>

                        <div className="tools-calc-btn-row">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-primary"
                                onClick={calculate}
                                style={{ '--accent': '#10b981' }}
                            >
                                <span className="material-symbols-outlined">calculate</span>
                                Calculate Returns
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-secondary"
                                onClick={reset}
                            >
                                <span className="material-symbols-outlined">refresh</span>
                                Reset
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="tools-calc-result-card"
                                    style={{ '--accent': '#10b981' }}
                                >
                                    <div className="tools-calc-result-header">
                                        <span className="material-symbols-outlined">analytics</span>
                                        Investment Summary
                                    </div>

                                    {/* Donut Visual */}
                                    <div className="tools-calc-sip-visual">
                                        <div className="tools-calc-donut">
                                            <svg viewBox="0 0 120 120">
                                                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                                <motion.circle
                                                    cx="60" cy="60" r="50" fill="none"
                                                    stroke="#10b981" strokeWidth="12"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(1 - result.percentage / 100) * 314} 314`}
                                                    strokeDashoffset="0"
                                                    transform="rotate(-90 60 60)"
                                                    initial={{ strokeDasharray: '0 314' }}
                                                    animate={{ strokeDasharray: `${(1 - result.percentage / 100) * 314} 314` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                />
                                                <motion.circle
                                                    cx="60" cy="60" r="50" fill="none"
                                                    stroke="#3b82f6" strokeWidth="12"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(result.percentage / 100) * 314} 314`}
                                                    strokeDashoffset={`${-(1 - result.percentage / 100) * 314}`}
                                                    transform="rotate(-90 60 60)"
                                                    initial={{ strokeDasharray: '0 314' }}
                                                    animate={{ strokeDasharray: `${(result.percentage / 100) * 314} 314` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                                />
                                            </svg>
                                            <div className="tools-calc-donut-center">
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="donut-value"
                                                >
                                                    ₹{Number(result.maturityAmount).toLocaleString('en-IN')}
                                                </motion.span>
                                                <span className="donut-label">Maturity</span>
                                            </div>
                                        </div>
                                        <div className="tools-calc-donut-legend">
                                            <div className="legend-item">
                                                <span className="legend-dot" style={{ background: '#10b981' }} />
                                                <span>Invested: ₹{Number(result.totalInvested).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-dot" style={{ background: '#3b82f6' }} />
                                                <span>Gains: ₹{Number(result.wealthGained).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tools-calc-result-grid">
                                        <div className="tools-calc-result-item">
                                            <span className="label">Total Invested</span>
                                            <span className="value">₹{Number(result.totalInvested).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item">
                                            <span className="label">Wealth Gained</span>
                                            <span className="value highlight" style={{ color: '#10b981' }}>₹{Number(result.wealthGained).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="tools-calc-result-item total">
                                            <span className="label">Maturity Amount</span>
                                            <span className="value total-value">₹{Number(result.maturityAmount).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ════════ SALARY CALCULATOR ════════
const SalaryCalculator = ({ onClose }) => {
    const [ctc, setCTC] = useState('');
    const [bonus, setBonus] = useState('');
    const [regime, setRegime] = useState('new');
    const [result, setResult] = useState(null);

    const calculateTax = (income, regime) => {
        let tax = 0;
        if (regime === 'new') {
            // New Regime FY 2024-25
            const slabs = [
                { limit: 300000, rate: 0 },
                { limit: 300000, rate: 0.05 },
                { limit: 300000, rate: 0.10 },
                { limit: 300000, rate: 0.15 },
                { limit: 300000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];
            let remaining = income;
            for (const slab of slabs) {
                const taxableInSlab = Math.min(remaining, slab.limit);
                tax += taxableInSlab * slab.rate;
                remaining -= taxableInSlab;
                if (remaining <= 0) break;
            }
            // Rebate under 87A for new regime
            if (income <= 700000) tax = 0;
        } else {
            // Old Regime
            const slabs = [
                { limit: 250000, rate: 0 },
                { limit: 250000, rate: 0.05 },
                { limit: 500000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];
            let remaining = income;
            for (const slab of slabs) {
                const taxableInSlab = Math.min(remaining, slab.limit);
                tax += taxableInSlab * slab.rate;
                remaining -= taxableInSlab;
                if (remaining <= 0) break;
            }
            if (income <= 500000) tax = 0;
        }
        // 4% cess
        const cess = tax * 0.04;
        return { tax, cess, totalTax: tax + cess };
    };

    const calculate = () => {
        const annualCTC = parseFloat(ctc);
        const annualBonus = parseFloat(bonus) || 0;

        if (isNaN(annualCTC) || annualCTC <= 0) return;

        const basicSalary = annualCTC * 0.40;
        const hra = annualCTC * 0.20;
        const specialAllowance = annualCTC - basicSalary - hra - annualBonus;
        const epfEmployee = Math.min(basicSalary * 0.12, 21600 * 12);
        const professionalTax = 2400;

        const grossIncome = annualCTC - annualBonus;
        const standardDeduction = 50000;
        const taxableIncome = Math.max(grossIncome - standardDeduction, 0);

        const taxResult = calculateTax(taxableIncome, regime);
        const netAnnualSalary = annualCTC - taxResult.totalTax - epfEmployee - professionalTax;
        const netMonthlySalary = netAnnualSalary / 12;

        setResult({
            basicSalary: basicSalary.toFixed(0),
            hra: hra.toFixed(0),
            specialAllowance: Math.max(specialAllowance, 0).toFixed(0),
            epfEmployee: epfEmployee.toFixed(0),
            professionalTax: professionalTax.toFixed(0),
            taxableIncome: taxableIncome.toFixed(0),
            incomeTax: taxResult.tax.toFixed(0),
            cess: taxResult.cess.toFixed(0),
            totalTax: taxResult.totalTax.toFixed(0),
            netAnnualSalary: netAnnualSalary.toFixed(0),
            netMonthlySalary: netMonthlySalary.toFixed(0)
        });
    };

    const reset = () => {
        setCTC('');
        setBonus('');
        setRegime('new');
        setResult(null);
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tools-modal-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalContentVariants}
                    className="tools-modal-content tools-calc-modal"
                >
                    <div className="tools-calc-modal-header" style={{ '--accent': '#6366f1' }}>
                        <div className="tools-calc-modal-header-bg" />
                        <div className="tools-calc-modal-header-content">
                            <div className="tools-calc-modal-icon" style={{ background: 'rgba(99,102,241,0.2)' }}>
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <div>
                                <h2>Salary Calculator</h2>
                                <p>CTC to in-hand salary with tax breakdown</p>
                            </div>
                        </div>
                        <button className="tools-calc-modal-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="tools-calc-modal-body">
                        <div className="tools-calc-toggle-group">
                            <button
                                className={`tools-calc-toggle-btn ${regime === 'new' ? 'active' : ''}`}
                                onClick={() => { setRegime('new'); setResult(null); }}
                                style={{ '--accent': '#6366f1' }}
                            >
                                <span className="material-symbols-outlined">new_releases</span>
                                New Regime
                            </button>
                            <button
                                className={`tools-calc-toggle-btn ${regime === 'old' ? 'active' : ''}`}
                                onClick={() => { setRegime('old'); setResult(null); }}
                                style={{ '--accent': '#6366f1' }}
                            >
                                <span className="material-symbols-outlined">history</span>
                                Old Regime
                            </button>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">payments</span>
                                Annual CTC
                            </label>
                            <div className="tools-calc-input-wrapper">
                                <span className="tools-calc-input-prefix">₹</span>
                                <input
                                    type="number"
                                    value={ctc}
                                    onChange={(e) => { setCTC(e.target.value); setResult(null); }}
                                    placeholder="e.g. 1200000"
                                    className="tools-calc-input"
                                />
                            </div>
                        </div>

                        <div className="tools-calc-input-group">
                            <label>
                                <span className="material-symbols-outlined">redeem</span>
                                Annual Bonus (Optional)
                            </label>
                            <div className="tools-calc-input-wrapper">
                                <span className="tools-calc-input-prefix">₹</span>
                                <input
                                    type="number"
                                    value={bonus}
                                    onChange={(e) => { setBonus(e.target.value); setResult(null); }}
                                    placeholder="e.g. 100000"
                                    className="tools-calc-input"
                                />
                            </div>
                        </div>

                        <div className="tools-calc-btn-row">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-primary"
                                onClick={calculate}
                                style={{ '--accent': '#6366f1' }}
                            >
                                <span className="material-symbols-outlined">calculate</span>
                                Calculate Salary
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="tools-calc-btn-secondary"
                                onClick={reset}
                            >
                                <span className="material-symbols-outlined">refresh</span>
                                Reset
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="tools-calc-result-card"
                                    style={{ '--accent': '#6366f1' }}
                                >
                                    <div className="tools-calc-result-header">
                                        <span className="material-symbols-outlined">analytics</span>
                                        Salary Breakdown ({regime === 'new' ? 'New' : 'Old'} Regime)
                                    </div>

                                    {/* Highlight Card */}
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="tools-calc-salary-highlight"
                                    >
                                        <div className="salary-highlight-item">
                                            <span className="salary-highlight-label">Monthly In-Hand</span>
                                            <span className="salary-highlight-value">₹{Number(result.netMonthlySalary).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="salary-highlight-divider" />
                                        <div className="salary-highlight-item">
                                            <span className="salary-highlight-label">Annual In-Hand</span>
                                            <span className="salary-highlight-value small">₹{Number(result.netAnnualSalary).toLocaleString('en-IN')}</span>
                                        </div>
                                    </motion.div>

                                    <div className="tools-calc-result-section">
                                        <h4 className="tools-calc-section-title">
                                            <span className="material-symbols-outlined">add_circle</span>
                                            Earnings
                                        </h4>
                                        <div className="tools-calc-result-grid compact">
                                            <div className="tools-calc-result-item">
                                                <span className="label">Basic Salary</span>
                                                <span className="value">₹{Number(result.basicSalary).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="tools-calc-result-item">
                                                <span className="label">HRA</span>
                                                <span className="value">₹{Number(result.hra).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="tools-calc-result-item">
                                                <span className="label">Special Allowance</span>
                                                <span className="value">₹{Number(result.specialAllowance).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tools-calc-result-section">
                                        <h4 className="tools-calc-section-title deductions">
                                            <span className="material-symbols-outlined">remove_circle</span>
                                            Deductions
                                        </h4>
                                        <div className="tools-calc-result-grid compact">
                                            <div className="tools-calc-result-item">
                                                <span className="label">EPF (Employee)</span>
                                                <span className="value deduction">-₹{Number(result.epfEmployee).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="tools-calc-result-item">
                                                <span className="label">Professional Tax</span>
                                                <span className="value deduction">-₹{Number(result.professionalTax).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="tools-calc-result-item">
                                                <span className="label">Income Tax</span>
                                                <span className="value deduction">-₹{Number(result.incomeTax).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="tools-calc-result-item">
                                                <span className="label">Health & Education Cess</span>
                                                <span className="value deduction">-₹{Number(result.cess).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ════════ CALCULATOR HUB MODAL ════════
const CalculatorHub = ({ onClose, onOpenCourtFee }) => {
    const [activeCalc, setActiveCalc] = useState(null);

    const calculators = [
        {
            id: 'courtfee',
            icon: 'gavel',
            title: 'Court Fee',
            description: 'Ad-Valorem Court Fee based on state & case type',
            color: '#8b5cf6',
            gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
        },
        {
            id: 'gst',
            icon: 'receipt_long',
            title: 'GST',
            description: 'Calculate GST with CGST & SGST breakdown',
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
        },
        {
            id: 'sip',
            icon: 'trending_up',
            title: 'SIP',
            description: 'Plan mutual fund SIP returns & maturity',
            color: '#10b981',
            gradient: 'linear-gradient(135deg, #10b981, #34d399)'
        },
        {
            id: 'salary',
            icon: 'account_balance_wallet',
            title: 'Salary',
            description: 'CTC to in-hand with tax calculation',
            color: '#6366f1',
            gradient: 'linear-gradient(135deg, #6366f1, #818cf8)'
        }
    ];

    const handleCalcClick = (id) => {
        if (id === 'courtfee') {
            onClose();
            setTimeout(() => onOpenCourtFee(), 200);
        } else {
            setActiveCalc(id);
        }
    };

    if (activeCalc === 'gst') return <GSTCalculator onClose={() => setActiveCalc(null)} />;
    if (activeCalc === 'sip') return <SIPCalculator onClose={() => setActiveCalc(null)} />;
    if (activeCalc === 'salary') return <SalaryCalculator onClose={() => setActiveCalc(null)} />;

    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tools-modal-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalContentVariants}
                    className="tools-modal-content tools-calc-hub"
                >
                    {/* Hub Header */}
                    <div className="tools-calc-hub-header">
                        <div className="tools-calc-hub-header-bg">
                            <div className="tools-calc-hub-orb orb-1" />
                            <div className="tools-calc-hub-orb orb-2" />
                            <div className="tools-calc-hub-orb orb-3" />
                        </div>
                        <div className="tools-calc-hub-header-content">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                className="tools-calc-hub-icon"
                            >
                                <span className="material-symbols-outlined">calculate</span>
                            </motion.div>
                            <div>
                                <motion.h2
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Calculator Hub
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Choose a calculator to get started
                                </motion.p>
                            </div>
                        </div>
                        <button className="tools-calc-modal-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Calculator Grid */}
                    <motion.div
                        variants={calculatorGridVariants}
                        initial="hidden"
                        animate="visible"
                        className="tools-calc-hub-grid"
                    >
                        {calculators.map((calc) => (
                            <motion.div
                                key={calc.id}
                                variants={calcCardVariants}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="tools-calc-hub-card"
                                onClick={() => handleCalcClick(calc.id)}
                                style={{ '--card-color': calc.color }}
                            >
                                <div className="tools-calc-hub-card-glow" style={{ background: calc.gradient }} />
                                <motion.div
                                    className="tools-calc-hub-card-icon"
                                    style={{ background: `${calc.color}15`, color: calc.color }}
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <span className="material-symbols-outlined">{calc.icon}</span>
                                </motion.div>
                                <h3>{calc.title}</h3>
                                <p>{calc.description}</p>
                                <div className="tools-calc-hub-card-arrow" style={{ color: calc.color }}>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};



// ════════ MAIN TOOLS COMPONENT ════════
// ════════ E-SIGNATURE MODAL ════════
const ESignatureModal = ({ onClose }) => {
    return (
        <AnimatePresence>
            <motion.div
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="tools-modal-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalContentVariants}
                    className="tools-modal-content max-w-lg p-6 text-center space-y-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
                        <span className="material-symbols-outlined text-3xl">draw</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Digital E-Signature & Signing
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Execute agreements, affidavits, and legal contracts with legally binding Aadhaar-based eSign and secure digital signatures (IT Act compliant).
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-900/10 border border-sky-200/60 dark:border-sky-800/40 text-xs text-sky-700 dark:text-sky-300 font-medium">
                        ✨ Fully compliant under Section 3A & Schedule II of the Indian Information Technology (IT) Act, 2000.
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-all shadow-md"
                        >
                            Got It
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const Tools = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
    const [isESignatureModalOpen, setIsESignatureModalOpen] = useState(false);
    const [isCalculatorHubOpen, setIsCalculatorHubOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [initialDraftingPrompt, setInitialDraftingPrompt] = useState('');
    const fileInputRef = useRef(null);

    // List of all tools for uniform dynamic grid representation
    const allTools = [
        {
            id: 'create-draft',
            icon: 'edit_document',
            title: 'Create New Draft',
            description: 'Start a new document with AI guidance or an empty workspace.',
            onClick: () => handleDraftingClick(),
            accentColor: '#3b82f6',
            category: 'Drafting'
        },
        {
            id: 'existing-doc',
            icon: 'upload_file',
            title: 'Work on Existing Document',
            description: 'Upload a `.docx` or `.pdf` file and continue in the workspace.',
            onClick: () => handleUploadClick(),
            accentColor: '#6366f1',
            category: 'Drafting'
        },
        {
            id: 'review-draft',
            icon: 'description',
            title: 'Review Your Draft',
            description: 'Review your previously created drafts.',
            onClick: () => navigate('/dashboard/drafts'),
            accentColor: '#f59e0b',
            category: 'Drafting'
        },
        {
            id: 'pdf-toolkit',
            icon: 'book',
            title: 'PDF Tool kit',
            description: 'Merge PDFs, rearrange pages, compress, watermark and convert to DOCX format.',
            onClick: () => navigate('/dashboard/pdf-editor'),
            accentColor: '#3b82f6',
            category: 'PDF Tools',
            children: (
                <div className="flex justify-between items-center px-4 mt-2">
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">layers</span>
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">content_cut</span>
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">compress</span>
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">description</span>
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">approval</span>
                </div>
            )
        },

        {
            id: 'chat-pdf',
            icon: 'picture_as_pdf',
            title: 'Chat with PDF',
            description: 'Upload a PDF and ask questions, summarize, or analyze it.',
            onClick: () => navigate('/dashboard/chat-pdf'),
            accentColor: '#ec4899',
            category: 'Research'
        },
        {
            id: 'calculator-hub',
            icon: 'calculate',
            title: 'Calculator Hub',
            description: 'Court Fee, GST, SIP & Salary calculators — all in one place.',
            onClick: () => setIsCalculatorHubOpen(true),
            accentColor: '#8b5cf6',
            category: 'Research'
        },
        {
            id: 'invoice-gen',
            icon: 'receipt_long',
            title: 'Invoice Generator',
            description: 'Create professional legal invoices for your clients and download as PDF.',
            onClick: () => setIsInvoiceModalOpen(true),
            accentColor: '#10b981',
            category: 'Utilities'
        },
        {
            id: 'dictation',
            icon: 'mic',
            title: 'Voice Dictation',
            description: 'Dictate your legal notes using voice-to-text. Supports Hindi & English.',
            onClick: () => setIsDictationModalOpen(true),
            accentColor: '#f43f5e',
            category: 'Utilities'
        },
        {
            id: 'esignature',
            icon: 'draw',
            title: 'Digital E-Signature & Signing',
            description: 'Execute agreements, affidavits, and legal contracts with legally binding Aadhaar-based eSign and secure digital signatures (IT Act compliant).',
            onClick: () => setIsESignatureModalOpen(true),
            accentColor: '#0284c7',
            category: 'Utilities'
        }
    ];

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
                source: record.source || 'tools_upload',
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

        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            alert('Please sign in again before uploading a document.');
            e.target.value = '';
            return;
        }

        setUploadedFileName(file.name);
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', sessionId);

        try {
            const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/upload`;
            const response = await axios.post(url, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${sessionId}`
                },
            });
            const data = response.data;
            
            saveDeskDraftRecord({
                id: data.documentKey,
                name: data.filename,
                filename: data.filename,
                documentKey: data.documentKey,
                onlyofficeConfig: data,
                variablesDetected: data.variablesDetected || [],
                status: 'In progress',
                source: 'tools_upload',
                trackingParams: {
                    source: 'tools_upload',
                    documentKey: data.documentKey,
                    filename: data.filename,
                    uploadedAt: new Date().toISOString(),
                },
            });

            navigate('/dashboard/workspace', {
                state: {
                    documentKey: data.documentKey,
                    filename: data.filename,
                    onlyofficeConfig: data,
                    variablesDetected: data.variablesDetected || [],
                    trackingParams: {
                        source: 'tools_upload',
                        documentKey: data.documentKey,
                        filename: data.filename,
                    }
                }
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload and open document. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleEmptyDocumentClick = async () => {
        setIsUploading(true);
        try {
            const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/create`;
            const response = await axios.post(url, {}, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('session_id')}`
                },
            });
            const data = response.data;
            navigate('/dashboard/workspace', {
                state: {
                    documentKey: data.documentKey,
                    filename: data.filename,
                    onlyofficeConfig: data,
                    variablesDetected: []
                }
            });
        } catch (error) {
            console.error('Failed to create empty document:', error);
            alert('Failed to initialize empty document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadSubmit = ({ details, supportingDocs }) => {
        navigate('/dashboard/editor', {
            state: { htmlContent, uploadDetails: details, supportingDocs }
        });
    };

    const handleUploadSkip = () => navigate('/dashboard/editor', { state: { htmlContent } });

    // Reusable Card Component with interactive radial glow and animation
    const ToolCard = ({ icon, title, description, onClick, accentColor = "#136dec", badge, children }) => {
        const cardRef = useRef(null);
        const [isHovered, setIsHovered] = useState(false);
        const [localMouse, setLocalMouse] = useState({ x: 0, y: 0 });

        const handleMouseMove = (e) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            setLocalMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };

        return (
            <motion.div
                ref={cardRef}
                variants={cardVariants}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className="group relative flex flex-col gap-4 p-6 rounded-2xl border cursor-pointer h-full overflow-hidden
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800
                    hover:border-primary/30 dark:hover:border-primary/40
                    hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
                {isHovered && (
                    <div
                        className="absolute pointer-events-none transition-opacity duration-300 opacity-100"
                        style={{
                            background: `radial-gradient(500px circle at ${localMouse.x}px ${localMouse.y}px, ${accentColor}08, transparent 50%)`,
                            top: 0, left: 0, right: 0, bottom: 0
                        }}
                    />
                )}

                <div className="relative z-10 flex items-start justify-between gap-3">
                    <motion.div
                        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor
                        }}
                    >
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </motion.div>

                    {badge && (
                        <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                bg-emerald-50 text-emerald-600 border border-emerald-200"
                        >
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {badge}
                        </motion.span>
                    )}
                </div>

                <div className="relative z-10 flex flex-col flex-1">
                    <h4 className="text-lg font-bold mb-2 text-[#0d131b] dark:text-white transition-colors duration-300">
                        {title}
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 transition-colors duration-300">
                        {description}
                    </p>
                    {children && <div className="flex-1 flex flex-col justify-center pt-4">{children}</div>}
                </div>

                <motion.div
                    className="relative z-10 flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2"
                    style={{ color: accentColor }}
                >
                    <span>Open Tool</span>
                    <motion.span
                        className="material-symbols-outlined text-lg"
                        animate={isHovered ? { x: [0, 5, 0] } : { x: 0 }}
                        transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
                    >
                        arrow_right_alt
                    </motion.span>
                </motion.div>

                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isHovered ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute bottom-0 left-0 right-0 h-1 origin-left"
                    style={{ backgroundColor: accentColor }}
                />
            </motion.div>
        );
    };

    const FilterButton = ({ icon, label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all border
            ${isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 group'
                }`}
        >
            <span className={`material-symbols-outlined text-[20px] ${!isActive && 'text-slate-500 group-hover:text-primary'}`}>
                {icon}
            </span>
            <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                {label}
            </p>
        </button>
    );

    const [activeCategory, setActiveCategory] = useState('All features');

    const categories = [
        { id: 'All features', icon: 'grid_view', label: 'All features' },
        { id: 'Drafting', icon: 'edit_document', label: 'Drafting' },
        { id: 'PDF Tools', icon: 'picture_as_pdf', label: 'PDF Tools' },
        { id: 'Research', icon: 'search', label: 'Research' },
        { id: 'Utilities', icon: 'construction', label: 'Utilities' },
        { id: 'How to use ?', icon: 'help', label: 'How to use ?' }
    ];

    const TUTORIAL_VIDEOS = [
        { id: 1, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 1' },
        { id: 2, url: 'https://www.youtube.com/watch?v=tdIUMkXxtHg', title: 'Tutorial 2' },
        { id: 3, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 3' },
        { id: 4, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 4' }
    ];

    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('embed')) return url;
        const videoId = url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const nextVideo = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % TUTORIAL_VIDEOS.length);
    };

    const prevVideo = () => {
        setCurrentVideoIndex((prev) => (prev - 1 + TUTORIAL_VIDEOS.length) % TUTORIAL_VIDEOS.length);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background-light dark:bg-background-dark font-display relative">
            {isUploading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium text-slate-800 dark:text-white">Uploading & Converting...</p>
                    </div>
                </div>
            )}
            
            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-20 w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 py-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(cat => (
                            <FilterButton
                                key={cat.id}
                                icon={cat.icon}
                                label={cat.label}
                                isActive={activeCategory === cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={activeCategory}
                className={`flex-1 ${activeCategory === 'How to use ?' ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto pb-20'}`}
            >
                <div className={`w-full max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 ${activeCategory === 'How to use ?' ? '' : 'pt-6 pb-12 flex flex-col gap-16'}`}>

                    {activeCategory !== 'How to use ?' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 pb-12">
                            {allTools
                                .filter(tool => activeCategory === 'All features' || tool.category === activeCategory)
                                .map(tool => (
                                    <ToolCard
                                        key={tool.id}
                                        icon={tool.icon}
                                        title={tool.title}
                                        description={tool.description}
                                        onClick={tool.onClick}
                                        accentColor={tool.accentColor}
                                        badge={tool.badge}
                                    >
                                        {tool.children}
                                    </ToolCard>
                                ))}
                        </div>
                    )}

                    {/* How to use? Section */}
                    {activeCategory === 'How to use ?' && (
                        <section className="flex flex-col gap-6">
                            <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white text-center">
                                {TUTORIAL_VIDEOS[currentVideoIndex].title}
                            </h3>
                            <div className="w-full flex items-center justify-center gap-4 py-2">
                                {/* Prev Button */}
                                <button
                                    onClick={prevVideo}
                                    className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>

                                {/* Video Player */}
                                <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative group">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getEmbedUrl(TUTORIAL_VIDEOS[currentVideoIndex].url)}
                                        title={TUTORIAL_VIDEOS[currentVideoIndex].title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>

                                    {/* Video Counter/Indicator */}
                                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                        {currentVideoIndex + 1} / {TUTORIAL_VIDEOS.length}
                                    </div>
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={nextVideo}
                                    className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>

                            {/* Dot Indicators */}
                            <div className="flex justify-center gap-2">
                                {TUTORIAL_VIDEOS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentVideoIndex(idx)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentVideoIndex
                                            ? 'bg-primary w-6'
                                            : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>

            {/* Hidden Input for File Upload */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.doc,.rtf,.txt"
            />

            {/* Modals */}
            {isModalOpen && (
                <DraftingModal
                    onClose={() => setIsModalOpen(false)}
                    initialPrompt={initialDraftingPrompt}
                    initialEntryMode="dashboard"
                    onDraftCreated={saveDeskDraftRecord}
                />
            )}
            {isCourtFeeModalOpen && <CourtFeeModal onClose={() => setIsCourtFeeModalOpen(false)} />}
            {isInvoiceModalOpen && <InvoiceModal onClose={() => setIsInvoiceModalOpen(false)} />}
            {isDictationModalOpen && <DictationModal onClose={() => setIsDictationModalOpen(false)} />}
            {isESignatureModalOpen && <ESignatureModal onClose={() => setIsESignatureModalOpen(false)} />}
            {isCalculatorHubOpen && (
                <CalculatorHub
                    onClose={() => setIsCalculatorHubOpen(false)}
                    onOpenCourtFee={() => setIsCourtFeeModalOpen(true)}
                />
            )}
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

export default Tools;
