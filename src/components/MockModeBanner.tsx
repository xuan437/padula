import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CheckIcon, RefreshIcon, XIcon } from './Icons';

export const SHOW_DEMO_BAR = true;

export default function MockModeBanner() {
  const { currentUser, setCurrentUser, activeView, setActiveView, signInMockAccount, seedDemoData } = useApp();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('padula_demo_bar_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [seededToast, setSeededToast] = useState(false);

  const visible = SHOW_DEMO_BAR && !dismissed;

  useEffect(() => {
    document.documentElement.style.setProperty('--demo-bar-height', visible ? '36px' : '0px');
    return () => {
      document.documentElement.style.setProperty('--demo-bar-height', '0px');
    };
  }, [visible]);

  if (!visible) return null;

  const quickSwitch = async (email: string) => {
    await signInMockAccount(email);
  };

  const getActiveLabel = () => {
    if (!currentUser || activeView === 'public') return 'Public Spectator';
    if (currentUser.role === 'director') return 'Demo Director';
    if (currentUser.role === 'coordinator') return 'Demo Coordinator';
    if (currentUser.role === 'scorer') return 'Demo Scorer';
    return currentUser.name;
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('padula_demo_bar_dismissed', 'true');
    } catch {}
  };

  const handleSeed = () => {
    seedDemoData();
    setSeededToast(true);
    setTimeout(() => setSeededToast(false), 2200);
  };

  const isDirector = currentUser?.role === 'director' && activeView !== 'public';
  const isCoord = currentUser?.role === 'coordinator' && activeView !== 'public';
  const isScorer = currentUser?.role === 'scorer' && activeView !== 'public';

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        minHeight: 36,
        background: '#1e1b4b',
        borderBottom: '1px solid rgba(129, 140, 248, 0.28)',
        color: '#e0e7ff',
        padding: '4px 14px',
        fontSize: 11.5,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            background: '#4f46e5',
            color: '#ffffff',
            padding: '1px 7px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.06em',
          }}
        >
          DEMO
        </span>
        <span style={{ color: '#c7d2fe', fontWeight: 600 }}>
          Active: <strong style={{ color: '#ffffff' }}>{getActiveLabel()}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => quickSwitch('jsamane@asiancollege.edu.ph')}
          style={{
            background: isDirector ? '#dc2626' : 'rgba(255,255,255,0.08)',
            border: isDirector ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.16)',
            color: '#fff',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Demo Director
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('demo.coordinator@asiancollege.edu.ph')}
          style={{
            background: isCoord ? '#2563eb' : 'rgba(255,255,255,0.08)',
            border: isCoord ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.16)',
            color: '#fff',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Demo Coordinator
        </button>
        <button
          type="button"
          onClick={() => quickSwitch('demo.scorer@asiancollege.edu.ph')}
          style={{
            background: isScorer ? '#059669' : 'rgba(255,255,255,0.08)',
            border: isScorer ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.16)',
            color: '#fff',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Demo Scorer
        </button>
        <button
          type="button"
          onClick={() => setActiveView('mock-login')}
          style={{
            background: activeView === 'mock-login' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#e0e7ff',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          All Demo Accounts
        </button>
        <button
          type="button"
          onClick={handleSeed}
          title="Load or reset realistic Asian College Padula 2026 teams, players, live & finished matches"
          style={{
            background: seededToast ? '#10b981' : 'rgba(16, 185, 129, 0.16)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: seededToast ? '#ffffff' : '#6ee7b7',
            borderRadius: 6,
            padding: '2px 9px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {seededToast ? (
            <><CheckIcon size={12} color="#ffffff" /> Demo Data Loaded</>
          ) : (
            <><RefreshIcon size={11} color="#6ee7b7" /> Seed Demo Data</>
          )}
        </button>
        {activeView !== 'public' && (
          <button
            type="button"
            onClick={() => {
              setCurrentUser(null);
              setActiveView('public');
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#ffffff',
              borderRadius: 6,
              padding: '2px 9px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Public View
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss demo bar for this session"
          aria-label="Dismiss demo bar"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a5b4fc',
            padding: '2px 6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <XIcon size={12} />
        </button>
      </div>
    </div>
  );
}
