import React, { useState } from 'react';

export type EmailSendStatus = 'idle' | 'sending' | 'success' | 'error';

export interface SendEmailFormState {
  to: string;
  subject: string;
  message: string;
}

interface SendEmailApiResponse {
  ok?: boolean;
  id?: string;
  message?: string;
  error?: string;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001';

export default function SendEmailForm() {
  const [formState, setFormState] = useState<SendEmailFormState>({
    to: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<EmailSendStatus>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (status === 'success' || status === 'error') {
      setStatus('idle');
      setFeedbackMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    setFeedbackMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formState.to,
          subject: formState.subject,
          message: formState.message,
        }),
      });

      const data: SendEmailApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setFeedbackMessage(
          data.error || `Request failed with status ${response.status}.`
        );
        return;
      }

      setStatus('success');
      setFeedbackMessage(data.message || 'Email sent successfully!');
      setFormState({
        to: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setFeedbackMessage(
        err instanceof Error
          ? err.message
          : 'Network error: Unable to reach the email server.'
      );
    }
  };

  const isSending = status === 'sending';

  return (
    <section
      aria-label="Send Email Form"
      style={{
        maxWidth: '560px',
        margin: '24px auto',
        padding: '24px',
        borderRadius: '12px',
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border, #e2e8f0)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
        color: 'var(--text-primary, #0f172a)',
      }}
    >
      <h2
        style={{
          margin: '0 0 6px',
          fontSize: '18px',
          fontWeight: 800,
        }}
      >
        Send Automated Email
      </h2>
      <p
        style={{
          margin: '0 0 18px',
          fontSize: '13px',
          color: 'var(--text-secondary, #475569)',
        }}
      >
        Dispatch a plain-text email via the server-side Resend API.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div>
          <label
            htmlFor="send-email-to"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Recipient Email
          </label>
          <input
            id="send-email-to"
            name="to"
            type="email"
            required
            placeholder="recipient@example.com"
            value={formState.to}
            onChange={handleChange}
            disabled={isSending}
            className="form-input"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '13.5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="send-email-subject"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Subject (max 200 chars)
          </label>
          <input
            id="send-email-subject"
            name="subject"
            type="text"
            required
            maxLength={200}
            placeholder="Enter email subject"
            value={formState.subject}
            onChange={handleChange}
            disabled={isSending}
            className="form-input"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '13.5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="send-email-message"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Message (max 5000 chars)
          </label>
          <textarea
            id="send-email-message"
            name="message"
            required
            maxLength={5000}
            rows={5}
            placeholder="Write your plain-text message here..."
            value={formState.message}
            onChange={handleChange}
            disabled={isSending}
            className="form-input"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '13.5px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {status === 'sending' && (
          <div
            role="status"
            style={{
              fontSize: '12.5px',
              color: '#0284c7',
              fontWeight: 600,
            }}
          >
            Sending email...
          </div>
        )}

        {status === 'success' && (
          <div
            role="status"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            {feedbackMessage}
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            {feedbackMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="btn btn-primary"
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: isSending ? 'not-allowed' : 'pointer',
            opacity: isSending ? 0.65 : 1,
          }}
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </section>
  );
}
