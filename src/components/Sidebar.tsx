import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import schoolLogo from '../assets/logo.png';
import {
  HomeIcon, CalendarIcon, UsersIcon, TrophyIcon,
  ShieldIcon, LiveIcon, BarChartIcon, LockIcon,
  ClipboardIcon, LogoutIcon, GlobeIcon, SparklesIcon, FileTextIcon,
  SunIcon, MoonIcon, MenuIcon, XIcon, UserIcon, SettingsIcon,
} from './Icons';

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  director:    { label: 'Sports Director',    color: '#dc2626' },
  coordinator: { label: 'Sports Coordinator', color: '#2563eb' },
  scorer:      { label: 'Scorer',             color: '#059669' },
  player:      { label: 'Varsity Athlete',    color: '#d97706' },
  guest:       { label: 'Public Spectator',   color: '#64748b' },
};

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ size?: number; color?: string; className?: string }>;
  badge?: number;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const Sidebar: React.FC = () => {
  const { currentUser, setCurrentUser, activeView, setActiveView, matches, accessRequests } = useApp();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('padula_theme') as 'light' | 'dark' | null;
      return saved || (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('padula_theme', theme);
    } catch {}
  }, [theme]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on view/navigation change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [activeView]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!currentUser) return null;

  const liveCount = matches.filter(m => m.status === 'live').length;
  const pendingAccessCount = accessRequests ? accessRequests.filter(r => r.status === 'pending').length : 0;
  const roleMeta = ROLE_META[currentUser.role] ?? ROLE_META.guest;

  const getGroupsForRole = (role: UserRole): NavGroup[] => {
    if (role === 'director') {
      return [
        {
          heading: 'Overview',
          items: [
            { id: 'admin', label: 'Dashboard', icon: HomeIcon },
          ],
        },
        {
          heading: 'Competition',
          items: [
            { id: 'event-setup', label: 'Event Setup', icon: CalendarIcon },
            { id: 'bracket',     label: 'Brackets', icon: TrophyIcon },
            { id: 'schedule',    label: 'Schedule & Results', icon: CalendarIcon },
            { id: 'scorekeeper', label: 'Scorer Desk', icon: ClipboardIcon },
            { id: 'live',        label: 'Live Scoreboard', icon: LiveIcon, badge: liveCount || undefined },
          ],
        },
        {
          heading: 'People',
          items: [
            { id: 'registration', label: 'Registration', icon: UsersIcon },
            { id: 'player',       label: 'Player List',  icon: UserIcon },
            { id: 'officials',    label: 'Match Assignments', icon: ShieldIcon },
          ],
        },
        {
          heading: 'Analytics',
          items: [
            { id: 'analytics',   label: 'Analytics & Reports', icon: BarChartIcon },
            { id: 'scorers',     label: 'Leaderboards', icon: TrophyIcon },
            { id: 'predictions', label: 'Predictions', icon: SparklesIcon },
          ],
        },
        {
          heading: 'Admin',
          items: [
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'access-requests', label: 'Access Requests', icon: ShieldIcon, badge: pendingAccessCount || undefined },
            { id: 'announcements', label: 'Announcements', icon: FileTextIcon },
            { id: 'audit',         label: 'Audit Trail', icon: LockIcon },
            { id: 'archive',       label: 'Archive', icon: CalendarIcon },
          ],
        },
      ];
    }

    if (role === 'coordinator') {
      return [
        {
          heading: 'Overview',
          items: [
            { id: 'admin', label: 'Dashboard', icon: HomeIcon },
          ],
        },
        {
          heading: 'Competition',
          items: [
            { id: 'event-setup', label: 'Event Setup', icon: CalendarIcon },
            { id: 'bracket',     label: 'Brackets', icon: TrophyIcon },
            { id: 'schedule',    label: 'Schedule & Results', icon: CalendarIcon },
            { id: 'live',        label: 'Live Scoreboard', icon: LiveIcon, badge: liveCount || undefined },
          ],
        },
        {
          heading: 'People',
          items: [
            { id: 'registration', label: 'Registration', icon: UsersIcon },
            { id: 'player',       label: 'Player List',  icon: UserIcon },
            { id: 'officials',    label: 'Match Assignments', icon: ShieldIcon },
          ],
        },
        {
          heading: 'Analytics',
          items: [
            { id: 'analytics',   label: 'Analytics & Reports', icon: BarChartIcon },
            { id: 'scorers',     label: 'Leaderboards', icon: TrophyIcon },
            { id: 'predictions', label: 'Predictions', icon: SparklesIcon },
          ],
        },
        {
          heading: 'Administration',
          items: [
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'announcements', label: 'Announcements', icon: FileTextIcon },
          ],
        },
      ];
    }

    // Scorer subset
    return [
      {
        heading: 'Scoring',
        items: [
          { id: 'scorekeeper',      label: 'Scorer Desk', icon: ClipboardIcon },
          { id: 'scorer-dashboard', label: 'My Assigned Matches', icon: TrophyIcon },
        ],
      },
      {
        heading: 'Competition',
        items: [
          { id: 'bracket',     label: 'Brackets', icon: TrophyIcon },
          { id: 'schedule',    label: 'Schedule & Results', icon: CalendarIcon },
          { id: 'live',        label: 'Live Scoreboard', icon: LiveIcon, badge: liveCount || undefined },
          { id: 'scorers',     label: 'Leaderboards', icon: BarChartIcon },
          { id: 'predictions', label: 'Predictions', icon: SparklesIcon },
        ],
      },
    ];
  };

  const groups = getGroupsForRole(currentUser.role);

  return (
    <>
      {/* Mobile Sticky Top App Bar */}
      <div className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              minHeight: 44,
              minWidth: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MenuIcon size={20} />
          </button>
          <div>
            <div style={{ fontFamily: 'var(--font-sports)', fontSize: 14, fontWeight: 800, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              PADULA 2026
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: roleMeta.color }}>
              {roleMeta.label}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {liveCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveView('live')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--badge-live-bg)',
                border: '1px solid var(--badge-live-border)',
                color: 'var(--badge-live-text)',
                borderRadius: 20,
                padding: '4px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: 36,
              }}
            >
              <span className="live-dot" /> LIVE ({liveCount})
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              minHeight: 44,
              minWidth: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <SunIcon size={16} color="#f59e0b" /> : <MoonIcon size={16} color="#6366f1" />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileDrawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px 12px',
            borderBottom: '1px solid var(--border)',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img
              src={schoolLogo}
              alt="Asian College"
              style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0, borderRadius: '50%' }}
            />
            <div style={{ minWidth: 0 }}>
              <div className="brand-name" style={{ fontSize: 15, letterSpacing: '0.03em' }}>
                PADULA 2026
              </div>
              <div className="brand-tagline-sm" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Sports Analytics Portal
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close Navigation Menu"
            className="mobile-drawer-close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'none',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="sidebar-nav">
          {groups.map(group => (
            <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '4px 10px 2px',
                }}
              >
                {group.heading}
              </div>
              {group.items.map(item => {
                const IconComp = item.icon;
                const isActive = activeView === item.id || (item.id === 'player' && (activeView === 'player' || activeView === 'players' || activeView === 'player-stats'));
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="nav-icon">
                        <IconComp size={16} />
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 999,
                          background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--badge-live-bg)',
                          color: isActive ? '#ffffff' : 'var(--badge-live-text)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: User Card + Theme Toggle + Exit to Public View */}
        <div
          className="sidebar-footer"
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* User Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: roleMeta.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {currentUser.avatarInitials || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: roleMeta.color }}>
                {roleMeta.label}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 38,
              }}
            >
              {theme === 'dark' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <SunIcon size={14} color="#f59e0b" /> Light
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MoonIcon size={14} color="#6366f1" /> Dark
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentUser(null);
                setActiveView('public');
              }}
              title="Sign Out"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--badge-live-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 38,
              }}
            >
              <LogoutIcon size={14} />
              <span>Sign Out</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('public')}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 38,
            }}
          >
            <GlobeIcon size={14} />
            <span>Exit to Public View</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (44px+ minimum touch targets for phones & tablets) */}
      {currentUser.role === 'scorer' && (
        <nav className="mobile-bottom-nav" aria-label="Scorer Mobile Navigation">
          <button
            type="button"
            className={activeView === 'scorekeeper' ? 'active' : ''}
            onClick={() => setActiveView('scorekeeper')}
          >
            <ClipboardIcon size={18} />
            <span>Scorer Desk</span>
          </button>
          <button
            type="button"
            className={activeView === 'scorer-dashboard' ? 'active' : ''}
            onClick={() => setActiveView('scorer-dashboard')}
          >
            <TrophyIcon size={18} />
            <span>My Matches</span>
          </button>
          <button
            type="button"
            className={activeView === 'bracket' ? 'active' : ''}
            onClick={() => setActiveView('bracket')}
          >
            <TrophyIcon size={18} />
            <span>Brackets</span>
          </button>
          <button
            type="button"
            className={activeView === 'live' ? 'active' : ''}
            onClick={() => setActiveView('live')}
          >
            <LiveIcon size={18} />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Full Navigation Menu"
          >
            <MenuIcon size={18} />
            <span>Menu</span>
          </button>
        </nav>
      )}

      {(currentUser.role === 'director' || currentUser.role === 'coordinator') && (
        <nav className="mobile-bottom-nav" aria-label="Staff Mobile Navigation">
          <button
            type="button"
            className={activeView === 'admin' ? 'active' : ''}
            onClick={() => setActiveView('admin')}
          >
            <HomeIcon size={18} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={activeView === 'bracket' ? 'active' : ''}
            onClick={() => setActiveView('bracket')}
          >
            <TrophyIcon size={18} />
            <span>Brackets</span>
          </button>
          <button
            type="button"
            className={activeView === 'scorekeeper' ? 'active' : ''}
            onClick={() => setActiveView('scorekeeper')}
          >
            <ClipboardIcon size={18} />
            <span>Scorer Desk</span>
          </button>
          <button
            type="button"
            className={activeView === 'live' ? 'active' : ''}
            onClick={() => setActiveView('live')}
          >
            <LiveIcon size={18} />
            <span>Live Board</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Full Navigation Menu"
          >
            <MenuIcon size={18} />
            <span>Menu</span>
          </button>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
