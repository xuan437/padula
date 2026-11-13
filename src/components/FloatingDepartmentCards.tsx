import { useState } from 'react';
import baaLogo from '../assets/departments/baa-logo.png';
import cseLogo from '../assets/departments/cse-logo.png';
import htmLogo from '../assets/departments/htm-logo.png';
import dpdLogo from '../assets/departments/dpd-logo.png';
import shsLogo from '../assets/departments/shs-logo.png';

export interface DepartmentCardData {
  id: string;
  acronym: string;
  fullName: string;
  moniker: string;
  primaryColor: string;
  glowColor: string;
  gradient: string;
  logoUrl: string;
  motto: string;
  animationDelay: string;
  floatDuration: string;
}

export const DEPARTMENT_CARDS: DepartmentCardData[] = [
  {
    id: 'baa',
    acronym: 'BAA',
    fullName: 'Business Administration & Accountancy',
    moniker: 'BAA Falcons',
    primaryColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    gradient: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
    logoUrl: baaLogo,
    motto: 'Strength, Leadership & Precision',
    animationDelay: '0s',
    floatDuration: '4.4s',
  },
  {
    id: 'cse',
    acronym: 'CSE',
    fullName: 'Computer Studies & Engineering',
    moniker: 'CSE Titans',
    primaryColor: '#9333ea',
    glowColor: 'rgba(147, 51, 234, 0.45)',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
    logoUrl: cseLogo,
    motto: 'Innovation, Logic & Code',
    animationDelay: '0.8s',
    floatDuration: '4.8s',
  },
  {
    id: 'htm',
    acronym: 'HTM',
    fullName: 'Hospitality & Tourism Management',
    moniker: 'HTM Chefs',
    primaryColor: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.45)',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    logoUrl: htmLogo,
    motto: 'Excellence, Grace & Passion',
    animationDelay: '1.6s',
    floatDuration: '4.2s',
  },
  {
    id: 'dpd',
    acronym: 'DPD',
    fullName: 'Diploma Programs Department',
    moniker: 'DPD Strikers',
    primaryColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
    logoUrl: dpdLogo,
    motto: 'Dedication, Agility & Grit',
    animationDelay: '2.4s',
    floatDuration: '5.0s',
  },
  {
    id: 'shs',
    acronym: 'SHS',
    fullName: 'Senior High School Department',
    moniker: 'Senior Dept',
    primaryColor: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.45)',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
    logoUrl: shsLogo,
    motto: 'Youth, Ambition & Excellence',
    animationDelay: '3.2s',
    floatDuration: '4.6s',
  },
];

interface FloatingDepartmentCardsProps {
  onSelectDepartment?: (acronym: string) => void;
  selectedAcronym?: string | null;
}

export default function FloatingDepartmentCards({
  onSelectDepartment,
  selectedAcronym,
}: FloatingDepartmentCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className="floating-cards-section" style={{ margin: '14px 0 20px' }}>
      {/* Dynamic Keyframes & Styling */}
      <style>{`
        @keyframes deptCardFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-13px) rotate(0.7deg);
          }
        }

        @keyframes cardGlowPulse {
          0%, 100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes shineSweep {
          0% {
            transform: translateX(-140%) rotate(25deg);
          }
          100% {
            transform: translateX(200%) rotate(25deg);
          }
        }

        .floating-card-item {
          will-change: transform, filter;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease, filter 0.3s ease;
        }

        .floating-card-item:hover {
          animation-play-state: paused !important;
          transform: translateY(-18px) scale(1.05) !important;
          z-index: 10;
        }

        .floating-cards-section {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }

        .cards-scroll-container {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          padding: 20px 8px 26px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .cards-scroll-container::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 1080px) {
          .cards-scroll-container {
            justify-content: flex-start;
            padding-left: 12px;
            padding-right: 12px;
          }
        }
      `}</style>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        width: '100%',
        maxWidth: '1004px',
        margin: '0 auto 6px',
        padding: '0 4px',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 10px var(--accent)',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent)',
          }}>
            Contending Departments · Padula 2026
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Official Athletic Houses of Asian College Dumaguete
        </span>
      </div>

      {/* Floating Cards Carousel */}
      <div className="cards-scroll-container">
        {DEPARTMENT_CARDS.map((dept) => {
          const isSelected = selectedAcronym?.toUpperCase() === dept.acronym.toUpperCase();
          const isHovered = hoveredCard === dept.id;

          return (
            <div
              key={dept.id}
              className="floating-card-item"
              onMouseEnter={() => setHoveredCard(dept.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectDepartment && onSelectDepartment(dept.acronym)}
              style={{
                width: '188px',
                height: '272px',
                flexShrink: 0,
                position: 'relative',
                borderRadius: '16px',
                cursor: onSelectDepartment ? 'pointer' : 'default',
                background: '#090d16',
                border: isSelected
                  ? `2px solid ${dept.primaryColor}`
                  : '1.5px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isHovered || isSelected
                  ? `0 16px 36px ${dept.glowColor}, 0 0 20px ${dept.glowColor}`
                  : '0 10px 24px rgba(0, 0, 0, 0.55)',
                overflow: 'hidden',
                animation: `deptCardFloat ${dept.floatDuration} ease-in-out infinite`,
                animationDelay: dept.animationDelay,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Dynamic Wave Background Effect (reproducing the graphics in the user image) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  zIndex: 0,
                }}
              >
                {/* Upper Subtle Lines */}
                <svg
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '80px', opacity: 0.25 }}
                  viewBox="0 0 200 80"
                  preserveAspectRatio="none"
                >
                  <path d="M 0,15 Q 100,5 200,25" stroke="#ffffff" strokeWidth="0.8" fill="none" />
                  <path d="M 0,25 Q 100,15 200,35" stroke="#ffffff" strokeWidth="0.8" fill="none" />
                  <path d="M 0,35 Q 100,25 200,45" stroke="#ffffff" strokeWidth="0.8" fill="none" />
                  <path d="M 0,45 Q 100,35 200,55" stroke="#ffffff" strokeWidth="0.8" fill="none" />
                </svg>

                {/* Bottom Color Wave Gradient */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '110px',
                    background: dept.gradient,
                    opacity: 0.88,
                    clipPath: 'polygon(0% 45%, 100% 15%, 100% 100%, 0% 100%)',
                  }}
                />

                {/* Secondary flowing wave accent lines */}
                <svg
                  style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '110px', opacity: 0.4 }}
                  viewBox="0 0 200 110"
                  preserveAspectRatio="none"
                >
                  <path d="M 0,70 Q 80,40 200,85" stroke="#ffffff" strokeWidth="1" fill="none" />
                  <path d="M 0,80 Q 90,50 200,95" stroke="#ffffff" strokeWidth="0.75" fill="none" />
                  <path d="M 0,90 Q 100,60 200,105" stroke="#ffffff" strokeWidth="0.75" fill="none" />
                </svg>

                {/* Shimmer Sheen sweep on hover */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '60px',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                      animation: 'shineSweep 1.2s ease infinite',
                    }}
                  />
                )}
              </div>

              {/* Card Header (Stars + Acronym as Player Name) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '10px 10px 4px',
                  textAlign: 'center',
                }}
              >
                {/* 5 Stars */}
                <div
                  style={{
                    fontSize: '11px',
                    letterSpacing: '2px',
                    color: '#facc15',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                    lineHeight: 1,
                  }}
                >
                  ★★★★★
                </div>

                {/* Respective Acronym as PLAYER NAME */}
                <h4
                  style={{
                    margin: '3px 0 0',
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 12px rgba(255,255,255,0.25)',
                    lineHeight: 1.1,
                  }}
                >
                  {dept.acronym}
                </h4>
              </div>

              {/* Center Emblem / Shield Cutout (reproducing the white shield frame in the user image) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 14px 6px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '136px',
                    height: '144px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.65))',
                  }}
                >
                  {/* SVG Shield Background */}
                  <svg
                    viewBox="0 0 100 125"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {/* Outer Crisp Shield Border */}
                    <path
                      d="M 0,18 Q 50,2 100,18 L 100,98 L 50,125 L 0,98 Z"
                      fill="#ffffff"
                      stroke={dept.primaryColor}
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Logo Image Centered Inside Shield */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 3,
                      width: '84px',
                      height: '84px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '-6px',
                    }}
                  >
                    <img
                      src={dept.logoUrl}
                      alt={`${dept.acronym} Logo`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                        transition: 'transform 0.25s ease',
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Moniker & Full Department Label */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '4px 10px 10px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                    lineHeight: 1.2,
                  }}
                >
                  {dept.moniker}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={dept.fullName}
                >
                  {dept.fullName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
