// TODO: Remove this login once Google sign-in is working. Change DIRECTOR_TEMP_PASSWORD before the live event.

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { APP_CONFIG, constantTimeCompare, sha256 } from '../lib/config';
import { LockIcon, ShieldIcon, AlertTriangleIcon, GlobeIcon } from '../components/Icons';
import schoolLogo from '../assets/logo.png';
import padulaTitleImg from '../assets/padula-title.png';

const LOCKOUT_KEY = 'padula_director_lockout';

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function saveLockoutState(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {}
}

const GENERIC_ERROR = "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.";

export default function DirectorTempLoginPage({ onBackToPublic }: { onBackToPublic?: () => void }) {
  const { setCurrentUser, setActiveView, addAuditLog, staff } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  // Check lockout on mount and periodic interval
  useEffect(() => {
    const check = () => {
      const state = getLockoutState();
      if (state.lockedUntil && Date.now() < state.lockedUntil) {
        setLockoutMinutes(Math.ceil((state.lockedUntil - Date.now()) / 60000));
      } else if (state.lockedUntil && Date.now() >= state.lockedUntil) {
        saveLockoutState({ attempts: 0, lockedUntil: null });
        setLockoutMinutes(null);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // If feature flag is disabled, show disabled view (or 404)
  if (!APP_CONFIG.directorTempLoginEnabled) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#fff',
        textAlign: 'center',
      }}>
        <div className="glass-card" style={{ maxWidth: '460px', padding: '36px', background: '#0f182c' }}>
          <AlertTriangleIcon size={40} color="#f87171" />
          <h2 style={{ margin: '16px 0 8px', fontSize: '20px', fontWeight: 800 }}>404 — Access Unavailable</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Temporary Sports Director login is currently disabled by administrative configuration.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (onBackToPublic) onBackToPublic();
              else setActiveView('public');
            }}
            style={{ marginTop: '16px' }}
          >
            Return to Public Portal
          </button>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check rate limit
    const state = getLockoutState();
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const rem = Math.ceil((state.lockedUntil - Date.now()) / 60000);
      setLockoutMinutes(rem);
      setErrorMessage(`Login locked. Too many failed attempts. Try again in ${rem} minute(s).`);
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 450)); // Timing defense

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Verify against configured Director email and secure password
    const emailMatches = cleanEmail === APP_CONFIG.directorEmail;
    
    // Hash and constant-time check to prevent timing leaks
    const computedHash = await sha256(cleanPassword);
    const expectedHash = await sha256(APP_CONFIG.directorTempPassword);
    const passwordMatches = constantTimeCompare(computedHash, expectedHash);

    if (!emailMatches || !passwordMatches) {
      const newAttempts = state.attempts + 1;
      if (newAttempts >= APP_CONFIG.maxFailedLogins) {
        const lockUntil = Date.now() + APP_CONFIG.lockoutDurationMinutes * 60 * 1000;
        saveLockoutState({ attempts: newAttempts, lockedUntil: lockUntil });
        setLockoutMinutes(APP_CONFIG.lockoutDurationMinutes);
        addAuditLog('login', `Director temporary login LOCKED: 5 failed attempts from identifier "${cleanEmail}"`);
        setErrorMessage(GENERIC_ERROR);
      } else {
        saveLockoutState({ attempts: newAttempts, lockedUntil: null });
        addAuditLog('login', `Director temporary login failed attempt (${newAttempts}/${APP_CONFIG.maxFailedLogins}) for "${cleanEmail}"`);
        // Exact generic error for all mismatches
        setErrorMessage(GENERIC_ERROR);
      }
      setIsLoading(false);
      return;
    }

    // Success: Look up director record or use official director record
    saveLockoutState({ attempts: 0, lockedUntil: null });
    const directorStaff = staff.find((s: any) => s.role === 'director' && s.email.toLowerCase() === cleanEmail) || {
      id: 'staff-dir-1',
      name: 'Mr. John Eric Samane',
      role: 'director' as const,
      email: cleanEmail,
      username: 'director',
      status: 'active' as const,
    };

    setCurrentUser({
      id: directorStaff.id,
      name: directorStaff.name,
      role: 'director',
      username: 'director',
      email: directorStaff.email,
      isActive: true,
      avatarInitials: 'JS',
      gmailVerified: true,
    });

    addAuditLog('login', `Sports Director John Eric Samane authenticated via temporary interim access`);
    setActiveView('admin');
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070c18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#fff',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#0f182c',
        borderRadius: '20px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        padding: '36px 32px',
        boxSizing: 'border-box',
      }}>

        {/* Interim Notice Banner */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <ShieldIcon size={18} color="#f87171" />
          <div style={{ fontSize: '11.5px', color: '#fca5a5', lineHeight: 1.4 }}>
            <strong>Director Interim Login:</strong> Temporary administrative fallback for Sports Director only.
          </div>
        </div>

        {/* Dual Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <img
            src={schoolLogo}
            alt="Asian College"
            style={{
              height: '42px',
              width: '42px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: '1.5px solid rgba(220, 38, 38, 0.25)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <img src={padulaTitleImg} alt="PADULA 2026" style={{ height: '34px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} />
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.03em' }}>
              Asian College Dumaguete
            </div>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-sports)',
          fontSize: '20px',
          fontWeight: 800,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          margin: '0 0 6px',
        }}>
          Sports Director Login
        </h1>
        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.4 }}>
          Authorized credentials for Mr. John Eric Samane.
        </p>

        {lockoutMinutes !== null && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#fca5a5',
            marginBottom: '16px',
          }}>
            Account locked due to 5 failed attempts. Please wait {lockoutMinutes} minute(s).
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '5px', textTransform: 'uppercase' }}>
              Director School Email
            </label>
            <input
              type="email"
              required
              disabled={lockoutMinutes !== null}
              value={email}
              onChange={e => { setEmail(e.target.value); setErrorMessage(''); }}
              placeholder="john.samane@asiancollege.edu.ph"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '5px', textTransform: 'uppercase' }}>
              Temporary Password
            </label>
            <input
              type="password"
              required
              disabled={lockoutMinutes !== null}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorMessage(''); }}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#fca5a5',
              lineHeight: 1.4,
            }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || lockoutMinutes !== null}
            style={{
              width: '100%',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: (isLoading || lockoutMinutes !== null) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || lockoutMinutes !== null) ? 0.6 : 1,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LockIcon size={14} />
            <span>{isLoading ? 'Verifying Credentials…' : 'Access Director Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onBackToPublic) onBackToPublic();
              else setActiveView('public');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <GlobeIcon size={13} /> Back to Public View
          </button>
        </form>

      </div>
    </div>
  );
}
