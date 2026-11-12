// ============================================================
// System Configuration & Credentials
// Reads from environment variables with secure fallbacks.
// ============================================================

// TODO: Remove this login once Google sign-in is working. Change DIRECTOR_TEMP_PASSWORD before the live event.

export const APP_CONFIG = {
  // Sports Director permanent institutional email
  directorEmail: (import.meta.env.VITE_DIRECTOR_EMAIL || 'john.samane@asiancollege.edu.ph').trim().toLowerCase(),
  
  // Temporary interim password for emergency Sports Director access
  // Stored in environment variable; switch off via DIRECTOR_TEMP_LOGIN_ENABLED=false
  directorTempPassword: (import.meta.env.VITE_DIRECTOR_TEMP_PASSWORD || 'Padula2026!Director').trim(),
  
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
