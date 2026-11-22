import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
  getSportFoulRules,
  getPlayerFoulBreakdown,
  getPlayerTotalFouls,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { UsersIcon, XIcon } from './Icons';
import type { Match, Player, PlayerRosterStatus } from '../types';

export default function PublicMatchPlayersFoulsPanel({
  match,
  defaultOpen = false,
}: {
  match: Match;
  defaultOpen?: boolean;
}) {
  const { players, teams } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Keep defaultOpen prop accepted for compatibility while ensuring trigger opens as a modal popup
  void defaultOpen;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

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
            padding: '8px 11px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
            border: isFouledOut
              ? '1.5px solid #ef4444'
              : status === 'in_play'
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
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
                  fontSize: '12.5px',
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
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>({p.position})</span>
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
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
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
          gap: '10px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '14px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '8px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
            {teamName || `Team ${side}`}
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#f59e0b',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}
          >
            Team Fouls: {totalTeamFouls}
          </span>
        </div>

        {/* IN PLAY SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
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
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                padding: '8px 10px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
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
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                padding: '8px 10px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
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

  const modalContent = isOpen ? (
    <div
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(6, 11, 25, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.14)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getSportIcon(match.sport, 18, 'var(--accent)')}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {getSportName(match.sport)} · {match.round}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.14)',
                    color: '#38bdf8',
                  }}
                >
                  {rosterA.length + rosterB.length} Athletes · Fouls {totalFoulsTeamA}–{totalFoulsTeamB}
                </span>
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {match.teamA} ({match.scoreA}) vs {match.teamB} ({match.scoreB}) — Player List &amp; Game Fouls
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setIsOpen(false)}
            aria-label="Close Player List Popup"
            style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
          >
            <XIcon size={15} />
            <span>Close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {renderTeamColumn('A', match.teamA, rosterA, totalFoulsTeamA)}
          {renderTeamColumn('B', match.teamB, rosterB, totalFoulsTeamB)}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            Sport Foul Categories: <strong>{foulRules.types.map(t => t.shortLabel).join(' · ')}</strong>
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setIsOpen(false)}
            style={{ fontWeight: 700 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ width: '100%', marginTop: 'auto', paddingTop: '6px' }}>
      <button
        type="button"
        className="btn btn-xs btn-outline"
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          justifyContent: 'space-between',
          padding: '8px 12px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '8px',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <UsersIcon size={13} color="var(--accent)" />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Player List &amp; Game Fouls ({rosterA.length + rosterB.length} Athletes · Fouls: {totalFoulsTeamA}–{totalFoulsTeamB})
          </span>
        </span>
        <span
          style={{
            flexShrink: 0,
            color: 'var(--accent)',
            fontWeight: 800,
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}
        >
          View List ↗
        </span>
      </button>

      {typeof document !== 'undefined' && modalContent ? createPortal(modalContent, document.body) : modalContent}
    </div>
  );
}
