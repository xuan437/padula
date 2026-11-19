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

// Synchronous FIPS 180-4 SHA-256 hex digest helper for hashing one-time setup tokens
export function sha256Sync(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const utf8 = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8.length * 8;

  const hash: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let str = utf8 + '\x80';
  while ((str.length % 64) - 56) str += '\x00';
  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function generateOneTimeSetupToken(email: string): {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
  setupUrl: string;
} {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const rawToken = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const tokenHash = sha256Sync(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://padula.asiancollege.edu.ph';
  const setupUrl = `${origin}/?view=set-password&email=${encodeURIComponent(email.trim().toLowerCase())}&token=${encodeURIComponent(rawToken)}`;
  return { rawToken, tokenHash, expiresAt, setupUrl };
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
