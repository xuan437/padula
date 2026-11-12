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
} from '../components/Icons';
import { PageHeader, StatCard, EmptyState } from '../components/ui';

type RequestFilter = 'all' | 'pending' | 'approved' | 'declined';

export default function AccessRequestsPage() {
  const {
    accessRequests,
    approveAccessRequest,
    declineAccessRequest,
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
    }
  };

  const handleDeclineConfirm = () => {
    if (!declineTargetId) return;
    declineAccessRequest(declineTargetId, declineReason.trim() || undefined);
    setDeclineTargetId(null);
    setDeclineReason('');
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
      gap: '20px',
    }}>
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="Sports Director Governance"
        title="Portal Access Requests"
        description="Official review desk for faculty coordinators and student scorekeepers requesting access to the Padula Sports system via the login portal."
        badge={
          pendingCount > 0 ? (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'var(--badge-live-bg)',
              color: 'var(--badge-live-text)',
              border: '1px solid var(--badge-live-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <span className="live-dot" style={{ background: '#dc2626' }} />
              {pendingCount} Pending Review
            </span>
          ) : (
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              background: 'var(--badge-finish-bg)',
              color: 'var(--badge-finish-text)',
              border: '1px solid var(--badge-finish-border)',
            }}>
              ✓ All Caught Up
            </span>
          )
        }
        actions={
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setActiveView('registration')}
            style={{ fontWeight: 600 }}
          >
            ← Open Registration Hub
          </button>
        }
      />

      {/* ── Metric Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        width: '100%',
      }}>
        <StatCard
          label="Total Requests"
          value={accessRequests.length}
          hint="Applications from login portal"
          icon={<MailIcon size={18} color="var(--accent)" />}
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          hint="Requires Director approval"
          trend={pendingCount > 0 ? `${pendingCount} action needed` : undefined}
          icon={<ClockIcon size={18} color="#f59e0b" />}
        />
        <StatCard
          label="Approved Accounts"
          value={approvedCount}
          hint="Credentials issued & active"
          icon={<CheckIcon size={18} color="#10b981" />}
        />
        <StatCard
          label="Declined"
          value={declinedCount}
          hint="Unverified applications"
          icon={<XIcon size={18} color="var(--text-muted)" />}
        />
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([
              { id: 'pending',  label: 'Pending Review', count: pendingCount },
              { id: 'all',      label: 'All Requests',   count: accessRequests.length },
              { id: 'approved', label: 'Approved',       count: approvedCount },
              { id: 'declined', label: 'Declined',       count: declinedCount },
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
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search applicant name, email, sport..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '12.5px', height: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Request List ── */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          title={activeTab === 'pending' ? 'No Pending Requests' : 'No Access Requests Found'}
          description={
            activeTab === 'pending'
              ? 'All portal credential requests have been reviewed and resolved by the Sports Director.'
              : 'Try clearing your search query or switching to another filter tab.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {filteredRequests.map(req => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isDeclined = req.status === 'declined';
            const isCoordinator = req.role === 'coordinator';

            return (
              <div
                key={req.id}
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: isPending ? '4px solid #f59e0b' : isApproved ? '4px solid #10b981' : isDeclined ? '4px solid #ef4444' : '4px solid #94a3b8',
                }}
              >
                {/* Left: Applicant details */}
                <div style={{ display: 'flex', gap: '14px', flex: '1 1 360px', minWidth: '260px' }}>
                  {/* Initials Avatar */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isCoordinator ? '#2563eb' : '#059669',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      flexShrink: 0,
                    }}
                  >
                    {req.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.name}
                      </span>

                      {/* Role Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isCoordinator ? 'rgba(37, 99, 235, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                          color: isCoordinator ? '#2563eb' : '#059669',
                          border: isCoordinator ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(5, 150, 105, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {isCoordinator ? 'Sports Coordinator' : 'Official Scorekeeper'}
                      </span>

                      {/* Sport Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {req.sportOrDept}
                      </span>
                    </div>

                    {/* Email and Submission info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {req.email}
                      </span>
                      <span>·</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Submitted {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Justification note */}
                    {req.note && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-light)',
                          fontSize: '12px',
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
                          padding: '8px 12px',
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
                        <code style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>{req.generatedPassword}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(req.generatedPassword!)}
                          className="btn btn-xs btn-ghost"
                          style={{ fontSize: '11px', padding: '2px 6px' }}
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
                          background: '#059669',
                          borderColor: '#059669',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <XIcon size={14} />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : isApproved ? (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '4px 10px',
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
                  ) : (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '4px 10px',
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
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setApprovedResult(null)}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={20} color="#10b981" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Credentials Issued Successfully
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Access approved by Sports Director Mr. John Eric Samane
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              <strong>{approvedResult.name}</strong> ({approvedResult.email}) has been registered as <strong>{approvedResult.role}</strong>. An official invitation letter with portal login credentials has been created.
            </p>

            {approvedResult.password && (
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Temporary Assigned Password
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <code style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.02em' }}>
                    {approvedResult.password}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(approvedResult.password!)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
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
              style={{ width: '100%', marginTop: '8px', fontWeight: 700 }}
            >
              Done
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
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setDeclineTargetId(null)}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangleIcon size={20} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Decline Access Request
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Are you sure you want to decline this access request? You may specify an optional reason for the audit trail.
            </p>

            <textarea
              placeholder="Reason for declining (optional)..."
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="form-input"
              rows={3}
              style={{ resize: 'vertical', fontSize: '12.5px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setDeclineTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleDeclineConfirm}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
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

