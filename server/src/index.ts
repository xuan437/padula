import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env (with fallback to server/.env.example if .env is missing)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.RESEND_API_KEY) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.example') });
}

const PORT = 3001;
const RESEND_API_KEY = process.env.RESEND_API_KEY?.replace(/^["']|["']$/g, '').trim();
const FROM_EMAIL =
  process.env.FROM_EMAIL?.replace(/^["']|["']$/g, '').trim() || 'onboarding@resend.dev';
const GMAIL_USER = process.env.GMAIL_USER?.replace(/^["']|["']$/g, '').trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
  ?.replace(/^["']|["']$/g, '')
  .replace(/\s+/g, '')
  .trim();

if (!RESEND_API_KEY && !(GMAIL_USER && GMAIL_APP_PASSWORD)) {
  console.warn(
    '[server] Warning: Neither RESEND_API_KEY nor GMAIL_USER/GMAIL_APP_PASSWORD is set in server/.env.'
  );
}

const resend = new Resend(RESEND_API_KEY || '');
const gmailTransporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      })
    : null;

const app = express();

// Enable CORS for local Vite dev servers (localhost / 127.0.0.1)
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === 'http://localhost:5173' ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// Rate limiter: 10 requests per minute per IP
const sendEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many email requests from this IP. Please try again after 1 minute.',
  },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

interface SendEmailRequestBody {
  to?: unknown;
  subject?: unknown;
  message?: unknown;
}

/**
 * Resolves the best active "from" address:
 * 1. If FROM_EMAIL is customized (not onboarding@resend.dev), use it.
 * 2. Otherwise, check Resend for any verified domain and use noreply@<verified-domain> automatically.
 * 3. Fall back to onboarding@resend.dev when still in sandbox mode.
 */
async function resolveEffectiveFromEmail(): Promise<{
  from: string;
  verifiedDomain: string | null;
}> {
  if (FROM_EMAIL && FROM_EMAIL !== 'onboarding@resend.dev') {
    return { from: FROM_EMAIL, verifiedDomain: FROM_EMAIL.split('@')[1] || null };
  }

  try {
    const domainsRes = await resend.domains.list();
    const verified = domainsRes.data?.data?.find((d) => d.status === 'verified');
    if (verified?.name) {
      return {
        from: `Padula Sports <noreply@${verified.name}>`,
        verifiedDomain: verified.name,
      };
    }
  } catch (err) {
    console.warn('[server] Could not query Resend domains:', err);
  }

  return { from: 'onboarding@resend.dev', verifiedDomain: null };
}

app.get('/api/email-status', async (_req: Request, res: Response) => {
  const { from, verifiedDomain } = RESEND_API_KEY
    ? await resolveEffectiveFromEmail()
    : { from: 'onboarding@resend.dev', verifiedDomain: null };
  const gmailConfigured = Boolean(gmailTransporter && GMAIL_USER);
  const resendConfigured = Boolean(RESEND_API_KEY);

  if (!resendConfigured && !gmailConfigured) {
    res.status(500).json({ ok: false, configured: false, error: 'No email provider configured' });
    return;
  }

  res.json({
    ok: true,
    configured: true,
    provider: verifiedDomain ? 'resend' : gmailConfigured ? 'gmail-smtp' : 'resend-sandbox',
    from: verifiedDomain ? from : gmailConfigured ? `Padula Sports <${GMAIL_USER}>` : from,
    verifiedDomain,
    gmailConfigured,
    sandboxMode: !verifiedDomain && !gmailConfigured,
  });
});

app.post(
  '/api/send-email',
  sendEmailLimiter,
  async (req: Request<Record<string, never>, unknown, SendEmailRequestBody>, res: Response) => {
    try {
      const { to, subject, message } = req.body ?? {};

      // Validate presence and types
      if (
        typeof to !== 'string' ||
        typeof subject !== 'string' ||
        typeof message !== 'string' ||
        !to.trim() ||
        !subject.trim() ||
        !message.trim()
      ) {
        res.status(400).json({
          error: 'All three fields ("to", "subject", and "message") are required and must be non-empty strings.',
        });
        return;
      }

      const trimmedTo = to.trim();
      const trimmedSubject = subject.trim();
      const trimmedMessage = message.trim();

      // Validate email address format
      if (!EMAIL_REGEX.test(trimmedTo)) {
        res.status(400).json({
          error: 'Invalid "to" email address format.',
        });
        return;
      }

      // Validate length limits
      if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
        res.status(400).json({
          error: `"subject" must not exceed ${MAX_SUBJECT_LENGTH} characters.`,
        });
        return;
      }

      if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({
          error: `"message" must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
        });
        return;
      }

      if (!RESEND_API_KEY && !gmailTransporter) {
        console.error('[server] Missing email credentials in server/.env.');
        res.status(500).json({
          error:
            'Server email configuration error: configure GMAIL_USER + GMAIL_APP_PASSWORD or RESEND_API_KEY in server/.env.',
        });
        return;
      }

      // 1. Check if a verified Resend domain is active
      const { from: effectiveFrom, verifiedDomain } = RESEND_API_KEY
        ? await resolveEffectiveFromEmail()
        : { from: 'onboarding@resend.dev', verifiedDomain: null };

      // 2. If no verified Resend domain yet and Gmail SMTP is configured, send free via Gmail SMTP (works for any recipient)
      if (!verifiedDomain && gmailTransporter && GMAIL_USER) {
        const info = await gmailTransporter.sendMail({
          from: `"Padula Sports" <${GMAIL_USER}>`,
          to: trimmedTo,
          subject: trimmedSubject,
          text: trimmedMessage,
        });
        res.status(200).json({
          ok: true,
          id: info.messageId,
          provider: 'gmail-smtp',
          message: 'Email sent successfully via Gmail SMTP.',
        });
        return;
      }

      // 3. Otherwise send plain text email via Resend
      let { data, error } = await resend.emails.send({
        from: effectiveFrom,
        to: [trimmedTo],
        subject: trimmedSubject,
        text: trimmedMessage,
      });

      if (error && effectiveFrom !== 'onboarding@resend.dev') {
        console.warn(
          `[server] Resend rejected custom FROM_EMAIL (${effectiveFrom}): ${error.message}. Retrying with onboarding@resend.dev...`
        );
        const retryResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: [trimmedTo],
          subject: trimmedSubject,
          text: trimmedMessage,
        });
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('[server] Resend API error:', error);
        res.status(502).json({
          error: error.message || 'Failed to send email via Resend.',
        });
        return;
      }

      res.status(200).json({
        ok: true,
        id: data?.id,
        provider: 'resend',
        message: 'Email sent successfully.',
      });
    } catch (err) {
      console.error('[server] Unexpected error in POST /api/send-email:', err);
      res.status(500).json({
        error: 'An unexpected server error occurred while sending the email.',
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`[server] Email API server listening on http://localhost:${PORT}`);
});
