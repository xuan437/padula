import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import { SportFilter } from '../components/ui';
import {
  ClipboardIcon,
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  ShieldIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';

export default function ScorekeeperAssignmentsPage() {
  const {
    matches,
    officials,
    registeredUsers,
    assignMatchOfficials,
    removeOfficial,
    removeUser,
    setActiveView,
  } = useApp();

  const [matchSportFilter, setMatchSportFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | 'elimination' | 'group'>('all');
  const [pendingAssignment, setPendingAssignment] = useState<{
    matchId: string;
    matchLabel: string;
    value: string;
    previousValue: string;
  } | null>(null);
  const [confirmBanner, setConfirmBanner] = useState<string | null>(null);

  const scorekeepersList = useMemo(() => {
    const list = [...officials.filter(o => o.role === 'scorekeeper')];
    registeredUsers
      .filter(u => u.role === 'scorer')
      .forEach(u => {
        const exists = list.some(
          o =>
            o.name.toLowerCase() === u.name.toLowerCase() ||
            (u.email && o.contact?.toLowerCase() === u.email.toLowerCase())
        );
        if (!exists) {
          list.push({
            id: `u-${u.id}`,
            name: u.name,
            role: 'scorekeeper',
            sport: u.assignedSport || 'General',
            licenseId: `USR-${u.id.slice(0, 6).toUpperCase()}`,
            affiliation: 'Asian College Dumaguete',
            contact: u.email,
          });
        }
      });
    return list;
  }, [officials, registeredUsers]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (matchSportFilter && matchSportFilter.toLowerCase() !== 'all') {
        const matchSport = m.sport?.toLowerCase();
        const filterLower = matchSportFilter.toLowerCase();
        if (matchSport !== filterLower && getSportName(m.sport).toLowerCase() !== getSportName(matchSportFilter).toLowerCase()) {
          return false;
        }
      }
      if (statusFilter === 'assigned' && !m.scorekeeper) return false;
      if (statusFilter === 'unassigned' && m.scorekeeper) return false;
      if (stageFilter === 'elimination' && m.stage !== 'elimination' && m.format !== 'single_elimination' && m.format !== 'double_elimination') return false;
      if (stageFilter === 'group' && m.stage !== 'group' && m.format !== 'round_robin' && m.format !== 'point_system') return false;
      return true;
    });
  }, [matches, matchSportFilter, statusFilter, stageFilter]);

  const assignedCount = matches.filter(m => Boolean(m.scorekeeper)).length;
  const unassignedCount = matches.filter(m => !m.scorekeeper).length;

  const confirmPendingAssignment = () => {
    if (!pendingAssignment) return;
    assignMatchOfficials(pendingAssignment.matchId, { scorekeeper: pendingAssignment.value });
    setConfirmBanner(
      pendingAssignment.value
        ? `Assigned ${pendingAssignment.value} as Official Scorekeeper for ${pendingAssignment.matchLabel}.`
        : `Cleared Scorekeeper assignment for ${pendingAssignment.matchLabel}.`
    );
    setPendingAssignment(null);
    setTimeout(() => setConfirmBanner(null), 4000);
  };

  return (
    <div className="dashboard-content">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img
            src={schoolLogo}
            alt="Asian College"
            style={{ height: 46, width: 46, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '2px solid rgba(2, 132, 199, 0.25)' }}
          />
          <img
            src={padulaTitleImg}
            alt="PADULA 2026"
            style={{ height: 44, width: 'auto', maxWidth: '180px', objectFit: 'contain', display: 'block' }}
          />
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Asian College Dumaguete
            </div>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-sports)', fontStyle: 'italic', textTransform: 'uppercase', margin: 0, fontSize: '22px' }}>
              Scorekeeper Assignments
            </h1>
            <p className="page-desc" style={{ marginTop: 3, fontSize: '12px', color: 'var(--text-muted)' }}>
              Dedicated console for assigning certified Official Scorekeepers to tournament matches.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setActiveView('officials')}>
            <ShieldIcon size={13} /> Referees, Coaches &amp; Managers →
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setActiveView('registration')}>
            + Register Scorekeeper
          </button>
        </div>
      </div>

      {/* ── KPI Summary Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Scorekeepers</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{scorekeepersList.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #0284c7' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Matches Assigned</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>{assignedCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Unassigned Matches</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{unassignedCount}</div>
        </div>
      </div>

      {/* ── Filters & Assignment Cards ── */}
      <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>
            <ClipboardIcon size={20} color="#10b981" /> Assign Scorekeeper Per Match ({filteredMatches.length})
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'elimination', 'group'] as const).map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${stageFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStageFilter(st)}
              >
                {st === 'all' ? 'All Rounds' : st === 'elimination' ? 'Elimination Round' : 'Group / Round Robin'}
              </button>
            ))}
            {(['all', 'unassigned', 'assigned'] as const).map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(st)}
                style={{ textTransform: 'capitalize' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <SportFilter value={matchSportFilter} onChange={setMatchSportFilter} label="FILTER SPORT:" />

        {filteredMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
            No matches match the current filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
            {filteredMatches.map((m, idx) => (
              <div
                key={m.id}
                className="glass-card"
                style={{
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  border: m.scorekeeper ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {getSportIcon(m.sport, 13, 'var(--accent)')}
                    <span>{getSportName(m.sport)} · Match #{m.matchNumber || idx + 1}</span>
                  </span>
                  <span className={`status-badge ${m.status}`}>{m.status.toUpperCase()}</span>
                </div>

                <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)' }}>
                  {m.teamA || 'TBD'} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>vs</span> {m.teamB || 'TBD'}
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPinIcon size={11} /> {m.venue || 'Main Arena'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CalendarIcon size={11} /> {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                  </span>
                </div>

                <div style={{ marginTop: 4 }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>OFFICIAL SCOREKEEPER</span>
                    <span style={{ color: m.scorekeeper ? '#10b981' : '#f59e0b' }}>
                      {m.scorekeeper ? 'Assigned ✓' : 'Unassigned'}
                    </span>
                  </label>
                  <select
                    className="form-input"
                    value={m.scorekeeper || ''}
                    onChange={e => {
                      const nextVal = e.target.value;
                      if (nextVal === (m.scorekeeper || '')) return;
                      setPendingAssignment({
                        matchId: m.id,
                        matchLabel: `${m.teamA} vs ${m.teamB}`,
                        value: nextVal,
                        previousValue: m.scorekeeper || '',
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, fontWeight: 600 }}
                  >
                    <option value="">Select Scorekeeper…</option>
                    {scorekeepersList.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.sport})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Scorekeepers Directory ── */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>
              <UsersIcon size={20} color="#10b981" /> Official Scorekeepers Directory ({scorekeepersList.length})
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Certified scorekeepers eligible for live scoring desk assignments.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {scorekeepersList.map(sk => {
            const assignedGames = matches.filter(m => m.scorekeeper === sk.name).length;
            return (
              <div key={sk.id} className="glass-card" style={{ padding: '14px 16px', borderLeft: '3px solid #10b981', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.14)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Scorekeeper
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete scorekeeper "${sk.name}"?`)) {
                        if (sk.id.startsWith('u-')) removeUser(sk.id.slice(2));
                        else removeOfficial(sk.id);
                      }
                    }}
                    style={{ fontSize: 11, padding: '2px 8px', color: '#38bdf8' }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{sk.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sport: <strong>{sk.sport}</strong></div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Assigned Matches: <strong>{assignedGames}</strong></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Banner */}
      {confirmBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1100,
            background: '#065f46',
            color: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
          }}
        >
          <CheckIcon size={16} color="#34d399" />
          <span>{confirmBanner}</span>
        </div>
      )}

      {/* Confirm Assignment Modal */}
      {pendingAssignment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 17, 40, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPendingAssignment(null)}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: 440, padding: '22px 24px', background: 'var(--bg-surface)', borderRadius: 14 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>Confirm Scorekeeper Assignment</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
              Assign <strong>{pendingAssignment.value || 'Unassigned'}</strong> as Official Scorekeeper for{' '}
              <strong>{pendingAssignment.matchLabel}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPendingAssignment(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmPendingAssignment}>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
