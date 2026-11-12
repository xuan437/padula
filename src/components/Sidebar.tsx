import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import {
  HomeIcon,
  LiveIcon,
  BracketsIcon,
  ClipboardIcon,
  ClipboardListIcon,
  LogoutIcon,
  CalendarIcon,
  UsersIcon,
  BarChartIcon,
  FileTextIcon,
  ShieldIcon,
  MedalIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  SparklesIcon,
} from './Icons';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';

interface NavItem {
  id: string;
  label: string;
  icon: (color?: string) => React.ReactNode;
  roles: UserRole[];
  badge?: string;
  targetView?: string;
  sectionHeader?: string;
}

const NAV_ITEMS: NavItem[] = [
  // ── Director & Coordinator Nav ──
  {
    id: 'admin-dashboard',
    label: 'Dashboard',
    icon: () => <HomeIcon size={16} />,
    roles: ['director', 'coordinator'],
    targetView: 'admin',
  },
  {
    id: 'scorekeeper-admin',
    label: 'Scoring Desk',
    icon: () => <ClipboardIcon size={16} />,
    roles: ['director', 'coordinator'],
    targetView: 'scorekeeper',
  },
  {
    id: 'live',
    label: 'Live Scoreboard',
    icon: () => <LiveIcon size={16} />,
    roles: ['director', 'coordinator'],
    badge: 'live',
  },
  {
    id: 'bracket',
    label: 'Brackets',
    icon: () => <BracketsIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'player',
    label: 'Players',
    icon: () => <UsersIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'scorers',
    label: 'Top Scorers',
    icon: () => <MedalIcon size={16} />,
    roles: ['director', 'coordinator', 'scorer'],
  },
  {
    id: 'registration',
    label: 'Registration',
    icon: () => <ClipboardListIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'setup-wizard',
    label: 'Setup Wizard',
    icon: () => <CalendarIcon size={16} />,
    roles: ['director', 'coordinator'],
    targetView: 'setup-wizard',
  },
  {
    id: 'officials-hub',
    label: 'Officials Hub',
    icon: () => <ShieldIcon size={16} />,
    roles: ['director', 'coordinator'],
    targetView: 'officials',
  },
  {
    id: 'event-setup',
    label: 'Event Setup',
    icon: () => <CalendarIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: () => <BarChartIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'predictions',
    label: 'Prediction AI',
    icon: () => <SparklesIcon size={16} />,
    roles: ['director', 'coordinator'],
    targetView: 'predictions',
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    icon: () => <FileTextIcon size={16} />,
    roles: ['director'],
  },

  // ── Scorer Nav ──
  {
    id: 'scorer-dashboard',
    label: 'Dashboard',
    icon: () => <HomeIcon size={16} />,
    roles: ['scorer'],
    targetView: 'scorer-dashboard',
  },
  {
    id: 'scorekeeper',
    label: 'Scoring Desk',
    icon: () => <ClipboardIcon size={16} />,
    roles: ['scorer'],
    targetView: 'scorekeeper',
    sectionHeader: 'OFFICIATING DESK',
  },
  {
    id: 'scorer-brackets',
    label: 'Brackets & Schedule',
    icon: () => <BracketsIcon size={16} />,
    roles: ['scorer'],
    targetView: 'bracket',
  },

  // ── Public Results ──
  {
    id: 'public',
    label: 'Public Results',
    icon: () => <GlobeIcon size={16} />,
    roles: ['director', 'coordinator', 'scorer'],
    targetView: 'public',
    sectionHeader: 'PUBLIC VIEW',
  },
];

export default function Sidebar() {
  const { currentUser, activeView, setActiveView, setCurrentUser, matches } = useApp();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('padula_theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('padula_theme', theme);
  }, [theme]);

  if (!currentUser) return null;

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const liveCount = matches.filter(m => m.status === 'live').length;
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(currentUser.role));

  const roleLabels: Record<string, string> = {
    director: 'Sports Director',
    coordinator: 'Sports Coordinator',
    scorer: 'Official Scorer',
    guest: 'Spectator',
  };

  const isMockDirector = currentUser.name.includes('Mock') || currentUser.id === 'mock-director';
  const displayName = isMockDirector ? 'Mr. John Eric Samane' : currentUser.name;
  const displayRole = isMockDirector ? 'Sports Director' : (roleLabels[currentUser.role] || currentUser.role);
  const displayInitials = isMockDirector ? 'JS' : (currentUser.avatarInitials ?? currentUser.name[0]);

  return (
    <aside className="sidebar">
      {/* Brand Header with Dual Logos */}
      <div
        className="sidebar-brand"
        style={{
          padding: '6px 4px 10px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          marginBottom: '6px',
        }}
      >
        <img
          src={schoolLogo}
          alt="Asian College"
          style={{
            height: '40px',
            width: '40px',
            objectFit: 'cover',
            borderRadius: '50%',
            flexShrink: 0,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.22))',
            border: '1.5px solid rgba(220, 38, 38, 0.25)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '3px',
            minWidth: 0,
          }}
        >
          <img
            src={padulaTitleImg}
            alt="PADULA 2026"
            style={{
              height: '24px',
              width: 'auto',
              maxWidth: '125px',
              objectFit: 'contain',
              objectPosition: 'left center',
              display: 'block',
            }}
          />
          <span
            style={{
              fontSize: '9.5px',
              color: 'var(--text-muted)',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
              display: 'block',
              textAlign: 'left',
            }}
          >
            Asian College Dumaguete
          </span>
        </div>
      </div>

      {/* User Info Bar */}
      <div className="user-pill" style={{ marginBottom: '14px' }}>
        <div className="user-avatar" style={isMockDirector ? { background: 'var(--accent)', color: '#fff' } : undefined}>
          {displayInitials}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div className="user-role">{displayRole}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleNav.map(item => {
          const target = item.targetView || item.id;
          const isActive = activeView === target;

          return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
              {item.sectionHeader && (
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  padding: '12px 10px 4px',
                  textTransform: 'uppercase',
                }}>
                  {item.sectionHeader}
                </div>
              )}
              <button
                id={`nav-${item.id}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveView(target)}
              >
                <span className="nav-icon">{item.icon()}</span>
                <span>{item.label}</span>
                {item.badge === 'live' && liveCount > 0 && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>{liveCount}</span>
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer: Theme toggle & sign out */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Minimal Theme Switcher */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleTheme}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px' }}
        >
          {theme === 'light' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
          <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
        </button>

        {/* Exit to Public View / Logout */}
        <button
          className="logout-btn"
          id="logout-btn"
          onClick={() => {
            setCurrentUser(null);
            setActiveView('public');
          }}
        >
          <LogoutIcon size={16} />
          <span>Exit to Public View</span>
        </button>
      </div>
    </aside>
  );
}
