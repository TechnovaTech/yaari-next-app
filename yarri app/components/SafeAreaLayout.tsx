'use client';

import React from 'react';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
  className?: string; // Optional className for additional styling
}

const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({ children, className }) => {
  return (
    <div
      className={`h-full w-full ${className || ''}`}
      style={{
        paddingTop: 'var(--safe-area-top)',
        paddingBottom: 'var(--safe-area-bottom)',
        // We might need to add paddingLeft and paddingRight if horizontal safe areas become an issue
        // paddingLeft: 'var(--safe-area-left)',
        // paddingRight: 'var(--safe-area-right)',
      }}
    >
      {children}
    </div>
  );
};

export default SafeAreaLayout;