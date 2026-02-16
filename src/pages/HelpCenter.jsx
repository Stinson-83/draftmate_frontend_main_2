import React from 'react';
import { toast } from 'sonner';
import { faqs } from '../data/faqs';
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

                        {faqs.map((faq, index) => (
                            <details key={index} className="group border-b border-gray-50 dark:border-gray-800 last:border-0">
                                <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors list-none">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{faq.question}</span>
                                    <span className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 chevron-icon">expand_more</span>
                                </summary>
                                <div className="px-3 pb-4 pt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </details>
                        ))}

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
