import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { caseService } from '../services/library/caseService';

const InvoiceModal = ({ onClose }) => {
    const invoiceRef = useRef(null);
    const [step, setStep] = useState(1); // 1 = form, 2 = preview

    const [formData, setFormData] = useState({
        firmName: '',
        firmAddress: '',
        firmPhone: '',
        firmEmail: '',
        clientName: '',
        clientAddress: '',
        clientPhone: '',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [{ description: '', quantity: 1, rate: 0 }],
        taxPercent: 18,
        discount: 0,
        notes: '',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = (subtotal * formData.taxPercent) / 100;
    const total = subtotal + taxAmount - formData.discount;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const downloadPDF = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const fileName = `${formData.invoiceNumber || 'INV-001'}.pdf`;
        pdf.save(fileName);
    };

    const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
    const labelClass = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">receipt_long</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Invoice Generator</h2>
                            <p className="text-xs text-slate-500">Step {step} of 2 — {step === 1 ? 'Fill Details' : 'Preview & Download'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                                Edit
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-slate-500">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Firm & Client Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Firm */}
                                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-primary">business</span>
                                            Your Firm Details
                                        </h3>
                                        <div>
                                            <label className={labelClass}>Firm / Advocate Name</label>
                                            <input className={inputClass} value={formData.firmName} onChange={e => updateField('firmName', e.target.value)} placeholder="Sharma & Associates" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Address</label>
                                            <input className={inputClass} value={formData.firmAddress} onChange={e => updateField('firmAddress', e.target.value)} placeholder="123, High Court Road, Delhi" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClass}>Phone</label>
                                                <input className={inputClass} value={formData.firmPhone} onChange={e => updateField('firmPhone', e.target.value)} placeholder="+91 98765 43210" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input className={inputClass} value={formData.firmEmail} onChange={e => updateField('firmEmail', e.target.value)} placeholder="firm@email.com" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client */}
                                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-primary">person</span>
                                            Client Details
                                        </h3>
                                        <div>
                                            <label className={labelClass}>Client Name</label>
                                            <input className={inputClass} value={formData.clientName} onChange={e => updateField('clientName', e.target.value)} placeholder="Rajesh Kumar" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Address</label>
                                            <input className={inputClass} value={formData.clientAddress} onChange={e => updateField('clientAddress', e.target.value)} placeholder="456, MG Road, Mumbai" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone</label>
                                            <input className={inputClass} value={formData.clientPhone} onChange={e => updateField('clientPhone', e.target.value)} placeholder="+91 12345 67890" />
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Meta */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Invoice Number</label>
                                        <input className={inputClass} value={formData.invoiceNumber} onChange={e => updateField('invoiceNumber', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Invoice Date</label>
                                        <input className={inputClass} type="date" value={formData.invoiceDate} onChange={e => updateField('invoiceDate', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Due Date</label>
                                        <input className={inputClass} type="date" value={formData.dueDate} onChange={e => updateField('dueDate', e.target.value)} />
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg text-primary">list_alt</span>
                                        Services / Items
                                    </h3>

                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        <div className="col-span-6">Description</div>
                                        <div className="col-span-2 text-center">Qty</div>
                                        <div className="col-span-2 text-center">Rate (₹)</div>
                                        <div className="col-span-1 text-center">Amount</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {formData.items.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="md:col-span-6">
                                                <input
                                                    className={inputClass}
                                                    value={item.description}
                                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                                    placeholder="Legal consultation, Case filing, etc."
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    className={`${inputClass} text-center`}
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    className={`${inputClass} text-center`}
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={e => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {formatCurrency(item.quantity * item.rate)}
                                            </div>
                                            <div className="md:col-span-1 flex items-center justify-center">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <button
                                        onClick={addItem}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-500 hover:border-primary hover:text-primary transition-colors w-full justify-center"
                                    >
                                        <span className="material-symbols-outlined text-lg">add</span>
                                        Add Item
                                    </button>
                                </div>

                                {/* Tax, Discount, Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>GST / Tax (%)</label>
                                        <input className={inputClass} type="number" min="0" value={formData.taxPercent} onChange={e => updateField('taxPercent', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Discount (₹)</label>
                                        <input className={inputClass} type="number" min="0" value={formData.discount} onChange={e => updateField('discount', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes</label>
                                        <input className={inputClass} value={formData.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Payment terms, bank details, etc." />
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="flex justify-end">
                                    <div className="w-full md:w-72 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                            <span>Tax ({formData.taxPercent}%)</span>
                                            <span>{formatCurrency(taxAmount)}</span>
                                        </div>
                                        {formData.discount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatCurrency(formData.discount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-primary/20 pt-2 flex justify-between text-base font-bold text-slate-800 dark:text-white">
                                            <span>Total</span>
                                            <span className="text-primary">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // ═══════ PREVIEW STEP ═══════
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div ref={invoiceRef} className="bg-white p-8 max-w-3xl mx-auto rounded-lg shadow-sm" style={{ color: '#1a1a1a' }}>
                                    {/* Invoice Header */}
                                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-blue-600">
                                        <div>
                                            <h1 className="text-2xl font-bold text-blue-600">{formData.firmName || 'Your Firm Name'}</h1>
                                            <p className="text-sm text-gray-600 mt-1">{formData.firmAddress}</p>
                                            <p className="text-sm text-gray-600">{formData.firmPhone} | {formData.firmEmail}</p>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
                                            <p className="text-sm text-gray-600 mt-1">#{formData.invoiceNumber}</p>
                                        </div>
                                    </div>

                                    {/* Client + Dates */}
                                    <div className="flex justify-between mb-8">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bill To</p>
                                            <p className="font-semibold text-gray-800">{formData.clientName || 'Client Name'}</p>
                                            <p className="text-sm text-gray-600">{formData.clientAddress}</p>
                                            <p className="text-sm text-gray-600">{formData.clientPhone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm"><span className="font-semibold">Date:</span> {formData.invoiceDate}</p>
                                            {formData.dueDate && <p className="text-sm"><span className="font-semibold">Due:</span> {formData.dueDate}</p>}
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <table className="w-full mb-6">
                                        <thead>
                                            <tr className="bg-blue-600 text-white">
                                                <th className="text-left p-3 text-sm font-semibold">#</th>
                                                <th className="text-left p-3 text-sm font-semibold">Description</th>
                                                <th className="text-center p-3 text-sm font-semibold">Qty</th>
                                                <th className="text-right p-3 text-sm font-semibold">Rate</th>
                                                <th className="text-right p-3 text-sm font-semibold">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                    <td className="p-3 text-sm text-gray-600">{i + 1}</td>
                                                    <td className="p-3 text-sm text-gray-800">{item.description || '-'}</td>
                                                    <td className="p-3 text-sm text-center text-gray-600">{item.quantity}</td>
                                                    <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(item.rate)}</td>
                                                    <td className="p-3 text-sm text-right font-medium text-gray-800">{formatCurrency(item.quantity * item.rate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Totals */}
                                    <div className="flex justify-end mb-8">
                                        <div className="w-64">
                                            <div className="flex justify-between py-2 text-sm text-gray-600">
                                                <span>Subtotal</span>
                                                <span>{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 text-sm text-gray-600">
                                                <span>Tax ({formData.taxPercent}%)</span>
                                                <span>{formatCurrency(taxAmount)}</span>
                                            </div>
                                            {formData.discount > 0 && (
                                                <div className="flex justify-between py-2 text-sm text-green-600">
                                                    <span>Discount</span>
                                                    <span>-{formatCurrency(formData.discount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between py-3 border-t-2 border-blue-600 font-bold text-lg text-gray-800">
                                                <span>Total</span>
                                                <span className="text-blue-600">{formatCurrency(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {formData.notes && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
                                            <p className="text-sm text-gray-600">{formData.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-500">
                        Total: <span className="font-bold text-primary text-base">{formatCurrency(total)}</span>
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 1 ? (
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                Preview Invoice
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                onClick={downloadPDF}
                                className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InvoiceModal;