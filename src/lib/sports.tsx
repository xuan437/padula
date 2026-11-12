import React from 'react';
import {
  BasketballIcon,
  VolleyballIcon,
  ShuttlecockIcon,
  TableTennisIcon,
  GamepadIcon,
  ChessIcon,
  FootballIcon,
  SepakTakrawIcon,
  FrisbeeIcon,
  ScrabbleIcon,
  CrosshairIcon,
  TrophyIcon,
  MedalIcon,
  FlameIcon,
  ZapIcon,
} from '../components/Icons';

export type SportFormat = 'Single elimination' | 'Round robin, then finals' | 'Round robin';

export interface SportMeta {
  id: string;
  name: string;
  category: 'team' | 'individual' | 'esport' | 'board';
  unit: string; // e.g. "Points", "Sets", "Goals", "Games", "Wins"
  rulesSummary: string;
  format: SportFormat;
  divisions?: string[];
  scoringType: 'basketball' | 'rally' | 'goals' | 'games' | 'points' | 'board' | 'esport';
  periodsDescription: string;
  icon: (color?: string, size?: number) => React.ReactNode;
}

export const SPORTS_CATALOG: SportMeta[] = [
  {
    id: 's1',
    name: 'Basketball',
    category: 'team',
    unit: 'Points',
    rulesSummary: '+1/+2/+3 points, 4 quarters of 10 min',
    format: 'Single elimination',
    divisions: ["Men's Varsity", "Women's Varsity"],
    scoringType: 'basketball',
    periodsDescription: '4 Quarters (10 min each)',
    icon: (c, s = 18) => <BasketballIcon size={s} color={c} />,
  },
  {
    id: 's2',
    name: 'Volleyball',
    category: 'team',
    unit: 'Sets',
    rulesSummary: 'Sets to 25, 5th set to 15, best of 5',
    format: 'Round robin, then finals',
    divisions: ["Men's Division", "Women's Division"],
    scoringType: 'rally',
    periodsDescription: 'Best of 5 Sets (Rally point to 25, decider to 15)',
    icon: (c, s = 18) => <VolleyballIcon size={s} color={c} />,
  },
  {
    id: 's_football',
    name: 'Football',
    category: 'team',
    unit: 'Goals',
    rulesSummary: 'Goals, 2 halves of 45 min; penalty shootout for ties',
    format: 'Single elimination',
    divisions: ["Men's Division", "Women's Open"],
    scoringType: 'goals',
    periodsDescription: '2 Halves (45 min each) + Penalty Shootout',
    icon: (c, s = 18) => <FootballIcon size={s} color={c} />,
  },
  {
    id: 's_sepaktakraw',
    name: 'Sepak Takraw',
    category: 'team',
    unit: 'Sets',
    rulesSummary: 'Sets to 21, best of 3 sets',
    format: 'Round robin, then finals',
    divisions: ["Men's Regu", "Women's Regu"],
    scoringType: 'rally',
    periodsDescription: 'Best of 3 Sets (First to 21 points, 2-pt lead)',
    icon: (c, s = 18) => <SepakTakrawIcon size={s} color={c} />,
  },
  {
    id: 's4',
    name: 'Table Tennis',
    category: 'individual',
    unit: 'Games',
    rulesSummary: 'Games to 11, best of 5 games',
    format: 'Single elimination',
    divisions: ['Singles', 'Doubles'],
    scoringType: 'games',
    periodsDescription: 'Best of 5 Games (First to 11 points)',
    icon: (c, s = 18) => <TableTennisIcon size={s} color={c} />,
  },
  {
    id: 's3',
    name: 'Badminton',
    category: 'individual',
    unit: 'Games',
    rulesSummary: 'Games to 21, best of 3 games',
    format: 'Single elimination',
    divisions: ["Men's Singles", "Women's Singles", 'Mixed Doubles'],
    scoringType: 'games',
    periodsDescription: 'Best of 3 Games (First to 21 points)',
    icon: (c, s = 18) => <ShuttlecockIcon size={s} color={c} />,
  },
  {
    id: 's_frisbee',
    name: 'Frisbee (Ultimate)',
    category: 'team',
    unit: 'Points',
    rulesSummary: 'Points, first team to 15 points wins',
    format: 'Round robin, then finals',
    divisions: ['Open Collegiate'],
    scoringType: 'points',
    periodsDescription: 'Race to 15 Points (Half-time at 8)',
    icon: (c, s = 18) => <FrisbeeIcon size={s} color={c} />,
  },
  {
    id: 's8',
    name: 'Chess',
    category: 'board',
    unit: 'Points',
    rulesSummary: 'Win 1, draw ½, loss 0; rank by points, then Buchholz tie-break',
    format: 'Round robin',
    divisions: ['Standard Classical', 'Rapid'],
    scoringType: 'board',
    periodsDescription: 'FIDE Tournament Clock (Round Robin)',
    icon: (c, s = 18) => <ChessIcon size={s} color={c} />,
  },
  {
    id: 's_scrabble',
    name: 'Scrabble',
    category: 'board',
    unit: 'Word Pts',
    rulesSummary: 'Total word points; rank by wins, then total aggregate points',
    format: 'Round robin',
    divisions: ['Individual Open'],
    scoringType: 'board',
    periodsDescription: 'Individual Match Aggregate Word Scores',
    icon: (c, s = 18) => <ScrabbleIcon size={s} color={c} />,
  },
  {
    id: 's5',
    name: 'Mobile Legends',
    category: 'esport',
    unit: 'Game Wins',
    rulesSummary: 'Game wins, best of 3 (Grand Finals best of 5)',
    format: 'Single elimination',
    divisions: ['Collegiate 5v5'],
    scoringType: 'esport',
    periodsDescription: 'Best of 3 Matches (Finals Best of 5)',
    icon: (c, s = 18) => <GamepadIcon size={s} color={c} />,
  },
  {
    id: 's6',
    name: 'DOTA 2',
    category: 'esport',
    unit: 'Game Wins',
    rulesSummary: 'Game wins, best of 3 matches',
    format: 'Single elimination',
    divisions: ['Collegiate 5v5'],
    scoringType: 'esport',
    periodsDescription: 'Best of 3 Matches (5v5 Captains Mode)',
    icon: (c, s = 18) => <GamepadIcon size={s} color={c} />,
  },
  {
    id: 's7',
    name: 'Valorant',
    category: 'esport',
    unit: 'Game Wins',
    rulesSummary: 'Game wins, best of 3 (maps played to 13 rounds)',
    format: 'Single elimination',
    divisions: ['Collegiate 5v5'],
    scoringType: 'esport',
    periodsDescription: 'Best of 3 Maps (First to 13 Rounds)',
    icon: (c, s = 18) => <CrosshairIcon size={s} color={c} />,
  },
];

export function getIconByKey(key?: string, size = 18, color?: string): React.ReactNode {
  switch ((key || '').toLowerCase()) {
    case 'basketball': return <BasketballIcon size={size} color={color} />;
    case 'volleyball': return <VolleyballIcon size={size} color={color} />;
    case 'football': return <FootballIcon size={size} color={color} />;
    case 'sepaktakraw': return <SepakTakrawIcon size={size} color={color} />;
    case 'tabletennis': return <TableTennisIcon size={size} color={color} />;
    case 'badminton': return <ShuttlecockIcon size={size} color={color} />;
    case 'frisbee': return <FrisbeeIcon size={size} color={color} />;
    case 'chess': return <ChessIcon size={size} color={color} />;
    case 'scrabble': return <ScrabbleIcon size={size} color={color} />;
    case 'gamepad': return <GamepadIcon size={size} color={color} />;
    case 'crosshair': return <CrosshairIcon size={size} color={color} />;
    case 'medal': return <MedalIcon size={size} color={color} />;
    case 'flame': return <FlameIcon size={size} color={color} />;
    case 'zap': return <ZapIcon size={size} color={color} />;
    default: return <TrophyIcon size={size} color={color} />;
  }
}

export function getCustomSports(): SportMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('padula_custom_sports');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'team',
          unit: item.unit || 'Points',
          rulesSummary: item.rulesSummary || `${item.name} Competition`,
          format: item.format || 'Single elimination',
          divisions: item.divisions || ["Men's Division", "Women's Division"],
          scoringType: item.scoringType || (item.category === 'esport' ? 'esport' : item.category === 'board' ? 'board' : 'points'),
          periodsDescription: item.periodsDescription || `${item.name} Match Play`,
          icon: (c?: string, s = 18) => getIconByKey(item.iconKey, s, c),
        }));
      }
    }
  } catch {}
  return [];
}

export function getAllSports(): SportMeta[] {
  const custom = getCustomSports();
  if (!custom.length) return SPORTS_CATALOG;
  // Merge ensuring no duplicate IDs
  const customIds = new Set(custom.map(c => c.id.toLowerCase()));
  const filteredCatalog = SPORTS_CATALOG.filter(s => !customIds.has(s.id.toLowerCase()));
  return [...filteredCatalog, ...custom];
}

export function saveCustomSport(data: {
  id?: string;
  name: string;
  category: 'team' | 'individual' | 'esport' | 'board';
  unit?: string;
  rulesSummary?: string;
  format?: SportFormat;
  divisions?: string[];
  scoringType?: 'basketball' | 'rally' | 'goals' | 'games' | 'points' | 'board' | 'esport';
  periodsDescription?: string;
  iconKey?: string;
}): SportMeta {
  const id = data.id || `s_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const iconKey = data.iconKey || (data.category === 'esport' ? 'gamepad' : data.category === 'board' ? 'chess' : 'trophy');
  const scoringType = data.scoringType || (data.category === 'esport' ? 'esport' : data.category === 'board' ? 'board' : 'points');
  const format = data.format || 'Single elimination';
  const unit = data.unit || 'Points';
  const rulesSummary = data.rulesSummary || `${data.name} Championship rules and scoring format`;
  const divisions = data.divisions && data.divisions.length ? data.divisions : ["Men's Division", "Women's Division"];
  const periodsDescription = data.periodsDescription || `${data.name} Match Regulation Play`;

  const record = {
    id,
    name: data.name,
    category: data.category,
    unit,
    rulesSummary,
    format,
    divisions,
    scoringType,
    periodsDescription,
    iconKey,
  };

  try {
    const raw = localStorage.getItem('padula_custom_sports');
    const existing = raw ? JSON.parse(raw) : [];
    const updated = Array.isArray(existing) ? existing.filter((item: any) => item.id !== id) : [];
    updated.push(record);
    localStorage.setItem('padula_custom_sports', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('padula_sports_updated', { detail: { id, name: data.name } }));
  } catch {}

  return {
    ...record,
    icon: (c?: string, s = 18) => getIconByKey(iconKey, s, c),
  };
}

export function deleteCustomSport(id: string): void {
  try {
    const raw = localStorage.getItem('padula_custom_sports');
    if (raw) {
      const existing = JSON.parse(raw);
      if (Array.isArray(existing)) {
        const updated = existing.filter((item: any) => item.id !== id);
        localStorage.setItem('padula_custom_sports', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('padula_sports_updated', { detail: { id, deleted: true } }));
      }
    }
  } catch {}
}

export function getSportName(sportIdOrName: string): string {
  if (!sportIdOrName) return 'All Sports';
  const all = getAllSports();
  const match = all.find(
    s => s.id.toLowerCase() === sportIdOrName.toLowerCase() ||
         s.name.toLowerCase() === sportIdOrName.toLowerCase()
  );
  if (match) return match.name;
  if (sportIdOrName.toLowerCase().includes('dota')) return 'DOTA 2';
  if (sportIdOrName.toLowerCase().includes('valorant')) return 'Valorant';
  if (sportIdOrName.toLowerCase().includes('football') || sportIdOrName.toLowerCase().includes('soccer')) return 'Football';
  if (sportIdOrName.toLowerCase().includes('takraw')) return 'Sepak Takraw';
  if (sportIdOrName.toLowerCase().includes('frisbee')) return 'Frisbee (Ultimate)';
  if (sportIdOrName.toLowerCase().includes('scrabble')) return 'Scrabble';
  return sportIdOrName;
}

export function getSportMeta(sportIdOrName: string): SportMeta | undefined {
  if (!sportIdOrName) return undefined;
  const all = getAllSports();
  return all.find(
    s => s.id.toLowerCase() === sportIdOrName.toLowerCase() ||
         s.name.toLowerCase() === sportIdOrName.toLowerCase()
  ) || all.find(s => {
    const q = sportIdOrName.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });
}

export function getSportIcon(sportIdOrName: string, size = 18, color?: string): React.ReactNode {
  const meta = getSportMeta(sportIdOrName);
  if (meta) return meta.icon(color, size);
  return <TrophyIcon size={size} color={color} />;
}

export const OFFICIAL_SPORTS = SPORTS_CATALOG;
export const getSportIconComponent = (sportIdOrName: string, size = 18, color?: string) =>
  getSportIcon(sportIdOrName, size, color);

