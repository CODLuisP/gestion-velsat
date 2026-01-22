
import React from 'react';

export const Illustration: React.FC = () => {
  return (
    <div className="w-full h-auto flex justify-center items-center">
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
      >
        {/* Abstract Data Screen Background */}
        <rect x="50" y="50" width="700" height="400" rx="30" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
        <rect x="70" y="70" width="660" height="30" rx="15" fill="#1e293b" />
        <circle cx="95" cy="85" r="5" fill="#ef4444" />
        <circle cx="115" cy="85" r="5" fill="#f59e0b" />
        <circle cx="135" cy="85" r="5" fill="#10b981" />

        {/* Floating Dashboard Elements */}
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <rect x="80" y="120" width="180" height="100" rx="15" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <path d="M100 190L130 160L160 180L240 140" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <text x="100" y="145" fill="#94a3b8" fontSize="12" fontWeight="bold">REAL-TIME TRAFFIC</text>
        </g>

        <g className="animate-float" style={{ animationDelay: '2s' }}>
          <rect x="540" y="120" width="180" height="200" rx="15" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <circle cx="630" cy="180" r="40" stroke="#3b82f6" strokeWidth="8" strokeDasharray="180 250" />
          <text x="560" y="250" fill="#94a3b8" fontSize="12">FLEET STATUS</text>
          <rect x="560" y="270" width="140" height="8" rx="4" fill="#334155" />
          <rect x="560" y="270" width="110" height="8" rx="4" fill="#3b82f6" />
          <rect x="560" y="290" width="140" height="8" rx="4" fill="#334155" />
          <rect x="560" y="290" width="40" height="8" rx="4" fill="#10b981" />
        </g>

        {/* Central Map Illustration */}
        <g transform="translate(280, 140)">
          <rect width="240" height="160" rx="10" fill="#020617" />
          <path d="M20 20C40 40 100 20 120 60C140 100 200 80 220 140" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="60" cy="40" r="10" fill="#ef4444" opacity="0.3">
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="40" r="4" fill="#ef4444" />
          
          <circle cx="180" cy="100" r="10" fill="#10b981" opacity="0.3">
            <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="100" r="4" fill="#10b981" />
          
          <path d="M40 140L80 120L120 140L160 110" stroke="#3b82f6" strokeWidth="2" fill="none" />
        </g>

        {/* People Management - Collaborative View */}
        <g transform="translate(100, 320)">
           {/* Stylized Figures */}
           <circle cx="200" cy="120" r="40" fill="#1e293b" />
           <path d="M160 200C160 170 170 160 200 160C230 160 240 170 240 200" fill="#334155" />
           
           <circle cx="350" cy="120" r="40" fill="#1e293b" />
           <path d="M310 200C310 170 320 160 350 160C380 160 390 170 390 200" fill="#334155" />

           <circle cx="500" cy="120" r="40" fill="#1e293b" />
           <path d="M460 200C460 170 470 160 500 160C530 160 540 170 540 200" fill="#334155" />
           
           {/* Connecting Lines */}
           <path d="M240 120H310" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
           <path d="M390 120H460" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
        </g>

        {/* Floating Icons */}
        <g className="animate-float" style={{ animationDelay: '1s' }}>
          <circle cx="100" cy="350" r="25" fill="#10b981" fillOpacity="0.2" stroke="#10b981" />
          <path d="M92 350L98 356L108 344" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="animate-float" style={{ animationDelay: '3s' }}>
          <circle cx="700" cy="400" r="30" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" />
          <path d="M690 400H710M700 390V410" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
