import { useState, useEffect } from 'react';
import campusPhoto from '../assets/campus.jpg';
import padulaTitleImg from '../assets/padula-title.png';
import { useApp } from '../context/AppContext';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
} from '../components/Icons';

interface LoginPageProps {
  onBackToPublic?: () => void;
}

const LOCKOUT_KEY = 'padula_login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

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

/* ── Campus photo replaces old SVG illustration ── */

export default function LoginPage({ onBackToPublic }: LoginPageProps) {
  const { setCurrentUser, setActiveView, registeredUsers, players, addAuditLog } = useApp();

  const [loginMode, setLoginMode] = useState<'athlete' | 'staff'>('athlete');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  // Check lockout on mount and every 10 seconds
  useEffect(() => {
    const checkLock = () => {
      const state = getLockoutState();
      if (state.lockedUntil && Date.now() < state.lockedUntil) {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 60000);
        setLockoutMinutes(remaining);
      } else if (state.lockedUntil && Date.now() >= state.lockedUntil) {
        saveLockoutState({ attempts: 0, lockedUntil: null });
        setLockoutMinutes(null);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGuestAccess = () => {
    if (onBackToPublic) {
      onBackToPublic();
    } else {
      setActiveView('public');
    }
  };

  const handleQuickFill = (identifier: string, pass: string, mode: 'athlete' | 'staff') => {
    setLoginMode(mode);
    setEmail(identifier);
    setPassword(pass);
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check if account is locked
    const lockState = getLockoutState();
    if (lockState.lockedUntil && Date.now() < lockState.lockedUntil) {
      const remaining = Math.ceil((lockState.lockedUntil - Date.now()) / 60000);
      setErrorMessage(`Account temporarily locked due to 5 failed attempts. Please try again in ${remaining} minute(s).`);
      return;
    }

    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      setErrorMessage('Please enter both identifier (email or Student ID) and password.');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 350));

    // Look up registered user by email OR username OR player's student ID
    const foundUser = registeredUsers.find(u => {
      const emailMatch = u.email?.toLowerCase() === cleanInput;
      const usernameMatch = u.username?.toLowerCase() === cleanInput;
      return emailMatch || usernameMatch;
    }) || registeredUsers.find(u => {
      if (u.role === 'player') {
        const matchedPlayer = players.find(p => p.studentId.toLowerCase() === cleanInput);
        if (matchedPlayer) {
          return (
            (matchedPlayer.email && u.email?.toLowerCase() === matchedPlayer.email.toLowerCase()) ||
            u.username?.toLowerCase() === matchedPlayer.studentId.toLowerCase() ||
            u.name.toLowerCase() === matchedPlayer.name.toLowerCase()
          );
        }
      }
      return false;
    });

    if (!foundUser) {
      setIsLoading(false);
      if (loginMode === 'athlete') {
        setErrorMessage(`Athlete account "${cleanInput}" not found. Enter your Student ID (e.g. 2024-001) or Gmail, or register with your team coach.`);
      } else {
        setErrorMessage(`Staff account "${cleanInput}" not found. Please contact the Sports Director.`);
      }
      addAuditLog('login', `Failed login: unregistered identifier "${cleanInput}"`);
      return;
    }

    // Check if deactivated
    if (foundUser.isActive === false) {
      setIsLoading(false);
      setErrorMessage('This account has been deactivated. Please contact the Sports Director.');
      addAuditLog('login', `Failed login: account deactivated for "${cleanInput}"`, foundUser.id, 'User');
      return;
    }

    // Password verification
    // Default fallback password for seeded users is 'password123', Director is 'admin123'
    const expectedPassword = foundUser.password || (foundUser.role === 'director' ? 'admin123' : 'password123');

    if (cleanPassword !== expectedPassword) {
      const newAttempts = lockState.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_MS;
        saveLockoutState({ attempts: newAttempts, lockedUntil: lockUntil });
        setLockoutMinutes(15);
        setErrorMessage('Account temporarily locked due to 5 failed attempts. Please try again in 15 minutes.');
        addAuditLog('login', `Account locked (5 failed attempts): "${cleanInput}" locked for 15 minutes`, foundUser.id, 'User');
      } else {
        saveLockoutState({ attempts: newAttempts, lockedUntil: null });
        setErrorMessage('Incorrect password. Please verify your credentials.');
        addAuditLog('login', `Failed login: incorrect password for "${cleanInput}" (Attempt ${newAttempts}/${MAX_ATTEMPTS})`, foundUser.id, 'User');
      }
      setIsLoading(false);
      return;
    }

    // Success! Clear lockout attempts
    saveLockoutState({ attempts: 0, lockedUntil: null });
    setCurrentUser(foundUser);
    addAuditLog('login', `Successful login: ${foundUser.role.toUpperCase()} ${foundUser.name} (${foundUser.email || foundUser.username})`, foundUser.id, 'User', { id: foundUser.id, name: foundUser.name, role: foundUser.role });

    // Route each role to its designated home page
    if (foundUser.role === 'director' || foundUser.role === 'coordinator') {
      setActiveView('admin');
    } else if (foundUser.role === 'scorer') {
      setActiveView('scorekeeper');
    } else if (foundUser.role === 'player') {
      setActiveView('player');
    } else {
      setActiveView('public');
    }

    setIsLoading(false);
  };

  return (
    /* ── Centered compact layout ── */
    <div style={{
      minHeight: '100vh',
      background: '#080d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#fff',
    }}>

      {/* Centered card wrapper */}
      <div style={{
        width: '100%',
        maxWidth: '880px',
        background: '#0f182c',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        overflow: 'hidden',
        minHeight: '520px',
      }}>

        {/* ── LEFT: Login Form ── */}
        <div style={{
          flex: '0 0 380px',
          padding: '36px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>

          {/* Brand */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ marginBottom: '12px' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{
                  height: '56px',
                  width: 'auto',
                  maxWidth: '220px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))',
                }}
              />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-sports)',
              fontSize: '24px',
              fontWeight: 800,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              margin: '0 0 4px',
              color: '#fff',
              letterSpacing: '0.02em',
            }}>
              {loginMode === 'athlete' ? 'Athlete Portal Login' : 'Staff & Official Login'}
            </h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
              {loginMode === 'athlete'
                ? 'Sign in with your Student ID or Registered Email'
                : 'Asian College Dumaguete · Secure Operations Login'}
            </p>
          </div>

          {/* ── Segment Toggle: Athlete vs Staff ── */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            padding: '3px',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              type="button"
              onClick={() => { setLoginMode('athlete'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: loginMode === 'athlete' ? '#dc2626' : 'transparent',
                color: loginMode === 'athlete' ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s ease',
              }}
            >
              🏃 Athlete Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('staff'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: loginMode === 'staff' ? '#dc2626' : 'transparent',
                color: loginMode === 'staff' ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s ease',
              }}
            >
              👔 Staff & Official
            </button>
          </div>

          {/* Lockout Warning */}
          {lockoutMinutes !== null && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12.5px',
              color: '#fca5a5',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <LockIcon size={16} color="#fca5a5" />
              <div>
                <strong>Account Locked</strong>
                <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                  Please wait {lockoutMinutes} minute(s) before trying again.
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Email / Student ID Identifier */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {loginMode === 'athlete' ? 'Student ID or Athlete Email' : 'Staff Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  disabled={lockoutMinutes !== null}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMessage(''); }}
                  placeholder={loginMode === 'athlete' ? 'e.g. 2024-001 or athlete@gmail.com' : 'e.g. admin@gmail.com'}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '7px',
                    padding: '10px 12px 10px 34px',
                    fontSize: '13.5px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
                  <MailIcon size={15} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockoutMinutes !== null}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMessage(''); }}
                  placeholder={loginMode === 'athlete' ? 'Enter player password' : 'Enter staff password'}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '7px',
                    padding: '10px 38px 10px 34px',
                    fontSize: '13.5px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
                  <LockIcon size={15} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '3px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Helpers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Demo Quick Fill:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {loginMode === 'athlete' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('2024-001', 'password123', 'athlete')}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                      }}
                    >
                      Juan dela Cruz (2024-001)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('2024-002', 'password123', 'athlete')}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                      }}
                    >
                      Maria Reyes (2024-002)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@gmail.com', 'admin123', 'staff')}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                      }}
                    >
                      Director (admin123)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('s.chen@asiancollege.edu.ph', 'password123', 'staff')}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                      }}
                    >
                      Scorer Sam
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '7px',
                padding: '9px 12px',
                fontSize: '12.5px',
                color: '#f87171',
                lineHeight: 1.4,
              }}>
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || lockoutMinutes !== null}
              style={{
                width: '100%',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: lockoutMinutes !== null ? 'not-allowed' : 'pointer',
                opacity: isLoading || lockoutMinutes !== null ? 0.6 : 1,
                transition: 'background 0.15s ease',
                marginTop: '2px',
              }}
              onMouseEnter={e => { if (!isLoading && lockoutMinutes === null) e.currentTarget.style.background = '#b91c1c'; }}
              onMouseLeave={e => { if (!isLoading && lockoutMinutes === null) e.currentTarget.style.background = '#dc2626'; }}
            >
              {isLoading ? 'Checking credentials…' : 'Log In'}
            </button>

            {/* Guest */}
            <button
              type="button"
              onClick={handleGuestAccess}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '7px',
                color: 'rgba(255,255,255,0.65)',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '9px 14px',
                width: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
            >
              <ShieldIcon size={14} /> Continue as Guest Spectator
            </button>

          </form>
        </div>

        {/* ── RIGHT: Campus Photo Panel — full bleed ── */}
        <div className="login-welcome-panel" style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          minHeight: '520px',
        }}>
          <img
            src={campusPhoto}
            alt="Asian College Padula Campus"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Subtle dark gradient at bottom for legibility if needed */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,13,26,0.45) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
        </div>

      </div>

      {/* Hide right panel on mobile */}
      <style>{`
        @media (max-width: 680px) {
          .login-welcome-panel { display: none !important; }
        }
      `}</style>

    </div>
  );
}
