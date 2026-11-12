import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG } from '../lib/sports';
import {
  TrophyIcon,
  MapPinIcon,
  CheckIcon,
  UsersIcon,
  CalendarIcon,
  MedalIcon,
  FlameIcon,
  ClipboardIcon,
  ShieldIcon,
  EyeIcon,
  EyeOffIcon,
  HomeIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';

// ─── Sport catalog ────────────────────────────────────────────────────────────
const SPORTS = SPORTS_CATALOG.map(s => ({
  id: s.id,
  name: s.name,
  type: 'bracket' as const,
  subtitle: s.rulesSummary,
  icon: '🏆',
  iconComp: (c?: string) => s.icon(c, 24),
}));

type SetupStep = 'accounts' | 'sport' | 'event' | 'teams' | 'bracket' | 'scorekeepers' | 'publish';

const STEPS: { id: SetupStep; label: string; desc: string; icon: (c?: string) => React.ReactNode }[] = [
  { id: 'accounts', label: 'User Accounts', desc: 'Admin, manager, coach, scorer', icon: (c) => <UsersIcon size={18} color={c} /> },
  { id: 'sport', label: 'Sport & Category', desc: 'From sports catalog', icon: (c) => <TrophyIcon size={18} color={c} /> },
  { id: 'event', label: 'Create Event', desc: 'Dates, venue, tournament rules', icon: (c) => <CalendarIcon size={18} color={c} /> },
  { id: 'teams', label: 'Register Teams', desc: 'Collegiate roster validation', icon: (c) => <MedalIcon size={18} color={c} /> },
  { id: 'bracket', label: 'Generate Bracket', desc: 'Auto-seeding and match pairing', icon: (c) => <FlameIcon size={18} color={c} /> },
  { id: 'scorekeepers', label: 'Assign Scorekeepers', desc: 'Per match & court assignment', icon: (c) => <ClipboardIcon size={18} color={c} /> },
  { id: 'publish', label: 'Publish Schedule', desc: 'Broadcast live to portal', icon: (c) => <ShieldIcon size={18} color={c} /> },
];

export default function SetupWizardPage() {
  const {
    matches, officials, teams, registeredUsers,
    events, createEvent, generateBracket, setActiveView,
  } = useApp();

  const [activeStep, setActiveStep] = useState<SetupStep>('accounts');
  const [hideWizardSidebar, setHideWizardSidebar] = useState(false);
  const [selectedSport, setSelectedSport] = useState<typeof SPORTS[0] | null>(SPORTS[0]);
  const [entriesValid, setEntriesValid] = useState<boolean | null>(null);
  const [eventForm, setEventForm] = useState({
    name: 'Asian College Padula Intramurals 2026 — Basketball',
    dates: 'Nov 10 – Nov 18, 2026',
    venue: 'Padula Sports Arena',
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

  const handleConfirmAndGenerateBracket = () => {
    setEntriesValid(true);
    const sportId = selectedSport?.id || 's1';
    let targetEvent = events.find(e => e.sport === sportId && !e.archived);
    let eventId = targetEvent?.id;
    if (!eventId) {
      eventId = createEvent({
        name: eventForm.name || `Asian College Padula Intramurals 2026 — ${selectedSport?.name || 'Basketball'}`,
        sport: sportId,
        division: 'div1',
        category: `${selectedSport?.name || 'Basketball'} Championship`,
        dates: eventForm.dates || 'Nov 10 – Nov 18, 2026',
        startDate: '2026-11-10',
        endDate: '2026-11-18',
        venue: eventForm.venue || 'Padula Sports Arena',
        status: 'ongoing',
      });
    }

    const sportTeams = teams.filter(t => t.isActive !== false && (t.sport === sportId || !t.sport));
    const teamIdsToSeed = sportTeams.length >= 2 
      ? sportTeams.map(t => t.id) 
      : teams.slice(0, 6).map(t => t.id);

    generateBracket(eventId, teamIdsToSeed.length >= 2 ? teamIdsToSeed : ['t1', 't2', 't3', 't4', 't5', 't6']);
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

              {[
                { label: 'Tournament Title', key: 'name', placeholder: 'e.g. Asian College Padula Cup 2026' },
                { label: 'Tournament Dates', key: 'dates', placeholder: 'e.g. Oct 28 – Nov 5' },
                { label: 'Venue / Court', key: 'venue', placeholder: 'e.g. Padula Sports Complex Court A' },
                { label: 'Regulatory Ruleset', key: 'rules', placeholder: 'e.g. Official NCAA / FIBA Standard Rules' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input
                    className="form-input"
                    placeholder={f.placeholder}
                    value={(eventForm as Record<string, string>)[f.key]}
                    onChange={e => setEventForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Team Roster →</button>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Register Teams &amp; Athlete Rosters</h3>
            <p className="step-section-sub">Validate coach submissions for eligibility and physical fitness certification.</p>
            <div className="teams-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Padula Eagles', division: 'Business Administration & Accountancy (BAA)', seed: '#1' },
                { name: 'Red Lions', division: 'Computer Studies & Engineering (CSE)', seed: '#2' },
                { name: 'Blue Sharks', division: 'Hospitality & Tourism Management (HTM)', seed: '#3' },
                { name: 'Padula Tigers', division: 'Department of Public Development (DPD)', seed: '#4' },
                { name: 'Panthers', division: 'Senior Department', seed: '#5' },
                { name: 'Silver Wolves', division: 'Business Administration & Accountancy (BAA)', seed: '#6' },
              ].map(team => (
                <div
                  key={team.name}
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
                    <span
                      style={{
                        minWidth: '38px',
                        height: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        background: 'rgba(220, 38, 38, 0.12)',
                        color: 'var(--accent)',
                        fontWeight: 800,
                        fontSize: '12px',
                        flexShrink: 0,
                        border: '1px solid rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      {team.seed}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {team.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {team.division}
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
              ))}
            </div>
            <div className="validation-question glass-card" style={{ marginTop: '20px' }}>
              <div className="validation-question-header">
                <ShieldIcon size={20} color="var(--accent)" />
                <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Are all team rosters verified by Asian College Padula Sports Board?</p>
              </div>
              <div className="validation-btns">
                <button className={`btn ${entriesValid === false ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setEntriesValid(false)}>Flag Incomplete Entries</button>
                <button className="btn btn-primary" onClick={handleConfirmAndGenerateBracket}>Confirm &amp; Generate Bracket</button>
              </div>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Bracket Seeding →</button>
            </div>
          </div>
        );

      case 'bracket':
        const currentSportMatches = matches.filter(m => !selectedSport || m.sport === selectedSport.id);
        const displayMatches = currentSportMatches.length > 0 ? currentSportMatches : matches;

        return (
          <div className="step-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 className="step-section-heading">Automated Tournament Bracket Seeding {selectedSport && `— ${selectedSport.name}`}</h3>
                <p className="step-section-sub" style={{ margin: 0 }}>Single-elimination championship bracket mapped to active court venues.</p>
              </div>
              {displayMatches.length === 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleConfirmAndGenerateBracket}
                >
                  ⚡ Generate Bracket Now
                </button>
              )}
            </div>

            {displayMatches.length > 0 ? (
              <div className="bracket-preview">
                <div className="bracket-round">
                  <div className="bracket-label">Round 1 / Quarter-Finals</div>
                  {displayMatches.filter(m => (m.roundNumber ?? 1) === 1).map(m => (
                    <div key={m.id} className="bracket-match glass-card">
                      <span style={{ fontWeight: 600 }}>{m.teamA}</span>
                      <span className="bracket-vs">VS</span>
                      <span style={{ fontWeight: 600 }}>{m.teamB}</span>
                    </div>
                  ))}
                </div>
                <div className="bracket-round">
                  <div className="bracket-label">Semi-Finals</div>
                  {displayMatches.filter(m => (m.roundNumber ?? 1) === 2).map(m => (
                    <div key={m.id} className="bracket-match glass-card tbd">
                      <span>{m.teamA}</span><span className="bracket-vs">VS</span><span>{m.teamB}</span>
                    </div>
                  ))}
                </div>
                <div className="bracket-round">
                  <div className="bracket-label">Padula Championship Final</div>
                  {(() => {
                    const champ = displayMatches.find(m => {
                      if (m.roundNumber === 3) return true;
                      const r = m.round ? m.round.toLowerCase() : '';
                      if (r.includes('quarter') || r.includes('semi')) return false;
                      return r.includes('championship') || r.includes('gold') || r === 'final';
                    });
                    if (!champ) {
                      return (
                        <div className="bracket-match glass-card tbd final">
                          <TrophyIcon size={18} color="#fbbf24" />
                          <span>TBD — Winner of Semi-Finals</span>
                        </div>
                      );
                    }
                    const isFin = champ.status === 'finished';
                    const isLiv = champ.status === 'live';
                    const winner = isFin ? champ.winner : undefined;
                    return (
                      <div
                        className={`bracket-match glass-card ${isFin && winner ? 'final-winner' : 'tbd final'}`}
                        style={{
                          border: isFin && winner ? '1.5px solid #f59e0b' : isLiv ? '1.5px solid #ef4444' : undefined,
                          background: isFin && winner ? 'rgba(245, 158, 11, 0.08)' : isLiv ? 'rgba(239, 68, 68, 0.08)' : undefined,
                        }}
                      >
                        <TrophyIcon size={18} color={isFin && winner ? '#f59e0b' : isLiv ? '#ef4444' : '#fbbf24'} />
                        <span style={{ fontWeight: isFin && winner ? 800 : 600, color: isFin && winner ? '#f59e0b' : isLiv ? '#ef4444' : undefined }}>
                          {isFin && winner ? `🏆 Champion: ${winner}` : isLiv ? `⚡ Live: ${champ.teamA} ${champ.scoreA} - ${champ.scoreB} ${champ.teamB}` : `${champ.teamA} vs ${champ.teamB} (Awaiting Final)`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="empty-state glass-card" style={{ padding: '36px', textAlign: 'center' }}>
                <TrophyIcon size={36} color="var(--accent)" />
                <div style={{ fontWeight: 700, fontSize: '15px', marginTop: 10, color: 'var(--text-primary)' }}>No Bracket Matches Generated Yet</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
                  Click below to generate an official single-elimination bracket for {selectedSport ? selectedSport.name : 'the tournament'}.
                </div>
                <button type="button" className="btn btn-primary" onClick={handleConfirmAndGenerateBracket}>
                  ⚡ Generate Bracket for {selectedSport ? selectedSport.name : 'Tournament'}
                </button>
              </div>
            )}
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Assign Scorekeepers →</button>
            </div>
          </div>
        );

      case 'scorekeepers':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Official Scorekeeper &amp; Referee Game Assignment</h3>
            <p className="step-section-sub">Assign certified staff and game officials to active competition courts.</p>
            <div className="assign-grid">
              {matches.map(m => (
                <div key={m.id} className="assign-card glass-card">
                  <div className="assign-match" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.teamA} vs {m.teamB}</div>
                  <div className="assign-venue" style={{ color: 'var(--text-muted)' }}><MapPinIcon size={14} color="var(--text-muted)" /> {m.venue} ({m.sport})</div>
                  <div className="assign-scorer" style={{ marginTop: '8px', color: 'var(--text-secondary)' }}><ClipboardIcon size={14} color="#10b981" /> Scorer: <strong>{m.scorekeeper || 'Unassigned'}</strong></div>
                  <div className="assign-scorer" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}><FlameIcon size={14} color="var(--accent)" /> Referee: <strong>{m.referee || 'Unassigned'}</strong></div>
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('admin')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HomeIcon size={14} /> Dashboard
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('officials')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldIcon size={14} /> Officials Hub
          </button>
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
