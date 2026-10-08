import React from 'react';
import { ValidationStatus } from './DocumentValidationModal';

interface OfficialStampProps {
  chefName?: string;
  serviceName?: string;
  hospitalName?: string;
}

export const OfficialHospitalStamp: React.FC<OfficialStampProps> = ({
  chefName = 'Dr. MEDJBER TAMI',
  serviceName = 'SERVICE DE RHUMATOLOGIE',
  hospitalName = "ÉTABLISSEMENT HOSPITALIER D'AÏN EL TÜRCK",
}) => {
  return (
    <div className="relative inline-block select-none pointer-events-none opacity-85 print:opacity-100 rotate-[-4deg]">
      <svg
        width="110"
        height="110"
        viewBox="0 0 120 120"
        className="text-[#1E3A8A]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle
          cx="60"
          cy="60"
          r="56"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        {/* Inner Dotted Ring */}
        <circle
          cx="60"
          cy="60"
          r="51"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2.5 2"
        />
        {/* Inner Border Ring */}
        <circle
          cx="60"
          cy="60"
          r="38"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Circular text paths */}
        <path
          id="upperCurve"
          d="M 18,60 A 42,42 0 0,1 102,60"
          fill="none"
        />
        <path
          id="lowerCurve"
          d="M 102,60 A 42,42 0 0,1 18,60"
          fill="none"
        />

        <text
          fontSize="6.5"
          fontWeight="bold"
          fill="currentColor"
          letterSpacing="0.8"
        >
          <textPath href="#upperCurve" startOffset="50%" textAnchor="middle">
            E.H. AÏN EL TÜRCK • ORAN
          </textPath>
        </text>

        <text
          fontSize="6"
          fontWeight="bold"
          fill="currentColor"
          letterSpacing="0.5"
        >
          <textPath href="#lowerCurve" startOffset="50%" textAnchor="middle">
            ★ SERVICE RHUMATOLOGIE ★
          </textPath>
        </text>

        {/* Center content */}
        <g textAnchor="middle">
          <text
            x="60"
            y="52"
            fontSize="6"
            fontWeight="bold"
            fill="currentColor"
            letterSpacing="0.3"
          >
            CHEF DE SERVICE
          </text>
          <line
            x1="38"
            y1="56"
            x2="82"
            y2="56"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <text
            x="60"
            y="65"
            fontSize="7"
            fontWeight="900"
            fill="currentColor"
          >
            {chefName}
          </text>
          <text
            x="60"
            y="73"
            fontSize="5.5"
            fontWeight="600"
            fill="currentColor"
          >
            MÉDECIN CHEF
          </text>
        </g>
      </svg>
    </div>
  );
};

interface OfficialQrCodeProps {
  status: ValidationStatus;
  monthName: string;
}

export const OfficialHospitalQrCode: React.FC<OfficialQrCodeProps> = ({
  status,
  monthName,
}) => {
  const getStatusLabel = () => {
    switch (status) {
      case 'approved_direction':
        return 'Certifié Direction Générale';
      case 'approved_service':
        return 'Validé Chef de Service';
      case 'reviewed':
        return 'Vérifié Surveillance';
      default:
        return 'Document Provisoire';
    }
  };

  return (
    <div className="flex items-center gap-2 border border-slate-300 rounded p-1 bg-white font-sans text-left">
      <svg
        width="38"
        height="38"
        viewBox="0 0 29 29"
        fill="black"
        shapeRendering="crispEdges"
        className="shrink-0"
      >
        {/* Official QR Code Matrix Representation */}
        <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
        <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
        <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
        {/* Alignment pattern */}
        <path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z" />
        {/* Timing pattern */}
        <path d="M6,8 h1 v1 h-1 z M6,10 h1 v1 h-1 z M6,12 h1 v1 h-1 z M6,14 h1 v1 h-1 z M6,16 h1 v1 h-1 z M6,18 h1 v1 h-1 z M6,20 h1 v1 h-1 z" />
        <path d="M8,6 h1 v1 h-1 z M10,6 h1 v1 h-1 z M12,6 h1 v1 h-1 z M14,6 h1 v1 h-1 z M16,6 h1 v1 h-1 z M18,6 h1 v1 h-1 z M20,6 h1 v1 h-1 z" />
        {/* Data modules */}
        <path d="M8,8 h2 v1 h-2 z M12,8 h1 v2 h-1 z M15,8 h3 v1 h-3 z M19,8 h2 v1 h-2 z" />
        <path d="M9,10 h2 v2 h-2 z M14,10 h2 v1 h-2 z M18,10 h2 v2 h-2 z" />
        <path d="M8,13 h3 v1 h-3 z M12,13 h2 v1 h-2 z M16,13 h1 v2 h-1 z M19,13 h2 v1 h-2 z" />
        <path d="M9,16 h2 v1 h-2 z M13,15 h2 v2 h-2 z M18,16 h3 v1 h-3 z" />
        <path d="M8,18 h4 v1 h-4 z M14,18 h2 v2 h-2 z M17,19 h3 v1 h-3 z" />
        <path d="M10,21 h2 v2 h-2 z M13,22 h3 v1 h-3 z M18,22 h1 v3 h-1 z" />
        <path d="M8,24 h3 v1 h-3 z M12,25 h2 v2 h-2 z M16,24 h2 v2 h-2 z" />
      </svg>

      <div className="text-[7.5px] leading-tight text-black">
        <div className="font-bold text-[8px]">CERTIFICATION OFFICIELLE</div>
        <div className="font-semibold text-slate-800">E.H. AÏN EL TÜRCK</div>
        <div className="text-slate-600">{getStatusLabel()}</div>
        <div className="text-slate-500 font-mono text-[7px]">{monthName}</div>
      </div>
    </div>
  );
};
