import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import { TrophyIcon, TrashIcon } from './Icons';
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
  matchLabels?: {
    r16: { num: number; status?: string; isNextUp?: boolean }[];
    qf: { num: number; status?: string; isNextUp?: boolean }[];
    sf: { num: number; status?: string; isNextUp?: boolean }[];
    final: { num: number; status?: string; isNextUp?: boolean };
  };
  orderedMatches?: {
    num: number;
    id?: string;
    round: string;
    teamA: string;
    teamB: string;
    scoreA?: number;
    scoreB?: number;
    status: string;
    venue?: string;
    scheduledTime?: string;
    isNextUp?: boolean;
  }[];
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

// ── Clean Unseeded Bracket Structure for Every Sport in Padula ──────────────
const makeCleanTree = () => makeTree(
  [
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
  ],
  [
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
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

// ── Match Number Badge on Bracket Tree ───────────────────────────────────────
function MatchNumberBadge({
  num,
  status,
  isNextUp,
  left,
  top,
}: {
  num: number;
  status?: string;
  isNextUp?: boolean;
  left: number;
  top: number;
}) {
  const isLive = status === 'live';
  const isFinished = status === 'finished';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '9.5px',
        fontWeight: 900,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        background: isLive
          ? '#dc2626'
          : isNextUp
          ? '#0ea5e9'
          : isFinished
          ? 'rgba(16, 185, 129, 0.16)'
          : 'var(--bg-elevated, #1e293b)',
        color: isLive || isNextUp
          ? '#ffffff'
          : isFinished
          ? '#10b981'
          : 'var(--accent, #dc2626)',
        border: isLive
          ? '1.5px solid #fca5a5'
          : isNextUp
          ? '1.5px solid #7dd3fc'
          : isFinished
          ? '1px solid rgba(16, 185, 129, 0.45)'
          : '1px solid rgba(220, 38, 38, 0.4)',
        boxShadow: isLive
          ? '0 2px 8px rgba(220, 38, 38, 0.4)'
          : isNextUp
          ? '0 2px 8px rgba(14, 165, 233, 0.4)'
          : '0 1px 4px rgba(0,0,0,0.18)',
      }}
      title={`Match #${num}${isLive ? ' (LIVE NOW)' : isNextUp ? ' (PLAY NEXT)' : isFinished ? ' (COMPLETED)' : ''}`}
    >
      <span>Match #{num}</span>
      {isLive && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>• LIVE</span>}
      {!isLive && isNextUp && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>• NEXT</span>}
      {isFinished && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>✓</span>}
    </div>
  );
}

// ── Main Symmetrical 16-Team Bracket Component ──────────────────────────────
export default function TournamentTreeBracket({
  initialSportId = 's1',
  showSportSelector = true,
  onSportChange,
}: {
  initialSportId?: string;
  showSportSelector?: boolean;
  onSportChange?: (sportId: string) => void;
}) {
  const { matches, teams, deleteBracket, currentUser } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>(initialSportId || 's1');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSportId && initialSportId !== selectedSport) {
      setSelectedSport(initialSportId);
    }
  }, [initialSportId]);

  // Auto-center horizontal scroll viewport on the Gold Medal Final on mount / sport change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      // 1260px total canvas width; Gold Medal Final box center is X = 630px
      const targetScroll = 630 - (el.clientWidth / 2);
      if (targetScroll > 0) {
        el.scrollLeft = targetScroll;
      }
    }
  }, [selectedSport]);

  const handleSelectSport = (sportId: string) => {
    setSelectedSport(sportId);
    onSportChange?.(sportId);
  };

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

    const cleanName = (name?: string | null): string => {
      if (!name) return 'TBD';
      const trimmed = name.trim();
      if (/^(winner|tbd)/i.test(trimmed)) return 'TBD';
      return trimmed;
    };

    const getFinalizedWinner = (m?: Match): string | undefined => {
      if (!m || m.status !== 'finished' || !m.winner) return undefined;
      if (isPlaceholder(m.winner)) return undefined;
      return m.winner;
    };

    // Mutually exclusive stage classification so a Quarter-Final match NEVER falls through to Semi-Finals or Final
    const classifyStage = (m: Match): 'r16' | 'qf' | 'sf' | 'final' => {
      const r = (m.round || '').toLowerCase().trim();
      if (r.includes('16') || r.includes('r16') || r.includes('round of 16')) return 'r16';
      if (r.includes('quarter') || r.includes('qf')) return 'qf';
      if (r.includes('semi') || r.includes('sf')) return 'sf';
      if (
        r.includes('championship') ||
        r.includes('gold') ||
        r === 'final' ||
        r === 'finals' ||
        (r.includes('final') && !r.includes('quarter') && !r.includes('semi'))
      ) {
        return 'final';
      }

      // Fallback to roundNumber ONLY when m.round does not name a specific stage
      const rn = m.roundNumber ?? 1;
      if (hasR16) {
        if (rn === 1) return 'r16';
        if (rn === 2) return 'qf';
        if (rn === 3) return 'sf';
        return 'final';
      }
      if (maxRound >= 3) {
        if (rn === 1) return 'qf';
        if (rn === 2) return 'sf';
        return 'final';
      }
      if (maxRound === 2) {
        if (rn === 1) return 'sf';
        return 'final';
      }
      return 'final';
    };

    // Build deterministic 1-indexed slot maps for each stage so matches without m.slot never collide on slot 1
    const buildStageSlots = (stage: 'r16' | 'qf' | 'sf' | 'final', maxSlots: number): Record<number, Match | undefined> => {
      const stageMatches = rawMatches
        .filter(m => classifyStage(m) === stage)
        .sort((a, b) => (a.slot ?? 999) - (b.slot ?? 999) || (a.matchNumber ?? 999) - (b.matchNumber ?? 999));

      const slotMap: Record<number, Match | undefined> = {};
      const unslotted: Match[] = [];

      for (const m of stageMatches) {
        if (m.slot && m.slot >= 1 && m.slot <= maxSlots && !slotMap[m.slot]) {
          slotMap[m.slot] = m;
        } else {
          unslotted.push(m);
        }
      }

      let nextFree = 1;
      for (const m of unslotted) {
        while (nextFree <= maxSlots && slotMap[nextFree]) {
          nextFree++;
        }
        if (nextFree <= maxSlots) {
          slotMap[nextFree] = m;
          nextFree++;
        }
      }

      return slotMap;
    };

    const r16Slots = buildStageSlots('r16', 8);
    const qfSlots = buildStageSlots('qf', 4);
    const sfSlots = buildStageSlots('sf', 2);
    const finalSlots = buildStageSlots('final', 1);

    // Helper: convert match to bracket pair (strictly from the match's assigned teams; Scorekeeper decides advancement)
    const toPair = (m?: Match): [BracketTeamEntry, BracketTeamEntry] => {
      if (!m) {
        return [{ name: 'TBD' }, { name: 'TBD' }];
      }

      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      const showScore = (isLiv || isFin) && !m.isBye;

      const resolvedA = !isPlaceholder(m.teamA) ? m.teamA : cleanName(m.teamA);
      const resolvedB = !isPlaceholder(m.teamB) ? m.teamB : cleanName(m.teamB);

      return [
        {
          name: resolvedA || 'TBD',
          score: showScore ? m.scoreA : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === resolvedA : undefined,
        },
        {
          name: resolvedB || 'TBD',
          score: showScore ? m.scoreB : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === resolvedB : undefined,
        },
      ];
    };

    const toSingle = (m?: Match, slot: 'A' | 'B' = 'A'): BracketTeamEntry => {
      if (!m) {
        return { name: 'TBD' };
      }
      const rawTeam = slot === 'A' ? m.teamA : m.teamB;
      const resolvedTeam = !isPlaceholder(rawTeam) ? rawTeam : cleanName(rawTeam);
      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      const showScore = (isLiv || isFin) && !m.isBye;
      const score = slot === 'A' ? m.scoreA : m.scoreB;
      return {
        name: resolvedTeam || 'TBD',
        score: showScore ? score : undefined,
        isLive: isLiv,
        isWinner: isFin && m.winner ? m.winner === resolvedTeam : undefined,
      };
    };

    let leftR16: [BracketTeamEntry, BracketTeamEntry][] = base.leftR16;
    let rightR16: [BracketTeamEntry, BracketTeamEntry][] = base.rightR16;
    let leftQF: [BracketTeamEntry, BracketTeamEntry][] = base.leftQF;
    let rightQF: [BracketTeamEntry, BracketTeamEntry][] = base.rightQF;
    let leftSF: [BracketTeamEntry, BracketTeamEntry] = [base.leftSF[0], base.leftSF[1]];
    let rightSF: [BracketTeamEntry, BracketTeamEntry] = [base.rightSF[0], base.rightSF[1]];

    const mQF1 = qfSlots[1];
    const mQF2 = qfSlots[2];
    const mQF3 = qfSlots[3];
    const mQF4 = qfSlots[4];
    const mSF1 = sfSlots[1];
    const mSF2 = sfSlots[2];

    if (rawMatches.length > 0) {
      if (hasR16) {
        // 16-team bracket: Round of 16 -> Quarter-Finals -> Semi-Finals -> Championship Final
        leftR16 = [
          toPair(r16Slots[1]),
          toPair(r16Slots[2]),
          toPair(r16Slots[3]),
          toPair(r16Slots[4]),
        ];
        rightR16 = [
          toPair(r16Slots[5]),
          toPair(r16Slots[6]),
          toPair(r16Slots[7]),
          toPair(r16Slots[8]),
        ];
        leftQF = [
          toPair(mQF1),
          toPair(mQF2),
        ];
        rightQF = [
          toPair(mQF3),
          toPair(mQF4),
        ];
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      } else {
        // 8-team bracket: Starts directly with Quarter-Finals (matching scoring desk)
        leftQF = [
          toPair(mQF1),
          toPair(mQF2),
        ];
        rightQF = [
          toPair(mQF3),
          toPair(mQF4),
        ];
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      }
    }

    // Final match: strictly from finalSlots[1] so only Scorekeeper-advanced teams appear in the Final
    const finalMatch = finalSlots[1];
    const isFin = finalMatch?.status === 'finished';
    const isLiv = finalMatch?.status === 'live';
    const showFinalScore = Boolean((isLiv || isFin) && finalMatch && !finalMatch.isBye);
    const finalWinner = isFin ? getFinalizedWinner(finalMatch) : undefined;

    const finalTeamAName = finalMatch && !isPlaceholder(finalMatch.teamA)
      ? finalMatch.teamA
      : 'TBD';
    const finalTeamBName = finalMatch && !isPlaceholder(finalMatch.teamB)
      ? finalMatch.teamB
      : 'TBD';

    const finalNode: SportBracketTree['final'] = {
      teamA: {
        name: finalTeamAName,
        score: showFinalScore ? finalMatch?.scoreA : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalTeamAName : undefined,
      },
      teamB: {
        name: finalTeamBName,
        score: showFinalScore ? finalMatch?.scoreB : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalTeamBName : undefined,
      },
      champion: isFin && finalWinner
        ? finalWinner
        : isLiv
          ? `Live (${finalMatch?.scoreA ?? 0} - ${finalMatch?.scoreB ?? 0})`
          : 'To Be Decided',
      isLive: isLiv,
    };

    // Build deterministic match numbers and play sequence for every slot on the bracket
    const r16Nums = [1, 2, 3, 4, 5, 6, 7, 8].map(s => r16Slots[s]?.matchNumber || s);
    const qfBaseOffset = hasR16 ? 8 : 0;
    const qfNums = [1, 2, 3, 4].map(s => qfSlots[s]?.matchNumber || (qfBaseOffset + s));
    const sfBaseOffset = hasR16 ? 12 : 4;
    const sfNums = [1, 2].map(s => sfSlots[s]?.matchNumber || (sfBaseOffset + s));
    const finalNum = finalMatch?.matchNumber || (hasR16 ? 15 : 7);

    // Build ordered list of bracket matches from Match #1 to Final
    const stageList: { num: number; round: string; match?: Match }[] = [];
    if (hasR16) {
      for (let s = 1; s <= 8; s++) {
        stageList.push({ num: r16Nums[s - 1], round: 'Round of 16', match: r16Slots[s] });
      }
    }
    for (let s = 1; s <= 4; s++) {
      stageList.push({ num: qfNums[s - 1], round: 'Quarter-Finals', match: qfSlots[s] });
    }
    for (let s = 1; s <= 2; s++) {
      stageList.push({ num: sfNums[s - 1], round: 'Semi-Finals', match: sfSlots[s] });
    }
    stageList.push({ num: finalNum, round: 'Championship Final', match: finalMatch });

    stageList.sort((a, b) => a.num - b.num);

    // Determine which match is NEXT UP to play (first scheduled match in numerical order)
    const nextReadyEntry =
      stageList.find(
        item =>
          item.match &&
          item.match.status === 'scheduled' &&
          !isPlaceholder(item.match.teamA) &&
          !isPlaceholder(item.match.teamB)
      ) ||
      stageList.find(item => !item.match || item.match.status === 'scheduled');
    const nextUpMatchNum = nextReadyEntry?.num;

    const matchLabels: NonNullable<SportBracketTree['matchLabels']> = {
      r16: [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({
        num: r16Nums[s - 1],
        status: r16Slots[s]?.status,
        isNextUp: r16Nums[s - 1] === nextUpMatchNum,
      })),
      qf: [1, 2, 3, 4].map(s => ({
        num: qfNums[s - 1],
        status: qfSlots[s]?.status,
        isNextUp: qfNums[s - 1] === nextUpMatchNum,
      })),
      sf: [1, 2].map(s => ({
        num: sfNums[s - 1],
        status: sfSlots[s]?.status,
        isNextUp: sfNums[s - 1] === nextUpMatchNum,
      })),
      final: {
        num: finalNum,
        status: finalMatch?.status,
        isNextUp: finalNum === nextUpMatchNum,
      },
    };

    const orderedMatches: NonNullable<SportBracketTree['orderedMatches']> = stageList.map(item => {
      const m = item.match;
      const tA = m && !isPlaceholder(m.teamA) ? m.teamA : 'TBD';
      const tB = m && !isPlaceholder(m.teamB) ? m.teamB : 'TBD';
      return {
        num: item.num,
        id: m?.id,
        round: m?.round || item.round,
        teamA: tA,
        teamB: tB,
        scoreA: m?.scoreA,
        scoreB: m?.scoreB,
        status: m?.status || 'scheduled',
        venue: m?.venue,
        scheduledTime: m?.scheduledTime,
        isNextUp: item.num === nextUpMatchNum,
      };
    });

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
      matchLabels,
      orderedMatches,
    };
  }, [matches, teams, selectedSport, sportMeta]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    }}>
      
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
                  onClick={() => handleSelectSport(s.id)}
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
          padding: '20px 16px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header - Stays centered and fitted to viewport */}
        <div style={{ textAlign: 'center', marginBottom: '18px', padding: '0 8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Padula Tournament Bracket
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

          {(currentUser?.role === 'director' || currentUser?.role === 'coordinator') && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  if (window.confirm(`Delete the tournament bracket for ${sportMeta.name}? All scheduled matches will be permanently deleted and the bracket will be reset.`)) {
                    deleteBracket(selectedSport);
                  }
                }}
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  fontSize: '11.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                }}
                title={`Delete ${sportMeta.name} tournament bracket`}
              >
                <TrashIcon size={13} color="#ef4444" />
                <span>Delete Bracket</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Horizontal Scroll Viewport for the 1260px Bracket Tree */}
        <div
          ref={scrollContainerRef}
          className="bracket-tree-scroll-container"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '12px',
          }}
        >
          {/* ── Mathematical 1260px x 425px Canvas ────────────────────────────── */}
          <div style={{ position: 'relative', width: '1260px', minWidth: '1260px', height: '425px', margin: '0 auto' }}>
          
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
                <path d="M 156 33 H 173 V 73 H 156 M 88 53 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
                <path d="M 156 127 H 173 V 167 H 156 M 88 147 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
                <path d="M 156 253 H 173 V 293 H 156 M 88 273 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
                <path d="M 156 347 H 173 V 387 H 156 M 88 367 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
              </>
            )}

            {/* ── LEFT: QF to SF (Anchored across match badges directly to SF nodes) ── */}
            {/* Upper QF (53 & 147 -> stem at 100 through Match #1 badge to SF Upper box at 365) */}
            <path d="M 326 53 H 345 V 147 H 326 M 258 100 H 365" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Lower QF (273 & 367 -> stem at 320 through Match #2 badge to SF Lower box at 365) */}
            <path d="M 326 273 H 345 V 367 H 326 M 258 320 H 365" stroke="var(--border)" strokeWidth="1.75" fill="none" />

            {/* ── LEFT: SF to Final (Anchored across Match #5 badge directly to Championship Final at 540) ── */}
            {/* Left SF (100 & 320 -> stem at 210 through Match #5 badge to Gold Medal Final box at 540) */}
            <path d="M 501 100 H 520 V 320 H 501 M 433 210 H 540" stroke="var(--border)" strokeWidth="2" fill="none" />

            {/* ── RIGHT: Final to SF (Anchored across Match #6 badge directly to Championship Final at 720) ── */}
            {/* Right SF (100 & 320 -> stem at 210 through Match #6 badge to Gold Medal Final box at 720) */}
            <path d="M 759 100 H 740 V 320 H 759 M 827 210 H 720" stroke="var(--border)" strokeWidth="2" fill="none" />

            {/* ── RIGHT: SF to QF (Anchored across match badges directly to SF nodes) ── */}
            {/* Upper QF (53 & 147 -> stem at 100 through Match #3 badge to SF Upper box at 895) */}
            <path d="M 934 53 H 915 V 147 H 934 M 1002 100 H 895" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Lower QF (273 & 367 -> stem at 320 through Match #4 badge to SF Lower box at 895) */}
            <path d="M 934 273 H 915 V 367 H 934 M 1002 320 H 895" stroke="var(--border)" strokeWidth="1.75" fill="none" />

            {/* ── RIGHT: QF to R16 (Only if Round of 16 exists in this tournament) ── */}
            {treeData.hasR16 && (
              <>
                {/* Pair 1 (boxes at 33 & 73 -> QF at 53) */}
                <path d="M 1104 33 H 1087 V 73 H 1104 M 1172 53 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
                <path d="M 1104 127 H 1087 V 167 H 1104 M 1172 147 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
                <path d="M 1104 253 H 1087 V 293 H 1104 M 1172 273 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
                {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
                <path d="M 1104 347 H 1087 V 387 H 1104 M 1172 367 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
              </>
            )}
          </svg>

          {/* ── ROUND LABELS BAR (Mathematically aligned to each column's exact horizontal position) ── */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: 0,
            width: '100%',
            height: '20px',
            zIndex: 3,
            pointerEvents: 'none',
          }}>
            {treeData.hasR16 && (
              <span style={{ position: 'absolute', left: '20px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Round of 16
              </span>
            )}
            <span style={{ position: 'absolute', left: '190px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quarter-Finals
            </span>
            <span style={{ position: 'absolute', left: '365px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Semi-Finals
            </span>
            <span style={{ position: 'absolute', left: '540px', width: '180px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Championship Final
            </span>
            <span style={{ position: 'absolute', left: '759px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Semi-Finals
            </span>
            <span style={{ position: 'absolute', left: '934px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quarter-Finals
            </span>
            {treeData.hasR16 && (
              <span style={{ position: 'absolute', left: '1104px', width: '136px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Round of 16
              </span>
            )}
          </div>

          {/* ── LEFT COLUMN 1: ROUND OF 16 (X = 20) (Rendered only if R16 exists) ── */}
          {treeData.hasR16 && (
            <>
              <div style={{ position: 'absolute', left: '20px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][1]} /></div>
              {treeData.matchLabels?.r16[0] && <MatchNumberBadge num={treeData.matchLabels.r16[0].num} status={treeData.matchLabels.r16[0].status} isNextUp={treeData.matchLabels.r16[0].isNextUp} left={88} top={53} />}
              
              <div style={{ position: 'absolute', left: '20px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][1]} /></div>
              {treeData.matchLabels?.r16[1] && <MatchNumberBadge num={treeData.matchLabels.r16[1].num} status={treeData.matchLabels.r16[1].status} isNextUp={treeData.matchLabels.r16[1].isNextUp} left={88} top={147} />}

              <div style={{ position: 'absolute', left: '20px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][1]} /></div>
              {treeData.matchLabels?.r16[2] && <MatchNumberBadge num={treeData.matchLabels.r16[2].num} status={treeData.matchLabels.r16[2].status} isNextUp={treeData.matchLabels.r16[2].isNextUp} left={88} top={273} />}

              <div style={{ position: 'absolute', left: '20px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][0]} /></div>
              <div style={{ position: 'absolute', left: '20px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][1]} /></div>
              {treeData.matchLabels?.r16[3] && <MatchNumberBadge num={treeData.matchLabels.r16[3].num} status={treeData.matchLabels.r16[3].status} isNextUp={treeData.matchLabels.r16[3].isNextUp} left={88} top={367} />}
            </>
          )}

          {/* ── LEFT COLUMN 2: QUARTER-FINALS (X = 190) ──────────────────────── */}
          <div style={{ position: 'absolute', left: '190px', top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][0]} /></div>
          <div style={{ position: 'absolute', left: '190px', top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][1]} /></div>
          {treeData.matchLabels?.qf[0] && <MatchNumberBadge num={treeData.matchLabels.qf[0].num} status={treeData.matchLabels.qf[0].status} isNextUp={treeData.matchLabels.qf[0].isNextUp} left={258} top={100} />}

          <div style={{ position: 'absolute', left: '190px', top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][0]} /></div>
          <div style={{ position: 'absolute', left: '190px', top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][1]} /></div>
          {treeData.matchLabels?.qf[1] && <MatchNumberBadge num={treeData.matchLabels.qf[1].num} status={treeData.matchLabels.qf[1].status} isNextUp={treeData.matchLabels.qf[1].isNextUp} left={258} top={320} />}

          {/* ── LEFT COLUMN 3: SEMI-FINALS (X = 365) ─────────────────────────── */}
          <div style={{ position: 'absolute', left: '365px', top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[0]} /></div>
          <div style={{ position: 'absolute', left: '365px', top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[1]} /></div>
          {treeData.matchLabels?.sf[0] && <MatchNumberBadge num={treeData.matchLabels.sf[0].num} status={treeData.matchLabels.sf[0].status} isNextUp={treeData.matchLabels.sf[0].isNextUp} left={433} top={210} />}

          {/* ── CENTER: CHAMPIONSHIP FINAL & TROPHY (X = 540) ────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: '540px',
              top: '112px',
              width: '180px',
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              padding: '12px 12px',
              borderRadius: '14px',
              border: '2px solid var(--accent)',
              boxShadow: '0 8px 24px rgba(220,38,38,0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <TrophyIcon size={16} color="#eab308" />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Gold Medal Final
              </span>
            </div>

            {treeData.matchLabels?.final && (
              <div style={{
                marginBottom: '6px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '9.5px',
                fontWeight: 900,
                background: treeData.matchLabels.final.status === 'live'
                  ? '#dc2626'
                  : treeData.matchLabels.final.isNextUp
                  ? '#0ea5e9'
                  : 'rgba(220, 38, 38, 0.14)',
                color: treeData.matchLabels.final.status === 'live' || treeData.matchLabels.final.isNextUp
                  ? '#ffffff'
                  : 'var(--accent)',
                border: '1px solid rgba(220, 38, 38, 0.35)',
              }}>
                Match #{treeData.matchLabels.final.num}
                {treeData.matchLabels.final.status === 'live' ? ' • LIVE' : treeData.matchLabels.final.isNextUp ? ' • NEXT' : ''}
              </div>
            )}

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
                  ? 'Live in Progress'
                  : (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                    ? treeData.final.champion
                    : 'To Be Decided'}
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN 3: SEMI-FINALS (X = 759) ────────────────────────── */}
          <div style={{ position: 'absolute', left: '759px', top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '759px', top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[1]} align="right" /></div>
          {treeData.matchLabels?.sf[1] && <MatchNumberBadge num={treeData.matchLabels.sf[1].num} status={treeData.matchLabels.sf[1].status} isNextUp={treeData.matchLabels.sf[1].isNextUp} left={827} top={210} />}

          {/* ── RIGHT COLUMN 2: QUARTER-FINALS (X = 934) ─────────────────────── */}
          <div style={{ position: 'absolute', left: '934px', top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '934px', top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][1]} align="right" /></div>
          {treeData.matchLabels?.qf[2] && <MatchNumberBadge num={treeData.matchLabels.qf[2].num} status={treeData.matchLabels.qf[2].status} isNextUp={treeData.matchLabels.qf[2].isNextUp} left={1002} top={100} />}

          <div style={{ position: 'absolute', left: '934px', top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '934px', top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][1]} align="right" /></div>
          {treeData.matchLabels?.qf[3] && <MatchNumberBadge num={treeData.matchLabels.qf[3].num} status={treeData.matchLabels.qf[3].status} isNextUp={treeData.matchLabels.qf[3].isNextUp} left={1002} top={320} />}

          {/* ── RIGHT COLUMN 1: ROUND OF 16 (X = 1104) (Rendered only if R16 exists) ── */}
          {treeData.hasR16 && (
            <>
              <div style={{ position: 'absolute', left: '1104px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][1]} align="right" /></div>
              {treeData.matchLabels?.r16[4] && <MatchNumberBadge num={treeData.matchLabels.r16[4].num} status={treeData.matchLabels.r16[4].status} isNextUp={treeData.matchLabels.r16[4].isNextUp} left={1172} top={53} />}

              <div style={{ position: 'absolute', left: '1104px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][1]} align="right" /></div>
              {treeData.matchLabels?.r16[5] && <MatchNumberBadge num={treeData.matchLabels.r16[5].num} status={treeData.matchLabels.r16[5].status} isNextUp={treeData.matchLabels.r16[5].isNextUp} left={1172} top={147} />}

              <div style={{ position: 'absolute', left: '1104px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][1]} align="right" /></div>
              {treeData.matchLabels?.r16[6] && <MatchNumberBadge num={treeData.matchLabels.r16[6].num} status={treeData.matchLabels.r16[6].status} isNextUp={treeData.matchLabels.r16[6].isNextUp} left={1172} top={273} />}

              <div style={{ position: 'absolute', left: '1104px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][0]} align="right" /></div>
              <div style={{ position: 'absolute', left: '1104px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][1]} align="right" /></div>
              {treeData.matchLabels?.r16[7] && <MatchNumberBadge num={treeData.matchLabels.r16[7].num} status={treeData.matchLabels.r16[7].status} isNextUp={treeData.matchLabels.r16[7].isNextUp} left={1172} top={367} />}
            </>
          )}

        </div>
        </div>

        {/* Mobile / Narrow Screen Pan Hint directly below bracket */}
        <div style={{
          padding: '8px 4px 14px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <span>↔ Scroll or drag horizontally to inspect full tournament bracket</span>
        </div>

        {/* ── Match Play Sequence Guide (Match #1 -> Match #2 -> ...) ──────── */}
        {treeData.orderedMatches && treeData.orderedMatches.length > 0 && (
          <div style={{
            marginTop: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Match Play Sequence (Start from Match #1 in Order)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Blue badge = Next Match to Play · Red = Live · Green = Completed
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '8px',
              width: '100%',
            }}>
              {treeData.orderedMatches.map(item => {
                const isLive = item.status === 'live';
                const isFin = item.status === 'finished';
                return (
                  <div
                    key={item.num}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isLive
                        ? 'rgba(220, 38, 38, 0.12)'
                        : item.isNextUp
                        ? 'rgba(14, 165, 233, 0.12)'
                        : 'var(--bg-elevated)',
                      border: isLive
                        ? '1.5px solid rgba(220, 38, 38, 0.5)'
                        : item.isNextUp
                        ? '1.5px solid rgba(14, 165, 233, 0.6)'
                        : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        color: isLive ? '#ef4444' : item.isNextUp ? '#0ea5e9' : isFin ? '#10b981' : 'var(--accent)',
                      }}>
                        Match #{item.num} · {item.round}
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: isLive
                          ? '#dc2626'
                          : item.isNextUp
                          ? '#0ea5e9'
                          : isFin
                          ? 'rgba(16,185,129,0.16)'
                          : 'rgba(148,163,184,0.16)',
                        color: isLive || item.isNextUp ? '#fff' : isFin ? '#10b981' : 'var(--text-muted)',
                      }}>
                        {isLive ? 'LIVE' : item.isNextUp ? '▶ PLAY NEXT' : isFin ? 'FINAL' : 'QUEUED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>vs</span> {item.teamB}
                      {(isLive || isFin) && item.scoreA !== undefined && item.scoreB !== undefined && (
                        <span style={{ marginLeft: '6px', color: 'var(--accent)', fontWeight: 800 }}>
                          ({item.scoreA}–{item.scoreB})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
