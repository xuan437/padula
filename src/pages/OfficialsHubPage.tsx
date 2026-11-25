import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  UsersIcon,
  ShieldIcon,
  ClipboardIcon,
  TrophyIcon,
  CheckIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
} from '../components/Icons';
import { getSportName, getSportIcon } from '../lib/sports';
import { SportFilter } from '../components/ui';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '8px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

export default function OfficialsHubPage() {
  const {
    matches, officials, registeredUsers, venues, teams, events, departments,
    assignMatchOfficials, assignTeamCoach, assignEventReferee, removeOfficial, removeUser, setActiveView,
  } = useApp();

  const [officialFilter, setOfficialFilter] = useState<'all' | 'referee' | 'coach' | 'manager'>('all');
  const [matchSportFilter, setMatchSportFilter] = useState<string>('all');
  const [pendingAssignment, setPendingAssignment] = useState<{
    matchId: string;
    matchLabel: string;
    roleLabel: string;
    field: 'venue' | 'referee' | 'scorekeeper' | 'coachA' | 'coachB' | 'manager';
    value: string;
    previousValue: string;
  } | null>(null);
  const [confirmBanner, setConfirmBanner] = useState<string | null>(null);

  const requestAssignment = (
    matchId: string,
    matchLabel: string,
    roleLabel: string,
    field: 'venue' | 'referee' | 'scorekeeper' | 'coachA' | 'coachB' | 'manager',
    value: string,
    previousValue: string
  ) => {
    if (value === previousValue) return;
    setPendingAssignment({ matchId, matchLabel, roleLabel, field, value, previousValue });
  };

  const confirmPendingAssignment = () => {
    if (!pendingAssignment) return;
    assignMatchOfficials(pendingAssignment.matchId, { [pendingAssignment.field]: pendingAssignment.value });
    setConfirmBanner(
      pendingAssignment.value
        ? `Confirmed: Assigned ${pendingAssignment.value} as ${pendingAssignment.roleLabel} for ${pendingAssignment.matchLabel}.`
        : `Confirmed: Cleared ${pendingAssignment.roleLabel} for ${pendingAssignment.matchLabel}.`
    );
    setPendingAssignment(null);
    setTimeout(() => setConfirmBanner(null), 4000);
  };

  const refereesList = useMemo(() => officials.filter(o => o.role === 'referee'), [officials]);
  const coachesList = useMemo(() => officials.filter(o => o.role === 'coach'), [officials]);
  const managersList = useMemo(() => officials.filter(o => o.role === 'manager'), [officials]);

  const scorekeepersList = useMemo(() => {
    const list = [...officials.filter(o => o.role === 'scorekeeper')];
    registeredUsers.filter(u => u.role === 'scorer').forEach(u => {
      const exists = list.some(o =>
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

  const nonScorerOfficials = useMemo(() => officials.filter(o => o.role !== 'scorekeeper'), [officials]);

  const filteredOfficials = useMemo(() => {
    if (officialFilter === 'all') return nonScorerOfficials;
    return nonScorerOfficials.filter(o => o.role === officialFilter);
  }, [nonScorerOfficials, officialFilter]);

  const filteredMatches = useMemo(() => {
    if (!matchSportFilter || matchSportFilter.toLowerCase() === 'all') return matches;
    return matches.filter(
      m =>
        m.sport?.toLowerCase() === matchSportFilter.toLowerCase() ||
        getSportName(m.sport).toLowerCase() === getSportName(matchSportFilter).toLowerCase()
    );
  }, [matches, matchSportFilter]);

  return (
    <div className="dashboard-content">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={schoolLogo}
            alt="Asian College"
            style={{
              height: 46,
              width: 46,
              objectFit: 'cover',
              borderRadius: '50%',
              flexShrink: 0,
              border: '2px solid rgba(2, 132, 199, 0.25)',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
            }}
          />
          <img
            src={padulaTitleImg}
            alt="PADULA 2026"
            style={{
              height: 44,
              width: 'auto',
              maxWidth: '180px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 3px 12px rgba(15, 35, 71, 0.35))',
            }}
          />
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            <div className="brand-pill-tag" style={{ display: 'inline-block', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Asian College Dumaguete
            </div>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-sports)', fontStyle: 'italic', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, fontSize: '22px', lineHeight: 1.1 }}>
              Officials &amp; Staff Hub
            </h1>
            <p className="page-desc" style={{ marginTop: 3, fontSize: '12px', color: 'var(--text-muted)' }}>
              Accredited Referees, Scorekeepers, Coaches, and Managers · Match Duty Assignments
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Registration Callout */}
        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Unified Registration Portal
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              All official registrations (Referees, Scorekeepers, Coaches, Managers, and Coordinators) can be managed on the Registration Page.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setActiveView('registration')} style={{ fontWeight: 700 }}>
            Open Registration Portal →
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #ff4d6d' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Referees</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ff4d6d', marginTop: 4 }}>{refereesList.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Scorekeepers</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{scorekeepersList.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #3b82f6' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Varsity Coaches</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>{coachesList.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Athletic Managers</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{managersList.length}</div>
          </div>
        </div>

        <SectionDivider label="Event Referee & Team Coach Assignments" />

        {/* EVENT REFEREE & TEAM COACH ASSIGNMENTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {/* Lead Referee per Event */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldIcon size={17} color="#f97316" /> Referee Assignments (Per Event)
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Assign a Lead Referee to each tournament event (syncs to its scheduled matches).
              </p>
            </div>
            {events.filter(e => !e.archived).length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No active events yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {events.filter(e => !e.archived).map(ev => (
                  <div key={ev.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{ev.name}</strong>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: ev.referee ? '#10b981' : '#f59e0b' }}>
                        {ev.referee ? 'Assigned ✓' : 'Pending'}
                      </span>
                    </div>
                    <select
                      className="form-input"
                      value={ev.referee || ''}
                      onChange={e => assignEventReferee(ev.id, e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, fontWeight: 600 }}
                    >
                      <option value="">Select Lead Event Referee…</option>
                      {refereesList.map(r => (
                        <option key={r.id} value={r.name}>{r.name} ({r.sport})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Head Coach per Team */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon size={17} color="#3b82f6" /> Coach Assignments (Per Team)
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Assign a Head Coach directly to each registered team (syncs to team matches).
              </p>
            </div>
            {teams.filter(t => t.isActive !== false).length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No active teams registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                {teams.filter(t => t.isActive !== false).map(team => {
                  const dept = departments.find(d => d.id === team.department);
                  return (
                    <div key={team.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13 }}>{team.name} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>({dept?.shortName || team.department} · {getSportName(team.sport)})</span></strong>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: team.coach ? '#10b981' : '#f59e0b' }}>
                          {team.coach ? 'Assigned ✓' : 'Pending'}
                        </span>
                      </div>
                      <select
                        className="form-input"
                        value={team.coach || ''}
                        onChange={e => assignTeamCoach(team.id, e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, fontWeight: 600 }}
                      >
                        <option value="">Select Team Coach…</option>
                        {coachesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.sport})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SectionDivider label="Assign Officials Per Game" />

        {/* PER-GAME ASSIGNMENT CONSOLE */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>
                <ClipboardIcon size={20} color="var(--accent)" /> Per-Game Official Assignments
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Assign the certified Referee, Scorekeeper, Coaches, and Manager for each tournament match.
              </p>
            </div>
            <div className="badge-chip"><span>Total Matches: {filteredMatches.length}</span></div>
          </div>

          {/* Unified Sport Filter Bar */}
          <div style={{ marginBottom: '20px' }}>
            <SportFilter
              value={matchSportFilter}
              onChange={setMatchSportFilter}
              label="FILTER SPORT:"
            />
          </div>

          {filteredMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <ClipboardIcon size={36} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>No matches found for this sport. Generate matches in the Setup Wizard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMatches.map(m => {
                const isComplete = Boolean(m.referee && m.scorekeeper && m.coachA && m.coachB && m.manager);
                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '20px 22px',
                    background: 'var(--bg-elevated)',
                    border: isComplete ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}>
                    {/* Match header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-border)',
                          fontSize: '12px',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}>
                          {getSportIcon(m.sport, 13, 'var(--accent)')}
                          <span>{getSportName(m.sport)}</span>
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '8px',
                          background: m.format === 'round_robin' ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)',
                          color: m.format === 'round_robin' ? '#0284c7' : '#d97706',
                          border: `1px solid ${m.format === 'round_robin' ? 'rgba(56,189,248,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}>
                          {m.format === 'round_robin' ? 'Round Robin' : 'Single Elimination'}
                        </span>

                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {m.teamA || 'TBD'} <span style={{ color: 'var(--accent)', fontWeight: 700 }}>vs</span> {m.teamB || 'TBD'}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                          · {m.round}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {m.scheduledTime && (
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                          }}>
                            <CalendarIcon size={12} color="var(--text-muted)" />
                            <span>{new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        )}
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                        }}>
                          <MapPinIcon size={12} color="var(--text-muted)" />
                          <span>{m.venue || 'TBA'}</span>
                        </span>
                        <span className={`status-badge ${m.status}`} style={{ borderRadius: '8px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
                          {m.status === 'live' && <span className="live-dot" />}
                          {m.status?.toUpperCase()}
                        </span>
                        {isComplete ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: 'rgba(16,185,129,0.12)',
                            color: '#059669',
                            border: '1px solid rgba(16,185,129,0.3)',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}>
                            <CheckIcon size={12} color="#059669" /> All Certified
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248,0.1)',
                            color: '#0284c7',
                            border: '1px solid rgba(56, 189, 248,0.25)',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}>
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Upgraded 6-Field Modular Assignment Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border)',
                    }}>
                      {/* Venue */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: 'var(--text-secondary)',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <MapPinIcon size={13} color="var(--accent)" />
                            <span>EVENT VENUE</span>
                          </span>
                          {m.venue && (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <CheckIcon size={10} color="#10b981" /> Set
                            </span>
                          )}
                        </div>
                        <select
                          className="form-input"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          value={m.venue || venues[0]?.name || ''}
                          onChange={e => requestAssignment(m.id, `${m.teamA} vs ${m.teamB}`, 'Venue', 'venue', e.target.value, m.venue || venues[0]?.name || '')}
                        >
                          {venues.map(v => (
                            <option key={v.id} value={v.name}>{v.name} — {v.location}</option>
                          ))}
                        </select>
                      </div>

                      {/* Referee */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: 'var(--text-secondary)',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldIcon size={13} color="#f97316" />
                            <span>LEAD REFEREE</span>
                          </span>
                          {m.referee ? (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <CheckIcon size={10} color="#10b981" /> Set
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>Pending</span>
                          )}
                        </div>
                        <select
                          className="form-input"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          value={m.referee || ''}
                          onChange={e => requestAssignment(m.id, `${m.teamA} vs ${m.teamB}`, 'Lead Referee', 'referee', e.target.value, m.referee || '')}
                        >
                          <option value="">Select Referee...</option>
                          {refereesList.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Coach A */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: 'var(--text-secondary)',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', maxWidth: '82%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <UserIcon size={13} color="#3b82f6" />
                            <span>COACH ({m.teamA || 'Team A'})</span>
                          </span>
                          {m.coachA ? (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <CheckIcon size={10} color="#10b981" /> Set
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>Pending</span>
                          )}
                        </div>
                        <select
                          className="form-input"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          value={m.coachA || ''}
                          onChange={e => requestAssignment(m.id, `${m.teamA} vs ${m.teamB}`, `Coach (${m.teamA || 'Team A'})`, 'coachA', e.target.value, m.coachA || '')}
                        >
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Coach B */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: 'var(--text-secondary)',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', maxWidth: '82%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <UserIcon size={13} color="#3b82f6" />
                            <span>COACH ({m.teamB || 'Team B'})</span>
                          </span>
                          {m.coachB ? (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <CheckIcon size={10} color="#10b981" /> Set
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>Pending</span>
                          )}
                        </div>
                        <select
                          className="form-input"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          value={m.coachB || ''}
                          onChange={e => requestAssignment(m.id, `${m.teamA} vs ${m.teamB}`, `Coach (${m.teamB || 'Team B'})`, 'coachB', e.target.value, m.coachB || '')}
                        >
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Manager */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: 'var(--text-secondary)',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <TrophyIcon size={13} color="#f59e0b" />
                            <span>ATHLETIC MANAGER</span>
                          </span>
                          {m.manager ? (
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              <CheckIcon size={10} color="#10b981" /> Set
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>Pending</span>
                          )}
                        </div>
                        <select
                          className="form-input"
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          value={m.manager || ''}
                          onChange={e => requestAssignment(m.id, `${m.teamA} vs ${m.teamB}`, 'Athletic Manager', 'manager', e.target.value, m.manager || '')}
                        >
                          <option value="">Select Manager...</option>
                          {managersList.map(mg => (
                            <option key={mg.id} value={mg.name}>{mg.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SectionDivider label="Accredited Officials Directory" />

        {/* OFFICIALS DIRECTORY */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>
                <UsersIcon size={20} color="var(--accent)" /> Asian College Padula Accredited Officials
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>All certified Referees, Scorekeepers, Coaches, and Managers on record.</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'referee', 'coach', 'manager'] as const).map(r => (
                <button
                  key={r}
                  className={`btn btn-sm ${officialFilter === r ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setOfficialFilter(r)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {r === 'all' ? `All (${nonScorerOfficials.length})` : `${r}s (${nonScorerOfficials.filter(o => o.role === r).length})`}
                </button>
              ))}
            </div>
          </div>

          {officials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <ShieldIcon size={38} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>No officials registered yet. Use the registration page to add officials.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredOfficials.map(official => {
                const badgeColor =
                  official.role === 'referee' ? '#38bdf8' :
                    official.role === 'scorekeeper' ? '#10b981' :
                      official.role === 'coach' ? '#3b82f6' : '#f59e0b';
                return (
                  <div key={official.id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${badgeColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: badgeColor, background: `${badgeColor}20`, padding: '2px 8px', borderRadius: '4px' }}>
                        {official.role}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{official.licenseId}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            if (window.confirm(`Delete ${official.role} "${official.name}"?`)) {
                              if (official.id.startsWith('u-')) {
                                removeUser(official.id.slice(2));
                              } else {
                                removeOfficial(official.id);
                              }
                            }
                          }}
                          style={{ fontSize: '11px', padding: '2px 8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248,0.28)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{official.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Affiliation: <strong style={{ color: 'var(--text-primary)' }}>{official.affiliation}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Discipline: <strong style={{ color: 'var(--text-primary)' }}>{official.sport}</strong></div>
                  </div>
                );
              })}
            </div>
          )}
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
          <button
            type="button"
            onClick={() => setConfirmBanner(null)}
            style={{ background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Confirm Assignment Modal */}
      {pendingAssignment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '430px',
              padding: '24px',
              borderRadius: '14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Official Assignment
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to assign <strong style={{ color: 'var(--text-primary)' }}>{pendingAssignment.value || 'Unassigned'}</strong> as{' '}
              <strong style={{ color: 'var(--accent)' }}>{pendingAssignment.roleLabel}</strong> for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{pendingAssignment.matchLabel}</strong>?
            </p>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div>Previous: <strong>{pendingAssignment.previousValue || 'Unassigned'}</strong></div>
              <div>New: <strong style={{ color: '#10b981' }}>{pendingAssignment.value || 'Unassigned'}</strong></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setPendingAssignment(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={confirmPendingAssignment}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
