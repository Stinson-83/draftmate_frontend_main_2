import React from 'react';

export default function TimelineItem({ title, subtitle, dateRange, description, isLast = false }) {
  return (
    <div className="relative pl-6 pb-6">
      {/* Vertical Line */}
      {!isLast && (
        <div className="absolute left-[7px] top-2 bottom-0 w-px bg-gray-200" />
      )}
      
      {/* Node */}
      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-primary bg-white shadow-sm" />
      
      {/* Content */}
      <div className="mb-1">
        <h4 className="text-md font-semibold text-gray-900">{title}</h4>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mt-1">
          <span className="text-sm font-medium text-gray-700">{subtitle}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block w-fit">
            {dateRange}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
