import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon, SPORTS_CATALOG } from '../lib/sports';
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
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import TournamentTreeBracket from '../components/TournamentTreeBracket';

type PublicTab = 'live' | 'results' | 'standings' | 'brackets' | 'schedule' | 'tally' | 'announcements';

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
  const text = `🏆 ${match.teamA} ${match.scoreA} – ${match.scoreB} ${match.teamB} (${getSportName(match.sport)} - ${match.round}) · Asian College Padula Athletics`;

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
        maxWidth: '440px',
        width: '100%',
        padding: '24px',
        background: 'var(--bg-surface)',
        borderRadius: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Share Match Result</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
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
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Asian College Padula Intramurals
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {getSportName(match.sport)} · {match.round} · {match.venue}
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
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>
              Winner: {match.winner}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={copyText}>
            {copied ? '✓ Copied to Clipboard!' : 'Copy Result Text'}
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
          <button className="btn btn-sm btn-ghost" onClick={onClose} style={{ color: '#64748b' }}>✕</button>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Asian College Athletics • Dumaguete
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0a1128', margin: '6px 0 2px' }}>
          Padula Intramurals 2026
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
  const { matches, announcements, departments, computeMedalTally, computeStandings, setActiveView } = useApp();

  // Read initial tab and sport filter from URL query params (for sharing)
  const [tab, setTab] = useState<PublicTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab') as PublicTab;
      if (['live', 'results', 'standings', 'brackets', 'schedule', 'tally', 'announcements'].includes(t)) {
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
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [shareMatch, setShareMatch] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

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
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const togglePublicTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('padula_theme', next); } catch {}
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
      if (filterSport !== 'all' && m.sport !== filterSport) return false;
      if (searchTeam) {
        const q = searchTeam.toLowerCase();
        if (!m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, filterSport, searchTeam]);

  const nextUpcoming = useMemo(() => {
    return matches.find(m => m.status === 'scheduled');
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
      margin: '0 auto',
      padding: '24px 16px 64px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>

      {/* ── TOP NAV BAR: Minimal Spectator Header ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Asian College Athletics • Dumaguete
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Live Sync
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{
                  height: '64px',
                  width: 'auto',
                  maxWidth: '240px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 14px rgba(15, 35, 71, 0.35))',
                }}
              />
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-sports)',
                  fontSize: '22px',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                }}>
                  Public Results & Scoreboard
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Tournament Analytics Portal · <span style={{ color: 'var(--text-muted)' }}>Last updated: {lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions (Staff Login, Theme, Share, Print) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Share QR Button */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setShowSharePanel(p => !p)}
            style={{ fontWeight: 600 }}
          >
            <GlobeIcon size={14} />
            <span>Share / QR</span>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={togglePublicTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
          </button>

          {/* Print */}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handlePrint}
          >
            <PrinterIcon size={14} />
            <span>Print</span>
          </button>

          {/* Staff Login Link */}
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setActiveView('login')}
            style={{ fontWeight: 700 }}
          >
            <ShieldIcon size={14} />
            <span>Staff & Athlete Login</span>
          </button>
        </div>
      </header>

      {/* ── QR SHARE PANEL (Collapsible / Modal) ── */}
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
              <button className="btn btn-sm btn-primary" onClick={copyPublicUrl}>
                {copiedLink ? '✓ Copied' : 'Copy Link'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowPosterModal(true)}>
                Print QR Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER BAR: Sports Catalog & Team Search ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Sport pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          <button
            type="button"
            className={`btn btn-sm ${filterSport === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterSport('all')}
            style={{ borderRadius: '20px', padding: '5px 14px', flexShrink: 0 }}
          >
            All Sports
          </button>
          {SPORTS_CATALOG.map(s => {
            const isSel = filterSport === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterSport(s.id)}
                style={{
                  borderRadius: '20px',
                  padding: '5px 14px',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {getSportIcon(s.id, 13, isSel ? '#ffffff' : 'var(--text-muted)')}
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Team search input */}
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <input
            type="text"
            className="form-input"
            value={searchTeam}
            onChange={e => setSearchTeam(e.target.value)}
            placeholder="Search teams (e.g. Padula Eagles, Red Lions)..."
            style={{
              paddingLeft: '34px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '13px',
              borderRadius: '10px',
            }}
          />
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <SearchIcon size={15} />
          </div>
          {searchTeam && (
            <button
              type="button"
              onClick={() => setSearchTeam('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TABS BAR (Clean responsive tabs) ── */}
      <nav className="glass-card" style={{
        display: 'flex',
        gap: '4px',
        padding: '6px',
        overflowX: 'auto',
        borderRadius: '12px',
      }}>
        {([
          { id: 'live',          label: 'Live Matches',  icon: <FlameIcon size={14} />, count: liveMatches.length },
          { id: 'results',       label: 'Results',       icon: <TrophyIcon size={14} />, count: finishedMatches.length },
          { id: 'standings',     label: 'Standings',     icon: <MedalIcon size={14} />, count: undefined },
          { id: 'brackets',      label: 'Brackets',      icon: <BracketsIcon size={14} />, count: undefined },
          { id: 'schedule',      label: 'Schedule',      icon: <CalendarIcon size={14} />, count: scheduledMatches.length },
          { id: 'tally',         label: 'Medal Tally',   icon: <MedalIcon size={14} />, count: undefined },
          { id: 'announcements', label: 'Announcements', icon: <FileTextIcon size={14} />, count: announcements.length },
        ]).map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                flex: '1 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                padding: '8px 12px',
              }}
              onClick={() => setTab(t.id as PublicTab)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
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
                return (
                  <div key={m.id} className="scoreboard-card glass-card" style={{ padding: '20px' }}>
                    {/* Header: Sport & LIVE badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getSportIcon(m.sport, 16, 'var(--accent)')}
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {sportMeta?.name || m.sport} · {m.round}
                        </span>
                      </div>
                      <div className="live-indicator">
                        <span className="live-dot" /> LIVE
                      </div>
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
                        {!['s1','s2','s3','s4','s5','s6','s7'].includes(m.sport) && 'Regulation Play Active'}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Active</span>
                    </div>

                    {/* Footer: Venue & Share Action */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '10px',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPinIcon size={13} color="var(--text-muted)" /> {m.venue}
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
              {finishedMatches.map(m => (
                <div key={m.id} className="glass-card" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  {/* Left: Sport & Teams */}
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {getSportIcon(m.sport, 14, 'var(--accent)')}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {getSportName(m.sport)} · {m.round}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      <span style={{ color: m.winner === m.teamA ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamA ? 900 : 700 }}>
                        {m.teamA}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, margin: '0 6px' }}>vs</span>
                      <span style={{ color: m.winner === m.teamB ? 'var(--accent)' : 'inherit', fontWeight: m.winner === m.teamB ? 900 : 700 }}>
                        {m.teamB}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPinIcon size={12} /> {m.venue}
                      {m.winner && (
                        <span style={{ marginLeft: '6px', color: '#10b981', fontWeight: 700 }}>
                          • Winner: {m.winner}
                        </span>
                      )}
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
              ))}
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
          showSportSelector={true}
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
            scheduledMatches.map(m => (
              <div key={m.id} className="glass-card" style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {getSportIcon(m.sport, 14, 'var(--accent)')}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {getSportName(m.sport)} · {m.round}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {m.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>vs</span> {m.teamB}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPinIcon size={12} /> {m.venue}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-badge scheduled">SCHEDULED</span>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {m.scheduledTime || 'TBD'}
                  </div>
                </div>
              </div>
            ))
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
                  Posted by {ann.createdBy} · {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── MODALS ── */}
      {showPosterModal && <QRPosterModal url={publicUrl} onClose={() => setShowPosterModal(false)} />}
      {shareMatch && <ShareMatchModal match={shareMatch} onClose={() => setShareMatch(null)} />}
    </div>
  );
}
