import React from 'react';

const Button = React.forwardRef(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90",
    outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 text-gray-900",
  };
  
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };

  const compClass = `${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`;
  
  return (
    <button
      className={compClass}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
