import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon } from '../components/Icons';
import TournamentTreeBracket from '../components/TournamentTreeBracket';

function ConflictWarning({ warning }: { warning: string }) {
  return (
    <div style={{
      background: 'var(--badge-warn-bg)', border: '1px solid var(--badge-warn-border)',
      borderRadius: '6px', padding: '6px 10px',
      fontSize: '12px', color: 'var(--badge-warn-text)', fontWeight: 500,
    }}>
      ⚠️ {warning}
    </div>
  );
}

function BracketMatchCard({ match, onAssignVenue, venues }: {
  match: { id: string; teamA: string; teamB: string; scoreA: number; scoreB: number; status: string; round: string; venue: string; scheduledTime?: string; winner?: string; conflictWarning?: string; };
  onAssignVenue: (matchId: string, venue: string) => void;
  venues: { id: string; name: string }[];
}) {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isTBD = match.teamA.startsWith('Winner') || match.teamB.startsWith('Winner');

  return (
    <div className="glass-card" style={{
      padding: '14px 16px',
      opacity: isTBD ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{match.round}</span>
        <span className={`status-badge ${match.status}`}>
          {isLive && <span className="live-dot" />}
          {match.status.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: match.winner === match.teamA ? 700 : 500,
            fontSize: '13px',
            color: match.winner === match.teamA ? 'var(--accent)' : 'inherit',
          }}>
            {match.teamA}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)',
        }}>
          <span>{match.scoreA}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>–</span>
          <span>{match.scoreB}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{
            fontWeight: match.winner === match.teamB ? 700 : 500,
            fontSize: '13px',
            color: match.winner === match.teamB ? 'var(--accent)' : 'inherit',
          }}>
            {match.teamB}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPinIcon size={12} /> {match.venue}
        </div>
      </div>

      {!isFinished && !isTBD && (
        <div style={{ marginTop: '8px' }}>
          <select
            className="form-input"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            value={match.venue}
            onChange={e => onAssignVenue(match.id, e.target.value)}
          >
            {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          </select>
        </div>
      )}

      {match.conflictWarning && <ConflictWarning warning={match.conflictWarning} />}
    </div>
  );
}

export default function BracketPage() {
  const { events, matches, venues, assignMatchOfficials, startMatch } = useApp();
  const [selectedEvent] = useState(events[0]?.id ?? '');
  const [bracketStyle, setBracketStyle] = useState<'symmetrical' | 'column'>('symmetrical');
  const [tab, setTab] = useState<'bracket' | 'standings' | 'schedule'>('bracket');
  const { computeStandings } = useApp();

  const event = events.find(e => e.id === selectedEvent);
  const eventMatches = event ? event.bracket : matches;

  const roundGroups = eventMatches.reduce<Record<number, typeof eventMatches>>((acc, m) => {
    const rn = m.roundNumber ?? 1;
    if (!acc[rn]) acc[rn] = [];
    acc[rn].push(m);
    return acc;
  }, {});

  const roundNames: Record<number, string> = { 1: 'Quarter-Finals', 2: 'Semi-Finals', 3: 'Championship Final' };

  const handleVenueAssign = (matchId: string, venue: string) => {
    const matchToUpdate = matches.find(m => m.id === matchId);
    const conflictMatch = matches.find(m =>
      m.id !== matchId &&
      m.venue === venue &&
      m.scheduledTime === matchToUpdate?.scheduledTime &&
      m.status !== 'finished'
    );
    if (conflictMatch) {
      alert(`⚠️ Venue conflict! "${venue}" is already assigned to ${conflictMatch.teamA} vs ${conflictMatch.teamB} at the same time.`);
      return;
    }
    assignMatchOfficials(matchId, {});
  };

  const sport = event?.sport ?? 's1';
  const standings = computeStandings(sport);
  const conflicts = eventMatches.filter(m => m.conflictWarning);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Tournament Generation</div>
          <h1 className="page-title">Brackets & Scheduling</h1>
          <p className="page-desc">Single-elimination tree, automated pairings, and conflict warnings</p>
        </div>
        <div className="stats-row">
          <div className="mini-stat glass-card"><span className="mini-val">{eventMatches.length}</span><span className="mini-lbl">Matches</span></div>
          <div className="mini-stat glass-card"><span className="mini-val" style={{ color: conflicts.length ? 'var(--badge-warn-text)' : 'inherit' }}>{conflicts.length}</span><span className="mini-lbl">Conflicts</span></div>
        </div>
      </div>


      {/* Sub tabs & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['bracket', 'schedule', 'standings'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
              {t === 'bracket' ? 'Bracket View' : t === 'schedule' ? 'Matches' : 'Standings'}
            </button>
          ))}
        </div>

        {tab === 'bracket' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className={`btn btn-sm ${bracketStyle === 'symmetrical' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setBracketStyle('symmetrical')}
            >
              Symmetrical Tree
            </button>
            <button 
              className={`btn btn-sm ${bracketStyle === 'column' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setBracketStyle('column')}
            >
              Columns
            </button>
          </div>
        )}
      </div>

      {/* View Content */}
      {tab === 'bracket' && (
        bracketStyle === 'symmetrical' ? (
          <TournamentTreeBracket initialSportId={sport} showSportSelector={true} />
        ) : (
          <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '12px' }}>
            {Object.entries(roundGroups).sort((a, b) => Number(a[0]) - Number(b[0])).map(([roundNum, roundMatches]) => (
              <div key={roundNum} style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 0',
                }}>
                  {roundNames[Number(roundNum)] ?? `Round ${roundNum}`}
                </div>
                {roundMatches.map(m => (
                  <BracketMatchCard
                    key={m.id} match={m}
                    onAssignVenue={handleVenueAssign}
                    venues={venues}
                  />
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'schedule' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header" style={{ gridTemplateColumns: '1fr 2fr 100px 140px 100px' }}>
            <span>Round</span><span>Matchup</span><span>Score</span><span>Venue</span><span>Status</span>
          </div>
          {eventMatches.map(m => (
            <div key={m.id} className="table-row" style={{ gridTemplateColumns: '1fr 2fr 100px 140px 100px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.round}</span>
              <span style={{ fontWeight: 600 }}>{m.teamA} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.teamB}</span>
              <span style={{ fontWeight: 700 }}>{m.scoreA}–{m.scoreB}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.venue}</span>
              <span>
                {m.status === 'scheduled' ? (
                  <button className="btn btn-sm btn-ghost" onClick={() => startMatch(m.id)}>Start</button>
                ) : (
                  <span className={`status-badge ${m.status}`}>{m.status.toUpperCase()}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'standings' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header" style={{ gridTemplateColumns: '40px 2fr 60px 60px 60px 80px 80px' }}>
            <span>#</span><span>Team</span><span>P</span><span>W</span><span>L</span><span>PF</span><span>Win%</span>
          </div>
          {standings.map((row, idx) => (
            <div key={row.teamId} className="table-row" style={{ gridTemplateColumns: '40px 2fr 60px 60px 60px 80px 80px' }}>
              <span style={{ fontWeight: 700, color: idx === 0 ? 'var(--accent)' : 'inherit' }}>{idx + 1}</span>
              <span><strong>{row.teamName}</strong> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({row.department})</span></span>
              <span>{row.played}</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{row.won}</span>
              <span style={{ color: '#ef4444' }}>{row.lost}</span>
              <span>{row.pointsFor}</span>
              <span style={{ fontWeight: 600 }}>{(row.winPct * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
