import React from 'react';

export default function Skeleton({ className = "", rounded = "rounded-xl", animate = true }) {
  return (
    <div
      className={`
        bg-sv-elev/70 
        ${rounded} 
        ${className} 
        ${animate ? "sv-skeleton" : ""}
      `}
    />
  );
}
