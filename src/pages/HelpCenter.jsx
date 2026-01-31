import React from 'react';
import { toast } from 'sonner';
import './HelpCenter.css';

const HelpCenter = () => {
    return (
        <div className="flex justify-center items-start py-10 px-4 h-full overflow-y-auto">
            <div className="w-full max-w-[380px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-10">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">live_help</span>
                        </div>
                        <div>
                            <h1 className="text-[#111318] dark:text-white text-lg font-semibold leading-tight">Help & Support</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Find answers or reach out to us</p>
                        </div>
                    </div>
                </div>

                <div className="p-2">
                    <h3 className="text-gray-900 dark:text-gray-100 text-[13px] font-bold uppercase tracking-wider px-4 py-4">FAQs</h3>
                    <div className="flex flex-col px-2 pb-4">

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">What is Draft Mate?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Draft Mate is an AI-powered legal drafting and research platform built exclusively for Indian advocates, law firms, and legal professionals. It works like a digital junior advocate—helping you draft court-ready documents, conduct accurate legal research, and manage documents faster and more efficiently, all in one workspace.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">What types of legal documents can I draft using Draft Mate?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    You can draft almost any Indian legal document using Draft Mate, including petitions, replies, written submissions, notices, agreements, legal notices, affidavits, contracts, and legal memos. Draft Mate understands the correct court format, legal language, and applicable provisions before generating a structured draft.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Does Draft Mate provide real and verified legal citations?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Yes. Draft Mate only uses authentic and verifiable case laws and statutory provisions. It does not fabricate judgments or citations. Every reference included in your draft or research is real, accurate, and professionally reliable.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can I do legal research on Draft Mate?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Absolutely. Draft Mate includes Lex Bot, an AI legal research assistant that helps you find relevant judgments, sections, legal principles, and interpretations. You can ask questions in plain language, read judgments in-app, analyze documents, and generate argument notes or legal insights within minutes.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Draft Mate suitable for young advocates and law students?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Yes. Draft Mate is ideal for independent advocates, junior lawyers, law firms, and law students who want to improve drafting quality, save time, and understand professional legal formats. It also helps first-generation lawyers by simplifying complex drafting and research processes.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">How does Draft Is my data and client information secure on Draft Mate?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Yes. Data security and confidentiality are our top priorities. All documents and sessions are encrypted, stored securely, and accessible only to you. Draft Mate does not use your data to train AI models, ensuring full client confidentiality similar to attorney client privilege.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can I edit and customize drafts generated by Draft Mate?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Yes. Every draft generated by Draft Mate is fully editable. You can customize language, formatting, clauses, letterheads, watermarks, signatures, and drafting style just like working in MS Word—before downloading the final document.
                                </p>
                            </div>
                        </details>

                        <details className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Why should I choose Draft Mate over traditional legal databases or generic AI tools?</span>
                                <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                            </summary>
                            <div className="px-3 pb-4 pt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Traditional databases require keyword searches and generic AI tools lack legal accuracy. Draft Mate is built specifically for Indian law, understands legal context, follows court formats, and provides source-backed drafting and research. It saves time, reduces drafting errors, lowers costs, and delivers professional-quality results faster.
                                </p>
                            </div>
                        </details>

                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="size-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-primary shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                            <span className="material-symbols-outlined text-[24px]">mail</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Still need help?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-5 px-4">Can't find what you're looking for? Report your problem to us via mail and we'll get back to you.</p>
                        <a
                            href="mailto:draftmateinfo@gmail.com"
                            className="text-primary hover:underline font-medium text-sm block text-center mb-4"
                        >
                            draftmateinfo@gmail.com
                        </a>
                        <p className="text-[10px] text-gray-400 mt-4">Typical response time: <span className="font-medium text-gray-500 dark:text-gray-300">under 15 mins</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
