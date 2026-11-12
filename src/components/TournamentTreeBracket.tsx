import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import { TrophyIcon } from './Icons';
import type { Match } from '../types';

export interface BracketTeamEntry {
  name: string;
  department?: string;
  score?: number | string;
  isWinner?: boolean;
  isLive?: boolean;
  seed?: number;
}

export interface SportBracketTree {
  // Left Side (8 teams in R16 -> 4 teams in QF -> 2 teams in SF)
  leftR16: [BracketTeamEntry, BracketTeamEntry][]; // 4 pairs
  leftQF: [BracketTeamEntry, BracketTeamEntry][];  // 2 pairs
  leftSF: [BracketTeamEntry, BracketTeamEntry];   // 1 pair
  
  // Center Final
  final: {
    teamA: BracketTeamEntry;
    teamB: BracketTeamEntry;
    champion?: string;
    isLive?: boolean;
  };

  // Right Side (8 teams in R16 -> 4 teams in QF -> 2 teams in SF)
  rightR16: [BracketTeamEntry, BracketTeamEntry][]; // 4 pairs
  rightQF: [BracketTeamEntry, BracketTeamEntry][];  // 2 pairs
  rightSF: [BracketTeamEntry, BracketTeamEntry];   // 1 pair

  hasR16?: boolean;
  totalTeams?: number;
}

// Factory helper: creates an unplayed 16-team bracket structure.
// Automatic seeding & pairings only — NEVER automatically decides scores or winners!
function makeTree(
  leftR16: [BracketTeamEntry, BracketTeamEntry][],
  rightR16: [BracketTeamEntry, BracketTeamEntry][]
): SportBracketTree {
  return {
    leftR16: leftR16.map(pair => [{ name: pair[0].name, seed: pair[0].seed }, { name: pair[1].name, seed: pair[1].seed }]),
    leftQF: [
      [{ name: 'TBD' }, { name: 'TBD' }],
      [{ name: 'TBD' }, { name: 'TBD' }],
    ],
    leftSF: [
      { name: 'TBD' },
      { name: 'TBD' },
    ],
    final: {
      teamA: { name: 'TBD' },
      teamB: { name: 'TBD' },
      champion: 'To Be Decided',
      isLive: false,
    },
    rightSF: [
      { name: 'TBD' },
      { name: 'TBD' },
    ],
    rightQF: [
      [{ name: 'TBD' }, { name: 'TBD' }],
      [{ name: 'TBD' }, { name: 'TBD' }],
    ],
    rightR16: rightR16.map(pair => [{ name: pair[0].name, seed: pair[0].seed }, { name: pair[1].name, seed: pair[1].seed }]),
  };
}

// ── Complete 16-Team Bracket Seeds for Every Single Sport in Padula ──────────
const makeCleanTree = () => makeTree(
  [
    [{ name: 'TBD', seed: 1 }, { name: 'TBD', seed: 16 }],
    [{ name: 'TBD', seed: 8 }, { name: 'TBD', seed: 9 }],
    [{ name: 'TBD', seed: 5 }, { name: 'TBD', seed: 12 }],
    [{ name: 'TBD', seed: 4 }, { name: 'TBD', seed: 13 }],
  ],
  [
    [{ name: 'TBD', seed: 2 }, { name: 'TBD', seed: 15 }],
    [{ name: 'TBD', seed: 7 }, { name: 'TBD', seed: 10 }],
    [{ name: 'TBD', seed: 6 }, { name: 'TBD', seed: 11 }],
    [{ name: 'TBD', seed: 3 }, { name: 'TBD', seed: 14 }],
  ]
);

const SPORT_TREES_16: Record<string, SportBracketTree> = {
  s1: makeCleanTree(),
  s2: makeCleanTree(),
  s3: makeCleanTree(),
  s4: makeCleanTree(),
  s5: makeCleanTree(),
  s6: makeCleanTree(),
  s7: makeCleanTree(),
  s8: makeCleanTree(),
  s9: makeCleanTree(),
  s10: makeCleanTree(),
};

// ── Single Team Box Node ─────────────────────────────────────────────────────
function MatchNodeBox({
  team,
  align = 'left',
}: {
  team: BracketTeamEntry;
  align?: 'left' | 'right' | 'center';
}) {
  const isWinner = !!team.isWinner;
  const isLive = !!team.isLive;

  return (
    <div
      style={{
        background: isWinner ? 'var(--accent-light, #fef2f2)' : 'var(--bg-card, #ffffff)',
        color: isWinner ? 'var(--accent, #dc2626)' : 'var(--text-primary, #0f172a)',
        border: isWinner
          ? '1.5px solid var(--accent, #dc2626)'
          : isLive
          ? '1.5px solid #ef4444'
          : '1px solid var(--border, #e2e8f0)',
        borderRadius: '7px',
        padding: '0 8px',
        width: '136px',
        height: '34px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: isWinner ? '0 2px 6px rgba(220,38,38,0.14)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', flex: 1 }}>
        {team.seed && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', fontWeight: 800 }}>
            {team.seed}
          </span>
        )}
        <span
          style={{
            fontSize: '11px',
            fontWeight: isWinner ? 800 : 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: align,
            maxWidth: team.score !== undefined ? '80px' : '110px',
          }}
          title={team.name}
        >
          {team.name}
        </span>
      </div>

      {team.score !== undefined && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: isWinner ? 'var(--accent, #dc2626)' : 'var(--text-secondary, #64748b)',
            background: 'var(--bg-elevated, #f1f5f9)',
            padding: '1px 5px',
            borderRadius: '4px',
            flexShrink: 0,
            marginLeft: '4px',
          }}
        >
          {team.score}
        </span>
      )}

      {isLive && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 2px #fff',
          }}
          title="Live Match"
        />
      )}
    </div>
  );
}

// ── Main Symmetrical 16-Team Bracket Component ──────────────────────────────
export default function TournamentTreeBracket({
  initialSportId = 's1',
  showSportSelector = true,
}: {
  initialSportId?: string;
  showSportSelector?: boolean;
}) {
  const { matches, teams } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>(initialSportId);

  // Active sport metadata
  const sportMeta = useMemo(() => {
    return SPORTS_CATALOG.find(s => s.id === selectedSport) || SPORTS_CATALOG[0];
  }, [selectedSport]);

  // Dynamic tree with real matches blended in from the scoring desk
  const treeData = useMemo(() => {
    const rawMatches = matches.filter(
      m => m.sport === selectedSport || getSportName(m.sport).toLowerCase() === sportMeta.name.toLowerCase()
    );

    const base = SPORT_TREES_16[selectedSport] || SPORT_TREES_16['s1'];
    const sportTeams = (teams || []).filter(t => t.sport === selectedSport && t.isActive !== false);

    const maxRound = rawMatches.length > 0 ? Math.max(...rawMatches.map(m => m.roundNumber || 1)) : (sportTeams.length > 8 ? 4 : 3);
    const hasR16 = rawMatches.length > 0
      ? (rawMatches.some(m => {
          const r = (m.round || '').toLowerCase();
          return r.includes('16') || r.includes('r16');
        }) || maxRound >= 4)
      : (sportTeams.length > 8);

    // Helper: convert match to bracket pair
    const toPair = (m?: Match): [BracketTeamEntry, BracketTeamEntry] => {
      if (!m) return [{ name: 'TBD' }, { name: 'TBD' }];
      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      return [
        {
          name: m.teamA || 'TBD',
          score: (isLiv || isFin) ? m.scoreA : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === m.teamA : undefined,
        },
        {
          name: m.teamB || 'TBD',
          score: (isLiv || isFin) ? m.scoreB : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === m.teamB : undefined,
        },
      ];
    };

    const toSingle = (m?: Match, slot: 'A' | 'B' = 'A'): BracketTeamEntry => {
      if (!m) return { name: 'TBD' };
      const teamName = slot === 'A' ? m.teamA : m.teamB;
      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      const score = slot === 'A' ? m.scoreA : m.scoreB;
      return {
        name: teamName || 'TBD',
        score: (isLiv || isFin) ? score : undefined,
        isLive: isLiv,
        isWinner: isFin && m.winner ? m.winner === teamName : undefined,
      };
    };

    // Stage resolver matching scoring desk match types precisely
    const getMatchByStage = (stage: 'r16' | 'qf' | 'sf' | 'final', slot: number): Match | undefined => {
      return rawMatches.find(m => {
        const r = (m.round || '').toLowerCase().trim();
        if (stage === 'r16') {
          if (r.includes('16') || r.includes('r16')) return (m.slot ?? 1) === slot;
          if (maxRound >= 4 && m.roundNumber === 1) return (m.slot ?? 1) === slot;
          return false;
        }
        if (stage === 'qf') {
          if (r.includes('quarter') || r.includes('qf')) return (m.slot ?? 1) === slot;
          if (maxRound >= 4 && m.roundNumber === 2) return (m.slot ?? 1) === slot;
          if (maxRound === 3 && m.roundNumber === 1) return (m.slot ?? 1) === slot;
          return false;
        }
        if (stage === 'sf') {
          if (r.includes('semi') || r.includes('sf')) return (m.slot ?? 1) === slot;
          if (maxRound >= 4 && m.roundNumber === 3) return (m.slot ?? 1) === slot;
          if (maxRound === 3 && m.roundNumber === 2) return (m.slot ?? 1) === slot;
          if (maxRound === 2 && m.roundNumber === 1) return (m.slot ?? 1) === slot;
          return false;
        }
        if (stage === 'final') {
          if (r.includes('championship') || r.includes('gold') || r === 'final' || r === 'finals') {
            if (!r.includes('quarter') && !r.includes('semi')) return true;
          }
          if (m.roundNumber === maxRound) return true;
          return false;
        }
        return false;
      });
    };

    let leftR16: [BracketTeamEntry, BracketTeamEntry][] = base.leftR16;
    let rightR16: [BracketTeamEntry, BracketTeamEntry][] = base.rightR16;
    let leftQF: [BracketTeamEntry, BracketTeamEntry][] = base.leftQF;
    let rightQF: [BracketTeamEntry, BracketTeamEntry][] = base.rightQF;
    let leftSF: [BracketTeamEntry, BracketTeamEntry] = [base.leftSF[0], base.leftSF[1]];
    let rightSF: [BracketTeamEntry, BracketTeamEntry] = [base.rightSF[0], base.rightSF[1]];

    if (rawMatches.length > 0) {
      if (hasR16) {
        // 16-team bracket: Round of 16 -> Quarter-Finals -> Semi-Finals -> Championship Final
        leftR16 = [
          toPair(getMatchByStage('r16', 1)),
          toPair(getMatchByStage('r16', 2)),
          toPair(getMatchByStage('r16', 3)),
          toPair(getMatchByStage('r16', 4)),
        ];
        rightR16 = [
          toPair(getMatchByStage('r16', 5)),
          toPair(getMatchByStage('r16', 6)),
          toPair(getMatchByStage('r16', 7)),
          toPair(getMatchByStage('r16', 8)),
        ];
        leftQF = [
          toPair(getMatchByStage('qf', 1)),
          toPair(getMatchByStage('qf', 2)),
        ];
        rightQF = [
          toPair(getMatchByStage('qf', 3)),
          toPair(getMatchByStage('qf', 4)),
        ];
        const mSF1 = getMatchByStage('sf', 1);
        const mSF2 = getMatchByStage('sf', 2);
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      } else {
        // 8-team bracket: Starts directly with Quarter-Finals (matching scoring desk)
        leftQF = [
          toPair(getMatchByStage('qf', 1)),
          toPair(getMatchByStage('qf', 2)),
        ];
        rightQF = [
          toPair(getMatchByStage('qf', 3)),
          toPair(getMatchByStage('qf', 4)),
        ];
        const mSF1 = getMatchByStage('sf', 1);
        const mSF2 = getMatchByStage('sf', 2);
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      }
    }

    // Final match
    const finalMatch = getMatchByStage('final', 1) || rawMatches.find(m => m.roundNumber === maxRound || (m.round && m.round.toLowerCase().includes('final')));
    const isFin = finalMatch?.status === 'finished';
    const isLiv = finalMatch?.status === 'live';
    const finalWinner = isFin ? finalMatch?.winner : undefined;

    const finalNode: SportBracketTree['final'] = {
      teamA: {
        name: finalMatch?.teamA || 'Winner SF 1',
        score: (isLiv || isFin) ? finalMatch?.scoreA : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalMatch?.teamA : undefined,
      },
      teamB: {
        name: finalMatch?.teamB || 'Winner SF 2',
        score: (isLiv || isFin) ? finalMatch?.scoreB : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalMatch?.teamB : undefined,
      },
      champion: isFin && finalWinner
        ? `${finalWinner} 🥇`
        : isLiv
          ? `⚡ Live (${finalMatch?.scoreA ?? 0} - ${finalMatch?.scoreB ?? 0})`
          : 'To Be Decided',
      isLive: isLiv,
    };

    return {
      leftR16,
      leftQF,
      leftSF,
      final: finalNode,
      rightSF,
      rightQF,
      rightR16,
      hasR16,
      totalTeams: hasR16 ? 16 : 8,
    };
  }, [matches, teams, selectedSport, sportMeta]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ── Sport Selector Pills for Each Game ───────────────────────────────── */}
      {showSportSelector && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Select Game to View Bracket Tree:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {SPORTS_CATALOG.map(s => {
              const isSelected = selectedSport === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedSport(s.id)}
                  style={{
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {s.icon(isSelected ? '#ffffff' : 'var(--text-muted)', 14)}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Championship Bracket Canvas Card ─────────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '24px 16px',
          overflowX: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Padula Intramurals Bracket
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sports)',
            fontSize: '22px',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '0.02em',
          }}>
            {sportMeta.name} — Championship Bracket Tree
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Single Elimination Structure · {treeData.totalTeams ?? 16} Teams ({treeData.hasR16 ? 'Round of 16 to Championship Gold' : 'Quarter-Finals to Championship Gold'})
          </p>
        </div>

        {/* ── Mathematical 1260px x 425px Canvas ────────────────────────────── */}
        <div style={{ position: 'relative', width: '1260px', height: '425px', margin: '0 auto' }}>
          
          {/* ── EXACT MATHEMATICAL SVG CONNECTOR NETWORK (ZERO MISALIGNMENT) ── */}
          <svg
            width="1260"
            height="425"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
          >
            {/* ── LEFT: R16 to QF (Only if Round of 16 exists in this tournament) ── */}
            {treeData.hasR16 && (
              <>
                {/* Pair 1 (boxes at 33 & 73 -> QF at 53) */}
                <path d="M 156 33 H 173 V 73 H 156 M 173 53 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
                <path d="M 156 127 H 173 V 167 H 156 M 173 147 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
                <path d="M 156 253 H 173 V 293 H 156 M 173 273 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
                <path d="M 156 347 H 173 V 387 H 156 M 173 367 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
              </>
            )}

            {/* ── LEFT: QF to SF ── */}
            {/* Upper QF (53 & 147 -> SF at 100) */}
            <path d="M 326 53 H 345 V 147 H 326 M 345 100 H 365" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Lower QF (273 & 367 -> SF at 320) */}
            <path d="M 326 273 H 345 V 367 H 326 M 345 320 H 365" stroke="var(--border)" strokeWidth="1.75" fill="none" />

            {/* ── LEFT: SF to Final ── */}
            {/* Left SF (100 & 320 -> Final at 210) */}
            <path d="M 501 100 H 520 V 320 H 501 M 520 210 H 540" stroke="var(--border)" strokeWidth="2" fill="none" />

            {/* ── RIGHT: Final to SF ── */}
            {/* Right SF (100 & 320 -> Final at 210) */}
            <path d="M 759 100 H 740 V 320 H 759 M 740 210 H 720" stroke="var(--border)" strokeWidth="2" fill="none" />

            {/* ── RIGHT: SF to QF ── */}
            {/* Upper QF (53 & 147 -> SF at 100) */}
            <path d="M 934 53 H 915 V 147 H 934 M 915 100 H 895" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Lower QF (273 & 367 -> SF at 320) */}
            <path d="M 934 273 H 915 V 367 H 934 M 915 320 H 895" stroke="var(--border)" strokeWidth="1.75" fill="none" />

            {/* ── RIGHT: QF to R16 (Only if Round of 16 exists in this tournament) ── */}
            {treeData.hasR16 && (
              <>
                {/* Pair 1 (boxes at 33 & 73 -> QF at 53) */}
                <path d="M 1104 33 H 1087 V 73 H 1104 M 1087 53 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
                <path d="M 1104 127 H 1087 V 167 H 1104 M 1087 147 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
                <path d="M 1104 253 H 1087 V 293 H 1104 M 1087 273 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
                <path d="M 1104 347 H 1087 V 387 H 1104 M 1087 367 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
              </>
            )}
          </svg>

          {/* ── ROUND LABELS BAR (Matches scoring desk match types precisely) ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            position: 'absolute',
            top: '-2px',
            left: 0,
            padding: treeData.hasR16 ? '0 20px' : '0 190px',
            boxSizing: 'border-box',
            zIndex: 3,
          }}>
            {treeData.hasR16 && (
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center' }}>Round of 16</span>
            )}
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginLeft: treeData.hasR16 ? '34px' : '0' }}>Quarter-Finals</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginLeft: '39px' }}>Semi-Finals</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '180px', textAlign: 'center' }}>Championship Final</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginRight: '39px' }}>Semi-Finals</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginRight: treeData.hasR16 ? '34px' : '0' }}>Quarter-Finals</span>
            {treeData.hasR16 && (
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center' }}>Round of 16</span>
            )}
          </div>

          {/* ── LEFT COLUMN 1: ROUND OF 16 (X = 20) (Rendered only if R16 exists) ── */}
          {treeData.hasR16 && (
            <>
              <div style={{ position: 'absolute', left: '20px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][1]} /></div>
              
              <div style={{ position: 'absolute', left: '20px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][1]} /></div>

              <div style={{ position: 'absolute', left: '20px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][1]} /></div>

              <div style={{ position: 'absolute', left: '20px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][1]} /></div>
            </>
          )}

          {/* ── LEFT COLUMN 2: QUARTER-FINALS (X = 190) ──────────────────────── */}
          <div style={{ position: 'absolute', left: '190px', top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][0]} /></div>
          <div style={{ position: 'absolute', left: '190px', top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][1]} /></div>

          <div style={{ position: 'absolute', left: '190px', top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][0]} /></div>
          <div style={{ position: 'absolute', left: '190px', top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][1]} /></div>

          {/* ── LEFT COLUMN 3: SEMI-FINALS (X = 365) ─────────────────────────── */}
          <div style={{ position: 'absolute', left: '365px', top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[0]} /></div>
          <div style={{ position: 'absolute', left: '365px', top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[1]} /></div>

          {/* ── CENTER: CHAMPIONSHIP FINAL & TROPHY (X = 540) ────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: '540px',
              top: '120px',
              width: '180px',
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              padding: '14px 12px',
              borderRadius: '14px',
              border: '2px solid var(--accent)',
              boxShadow: '0 8px 24px rgba(220,38,38,0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <TrophyIcon size={18} color="#eab308" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Gold Medal Final
              </span>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <MatchNodeBox team={treeData.final.teamA} align="center" />
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                VS
              </div>
              <MatchNodeBox team={treeData.final.teamB} align="center" />
            </div>

            <div style={{
              background: treeData.final.isLive
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'var(--bg-card)',
              color: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD') || treeData.final.isLive ? '#fff' : 'var(--text-muted)',
              border: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD') || treeData.final.isLive ? 'none' : '1px solid var(--border)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              boxShadow: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                ? '0 4px 14px rgba(245, 158, 11, 0.35)'
                : 'none',
            }}>
              <span>
                {treeData.final.isLive
                  ? `⚡ Live in Progress`
                  : (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                    ? `🏆 ${treeData.final.champion}`
                    : `⏳ To Be Decided`}
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN 3: SEMI-FINALS (X = 759) ────────────────────────── */}
          <div style={{ position: 'absolute', left: '759px', top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '759px', top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[1]} align="right" /></div>

          {/* ── RIGHT COLUMN 2: QUARTER-FINALS (X = 934) ─────────────────────── */}
          <div style={{ position: 'absolute', left: '934px', top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '934px', top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][1]} align="right" /></div>

          <div style={{ position: 'absolute', left: '934px', top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '934px', top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][1]} align="right" /></div>

          {/* ── RIGHT COLUMN 1: ROUND OF 16 (X = 1104) (Rendered only if R16 exists) ── */}
          {treeData.hasR16 && (
            <>
              <div style={{ position: 'absolute', left: '1104px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][1]} align="right" /></div>

              <div style={{ position: 'absolute', left: '1104px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][1]} align="right" /></div>

              <div style={{ position: 'absolute', left: '1104px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][1]} align="right" /></div>

              <div style={{ position: 'absolute', left: '1104px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][1]} align="right" /></div>
            </>
          )}

        </div>

        {/* Mobile / Narrow Screen Pan Hint */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <span>↔ Scroll horizontally to inspect full tournament bracket</span>
        </div>

      </div>

    </div>
  );
}
