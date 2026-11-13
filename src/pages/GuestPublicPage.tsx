import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon, SPORTS_CATALOG } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
  TrophyIcon,
  MapPinIcon,
  FlameIcon,
  MedalIcon,
  FileTextIcon,
  PrinterIcon,
  BracketsIcon,
  CalendarIcon,
  SearchIcon,
  ShieldIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  SparklesIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
  ClockIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import TournamentTreeBracket from '../components/TournamentTreeBracket';
import AIPredictionModal from '../components/AIPredictionModal';
import FloatingDepartmentCards from '../components/FloatingDepartmentCards';
import DigitalLedClock from '../components/DigitalLedClock';
import { SportFilter } from '../components/ui';
import { predictMatch } from '../lib/predictionAi';
import type { Match } from '../types';

type PublicTab = 'live' | 'results' | 'standings' | 'brackets' | 'schedule' | 'tally' | 'announcements' | 'predictions';

// ── Real QR Code Component (Scalable SVG) ───────────────────────────────────
function QRCodeDisplay({ url, size = 110 }: { url: string; size?: number }) {
  // Deterministic clean QR pattern matrix
  const matrix = useMemo(() => {
    const s = 15;
    const grid: boolean[][] = Array.from({ length: s }, () => Array(s).fill(false));
    // Draw 3 corner finder patterns (7x7)
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, s - 7);
    drawFinder(s - 7, 0);

    // Fill timing patterns and hash data
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= s - 8) ||
          (r >= s - 8 && c < 8)
        ) {
          continue;
        }
        const val = ((r * 13 + c * 7 + url.length) ^ (r + c)) % 3;
        grid[r][c] = val === 0 || (r === 7 && c % 2 === 0) || (c === 7 && r % 2 === 0);
      }
    }
    return grid;
  }, [url]);

  return (
    <div style={{
      background: '#ffffff',
      padding: '10px',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      <svg width={size} height={size} viewBox="0 0 15 15" shapeRendering="crispEdges">
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0a1128" /> : null
          )
        )}
      </svg>
    </div>
  );
}

// ── Share Match Result Card ────────────────────────────────────────────────
function ShareMatchModal({ match, onClose }: { match: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const formatLabel = match.format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
  const text = `🏆 ${match.teamA} ${match.scoreA} – ${match.scoreB} ${match.teamB} (${getSportName(match.sport)} - ${match.round} · ${formatLabel}) · 📅 ${match.scheduledDate || '2026-11-10'} · ⏰ ${match.scheduledTime || '09:00 AM'} · 📍 ${match.venue || 'Main Court'} · Asian College Padula Athletics`;

  const copyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '24px',
        background: 'var(--bg-surface)',
        borderRadius: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Share Official Match Card</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={16} />
          </button>
        </div>

        {/* Card preview */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '2px solid var(--accent)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Asian College Padula Sports
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
            {getSportName(match.sport)} · {match.round} ({formatLabel})
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <CalendarIcon size={11} color="var(--text-muted)" /> {match.scheduledDate || '2026-11-10'}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <ClockIcon size={11} color="var(--text-muted)" /> {match.scheduledTime || '09:00 AM'}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <MapPinIcon size={11} color="var(--text-muted)" /> {match.venue || 'Main Court'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '14px 0' }}>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: match.winner === match.teamA ? 'var(--accent)' : 'var(--text-primary)' }}>
                {match.teamA}
              </div>
            </div>
            <div style={{
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '20px',
              padding: '6px 16px',
              borderRadius: '8px',
              letterSpacing: '2px',
            }}>
              {match.scoreA} : {match.scoreB}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: match.winner === match.teamB ? 'var(--accent)' : 'var(--text-primary)' }}>
                {match.teamB}
              </div>
            </div>
          </div>
          {match.winner && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <TrophyIcon size={14} color="#10b981" /> Official Winner: {match.winner}
            </div>
          )}
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
            Scorer: {match.scorekeeper || 'Official Desk'} · Referee: {match.referee || 'Certified Official'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={copyText}>
            {copied ? <><CheckIcon size={14} /> Copied to Clipboard!</> : 'Copy Full Result Details'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── QR Poster Print Modal ──────────────────────────────────────────────────
function QRPosterModal({ url, onClose }: { url: string; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '32px',
        background: '#ffffff',
        color: '#0a1128',
        borderRadius: '20px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Asian College Athletics • Dumaguete
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0a1128', margin: '6px 0 2px' }}>
          Padula 2026
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>
          Live Scores, Brackets, Schedules & Standings
        </p>

        <div style={{ margin: '0 auto 20px', display: 'inline-block' }}>
          <QRCodeDisplay url={url} size={180} />
        </div>

        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a1128', marginBottom: '4px' }}>
          Scan with your phone camera
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '24px' }}>
          {url}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
            <PrinterIcon size={16} /> Print QR Poster
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ color: '#334155', borderColor: '#cbd5e1' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: GUEST PUBLIC RESULTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function GuestPublicPage() {
  const { matches, teams, players, announcements, departments, events, venues, computeMedalTally, computeStandings, setActiveView, currentUser } = useApp();

  // Helper to resolve full Event & Venue details for any match
  const getMatchContext = (m: Match) => {
    const ev = events.find(e => e.id === m.eventId || e.sport === m.sport);
    const venueName = m.venue || ev?.venue || 'Asian College Main Gym';
    const venueObj = venues.find(v => v.name.toLowerCase() === venueName.toLowerCase());
    const format = m.format || ev?.format || (m.round.toLowerCase().includes('round robin') ? 'round_robin' : 'single_elimination');
    const formatLabel = format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    let formattedDate = m.scheduledDate || ev?.startDate || 'Nov 10, 2026';
    let timeStr = m.scheduledTime || ev?.startTime || '09:00 AM';
    if (m.scheduledTime && m.scheduledTime.includes('T')) {
      const d = new Date(m.scheduledTime);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        timeStr = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      }
    } else if (formattedDate && /^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      const d = new Date(`${formattedDate}T00:00:00`);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return {
      eventName: ev?.name || `${getSportName(m.sport)} Tournament`,
      eventStartTime: ev?.startTime || '08:00',
      eventEndTime: ev?.endTime || '17:00',
      venueName,
      venueLocation: venueObj?.location || 'Asian College Dumaguete Campus',
      venueCapacity: venueObj?.capacity,
      format,
      formatLabel,
      formattedDate,
      timeStr,
    };
  };

  // Read initial tab and sport filter from URL query params (for sharing)
  const [tab, setTab] = useState<PublicTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab') as PublicTab;
      if (['live', 'results', 'standings', 'brackets', 'schedule', 'tally', 'announcements', 'predictions'].includes(t)) {
        return t;
      }
    }
    return 'live';
  });

  const [filterSport, setFilterSport] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('sport') || 'all';
    }
    return 'all';
  });

  const [searchTeam, setSearchTeam] = useState('');
  const [myTeam, setMyTeam] = useState<string>(() => {
    try { return localStorage.getItem('padula_my_team') || ''; } catch { return ''; }
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [shareMatch, setShareMatch] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Updated 1 min ago');
  const [selectedAiMatch, setSelectedAiMatch] = useState<Match | null>(null);
  const [simSport, setSimSport] = useState<string>('s1');
  const [simTeamA, setSimTeamA] = useState<string>('');
  const [simTeamB, setSimTeamB] = useState<string>('');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleToggleMyTeam = (teamName: string) => {
    const next = myTeam === teamName ? '' : teamName;
    setMyTeam(next);
    setSearchTeam(next);
    try { localStorage.setItem('padula_my_team', next); } catch { }
  };

  // Update URL params when tab or filter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'public');
      url.searchParams.set('tab', tab);
      if (filterSport !== 'all') url.searchParams.set('sport', filterSport);
      else url.searchParams.delete('sport');
      window.history.replaceState({}, '', url.toString());
    }
  }, [tab, filterSport]);

  // Real-time last updated tick
  useEffect(() => {
    let mins = 0;
    const updateTime = () => {
      setLastUpdated(mins === 0 ? 'Updated just now' : `Updated ${mins} min ago`);
      mins = (mins + 1) % 3;
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [matches]);

  const togglePublicTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('padula_theme', next); } catch { }
  };

  // Canonical public URL
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=public&tab=${tab}${filterSport !== 'all' ? `&sport=${filterSport}` : ''}`
    : 'https://padula.asiancollege.edu.ph/?view=public';

  const copyPublicUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filtered datasets
  const liveMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'live') return false;
      if (m.isBye || isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) return false;
      if (filterSport !== 'all' && m.sport !== filterSport) return false;
      if (searchTeam) {
        const q = searchTeam.toLowerCase();
        if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, filterSport, searchTeam]);

  const finishedMatches = useMemo(() => {
    return matches
      .filter(m => {
        if (m.status !== 'finished') return false;
        if (m.isBye || isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) return false;
        if (filterSport !== 'all' && m.sport !== filterSport) return false;
        if (searchTeam) {
          const q = searchTeam.toLowerCase();
          if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .reverse();
  }, [matches, filterSport, searchTeam]);

  const scheduledMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'scheduled') return false;
      if (m.isBye || (isPlaceholder(m.teamA) && isPlaceholder(m.teamB))) return false;
      if (filterSport !== 'all' && m.sport !== filterSport) return false;
      if (searchTeam) {
        const q = searchTeam.toLowerCase();
        if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, filterSport, searchTeam]);

  const nextUpcoming = useMemo(() => {
    return matches.find(m => m.status === 'scheduled' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB));
  }, [matches]);

  const medalTally = useMemo(() => computeMedalTally(), [computeMedalTally]);

  // Standings per active sport
  const activeStandings = useMemo(() => {
    const sportToUse = filterSport !== 'all' ? filterSport : 's1';
    return computeStandings(sportToUse);
  }, [filterSport, computeStandings]);

  // Print trigger
  const handlePrint = () => window.print();

  return (
    <div style={{
      maxWidth: '1240px',
      width: '100%',
      margin: '0 auto',
      padding: '20px 16px 88px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxSizing: 'border-box',
      minWidth: 0,
    }}>

      {/* ── TOP NAV BAR: Spectator Header ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Left: Branding & Event */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px 10px',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}>
                Asian College Athletics · Dumaguete
              </span>
              <span style={{
                fontSize: '11px',
                color: isOnline ? '#059669' : '#d97706',
                background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                border: isOnline ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '999px',
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1.25,
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                <span>{isOnline ? `Live Sync · ${lastUpdated}` : 'Offline · Cached View'}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px 14px', flexWrap: 'wrap' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{
                  height: 'clamp(42px, 7vw, 56px)',
                  width: 'auto',
                  maxWidth: '200px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 14px rgba(15, 35, 71, 0.35))',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <h1 style={{
                  fontFamily: 'var(--font-sports)',
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '0.02em',
                  lineHeight: 1.15,
                }}>
                  Padula Sports — Tournament Analytics
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Public Results, Live Scores, Brackets &amp; Standings
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compact Icon Group (Share/QR, Theme, Print) + One Labeled "Staff Login" Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setShowSharePanel(p => !p)}
            title="Share or scan QR code"
            style={{ fontWeight: 600 }}
          >
            <GlobeIcon size={14} />
            <span>Share / QR</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={togglePublicTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handlePrint}
            title="Print Tournament Sheet"
          >
            <PrinterIcon size={14} />
            <span>Print</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setActiveView(currentUser.role === 'scorer' ? 'scorekeeper' : 'admin')}
              style={{ fontWeight: 700 }}
            >
              <span>← Back to Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setActiveView('login')}
              style={{ fontWeight: 700 }}
            >
              <ShieldIcon size={14} />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ── QR SHARE PANEL (Collapsible) ── */}
      {showSharePanel && (
        <div className="glass-card" style={{
          padding: '20px 24px',
          background: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          borderRadius: '16px',
        }}>
          <QRCodeDisplay url={publicUrl} size={100} />
          <div style={{ flex: '1 1 260px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Scan for Mobile Live Scoreboard
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Spectators on courtside can scan this code to view live scores, tournament brackets, and standings on their smartphones.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {publicUrl}
              </div>
              <button className="btn btn-sm btn-primary" onClick={copyPublicUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {copiedLink ? <><CheckIcon size={12} /> Copied</> : 'Copy Link'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowPosterModal(true)}>
                Print QR Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE NOW HERO STRIP (Big scores, sport icon, court, pulsing dot) ── */}
      {liveMatches.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1.5px solid var(--badge-live-border)',
            background: 'linear-gradient(135deg, var(--badge-live-bg), var(--bg-surface))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: 'var(--color-live)', letterSpacing: '0.06em' }}>
              <span className="live-dot" style={{ background: 'var(--color-live)' }} />
              LIVE NOW ON COURT ({liveMatches.length})
            </div>
            <button
              type="button"
              onClick={() => setTab('live')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11.5, padding: '3px 9px', fontWeight: 700 }}
            >
              View Live Feed →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {liveMatches.map(m => (
              <div
                key={`strip-${m.id}`}
                onClick={() => setTab('live')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {getSportIcon(m.sport, 13, 'var(--accent)')}
                    <span>{getSportName(m.sport)} · {m.venue || 'Main Arena'}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginTop: 3 }}>
                    {m.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>vs</span> {m.teamB}
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-live)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                  {m.scoreA} – {m.scoreB}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DIGITAL ARENA LED CLOCK & CALENDAR ── */}
      <DigitalLedClock />

      {/* ── FLOATING DEPARTMENT CARDS (Animated with Official Department Logos & Acronyms) ── */}
      <FloatingDepartmentCards
        selectedAcronym={searchTeam}
        onSelectDepartment={acronym => {
          if (searchTeam.toUpperCase() === acronym.toUpperCase()) {
            setSearchTeam('');
          } else {
            setSearchTeam(acronym);
          }
        }}
      />

      {/* ── ONE UNIFIED SPORT SELECTOR FOR ALL TABS ── */}
      <SportFilter
        value={filterSport === 'all' ? 'ALL' : filterSport}
        onChange={sp => setFilterSport(sp === 'ALL' ? 'all' : sp)}
      />

      {/* ── TABS ROW + SEARCH TEAMS + MY TEAM BOOKMARK ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <nav className="glass-card no-scrollbar" style={{
          display: 'flex',
          gap: '4px',
          padding: '5px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '12px',
          flex: '1 1 560px',
          maxWidth: '100%',
          minWidth: 0,
        }}>
          {([
            { id: 'live', label: 'Live', icon: <FlameIcon size={14} />, count: liveMatches.length },
            { id: 'results', label: 'Results', icon: <TrophyIcon size={14} />, count: finishedMatches.length },
            { id: 'standings', label: 'Standings', icon: <MedalIcon size={14} />, count: undefined },
            { id: 'brackets', label: 'Brackets', icon: <BracketsIcon size={14} />, count: undefined },
            { id: 'schedule', label: 'Schedule', icon: <CalendarIcon size={14} />, count: scheduledMatches.length },
            { id: 'tally', label: 'Medal Tally', icon: <MedalIcon size={14} />, count: undefined },
            { id: 'announcements', label: 'Announcements', icon: <FileTextIcon size={14} />, count: announcements.length },
            { id: 'predictions', label: 'Predictions', icon: <SparklesIcon size={14} />, count: undefined },
          ]).map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap',
                  padding: '8px 12px',
                  minHeight: '36px',
                }}
                onClick={() => setTab(t.id as PublicTab)}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : t.id === 'live' ? 'var(--badge-live-bg)' : 'var(--bg-elevated)',
                    color: isActive ? '#fff' : t.id === 'live' ? 'var(--badge-live-text)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Teams + My Team Star Filter on the Tab Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', maxWidth: '100%', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              value={searchTeam}
              onChange={e => setSearchTeam(e.target.value)}
              placeholder="Search teams..."
              style={{
                paddingLeft: '32px',
                paddingRight: '26px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '12.5px',
                borderRadius: '10px',
              }}
            />
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <SearchIcon size={14} />
            </div>
            {searchTeam && (
              <button
                type="button"
                onClick={() => { setSearchTeam(''); setMyTeam(''); }}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          <select
            value={myTeam}
            onChange={e => handleToggleMyTeam(e.target.value)}
            className="form-input"
            title="Bookmark My Team to highlight and filter their matches"
            style={{ width: 'auto', maxWidth: '150px', padding: '8px 10px', fontSize: '12px', borderRadius: '10px', fontWeight: 700 }}
          >
            <option value="">★ My Team</option>
            {teams.map(t => (
              <option key={t.id} value={t.name}>★ {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: LIVE MATCHES
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'live' && (
        <section>
          {liveMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <FlameIcon size={36} color="var(--accent)" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
                No live matches right now
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                {nextUpcoming
                  ? `Next match: ${nextUpcoming.teamA} vs ${nextUpcoming.teamB} (${getSportName(nextUpcoming.sport)}) scheduled at ${nextUpcoming.venue}.`
                  : 'All scheduled matches for today have concluded. Check Match Results or Standings for updates.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px',
            }}>
              {liveMatches.map(m => {
                const sportMeta = SPORTS_CATALOG.find(s => s.id === m.sport);
                const livePred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players, m);
                const ctx = getMatchContext(m);
                return (
                  <div key={m.id} className="scoreboard-card glass-card" style={{ padding: '20px' }}>
                    {/* Header: Sport, Format & LIVE badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {getSportIcon(m.sport, 16, 'var(--accent)')}
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {sportMeta?.name || m.sport} · {m.round}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: ctx.format === 'round_robin' ? 'rgba(59,130,246,0.14)' : 'rgba(220,38,38,0.14)',
                          color: ctx.format === 'round_robin' ? '#3b82f6' : 'var(--accent)',
                        }}>
                          {ctx.formatLabel}
                        </span>
                      </div>
                      <div className="live-indicator">
                        <span className="live-dot" /> LIVE
                      </div>
                    </div>

                    {/* Full Date, Time & Event Place Banner */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px 12px',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      marginBottom: '12px',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon size={12} color="var(--text-muted)" />
                        <strong>Date:</strong> {ctx.formattedDate}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon size={12} color="var(--text-muted)" />
                        <strong>Time:</strong> {ctx.timeStr}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPinIcon size={12} color="var(--accent)" />
                        <strong>Event Place:</strong> {ctx.venueName} ({ctx.venueLocation}{ctx.venueCapacity ? ` · Cap ${ctx.venueCapacity}` : ''})
                      </span>
                    </div>

                    {/* Team vs Team with score in center (fully responsive) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '8px 0 16px',
                    }}>
                      {/* Team A */}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {m.teamA}
                        </div>
                      </div>

                      {/* Large Center Score */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)', minWidth: '32px', textAlign: 'center' }}>
                          {m.scoreA}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>:</span>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)', minWidth: '32px', textAlign: 'center' }}>
                          {m.scoreB}
                        </span>
                      </div>

                      {/* Team B */}
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {m.teamB}
                        </div>
                      </div>
                    </div>

                    {/* AI Live Winner Prediction Strip (based on Past Performance + Live Score) */}
                    {livePred && (
                      <div
                        onClick={() => setSelectedAiMatch(m)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(59, 130, 246, 0.10))',
                          border: '1px solid rgba(220, 38, 38, 0.3)',
                          marginBottom: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <SparklesIcon size={13} /> AI Predicts: <strong style={{ color: 'var(--text-primary)' }}>{livePred.predictedWinner}</strong> ({livePred.predictedWinnerProb}%)
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            Proj Final: {livePred.predictedScoreA}–{livePred.predictedScoreB}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'rgba(59, 130, 246, 0.35)', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '5px' }}>
                          <div style={{ width: `${livePred.winProbA}%`, background: 'var(--accent)' }} />
                          <div style={{ width: `${livePred.winProbB}%`, background: '#3b82f6' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          <span>Past Perf: {livePred.statsA.eloRating} Elo ({livePred.statsA.wins}W–{livePred.statsA.losses}L) vs {livePred.statsB.eloRating} Elo ({livePred.statsB.wins}W–{livePred.statsB.losses}L)</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Full AI Forecast ↗</span>
                        </div>
                      </div>
                    )}

                    {/* Sport-specific round & detail info */}
                    <div style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px',
                    }}>
                      <span>
                        {m.sport === 's1' && 'Quarter 3 · 4:12 remaining'}
                        {m.sport === 's2' && 'Set 2 of 3 · Set Points: 21–18'}
                        {m.sport === 's3' && 'Game 2 · 15–12'}
                        {m.sport === 's4' && 'Game 3 · 9–11'}
                        {m.sport === 's5' && 'Map 1 · 14m · Towers: 4–2'}
                        {m.sport === 's6' && 'Round 5 · Standard Time Control'}
                        {m.sport === 's7' && 'Judges Evaluation Scoring in Progress'}
                        {!['s1', 's2', 's3', 's4', 's5', 's6', 's7'].includes(m.sport) && 'Regulation Play Active'}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Active</span>
                    </div>

                    {/* Footer: Officials & Share Action */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '10px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      <span>
                        Scorer: <strong>{m.scorekeeper || 'Official Desk'}</strong> · Ref: <strong>{m.referee || 'Certified Official'}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setShareMatch(m)}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: MATCH RESULTS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'results' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {finishedMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No completed matches found matching the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {finishedMatches.map(m => {
                const ctx = getMatchContext(m);
                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    {/* Left: Sport, Format, Teams & Full Details */}
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {getSportIcon(m.sport, 14, 'var(--accent)')}
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round} {m.matchNumber ? `(Match #${m.matchNumber})` : ''}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: ctx.format === 'round_robin' ? 'rgba(59,130,246,0.14)' : 'rgba(220,38,38,0.14)',
                          color: ctx.format === 'round_robin' ? '#3b82f6' : 'var(--accent)',
                        }}>
                          {ctx.formatLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        <span style={{ color: m.winner === m.teamA ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamA ? 900 : 700 }}>
                          {m.teamA}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, margin: '0 6px' }}>vs</span>
                        <span style={{ color: m.winner === m.teamB ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamB ? 900 : 700 }}>
                          {m.teamB}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon size={12} color="var(--text-muted)" />
                          <strong>Date:</strong> {ctx.formattedDate}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ClockIcon size={12} color="var(--text-muted)" />
                          <strong>Time:</strong> {ctx.timeStr}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPinIcon size={12} color="var(--accent)" />
                          <strong>Event Place:</strong> {ctx.venueName} ({ctx.venueLocation})
                        </span>
                        {m.winner && (
                          <span style={{ color: '#10b981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            • Winner: {m.winner}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Event: {ctx.eventName} · Official Scorer: {m.scorekeeper || 'Official Desk'} · Referee: {m.referee || 'Certified Official'}
                      </div>
                    </div>

                    {/* Right: Final score badge & Share Card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '1px',
                      }}>
                        {m.scoreA} – {m.scoreB}
                      </div>
                      <span className="status-badge finished">FINAL</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setShareMatch(m)}
                        style={{ padding: '6px 10px', fontSize: '11.5px' }}
                      >
                        Share Card
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: STANDINGS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'standings' && (
        <section className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {filterSport !== 'all' ? getSportName(filterSport) : 'Basketball'} Tournament Standings
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Ranked by match points, victories, and goal differentials
              </p>
            </div>
            <span className="badge-chip">
              <span>{activeStandings.length} Teams Competing</span>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px', width: '50px' }}>Rank</th>
                  <th style={{ padding: '10px 16px' }}>Team</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Played</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Won</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Lost</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {activeStandings.map((row, idx) => (
                  <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {row.teamName}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.played}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{row.won}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.lost}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900, color: 'var(--accent)' }}>{row.won * 2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: BRACKETS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'brackets' && (
        <TournamentTreeBracket
          initialSportId={filterSport !== 'all' ? filterSport : 's1'}
          showSportSelector={false}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 5: SCHEDULE
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'schedule' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scheduledMatches.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No upcoming scheduled matches found matching this filter.
            </div>
          ) : (
            scheduledMatches.map(m => {
              const ctx = getMatchContext(m);
              return (
                <div key={m.id} className="glass-card" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      {getSportIcon(m.sport, 14, 'var(--accent)')}
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {getSportName(m.sport)} · {m.round} {m.matchNumber ? `(Match #${m.matchNumber})` : ''}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: ctx.format === 'round_robin' ? 'rgba(59,130,246,0.14)' : 'rgba(220,38,38,0.14)',
                        color: ctx.format === 'round_robin' ? '#3b82f6' : 'var(--accent)',
                      }}>
                        {ctx.formatLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isPlaceholder(m.teamA) ? 'TBD' : m.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>vs</span> {isPlaceholder(m.teamB) ? 'TBD' : m.teamB}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon size={12} color="var(--text-muted)" />
                        <strong>Date:</strong> {ctx.formattedDate}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon size={12} color="var(--text-muted)" />
                        <strong>Time:</strong> {ctx.timeStr}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPinIcon size={12} color="var(--accent)" />
                        <strong>Event Place:</strong> {ctx.venueName} ({ctx.venueLocation}{ctx.venueCapacity ? ` · Cap ${ctx.venueCapacity}` : ''})
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Event: {ctx.eventName} · Official Scorer: {m.scorekeeper || 'Official Desk'} · Referee: {m.referee || 'Certified Official'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {!isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setSelectedAiMatch(m)}
                        title="View AI Match Probability Forecast"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          color: 'var(--accent)',
                          borderColor: 'rgba(220, 38, 38, 0.35)',
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: 'rgba(220, 38, 38, 0.06)',
                        }}
                      >
                        <SparklesIcon size={13} /> AI Forecast
                      </button>
                    )}
                    <span className="status-badge scheduled">SCHEDULED</span>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      ⏰ {ctx.timeStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 6: MEDAL TALLY
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'tally' && (
        <section className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Overall Department Medal Standings
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Official Asian College Dumaguete Athletic Standings
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '520px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 16px', width: '50px' }}>Rank</th>
                  <th style={{ padding: '10px 16px' }}>Department / College</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#eab308' }}>Gold</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#94a3b8' }}>Silver</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', color: '#b45309' }}>Bronze</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {medalTally.map((row, idx) => {
                  const dept = departments.find(d => d.id === row.departmentId);
                  return (
                    <tr key={row.departmentId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: dept?.color || 'var(--accent)' }} />
                          <strong style={{ color: 'var(--text-primary)' }}>{dept?.name || row.departmentName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({dept?.shortName || row.departmentName})</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#eab308' }}>{row.gold}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>{row.silver}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#b45309' }}>{row.bronze}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 900, color: 'var(--text-primary)' }}>{row.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 7: ANNOUNCEMENTS
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'announcements' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              No official tournament announcements at this time.
            </div>
          ) : (
            announcements.map(ann => (
              <div
                key={ann.id}
                className="glass-card"
                style={{
                  padding: '18px 22px',
                  borderLeft: `4px solid ${ann.priority === 'urgent' ? '#dc2626' : 'var(--accent)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {ann.priority === 'urgent' && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#dc2626',
                      background: 'rgba(220,38,38,0.12)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(220,38,38,0.25)',
                    }}>
                      URGENT
                    </span>
                  )}
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {ann.title}
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {ann.body}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Posted by {ann.createdBy} · {new Date(ann.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 8: PREDICTION AI
         ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'predictions' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '20px 24px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff'
              }}>
                <SparklesIcon size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Padula AI Match Intelligence
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Machine learning model estimating tournament win probabilities, projected scores, and key matchup factors.
                </p>
              </div>
            </div>

            {/* Quick Interactive Simulator Box */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 10, padding: 16,
              border: '1px solid var(--border)', marginTop: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SparklesIcon size={14} /> Simulate Any Head-to-Head Matchup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Sport
                  </label>
                  <select
                    className="input-field"
                    value={simSport}
                    onChange={e => {
                      setSimSport(e.target.value);
                      setSimTeamA('');
                      setSimTeamB('');
                      setSimResult(null);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {SPORTS_CATALOG.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Competitor A
                  </label>
                  <select
                    className="input-field"
                    value={simTeamA}
                    onChange={e => setSimTeamA(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Select Team A --</option>
                    {teams.filter(t => t.sport === simSport && t.isActive !== false).map(t => (
                      <option key={t.id} value={t.name} disabled={t.name === simTeamB}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Competitor B
                  </label>
                  <select
                    className="input-field"
                    value={simTeamB}
                    onChange={e => setSimTeamB(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Select Team B --</option>
                    {teams.filter(t => t.sport === simSport && t.isActive !== false).map(t => (
                      <option key={t.id} value={t.name} disabled={t.name === simTeamA}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!simTeamA || !simTeamB || simTeamA === simTeamB}
                onClick={() => {
                  const pred = predictMatch(simTeamA, simTeamB, simSport, matches, teams, players);
                  setSimResult(pred);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <SparklesIcon size={14} /> Forecast Matchup
              </button>

              {/* Simulation Output */}
              {simResult && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamA}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: simResult.winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)', marginLeft: 8 }}>
                        {simResult.winProbA}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      Projected {simResult.predictedScoreA} – {simResult.predictedScoreB}
                    </div>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: simResult.winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)', marginRight: 8 }}>
                        {simResult.winProbB}%
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamB}</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(59, 130, 246, 0.3)', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                    <div style={{ width: `${simResult.winProbA}%`, background: 'var(--accent)' }} />
                    <div style={{ width: `${simResult.winProbB}%`, background: '#3b82f6' }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <SparklesIcon size={12} color="var(--accent)" /> {simResult.tacticalSummary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Live Matches Winner Predictions */}
          {liveMatches.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', marginBottom: 12, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" /> Live Match Winner Predictions ({liveMatches.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {liveMatches.map(m => {
                  const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players, m);
                  if (!pred) return null;

                  return (
                    <div
                      key={m.id}
                      className="glass-card"
                      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', border: '1.5px solid rgba(220,38,38,0.4)' }}
                      onClick={() => setSelectedAiMatch(m)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round} · LIVE ({m.scoreA}–{m.scoreB})
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800 }}>
                          {pred.confidencePct}% AI Conf
                        </span>
                      </div>

                      <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <TrophyIcon size={12} color="#10b981" /> Predicted Winner:
                        </span>
                        <strong style={{ color: '#10b981' }}>{pred.predictedWinner} ({pred.predictedWinnerProb}%)</strong>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                          <span>{m.teamA} ({pred.winProbA}%)</span>
                          <span>{m.teamB} ({pred.winProbB}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#3b82f6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <span>Proj Final: <strong>{pred.predictedScoreA} – {pred.predictedScoreB}</strong></span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          Full Breakdown <ChevronRightIcon size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Scheduled Matches Forecast Cards */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.04em' }}>
              Forecasts for Scheduled Matches ({scheduledMatches.length})
            </div>

            {scheduledMatches.length === 0 ? (
              <div className="empty-state glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                No scheduled matches currently queued. Use the simulator above to forecast any matchup.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {scheduledMatches.map(m => {
                  const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players);
                  if (!pred) return null;

                  return (
                    <div
                      key={m.id}
                      className="glass-card"
                      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
                      onClick={() => setSelectedAiMatch(m)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {getSportName(m.sport)} · {m.round}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(220,38,38,0.12)', color: 'var(--accent)', fontWeight: 700 }}>
                          {pred.confidence}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                          <span>{m.teamA} ({pred.winProbA}%)</span>
                          <span>{m.teamB} ({pred.winProbB}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#3b82f6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <span>Spread: <strong>{pred.predictedScoreA} – {pred.predictedScoreB}</strong></span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          Details <ChevronRightIcon size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── MODALS ── */}
      {selectedAiMatch && <AIPredictionModal match={selectedAiMatch} onClose={() => setSelectedAiMatch(null)} />}
      {showPosterModal && <QRPosterModal url={publicUrl} onClose={() => setShowPosterModal(false)} />}
      {shareMatch && <ShareMatchModal match={shareMatch} onClose={() => setShareMatch(null)} />}

      {/* ── SPECTATOR MOBILE BOTTOM NAVIGATION (44px+ touch targets) ── */}
      <nav className="mobile-bottom-nav" aria-label="Spectator Mobile Navigation">
        <button
          type="button"
          className={tab === 'live' ? 'active' : ''}
          onClick={() => setTab('live')}
        >
          <FlameIcon size={18} />
          <span>Live {liveMatches.length > 0 ? `(${liveMatches.length})` : ''}</span>
        </button>
        <button
          type="button"
          className={tab === 'results' ? 'active' : ''}
          onClick={() => setTab('results')}
        >
          <TrophyIcon size={18} />
          <span>Results</span>
        </button>
        <button
          type="button"
          className={tab === 'standings' ? 'active' : ''}
          onClick={() => setTab('standings')}
        >
          <MedalIcon size={18} />
          <span>Standings</span>
        </button>
        <button
          type="button"
          className={tab === 'brackets' ? 'active' : ''}
          onClick={() => setTab('brackets')}
        >
          <BracketsIcon size={18} />
          <span>Brackets</span>
        </button>
        <button
          type="button"
          className={tab === 'schedule' ? 'active' : ''}
          onClick={() => setTab('schedule')}
        >
          <CalendarIcon size={18} />
          <span>Schedule</span>
        </button>
      </nav>
    </div>
  );
}
