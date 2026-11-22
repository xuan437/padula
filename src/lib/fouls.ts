import type { Player } from '../types';
import { getSportName } from './sports';

export interface FoulTypeConfig {
  id: string;
  label: string;
  shortLabel: string;
  category: 'personal' | 'technical' | 'card' | 'fault' | 'violation';
  severity: 'normal' | 'warning' | 'severe';
}

export interface SportFoulRules {
  sportKey: string;
  foulOutLimit?: number;
  foulOutLabel?: string;
  types: FoulTypeConfig[];
}

export const SPORT_FOUL_RULES: Record<string, SportFoulRules> = {
  basketball: {
    sportKey: 'basketball',
    foulOutLimit: 5,
    foulOutLabel: '5 Fouls · Fouled Out',
    types: [
      { id: 'Personal Foul', label: 'Personal Foul (PF)', shortLabel: 'Personal', category: 'personal', severity: 'normal' },
      { id: 'Shooting Foul', label: 'Shooting Foul (SF)', shortLabel: 'Shooting', category: 'personal', severity: 'normal' },
      { id: 'Offensive Foul', label: 'Offensive / Charge (OF)', shortLabel: 'Offensive', category: 'personal', severity: 'normal' },
      { id: 'Loose-Ball Foul', label: 'Loose-Ball / Team Foul (LF)', shortLabel: 'Loose-Ball', category: 'personal', severity: 'normal' },
      { id: 'Technical Foul', label: 'Technical Foul (TF)', shortLabel: 'Technical', category: 'technical', severity: 'warning' },
      { id: 'Unsportsmanlike Foul', label: 'Unsportsmanlike / Flagrant (UF)', shortLabel: 'Flagrant/UF', category: 'technical', severity: 'severe' },
    ],
  },
  volleyball: {
    sportKey: 'volleyball',
    foulOutLimit: 2,
    foulOutLabel: 'Disqualified / Ejected',
    types: [
      { id: 'Net Touch Fault', label: 'Net Touch Fault', shortLabel: 'Net Touch', category: 'fault', severity: 'normal' },
      { id: 'Center Line / Foot Fault', label: 'Center Line / Foot Fault', shortLabel: 'Foot Fault', category: 'fault', severity: 'normal' },
      { id: 'Service / Rotation Fault', label: 'Service / Rotation Fault', shortLabel: 'Rotation/Serve', category: 'fault', severity: 'normal' },
      { id: 'Double Hit / Lift Fault', label: 'Double Contact / Lift Fault', shortLabel: 'Double/Lift', category: 'fault', severity: 'normal' },
      { id: 'Back-Row Attack Fault', label: 'Back-Row / Libero Fault', shortLabel: 'Back-Row', category: 'fault', severity: 'normal' },
      { id: 'Yellow Card Warning', label: 'Yellow Card (Misconduct Warning)', shortLabel: 'Yellow Card', category: 'card', severity: 'warning' },
      { id: 'Red Card Penalty', label: 'Red Card (Penalty Point)', shortLabel: 'Red Card', category: 'card', severity: 'severe' },
    ],
  },
  football: {
    sportKey: 'football',
    foulOutLimit: 2,
    foulOutLabel: 'Sent Off (Red Card)',
    types: [
      { id: 'Direct Free-Kick Foul', label: 'Direct Free-Kick Tackle Foul', shortLabel: 'Tackle Foul', category: 'personal', severity: 'normal' },
      { id: 'Holding / Pushing Foul', label: 'Holding / Pushing / Charging', shortLabel: 'Holding/Push', category: 'personal', severity: 'normal' },
      { id: 'Handball Foul', label: 'Handball Infringement', shortLabel: 'Handball', category: 'violation', severity: 'normal' },
      { id: 'Offside / Penalty Foul', label: 'Penalty Box / Offside Infraction', shortLabel: 'Box/Offside', category: 'violation', severity: 'warning' },
      { id: 'Yellow Card', label: 'Yellow Card (Caution)', shortLabel: 'Yellow Card', category: 'card', severity: 'warning' },
      { id: 'Red Card', label: 'Red Card (Send-Off)', shortLabel: 'Red Card', category: 'card', severity: 'severe' },
    ],
  },
  futsal: {
    sportKey: 'futsal',
    foulOutLimit: 5,
    foulOutLabel: '5+ Accumulated / Sent Off',
    types: [
      { id: 'Accumulated Foul', label: 'Accumulated Direct Foul', shortLabel: 'Accum. Foul', category: 'personal', severity: 'normal' },
      { id: 'Slide Tackle / Tripping', label: 'Slide Tackle / Tripping Foul', shortLabel: 'Tripping', category: 'personal', severity: 'normal' },
      { id: 'Handball / Holding', label: 'Handball / Holding Foul', shortLabel: 'Handball', category: 'violation', severity: 'normal' },
      { id: '4-Second Violation', label: '4-Second / Back-Pass Violation', shortLabel: '4s Violation', category: 'violation', severity: 'normal' },
      { id: 'Yellow Card', label: 'Yellow Card (Caution)', shortLabel: 'Yellow Card', category: 'card', severity: 'warning' },
      { id: 'Red Card', label: 'Red Card (Expulsion)', shortLabel: 'Red Card', category: 'card', severity: 'severe' },
    ],
  },
  badminton: {
    sportKey: 'badminton',
    types: [
      { id: 'Service Fault', label: 'Service Height / Foot Fault', shortLabel: 'Service Fault', category: 'fault', severity: 'normal' },
      { id: 'Net Touch / Invasion', label: 'Net Touch / Court Invasion', shortLabel: 'Net Fault', category: 'fault', severity: 'normal' },
      { id: 'Double Hit / Sling', label: 'Double Hit / Carry Fault', shortLabel: 'Double Hit', category: 'fault', severity: 'normal' },
      { id: 'Delay / Misconduct Warning', label: 'Delay / Misconduct (Yellow Card)', shortLabel: 'Yellow Card', category: 'card', severity: 'warning' },
      { id: 'Fault Card (Red)', label: 'Red Card (Fault Point Awarded)', shortLabel: 'Red Card', category: 'card', severity: 'severe' },
    ],
  },
  table_tennis: {
    sportKey: 'table_tennis',
    types: [
      { id: 'Illegal Service Fault', label: 'Illegal Toss / Hidden Service Fault', shortLabel: 'Serve Fault', category: 'fault', severity: 'normal' },
      { id: 'Table Touch / Net Fault', label: 'Free Hand Table Touch / Net Fault', shortLabel: 'Table Touch', category: 'fault', severity: 'normal' },
      { id: 'Volley / Double Bounce', label: 'Obstruct / Double Bounce Fault', shortLabel: 'Obstruction', category: 'fault', severity: 'normal' },
      { id: 'Yellow Card Warning', label: 'Yellow Card (Conduct Warning)', shortLabel: 'Yellow Card', category: 'card', severity: 'warning' },
      { id: 'Red Card Penalty', label: 'Red Card (Penalty Point)', shortLabel: 'Red Card', category: 'card', severity: 'severe' },
    ],
  },
  sepak_takraw: {
    sportKey: 'sepak_takraw',
    types: [
      { id: 'Net / Center Line Fault', label: 'Net Touch / Center Line Fault', shortLabel: 'Net/Center', category: 'fault', severity: 'normal' },
      { id: 'Service Circle Fault', label: 'Tekong Service Circle / Throw Fault', shortLabel: 'Serve Fault', category: 'fault', severity: 'normal' },
      { id: 'Hand / Arm Touch Fault', label: 'Hand / Arm Contact Fault', shortLabel: 'Hand Touch', category: 'fault', severity: 'normal' },
      { id: 'Over-3-Touches Fault', label: 'More Than 3 Touches / Hold Fault', shortLabel: '4+ Touches', category: 'fault', severity: 'normal' },
      { id: 'Yellow / Red Card', label: 'Misconduct Yellow / Red Card', shortLabel: 'Card Penalty', category: 'card', severity: 'warning' },
    ],
  },
  frisbee: {
    sportKey: 'frisbee',
    types: [
      { id: 'Contact / Marking Foul', label: 'Physical Contact / Marking Foul', shortLabel: 'Contact Foul', category: 'personal', severity: 'normal' },
      { id: 'Strip / Receiving Foul', label: 'Disc Strip / Receiving Foul', shortLabel: 'Strip/Catch', category: 'personal', severity: 'normal' },
      { id: 'Travel / Pick Violation', label: 'Travel / Screen Pick Violation', shortLabel: 'Travel/Pick', category: 'violation', severity: 'normal' },
      { id: 'Stall-Out / Fast Count', label: 'Stall-Out (10s) / Fast Count', shortLabel: 'Stall/Count', category: 'violation', severity: 'normal' },
      { id: 'Spirit / TMF Warning', label: 'Technical / Spirit Misconduct (TMF)', shortLabel: 'Spirit TMF', category: 'technical', severity: 'warning' },
    ],
  },
  board_games: {
    sportKey: 'board_games',
    types: [
      { id: 'Illegal Move / Touch-Move', label: 'Illegal Move / Touch-Move Infraction', shortLabel: 'Illegal Move', category: 'violation', severity: 'normal' },
      { id: 'Clock / Time Infringement', label: 'Clock Press / Time Control Infraction', shortLabel: 'Time Fault', category: 'violation', severity: 'normal' },
      { id: 'Invalid Word / Challenge', label: 'Phony Word / Overturn Penalty', shortLabel: 'Challenge Pen.', category: 'fault', severity: 'normal' },
      { id: 'Arbiter Conduct Warning', label: 'Arbiter Conduct / Distraction Warning', shortLabel: 'Warning', category: 'technical', severity: 'warning' },
    ],
  },
  esports: {
    sportKey: 'esports',
    types: [
      { id: 'Tactical Pause Violation', label: 'Unannounced / Excess Pause Infringement', shortLabel: 'Pause Foul', category: 'violation', severity: 'normal' },
      { id: 'Draft / Lobby Infraction', label: 'Draft / Hero Pick / Lobby Rule Fault', shortLabel: 'Draft Fault', category: 'fault', severity: 'normal' },
      { id: 'Bug / Exploit Infringement', label: 'Restricted Item / Map Exploit Penalty', shortLabel: 'Rule Penalty', category: 'technical', severity: 'severe' },
      { id: 'Unsportsmanlike / Comms', label: 'Unsportsmanlike Chat / Taunt Warning', shortLabel: 'Conduct Warn', category: 'technical', severity: 'warning' },
    ],
  },
};

export function getSportFoulRules(sportIdOrName: string): SportFoulRules {
  const name = getSportName(sportIdOrName).toLowerCase();
  if (name.includes('basketball')) return SPORT_FOUL_RULES.basketball;
  if (name.includes('volleyball')) return SPORT_FOUL_RULES.volleyball;
  if (name.includes('futsal')) return SPORT_FOUL_RULES.futsal;
  if (name.includes('football') || name.includes('soccer')) return SPORT_FOUL_RULES.football;
  if (name.includes('badminton')) return SPORT_FOUL_RULES.badminton;
  if (name.includes('table tennis') || name.includes('ping pong')) return SPORT_FOUL_RULES.table_tennis;
  if (name.includes('sepak') || name.includes('takraw')) return SPORT_FOUL_RULES.sepak_takraw;
  if (name.includes('frisbee') || name.includes('ultimate')) return SPORT_FOUL_RULES.frisbee;
  if (name.includes('chess') || name.includes('scrabble')) return SPORT_FOUL_RULES.board_games;
  if (name.includes('legends') || name.includes('dota') || name.includes('valorant')) return SPORT_FOUL_RULES.esports;
  return SPORT_FOUL_RULES.basketball;
}

export function getPlayerTotalFouls(player: Player): number {
  if (typeof player.fouls === 'number') return player.fouls;
  if (player.foulBreakdown && Object.keys(player.foulBreakdown).length > 0) {
    return Object.values(player.foulBreakdown).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }
  if (typeof player.sportStats?.fouls === 'number') return player.sportStats.fouls;
  if (player.matchStats && player.matchStats.length > 0) {
    return player.matchStats.reduce((sum, m) => sum + (Number(m.fouls) || 0), 0);
  }
  return 0;
}

export function getPlayerFoulBreakdown(player: Player): Record<string, number> {
  const rules = getSportFoulRules(player.sport);
  const existing = player.foulBreakdown || {};
  const result: Record<string, number> = {};

  for (const t of rules.types) {
    result[t.id] = existing[t.id] || 0;
  }
  for (const [k, v] of Object.entries(existing)) {
    if (!(k in result) && v > 0) {
      result[k] = v;
    }
  }

  const breakdownSum = Object.values(result).reduce((a, b) => a + b, 0);
  const total = getPlayerTotalFouls(player);
  if (total > breakdownSum && rules.types.length > 0) {
    const primaryKey = rules.types[0].id;
    result[primaryKey] = (result[primaryKey] || 0) + (total - breakdownSum);
  }

  return result;
}

export function getPlayerRosterStatus(player: Player): 'in_play' | 'reserved' {
  return player.rosterStatus === 'reserved' ? 'reserved' : 'in_play';
}
