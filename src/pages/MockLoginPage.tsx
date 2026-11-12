import { useState } from 'react';
import { useApp } from '../context/AppContext';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';
import { ShieldIcon, ClipboardIcon, FlameIcon } from '../components/Icons';

export default function MockLoginPage() {
  const { signInMockAccount, setActiveView } = useApp();
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const handleSignIn = async (email: string) => {
    setErrorMessage('');
    setLoadingEmail(email);

    try {
      const res = await signInMockAccount(email);
      if (!res.success) {
        setErrorMessage(res.error || "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.");
      }
    } catch {
      setErrorMessage("This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.");
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080d1a',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#0f182c',
          borderRadius: '24px',
          border: '1px solid rgba(220, 38, 38, 0.35)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7)',
          padding: '38px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={schoolLogo}
              alt="Asian College"
              style={{
                height: '42px',
                width: '42px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1.5px solid rgba(220, 38, 38, 0.25)',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{ height: '32px', width: 'auto', maxWidth: '130px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>
                Asian College Dumaguete
              </span>
            </div>
          </div>

          <span
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            OFFICIAL DEMO ACCOUNTS
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
            Demo Role Accounts (1 Per Role)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Sign in with any of the 3 official demo accounts for Sports Director, Sports Coordinator, or Official Scorekeeper.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 3 Demo Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. Demo Director */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  1. Mr. John Eric Samane (Sports Director)
                </div>
                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>
                  jsamane@asiancollege.edu.ph
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Full Access: Manage sports, events, brackets, coordinators, audit trail, and reports.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loadingEmail !== null}
              onClick={() => handleSignIn('jsamane@asiancollege.edu.ph')}
              style={{ fontWeight: 800, padding: '9px 18px', fontSize: '13px' }}
            >
              {loadingEmail === 'jsamane@asiancollege.edu.ph' ? 'Signing in...' : 'Sign in as Director'}
            </button>
          </div>

          {/* 2. Demo Coordinator */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  2. Demo Coordinator (Sports Coordinator)
                </div>
                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>
                  demo.coordinator@asiancollege.edu.ph
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Coordinator Access: Register teams, generate brackets, schedule matches, and assign scorekeepers.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loadingEmail !== null}
              onClick={() => handleSignIn('demo.coordinator@asiancollege.edu.ph')}
              style={{ fontWeight: 800, padding: '9px 18px', fontSize: '13px', background: '#2563eb' }}
            >
              {loadingEmail === 'demo.coordinator@asiancollege.edu.ph' ? 'Signing in...' : 'Sign in as Coordinator'}
            </button>
          </div>

          {/* 3. Demo Scorekeeper */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FlameIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  3. Demo Scorekeeper (Official Scorer)
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                  demo.scorer@asiancollege.edu.ph
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Scoring Desk Access: Start assigned matches, record live scores, finalize results, and advance winners.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loadingEmail !== null}
              onClick={() => handleSignIn('demo.scorer@asiancollege.edu.ph')}
              style={{ fontWeight: 800, padding: '9px 18px', fontSize: '13px', background: '#059669' }}
            >
              {loadingEmail === 'demo.scorer@asiancollege.edu.ph' ? 'Signing in...' : 'Sign in as Scorekeeper'}
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActiveView('public')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <span style={{ fontSize: '14px' }}>←</span> Back to Public View
          </button>
        </div>
      </div>
    </div>
  );
}

