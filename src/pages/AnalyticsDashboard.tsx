import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import {
  PageHeader,
  StatCard,
  SportFilter,
  Tabs,
  ChartCard,
  Drawer,
} from '../components/ui';
import {
  PrinterIcon,
  SparklesIcon,
  FlameIcon,
  CheckIcon,
  UsersIcon,
  ActivityIcon,
  MedalIcon,
  StarIcon,
  MapPinIcon,
  BuildingIcon,
  SearchIcon,
} from '../components/Icons';
import type { Match, Team } from '../types';

type AnalyticsTab = 'overview' | 'teams' | 'players' | 'matches' | 'departments' | 'sports' | 'archive' | 'reports';

export default function AnalyticsDashboard({ initialTab }: { initialTab?: AnalyticsTab } = {}) {
  const {
    matches,
    teams,
    players,
    departments,
    events,
    auditLogs,
    computeMedalTally,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab || 'overview');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected drawers
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // ── Filtered Matches & Data ───────────────────────────────────────────────
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (selectedSport !== 'ALL' && m.sport !== selectedSport) return false;
      if (selectedDept !== 'all') {
        const teamAObj = teams.find(t => t.name === m.teamA);
        const teamBObj = teams.find(t => t.name === m.teamB);
        if (teamAObj?.department !== selectedDept && teamBObj?.department !== selectedDept) {
          return false;
        }
      }
      return true;
    });
  }, [matches, selectedSport, selectedDept, teams]);

  const finishedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'finished' && !m.isBye), [filteredMatches]);
  const liveMatches = useMemo(() => filteredMatches.filter(m => m.status === 'live' && !m.isBye), [filteredMatches]);
  const scheduledMatches = useMemo(() => filteredMatches.filter(m => m.status === 'scheduled' && !m.isBye), [filteredMatches]);

  const totalPointsScored = useMemo(() => finishedMatches.reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0), [finishedMatches]);
  const avgPointsPerMatch = finishedMatches.length > 0 ? (totalPointsScored / (finishedMatches.length * 2)).toFixed(1) : '0';

  // ── Team Analytics with Streaks & Form ────────────────────────────────────
  const teamAnalyticsList = useMemo(() => {
    return teams
      .filter(t => {
        if (selectedSport !== 'ALL' && t.sport !== selectedSport) return false;
        if (selectedDept !== 'all' && t.department !== selectedDept) return false;
        if (searchQuery.trim() && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .map(team => {
        const teamMatches = matches
          .filter(m => !m.isBye && (m.teamA === team.name || m.teamB === team.name))
          .sort((a, b) => new Date(a.scheduledTime || '').getTime() - new Date(b.scheduledTime || '').getTime());

        const completed = teamMatches.filter(m => m.status === 'finished');
        let wins = 0;
        let losses = 0;
        let pointsFor = 0;
        let pointsAgainst = 0;
        const form: ('W' | 'L')[] = [];

        completed.forEach(m => {
          const isA = m.teamA === team.name;
          const myScore = isA ? m.scoreA : m.scoreB;
          const oppScore = isA ? m.scoreB : m.scoreA;
          pointsFor += myScore;
          pointsAgainst += oppScore;
          if (m.winner === team.name || myScore > oppScore) {
            wins++;
            form.push('W');
          } else {
            losses++;
            form.push('L');
          }
        });

        // Compute streak
        let streak = '—';
        if (form.length > 0) {
          const lastResult = form[form.length - 1];
          let count = 0;
          for (let i = form.length - 1; i >= 0; i--) {
            if (form[i] === lastResult) count++;
            else break;
          }
          streak = `${count}${lastResult}`;
        }

        const totalGames = wins + losses;
        const winPct = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
        const diff = pointsFor - pointsAgainst;

        const nextMatch = teamMatches.find(m => m.status === 'scheduled');

        return {
          team,
          wins,
          losses,
          totalGames,
          winPct,
          pointsFor,
          pointsAgainst,
          diff,
          streak,
          last5: form.slice(-5),
          nextMatch,
        };
      })
      .sort((a, b) => b.winPct - a.winPct || b.diff - a.diff);
  }, [teams, matches, selectedSport, selectedDept, searchQuery]);

  // ── Sport-Specific Player Leaderboard ─────────────────────────────────────
  const playerAnalyticsList = useMemo(() => {
    return players
      .filter(p => {
        if (selectedSport !== 'ALL' && p.sport !== selectedSport) return false;
        if (selectedDept !== 'all' && p.department !== selectedDept) return false;
        if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .map(p => {
        const teamObj = teams.find(t => t.id === p.teamId);
        const deptObj = departments.find(d => d.id === p.department);
        return {
          player: p,
          team: teamObj,
          department: deptObj,
          stats: p.sportStats || {},
        };
      });
  }, [players, teams, departments, selectedSport, selectedDept, searchQuery]);

  // ── Department Medal & Trophy Race ────────────────────────────────────────
  const medalStandings = useMemo(() => {
    const rawTally = computeMedalTally();
    return rawTally.map((item, idx) => {
      // 5 pts for Gold, 3 for Silver, 1 for Bronze
      const points = item.gold * 5 + item.silver * 3 + item.bronze * 1;
      return {
        ...item,
        rank: idx + 1,
        points,
      };
    }).sort((a, b) => b.points - a.points || b.gold - a.gold);
  }, [computeMedalTally]);

  // ── Print Handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: 'Padula 2026', onClick: () => setActiveView('dashboard') },
          { label: 'Analytics & Reports' },
        ]}
        title="Sports Analytics"
        description="Comprehensive tournament intelligence, team box scores, athlete leaderboards, and championship race telemetry."
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setActiveView('predictions')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <SparklesIcon size={14} /> AI Predictions
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <PrinterIcon size={14} /> Print Summary
            </button>
          </div>
        }
      />

      {/* ── Universal Sports & Department Filter Bar ────────────────────────── */}
      <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Row 1: Full-width SportFilter pills */}
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <SportFilter
            value={selectedSport}
            onChange={setSelectedSport}
            includeAll={true}
            allLabel="All Sports"
          />
        </div>

        {/* Row 2: Secondary filter strip (Department & Search) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--border-light)',
        }}>
          {/* Department selector with icon badge & Reset option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: '1 1 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              height: 38,
            }}>
              <BuildingIcon size={14} color="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dept:</span>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  paddingRight: 6,
                }}
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.shortName})</option>
                ))}
              </select>
            </div>

            {(selectedSport !== 'ALL' || selectedDept !== 'all' || searchQuery.trim()) && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setSelectedSport('ALL');
                  setSelectedDept('all');
                  setSearchQuery('');
                }}
                style={{ fontSize: 11.5, padding: '4px 10px', height: 32 }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Integrated Search Input with Prefix Icon */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 320,
            flex: '1 1 240px',
          }}>
            <span style={{ position: 'absolute', left: 12, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <SearchIcon size={14} color="var(--text-muted)" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: 12.5,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
                height: 38,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  padding: 2,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <Tabs
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'teams', label: `Teams (${teamAnalyticsList.length})` },
          { id: 'players', label: `Player Stats (${playerAnalyticsList.length})` },
          { id: 'matches', label: `Match Box Scores (${finishedMatches.length})` },
          { id: 'departments', label: 'Championship Race' },
          { id: 'sports', label: 'Disciplines' },
          { id: 'reports', label: 'Print Reports' },
          { id: 'archive', label: `Archive (${events.filter(e => e.archived).length || 1})` },
        ]}
        activeId={activeTab}
        onChange={id => setActiveTab(id as AnalyticsTab)}
      />

      {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key StatCard Grid */}
          <div className="stat-grid-4">
            <StatCard
              icon={<FlameIcon size={18} color="#ef4444" />}
              value={matches.length}
              label="Total Matches"
              hint={`${liveMatches.length} live right now`}
              onClick={() => setActiveTab('matches')}
            />
            <StatCard
              icon={<CheckIcon size={18} color="#10b981" />}
              value={finishedMatches.length}
              label="Completed Results"
              hint={`${scheduledMatches.length} pending`}
              onClick={() => setActiveTab('matches')}
            />
            <StatCard
              icon={<UsersIcon size={18} color="#3b82f6" />}
              value={players.length}
              label="Rostered Athletes"
              hint={`${players.filter(p => p.medicalCleared).length} medical cleared`}
              onClick={() => setActiveTab('players')}
            />
            <StatCard
              icon={<ActivityIcon size={18} color="#f59e0b" />}
              value={totalPointsScored}
              label="Points Scored"
              hint={`~${avgPointsPerMatch} pts / side`}
            />
          </div>

          {/* Visual Analytics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Top Teams Win Pct */}
            <ChartCard title="Top Performing Teams (Win %)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teamAnalyticsList.slice(0, 6).map(({ team, wins, losses, winPct, streak }) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{team.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getSportName(team.sport)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{wins}W - {losses}L</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>{winPct}%</span>
                      <span className="badge-pill" style={{ fontSize: 10, background: streak.includes('W') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: streak.includes('W') ? '#10b981' : '#ef4444' }}>
                        {streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Department Medal Leaderboard Preview */}
            <ChartCard title="Department Championship Standings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {medalStandings.slice(0, 5).map(m => (
                  <div
                    key={m.departmentId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: m.rank === 1 ? '#eab308' : 'var(--text-muted)' }}>
                        #{m.rank}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.departmentName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MedalIcon size={12} color="#eab308" /> {m.gold}
                      </span>
                      <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MedalIcon size={12} color="#94a3b8" /> {m.silver}
                      </span>
                      <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MedalIcon size={12} color="#b45309" /> {m.bronze}
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, paddingLeft: 6, borderLeft: '1px solid var(--border)' }}>
                        {m.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── TAB 2: TEAMS (Deep Analytics & Roster) ───────────────────────────── */}
      {activeTab === 'teams' && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Collegiate Team Performance Matrix</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click any team to inspect roster &amp; match history</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Name</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sport</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Record</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Win %</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>PF</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>PA</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Diff</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Streak</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Last 5</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {teamAnalyticsList.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No teams match current filters.
                    </td>
                  </tr>
                ) : (
                  teamAnalyticsList.map(({ team, wins, losses, winPct, pointsFor, pointsAgainst, diff, streak, last5 }, idx) => (
                    <tr
                      key={team.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setSelectedTeam(team)}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: team.color || 'var(--accent)' }} />
                          {team.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{getSportName(team.sport)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{wins} - {losses}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: winPct >= 50 ? '#10b981' : '#ef4444' }}>{winPct}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pointsFor}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pointsAgainst}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: diff >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span className="badge-pill" style={{ fontSize: 10, background: streak.includes('W') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: streak.includes('W') ? '#10b981' : '#ef4444' }}>
                          {streak}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {last5.map((res, i) => (
                            <span
                              key={i}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 9,
                                fontWeight: 800,
                                background: res === 'W' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                color: res === 'W' ? '#10b981' : '#ef4444',
                              }}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeam(team);
                          }}
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          Profile →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PLAYERS (Sport-Specific Stat Matrix) ───────────────────────── */}
      {activeTab === 'players' && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Discipline-Specific Athlete Leaderboard</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Track points, kills, goals, K/D/A, aces, smashes, and medical clearance
              </p>
            </div>
            <span className="badge-pill" style={{ background: 'var(--bg-elevated)', fontSize: 11 }}>
              {playerAnalyticsList.length} athletes
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Athlete</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team / Dept</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sport</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Position / #</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Metric 1</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Metric 2</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Metric 3</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Medical</th>
                </tr>
              </thead>
              <tbody>
                {playerAnalyticsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No players match current criteria.
                    </td>
                  </tr>
                ) : (
                  playerAnalyticsList.map(({ player, team, department, stats }) => {
                    // Sport-specific column rendering using flat SportSpecificStats fields
                    let m1 = '—', m2 = '—', m3 = '—';
                    if (stats.points !== undefined) {
                      m1 = `${stats.points} PTS`;
                      m2 = `${stats.rebounds ?? 0} REB`;
                      m3 = `${stats.assists ?? 0} AST`;
                    } else if (stats.kills !== undefined) {
                      m1 = `${stats.kills} Kills`;
                      m2 = `${stats.aces ?? 0} Aces`;
                      m3 = `${stats.digs ?? 0} Digs`;
                    } else if (stats.goals !== undefined) {
                      m1 = `${stats.goals} Goals`;
                      m2 = `${stats.assists ?? 0} Assists`;
                      m3 = `${stats.yellowCards ?? 0} YC / ${stats.redCards ?? 0} RC`;
                    } else if (stats.esportKills !== undefined) {
                      m1 = `${stats.esportKills}/${stats.deaths ?? 0}/${stats.esportAssists ?? 0} KDA`;
                      m2 = `${stats.objectives ?? 0} Obj`;
                      m3 = `${stats.acs ?? 0} ACS`;
                    } else if (stats.setsWon !== undefined) {
                      m1 = `${stats.setsWon} Sets`;
                      m2 = `${stats.smashes ?? 0} Smashes`;
                      m3 = `${stats.turnovers ?? 0} TO`;
                    } else if (stats.wins !== undefined) {
                      m1 = `${stats.wins} Wins`;
                      m2 = `${stats.eloRating ?? 1500} Elo`;
                      m3 = `${stats.draws ?? 0} Draws`;
                    }

                    return (
                      <tr key={player.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {player.name}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {team?.name || 'Unassigned'} · {department?.shortName || ''}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {getSportName(player.sport)}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {player.position || 'Player'} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent)' }}>{m1}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{m2}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{m3}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            className="badge-pill"
                            style={{
                              fontSize: 10,
                              background: player.medicalCleared ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: player.medicalCleared ? '#10b981' : '#ef4444',
                            }}
                          >
                            {player.medicalCleared ? 'Cleared' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: MATCHES (Box Scores & Periods) ────────────────────────────── */}
      {activeTab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {filteredMatches.map(match => {
              const isLive = match.status === 'live';
              const isFinished = match.status === 'finished';
              return (
                <div
                  key={match.id}
                  className="glass-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    border: isLive ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
                  }}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {getSportName(match.sport)} · {match.round}
                    </span>
                    <span
                      className="badge-pill"
                      style={{
                        fontSize: 10,
                        background: isLive ? 'rgba(239,68,68,0.15)' : isFinished ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                        color: isLive ? '#ef4444' : isFinished ? '#10b981' : 'var(--text-muted)',
                      }}
                    >
                      {isLive ? '● LIVE' : isFinished ? 'FINAL' : 'SCHEDULED'}
                    </span>
                  </div>

                  {/* Score Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: match.winner === match.teamA ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {match.teamA}
                      </div>
                    </div>
                    <div style={{ padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontWeight: 900, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
                      {match.scoreA} – {match.scoreB}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: match.winner === match.teamB ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {match.teamB}
                      </div>
                    </div>
                  </div>

                  {/* Period breakdown chips */}
                  {match.periodScores && match.periodScores.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                      {match.periodScores.map((ps, i) => (
                        <span key={i} style={{ fontSize: 10, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                          {ps.label}: {ps.scoreA}-{ps.scoreB}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPinIcon size={12} color="var(--text-muted)" /> {match.venue || 'Main Court'}
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Inspect Box Score →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: DEPARTMENTS (Trophy Race) ─────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Overall Tournament Championship Race</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Weighted formula: Gold (5 pts), Silver (3 pts), Bronze (1 pt). Department with highest aggregate points wins the Padula Trophy.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>RANK</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>COLLEGE / DEPARTMENT</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MedalIcon size={12} color="#eab308" /> GOLD</span>
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MedalIcon size={12} color="#94a3b8" /> SILVER</span>
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MedalIcon size={12} color="#b45309" /> BRONZE</span>
                  </th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>CHAMPIONSHIP POINTS</th>
                </tr>
              </thead>
              <tbody>
                {medalStandings.map(row => (
                  <tr key={row.departmentId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: row.rank === 1 ? '#eab308' : 'var(--text-muted)' }}>
                      #{row.rank}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {row.departmentName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#eab308' }}>
                      {row.gold}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>
                      {row.silver}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#b45309' }}>
                      {row.bronze}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--accent)' }}>
                      {row.points} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 6: SPORTS (All 12 Official Disciplines) ──────────────────────── */}
      {activeTab === 'sports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {SPORTS_CATALOG.map(sp => {
            const sportTeams = teams.filter(t => t.sport === sp.id);
            const sportMatches = matches.filter(m => m.sport === sp.id && !m.isBye);
            const finishedCount = sportMatches.filter(m => m.status === 'finished').length;
            const pct = sportMatches.length > 0 ? Math.round((finishedCount / sportMatches.length) * 100) : 0;

            return (
              <div key={sp.id} className="glass-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sp.icon('var(--accent)', 20)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{sp.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sp.category}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '8px 0', color: 'var(--text-secondary)' }}>
                  <span>Teams Registered: <strong>{sportTeams.length}</strong></span>
                  <span>Matches: <strong>{sportMatches.length}</strong></span>
                </div>

                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 10 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                  {pct}% Completed
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 7: REPORTS ──────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Official Tournament Summaries &amp; Exports</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {[
              { title: 'Official Results Certificate', desc: 'All verified final match results and certified medalists' },
              { title: 'Department Medal Standings', desc: 'Breakdown of Gold, Silver, Bronze and Championship Points' },
              { title: 'Athlete Roster List', desc: `${players.length} registered student athletes with medical status` },
              { title: 'Audit Trail Activity Sheet', desc: `${auditLogs.length} logged official transactions & score corrections` },
            ].map(r => (
              <button
                key={r.title}
                className="btn btn-ghost"
                onClick={handlePrint}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  height: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{r.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{r.desc}</span>
                <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 12, fontWeight: 700 }}>Print / Export →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 8: ARCHIVE ──────────────────────────────────────────────────── */}
      {activeTab === 'archive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Padula 2025 Historical Records</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Previous season final standings, medal distributions, and tournament MVPs.
                </p>
              </div>
              <span className="badge-pill" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                Archived Season
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
              <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Championship Winner</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>BAA Falcons</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>College of Business &amp; Accountancy</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Gold Medals</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#eab308', marginTop: 4 }}>12 Golds</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Across 10 Sport Disciplines</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tournament MVP</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent)', marginTop: 4 }}>Christian Rey Gomez</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Men's Basketball (BAA)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM PROFILE DRAWER ──────────────────────────────────────────────── */}
      <Drawer
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={selectedTeam ? `${selectedTeam.name} — Team Profile` : 'Team Profile'}
      >
        {selectedTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: selectedTeam.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>
                {selectedTeam.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedTeam.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {getSportName(selectedTeam.sport)} · {departments.find(d => d.id === selectedTeam.department)?.name || 'Asian College'}
                </div>
              </div>
            </div>

            {/* Coach & Trainer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Head Coach</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedTeam.coach || 'Unassigned'}
                </div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Trainer</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedTeam.trainer || 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Athletes Roster */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                Active Roster Athletes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.filter(p => p.teamId === selectedTeam.id).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{p.position || ''} #{p.jerseyNumber || ''}</span>
                    </div>
                    <span style={{ fontSize: 10, color: p.medicalCleared ? '#10b981' : '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      {p.medicalCleared ? <><CheckIcon size={11} color="#10b981" /> Cleared</> : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── MATCH DETAIL DRAWER (Box Score) ─────────────────────────────────── */}
      <Drawer
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={selectedMatch ? `Match Box Score: ${selectedMatch.teamA} vs ${selectedMatch.teamB}` : 'Match Detail'}
      >
        {selectedMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Scoreboard Hero */}
            <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                {getSportName(selectedMatch.sport)} · {selectedMatch.round}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 800, flex: 1, textAlign: 'right' }}>{selectedMatch.teamA}</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {selectedMatch.scoreA} – {selectedMatch.scoreB}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, flex: 1, textAlign: 'left' }}>{selectedMatch.teamB}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPinIcon size={12} color="var(--text-muted)" /> {selectedMatch.venue || 'Court'}
                </span>
                <span>·</span>
                <span>Winner: <strong style={{ color: 'var(--text-primary)' }}>{selectedMatch.winner || 'TBD'}</strong></span>
              </div>
            </div>

            {/* Quarter / Period Breakdown */}
            {selectedMatch.periodScores && selectedMatch.periodScores.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Period Score Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedMatch.periodScores.length}, 1fr)`, gap: 6 }}>
                  {selectedMatch.periodScores.map((ps, idx) => (
                    <div key={idx} style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{ps.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, marginTop: 2 }}>{ps.scoreA} - {ps.scoreB}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player of the Match */}
            {selectedMatch.playerOfTheMatch && (
              <div style={{ padding: 12, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#eab308', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarIcon size={12} color="#eab308" /> Player of the Match
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedMatch.playerOfTheMatch.name} ({selectedMatch.playerOfTheMatch.team})
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedMatch.playerOfTheMatch.statLine}
                </div>
              </div>
            )}

            {/* Timeline Events */}
            {selectedMatch.timeline && selectedMatch.timeline.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Match Event Timeline
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedMatch.timeline.map((evt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent)', minWidth: 55 }}>{evt.time}</span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Team {evt.team}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{evt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
