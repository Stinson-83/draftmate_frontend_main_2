import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LegalBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check agar user ne pehle se accept kiya hua hai ya nahi
    const consent = localStorage.getItem('draftmate_cookie_consent');
    if (!consent) {
      // Thoda delay dekar show karenge (smooth experience ke liye)
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('draftmate_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[750px] z-[100] bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,28,46,0.15)] border border-slate-200/80 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <p className="text-[13.5px] font-medium text-slate-600 leading-relaxed flex-1 m-0">
            We use some essential cookies to make this site work. <strong className="text-[#0F1C2E]">Essential Cookies</strong> are necessary for core functionality, such as security and network management. They always need to be on. By clicking "I Agree", you agree to the storing of essential cookies as outlined in our{' '}
            <Link to="/cookie-policy" className="text-blue-600 font-extrabold hover:underline">
              cookie policy
            </Link>.
          </p>
          
          <button
            onClick={handleAccept}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-xl transition-all duration-200 shadow-md shadow-blue-600/20 whitespace-nowrap active:scale-95"
          >
            I Agree
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}