import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  SearchIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  TrophyIcon,
} from '../components/Icons';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';

export default function AnnouncementsPage() {
  const {
    announcements,
    postAnnouncement,
    deleteAnnouncement,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'normal'>('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formPriority, setFormPriority] = useState<'normal' | 'urgent'>('normal');
  const [formSport, setFormSport] = useState('all');
  const [formSuccess, setFormSuccess] = useState('');

  const canPost = currentUser?.role === 'director' || currentUser?.role === 'coordinator';

  // Metrics
  const totalCount = announcements.length;
  const urgentCount = announcements.filter(a => a.priority === 'urgent').length;
  const todayCount = announcements.filter(a => {
    const d = new Date(a.createdAt);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;

  // Filtered list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (sportFilter !== 'all' && a.sport && a.sport !== sportFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (a.title || '').toLowerCase().includes(q);
        const matchBody = (a.body || '').toLowerCase().includes(q);
        const matchAuthor = (a.createdBy || '').toLowerCase().includes(q);
        return matchTitle || matchBody || matchAuthor;
      }
      return true;
    });
  }, [announcements, priorityFilter, sportFilter, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    const authorName = currentUser?.name
      ? `${currentUser.name} (${currentUser.role === 'director' ? 'Sports Director' : 'Sports Coordinator'})`
      : 'Sports Governance Board';

    postAnnouncement({
      title: formTitle.trim(),
      body: formBody.trim(),
      priority: formPriority,
      createdBy: authorName,
      sport: formSport !== 'all' ? formSport : undefined,
    });

    setFormTitle('');
    setFormBody('');
    setFormPriority('normal');
    setFormSport('all');
    setFormSuccess('Announcement broadcasted successfully to all devices and public boards.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Bulletins &amp; Broadcasts
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sports)',
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            fontStyle: 'italic',
            margin: '0 0 4px',
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}>
            Tournament Announcements
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Broadcast urgent schedule changes, court advisories, and official notices to all athletes, officials, and public spectators.
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowComposer(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
          >
            <PlusIcon size={16} />
            <span>{showComposer ? 'Close Composer' : 'Post Announcement'}</span>
          </button>
        )}
      </div>

      {/* ── Fast Metric Pills ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextIcon size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>{totalCount}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Bulletins</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangleIcon size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#ef4444' }}>{urgentCount}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Urgent Notices</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockIcon size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{todayCount}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Broadcasted Today</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon size={20} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
              {currentUser?.name || 'Authorized Staff'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {currentUser?.role === 'director' ? 'Sports Director' : currentUser?.role === 'coordinator' ? 'Coordinator' : 'Staff Broadcaster'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast Composer Card (Collapsible) ─────────────────────────────── */}
      {showComposer && canPost && (
        <div
          className="glass-card"
          style={{
            padding: '24px 28px',
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--accent)',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextIcon size={18} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Draft New Announcement
              </h3>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Visible instantly in public results, team portal, and scorers console
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Bulletin Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Court 1 Schedule Adjustment for Volleyball Semi-Finals"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Broadcast Priority</label>
                <select
                  className="form-input"
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value as 'normal' | 'urgent')}
                  style={{ fontWeight: 700 }}
                >
                  <option value="normal">Normal Priority (Standard Bulletin)</option>
                  <option value="urgent">🚨 Urgent Priority (Highlighted in Red)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Related Sport (Optional)</label>
                <select
                  className="form-input"
                  value={formSport}
                  onChange={e => setFormSport(e.target.value)}
                >
                  <option value="all">All Sports / General Athletics</option>
                  {SPORTS_CATALOG.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Announcement Body &amp; Details *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Write the full announcement text, instructions, court advisories, or timeline details…"
                value={formBody}
                onChange={e => setFormBody(e.target.value)}
                required
                style={{ resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {formSuccess && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckIcon size={15} color="#10b981" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '8px 22px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileTextIcon size={14} />
                <span>Publish Announcement</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setFormTitle('');
                  setFormBody('');
                  setShowComposer(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filter Toolbar ──────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
              <SearchIcon size={14} color="var(--text-muted)" />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search announcements by headline, keyword, or author…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '12.5px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'urgent', 'normal'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${priorityFilter === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPriorityFilter(p)}
                style={{ fontSize: '11.5px', padding: '4px 10px', textTransform: 'capitalize' }}
              >
                {p === 'all' ? 'All Priorities' : p === 'urgent' ? '🚨 Urgent' : 'Normal'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-input"
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 10px', maxWidth: '180px' }}
          >
            <option value="all">All Sports</option>
            {SPORTS_CATALOG.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filteredAnnouncements.length} bulletin{filteredAnnouncements.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* ── Announcements Feed ────────────────────────────────────────────────── */}
      {filteredAnnouncements.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileTextIcon size={40} color="var(--text-muted)" />
          <h3 style={{ fontSize: '16px', margin: '12px 0 6px', color: 'var(--text-primary)' }}>
            No Announcements Found
          </h3>
          <p style={{ margin: '0 auto 16px', maxWidth: '420px', fontSize: '13px' }}>
            {searchQuery || priorityFilter !== 'all' || sportFilter !== 'all'
              ? 'No announcements match your current filter parameters. Try clearing the search query or reset priority.'
              : 'No tournament bulletins have been posted yet. Authorized sports directors and coordinators can draft one above.'}
          </p>
          {canPost && !showComposer && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowComposer(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusIcon size={14} /> Post First Announcement
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAnnouncements.map(ann => {
            const isUrgent = ann.priority === 'urgent';
            const createdDate = new Date(ann.createdAt);
            const dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={ann.id}
                className="glass-card"
                style={{
                  padding: '18px 22px',
                  borderLeft: isUrgent ? '4px solid #ef4444' : '4px solid var(--accent)',
                  background: isUrgent ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderRadius: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '15.5px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}>
                      {ann.title}
                    </h3>

                    {isUrgent && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        letterSpacing: '0.04em',
                      }}>
                        🚨 URGENT
                      </span>
                    )}

                    {ann.sport && (
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'var(--accent-light)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <TrophyIcon size={11} color="var(--accent)" />
                        <span>{getSportName(ann.sport)}</span>
                      </span>
                    )}
                  </div>

                  {canPost && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (window.confirm(`Delete announcement "${ann.title}"?`)) {
                          deleteAnnouncement(ann.id);
                        }
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        color: '#ef4444',
                        borderColor: 'rgba(239,68,68,0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Delete this bulletin"
                    >
                      <TrashIcon size={12} color="#ef4444" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                }}>
                  {ann.body}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <UserIcon size={12} color="var(--text-muted)" />
                    <strong>{ann.createdBy}</strong>
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={12} color="var(--text-muted)" />
                    <span>{dateStr} at {timeStr}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

