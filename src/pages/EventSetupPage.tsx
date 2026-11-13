import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPinIcon, PlusIcon,
  CheckIcon, CalendarIcon,
  TrophyIcon, LayersIcon, BuildingIcon, UsersIcon,
  ClockIcon, RefreshIcon,
  FileTextIcon, AwardIcon, ZapIcon,
  TrashIcon,
} from '../components/Icons';
import { getAllSports, saveCustomSport, deleteCustomSport, getSportName, getSportIcon, type SportMeta, type SportFormat } from '../lib/sports';

type SetupTab = 'sports' | 'divisions' | 'venues' | 'departments' | 'events';

export default function EventSetupPage() {
  const {
    departments, divisions, venues, events, teams, matches,
    addDepartment, removeDepartment,
    addDivision, removeDivision,
    addVenue, removeVenue,
    createEvent, publishEvent, archiveEvent, deleteEvent, updateEvent, deleteBracket,
    setActiveView, currentUser,
  } = useApp();

  const [tab, setTab] = useState<SetupTab>('sports');

  // Dynamic Sports Catalog
  const [allSports, setAllSports] = useState<SportMeta[]>(() => getAllSports());
  useEffect(() => {
    const refresh = () => setAllSports(getAllSports());
    window.addEventListener('padula_sports_updated', refresh);
    return () => window.removeEventListener('padula_sports_updated', refresh);
  }, []);

  // Sport form
  const [sportForm, setSportForm] = useState<{
    name: string;
    category: 'team' | 'individual' | 'esport' | 'board';
    unit: string;
    rulesSummary: string;
    format: SportFormat;
    iconKey: string;
  }>({
    name: '',
    category: 'team',
    unit: 'Points',
    rulesSummary: '',
    format: 'Single elimination',
    iconKey: 'trophy',
  });
  const [sportSuccess, setSportSuccess] = useState('');

  const handleAddSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sportForm.name.trim()) return;
    const created = saveCustomSport({
      name: sportForm.name.trim(),
      category: sportForm.category,
      unit: sportForm.unit.trim() || 'Points',
      rulesSummary: sportForm.rulesSummary.trim() || `${sportForm.name.trim()} Tournament Regulations`,
      format: sportForm.format,
      iconKey: sportForm.iconKey,
    });
    setAllSports(getAllSports());
    setSportSuccess(`Sport "${created.name}" added successfully to the catalog!`);
    setSportForm({
      name: '',
      category: 'team',
      unit: 'Points',
      rulesSummary: '',
      format: 'Single elimination',
      iconKey: 'trophy',
    });
    setTimeout(() => setSportSuccess(''), 4000);
  };

  const handleDeleteSport = (id: string, name: string) => {
    if (window.confirm(`Remove custom sport "${name}" from the catalog?`)) {
      deleteCustomSport(id);
      setAllSports(getAllSports());
    }
  };

  // Department form
  const [deptForm, setDeptForm] = useState({ name: '', shortName: '', color: '#3b82f6' });
  const [deptSuccess, setDeptSuccess] = useState('');

  // Division form
  const [divForm, setDivForm] = useState({ name: '', sportId: 's1' });
  const [divSuccess, setDivSuccess] = useState('');

  // Campus Location choices
  const CAMPUS_LOCATIONS = [
    'Main Gymnasium',
    'Gymnasium Building A',
    'Gymnasium Building B',
    'Student Center 2F',
    'Student Activity Center',
    'IT Building 3F (Esports Arena)',
    'Audio-Visual Center (AVC)',
    'Outdoor Campus Oval',
    'Open Court / Quadrangle',
    'Asian College Main Auditorium',
  ];

  const locationOptions = useMemo(() => {
    const list = [...CAMPUS_LOCATIONS];
    venues.forEach(v => {
      if (v.location && !list.includes(v.location)) {
        list.push(v.location);
      }
    });
    return list;
  }, [venues]);

  // Venue form
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [venueForm, setVenueForm] = useState({ name: '', capacity: '200', location: 'Main Gymnasium' });
  const [venueSuccess, setVenueSuccess] = useState('');

  // Event form
  const [eventForm, setEventForm] = useState({
    name: 'Asian College Padula 2026',
    sport: 's1',
    division: 'div1',
    format: 'single_elimination' as 'single_elimination' | 'round_robin',
    category: "Men's Varsity Championship",
    venue: venues[0]?.name || 'Main Arena Court 1',
    dates: '',
    startDate: '2026-11-10',
    endDate: '2026-11-18',
    startTime: '08:00',
    endTime: '17:00',
    status: 'draft' as const,
  });
  const [eventSuccess, setEventSuccess] = useState('');

  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${ampm}`;
  };

  const tabs: { id: SetupTab; label: string; icon: (color?: string) => React.ReactNode }[] = [
    { id: 'sports', label: 'Sports & Esports', icon: (c) => <TrophyIcon size={15} color={c} /> },
    { id: 'divisions', label: 'Divisions', icon: (c) => <LayersIcon size={15} color={c} /> },
    { id: 'venues', label: 'Venues', icon: (c) => <MapPinIcon size={15} color={c} /> },
    { id: 'departments', label: 'Departments', icon: (c) => <BuildingIcon size={15} color={c} /> },
    { id: 'events', label: 'Events', icon: (c) => <CalendarIcon size={15} color={c} /> },
  ];

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    addDepartment(deptForm);
    setDeptSuccess(`${deptForm.name} added!`);
    setDeptForm({ name: '', shortName: '', color: '#3b82f6' });
    setTimeout(() => setDeptSuccess(''), 3000);
  };

  const handleAddDiv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divForm.name.trim()) return;
    addDivision(divForm);
    setDivSuccess(`${divForm.name} added!`);
    setDivForm({ name: '', sportId: 's1' });
    setTimeout(() => setDivSuccess(''), 3000);
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueForm.name.trim()) return;
    const finalLocation = (isCustomLocation ? venueForm.location.trim() : venueForm.location) || 'Main Gymnasium';
    addVenue({ name: venueForm.name.trim(), capacity: Number(venueForm.capacity) || 200, location: finalLocation, sports: [] });
    setVenueSuccess(`${venueForm.name.trim()} added!`);
    setVenueForm({ name: '', capacity: '200', location: 'Main Gymnasium' });
    setIsCustomLocation(false);
    setTimeout(() => setVenueSuccess(''), 3000);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const sportTeams = teams.filter(t => t.isActive !== false && t.sport === eventForm.sport);
    const startPart = `${eventForm.startDate || 'TBA'}${eventForm.startTime ? ` (${formatTime12h(eventForm.startTime)})` : ''}`;
    const endPart = `${eventForm.endDate || 'TBA'}${eventForm.endTime ? ` (${formatTime12h(eventForm.endTime)})` : ''}`;
    const formattedDates = (eventForm.startDate || eventForm.endDate)
      ? `${startPart} – ${endPart}`
      : eventForm.dates;

    const formatLabel = eventForm.format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    const chosenVenue = eventForm.venue || venues[0]?.name || 'Main Arena Court 1';

    createEvent({
      name: eventForm.name,
      sport: eventForm.sport,
      division: eventForm.division,
      format: eventForm.format,
      category: eventForm.category,
      dates: formattedDates,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      venue: chosenVenue,
      status: 'ongoing',
    });
    setEventSuccess(`Event created (${formatLabel} · ${chosenVenue} · ${startPart} – ${endPart}), schedule/bracket automatically generated (${sportTeams.length} team${sportTeams.length === 1 ? '' : 's'}), and official announcement posted!`);
    setTimeout(() => setEventSuccess(''), 6000);
  };

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics</div>
          <h1 className="page-title">Event Setup & Configuration</h1>
          <p className="page-desc">Configure sports, esports, divisions, venues, departments, and tournament events</p>
        </div>
        <div className="stats-row">
          <div className="mini-stat glass-card"><span className="mini-val">{departments.length}</span><span className="mini-lbl">Depts</span></div>
          <div className="mini-stat glass-card"><span className="mini-val">{venues.length}</span><span className="mini-lbl">Venues</span></div>
          <div className="mini-stat glass-card"><span className="mini-val" style={{ color: '#ff3355' }}>{events.length}</span><span className="mini-lbl">Events</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ display: 'flex', gap: '6px', padding: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const isActive = tab === t.id;
          return (
            <button key={t.id}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t.id)}
              style={{
                flex: '1 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              {t.icon(isActive ? '#ffffff' : 'currentColor')}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── SPORTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'sports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add Sport Form Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: '0 0 4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusIcon size={18} color="var(--accent)" />
                  Add Sport or Esport to Catalog
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Register a new competitive sport, martial art, board game, or esports title for tournament play.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sport / Esport Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Swimming, Taekwondo, Mobile Legends..."
                  value={sportForm.name}
                  onChange={e => setSportForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Category *</label>
                <select
                  className="form-input"
                  value={sportForm.category}
                  onChange={e => setSportForm(p => ({ ...p, category: e.target.value as any }))}
                >
                  <option value="team">Team Sport (e.g. Volleyball, Basketball)</option>
                  <option value="individual">Individual Sport (e.g. Badminton, Athletics)</option>
                  <option value="esport">Esports Division (e.g. MLBB, Dota 2, Tekken)</option>
                  <option value="board">Board Game / Mind Sport (e.g. Chess, Scrabble)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tournament Format *</label>
                <select
                  className="form-input"
                  value={sportForm.format}
                  onChange={e => setSportForm(p => ({ ...p, format: e.target.value as any }))}
                >
                  <option value="Single elimination">Single Elimination</option>
                  <option value="Round robin, then finals">Round Robin, then Finals</option>
                  <option value="Round robin">Full Round Robin</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Scoring Metric (Unit) *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Points, Goals, Sets, Games, Wins"
                  value={sportForm.unit}
                  onChange={e => setSportForm(p => ({ ...p, unit: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Icon Glyph</label>
                <select
                  className="form-input"
                  value={sportForm.iconKey}
                  onChange={e => setSportForm(p => ({ ...p, iconKey: e.target.value }))}
                >
                  <option value="trophy">Trophy (General)</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="football">Football / Soccer</option>
                  <option value="sepaktakraw">Sepak Takraw</option>
                  <option value="tabletennis">Table Tennis</option>
                  <option value="badminton">Badminton</option>
                  <option value="frisbee">Ultimate Frisbee</option>
                  <option value="chess">Chess</option>
                  <option value="scrabble">Scrabble</option>
                  <option value="gamepad">Gamepad / Esports</option>
                  <option value="crosshair">Crosshair / Tactical</option>
                  <option value="medal">Medal</option>
                  <option value="flame">Flame / Martial Arts</option>
                  <option value="zap">Lightning / Speed</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Rules &amp; Match Scoring Summary</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sets to 25, best of 3; finals best of 5"
                  value={sportForm.rulesSummary}
                  onChange={e => setSportForm(p => ({ ...p, rulesSummary: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', minWidth: '130px', fontWeight: 700 }}
                >
                  <PlusIcon size={16} /> Add Sport
                </button>
              </div>
            </form>
            {sportSuccess && (
              <div style={{ marginTop: '14px', color: '#10b981', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={16} color="#10b981" /> {sportSuccess}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrophyIcon size={20} color="var(--accent)" />
                Sports &amp; Esports Catalog ({allSports.length})
              </h2>
            </div>

            <div className="sports-grid">
              {allSports.map(sport => {
                const isCustom = !['s1', 's2', 's_football', 's_sepaktakraw', 's4', 's3', 's_frisbee', 's8', 's_scrabble', 's5', 's6', 's7'].includes(sport.id);
                return (
                  <div key={sport.id} className={`sport-tile ${sport.category === 'esport' ? 'esport' : ''}`} style={{ cursor: 'default', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                      <div className="sport-tile-icon-box">{sport.icon('#93c5fd', 24)}</div>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSport(sport.id, sport.name)}
                          title="Delete custom sport"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px 7px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <span className="sport-name">{sport.name}</span>
                    <span className="sport-subtitle">{sport.rulesSummary}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700, marginTop: '4px' }}>
                      {sport.format}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {sport.category === 'esport' && (
                        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          ESPORTS
                        </span>
                      )}
                      {isCustom && (
                        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          CUSTOM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="legend" style={{ marginTop: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ff4d6d', fontWeight: 600 }}>
                <span style={{ fontSize: '10px' }}>●</span> Elimination Bracket Tournament
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
                <span style={{ fontSize: '10px' }}>●</span> Judged / Performance Scoring
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontWeight: 600 }}>
                <span style={{ fontSize: '10px' }}>●</span> Esports Division
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── DIVISIONS TAB ──────────────────────────────────────────────────── */}
      {tab === 'divisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Add Division</h3>
            <form onSubmit={handleAddDiv} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Division Name</label>
                <input className="form-input" placeholder="e.g. Men's Varsity" value={divForm.name} onChange={e => setDivForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sport</label>
                <select className="form-input" value={divForm.sportId} onChange={e => setDivForm(p => ({ ...p, sportId: e.target.value }))}>
                  {allSports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', minWidth: '100px' }}><PlusIcon size={16} /> Add</button>
            </form>
            {divSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {divSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {divisions.map(div => {
              const sport = allSports.find(s => s.id === div.sportId);
              return (
                <div key={div.id} className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                      {sport?.name ?? div.sportId}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{div.name}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete division "${div.name}"?`)) {
                        removeDivision(div.id);
                      }
                    }}
                    style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VENUES TAB ────────────────────────────────────────────────────── */}
      {tab === 'venues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Add Venue</h3>
            <form onSubmit={handleAddVenue} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Venue Name</label>
                <input className="form-input" placeholder="e.g. Main Arena Court 3" value={venueForm.name} onChange={e => setVenueForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Capacity</label>
                <input className="form-input" type="number" placeholder="300" value={venueForm.capacity} onChange={e => setVenueForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Location</label>
                <select
                  className="form-input"
                  value={isCustomLocation ? '__custom__' : venueForm.location}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setIsCustomLocation(true);
                      setVenueForm(p => ({ ...p, location: '' }));
                    } else {
                      setIsCustomLocation(false);
                      setVenueForm(p => ({ ...p, location: e.target.value }));
                    }
                  }}
                >
                  {locationOptions.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                  <option value="__custom__">+ Other (Enter Custom Location)...</option>
                </select>
                {isCustomLocation && (
                  <input
                    className="form-input"
                    style={{ marginTop: '8px' }}
                    placeholder="e.g. Main Gymnasium"
                    value={venueForm.location}
                    onChange={e => setVenueForm(p => ({ ...p, location: e.target.value }))}
                    required
                    autoFocus
                  />
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', minWidth: '100px' }}><PlusIcon size={16} /> Add</button>
            </form>
            {venueSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {venueSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {venues.map(v => (
              <div key={v.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPinIcon size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{v.name}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete venue "${v.name}"?`)) {
                        removeVenue(v.id);
                      }
                    }}
                    style={{ fontSize: '11px', padding: '2px 8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPinIcon size={12} color="var(--accent)" />
                  <span>{v.location}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <UsersIcon size={12} color="var(--text-muted)" />
                  <span>Capacity: {v.capacity.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS TAB ───────────────────────────────────────────────── */}
      {tab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Add Department</h3>
            <form onSubmit={handleAddDept} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full Name</label>
                <input className="form-input" placeholder="e.g. College of Nursing" value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Short Name</label>
                <input className="form-input" placeholder="CON" value={deptForm.shortName} onChange={e => setDeptForm(p => ({ ...p, shortName: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Color</label>
                <input type="color" className="form-input" style={{ padding: '6px', height: '42px' }} value={deptForm.color} onChange={e => setDeptForm(p => ({ ...p, color: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', minWidth: '100px' }}><PlusIcon size={16} /> Add</button>
            </form>
            {deptSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {deptSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {departments.map(dept => (
              <div key={dept.id} className="glass-card" style={{ padding: '16px', borderLeft: `4px solid ${dept.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${dept.color}30`, border: `1px solid ${dept.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: dept.color }}>
                    {dept.shortName}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{dept.name}</div>
                    <div style={{ fontSize: '11px', color: dept.color, fontWeight: 700, marginTop: '2px' }}>{dept.shortName}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (window.confirm(`Delete department "${dept.name}"?`)) {
                      removeDepartment(dept.id);
                    }
                  }}
                  style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ────────────────────────────────────────────────────── */}
      {tab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Create event form (fused with automatic bracket generation) */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', marginBottom: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={20} color="var(--accent)" /> Create Tournament Event &amp; Auto-Generate Bracket
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Creating an event automatically creates its tournament bracket structure and places registered teams for that sport into Round 1 (Quarter-Finals). Scorekeepers control all match advancement.
            </p>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileTextIcon size={13} color="var(--accent)" /> Event Name
                  </label>
                  <input className="form-input" placeholder="Asian College Padula 2026" value={eventForm.name} onChange={e => setEventForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AwardIcon size={13} color="var(--accent)" /> Category Label
                  </label>
                  <input className="form-input" placeholder="e.g. Men's Varsity Basketball" value={eventForm.category} onChange={e => setEventForm(p => ({ ...p, category: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrophyIcon size={13} color="var(--accent)" /> Sport
                  </label>
                  <select className="form-input" value={eventForm.sport} onChange={e => setEventForm(p => ({ ...p, sport: e.target.value }))}>
                    {allSports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayersIcon size={13} color="var(--accent)" /> Division
                  </label>
                  <select className="form-input" value={eventForm.division} onChange={e => setEventForm(p => ({ ...p, division: e.target.value }))}>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrophyIcon size={13} color="var(--accent)" /> Game / Tournament Format
                  </label>
                  <select
                    className="form-input"
                    value={eventForm.format}
                    onChange={e => setEventForm(p => ({ ...p, format: e.target.value as 'single_elimination' | 'round_robin' }))}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="single_elimination">Single Elimination (Knockout Bracket)</option>
                    <option value="round_robin">Round Robin (Every Team Plays Every Team)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPinIcon size={13} color="var(--accent)" /> Event Place (Venue / Court)
                  </label>
                  <select
                    className="form-input"
                    value={eventForm.venue || venues[0]?.name || ''}
                    onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))}
                    style={{ fontWeight: 600 }}
                    required
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>
                        {v.name} — {v.location} (Capacity: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={13} color="var(--accent)" /> Start Date
                  </label>
                  <input type="date" className="form-input" value={eventForm.startDate} onChange={e => setEventForm(p => ({ ...p, startDate: e.target.value, dates: `${e.target.value} – ${p.endDate}` }))} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={13} color="var(--accent)" /> Start Time (Event Opens)
                  </label>
                  <input type="time" className="form-input" value={eventForm.startTime} onChange={e => setEventForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={13} color="var(--accent)" /> End Date
                  </label>
                  <input type="date" className="form-input" value={eventForm.endDate} onChange={e => setEventForm(p => ({ ...p, endDate: e.target.value, dates: `${p.startDate} – ${e.target.value}` }))} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={13} color="var(--accent)" /> End Time (Event Concludes)
                  </label>
                  <input type="time" className="form-input" value={eventForm.endTime} onChange={e => setEventForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>

              {/* Preview of registered teams & format for the selected sport */}
              {(() => {
                const sportTeams = teams.filter(t => t.isActive !== false && t.sport === eventForm.sport);
                const selectedSportObj = allSports.find(s => s.id === eventForm.sport);
                const selectedVenueObj = venues.find(v => v.name === (eventForm.venue || venues[0]?.name));
                const isRR = eventForm.format === 'round_robin';
                return (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ZapIcon size={14} color="var(--accent)" /> Automatic {isRR ? 'Round Robin Schedule' : 'Single Elimination Bracket'} ({selectedSportObj?.name || eventForm.sport}):
                      </strong>{' '}
                      {isRR
                        ? (sportTeams.length >= 2
                            ? `All ${sportTeams.length} registered teams (${sportTeams.map(t => t.name).join(', ')}) will be paired so every team plays every other team across ${sportTeams.length % 2 === 0 ? sportTeams.length - 1 : sportTeams.length} rounds.`
                            : 'A Round Robin schedule will be initialized and automatically updated as teams register.')
                        : (sportTeams.length > 0
                            ? `${sportTeams.length} registered team${sportTeams.length === 1 ? '' : 's'} (${sportTeams.map(t => t.name).join(', ')}) will be placed into Round 1 automatically.`
                            : 'An 8-team Quarter-Finals → Semi-Finals → Championship Final bracket will be created immediately (teams registered later are placed into open Round 1 TBD slots automatically).')}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <MapPinIcon size={13} color="var(--accent)" />
                        Event Place: <strong style={{ color: 'var(--text-primary)' }}>{selectedVenueObj ? `${selectedVenueObj.name} (${selectedVenueObj.location})` : (eventForm.venue || 'Main Arena Court 1')}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <CalendarIcon size={13} color="var(--accent)" />
                        Dates: <strong style={{ color: 'var(--text-primary)' }}>{eventForm.startDate} ({formatTime12h(eventForm.startTime)}) – {eventForm.endDate} ({formatTime12h(eventForm.endTime)})</strong>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {eventSuccess && (
                <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckIcon size={14} color="#34d399" /> {eventSuccess}
                  </span>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setActiveView('bracket')}>
                    View Live Bracket ↗
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary">
                  <PlusIcon size={16} /> Create Event &amp; Auto-Generate Bracket
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveView('bracket')}>
                  Open Brackets Page ↗
                </button>
              </div>
            </form>
          </div>

          {/* Events list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {events.map(ev => {
              const sport = allSports.find(s => s.id === ev.sport);
              const evMatches = matches.filter(m => m.eventId === ev.id || m.sport === ev.sport);
              const venueObj = venues.find(v => v.name === ev.venue);
              const isRR = ev.format === 'round_robin' || evMatches.some(m => m.format === 'round_robin');
              const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                draft: { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
                published: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
                ongoing: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
                completed: { bg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
              };
              const statusStyle = statusColors[ev.status] || statusColors.draft;

              return (
                <div
                  key={ev.id}
                  className="glass-card"
                  style={{
                    padding: '20px 24px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: statusStyle.text,
                          background: statusStyle.bg,
                          padding: '3px 9px',
                          borderRadius: '8px',
                          border: `1px solid ${statusStyle.border}`,
                          textTransform: 'uppercase',
                        }}>
                          {ev.status}
                        </span>

                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          background: 'var(--accent-light)',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          border: '1px solid var(--accent-border)',
                        }}>
                          {getSportIcon(ev.sport, 13, 'var(--accent)')}
                          <span>{sport?.name || getSportName(ev.sport)}</span>
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isRR ? '#0284c7' : '#d97706',
                          background: isRR ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.12)',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          border: `1px solid ${isRR ? 'rgba(56,189,248,0.25)' : 'rgba(245,158,11,0.25)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {isRR ? <RefreshIcon size={11} color="#0284c7" /> : <TrophyIcon size={11} color="#d97706" />}
                          <span>{isRR ? 'Round Robin' : 'Single Elimination'}</span>
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#059669',
                          background: 'rgba(16,185,129,0.12)',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          border: '1px solid rgba(16,185,129,0.25)',
                        }}>
                          {evMatches.length} Matches Scheduled
                        </span>

                        {ev.archived && (
                          <span style={{
                            fontSize: '10.5px',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: 700,
                          }}>
                            ARCHIVED
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h4 style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                        {ev.name}
                      </h4>

                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {sport?.name ?? ev.sport} · {ev.category || 'Varsity Championship'} {ev.dates ? `· ${ev.dates}` : ''}
                      </div>

                      {/* Metadata Chips (Schedule & Venue) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {(ev.startTime || ev.endTime || ev.startDate || ev.endDate) && (
                          <div style={{
                            fontSize: '11.5px',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                          }}>
                            <ClockIcon size={12} color="var(--accent)" />
                            <span>Starts: {ev.startDate || 'TBA'} {ev.startTime ? `(${formatTime12h(ev.startTime)})` : ''} · Ends: {ev.endDate || 'TBA'} {ev.endTime ? `(${formatTime12h(ev.endTime)})` : ''}</span>
                          </div>
                        )}

                        <div style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                        }}>
                          <MapPinIcon size={12} color="var(--accent)" />
                          <span><strong>Event Place:</strong> {ev.venue || 'Main Arena Court 1'}{venueObj ? ` (${venueObj.location} · Cap. ${venueObj.capacity})` : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setActiveView('bracket')}>
                        View Bracket ↗
                      </button>
                      {ev.status === 'draft' && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => publishEvent(ev.id)} style={{ borderRadius: '8px' }}>Publish</button>
                      )}
                      {ev.status === 'ongoing' && (
                        <button type="button" className="btn btn-sm btn-success" onClick={() => updateEvent(ev.id, { status: 'completed' })} style={{ borderRadius: '8px' }}>Mark Completed</button>
                      )}
                      {!ev.archived && (
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => archiveEvent(ev.id)} style={{ borderRadius: '8px' }}>Archive</button>
                      )}
                      {(currentUser?.role === 'director' || currentUser?.role === 'coordinator') && evMatches.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            if (window.confirm(`Delete the tournament bracket for "${ev.name}"? All ${evMatches.length} match(es) will be removed and the bracket will be reset.`)) {
                              deleteBracket(ev.id);
                            }
                          }}
                          style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title={`Delete bracket matches for ${ev.name}`}
                        >
                          <TrashIcon size={12} color="#f87171" />
                          <span>Delete Bracket</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          if (window.confirm(`Delete event "${ev.name}" and its bracket matches?`)) {
                            deleteEvent(ev.id);
                          }
                        }}
                        style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)', borderRadius: '8px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

