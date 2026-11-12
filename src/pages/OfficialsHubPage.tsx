import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  UsersIcon,
  ShieldIcon,
  ClipboardIcon,
  FlameIcon,
  TrophyIcon,
  CheckIcon,
  MapPinIcon,
  HomeIcon,
  CalendarIcon,
} from '../components/Icons';
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
    matches, officials, registeredUsers,
    assignMatchOfficials, setActiveView,
  } = useApp();

  const [officialFilter, setOfficialFilter] = useState<'all' | 'referee' | 'scorekeeper' | 'coach' | 'manager'>('all');
  const [matchSportFilter, setMatchSportFilter] = useState<string>('all');

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

  const filteredOfficials = useMemo(() => {
    if (officialFilter === 'all') return officials;
    return officials.filter(o => o.role === officialFilter);
  }, [officials, officialFilter]);

  const sportsList = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => { if (m.sport) set.add(m.sport); });
    return Array.from(set);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (matchSportFilter === 'all') return matches;
    return matches.filter(m => m.sport?.toLowerCase() === matchSportFilter.toLowerCase());
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
              border: '2px solid rgba(220, 38, 38, 0.25)',
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('admin')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HomeIcon size={14} /> Dashboard
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('setup-wizard')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarIcon size={14} /> Setup Wizard
          </button>
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

        <SectionDivider label="Assign Officials Per Game" />

        {/* PER-GAME ASSIGNMENT CONSOLE */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>
                <ClipboardIcon size={20} color="var(--accent)" /> Per-Game Official Assignments
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Assign the certified Referee, Scorekeeper, Coaches, and Manager for each tournament match.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {sportsList.length > 1 && (
                <select
                  className="form-input"
                  style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                  value={matchSportFilter}
                  onChange={e => setMatchSportFilter(e.target.value)}
                >
                  <option value="all">All Sports ({matches.length})</option>
                  {sportsList.map(sp => (
                    <option key={sp} value={sp}>{sp.toUpperCase()}</option>
                  ))}
                </select>
              )}
              <div className="badge-chip"><span>Total Matches: {filteredMatches.length}</span></div>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <ClipboardIcon size={36} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>No matches found. Generate matches in the Setup Wizard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredMatches.map(m => {
                const isComplete = m.referee && m.scorekeeper && m.coachA && m.coachB && m.manager;
                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '18px 22px',
                    background: 'var(--bg-elevated)',
                    border: isComplete ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
                    borderRadius: '12px',
                  }}>
                    {/* Match header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>{m.sport?.toUpperCase()}</span>
                        <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{m.teamA} <span style={{ color: 'var(--accent)' }}>vs</span> {m.teamB}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>· {m.round}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}><MapPinIcon size={13} color="var(--text-muted)" /> {m.venue}</span>
                        <span className={`status-badge ${m.status}`}>{m.status === 'live' && <span className="live-dot" />}{m.status?.toUpperCase()}</span>
                        {isComplete
                          ? <span className="badge-chip" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' }}><CheckIcon size={12} color="#059669" /> All Certified</span>
                          : <span className="badge-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>In Progress</span>
                        }
                      </div>
                    </div>

                    {/* Dropdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><FlameIcon size={12} color="var(--accent)" /> REFEREE</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.referee || ''} onChange={e => assignMatchOfficials(m.id, { referee: e.target.value })}>
                          <option value="">Select Referee...</option>
                          {refereesList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardIcon size={12} color="#10b981" /> SCOREKEEPER</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.scorekeeper || ''} onChange={e => assignMatchOfficials(m.id, { scorekeeper: e.target.value })}>
                          <option value="">Select Scorekeeper...</option>
                          {scorekeepersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={12} color="#3b82f6" /> COACH ({m.teamA})</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.coachA || ''} onChange={e => assignMatchOfficials(m.id, { coachA: e.target.value })}>
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={12} color="#3b82f6" /> COACH ({m.teamB})</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.coachB || ''} onChange={e => assignMatchOfficials(m.id, { coachB: e.target.value })}>
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><TrophyIcon size={12} color="#f59e0b" /> MANAGER</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.manager || ''} onChange={e => assignMatchOfficials(m.id, { manager: e.target.value })}>
                          <option value="">Select Manager...</option>
                          {managersList.map(mg => <option key={mg.id} value={mg.name}>{mg.name}</option>)}
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
              {(['all', 'referee', 'scorekeeper', 'coach', 'manager'] as const).map(r => (
                <button
                  key={r}
                  className={`btn btn-sm ${officialFilter === r ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setOfficialFilter(r)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {r === 'all' ? `All (${officials.length})` : `${r}s (${officials.filter(o => o.role === r).length})`}
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
                  official.role === 'referee' ? '#ef4444' :
                    official.role === 'scorekeeper' ? '#10b981' :
                      official.role === 'coach' ? '#3b82f6' : '#f59e0b';
                return (
                  <div key={official.id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${badgeColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: badgeColor, background: `${badgeColor}20`, padding: '2px 8px', borderRadius: '4px' }}>
                        {official.role}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{official.licenseId}</span>
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
    </div>
  );
}
