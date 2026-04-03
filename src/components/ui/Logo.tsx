import React from 'react';

export function Logo({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      <svg 
        width="38" 
        height="38" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        {/* Realistic Detailed Asymmetrical Scale (Perfect Balance) */}
        
        {/* Central/Offset Post with finial */}
        <path 
          d="M16 21V6" 
          stroke="currentColor" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
        />
        <circle cx="16" cy="5" r="1.2" fill="currentColor" />
        
        {/* Curved Horizontal Beam (Arched style like high-end scales) */}
        {/* Spanning off-center to create long/short arms */}
        <path 
          d="M4 8C7 6.5 13 6.5 16 8C18 9 19.5 9.5 22 8" 
          stroke="currentColor" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Left Hanging Plate (Long Arm Leverage) */}
        <path 
          d="M4 8L2.5 11.5L5.5 11.5L4 8Z" 
          fill="currentColor" 
          opacity="0.2"
        />
        <path 
          d="M4 8L2.5 15M4 8L5.5 15M1 16H7C7 16 7 18 4 18C1 18 1 16 1 16Z" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Right Hanging Plate (Short Arm Balance) */}
        <path 
          d="M22 8L21 10.5L23 10.5L22 8Z" 
          fill="currentColor" 
          opacity="0.2"
        />
        <path 
          d="M22 8L21 12M22 8L23 12M20 13H24C24 13 24 14.5 22 14.5C20 14.5 20 13 20 13Z" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Detailed Tiered Base */}
        <path 
          d="M13 21H19M11 22.5H21" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
      </svg>

      <div className="flex flex-col leading-none">
        <span className="text-xl md:text-2xl font-black tracking-tighter text-[#1A1523] uppercase">
          LEVERAGE <span className="text-primary italic">RUN</span>
        </span>
        <span className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase mt-0.5">
          Quantitative Laboratory
        </span>
      </div>
    </div>
  );
}
