// ============================================================
// Official Institutional Email Dispatch & Gmail Compose Service
// Asian College Padula 2026 — Tournament Analytics Portal
// Dispatches official appointment letters with one-time setup links
// ============================================================

import { supabase } from './supabase';
import type { EmailSendLog } from '../types';

export interface EmailPayload {
  to: string;
  toName: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  roleTitle?: string;
  assignedScope?: string;
  setupUrl?: string;
  invitationId?: string;
}

export type EmailSendResult =
  | {
      ok: true;
      success: true;
      transactionId: string;
      provider: string;
      recipient: string;
      sender: string;
      timestamp: string;
      message: string;
      webComposeUrl: string;
    }
  | {
      ok: false;
      success: false;
      reason: string;
      transactionId: string;
      provider: string;
      recipient: string;
      sender: string;
      timestamp: string;
      message: string;
      webComposeUrl: string;
    };

export type EmailDispatchResult = EmailSendResult;

const EMAIL_SEND_LOGS_KEY = 'padula_email_send_logs';

/**
 * Constructs official Google Mail web composer URL pre-filled with recipient, subject, and letter body.
 * Never includes a password in the URL or body.
 */
export function buildGmailComposeUrl(to: string, subject: string, body: string): string {
  const cleanTo = encodeURIComponent(to.trim());
  const cleanSubj = encodeURIComponent(subject.trim());
  const cleanBody = encodeURIComponent(body.trim());
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${cleanTo}&su=${cleanSubj}&body=${cleanBody}`;
}

/**
 * Manual Gmail Compose action: opens https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...
 * in a new window. Must be called directly from a user click handler so popup blockers don't block it.
 */
export function openGmailCompose(to: string, subject: string, body: string): void {
  if (typeof window === 'undefined') return;
  const webUrl = buildGmailComposeUrl(to, subject, body);
  window.open(webUrl, '_blank', 'noopener,noreferrer');
}

// Keep alias for compatibility
export const openGmailComposeWindow = openGmailCompose;

/**
 * Checks whether a direct Gmail OAuth token or custom email webhook URL is configured.
 */
export function hasConnectedGmailToken(): boolean {
  try {
    const token =
      (import.meta.env.VITE_GMAIL_ACCESS_TOKEN as string) ||
      localStorage.getItem('padula_gmail_access_token') ||
      '';
    const customUrl =
      (import.meta.env.VITE_EMAIL_API_URL as string) ||
      localStorage.getItem('padula_custom_email_api') ||
      '';
    return token.trim().length > 10 || customUrl.trim().startsWith('http');
  } catch {
    return false;
  }
}

/**
 * Encodes an EmailPayload as an RFC 2822 UTF-8 MIME message in base64url format.
 */
export function buildRfc2822Base64Url(payload: EmailPayload): string {
  const cleanTo = payload.to.trim().toLowerCase();
  const cleanFrom = payload.fromEmail.trim().toLowerCase();
  const rfc2822 = [
    `From: ${payload.fromName} <${cleanFrom}>`,
    `To: ${payload.toName} <${cleanTo}>`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    payload.body,
  ].join('\r\n');

  const bytes = new TextEncoder().encode(rfc2822);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Reads all logged email send attempts from localStorage.
 */
export function getStoredEmailSendLogs(): EmailSendLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_SEND_LOGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records every email send attempt (recipient, timestamp, result, failureReason)
 * in both localStorage and the Supabase `email_send_logs` table.
 */
export async function logEmailSendAttempt(entry: EmailSendLog): Promise<void> {
  try {
    const current = getStoredEmailSendLogs();
    const updated = [entry, ...current].slice(0, 200);
    localStorage.setItem(EMAIL_SEND_LOGS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('padula-email-log-updated', { detail: entry }));
    }
  } catch {}

  try {
    await supabase.from('email_send_logs').insert([
      {
        id: entry.id,
        invitation_id: entry.invitationId || null,
        recipient_email: entry.recipientEmail,
        recipient_name: entry.recipientName || null,
        role_title: entry.roleTitle || null,
        timestamp: entry.timestamp,
        result: entry.result,
        failure_reason: entry.failureReason || null,
        provider: entry.provider || null,
      },
    ]);
  } catch {}
}

/**
 * Dispatches an official appointment invitation letter (containing a 24h one-time password setup link, never a raw password).
 * Returns a strictly typed result ({ ok: true, ... } or { ok: false, reason: string, ... })
 * without any fake timeout fallback, and logs every send attempt to the database.
 */
export async function sendEmailViaOfficialApi(payload: EmailPayload): Promise<EmailSendResult> {
  const cleanTo = payload.to.trim().toLowerCase();
  const cleanFrom = payload.fromEmail.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const txSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const txId = `INV-${Date.now().toString().slice(-6)}-${txSuffix}`;
  const webComposeUrl = buildGmailComposeUrl(cleanTo, payload.subject, payload.body);

  const failureReasons: string[] = [];

  // 0. Local Resend Backend Server (POST /api/send-email on VITE_API_URL or http://localhost:3001)
  const resendServerBaseUrl = (
    (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001'
  ).replace(/\/+$/, '');

  const resendCandidateUrls = [
    `${resendServerBaseUrl}/api/send-email`,
    '/api/send-email',
  ];

  for (const endpointUrl of resendCandidateUrls) {
    try {
      const resendRes = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: cleanTo,
          subject: payload.subject.slice(0, 200),
          message: payload.body.slice(0, 5000),
        }),
      });

      const resendData = await resendRes.json().catch(() => null);
      if (resendRes.ok && resendData?.ok) {
        const resendTxId = resendData.id ? `RESEND-${resendData.id}` : txId;
        const successResult: EmailSendResult = {
          ok: true,
          success: true,
          transactionId: resendTxId,
          provider: 'Resend',
          recipient: cleanTo,
          sender: `${payload.fromName} <${cleanFrom}>`,
          timestamp: nowIso,
          message: `Sent to ${cleanTo} via Resend.`,
          webComposeUrl,
        };
        await logEmailSendAttempt({
          id: `elog-${Date.now()}-${txSuffix}`,
          invitationId: payload.invitationId,
          recipientEmail: cleanTo,
          recipientName: payload.toName,
          roleTitle: payload.roleTitle,
          timestamp: nowIso,
          result: 'sent',
          provider: 'Resend',
        });
        return successResult;
      }

      if (resendData?.error) {
        failureReasons.push(`Resend API: ${resendData.error}`);
        break;
      }
    } catch {
      // Server not reachable on this URL candidate; try next candidate
    }
  }

  // 1. Direct Google Gmail REST endpoint (if token is configured)
  let gmailAccessToken: string | null = null;
  try {
    gmailAccessToken =
      (import.meta.env.VITE_GMAIL_ACCESS_TOKEN as string) ||
      localStorage.getItem('padula_gmail_access_token') ||
      null;
  } catch {}

  if (gmailAccessToken && gmailAccessToken.trim().length > 10) {
    try {
      const rawMessage = buildRfc2822Base64Url(payload);
      const gmRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailAccessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMessage }),
      });

      if (gmRes.ok) {
        const gmData = await gmRes.json().catch(() => ({}));
        const successResult: EmailSendResult = {
          ok: true,
          success: true,
          transactionId: gmData?.id ? `GMAIL-${gmData.id}` : txId,
          provider: 'Gmail',
          recipient: cleanTo,
          sender: `${payload.fromName} <${cleanFrom}>`,
          timestamp: nowIso,
          message: `Sent to ${cleanTo}.`,
          webComposeUrl,
        };
        await logEmailSendAttempt({
          id: `elog-${Date.now()}-${txSuffix}`,
          invitationId: payload.invitationId,
          recipientEmail: cleanTo,
          recipientName: payload.toName,
          roleTitle: payload.roleTitle,
          timestamp: nowIso,
          result: 'sent',
          provider: 'Gmail',
        });
        return successResult;
      } else {
        const errBody = await gmRes.json().catch(() => ({}));
        failureReasons.push(
          errBody?.error?.message || `Gmail token returned HTTP ${gmRes.status}`
        );
      }
    } catch (gmErr: any) {
      failureReasons.push(gmErr?.message || 'Gmail request failed');
    }
  }

  // 2. Configured Custom Email Webhook endpoint (if set)
  let customEndpoint: string | null = null;
  try {
    customEndpoint =
      (import.meta.env.VITE_EMAIL_API_URL as string) ||
      localStorage.getItem('padula_custom_email_api') ||
      null;
  } catch {}

  if (customEndpoint && typeof customEndpoint === 'string' && customEndpoint.startsWith('http')) {
    try {
      const response = await fetch(customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          transactionId: txId,
          to: cleanTo,
          toName: payload.toName,
          fromName: payload.fromName,
          fromEmail: cleanFrom,
          subject: payload.subject,
          text: payload.body,
          role: payload.roleTitle,
          assignedScope: payload.assignedScope,
          setupUrl: payload.setupUrl,
          dispatchedAt: nowIso,
          portal: 'Padula 2026 Asian College Dumaguete',
        }),
      });

      if (response.ok) {
        const successResult: EmailSendResult = {
          ok: true,
          success: true,
          transactionId: txId,
          provider: 'Email Service',
          recipient: cleanTo,
          sender: `${payload.fromName} <${cleanFrom}>`,
          timestamp: nowIso,
          message: `Sent to ${cleanTo}.`,
          webComposeUrl,
        };
        await logEmailSendAttempt({
          id: `elog-${Date.now()}-${txSuffix}`,
          invitationId: payload.invitationId,
          recipientEmail: cleanTo,
          recipientName: payload.toName,
          roleTitle: payload.roleTitle,
          timestamp: nowIso,
          result: 'sent',
          provider: 'Email Service',
        });
        return successResult;
      } else {
        failureReasons.push(`Custom email service returned HTTP ${response.status}`);
      }
    } catch (networkErr: any) {
      failureReasons.push(networkErr?.message || 'Custom email service unreachable');
    }
  }

  // 3. FormSubmit AJAX endpoint — strictly parse `success` (accept only boolean true or string "true")
  try {
    const fsResponse = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanTo)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: payload.subject,
        _template: 'box',
        _captcha: 'false',
        From: `${payload.fromName} <${cleanFrom}>`,
        Recipient: `${payload.toName} <${cleanTo}>`,
        Role: payload.roleTitle || 'Official Staff',
        Assigned_Scope: payload.assignedScope || 'All Sports',
        Login_Email: cleanTo,
        Password_Setup_Link: payload.setupUrl || '',
        Appointment_Letter: payload.body,
      }),
    });

    const fsData = await fsResponse.json().catch(() => null);
    const isFormSubmitSuccess =
      fsResponse.ok && fsData !== null && (fsData.success === true || fsData.success === 'true');

    if (isFormSubmitSuccess) {
      const fsResult: EmailSendResult = {
        ok: true,
        success: true,
        transactionId: txId,
        provider: 'FormSubmit',
        recipient: cleanTo,
        sender: `${payload.fromName} <${cleanFrom}>`,
        timestamp: nowIso,
        message: `Sent to ${cleanTo}.`,
        webComposeUrl,
      };
      await logEmailSendAttempt({
        id: `elog-${Date.now()}-${txSuffix}`,
        invitationId: payload.invitationId,
        recipientEmail: cleanTo,
        recipientName: payload.toName,
        roleTitle: payload.roleTitle,
        timestamp: nowIso,
        result: 'sent',
        provider: 'FormSubmit',
      });
      return fsResult;
    }

    const fsMessage =
      typeof fsData?.message === 'string' && fsData.message.trim()
        ? fsData.message.trim()
        : `FormSubmit returned success=${JSON.stringify(fsData?.success ?? false)} (HTTP ${fsResponse.status})`;
    failureReasons.push(fsMessage);
  } catch (fsErr: any) {
    failureReasons.push(fsErr?.message || 'FormSubmit network request blocked or unreachable');
  }

  // No fake fallback: return { ok: false, reason } and record the failed send attempt
  const combinedReason =
    failureReasons.join(' | ') ||
    'Automatic email service is not activated for this recipient.';

  const failResult: EmailSendResult = {
    ok: false,
    success: false,
    reason: combinedReason,
    transactionId: txId,
    provider: 'None',
    recipient: cleanTo,
    sender: `${payload.fromName} <${cleanFrom}>`,
    timestamp: nowIso,
    message: `Email was not delivered to ${cleanTo} (${combinedReason}). Please click "Open in Gmail" to send the appointment letter directly.`,
    webComposeUrl,
  };

  await logEmailSendAttempt({
    id: `elog-${Date.now()}-${txSuffix}`,
    invitationId: payload.invitationId,
    recipientEmail: cleanTo,
    recipientName: payload.toName,
    roleTitle: payload.roleTitle,
    timestamp: nowIso,
    result: 'failed',
    failureReason: combinedReason,
    provider: 'FormSubmit',
  });

  return failResult;
}

export interface InAppEmailVerification {
  email: string;
  code: string;
  expiresAt: number;
  sentAt: string;
}

const VERIFICATION_STORAGE_KEY = 'padula_inapp_email_codes';

export function sendInAppVerificationCode(
  email: string,
  allowedDomain: string = 'asiancollege.edu.ph'
): { success: boolean; error?: string; code?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const domain = allowedDomain.replace(/^@/, '').toLowerCase();
  if (!cleanEmail.endsWith(`@${domain}`)) {
    return {
      success: false,
      error: `Only @${domain} Google/Gmail accounts are permitted.`,
    };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record: InAppEmailVerification = {
    email: cleanEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    sentAt: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    const list: InAppEmailVerification[] = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(list) ? list.filter(x => x.email !== cleanEmail) : [];
    filtered.push(record);
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
  return { success: true, code };
}

export function verifyInAppCode(email: string, code: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  try {
    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!raw) return false;
    const list: InAppEmailVerification[] = JSON.parse(raw);
    const found = list.find(x => x.email === cleanEmail && x.code === cleanCode);
    if (!found) return false;
    if (Date.now() > found.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

export function getLatestInAppCode(email: string): InAppEmailVerification | null {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const list: InAppEmailVerification[] = JSON.parse(raw);
    const found = list.find(x => x.email === cleanEmail);
    if (!found || Date.now() > found.expiresAt) return null;
    return found;
  } catch {
    return null;
  }
}
