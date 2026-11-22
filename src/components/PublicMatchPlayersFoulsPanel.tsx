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
      const paddedJersey = String(p.jerseyNumber || '0').padStart(2, '0');

      return (
        <div
          key={p.id}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--bg-surface)',
            border: isFouledOut
              ? '1.5px solid #ef4444'
              : status === 'in_play'
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 170px' }}>
              <span
                style={{
                  minWidth: '40px',
                  height: '30px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  background: status === 'in_play' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
                  border: status === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
                  color: status === 'in_play' ? '#059669' : 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                #{paddedJersey}
              </span>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                  {p.position || 'Varsity Athlete'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span
                style={{
                  height: '25px',
                  padding: '0 9px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  background: status === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                  color: status === 'in_play' ? '#059669' : '#d97706',
                  border: status === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                {status === 'in_play' ? '● IN PLAY' : '◐ RESERVED'}
              </span>
              <span
                style={{
                  height: '25px',
                  padding: '0 9px',
                  borderRadius: '999px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  background: isFouledOut
                    ? 'rgba(239, 68, 68, 0.16)'
                    : foulData.matchTotal > 0
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'var(--bg-elevated)',
                  color: isFouledOut ? '#ef4444' : foulData.matchTotal > 0 ? '#d97706' : 'var(--text-muted)',
                  border: isFouledOut
                    ? '1px solid rgba(239, 68, 68, 0.45)'
                    : foulData.matchTotal > 0
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid var(--border)',
                }}
              >
                {foulData.matchTotal} Foul{foulData.matchTotal === 1 ? '' : 's'}
                {isFouledOut ? ` · ${foulRules.foulOutLabel || 'FOULED OUT'}` : ''}
              </span>
            </div>
          </div>

          {/* All Foul Categories Breakdown */}
          {activeFoulTypes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                paddingTop: '6px',
                borderTop: '1px dashed var(--border-light)',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fouls:
              </span>
              {activeFoulTypes.map(([fType, count]) => (
                <span
                  key={fType}
                  style={{
                    height: '22px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: fType.toLowerCase().includes('red')
                      ? 'rgba(239, 68, 68, 0.15)'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(14, 165, 233, 0.12)',
                    color: fType.toLowerCase().includes('red')
                      ? '#ef4444'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? '#d97706'
                      : '#0284c7',
                    border: fType.toLowerCase().includes('red')
                      ? '1px solid rgba(239, 68, 68, 0.35)'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid rgba(14, 165, 233, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {fType}:&nbsp;<strong>{count}</strong>
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
          gap: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '14px',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '10px',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {teamName || `Team ${side}`}
          </div>
          <span
            style={{
              height: '26px',
              padding: '0 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#d97706',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Team Fouls: {totalTeamFouls}
          </span>
        </div>

        {/* IN PLAY SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '11px',
              fontWeight: 800,
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>● In Play (On Court / Active)</span>
            <span
              style={{
                padding: '1px 8px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                fontWeight: 900,
              }}
            >
              {inPlayPlayers.length}
            </span>
          </div>
          {inPlayPlayers.length === 0 ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '12px',
                background: 'var(--bg-surface)',
                borderRadius: '10px',
                textAlign: 'center',
                border: '1px dashed var(--border)',
              }}
            >
              No players currently marked In Play.
            </div>
          ) : (
            inPlayPlayers.map(p => renderPlayerCard(p, 'in_play'))
          )}
        </div>

        {/* RESERVED SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '11px',
              fontWeight: 800,
              color: '#d97706',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>◐ Reserved (Bench / Substitutes)</span>
            <span
              style={{
                padding: '1px 8px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.2)',
                fontWeight: 900,
              }}
            >
              {reservedPlayers.length}
            </span>
          </div>
          {reservedPlayers.length === 0 ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '12px',
                background: 'var(--bg-surface)',
                borderRadius: '10px',
                textAlign: 'center',
                border: '1px dashed var(--border)',
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
