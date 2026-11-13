import React, { useState, useEffect } from 'react';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';
import campusPhoto from '../assets/image.png';
import { useApp } from '../context/AppContext';
import {
  GlobeIcon,
  GoogleIcon,
  LockIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  UserIcon,
  TrashIcon,
} from '../components/Icons';
import { shouldShowDemo, verifyGoogleServerToken } from '../lib/config';

interface LoginPageProps {
  onBackToPublic?: () => void;
  showDemoProp?: boolean;
}

export default function LoginPage({ onBackToPublic, showDemoProp }: LoginPageProps) {
  const {
    verifyAndSignInStaff,
    signInMockAccount,
    staffInvitations,
    respondToInvitation,
    submitAccessRequest,
    setActiveView,
    addAuditLog,
  } = useApp();

  // ── Mode Toggle (SHOW_DEMO: true vs false) ─────────────────────────────────
  const [showDemoState] = useState<boolean>(() => {
    if (showDemoProp !== undefined) return showDemoProp;
    return shouldShowDemo();
  });
  const [demoExpanded, setDemoExpanded] = useState(false);

  // ── States ─────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<
    'none' | 'wrong_domain' | 'not_approved' | 'session_expired' | 'popup_blocked' | 'offline' | 'network_error' | 'invalid_password'
  >('none');
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [requestSubmittedBanner, setRequestSubmittedBanner] = useState<string | null>(null);

  // Form states inside Google Chooser
  const [selectedEmail, setSelectedEmail] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTypingCustom, setIsTypingCustom] = useState(false);

  // Request Access Modal Form
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqRole, setReqRole] = useState<'coordinator' | 'scorer'>('coordinator');
  const [reqSport, setReqSport] = useState('Basketball');
  const [reqNote, setReqNote] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // ── Password Failure Cooldown & Paste Blocking State ────────────────────────
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('padula_login_failed_attempts');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(() => {
    try {
      const storedUntil = sessionStorage.getItem('padula_login_lockout_until');
      if (storedUntil) {
        const diff = Math.ceil((parseInt(storedUntil, 10) - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      }
    } catch { }
    return 0;
  });

  const [pasteBlockedWarning, setPasteBlockedWarning] = useState(false);

  // Active 1-second countdown ticker for 15s cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem('padula_login_lockout_until');
            sessionStorage.removeItem('padula_login_failed_attempts');
          } catch { }
          setFailedPasswordAttempts(0);
          setErrorMessage('');
          setErrorType('none');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto-dismiss paste blocked notification after 3.5s
  useEffect(() => {
    if (!pasteBlockedWarning) return;
    const t = setTimeout(() => setPasteBlockedWarning(false), 3500);
    return () => clearTimeout(t);
  }, [pasteBlockedWarning]);

  // ── Check Session Expiration ───────────────────────────────────────────────
  useEffect(() => {
    const expired = sessionStorage.getItem('padula_session_expired') === 'true';
    if (expired) {
      setErrorType('session_expired');
      setErrorMessage('Your session has expired due to inactivity. Please sign in again.');
      sessionStorage.removeItem('padula_session_expired');
    }
  }, []);

  // ── Remembered Recent Accounts on this Device ──────────────────────────────
  const [recentAccounts, setRecentAccounts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('padula_recent_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return ['jsamane@asiancollege.edu.ph'];
  });

  const rememberAccount = (email: string) => {
    try {
      const clean = email.trim().toLowerCase();
      const updated = [clean, ...recentAccounts.filter(a => a !== clean)].slice(0, 5);
      setRecentAccounts(updated);
      localStorage.setItem('padula_recent_accounts', JSON.stringify(updated));
    } catch { }
  };

  const removeAccount = (emailToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const clean = emailToRemove.trim().toLowerCase();
      const updated = recentAccounts.filter(a => a.toLowerCase() !== clean);
      setRecentAccounts(updated);
      localStorage.setItem('padula_recent_accounts', JSON.stringify(updated));
      if (selectedEmail.toLowerCase() === clean) {
        setSelectedEmail('');
      }
    } catch { }
  };

  // ── Navigation & Guest Access ──────────────────────────────────────────────
  const handleBackToPublic = () => {
    if (onBackToPublic) {
      onBackToPublic();
    } else {
      setActiveView('public');
    }
  };

  // ── Google Sign-In Entry Point ─────────────────────────────────────────────
  const handlePrimaryGoogleClick = () => {
    setErrorMessage('');
    setErrorType('none');

    // Offline network detection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorType('offline');
      setErrorMessage('You are currently offline. Please check your internet connection to sign in.');
      return;
    }

    // Always show the Google Account Chooser (no silent auto-login on shared devices)
    setShowAccountChooser(true);
    setIsRemoveMode(false);
    setIsTypingCustom(false);
    setPassword('');
  };

  // ── Execute Server-Verified Google Sign-In ──────────────────────────────────
  const executeGoogleSignIn = async (emailToVerify: string, passwordInput?: string) => {
    if (cooldownSeconds > 0) {
      setErrorType('invalid_password');
      setErrorMessage(`Security lockout active. Please wait ${cooldownSeconds} second(s) before trying again.`);
      return;
    }

    const cleanEmail = emailToVerify.trim().toLowerCase();
    setIsLoading(true);
    setErrorMessage('');
    setErrorType('none');

    try {
      // 1. Server-side token validation simulation
      const serverVerification = await verifyGoogleServerToken(cleanEmail);
      if (!serverVerification.success) {
        setErrorType('wrong_domain');
        setErrorMessage(
          serverVerification.error || 'Only official @asiancollege.edu.ph Google accounts are permitted.'
        );
        addAuditLog('denied_access', `Google token rejected for domain mismatch: ${cleanEmail}`, undefined, 'Auth');
        setIsLoading(false);
        return;
      }

      // 2. Verify against Sports Director approved-staff list & password credentials
      const authResult = await verifyAndSignInStaff(cleanEmail, passwordInput);

      if (!authResult.success) {
        if (authResult.error?.includes("isn't registered") || authResult.error?.includes("isn't approved")) {
          setErrorType('not_approved');
          setReqEmail(cleanEmail);
          setErrorMessage(
            "Your account isn't approved yet. Contact the Sports Director or submit an access request below."
          );
        } else if (authResult.error?.includes('password') || authResult.error?.includes('Password')) {
          const newAttempts = failedPasswordAttempts + 1;
          setFailedPasswordAttempts(newAttempts);
          try {
            sessionStorage.setItem('padula_login_failed_attempts', newAttempts.toString());
          } catch { }

          if (newAttempts >= 3) {
            const lockDuration = 15; // 15 seconds cooldown
            const lockUntil = Date.now() + lockDuration * 1000;
            try {
              sessionStorage.setItem('padula_login_lockout_until', lockUntil.toString());
            } catch { }
            setCooldownSeconds(lockDuration);
            setPassword('');
            setErrorType('invalid_password');
            setErrorMessage('3 incorrect password attempts reached. Login entry is locked for 15 seconds.');
            addAuditLog('failed_login', `Login locked for 15s after 3 invalid password attempts for ${cleanEmail}`, undefined, 'Auth');
          } else {
            setErrorType('invalid_password');
            setErrorMessage(`${authResult.error} (${newAttempts} of 3 attempts before a 15-second cooldown)`);
          }
        } else {
          setErrorMessage(authResult.error || 'Sign-in was not authorized.');
        }
        setIsLoading(false);
        return;
      }

      // Success! Reset failed attempts and cooldown
      try {
        sessionStorage.removeItem('padula_login_failed_attempts');
        sessionStorage.removeItem('padula_login_lockout_until');
      } catch { }
      setFailedPasswordAttempts(0);
      setCooldownSeconds(0);

      // Remember account for next chooser, close chooser modal
      rememberAccount(cleanEmail);
      setShowAccountChooser(false);
      setIsLoading(false);
    } catch {
      setErrorType('network_error');
      setErrorMessage('Unable to reach the Padula authentication server. Please check your network and retry.');
      setIsLoading(false);
    }
  };

  // ── Request Access Submission ──────────────────────────────────────────────
  const handleAccessRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) return;

    const cleanEmail = reqEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@asiancollege.edu.ph')) {
      alert('Access request email must belong to @asiancollege.edu.ph domain.');
      return;
    }

    setIsSubmittingReq(true);
    submitAccessRequest({
      name: reqName.trim(),
      email: cleanEmail,
      role: reqRole,
      sportOrDept: reqSport,
      note: reqNote.trim(),
    });

    setIsSubmittingReq(false);
    setShowRequestAccessModal(false);
    setRequestSubmittedBanner(
      `Access request submitted directly to Sports Director Mr. John Eric Samane! You will receive an invitation once approved.`
    );
    setReqNote('');
    setTimeout(() => setRequestSubmittedBanner(null), 6000);
  };

  // ── Mode A Demo Accounts (No real person's name or email) ───────────────────
  const DEMO_ACCOUNTS = [
    {
      roleId: 'director',
      roleLabel: 'Sports Director',
      badgeColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.16)',
      name: 'Demo Director',
      desc: 'Tournament governance, event setup, sports brackets & executive analytics',
      demoEmail: 'demo.director@asiancollege.edu.ph',
    },
    {
      roleId: 'coordinator',
      roleLabel: 'Sports Coordinator',
      badgeColor: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.16)',
      name: 'Demo Coordinator',
      desc: 'Manage assigned sport schedule, brackets & referee assignments',
      demoEmail: 'demo.coordinator@asiancollege.edu.ph',
    },
    {
      roleId: 'scorer',
      roleLabel: 'Official Scorer',
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.16)',
      name: 'Demo Scorer',
      desc: 'Live digital scoring desk, game sets & match finalization',
      demoEmail: 'demo.scorer@asiancollege.edu.ph',
    },
  ];

  const handleEnterDemo = async (demoEmail: string) => {
    setIsLoading(true);
    await signInMockAccount(demoEmail);
    setIsLoading(false);
  };

  const activeEmailForCheck = isTypingCustom ? customEmail.trim().toLowerCase() : selectedEmail;
  const matchingInvite = staffInvitations.find(
    i => i.recipientEmail.toLowerCase() === activeEmailForCheck
  );

  return (
    <div
      className="login-outer-wrapper"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#070b14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        color: '#fff',
        fontFamily: 'var(--font-base)',
      }}
    >
      <style>{`
        .login-card-container {
          width: 100%;
          max-width: 960px;
          min-height: 520px;
          background: #0d1527;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          overflow: hidden;
          position: relative;
        }
        .login-form-side {
          padding: 28px 36px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-sizing: border-box;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        .login-photo-side {
          position: relative;
          overflow: hidden;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          display: block;
          min-height: 420px;
          width: 100%;
          height: 100%;
        }
        @media (max-width: 768px) {
          .login-outer-wrapper {
            padding: 12px;
            align-items: flex-start;
          }
          .login-card-container {
            grid-template-columns: 1fr;
            min-height: auto;
            margin: auto 0;
          }
          .login-photo-side {
            min-height: 140px;
            max-height: 160px;
            height: 150px;
            border-left: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            order: -1;
          }
          .login-photo-side .photo-overlay-text {
            bottom: 12px !important;
            left: 14px !important;
            right: 14px !important;
          }
          .login-photo-side .photo-overlay-text div:nth-child(2) {
            font-size: 14px !important;
          }
          .login-photo-side .photo-overlay-text div:nth-child(3) {
            display: none !important;
          }
          .login-form-side {
            padding: 20px 16px;
          }
        }
        .login-primary-btn:focus-visible,
        .login-demo-btn:focus-visible,
        .login-link-btn:focus-visible {
          outline: 2px solid #ef4444;
          outline-offset: 2px;
        }
      `}</style>

      <div className="login-card-container">
        {/* ── LEFT COLUMN: Portal Form & Actions ── */}
        <div className="login-form-side">
          {/* Top Row: Back to Public Results & Dev Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleBackToPublic}
              className="login-link-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)')}
            >
              <GlobeIcon size={14} /> ← Back to Public Results
            </button>
          </div>

          {/* Header: Asian College Seal and Padula 2026 Logo Aligned on One Row */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <img
                src={schoolLogo}
                alt="Asian College Seal"
                style={{
                  height: '42px',
                  width: '42px',
                  objectFit: 'contain',
                  borderRadius: '50%',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                }}
              />
              <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.12)' }} />
              <img
                src={padulaTitleImg}
                alt="Padula 2026"
                style={{
                  height: '38px',
                  width: 'auto',
                  maxWidth: '160px',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#f87171',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Padula 2026 · Asian College Dumaguete
            </div>

            {/* Portal Title & Concise Description */}
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                margin: '0 0 4px',
                color: '#ffffff',
                fontFamily: 'var(--font-sports)',
                fontStyle: 'italic',
              }}
            >
              Staff &amp; Official Portal
            </h1>
            <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 16px', lineHeight: 1.45 }}>
              Official administrative console for Sports Directors, Coordinators, and certified Scorers.
            </p>
          </div>

          {/* Feedback & Error Messages (with aria-live="polite") */}
          <div aria-live="polite" role="alert">
            {requestSubmittedBanner && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  color: '#6ee7b7',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckIcon size={14} color="#10b981" />
                <span>{requestSubmittedBanner}</span>
              </div>
            )}

            {cooldownSeconds > 0 ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1.5px solid #ef4444',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: '#fca5a5',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertTriangleIcon size={16} color="#ef4444" />
                  <div>
                    <strong style={{ display: 'block', color: '#ffffff' }}>Security Cooldown Active</strong>
                    <span style={{ fontSize: '11.5px', color: '#fca5a5' }}>
                      3 incorrect password attempts. Please wait before retrying.
                    </span>
                  </div>
                </div>
                <div style={{
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '13px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontFamily: 'monospace',
                }}>
                  {cooldownSeconds}s
                </div>
              </div>
            ) : errorMessage ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.38)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangleIcon size={14} color="#ef4444" />
                  <span style={{ lineHeight: 1.4 }}>{errorMessage}</span>
                </div>
                {errorType === 'not_approved' && (
                  <button
                    type="button"
                    onClick={() => setShowRequestAccessModal(true)}
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Request Access
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Primary Action: ONE Google Sign-In Button */}
          <div style={{ marginBottom: '14px' }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={handlePrimaryGoogleClick}
              className="login-primary-btn"
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isLoading) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={e => {
                if (!isLoading) e.currentTarget.style.background = '#ffffff';
              }}
            >
              <GoogleIcon size={19} />
              <span>{isLoading ? 'Verifying with Server…' : 'Sign in with Institutional Google'}</span>
            </button>

            {/* Helper Text with Lock Icon (WCAG AA Contrast) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '8px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <LockIcon size={12} color="rgba(255, 255, 255, 0.75)" />
              <span>Access is limited to approved @asiancollege.edu.ph staff.</span>
            </div>
          </div>

          {/* ── Mode A: SHOW_DEMO = true (Collapsed "Try a demo" section) ── */}
          {showDemoState ? (
            <div
              style={{
                border: '1px dashed rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.03)',
                padding: '10px 12px',
                marginBottom: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setDemoExpanded(!demoExpanded)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#fbbf24',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    DEMO
                  </span>
                  <span>Try a demo (sample tournament data)</span>
                </div>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>{demoExpanded ? '▴ Hide' : '▾ Explore'}</span>
              </button>

              {demoExpanded && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {DEMO_ACCOUNTS.map(demo => (
                    <div
                      key={demo.roleId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: demo.badgeColor,
                            background: demo.badgeBg,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {demo.roleLabel}
                        </span>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                          {demo.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.45)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          · {demo.desc}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEnterDemo(demo.demoEmail)}
                        className="login-demo-btn"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Enter demo →
                      </button>
                    </div>
                  ))}
                  <div style={{ fontSize: '10.5px', color: 'rgba(245, 158, 11, 0.7)', marginTop: '2px', textAlign: 'center' }}>
                    Demo mode operates on isolated sample data and resets automatically.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode B: SHOW_DEMO = false (Clean re-centered layout with Request Access link) */
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setShowRequestAccessModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px 8px',
                }}
              >
                Not on the approved staff list? Request access here
              </button>
            </div>
          )}

          {/* Footer: Help Contact, Logging Notice, Version */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              paddingTop: '10px',
              fontSize: '10.5px',
              color: 'rgba(255, 255, 255, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Need help?{' '}
                <a
                  href="mailto:sports@asiancollege.edu.ph"
                  style={{ color: '#f87171', textDecoration: 'none', fontWeight: 600 }}
                >
                  Contact Sports Office
                </a>
              </span>
              <span>Padula v2.4.0</span>
            </div>
            <div>All sign-in activity and access attempts are monitored and recorded in the audit trail.</div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Asian College Dumaguete Campus Imagery ── */}
        <div className="login-photo-side">
          <img
            src={campusPhoto}
            alt="Asian College Dumaguete Campus"
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
          {/* Subtle Dark Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7, 11, 20, 0.88) 0%, rgba(7, 11, 20, 0.35) 60%, rgba(7, 11, 20, 0.15) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="photo-overlay-text"
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '24px',
              color: '#fff',
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#f87171',
                letterSpacing: '0.08em',
                marginBottom: '3px',
              }}
            >
              Asian College Dumaguete
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800 }}>Padula Athletics &amp; Tournament Analytics</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Academic Excellence, Integrity &amp; Self-Leadership.
            </div>
          </div>
        </div>
      </div>

      {/* ── GOOGLE ACCOUNT CHOOSER MODAL (Simulating authentic prompt=select_account) ── */}
      {showAccountChooser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowAccountChooser(false)}
        >
          <div
            style={{
              maxWidth: '430px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              color: '#1f2937',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GoogleIcon size={22} />
                <span style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                  {isRemoveMode ? 'Remove an account' : 'Sign in with Google'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAccountChooser(false);
                  setIsRemoveMode(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: isRemoveMode ? '#b91c1c' : '#4b5563', margin: '0 0 16px', lineHeight: 1.4 }}>
              {isRemoveMode
                ? 'Select an account to remove from this device. (This only signs it out and clears it from this browser.)'
                : <>Choose an official <strong>@asiancollege.edu.ph</strong> account to continue to Padula Sports.</>}
            </p>

            {/* Error or Cooldown Message inside Chooser */}
            {cooldownSeconds > 0 ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: '#991b1b',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangleIcon size={18} color="#dc2626" />
                  <div>
                    <strong style={{ display: 'block', color: '#b91c1c' }}>Security Cooldown Active</strong>
                    <span style={{ fontSize: '11.5px' }}>3 incorrect password attempts. Please wait before retrying.</span>
                  </div>
                </div>
                <div
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '13px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {cooldownSeconds}s
                </div>
              </div>
            ) : errorMessage ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  color: '#b91c1c',
                  marginBottom: '14px',
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            {!isTypingCustom ? (
              <div>
                {/* Remembered Accounts List */}
                {recentAccounts.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '14px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      No saved accounts on this device
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Use the option below to sign in with your institutional credentials.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {recentAccounts.map(email => {
                      const isDirector = email === 'jsamane@asiancollege.edu.ph';
                      return (
                        <div
                          key={email}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: isRemoveMode ? '#fff5f5' : '#f8fafc',
                            border: isRemoveMode ? '1px solid #fecaca' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '9px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Account Identity Clickable Area */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (isRemoveMode) {
                                removeAccount(email);
                                return;
                              }
                              setSelectedEmail(email);
                              if (isDirector) {
                                setIsTypingCustom(true);
                                setCustomEmail(email);
                                setPassword('');
                              } else {
                                executeGoogleSignIn(email);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (isRemoveMode) {
                                  removeAccount(email);
                                } else if (isDirector) {
                                  setIsTypingCustom(true);
                                  setCustomEmail(email);
                                  setPassword('');
                                } else {
                                  executeGoogleSignIn(email);
                                }
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              flex: 1,
                              minWidth: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isDirector ? '#ef4444' : '#3b82f6',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              {isDirector ? 'JS' : email[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {isDirector ? 'Mr. John Eric Samane' : email.split('@')[0]}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {email}
                              </div>
                            </div>
                          </div>

                          {/* Action Items: Select & Remove */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {isRemoveMode ? (
                              <button
                                type="button"
                                onClick={(e) => removeAccount(email, e)}
                                title="Remove account from device"
                                style={{
                                  background: '#fee2e2',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <TrashIcon size={12} color="#dc2626" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEmail(email);
                                    if (isDirector) {
                                      setIsTypingCustom(true);
                                      setCustomEmail(email);
                                      setPassword('');
                                    } else {
                                      executeGoogleSignIn(email);
                                    }
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '11.5px',
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                  }}
                                >
                                  Select →
                                </button>
                                <button
                                  type="button"
                                  title="Remove account from device"
                                  aria-label={`Remove ${email} from this device`}
                                  onClick={(e) => removeAccount(email, e)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.15s, background 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.background = '#fee2e2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <TrashIcon size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chooser Bottom Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!isRemoveMode ? (
                    <>
                      {/* + Use Another Account Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsTypingCustom(true);
                          setCustomEmail('');
                          setPassword('');
                        }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <UserIcon size={14} /> + Use another @asiancollege.edu.ph account
                      </button>

                      {/* Remove Account Option Toggle */}
                      {recentAccounts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsRemoveMode(true)}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                        >
                          <TrashIcon size={13} />
                          <span>Remove an account from this device</span>
                        </button>
                      )}
                    </>
                  ) : (
                    /* Done button when in Remove Mode */
                    <button
                      type="button"
                      onClick={() => setIsRemoveMode(false)}
                      style={{
                        width: '100%',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '9px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckIcon size={14} /> Done
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Custom Account Input & Password for Sports Director / Invited Credential */
              <form
                onSubmit={e => {
                  e.preventDefault();
                  executeGoogleSignIn(customEmail, password);
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      color: '#111827',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Password field for Sports Director or invited staff */}
                {(customEmail.trim().toLowerCase() === 'jsamane@asiancollege.edu.ph' || matchingInvite) && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                      {customEmail.trim().toLowerCase() === 'jsamane@asiancollege.edu.ph'
                        ? 'Sports Director Password'
                        : 'Assigned Invitation Password'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      disabled={cooldownSeconds > 0}
                      autoComplete="off"
                      onChange={e => {
                        if (cooldownSeconds > 0) return;
                        setPassword(e.target.value);
                        setPasteBlockedWarning(false);
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        setPasteBlockedWarning(true);
                      }}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: cooldownSeconds > 0 ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '13px',
                        color: cooldownSeconds > 0 ? '#9ca3af' : '#111827',
                        background: cooldownSeconds > 0 ? '#fef2f2' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none',
                        cursor: cooldownSeconds > 0 ? 'not-allowed' : 'text',
                        transition: 'all 0.15s ease',
                      }}
                    />
                    {pasteBlockedWarning && (
                      <div style={{
                        color: '#dc2626',
                        fontSize: '11px',
                        marginTop: '4px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span>⚠️ Copy/paste is disabled for passwords. Please type your password directly.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Matching Invitation Card if found */}
                {matchingInvite && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '11.5px',
                      marginBottom: '12px',
                      color: '#1e293b',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      Official Appointment Letter Found ({matchingInvite.roleTitle})
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      From: <strong>{matchingInvite.sentBy}</strong> · Status: <strong>{matchingInvite.status.toUpperCase()}</strong>
                    </div>
                    {matchingInvite.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          respondToInvitation(matchingInvite.id, 'accepted');
                          executeGoogleSignIn(matchingInvite.recipientEmail, password || matchingInvite.generatedPassword);
                        }}
                        style={{
                          marginTop: '8px',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Accept Invitation &amp; Sign In
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsTypingCustom(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ← Choose from list
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || cooldownSeconds > 0}
                    style={{
                      background: cooldownSeconds > 0 ? '#9ca3af' : '#1d4ed8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 16px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: (isLoading || cooldownSeconds > 0) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isLoading ? 'Verifying…' : cooldownSeconds > 0 ? `Locked (${cooldownSeconds}s)` : 'Sign In →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── REQUEST ACCESS MODAL ── */}
      {showRequestAccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowRequestAccessModal(false)}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              color: '#1f2937',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Request Staff Access</div>
              <button
                type="button"
                onClick={() => setShowRequestAccessModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <XIcon size={18} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#4b5563', margin: '0 0 16px', lineHeight: 1.45 }}>
              Staff accounts are managed strictly by Sports Director Mr. John Eric Samane. Submit your details to request an official appointment invitation.
            </p>

            <form onSubmit={handleAccessRequestSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    color: '#111827',
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Institutional Email Address (@asiancollege.edu.ph) *
                </label>
                <input
                  type="email"
                  required
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    color: '#111827',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Desired Role
                  </label>
                  <select
                    value={reqRole}
                    onChange={e => setReqRole(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '12.5px',
                      color: '#111827',
                    }}
                  >
                    <option value="coordinator">Sports Coordinator</option>
                    <option value="scorer">Official Scorer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Sport or Scope
                  </label>
                  <select
                    value={reqSport}
                    onChange={e => setReqSport(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '12.5px',
                      color: '#111827',
                    }}
                  >
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Football">Football</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Table Tennis">Table Tennis</option>
                    <option value="Sepak Takraw">Sepak Takraw</option>
                    <option value="Frisbee">Frisbee</option>
                    <option value="Chess">Chess</option>
                    <option value="Scrabble">Scrabble</option>
                    <option value="Mobile Legends">Mobile Legends</option>
                    <option value="DOTA 2">DOTA 2</option>
                    <option value="Valorant">Valorant</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                  Note to Sports Director (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reqNote}
                  onChange={e => setReqNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                    color: '#111827',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowRequestAccessModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isSubmittingReq ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmittingReq ? 'Submitting…' : 'Submit Access Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
