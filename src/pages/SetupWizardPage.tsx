import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG } from '../lib/sports';
import {
  TrophyIcon,
  CheckIcon,
  UsersIcon,
  CalendarIcon,
  MedalIcon,
  FlameIcon,
  ClipboardIcon,
  ShieldIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  RefreshIcon,
  PlusIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';
import TournamentTreeBracket from '../components/TournamentTreeBracket';

// ─── Sport catalog ────────────────────────────────────────────────────────────
const SPORTS = SPORTS_CATALOG.map(s => ({
  id: s.id,
  name: s.name,
  type: 'bracket' as const,
  subtitle: s.rulesSummary,
  iconComp: (c?: string) => s.icon(c, 24),
}));

type SetupStep = 'accounts' | 'sport' | 'event' | 'teams' | 'bracket' | 'scorekeepers' | 'publish';

const STEPS: { id: SetupStep; label: string; desc: string; icon: (c?: string) => React.ReactNode }[] = [
  { id: 'accounts', label: 'User Accounts', desc: 'Admin, manager, coach, scorer', icon: (c) => <UsersIcon size={18} color={c} /> },
  { id: 'sport', label: 'Sport & Category', desc: 'From sports catalog', icon: (c) => <TrophyIcon size={18} color={c} /> },
  { id: 'event', label: 'Create Event & Bracket', desc: 'Auto-creates event & bracket', icon: (c) => <CalendarIcon size={18} color={c} /> },
  { id: 'teams', label: 'Register Teams', desc: 'Collegiate roster validation', icon: (c) => <MedalIcon size={18} color={c} /> },
  { id: 'bracket', label: 'Bracket Structure', desc: 'Live bracket & scorer advancement', icon: (c) => <FlameIcon size={18} color={c} /> },
  { id: 'scorekeepers', label: 'Assign Scorekeepers', desc: 'Per match & court assignment', icon: (c) => <ClipboardIcon size={18} color={c} /> },
  { id: 'publish', label: 'Publish Schedule', desc: 'Broadcast live to portal', icon: (c) => <ShieldIcon size={18} color={c} /> },
];

export default function SetupWizardPage() {
  const {
    matches, officials, teams, departments, registeredUsers, venues,
    events, createEvent, generateBracket, assignMatchOfficials, setActiveView,
  } = useApp();

  const [activeStep, setActiveStep] = useState<SetupStep>('accounts');
  const [hideWizardSidebar, setHideWizardSidebar] = useState(false);
  const [selectedSport, setSelectedSport] = useState<typeof SPORTS[0] | null>(SPORTS[0]);
  const [entriesValid, setEntriesValid] = useState<boolean | null>(null);
  const [eventForm, setEventForm] = useState({
    name: 'Asian College Padula Intramurals 2026 — Basketball',
    format: 'single_elimination' as 'single_elimination' | 'round_robin',
    dates: 'Nov 10 – Nov 18, 2026',
    startDate: '2026-11-10',
    startTime: '08:00',
    endDate: '2026-11-18',
    endTime: '17:00',
    venue: venues[0]?.name || 'Main Arena Court 1',
    rules: 'Official Inter-Collegiate Basketball Rules',
  });

  // Derived lists for account and assignment counts
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

  const stepIdx = STEPS.findIndex(s => s.id === activeStep);
  const goNext = () => { if (stepIdx < STEPS.length - 1) setActiveStep(STEPS[stepIdx + 1].id); };
  const goPrev = () => { if (stepIdx > 0) setActiveStep(STEPS[stepIdx - 1].id); };

  const ensureEventAndBracketCreated = (forceRebuild = false) => {
    const sportId = selectedSport?.id || 's1';
    const sportTeams = teams.filter(t => t.isActive !== false && t.sport === sportId);
    const teamIds = sportTeams.map(t => t.id);

    let targetEvent = events.find(e => e.sport === sportId && !e.archived);
    let eventId = targetEvent?.id;
    if (!eventId) {
      // createEvent automatically generates the bracket / round-robin schedule for this event and posts an announcement
      eventId = createEvent({
        name: eventForm.name || `Asian College Padula Intramurals 2026 — ${selectedSport?.name || 'Basketball'}`,
        sport: sportId,
        division: 'div1',
        format: eventForm.format,
        category: `${selectedSport?.name || 'Basketball'} Championship`,
        dates: `${eventForm.startDate} (${eventForm.startTime}) – ${eventForm.endDate} (${eventForm.endTime})`,
        startDate: eventForm.startDate || '2026-11-10',
        endDate: eventForm.endDate || '2026-11-18',
        startTime: eventForm.startTime || '08:00',
        endTime: eventForm.endTime || '17:00',
        venue: eventForm.venue || venues[0]?.name || 'Main Arena Court 1',
        rules: eventForm.rules,
        status: 'ongoing',
      });
    } else {
      generateBracket(eventId, teamIds, forceRebuild, eventForm.format);
    }
  };

  const handleConfirmAndGenerateBracket = () => {
    setEntriesValid(true);
    ensureEventAndBracketCreated(true);
    goNext();
  };

  // ─── Step Renderer ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (activeStep) {
      case 'accounts':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Manage Athletic Department Accounts</h3>
            <p className="step-section-sub">Configure permissions for tournament directors, coaches, referee officials, and scorekeepers.</p>
            <div className="role-cards">
              {[
                { role: 'Tournament Director', icon: <ShieldIcon size={24} color="#ff3355" />, desc: 'Master governance & sanctioning', count: 2 },
                { role: 'Athletic Managers', icon: <TrophyIcon size={24} color="#38bdf8" />, desc: 'Department team administration', count: managersList.length },
                { role: 'Varsity Coaches', icon: <UsersIcon size={24} color="#fbbf24" />, desc: 'Team rosters & athletic training', count: coachesList.length },
                { role: 'Official Referees', icon: <FlameIcon size={24} color="#ff4d6d" />, desc: 'Game officiating & rule compliance', count: refereesList.length },
                { role: 'Official Scorekeepers', icon: <ClipboardIcon size={24} color="#34d399" />, desc: 'Live digital scoring desk', count: scorekeepersList.length },
              ].map(r => (
                <div key={r.role} className="role-card glass-card">
                  <div className="role-icon-box">{r.icon}</div>
                  <div className="role-info"><strong>{r.role}</strong><span>{r.desc}</span></div>
                  <div className="role-count">{r.count}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={goNext}>Next: Select Sport →</button>
              <button className="btn btn-navy" onClick={() => setActiveView('officials')}>Go to Officials Hub →</button>
              <button className="btn btn-ghost" onClick={() => setActiveView('admin')}>Back to Dashboard</button>
            </div>
          </div>
        );

      case 'sport':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Official Sports Catalog</h3>
            <p className="step-section-sub">Select the athletic event to configure tournament brackets and match regulations.</p>
            <div className="sports-grid">
              {SPORTS.map(sport => {
                const isSel = selectedSport?.id === sport.id;
                return (
                  <button
                    key={sport.id}
                    type="button"
                    className={`sport-tile ${sport.type} ${isSel ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSport(sport);
                      setEventForm(prev => ({
                        ...prev,
                        name: `Asian College Padula Intramurals 2026 — ${sport.name}`,
                        rules: sport.subtitle || prev.rules,
                      }));
                    }}
                  >
                    <div className="sport-tile-header">
                      <div className="sport-tile-icon-box">{sport.iconComp(isSel ? 'var(--accent)' : '#93c5fd')}</div>
                      {isSel && (
                        <span className="sport-selected-badge">
                          <CheckIcon size={12} color="#10b981" /> Selected
                        </span>
                      )}
                    </div>
                    <span className="sport-name">{sport.name}</span>
                    <span className="sport-subtitle">{sport.subtitle}</span>
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span className="legend-item bracket" style={{ color: '#ff4d6d' }}>● Elimination Tournament</span>
              <span className="legend-item judged" style={{ color: '#38bdf8' }}>● Judged &amp; Point Score Ranking</span>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!selectedSport}>
                Next: Event Details ({selectedSport ? selectedSport.name : 'Choose Sport'}) →
              </button>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Event Details {selectedSport && `— ${selectedSport.name}`}</h3>
            <p className="step-section-sub">Specify dates, arena locations, and regulatory handbook guidelines.</p>
            <div className="form-grid">
              {/* Active Sport Selection Dropdown right in Event Details */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Tournament Sport / Game</label>
                <select
                  className="form-input"
                  style={{ fontWeight: 700 }}
                  value={selectedSport?.id || 's1'}
                  onChange={e => {
                    const sp = SPORTS.find(s => s.id === e.target.value);
                    if (sp) {
                      setSelectedSport(sp);
                      setEventForm(prev => ({
                        ...prev,
                        name: `Asian College Padula Intramurals 2026 — ${sp.name}`,
                        rules: sp.subtitle || prev.rules,
                      }));
                    }
                  }}
                >
                  {SPORTS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.subtitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tournament Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Asian College Padula Cup 2026"
                  value={eventForm.name}
                  onChange={e => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Game / Tournament Format</label>
                <select
                  className="form-input"
                  style={{ fontWeight: 700 }}
                  value={eventForm.format}
                  onChange={e => setEventForm(prev => ({ ...prev, format: e.target.value as 'single_elimination' | 'round_robin' }))}
                >
                  <option value="single_elimination">Single Elimination (Knockout Bracket)</option>
                  <option value="round_robin">Round Robin (Every Team Plays Every Team)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Event Place (Venue / Court)</label>
                <select
                  className="form-input"
                  style={{ fontWeight: 600 }}
                  value={eventForm.venue || venues[0]?.name || ''}
                  onChange={e => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                >
                  {venues.map(v => (
                    <option key={v.id} value={v.name}>
                      {v.name} — {v.location} (Cap. {v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Regulatory Ruleset</label>
                <input
                  className="form-input"
                  placeholder="e.g. Official NCAA / FIBA Standard Rules"
                  value={eventForm.rules}
                  onChange={e => setEventForm(prev => ({ ...prev, rules: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={eventForm.startDate}
                  onChange={e => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Start Time (Event Opens)</label>
                <input
                  type="time"
                  className="form-input"
                  value={eventForm.startTime}
                  onChange={e => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={eventForm.endDate}
                  onChange={e => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>End Time (Event Concludes)</label>
                <input
                  type="time"
                  className="form-input"
                  value={eventForm.endTime}
                  onChange={e => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  ensureEventAndBracketCreated(false);
                  goNext();
                }}
              >
                Create Event &amp; Auto-Generate Bracket →
              </button>
            </div>
          </div>
        );

      case 'teams': {
        const sportId = selectedSport?.id || 's1';
        const sportTeams = teams.filter(t => t.isActive !== false && t.sport === sportId);
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Registered Teams &amp; Athlete Rosters {selectedSport && `— ${selectedSport.name}`}</h3>
            <p className="step-section-sub">Validate coach submissions for eligibility and physical fitness certification. No automatic seeding is applied.</p>
            <div className="teams-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sportTeams.length === 0 ? (
                <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13.5px' }}>
                    No teams registered for {selectedSport?.name || 'this sport'} yet.
                  </p>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setActiveView('registration')}>
                    Open Team Registration →
                  </button>
                </div>
              ) : (
                sportTeams.map(team => {
                  const dept = departments.find(d => d.id === team.department);
                  return (
                    <div
                      key={team.id}
                      className="team-row glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        gap: '14px',
                        borderRadius: '12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            {team.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {dept ? `${dept.name} (${dept.shortName})` : team.division}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '20px',
                          padding: '5px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <CheckIcon size={14} color="#10b981" /> Certified Eligible
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="validation-question glass-card" style={{ marginTop: '20px' }}>
              <div className="validation-question-header">
                <ShieldIcon size={20} color="var(--accent)" />
                <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Are all team rosters verified by Asian College Padula Sports Board?</p>
              </div>
              <div className="validation-btns">
                <button className={`btn ${entriesValid === false ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setEntriesValid(false)}>Flag Incomplete Entries</button>
                <button className="btn btn-primary" onClick={handleConfirmAndGenerateBracket}>Confirm &amp; Sync Bracket</button>
              </div>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Bracket Structure →</button>
            </div>
          </div>
        );
      }

      case 'bracket':
        const currentSportMatches = matches.filter(m => !selectedSport || m.sport === selectedSport.id);
        const displayMatches = currentSportMatches;

        return (
          <div className="step-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 className="step-section-heading">Tournament Bracket Structure {selectedSport && `— ${selectedSport.name}`}</h3>
                <p className="step-section-sub" style={{ margin: 0 }}>Single-elimination championship bracket. Official Scorekeepers decide which team advances to which next-round slot.</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleConfirmAndGenerateBracket}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {displayMatches.length === 0 ? (
                  <><PlusIcon size={14} /> Generate Bracket Now</>
                ) : (
                  <><RefreshIcon size={13} /> Rebuild Bracket</>
                )}
              </button>
            </div>

            <TournamentTreeBracket initialSportId={selectedSport?.id || 's1'} showSportSelector={false} />

            <div className="step-nav" style={{ marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Assign Scorekeepers →</button>
            </div>
          </div>
        );

      case 'scorekeepers':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Official Scorekeeper, Referee &amp; Event Place Assignment</h3>
            <p className="step-section-sub">Assign certified staff, game officials, and court venues to scheduled tournament matches.</p>
            <div className="assign-grid">
              {matches.map(m => (
                <div key={m.id} className="assign-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <div className="assign-match" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{m.teamA} vs {m.teamB}</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', background: m.format === 'round_robin' ? 'rgba(56,189,248,0.14)' : 'rgba(245,158,11,0.14)', color: m.format === 'round_robin' ? '#38bdf8' : '#f59e0b' }}>
                      {m.format === 'round_robin' ? 'Round Robin' : 'Single Elimination'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {m.round} · {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date/Time TBA'}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: '3px', textTransform: 'uppercase' }}>
                      <MapPinIcon size={11} color="var(--text-muted)" /> Event Place (Venue):
                    </label>
                    <select
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '12px', height: 'auto' }}
                      value={m.venue || venues[0]?.name || ''}
                      onChange={e => assignMatchOfficials(m.id, { venue: e.target.value })}
                    >
                      {venues.map(v => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.location})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="assign-scorer" style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}><ClipboardIcon size={13} color="#10b981" /> Scorer: <strong>{m.scorekeeper || 'Demo Scorekeeper'}</strong></div>
                  <div className="assign-scorer" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}><FlameIcon size={13} color="var(--accent)" /> Referee: <strong>{m.referee || 'Unassigned'}</strong></div>
                </div>
              ))}
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Publish Official Schedule →</button>
            </div>
          </div>
        );

      case 'publish':
        return (
          <div className="step-content publish-step glass-card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 16px' }}><ShieldIcon size={54} color="#ff3355" /></div>
            <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Asian College Padula Schedule Live!</h3>
            <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 24px' }}>
              Tournament brackets, assigned referees, scorekeepers, and managers are now active.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', maxWidth: '640px', margin: '0 auto 28px' }}>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#ff4d6d' }}>{matches.length}</div><div className="stat-lbl">Matches</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#38bdf8' }}>{refereesList.length}</div><div className="stat-lbl">Referees</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#34d399' }}>{scorekeepersList.length}</div><div className="stat-lbl">Scorekeepers</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#fbbf24' }}>{coachesList.length}</div><div className="stat-lbl">Coaches</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setActiveView('bracket')}>
                View Live Brackets →
              </button>
              <button className="btn btn-navy" onClick={() => setActiveView('admin')}>
                Go to Operations Dashboard
              </button>
              <button className="btn btn-ghost" onClick={() => setActiveStep('accounts')}>
                Configure Another Sport
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
              Tournament Setup Wizard
            </h1>
            <p className="page-desc" style={{ marginTop: 3, fontSize: '12px', color: 'var(--text-muted)' }}>
              Step-by-step tournament configuration, team verification, and automated bracket generation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Wizard Container ─────────────────────────────────────────────────── */}
      <div className="setup-wizard-container">
        {/* Modern Top Header / Control Bar with Hide Option */}
        <div className="wizard-top-bar glass-card">
          <div className="wizard-top-bar-left">
            <div className="wizard-badge-pill">
              <CalendarIcon size={13} color="var(--accent)" />
              <span>TOURNAMENT SETUP WIZARD</span>
            </div>
            <div className="wizard-progress-info">
              <span className="wizard-step-title-strong">Step {stepIdx + 1} of {STEPS.length}: {STEPS[stepIdx].label}</span>
              <span className="wizard-progress-pct">{Math.round(((stepIdx + 1) / STEPS.length) * 100)}% Complete</span>
            </div>
          </div>

          <div className="wizard-top-bar-right">
            <button
              type="button"
              className="btn btn-sm btn-ghost wizard-toggle-sidebar-btn"
              onClick={() => setHideWizardSidebar(prev => !prev)}
              title={hideWizardSidebar ? 'Show step navigation sidebar' : 'Hide step navigation sidebar'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}
            >
              {hideWizardSidebar ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
              <span>{hideWizardSidebar ? 'Show Steps' : 'Hide Steps'}</span>
            </button>
          </div>

          {/* Visual Progress Bar track */}
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={`setup-wizard ${hideWizardSidebar ? 'sidebar-hidden' : ''}`}>
          {!hideWizardSidebar && (
            <div className="wizard-sidebar glass-card">
              <div className="wizard-sidebar-header">
                <div>
                  <div className="wizard-title">Setup Steps</div>
                  <div className="wizard-subtitle">{stepIdx + 1} of {STEPS.length} active</div>
                </div>
              </div>

              <div className="wizard-steps-list">
                {STEPS.map((step, i) => {
                  const isDone = i < stepIdx;
                  const isActive = activeStep === step.id;
                  const iconColor = isActive ? '#ff3355' : isDone ? '#10b981' : 'var(--text-muted)';
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={`wizard-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <div className="wizard-step-num">
                        {isDone ? <CheckIcon size={14} color="#10b981" /> : i + 1}
                      </div>
                      <div className="wizard-step-info">
                        <div className="wizard-step-label">
                          <span className="wizard-step-icon">{step.icon(iconColor)}</span>
                          <span>{step.label}</span>
                        </div>
                        <div className="wizard-step-desc">{step.desc}</div>
                      </div>
                      {isActive && <div className="wizard-step-active-indicator" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="wizard-main glass-card">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
