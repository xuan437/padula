import { useState } from 'react';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';
import campusPhoto from '../assets/campus.jpg';
import { useApp } from '../context/AppContext';
import { GlobeIcon } from '../components/Icons';

interface LoginPageProps {
  onBackToPublic?: () => void;
}

// Google "G" Vector Icon
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage({ onBackToPublic }: LoginPageProps) {
  const { verifyAndSignInStaff, setActiveView } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  const handleGuestAccess = () => {
    if (onBackToPublic) {
      onBackToPublic();
    } else {
      setActiveView('public');
    }
  };

  const handleGoogleClick = () => {
    setErrorMessage('');
    setShowAccountPrompt(true);
  };

  const handleConfirmGoogleAccount = async (emailToVerify: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await verifyAndSignInStaff(emailToVerify);
      if (!result.success) {
        setErrorMessage(result.error || "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.");
        setIsLoading(false);
      } else {
        setShowAccountPrompt(false);
      }
    } catch {
      setErrorMessage("This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#fff',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '860px',
        background: '#0f182c',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        overflow: 'hidden',
        minHeight: '480px',
      }}>

        {/* ── LEFT: Login Action Panel ── */}
        <div style={{
          flex: '0 0 420px',
          padding: '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>

          {/* Dual Logos Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <img
              src={schoolLogo}
              alt="Asian College"
              style={{
                height: '52px',
                width: '52px',
                objectFit: 'cover',
                borderRadius: '50%',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <img
                src={padulaTitleImg}
                alt="PADULA 2026"
                style={{
                  height: '42px',
                  width: 'auto',
                  maxWidth: '180px',
                  objectFit: 'contain',
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Asian College Dumaguete
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontFamily: 'var(--font-sports)',
              fontSize: '24px',
              fontWeight: 800,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              margin: '0 0 8px',
              color: '#fff',
              letterSpacing: '0.02em',
            }}>
              Staff & Official Portal
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
              Secure tournament management console for Sports Directors, Coordinators, and certified Scorers.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: '#fca5a5',
              lineHeight: 1.45,
              marginBottom: '20px',
            }}>
              {errorMessage}
            </div>
          )}

          {/* Single Google Sign-In Action */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleClick}
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#ffffff'; }}
          >
            <GoogleIcon size={20} />
            <span>{isLoading ? 'Verifying with Server…' : 'Sign in with Institutional Google'}</span>
          </button>

          <p style={{
            fontSize: '11.5px',
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            marginTop: '12px',
            marginBottom: '24px',
          }}>
            Restricted exclusively to @asiancollege.edu.ph staff credentials.
          </p>

          {/* Return to Public View Link */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleGuestAccess}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              <GlobeIcon size={14} /> Back to Public View
            </button>
          </div>

        </div>

        {/* ── RIGHT: Campus Imagery ── */}
        <div className="login-welcome-panel" style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          minHeight: '480px',
        }}>
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
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,13,26,0.65) 0%, transparent 45%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '28px',
            left: '28px',
            right: '28px',
            color: '#fff',
            zIndex: 2,
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Asian College Dumaguete
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              Padula Athletics & Tournament Analytics
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Official administrative operations portal.
            </div>
          </div>
        </div>

      </div>

      {/* ── Google Account Selector / OAuth Simulation Modal ── */}
      {showAccountPrompt && (
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
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            color: '#1f2937',
            padding: '28px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <GoogleIcon size={24} />
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                Sign in with Google
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '0 0 18px', lineHeight: 1.45 }}>
              Choose your official <strong>@asiancollege.edu.ph</strong> account to continue to Padula Sports.
            </p>

            <form onSubmit={e => {
              e.preventDefault();
              handleConfirmGoogleAccount(inputEmail);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@asiancollege.edu.ph"
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#111827',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAccountPrompt(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#4b5563',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1d4ed8',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? 'Checking…' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .login-welcome-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
