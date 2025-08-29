import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-none p-4 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;