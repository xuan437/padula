import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
  getSportFoulRules,
  getPlayerFoulBreakdown,
  getPlayerTotalFouls,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { UsersIcon } from './Icons';
import type { Match, Player, PlayerRosterStatus } from '../types';

export default function PublicMatchPlayersFoulsPanel({
  match,
  defaultOpen = false,
}: {
  match: Match;
  defaultOpen?: boolean;
}) {
  const { players, teams } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  const foulRules = useMemo(() => getSportFoulRules(match.sport), [match.sport]);

  const teamAObj = useMemo(
    () =>
      teams.find(
        t =>
          t.name.toLowerCase() === (match.teamA || '').toLowerCase() &&
          (t.sport === match.sport || getSportName(t.sport) === getSportName(match.sport))
      ) || teams.find(t => t.name.toLowerCase() === (match.teamA || '').toLowerCase()),
    [teams, match.teamA, match.sport]
  );

  const teamBObj = useMemo(
    () =>
      teams.find(
        t =>
          t.name.toLowerCase() === (match.teamB || '').toLowerCase() &&
          (t.sport === match.sport || getSportName(t.sport) === getSportName(match.sport))
      ) || teams.find(t => t.name.toLowerCase() === (match.teamB || '').toLowerCase()),
    [teams, match.teamB, match.sport]
  );

  const getTeamRoster = useCallback(
    (teamObj: typeof teamAObj, fallbackName: string): Player[] => {
      if (!teamObj && isPlaceholder(fallbackName)) return [];
      return players.filter(p => {
        if (teamObj && p.teamId === teamObj.id) return true;
        if (teamObj && (teamObj.players || []).includes(p.id)) return true;
        return false;
      });
    },
    [players]
  );

  const rosterA = useMemo(() => getTeamRoster(teamAObj, match.teamA), [getTeamRoster, teamAObj, match.teamA]);
  const rosterB = useMemo(() => getTeamRoster(teamBObj, match.teamB), [getTeamRoster, teamBObj, match.teamB]);

  const getEffectiveStatus = (p: Player): PlayerRosterStatus => {
    const matchOverride = match.playerLineupStatus?.[p.id];
    if (matchOverride) return matchOverride;
    return getPlayerRosterStatus(p);
  };

  const getEffectivePlayerFouls = (p: Player) => {
    const matchFoulRecord = match.playerMatchFouls?.[p.id];
    const seasonBreakdown = getPlayerFoulBreakdown(p);
    const seasonTotal = getPlayerTotalFouls(p);
    if (matchFoulRecord) {
      return {
        matchTotal: matchFoulRecord.total,
        seasonTotal,
        breakdown: { ...seasonBreakdown, ...matchFoulRecord.breakdown },
      };
    }
    return {
      matchTotal: seasonTotal,
      seasonTotal,
      breakdown: seasonBreakdown,
    };
  };

  const totalFoulsTeamA = useMemo(
    () => rosterA.reduce((sum, p) => sum + getEffectivePlayerFouls(p).matchTotal, 0),
    [rosterA, match.playerMatchFouls]
  );
  const totalFoulsTeamB = useMemo(
    () => rosterB.reduce((sum, p) => sum + getEffectivePlayerFouls(p).matchTotal, 0),
    [rosterB, match.playerMatchFouls]
  );

  const renderTeamColumn = (side: 'A' | 'B', teamName: string, roster: Player[], totalTeamFouls: number) => {
    const inPlayPlayers = roster.filter(p => getEffectiveStatus(p) === 'in_play');
    const reservedPlayers = roster.filter(p => getEffectiveStatus(p) === 'reserved');

    const renderPlayerCard = (p: Player, status: PlayerRosterStatus) => {
      const foulData = getEffectivePlayerFouls(p);
      const isFouledOut = Boolean(
        (foulRules.foulOutLimit && foulData.matchTotal >= foulRules.foulOutLimit) ||
          (foulData.breakdown['Red Card'] || 0) > 0 ||
          (foulData.breakdown['Red Card Penalty'] || 0) > 0 ||
          (foulData.breakdown['Fault Card (Red)'] || 0) > 0
      );
      const activeFoulTypes = Object.entries(foulData.breakdown).filter(([, count]) => count > 0);

      return (
        <div
          key={p.id}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
            border: isFouledOut
              ? '1.5px solid #ef4444'
              : status === 'in_play'
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  fontFamily: 'monospace',
                }}
              >
                #{p.jerseyNumber}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </span>
              {p.position && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({p.position})</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: status === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: status === 'in_play' ? '#10b981' : '#f59e0b',
                  border: status === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                {status === 'in_play' ? '● IN PLAY' : '◐ RESERVED'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: isFouledOut
                    ? 'rgba(239, 68, 68, 0.16)'
                    : foulData.matchTotal > 0
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'var(--bg-elevated)',
                  color: isFouledOut ? '#ef4444' : foulData.matchTotal > 0 ? '#f59e0b' : 'var(--text-muted)',
                  border: isFouledOut
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : foulData.matchTotal > 0
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : '1px solid var(--border-light)',
                }}
              >
                {foulData.matchTotal} Foul{foulData.matchTotal === 1 ? '' : 's'}
                {isFouledOut ? ` · ${foulRules.foulOutLabel || 'FOULED OUT'}` : ''}
              </span>
            </div>
          </div>

          {/* All Foul Categories Breakdown */}
          {activeFoulTypes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {activeFoulTypes.map(([fType, count]) => (
                <span
                  key={fType}
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1.5px 6px',
                    borderRadius: '4px',
                    background: fType.toLowerCase().includes('red')
                      ? 'rgba(239, 68, 68, 0.16)'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? 'rgba(245, 158, 11, 0.16)'
                      : 'rgba(56, 189, 248, 0.12)',
                    color: fType.toLowerCase().includes('red')
                      ? '#ef4444'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? '#f59e0b'
                      : '#38bdf8',
                  }}
                >
                  {fType}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '6px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-primary)' }}>
            {teamName || `Team ${side}`}
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f59e0b' }}>
            Team Fouls: {totalTeamFouls}
          </span>
        </div>

        {/* IN PLAY SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>● In Play (On Court / Active)</span>
            <span>{inPlayPlayers.length}</span>
          </div>
          {inPlayPlayers.length === 0 ? (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              No players currently marked In Play.
            </div>
          ) : (
            inPlayPlayers.map(p => renderPlayerCard(p, 'in_play'))
          )}
        </div>

        {/* RESERVED SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>◐ Reserved (Bench / Substitutes)</span>
            <span>{reservedPlayers.length}</span>
          </div>
          {reservedPlayers.length === 0 ? (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              No reserved bench players.
            </div>
          ) : (
            reservedPlayers.map(p => renderPlayerCard(p, 'reserved'))
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
      <button
        type="button"
        className="btn btn-xs btn-outline"
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%',
          justifyContent: 'space-between',
          padding: '7px 12px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <UsersIcon size={13} color="var(--accent)" />
          <span>
            Player List (In Play / Reserved) &amp; Game Fouls ({rosterA.length + rosterB.length} Athletes · Fouls: {totalFoulsTeamA}–{totalFoulsTeamB})
          </span>
        </span>
        <span>{isOpen ? 'Hide ▴' : 'View Lineup & Fouls ▾'}</span>
      </button>

      {isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {renderTeamColumn('A', match.teamA, rosterA, totalFoulsTeamA)}
          {renderTeamColumn('B', match.teamB, rosterB, totalFoulsTeamB)}
        </div>
      )}
    </div>
  );
}
