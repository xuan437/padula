import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import {
  getSportFoulRules,
  getPlayerTotalFouls,
  getPlayerFoulBreakdown,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { SportFilter } from '../components/ui';
import { TrophyIcon, SearchIcon, XIcon } from '../components/Icons';
import type { Player } from '../types';

export default function TopScorersPage() {
  const { players, teams, departments, setActiveView } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'in_play' | 'reserved'>('all');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const sportCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of players) {
      acc[p.sport] = (acc[p.sport] || 0) + 1;
    }
    return acc;
  }, [players]);

  // Compute leaderboard
  const leaderboard = useMemo(() => {
    return players
      .filter(p => {
        if (selectedSport !== 'all' && p.sport !== selectedSport) return false;
        if (rosterFilter !== 'all' && getPlayerRosterStatus(p) !== rosterFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchTeam = (teams.find(t => t.id === p.teamId)?.name || '').toLowerCase().includes(q);
          return matchName || matchTeam;
        }
        return true;
      })
      .map(p => {
        const team = teams.find(t => t.id === p.teamId);
        const dept = departments.find(d => d.id === p.department);
        const points = p.currentSeasonGoals ?? p.intGoals ?? 0;
        const matchesPlayed = p.intMatches ?? p.matchStats?.length ?? 0;
        const fouls = getPlayerTotalFouls(p);
        const rosterStatus = getPlayerRosterStatus(p);
        return {
          player: p,
          teamName: team?.name || 'Independent Athlete',
          deptName: dept?.shortName || dept?.name || 'Padula',
          points,
          matchesPlayed,
          fouls,
          rosterStatus,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [players, teams, departments, selectedSport, rosterFilter, search]);

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Scoring Leaders</div>
          <h1 className="page-title">Top Scorers Leaderboard</h1>
          <p className="page-desc">Ranked individual scoring leaders, goals, and match statistics across all sports</p>
        </div>
        <div className="header-badge glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrophyIcon size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700 }}>{leaderboard.length} Ranked Athletes</span>
        </div>
      </div>

      {/* Sport Filter Tabs */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <SportFilter
          value={selectedSport}
          onChange={setSelectedSport}
          counts={sportCounts}
          allLabel="All Sports"
        />
      </div>

      {/* Search & Lineup Filter Bar */}
      <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 240px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon size={14} />
          </div>
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {([
            { id: 'all', label: 'All Lineup' },
            { id: 'in_play', label: '● In Play' },
            { id: 'reserved', label: '◐ Reserved' },
          ] as const).map(f => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-sm ${rosterFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRosterFilter(f.id)}
              style={{ fontSize: '12px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '65px 2fr 1.4fr 1.1fr 110px 95px 80px 80px 100px',
          padding: '12px 16px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          alignItems: 'center',
          minWidth: '940px',
        }}>
          <span>Rank</span>
          <span>Athlete</span>
          <span>Team</span>
          <span>Sport</span>
          <span style={{ textAlign: 'center' }}>Lineup Role</span>
          <span style={{ textAlign: 'right' }}>Score / Pts</span>
          <span style={{ textAlign: 'center' }}>Fouls</span>
          <span style={{ textAlign: 'center' }}>Matches</span>
          <span style={{ textAlign: 'right' }}>Profile</span>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <TrophyIcon size={32} color="var(--text-muted)" />
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '12px', color: 'var(--text-primary)' }}>
              No scorers recorded yet
            </div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px' }}>
              Scoring data updates automatically as matches are played and scores recorded.
            </p>
          </div>
        ) : (
          leaderboard.map((item, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const rankBg = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'transparent';
            const rankColor = isTop3 ? '#fff' : 'var(--text-muted)';

            return (
              <div
                key={item.player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '65px 2fr 1.4fr 1.1fr 110px 95px 80px 80px 100px',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  alignItems: 'center',
                  fontSize: '13px',
                  transition: 'background var(--transition)',
                  minWidth: '940px',
                }}
                className="leaderboard-row"
              >
                {/* Rank Badge */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {isTop3 ? (
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: rankBg,
                      color: rankColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '12px',
                    }}>
                      {rank}
                    </span>
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '8px' }}>
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Athlete Name & Jersey */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}>
                    {item.player.name[0]}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer(item.player)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        transition: 'text-decoration-color var(--transition)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.textDecorationColor = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.textDecorationColor = 'transparent'; }}
                    >
                      {item.player.name}
                    </button>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      #{item.player.jerseyNumber} · {item.player.position || 'Athlete'}
                    </div>
                  </div>
                </div>

                {/* Team */}
                <div style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600 }}>{item.teamName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.deptName}</div>
                </div>

                {/* Sport */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  {getSportIcon(item.player.sport, 15, 'var(--accent)')}
                  <span>{getSportName(item.player.sport)}</span>
                </div>

                {/* Lineup Role */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: item.rosterStatus === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                    color: item.rosterStatus === 'in_play' ? '#10b981' : '#f59e0b',
                    border: item.rosterStatus === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.rosterStatus === 'in_play' ? '● In Play' : '◐ Reserved'}
                  </span>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: 'var(--accent)' }}>
                  {item.points}
                </div>

                {/* Fouls */}
                <div style={{ textAlign: 'center', fontWeight: 700, color: item.fouls > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {item.fouls}
                </div>

                {/* Matches Played */}
                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {item.matchesPlayed}
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setSelectedPlayer(item.player)}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    View Stats
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            background: 'var(--bg-card)',
          }}>
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XIcon size={18} />
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selectedPlayer.name[0]}
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  {selectedPlayer.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>#{selectedPlayer.jerseyNumber}</span>
                  <span>·</span>
                  <span>{selectedPlayer.position || 'Athlete'}</span>
                  <span>·</span>
                  <span>{getSportName(selectedPlayer.sport)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Season Points</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                  {selectedPlayer.currentSeasonGoals ?? selectedPlayer.intGoals ?? 0}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Lineup Status</div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: getPlayerRosterStatus(selectedPlayer) === 'in_play' ? '#10b981' : '#f59e0b', marginTop: '6px' }}>
                  {getPlayerRosterStatus(selectedPlayer) === 'in_play' ? '● In Play' : '◐ Reserved'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Fouls</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: getPlayerTotalFouls(selectedPlayer) > 0 ? '#f59e0b' : 'var(--text-primary)', marginTop: '4px' }}>
                  {getPlayerTotalFouls(selectedPlayer)}
                </div>
              </div>
            </div>

            {(() => {
              const rules = getSportFoulRules(selectedPlayer.sport);
              const breakdown = getPlayerFoulBreakdown(selectedPlayer);
              return (
                <div style={{ marginBottom: '18px', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    All Game Fouls Breakdown ({getSportName(selectedPlayer.sport)})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {rules.types.map(ft => {
                      const count = breakdown[ft.id] || 0;
                      return (
                        <span
                          key={ft.id}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: count > 0 ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-card)',
                            color: count > 0 ? '#f59e0b' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {ft.shortLabel}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedPlayer.careerHistory && selectedPlayer.careerHistory.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Career History</h4>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedPlayer.careerHistory.map((ch, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px', borderBottom: i < (selectedPlayer.careerHistory?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontWeight: 600 }}>{ch.team} ({ch.season})</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ch.goals} pts / {ch.matches} matches</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedPlayer(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedPlayer(null);
                  setActiveView('player');
                }}
              >
                View in Players Directory →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
