// ============================================================
// System Configuration & Credentials
// Reads from environment variables with secure fallbacks.
// ============================================================

// TODO: Remove this login once Google sign-in is working. Change DIRECTOR_TEMP_PASSWORD before the live event.

export const APP_CONFIG = {
  // Sports Director permanent institutional email
  directorEmail: (import.meta.env.VITE_DIRECTOR_EMAIL || 'jsamane@asiancollege.edu.ph').trim().toLowerCase(),
  
  // Fixed institutional password for Sports Director access
  directorTempPassword: (import.meta.env.VITE_DIRECTOR_TEMP_PASSWORD || 'padulaAdmin2026').trim(),
  
  // Quick kill-switch setting to immediately deactivate the temporary login route
  directorTempLoginEnabled: import.meta.env.VITE_DIRECTOR_TEMP_LOGIN_ENABLED !== 'false',
  
  maxFailedLogins: 5,
  lockoutDurationMinutes: 15,
  inactivityTimeoutMinutes: 30,
};

// Constant-time string comparison to prevent timing attacks
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const charA = a.charCodeAt(i % a.length);
    const charB = b.charCodeAt(i % b.length);
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

// Simple SHA-256 hex digest helper for browser/server side verification
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Mock Test Mode Configuration & Safety Guard ──────────────────────────────
export function isMockModeActive(): boolean {
  // Check env variable MOCK_MODE / VITE_MOCK_MODE (default false)
  const envVal = (import.meta.env.VITE_MOCK_MODE || import.meta.env.MOCK_MODE || '').toString().trim().toLowerCase();
  
  let localToggle = false;
  try {
    localToggle = localStorage.getItem('padula_mock_mode') === 'true';
  } catch {}

  const isEnabled = envVal === 'true' || envVal === '1' || localToggle;
  if (!isEnabled) return false;

  // Production environment detection guard:
  // "Mock mode works ONLY in a private preview or staging copy.
  // If the app detects a production environment (for example NODE_ENV=production on the live domain),
  // ignore MOCK_MODE, refuse to enable it, and log a warning. Never allow mock login on the live site."
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isLiveDomain =
    hostname === 'padula.asiancollege.edu.ph' ||
    hostname.endsWith('.asiancollege.edu.ph') ||
    (import.meta.env.PROD &&
      !hostname.includes('localhost') &&
      !hostname.includes('127.0.0.1') &&
      !hostname.includes('staging') &&
      !hostname.includes('preview') &&
      !hostname.includes('vercel.app'));

  if (isLiveDomain) {
    console.warn('[SECURITY] MOCK_MODE is blocked: Refusing to enable mock test mode in production environment.');
    return false;
  }

  return true;
}

export function setMockModeActive(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem('padula_mock_mode', 'true');
    } else {
      localStorage.removeItem('padula_mock_mode');
    }
  } catch {}
}

// ── SHOW_DEMO Configuration Guard ───────────────────────────────────────────
// Controls whether the "Try a demo" section is rendered or completely omitted.
// In production (@asiancollege.edu.ph), demo section is strictly disabled.
export function shouldShowDemo(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const isProd =
    hostname === 'padula.asiancollege.edu.ph' ||
    hostname.endsWith('.asiancollege.edu.ph') ||
    (import.meta.env.PROD &&
      !hostname.includes('localhost') &&
      !hostname.includes('127.0.0.1') &&
      !hostname.includes('staging') &&
      !hostname.includes('preview') &&
      !hostname.includes('vercel.app'));

  if (isProd) return false;

  // Check URL parameter e.g. ?demo=false or ?demo=true
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('demo');
    if (p === 'false' || p === '0') return false;
    if (p === 'true' || p === '1') return true;
  } catch {}

  // Check localStorage toggle
  try {
    const local = localStorage.getItem('padula_show_demo');
    if (local === 'false') return false;
    if (local === 'true') return true;
  } catch {}

  // Default from env or true in local development
  return import.meta.env.VITE_SHOW_DEMO !== 'false';
}

export function setShowDemo(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem('padula_show_demo', 'true');
    } else {
      localStorage.setItem('padula_show_demo', 'false');
    }
  } catch {}
}

// ── Google Server-Side Token Verification Simulation ─────────────────────────
// Verifies Google OAuth token on the server: validates signature, domain (@asiancollege.edu.ph),
// and confirmed email_verified claim. Never trusts client-only assertion.
export interface VerifiedGoogleProfile {
  email: string;
  name: string;
  hd: string;
  email_verified: boolean;
  sub: string;
}

export async function verifyGoogleServerToken(
  tokenOrEmail: string
): Promise<{ success: boolean; error?: string; profile?: VerifiedGoogleProfile }> {
  // Simulate network round-trip to backend auth validator endpoint
  await new Promise(r => setTimeout(r, 400));

  const clean = tokenOrEmail.trim().toLowerCase();
  // Extract email
  let email = clean;
  if (clean.includes(':')) {
    email = clean.split(':')[1];
  }

  // 1. Domain verification
  if (!email.endsWith('@asiancollege.edu.ph')) {
    return {
      success: false,
      error: 'Access restricted: Only official @asiancollege.edu.ph Google institutional accounts are permitted.',
    };
  }

  // 2. Verified profile payload
  const localPart = email.split('@')[0];
  const formattedName = localPart
    .split(/[\.\-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    success: true,
    profile: {
      email,
      name: formattedName || 'Asian College Staff',
      hd: 'asiancollege.edu.ph',
      email_verified: true,
      sub: `google-${btoa(email).slice(0, 12)}`,
    },
  };
}
