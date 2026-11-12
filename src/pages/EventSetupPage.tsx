import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPinIcon, PlusIcon,
  CheckIcon, CalendarIcon,
} from '../components/Icons';
import { SPORTS_CATALOG } from '../lib/sports';

type SetupTab = 'sports' | 'divisions' | 'venues' | 'departments' | 'events';

export default function EventSetupPage() {
  const {
    departments, divisions, venues, events,
    addDepartment, addDivision, addVenue,
    createEvent, publishEvent, archiveEvent, updateEvent,
  } = useApp();

  const [tab, setTab] = useState<SetupTab>('sports');

  // Department form
  const [deptForm, setDeptForm] = useState({ name: '', shortName: '', color: '#3b82f6' });
  const [deptSuccess, setDeptSuccess] = useState('');

  // Division form
  const [divForm, setDivForm] = useState({ name: '', sportId: 's1' });
  const [divSuccess, setDivSuccess] = useState('');

  // Venue form
  const [venueForm, setVenueForm] = useState({ name: '', capacity: '200', location: '' });
  const [venueSuccess, setVenueSuccess] = useState('');

  // Event form
  const [eventForm, setEventForm] = useState({
    name: 'Asian College Padula Intramurals 2026',
    sport: 's1', division: 'div1', category: '', venue: '',
    dates: '', startDate: '', endDate: '', status: 'draft' as const,
  });
  const [eventSuccess, setEventSuccess] = useState('');

  const tabs: { id: SetupTab; label: string; icon: string }[] = [
    { id: 'sports', label: 'Sports & Esports', icon: '🏆' },
    { id: 'divisions', label: 'Divisions', icon: '⚽' },
    { id: 'venues', label: 'Venues', icon: '📍' },
    { id: 'departments', label: 'Departments', icon: '🏫' },
    { id: 'events', label: 'Events', icon: '📅' },
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
    addVenue({ name: venueForm.name, capacity: Number(venueForm.capacity), location: venueForm.location, sports: [] });
    setVenueSuccess(`${venueForm.name} added!`);
    setVenueForm({ name: '', capacity: '200', location: '' });
    setTimeout(() => setVenueSuccess(''), 3000);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent({
      name: eventForm.name,
      sport: eventForm.sport,
      division: eventForm.division,
      category: eventForm.category,
      dates: eventForm.dates,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      venue: eventForm.venue,
      status: 'draft',
    });
    setEventSuccess('Event created successfully!');
    setTimeout(() => setEventSuccess(''), 3000);
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
        {tabs.map(t => (
          <button key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
            style={{ flex: '1 1 auto' }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── SPORTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'sports' && (
        <div>
          <h2 className="section-title">🏆 Sports & Esports Catalog</h2>
          <div className="sports-grid">
            {SPORTS_CATALOG.map(sport => (
              <div key={sport.id} className={`sport-tile ${sport.category === 'esport' ? 'esport' : ''}`} style={{ cursor: 'default' }}>
                <div className="sport-tile-icon-box">{sport.icon('#93c5fd', 24)}</div>
                <span className="sport-name">{sport.name}</span>
                <span className="sport-subtitle">{sport.rulesSummary}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700, marginTop: '4px' }}>
                  {sport.format}
                </span>
                {sport.category === 'esport' && (
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                    ESPORTS
                  </span>
                )}
              </div>
            ))}
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
      )}

      {/* ── DIVISIONS TAB ──────────────────────────────────────────────────── */}
      {tab === 'divisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Add Division</h3>
            <form onSubmit={handleAddDiv} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Division Name</label>
                <input className="form-input" placeholder="e.g. Men's Varsity" value={divForm.name} onChange={e => setDivForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sport</label>
                <select className="form-input" value={divForm.sportId} onChange={e => setDivForm(p => ({ ...p, sportId: e.target.value }))}>
                  {SPORTS_CATALOG.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary"><PlusIcon size={16} /> Add</button>
            </form>
            {divSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {divSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {divisions.map(div => {
              const sport = SPORTS_CATALOG.find(s => s.id === div.sportId);
              return (
                <div key={div.id} className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    {sport?.name ?? div.sportId}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{div.name}</div>
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
            <form onSubmit={handleAddVenue} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
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
                <input className="form-input" placeholder="e.g. Main Gymnasium" value={venueForm.location} onChange={e => setVenueForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary"><PlusIcon size={16} /> Add</button>
            </form>
            {venueSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {venueSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {venues.map(v => (
              <div key={v.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPinIcon size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{v.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {v.location}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>👥 Capacity: {v.capacity.toLocaleString()}</div>
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
            <form onSubmit={handleAddDept} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px auto', gap: '12px', alignItems: 'end' }}>
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
              <button type="submit" className="btn btn-primary"><PlusIcon size={16} /> Add</button>
            </form>
            {deptSuccess && <div style={{ marginTop: '12px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}><CheckIcon size={14} color="#34d399" /> {deptSuccess}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {departments.map(dept => (
              <div key={dept.id} className="glass-card" style={{ padding: '16px', borderLeft: `4px solid ${dept.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${dept.color}30`, border: `1px solid ${dept.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: dept.color }}>
                    {dept.shortName}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{dept.name}</div>
                    <div style={{ fontSize: '11px', color: dept.color, fontWeight: 700, marginTop: '2px' }}>{dept.shortName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ────────────────────────────────────────────────────── */}
      {tab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Create event form */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={20} color="var(--accent)" /> Create Tournament Event
            </h3>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Event Name</label>
                  <input className="form-input" placeholder="Asian College Padula Intramurals 2026" value={eventForm.name} onChange={e => setEventForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Category Label</label>
                  <input className="form-input" placeholder="e.g. Men's Varsity Basketball" value={eventForm.category} onChange={e => setEventForm(p => ({ ...p, category: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Sport</label>
                  <select className="form-input" value={eventForm.sport} onChange={e => setEventForm(p => ({ ...p, sport: e.target.value }))}>
                    {SPORTS_CATALOG.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Division</label>
                  <select className="form-input" value={eventForm.division} onChange={e => setEventForm(p => ({ ...p, division: e.target.value }))}>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" className="form-input" value={eventForm.startDate} onChange={e => setEventForm(p => ({ ...p, startDate: e.target.value, dates: `${e.target.value} – ${p.endDate}` }))} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" className="form-input" value={eventForm.endDate} onChange={e => setEventForm(p => ({ ...p, endDate: e.target.value, dates: `${p.startDate} – ${e.target.value}` }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Venue</label>
                  <select className="form-input" value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))}>
                    <option value="">Select venue...</option>
                    {venues.map(v => <option key={v.id} value={v.name}>{v.name} — {v.location}</option>)}
                  </select>
                </div>
              </div>
              {eventSuccess && <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckIcon size={14} color="#34d399" /> {eventSuccess}</div>}
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <PlusIcon size={16} /> Create Event
              </button>
            </form>
          </div>

          {/* Events list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map(ev => {
              const sport = SPORTS_CATALOG.find(s => s.id === ev.sport);
              const statusColors: Record<string, string> = {
                draft: '#94a3b8', published: '#3b82f6', ongoing: '#10b981', completed: '#a78bfa',
              };
              return (
                <div key={ev.id} className="glass-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em', color: statusColors[ev.status], background: `${statusColors[ev.status]}20`, padding: '2px 10px', borderRadius: '20px', border: `1px solid ${statusColors[ev.status]}40`, textTransform: 'uppercase' }}>
                          {ev.status}
                        </span>
                        {ev.archived && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>ARCHIVED</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{ev.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {sport?.name ?? ev.sport} · {ev.category} · {ev.dates}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPinIcon size={12} color="var(--text-muted)" /> {ev.venue}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ev.status === 'draft' && (
                        <button className="btn btn-sm btn-primary" onClick={() => publishEvent(ev.id)}>Publish</button>
                      )}
                      {ev.status === 'ongoing' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateEvent(ev.id, { status: 'completed' })}>Mark Completed</button>
                      )}
                      {!ev.archived && (
                        <button className="btn btn-sm btn-ghost" onClick={() => archiveEvent(ev.id)}>Archive</button>
                      )}
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

