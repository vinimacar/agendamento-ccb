import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className = '', variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-200 text-gray-900',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-gray-300 bg-transparent',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
