import React from 'react';
import {
  BasketballIcon,
  VolleyballIcon,
  ShuttlecockIcon,
  TableTennisIcon,
  GamepadIcon,
  ChessIcon,
  TrophyIcon,
} from '../components/Icons';

export interface SportMeta {
  id: string;
  name: string;
  category: 'team' | 'individual' | 'judged' | 'esport';
  unit: string; // e.g. "Points", "Sets", "Games", "Score", "Maps"
  icon: (color?: string, size?: number) => React.ReactNode;
}

export const SPORTS_CATALOG: SportMeta[] = [
  {
    id: 's1',
    name: 'Basketball',
    category: 'team',
    unit: 'Points',
    icon: (c, s = 18) => <BasketballIcon size={s} color={c} />,
  },
  {
    id: 's2',
    name: 'Volleyball',
    category: 'team',
    unit: 'Sets',
    icon: (c, s = 18) => <VolleyballIcon size={s} color={c} />,
  },
  {
    id: 's3',
    name: 'Badminton',
    category: 'individual',
    unit: 'Games',
    icon: (c, s = 18) => <ShuttlecockIcon size={s} color={c} />,
  },
  {
    id: 's4',
    name: 'Table Tennis',
    category: 'individual',
    unit: 'Games',
    icon: (c, s = 18) => <TableTennisIcon size={s} color={c} />,
  },
  {
    id: 's5',
    name: 'Mobile Legends',
    category: 'esport',
    unit: 'Maps',
    icon: (c, s = 18) => <GamepadIcon size={s} color={c} />,
  },
  {
    id: 's6',
    name: 'DOTA',
    category: 'esport',
    unit: 'Maps',
    icon: (c, s = 18) => <GamepadIcon size={s} color={c} />,
  },
  {
    id: 's7',
    name: 'Valorant',
    category: 'esport',
    unit: 'Rounds',
    icon: (c, s = 18) => <GamepadIcon size={s} color={c} />,
  },
  {
    id: 's8',
    name: 'Chess',
    category: 'individual',
    unit: 'Points',
    icon: (c, s = 18) => <ChessIcon size={s} color={c} />,
  },
  {
    id: 's9',
    name: 'Cheerdance',
    category: 'judged',
    unit: 'Score',
    icon: (c, s = 18) => <TrophyIcon size={s} color={c} />,
  },
];

export function getSportName(sportIdOrName: string): string {
  if (!sportIdOrName) return 'All Sports';
  const match = SPORTS_CATALOG.find(
    s => s.id.toLowerCase() === sportIdOrName.toLowerCase() ||
         s.name.toLowerCase() === sportIdOrName.toLowerCase()
  );
  if (match) return match.name;
  if (sportIdOrName.toLowerCase().includes('dota')) return 'DOTA';
  if (sportIdOrName.toLowerCase().includes('valorant')) return 'Valorant';
  return sportIdOrName;
}

export function getSportMeta(sportIdOrName: string): SportMeta | undefined {
  if (!sportIdOrName) return undefined;
  return SPORTS_CATALOG.find(
    s => s.id.toLowerCase() === sportIdOrName.toLowerCase() ||
         s.name.toLowerCase() === sportIdOrName.toLowerCase()
  );
}

export function getSportIcon(sportIdOrName: string, size = 18, color?: string): React.ReactNode {
  const meta = getSportMeta(sportIdOrName);
  if (meta) return meta.icon(color, size);
  return <TrophyIcon size={size} color={color} />;
}

