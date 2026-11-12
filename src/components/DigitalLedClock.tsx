import React, { useState, useEffect } from 'react';

interface SevenSegmentDigitProps {
  char: string;
  color?: string; // e.g. '#ffffff' for white, '#ff2b3d' for red
  dimColor?: string;
  size?: number; // scale multiplier
}

// 7-segment map: [a, b, c, d, e, f, g]
const SEGMENTS: Record<string, boolean[]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  '-': [false, false, false, false, false, false, true],
  ' ': [false, false, false, false, false, false, false],
};

export const SevenSegmentDigit: React.FC<SevenSegmentDigitProps> = ({
  char,
  color = '#ffffff',
  dimColor = 'rgba(255, 255, 255, 0.05)',
  size = 1,
}) => {
  const active = SEGMENTS[char] || SEGMENTS[' '];
  const width = 54 * size;
  const height = 94 * size;

  const glowFilter =
    color === '#ffffff'
      ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))'
      : 'drop-shadow(0 0 6px rgba(255, 43, 61, 0.85)) drop-shadow(0 0 14px rgba(255, 43, 61, 0.45))';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 54 94"
      style={{
        transform: 'skewX(-4deg)',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      {/* a - Top */}
      <polygon
        points="10,6 44,6 38,13 16,13"
        fill={active[0] ? color : dimColor}
        style={{ filter: active[0] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* b - Top Right */}
      <polygon
        points="46,8 52,14 47,44 41,39 41,14"
        fill={active[1] ? color : dimColor}
        style={{ filter: active[1] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* c - Bottom Right */}
      <polygon
        points="47,50 52,55 46,86 41,80 41,55"
        fill={active[2] ? color : dimColor}
        style={{ filter: active[2] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* d - Bottom */}
      <polygon
        points="10,88 44,88 38,81 16,81"
        fill={active[3] ? color : dimColor}
        style={{ filter: active[3] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* e - Bottom Left */}
      <polygon
        points="13,55 13,80 8,86 2,80 7,50"
        fill={active[4] ? color : dimColor}
        style={{ filter: active[4] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* f - Top Left */}
      <polygon
        points="13,14 13,39 7,44 2,39 8,8"
        fill={active[5] ? color : dimColor}
        style={{ filter: active[5] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
      {/* g - Middle */}
      <polygon
        points="14,47 18,42 36,42 40,47 36,52 18,52"
        fill={active[6] ? color : dimColor}
        style={{ filter: active[6] ? glowFilter : undefined, transition: 'fill 0.1s' }}
      />
    </svg>
  );
};

export default function DigitalLedClock() {
  const [now, setNow] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);
  const [colonVisible, setColonVisible] = useState<boolean>(true);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      setColonVisible(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute components
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;

  if (!is24Hour) {
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }

  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  // Month (1-12) & Day (1-31)
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dayStr = day < 10 ? `0${day}` : `${day}`;

  // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayOfWeekIndex = now.getDay();
  // We align with: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0
  const daysOfWeek = [
    { label: 'Mon', index: 1 },
    { label: 'Tue', index: 2 },
    { label: 'Wed', index: 3 },
    { label: 'Thu', index: 4 },
    { label: 'Fri', index: 5 },
    { label: 'Sat', index: 6 },
    { label: 'Sun', index: 0 },
  ];

  // Dummy / venue temperature (typical Dumaguete athletics arena temp: 28-30°C)
  const venueTemp = '29';

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '6px 0 16px 0',
      }}
    >
      {/* ── Subtitle label with institutional location ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '780px',
          padding: '0 8px 6px 8px',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px #ef4444',
              animation: 'pulse 1.4s infinite',
            }}
          />
          Padula 2026 Arena Clock · Dumaguete City (PST)
        </span>
        <button
          type="button"
          onClick={() => setIs24Hour(v => !v)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            fontSize: '10px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
          title="Toggle 12-hour or 24-hour time format"
        >
          {is24Hour ? '24-HOUR FORMAT' : '12-HOUR FORMAT'}
        </button>
      </div>

      {/* ── Outer Clock Casing (Curved Black Bezel with authentic Depth) ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          background: 'linear-gradient(180deg, #181b22 0%, #0d0f14 45%, #050608 100%)',
          border: '3px solid #282d3c',
          borderRadius: '24px',
          padding: '14px 20px',
          boxShadow:
            '0 20px 40px -10px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -4px 10px rgba(0, 0, 0, 0.9)',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Subtle glass reflection highlight across the top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            borderRadius: '20px 20px 0 0',
          }}
        />

        {/* LED Screen Display Acrylic Frame */}
        <div
          style={{
            background: '#040507',
            border: '1.5px solid #141720',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
            boxShadow: 'inset 0 3px 12px rgba(0, 0, 0, 0.95)',
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          {/* ── LEFT SECTION: Days of the week + AM/PM ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Days of week stack */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                lineHeight: 1.15,
              }}
            >
              {daysOfWeek.map(d => {
                const isToday = dayOfWeekIndex === d.index;
                return (
                  <span
                    key={d.label}
                    style={{
                      color: isToday ? '#ff2b3d' : '#2d3342',
                      textShadow: isToday ? '0 0 8px rgba(255, 43, 61, 0.9)' : undefined,
                      transition: 'color 0.3s',
                    }}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>

            {/* AM / PM indicator */}
            {!is24Hour && (
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  textShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '2px',
                }}
              >
                {isPM ? 'PM' : 'AM'}
              </div>
            )}
          </div>

          {/* ── CENTER SECTION: Huge White 7-Segment Digits HH:MM ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: '1 1 auto',
            }}
          >
            {/* Hours */}
            <SevenSegmentDigit char={hoursStr[0]} color="#ffffff" size={0.95} />
            <SevenSegmentDigit char={hoursStr[1]} color="#ffffff" size={0.95} />

            {/* Blinking Colon Separator */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '18px',
                padding: '0 4px',
                opacity: colonVisible ? 1 : 0.15,
                transition: 'opacity 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  background: '#ffffff',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.4)',
                }}
              />
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  background: '#ffffff',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.4)',
                }}
              />
            </div>

            {/* Minutes */}
            <SevenSegmentDigit char={minutesStr[0]} color="#ffffff" size={0.95} />
            <SevenSegmentDigit char={minutesStr[1]} color="#ffffff" size={0.95} />
          </div>

          {/* ── ALARM / TOURNAMENT STATUS ICONS ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              color: '#384152',
              flexShrink: 0,
            }}
          >
            {/* Alarm 1 icon */}
            <div
              title="Official Game Session Active"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1.5px solid #ff2b3d',
                color: '#ff2b3d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 900,
                boxShadow: '0 0 6px rgba(255, 43, 61, 0.6)',
              }}
            >
              1
            </div>

            {/* Alarm 2 icon */}
            <div
              title="Digital Sync Pulse Active"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1.5px solid #384152',
                color: '#384152',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 900,
              }}
            >
              2
            </div>
          </div>

          {/* ── RIGHT SECTION: Red LED Temperature & Date (MM.DD) ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            {/* Temperature: 29°C */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
              <SevenSegmentDigit char={venueTemp[0]} color="#ff2b3d" size={0.46} />
              <SevenSegmentDigit char={venueTemp[1]} color="#ff2b3d" size={0.46} />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#ff2b3d',
                  textShadow: '0 0 6px rgba(255, 43, 61, 0.9)',
                  marginLeft: '2px',
                  marginTop: '1px',
                }}
              >
                °C
              </span>
            </div>

            {/* Date: MM.DD with M & D indicators underneath */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <SevenSegmentDigit char={monthStr[0]} color="#ff2b3d" size={0.46} />
                <SevenSegmentDigit char={monthStr[1]} color="#ff2b3d" size={0.46} />

                {/* Dot separator */}
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    background: '#ff2b3d',
                    borderRadius: '1px',
                    alignSelf: 'flex-end',
                    marginBottom: '4px',
                    marginInline: '1px',
                    boxShadow: '0 0 6px #ff2b3d',
                  }}
                />

                <SevenSegmentDigit char={dayStr[0]} color="#ff2b3d" size={0.46} />
                <SevenSegmentDigit char={dayStr[1]} color="#ff2b3d" size={0.46} />
              </div>

              {/* M & D labels below the digits */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0 4px',
                  fontSize: '8px',
                  fontWeight: 900,
                  color: '#ff2b3d',
                  fontFamily: 'monospace',
                  textShadow: '0 0 4px rgba(255, 43, 61, 0.8)',
                  marginTop: '-2px',
                }}
              >
                <span>M</span>
                <span>D</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

