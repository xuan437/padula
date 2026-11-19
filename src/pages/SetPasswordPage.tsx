import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LockIcon, CheckIcon, AlertTriangleIcon, ShieldIcon } from '../components/Icons';
import schoolLogo from '../assets/logo.png';

interface SetPasswordPageProps {
  firstLoginMode?: boolean;
  onComplete?: () => void;
}

export default function SetPasswordPage({ firstLoginMode = false, onComplete }: SetPasswordPageProps) {
  const { currentUser, completePasswordSetupWithToken, changeOwnPasswordFirstLogin, setActiveView } = useApp();

  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') return { email: '', token: '' };
    const p = new URLSearchParams(window.location.search);
    return {
      email: (p.get('email') || currentUser?.email || '').trim().toLowerCase(),
      token: (p.get('token') || '').trim(),
    };
  }, [currentUser]);

  const [email, setEmail] = useState(initialParams.email);
  const [token, setToken] = useState(initialParams.token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (firstLoginMode) {
        const res = await changeOwnPasswordFirstLogin(newPassword.trim());
        if (!res.success) {
          setError(res.error || 'Could not update password.');
        } else {
          setSuccess(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1200);
        }
      } else {
        const res = await completePasswordSetupWithToken(email, token, newPassword.trim());
        if (!res.success) {
          setError(res.error || 'Invalid or expired setup token.');
        } else {
          setSuccess(true);
          if (typeof window !== 'undefined') {
            const cleanUrl = `${window.location.origin}/?view=login`;
            window.history.replaceState({}, '', cleanUrl);
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={schoolLogo}
            alt="Asian College"
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Asian College Padula 2026
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '19px', fontWeight: 800 }}>
              {firstLoginMode ? 'Change Password on First Login' : 'Set Your Account Password'}
            </h2>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {firstLoginMode
            ? `Welcome, ${currentUser?.name || 'Staff Member'}. For account security, please set your own personal password before continuing to your dashboard.`
            : 'Use your one-time 24-hour setup token from your Official Appointment Letter to create your personal login password.'}
        </p>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderLeft: '3px solid #0284c7',
              background: 'rgba(2, 132, 199, 0.08)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangleIcon size={15} color="var(--accent)" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderLeft: '3px solid #059669',
                background: 'rgba(16, 185, 129, 0.08)',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckIcon size={16} color="#059669" />
              <span>
                {firstLoginMode
                  ? 'Password updated! Redirecting to your dashboard…'
                  : 'Your password has been set and your appointment is activated!'}
              </span>
            </div>

            {!firstLoginMode && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (onComplete) onComplete();
                  else setActiveView('login');
                }}
                style={{ width: '100%', fontWeight: 700 }}
              >
                Continue to Staff Sign-In
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!firstLoginMode && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Registered Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@asiancollege.edu.ph"
                    className="form-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    One-Time Setup Token (24-Hour Expiry)
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Paste setup token from appointment link"
                    className="form-input"
                    style={{ width: '100%', fontSize: '12.5px', fontFamily: 'monospace' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                New Password (Min. 8 Characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="form-input"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="form-input"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <LockIcon size={14} />
                <span>{submitting ? 'Saving Password…' : 'Save New Password'}</span>
              </button>

              {!firstLoginMode && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveView('public')}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <ShieldIcon size={13} color="var(--accent)" />
          <span>One-time setup tokens are SHA-256 hashed in the database and expire after 24 hours.</span>
        </div>
      </div>
    </div>
  );
}
