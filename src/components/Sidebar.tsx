import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import PasswordChangeModal from './PasswordChangeModal';
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
  LockIcon,
  GlobeIcon,
} from './Icons';
import padulaTitleImg from '../assets/padula-title.png';

interface NavItem {
  id: string;
  label: string;
  icon: (color?: string) => React.ReactNode;
  roles: UserRole[];
  badge?: string;
  targetView?: string;
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
    roles: ['director', 'coordinator', 'scorer', 'player'],
  },
  {
    id: 'registration',
    label: 'Registration',
    icon: () => <ClipboardListIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'event-setup',
    label: 'Event Setup',
    icon: () => <CalendarIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'admin',
    label: 'Officials Hub',
    icon: () => <ShieldIcon size={16} />,
    roles: ['director', 'coordinator'],
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: () => <BarChartIcon size={16} />,
    roles: ['director', 'coordinator'],
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
    targetView: 'scorekeeper',
  },
  {
    id: 'scorekeeper',
    label: 'Scoring Desk',
    icon: () => <ClipboardIcon size={16} />,
    roles: ['scorer'],
  },
  {
    id: 'scorer-brackets',
    label: 'Brackets & Schedule',
    icon: () => <BracketsIcon size={16} />,
    roles: ['scorer'],
    targetView: 'bracket',
  },

  // ── Player Nav ──
  {
    id: 'player-dashboard',
    label: 'Dashboard',
    icon: () => <HomeIcon size={16} />,
    roles: ['player'],
    targetView: 'player',
  },
  {
    id: 'player-stats',
    label: 'My Stats',
    icon: () => <BarChartIcon size={16} />,
    roles: ['player'],
  },
  {
    id: 'player-brackets',
    label: 'Brackets & Schedule',
    icon: () => <BracketsIcon size={16} />,
    roles: ['player'],
    targetView: 'bracket',
  },

  // ── Public Results ──
  {
    id: 'public',
    label: 'Public Results',
    icon: () => <GlobeIcon size={16} />,
    roles: ['director', 'coordinator', 'guest'],
  },
];

export default function Sidebar() {
  const { currentUser, activeView, setActiveView, setCurrentUser, matches } = useApp();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('padula_theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    // Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
    player: 'Student Athlete',
    guest: 'Guest Spectator',
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '6px 8px 10px', gap: '4px' }}>
          <img
            src={padulaTitleImg}
            alt="PADULA 2026"
            style={{
              height: '56px',
              width: 'auto',
              maxWidth: '200px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
            }}
          />
          <div className="brand-tagline-sm" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            Asian College Dumaguete
          </div>
        </div>

        {/* User Info Bar */}
        <div className="user-pill" style={{ marginBottom: currentUser.role === 'guest' ? '6px' : '14px' }}>
          <div className="user-avatar" style={currentUser.role === 'guest' ? { background: 'var(--accent-subtle)', color: 'var(--accent)' } : undefined}>
            {currentUser.avatarInitials ?? currentUser.name[0]}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name}
            </div>
            <div className="user-role">{roleLabels[currentUser.role] || currentUser.role}</div>
          </div>
        </div>

        {/* Guest Login Callout */}
        {currentUser.role === 'guest' && (
          <div style={{ marginBottom: '12px' }}>
            <button
              className="btn btn-primary btn-full"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                fontWeight: 700,
              }}
              onClick={() => setActiveView('login')}
            >
              <ShieldIcon size={14} /> Official & Player Login
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {visibleNav.map(item => {
            const target = item.targetView || item.id;
            const isActive = activeView === target || activeView === item.id;

            return (
              <button
                key={item.id}
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
            );
          })}
        </nav>

        {/* Footer: Theme toggle, Change password & sign out */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* Change Password for logged in users */}
          {currentUser.role !== 'guest' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsPasswordModalOpen(true)}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px', fontSize: '12px' }}
            >
              <LockIcon size={14} />
              <span>Change Password</span>
            </button>
          )}

          {/* Minimal Theme Switcher */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px' }}
          >
            {theme === 'light' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
            <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
          </button>

          {/* Exit to Public View */}
          {currentUser.role !== 'guest' ? (
            <button
              className="logout-btn"
              id="logout-btn"
              onClick={() => {
                setCurrentUser({
                  id: 'guest',
                  name: 'Public Visitor',
                  role: 'guest',
                  username: 'guest',
                  avatarInitials: 'PV',
                });
                setActiveView('public');
              }}
            >
              <LogoutIcon size={16} />
              <span>Exit to Public View</span>
            </button>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', color: 'var(--accent)', fontWeight: 600 }}
              onClick={() => setActiveView('login')}
            >
              <ShieldIcon size={15} />
              <span>Staff & Athlete Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
