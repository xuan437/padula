import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckIcon,
  XIcon,
  ClockIcon,
  SearchIcon,
  MailIcon,
  LockIcon,
  AlertTriangleIcon,
  CopyIcon,
  TrashIcon,
  ShieldIcon,
  ClipboardIcon,
  TrophyIcon,
} from '../components/Icons';
import { PageHeader } from '../components/ui';
import { getSportIcon, getSportName } from '../lib/sports';

type RequestFilter = 'all' | 'pending' | 'approved' | 'declined';

export default function AccessRequestsPage() {
  const {
    accessRequests,
    approveAccessRequest,
    declineAccessRequest,
    removeAccessRequest,
    clearAllAccessRequests,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<RequestFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvedResult, setApprovedResult] = useState<{
    name: string;
    email: string;
    role: string;
    password?: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Counts
  const pendingCount = useMemo(() => accessRequests.filter(r => r.status === 'pending').length, [accessRequests]);
  const approvedCount = useMemo(() => accessRequests.filter(r => r.status === 'approved').length, [accessRequests]);
  const declinedCount = useMemo(() => accessRequests.filter(r => r.status === 'declined').length, [accessRequests]);

  // Filtered list
  const filteredRequests = useMemo(() => {
    return accessRequests.filter(req => {
      // Tab filter
      if (activeTab !== 'all' && req.status !== activeTab) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = req.name.toLowerCase().includes(q);
        const matchesEmail = req.email.toLowerCase().includes(q);
        const matchesSport = req.sportOrDept.toLowerCase().includes(q);
        const matchesNote = req.note.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesSport && !matchesNote) return false;
      }
      return true;
    });
  }, [accessRequests, activeTab, searchQuery]);

  const handleApprove = async (requestId: string) => {
    const target = accessRequests.find(r => r.id === requestId);
    if (!target) return;

    setProcessingId(requestId);
    const result = await approveAccessRequest(requestId);
    setProcessingId(null);

    if (result.success) {
      setApprovedResult({
        name: target.name,
        email: target.email,
        role: target.role === 'coordinator' ? 'Sports Coordinator' : 'Official Scorekeeper',
        password: result.password,
      });
      setCopiedPassword(false);
      showNotice(`Approved access request for ${target.name}. Credentials issued.`);
    }
  };

  const handleDeclineConfirm = () => {
    if (!declineTargetId) return;
    const target = accessRequests.find(r => r.id === declineTargetId);
    declineAccessRequest(declineTargetId, declineReason.trim() || undefined);
    showNotice(`Declined access request for ${target?.name || 'applicant'}.`);
    setDeclineTargetId(null);
    setDeclineReason('');
  };

  const handleDeleteRequest = (requestId: string, applicantName: string) => {
    if (window.confirm(`Permanently remove access request for "${applicantName}"?`)) {
      removeAccessRequest(requestId);
      showNotice(`Removed request for ${applicantName}.`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all portal access request records?')) {
      clearAllAccessRequests();
      showNotice('All portal access requests have been cleared.');
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* ── Success Banner ── */}
      {actionNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          fontSize: '13px',
          fontWeight: 700,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon size={16} color="#10b981" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="btn btn-ghost btn-xs"
            style={{ color: '#10b981', padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="Sports Director Governance · Real-Time Access Desk"
        title="Portal Access Requests"
        description="Official review desk for faculty coordinators and student scorekeepers requesting credentialed access to the Asian College Padula Sports portal."
        badge={
          pendingCount > 0 ? (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'rgba(220, 38, 38, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              {pendingCount} Pending Review
            </span>
          ) : (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              ✓ All Caught Up
            </span>
          )
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {accessRequests.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleClearAll}
                style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                title="Clear all request records"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setActiveView('registration')}
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ← Open Registration Hub
            </button>
          </div>
        }
      />

      {/* ── Metric Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        width: '100%',
      }}>
        {/* Total Requests */}
        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Total Requests
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.1 }}>
              {accessRequests.length}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Applications from portal
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            <MailIcon size={20} />
          </div>
        </div>

        {/* Pending Review */}
        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: pendingCount > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: pendingCount > 0 ? '#f59e0b' : 'var(--text-primary)', marginTop: '4px', lineHeight: 1.1 }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '11.5px', color: pendingCount > 0 ? '#f59e0b' : 'var(--text-muted)', marginTop: '4px', fontWeight: pendingCount > 0 ? 600 : 400 }}>
              {pendingCount > 0 ? `${pendingCount} action needed` : 'No backlog'}
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            flexShrink: 0,
          }}>
            <ClockIcon size={20} />
          </div>
        </div>

        {/* Approved Accounts */}
        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#10b981' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981' }}>
              Approved Accounts
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.1 }}>
              {approvedCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Credentials active
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0,
          }}>
            <CheckIcon size={20} />
          </div>
        </div>

        {/* Declined */}
        <div
          className="glass-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--text-muted)' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Declined
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.1 }}>
              {declinedCount}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Unverified requests
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(148, 163, 184, 0.12)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}>
            <XIcon size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {([
            { id: 'pending',  label: 'Pending Review', count: pendingCount, color: '#f59e0b' },
            { id: 'all',      label: 'All Requests',   count: accessRequests.length, color: 'var(--accent)' },
            { id: 'approved', label: 'Approved',       count: approvedCount, color: '#10b981' },
            { id: 'declined', label: 'Declined',       count: declinedCount, color: 'var(--text-muted)' },
          ] as const).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'var(--bg-elevated)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px', minWidth: '180px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <SearchIcon size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', paddingRight: searchQuery ? '30px' : '12px', fontSize: '12.5px', height: '38px', borderRadius: '8px' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '11px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Request List ── */}
      {filteredRequests.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            {activeTab === 'pending' ? <CheckIcon size={28} color="#10b981" /> : <TrophyIcon size={28} />}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {activeTab === 'pending'
                ? 'No Pending Access Requests'
                : searchQuery
                ? 'No Requests Match Your Search'
                : 'No Access Requests Found'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '480px', lineHeight: 1.5 }}>
              {activeTab === 'pending'
                ? 'All portal credential requests have been reviewed and resolved. New applications submitted from the login portal will arrive here automatically in real time.'
                : searchQuery
                ? `No applications matched "${searchQuery}". Clear your search term to see all records.`
                : 'There are currently no access requests in this view category.'}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setSearchQuery('')}
              style={{ marginTop: '8px' }}
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {filteredRequests.map(req => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isCoordinator = req.role === 'coordinator';

            return (
              <div
                key={req.id}
                className="glass-card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '20px 24px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Status Indicator Bar on Left */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '4px',
                    background: isPending
                      ? '#f59e0b'
                      : isApproved
                      ? '#10b981'
                      : '#ef4444',
                  }}
                />

                {/* Left: Applicant Information */}
                <div style={{ display: 'flex', gap: '16px', flex: '1 1 380px', minWidth: '280px' }}>
                  {/* Initials Avatar */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: isCoordinator
                        ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                        : 'linear-gradient(135deg, #047857, #10b981)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: isCoordinator
                        ? '0 4px 12px rgba(37, 99, 235, 0.25)'
                        : '0 4px 12px rgba(16, 185, 129, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {req.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {req.name}
                      </span>

                      {/* Role Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: isCoordinator ? 'rgba(37, 99, 235, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isCoordinator ? '#3b82f6' : '#10b981',
                          border: isCoordinator ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {isCoordinator ? <ShieldIcon size={12} /> : <ClipboardIcon size={12} />}
                        {isCoordinator ? 'Sports Coordinator' : 'Official Scorekeeper'}
                      </span>

                      {/* Sport Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {getSportIcon(req.sportOrDept, 12, 'var(--accent)')}
                        {getSportName(req.sportOrDept)}
                      </span>
                    </div>

                    {/* Email and Submission info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                        {req.email}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Submitted {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Justification note */}
                    {req.note && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-light)',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45,
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Applicant Note:</strong> {req.note}
                      </div>
                    )}

                    {/* Approved password display */}
                    {isApproved && req.generatedPassword && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: 'fit-content',
                        }}
                      >
                        <LockIcon size={14} color="#10b981" />
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Issued Password:</span>
                        <code style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981', letterSpacing: '0.02em' }}>{req.generatedPassword}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(req.generatedPassword!)}
                          className="btn btn-xs btn-ghost"
                          style={{ fontSize: '11px', padding: '2px 7px', color: '#10b981' }}
                          title="Copy Password"
                        >
                          <CopyIcon size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions / Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="btn btn-sm btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          borderColor: '#059669',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <CheckIcon size={14} />
                        <span>{processingId === req.id ? 'Approving…' : 'Approve & Issue Credentials'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeclineTargetId(req.id)}
                        className="btn btn-sm btn-ghost"
                        style={{
                          color: '#dc2626',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                        }}
                      >
                        <XIcon size={14} />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req.id, req.name)}
                        className="btn btn-sm btn-ghost"
                        style={{
                          color: 'var(--text-muted)',
                          padding: '8px',
                          borderRadius: '8px',
                        }}
                        title="Delete request"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </>
                  ) : isApproved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 800,
                          padding: '5px 12px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <CheckIcon size={13} />
                        Approved
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req.id, req.name)}
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--text-muted)', padding: '6px' }}
                        title="Remove record"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: '999px',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <XIcon size={13} />
                        Declined
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req.id, req.name)}
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--text-muted)', padding: '6px' }}
                        title="Remove record"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Approval Success Modal ── */}
      {approvedResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setApprovedResult(null)}
        >
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '480px',
              width: '100%',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top Green Accent Bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10b981' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CheckIcon size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Credentials Issued Successfully
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Access approved by Sports Director Mr. John Eric Samane
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              <strong>{approvedResult.name}</strong> ({approvedResult.email}) has been registered as <strong>{approvedResult.role}</strong>. An official invitation letter with portal login credentials has been created.
            </p>

            {approvedResult.password && (
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Temporary Assigned Password
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '15px', fontWeight: 900, color: '#10b981', letterSpacing: '0.04em' }}>
                    {approvedResult.password}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(approvedResult.password!)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 700 }}
                  >
                    {copiedPassword ? '✓ Copied' : 'Copy Password'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setApprovedResult(null)}
              style={{ width: '100%', marginTop: '6px', fontWeight: 700, padding: '11px' }}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* ── Decline Confirmation Modal ── */}
      {declineTargetId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setDeclineTargetId(null)}
        >
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '440px',
              width: '100%',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top Red Accent Bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#dc2626' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(220, 38, 38, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AlertTriangleIcon size={20} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Decline Access Request
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Are you sure you want to decline this access request? You may specify an optional reason for the audit trail.
            </p>

            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="form-input"
              rows={3}
              style={{ resize: 'vertical', fontSize: '13px', borderRadius: '8px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setDeclineTargetId(null)}
                style={{ padding: '8px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleDeclineConfirm}
                style={{ background: '#dc2626', borderColor: '#dc2626', padding: '8px 18px', fontWeight: 700 }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
