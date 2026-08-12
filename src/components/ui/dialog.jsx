import React from 'react';

// Simplified dialog for fallback since radix-ui might not be installed.
const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="absolute inset-0" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ className = "", children }) => (
  <div className={`bg-white rounded-lg shadow-lg border p-6 w-full max-w-lg ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ className = "", children }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
    {children}
  </div>
);

const DialogTitle = ({ className = "", children }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h2>
);

const DialogDescription = ({ className = "", children }) => (
  <p className={`text-sm text-gray-500 mt-2 ${className}`}>
    {children}
  </p>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
