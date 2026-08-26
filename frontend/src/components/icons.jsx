import React from 'react';

export const FlightIcon = ({ size = 20, className = '' }) => (
  <svg
    className={`theme-icon ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.9-.2-1.8.1-2.4.7l-.6.6 6.1 4.5-3.6 3.6-2.6-.7-.9.9 3.5 2.1 2.1 3.5.9-.9-.7-2.6 3.6-3.6 4.5 6.1.6-.6c.6-.6.9-1.5.7-2.4z"/>
  </svg>
);

export const ChatbotIcon = ({ size = 20, className = '' }) => (
  <svg
    className={`theme-icon ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);