import React from 'react';

export const Illustration: React.FC = () => {
  return (
    <div className="w-full h-auto flex justify-center items-center">
      <svg
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
      >
        {/* Abstract Data Screen Background */}
        <rect x="50" y="40" width="500" height="280" rx="25" fill="#e2e8f0" stroke="#3b82f6" strokeWidth="2" />
        <rect x="65" y="55" width="470" height="25" rx="12" fill="#cbd5e1" />
        <circle cx="85" cy="67" r="4" fill="#f97316" />
        <circle cx="100" cy="67" r="4" fill="#fb923c" />
        <circle cx="115" cy="67" r="4" fill="#3b82f6" />

        {/* Floating Dashboard Elements */}
        <g className="animate-float" style={{ animationDelay: '0s' }}>
          <rect x="70" y="95" width="135" height="75" rx="12" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1" />
          <path d="M85 150L105 130L125 143L185 115" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
          <text x="85" y="118" fill="#1e40af" fontSize="10" fontWeight="bold">TRÁFICO TIEMPO REAL</text>
        </g>

        <g className="animate-float" style={{ animationDelay: '2s' }}>
          <rect x="395" y="95" width="135" height="150" rx="12" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="462" cy="140" r="30" stroke="#f97316" strokeWidth="6" strokeDasharray="140 190" />
          <text x="410" y="190" fill="#1e40af" fontSize="10">ESTADO FLOTA</text>
          <rect x="410" y="205" width="100" height="6" rx="3" fill="#e0e7ff" />
          <rect x="410" y="205" width="80" height="6" rx="3" fill="#f97316" />
          <rect x="410" y="220" width="100" height="6" rx="3" fill="#e0e7ff" />
          <rect x="410" y="220" width="30" height="6" rx="3" fill="#fb923c" />
        </g>

        {/* Central Map Illustration */}
        <g transform="translate(210, 105)">
          <rect width="175" height="115" rx="8" fill="#f1f5f9" />
          <path d="M18 18C35 35 75 18 92 48C108 78 150 65 167 105" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="48" cy="33" r="8" fill="#f97316" opacity="0.3">
            <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="48" cy="33" r="3.5" fill="#f97316" />
          
          <circle cx="138" cy="75" r="8" fill="#fb923c" opacity="0.3">
            <animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="138" cy="75" r="3.5" fill="#fb923c" />
          
          <path d="M30 105L58 90L88 105L120 85" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
        </g>

        {/* People Management - Collaborative View */}
        <g transform="translate(80, 235)">
           {/* Stylized Figures */}
           <circle cx="145" cy="80" r="28" fill="#2563eb" />
           <path d="M117 140C117 118 125 110 145 110C165 110 173 118 173 140" fill="#3b82f6" />
           
           <circle cx="255" cy="80" r="28" fill="#f97316" />
           <path d="M227 140C227 118 235 110 255 110C275 110 283 118 283 140" fill="#fb923c" />

           <circle cx="365" cy="80" r="28" fill="#2563eb" />
           <path d="M337 140C337 118 345 110 365 110C385 110 393 118 393 140" fill="#3b82f6" />
           
           {/* Connecting Lines */}
           <path d="M173 80H227" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
           <path d="M283 80H337" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </g>

        {/* Floating Icons */}
        <g className="animate-float" style={{ animationDelay: '1s' }}>
          <circle cx="78" cy="260" r="18" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="1.5" />
          <path d="M72 260L76 264L84 254" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="animate-float" style={{ animationDelay: '3s' }}>
          <circle cx="515" cy="290" r="22" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M507 290H523M515 282V298" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Additional decorative elements */}
        <circle cx="110" cy="355" r="11" fill="#3b82f6" opacity="0.2" />
        <circle cx="480" cy="355" r="14" fill="#fb923c" opacity="0.2" />
      </svg>
    </div>
  );
};