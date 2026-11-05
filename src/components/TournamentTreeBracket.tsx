import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import { TrophyIcon } from './Icons';

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
}

// ── Complete 16-Team Bracket Seeds for Every Single Sport in Padula ──────────
const SPORT_TREES_16: Record<string, SportBracketTree> = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Basketball (s1)
  // ───────────────────────────────────────────────────────────────────────────
  s1: {
    leftR16: [
      [{ name: 'Padula Eagles', score: 88, isWinner: true, seed: 1 }, { name: 'Red Lions', score: 74, seed: 16 }],
      [{ name: 'Blue Sharks', score: 76, seed: 8 }, { name: 'Padula Tigers', score: 79, isWinner: true, seed: 9 }],
      [{ name: 'Panthers', score: 82, isWinner: true, seed: 5 }, { name: 'Silver Wolves', score: 70, seed: 12 }],
      [{ name: 'Golden Falcons', score: 68, isWinner: true, seed: 4 }, { name: 'Crimson Bears', score: 64, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Padula Eagles', score: 94, isWinner: true }, { name: 'Padula Tigers', score: 89 }],
      [{ name: 'Panthers', score: 78, isWinner: true }, { name: 'Golden Falcons', score: 75 }],
    ],
    leftSF: [
      { name: 'Padula Eagles', score: 91, isWinner: true },
      { name: 'Panthers', score: 84 },
    ],
    final: {
      teamA: { name: 'Padula Eagles', score: 48, isLive: true },
      teamB: { name: 'White Hawks', score: 44, isLive: true },
      champion: 'In Progress (Live Q3)',
      isLive: true,
    },
    rightSF: [
      { name: 'White Hawks', score: 86, isWinner: true },
      { name: 'Cobras', score: 80 },
    ],
    rightQF: [
      [{ name: 'White Hawks', score: 85, isWinner: true }, { name: 'Green Archers', score: 79 }],
      [{ name: 'Cobras', score: 92, isWinner: true }, { name: 'Stallions', score: 87 }],
    ],
    rightR16: [
      [{ name: 'White Hawks', score: 90, isWinner: true, seed: 2 }, { name: 'Spartans', score: 72, seed: 15 }],
      [{ name: 'Green Archers', score: 84, isWinner: true, seed: 7 }, { name: 'Warriors', score: 81, seed: 10 }],
      [{ name: 'Cobras', score: 88, isWinner: true, seed: 6 }, { name: 'Titans', score: 75, seed: 11 }],
      [{ name: 'Stallions', score: 79, isWinner: true, seed: 3 }, { name: 'Dragons', score: 76, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Volleyball (s2)
  // ───────────────────────────────────────────────────────────────────────────
  s2: {
    leftR16: [
      [{ name: 'Blue Sharks Spikers', score: 3, isWinner: true, seed: 1 }, { name: 'Padula Tigers Volley', score: 1, seed: 16 }],
      [{ name: 'Padula Lady Eagles', score: 3, isWinner: true, seed: 8 }, { name: 'Red Lions Volley', score: 0, seed: 9 }],
      [{ name: 'Senior Dept Smashers', score: 3, isWinner: true, seed: 5 }, { name: 'BAA Netters', score: 2, seed: 12 }],
      [{ name: 'DPD Volley Guard', score: 1, seed: 4 }, { name: 'CSE Setters', score: 3, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Blue Sharks Spikers', score: 3, isWinner: true }, { name: 'Padula Lady Eagles', score: 2 }],
      [{ name: 'Senior Dept Smashers', score: 1 }, { name: 'CSE Setters', score: 3, isWinner: true }],
    ],
    leftSF: [
      { name: 'Blue Sharks Spikers', score: 3, isWinner: true },
      { name: 'CSE Setters', score: 2 },
    ],
    final: {
      teamA: { name: 'Blue Sharks Spikers', score: 2, isLive: true },
      teamB: { name: 'HTM Spike Queens', score: 1, isLive: true },
      champion: 'In Progress (Set 4)',
      isLive: true,
    },
    rightSF: [
      { name: 'HTM Spike Queens', score: 3, isWinner: true },
      { name: 'Cobra Setters', score: 1 },
    ],
    rightQF: [
      [{ name: 'HTM Spike Queens', score: 3, isWinner: true }, { name: 'White Hawks Volley', score: 0 }],
      [{ name: 'Cobra Setters', score: 3, isWinner: true }, { name: 'Titan Smashers', score: 2 }],
    ],
    rightR16: [
      [{ name: 'HTM Spike Queens', score: 3, isWinner: true, seed: 2 }, { name: 'Crimson Spikers', score: 0, seed: 15 }],
      [{ name: 'White Hawks Volley', score: 3, isWinner: true, seed: 7 }, { name: 'Gold Netters', score: 1, seed: 10 }],
      [{ name: 'Cobra Setters', score: 3, isWinner: true, seed: 6 }, { name: 'Green Spikers', score: 0, seed: 11 }],
      [{ name: 'Titan Smashers', score: 3, isWinner: true, seed: 3 }, { name: 'Stallion Spikers', score: 1, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Badminton (s3)
  // ───────────────────────────────────────────────────────────────────────────
  s3: {
    leftR16: [
      [{ name: 'Chris Kim (BAA)', score: 21, isWinner: true, seed: 1 }, { name: 'Alex Park (CSE)', score: 18, seed: 16 }],
      [{ name: 'Mark Ramos (HTM)', score: 21, isWinner: true, seed: 8 }, { name: 'Jason Lee (DPD)', score: 14, seed: 9 }],
      [{ name: 'Kevin Cruz (Senior)', score: 21, isWinner: true, seed: 5 }, { name: 'Ryan Tan (BAA)', score: 19, seed: 12 }],
      [{ name: 'Justin Sy (CSE)', score: 17, seed: 4 }, { name: 'Bryan Lim (HTM)', score: 21, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Chris Kim (BAA)', score: 21, isWinner: true }, { name: 'Mark Ramos (HTM)', score: 16 }],
      [{ name: 'Kevin Cruz (Senior)', score: 21, isWinner: true }, { name: 'Bryan Lim (HTM)', score: 15 }],
    ],
    leftSF: [
      { name: 'Chris Kim (BAA)', score: 21, isWinner: true },
      { name: 'Kevin Cruz (Senior)', score: 18 },
    ],
    final: {
      teamA: { name: 'Chris Kim (BAA)', score: 21, isWinner: true },
      teamB: { name: 'Ken Torres (CSE)', score: 19 },
      champion: 'Chris Kim (BAA) 🥇',
    },
    rightSF: [
      { name: 'Ken Torres (CSE)', score: 21, isWinner: true },
      { name: 'Eric Ngo (DPD)', score: 17 },
    ],
    rightQF: [
      [{ name: 'Ken Torres (CSE)', score: 21, isWinner: true }, { name: 'Dave Santos (Senior)', score: 19 }],
      [{ name: 'Eric Ngo (DPD)', score: 21, isWinner: true }, { name: 'Anton Uy (BAA)', score: 16 }],
    ],
    rightR16: [
      [{ name: 'Ken Torres (CSE)', score: 21, isWinner: true, seed: 2 }, { name: 'Paul Chen (BAA)', score: 13, seed: 15 }],
      [{ name: 'Dave Santos (Senior)', score: 21, isWinner: true, seed: 7 }, { name: 'Leo Garcia (HTM)', score: 18, seed: 10 }],
      [{ name: 'Eric Ngo (DPD)', score: 21, isWinner: true, seed: 6 }, { name: 'Sam Diaz (Senior)', score: 15, seed: 11 }],
      [{ name: 'Anton Uy (BAA)', score: 21, isWinner: true, seed: 3 }, { name: 'Glen Yap (CSE)', score: 14, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Table Tennis (s4)
  // ───────────────────────────────────────────────────────────────────────────
  s4: {
    leftR16: [
      [{ name: 'Padula Smashers (BAA)', score: 3, isWinner: true, seed: 1 }, { name: 'Tiger Spinners (DPD)', score: 1, seed: 16 }],
      [{ name: 'CSE Paddlers', score: 3, isWinner: true, seed: 8 }, { name: 'HTM Ping Masters', score: 0, seed: 9 }],
      [{ name: 'Senior Dept Spin', score: 3, isWinner: true, seed: 5 }, { name: 'BAA Loopers', score: 2, seed: 12 }],
      [{ name: 'DPD Table Smash', score: 1, seed: 4 }, { name: 'CSE Topspin', score: 3, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Padula Smashers (BAA)', score: 3, isWinner: true }, { name: 'CSE Paddlers', score: 2 }],
      [{ name: 'Senior Dept Spin', score: 0 }, { name: 'CSE Topspin', score: 3, isWinner: true }],
    ],
    leftSF: [
      { name: 'Padula Smashers (BAA)', score: 3, isWinner: true },
      { name: 'CSE Topspin', score: 1 },
    ],
    final: {
      teamA: { name: 'Padula Smashers (BAA)', score: 3, isWinner: true },
      teamB: { name: 'White Hawk Paddlers', score: 2 },
      champion: 'Padula Smashers (BAA) 🥇',
    },
    rightSF: [
      { name: 'White Hawk Paddlers', score: 3, isWinner: true },
      { name: 'Cobra Ping (HTM)', score: 1 },
    ],
    rightQF: [
      [{ name: 'White Hawk Paddlers', score: 3, isWinner: true }, { name: 'Spartan Spin', score: 0 }],
      [{ name: 'Cobra Ping (HTM)', score: 3, isWinner: true }, { name: 'Titan Loop', score: 2 }],
    ],
    rightR16: [
      [{ name: 'White Hawk Paddlers', score: 3, isWinner: true, seed: 2 }, { name: 'Green Blade', score: 1, seed: 15 }],
      [{ name: 'Spartan Spin', score: 3, isWinner: true, seed: 7 }, { name: 'Warrior Smash', score: 0, seed: 10 }],
      [{ name: 'Cobra Ping (HTM)', score: 3, isWinner: true, seed: 6 }, { name: 'Stallion Blade', score: 1, seed: 11 }],
      [{ name: 'Titan Loop', score: 3, isWinner: true, seed: 3 }, { name: 'Dragon Topspin', score: 2, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Mobile Legends: Bang Bang (s5)
  // ───────────────────────────────────────────────────────────────────────────
  s5: {
    leftR16: [
      [{ name: 'Padula MLBB (BAA)', score: 2, isWinner: true, seed: 1 }, { name: 'CSE Titans ML', score: 0, seed: 16 }],
      [{ name: 'HTM Mythic Squad', score: 2, isWinner: true, seed: 8 }, { name: 'DPD Legends', score: 1, seed: 9 }],
      [{ name: 'Senior Dept ML', score: 2, isWinner: true, seed: 5 }, { name: 'BAA Cyber Eagles', score: 0, seed: 12 }],
      [{ name: 'CSE Phoenix ML', score: 1, seed: 4 }, { name: 'DPD Apex', score: 2, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Padula MLBB (BAA)', score: 2, isWinner: true }, { name: 'HTM Mythic Squad', score: 0 }],
      [{ name: 'Senior Dept ML', score: 2, isWinner: true }, { name: 'DPD Apex', score: 1 }],
    ],
    leftSF: [
      { name: 'Padula MLBB (BAA)', score: 2, isWinner: true },
      { name: 'Senior Dept ML', score: 1 },
    ],
    final: {
      teamA: { name: 'Padula MLBB (BAA)', score: 3, isWinner: true },
      teamB: { name: 'White Hawks ML (CSE)', score: 1 },
      champion: 'Padula MLBB (BAA) 🥇',
    },
    rightSF: [
      { name: 'White Hawks ML (CSE)', score: 2, isWinner: true },
      { name: 'Cobra MLBB (HTM)', score: 0 },
    ],
    rightQF: [
      [{ name: 'White Hawks ML (CSE)', score: 2, isWinner: true }, { name: 'Spartan Esports', score: 1 }],
      [{ name: 'Cobra MLBB (HTM)', score: 2, isWinner: true }, { name: 'Stallion Esports', score: 1 }],
    ],
    rightR16: [
      [{ name: 'White Hawks ML (CSE)', score: 2, isWinner: true, seed: 2 }, { name: 'Green Archers ML', score: 0, seed: 15 }],
      [{ name: 'Spartan Esports', score: 2, isWinner: true, seed: 7 }, { name: 'Warrior Gaming', score: 0, seed: 10 }],
      [{ name: 'Cobra MLBB (HTM)', score: 2, isWinner: true, seed: 6 }, { name: 'Titan Squad', score: 1, seed: 11 }],
      [{ name: 'Stallion Esports', score: 2, isWinner: true, seed: 3 }, { name: 'Dragon ML', score: 0, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 6. DOTA 2 (s6)
  // ───────────────────────────────────────────────────────────────────────────
  s6: {
    leftR16: [
      [{ name: 'Padula Ancients (BAA)', score: 2, isWinner: true, seed: 1 }, { name: 'CSE Aegis Guardians', score: 1, seed: 16 }],
      [{ name: 'HTM Radiants', score: 2, isWinner: true, seed: 8 }, { name: 'DPD Strikers', score: 0, seed: 9 }],
      [{ name: 'Senior Immortals', score: 2, isWinner: true, seed: 5 }, { name: 'BAA Rampage', score: 1, seed: 12 }],
      [{ name: 'CSE Shadow Fiends', score: 2, isWinner: true, seed: 4 }, { name: 'DPD Invokers', score: 0, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Padula Ancients (BAA)', score: 2, isWinner: true }, { name: 'HTM Radiants', score: 1 }],
      [{ name: 'Senior Immortals', score: 1 }, { name: 'CSE Shadow Fiends', score: 2, isWinner: true }],
    ],
    leftSF: [
      { name: 'Padula Ancients (BAA)', score: 2, isWinner: true },
      { name: 'CSE Shadow Fiends', score: 1 },
    ],
    final: {
      teamA: { name: 'Padula Ancients (BAA)', score: 1, isLive: true },
      teamB: { name: 'White Hawk DOTA (CSE)', score: 1, isLive: true },
      champion: 'In Progress (Match 3 Decider)',
      isLive: true,
    },
    rightSF: [
      { name: 'White Hawk DOTA (CSE)', score: 2, isWinner: true },
      { name: 'Cobra DOTA (Senior)', score: 0 },
    ],
    rightQF: [
      [{ name: 'White Hawk DOTA (CSE)', score: 2, isWinner: true }, { name: 'Spartan Carry', score: 0 }],
      [{ name: 'Cobra DOTA (Senior)', score: 2, isWinner: true }, { name: 'Titan Offlane', score: 1 }],
    ],
    rightR16: [
      [{ name: 'White Hawk DOTA (CSE)', score: 2, isWinner: true, seed: 2 }, { name: 'Green Archer DOTA', score: 0, seed: 15 }],
      [{ name: 'Spartan Carry', score: 2, isWinner: true, seed: 7 }, { name: 'Warrior Gankers', score: 1, seed: 10 }],
      [{ name: 'Cobra DOTA (Senior)', score: 2, isWinner: true, seed: 6 }, { name: 'Stallion DOTA', score: 0, seed: 11 }],
      [{ name: 'Titan Offlane', score: 2, isWinner: true, seed: 3 }, { name: 'Dragon Ancients', score: 1, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Valorant (s7)
  // ───────────────────────────────────────────────────────────────────────────
  s7: {
    leftR16: [
      [{ name: 'Blue Sharks Valorant (HTM)', score: 13, isWinner: true, seed: 1 }, { name: 'BAA Phantoms', score: 9, seed: 16 }],
      [{ name: 'CSE Duelists', score: 13, isWinner: true, seed: 8 }, { name: 'DPD Sentinels', score: 11, seed: 9 }],
      [{ name: 'Senior Radiant', score: 13, isWinner: true, seed: 5 }, { name: 'BAA Vandal Squad', score: 7, seed: 12 }],
      [{ name: 'HTM Phantom Ops', score: 10, seed: 4 }, { name: 'CSE Clutch', score: 13, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Blue Sharks Valorant (HTM)', score: 13, isWinner: true }, { name: 'CSE Duelists', score: 8 }],
      [{ name: 'Senior Radiant', score: 13, isWinner: true }, { name: 'CSE Clutch', score: 10 }],
    ],
    leftSF: [
      { name: 'Blue Sharks Valorant (HTM)', score: 13, isWinner: true },
      { name: 'Senior Radiant', score: 11 },
    ],
    final: {
      teamA: { name: 'Blue Sharks Valorant (HTM)', score: 13, isWinner: true },
      teamB: { name: 'White Hawks Valo (BAA)', score: 10 },
      champion: 'Blue Sharks Valorant (HTM) 🥇',
    },
    rightSF: [
      { name: 'White Hawks Valo (BAA)', score: 13, isWinner: true },
      { name: 'Cobra Valorant (DPD)', score: 8 },
    ],
    rightQF: [
      [{ name: 'White Hawks Valo (BAA)', score: 13, isWinner: true }, { name: 'Spartan Vandal', score: 6 }],
      [{ name: 'Cobra Valorant (DPD)', score: 13, isWinner: true }, { name: 'Titan Initiators', score: 11 }],
    ],
    rightR16: [
      [{ name: 'White Hawks Valo (BAA)', score: 13, isWinner: true, seed: 2 }, { name: 'Green Archer Ops', score: 5, seed: 15 }],
      [{ name: 'Spartan Vandal', score: 13, isWinner: true, seed: 7 }, { name: 'Warrior Duelists', score: 9, seed: 10 }],
      [{ name: 'Cobra Valorant (DPD)', score: 13, isWinner: true, seed: 6 }, { name: 'Stallion Radiant', score: 4, seed: 11 }],
      [{ name: 'Titan Initiators', score: 13, isWinner: true, seed: 3 }, { name: 'Dragon Agents', score: 8, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Chess (s8)
  // ───────────────────────────────────────────────────────────────────────────
  s8: {
    leftR16: [
      [{ name: 'BAA Chess Masters', score: 1, isWinner: true, seed: 1 }, { name: 'DPD Knights', score: 0, seed: 16 }],
      [{ name: 'CSE Grandmasters', score: 1, isWinner: true, seed: 8 }, { name: 'HTM Tacticians', score: 0, seed: 9 }],
      [{ name: 'Senior Dept Kings', score: 1, isWinner: true, seed: 5 }, { name: 'BAA Bishops', score: 0, seed: 12 }],
      [{ name: 'DPD Rooks', score: 0, seed: 4 }, { name: 'CSE Pawns', score: 1, isWinner: true, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'BAA Chess Masters', score: 1, isWinner: true }, { name: 'CSE Grandmasters', score: 0 }],
      [{ name: 'Senior Dept Kings', score: 1, isWinner: true }, { name: 'CSE Pawns', score: 0 }],
    ],
    leftSF: [
      { name: 'BAA Chess Masters', score: 1, isWinner: true },
      { name: 'Senior Dept Kings', score: 0 },
    ],
    final: {
      teamA: { name: 'BAA Chess Masters', score: 1, isWinner: true },
      teamB: { name: 'White Hawk Chess', score: 0 },
      champion: 'BAA Chess Masters 🥇',
    },
    rightSF: [
      { name: 'White Hawk Chess', score: 1, isWinner: true },
      { name: 'Cobra Masters (DPD)', score: 0 },
    ],
    rightQF: [
      [{ name: 'White Hawk Chess', score: 1, isWinner: true }, { name: 'Spartan Tacticians', score: 0 }],
      [{ name: 'Cobra Masters (DPD)', score: 1, isWinner: true }, { name: 'Titan Endgames', score: 0 }],
    ],
    rightR16: [
      [{ name: 'White Hawk Chess', score: 1, isWinner: true, seed: 2 }, { name: 'Green Archer Queens', score: 0, seed: 15 }],
      [{ name: 'Spartan Tacticians', score: 1, isWinner: true, seed: 7 }, { name: 'Warrior Gambits', score: 0, seed: 10 }],
      [{ name: 'Cobra Masters (DPD)', score: 1, isWinner: true, seed: 6 }, { name: 'Stallion Chess', score: 0, seed: 11 }],
      [{ name: 'Titan Endgames', score: 1, isWinner: true, seed: 3 }, { name: 'Dragon Masters', score: 0, seed: 14 }],
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Cheerdance (s9)
  // ───────────────────────────────────────────────────────────────────────────
  s9: {
    leftR16: [
      [{ name: 'Silver Wolves Cheer', score: 92, isWinner: true, seed: 1 }, { name: 'Red Lions Pep', score: 88, seed: 16 }],
      [{ name: 'Padula Spirit (BAA)', score: 90, isWinner: true, seed: 8 }, { name: 'DPD Vanguard', score: 86, seed: 9 }],
      [{ name: 'Senior Velocity', score: 91, isWinner: true, seed: 5 }, { name: 'BAA Golden Stars', score: 87, seed: 12 }],
      [{ name: 'CSE Electro', score: 89, isWinner: true, seed: 4 }, { name: 'HTM Sunburst', score: 85, seed: 13 }],
    ],
    leftQF: [
      [{ name: 'Silver Wolves Cheer', score: 94, isWinner: true }, { name: 'Padula Spirit (BAA)', score: 91 }],
      [{ name: 'Senior Velocity', score: 93, isWinner: true }, { name: 'CSE Electro', score: 90 }],
    ],
    leftSF: [
      { name: 'Silver Wolves Cheer', score: 95, isWinner: true },
      { name: 'Senior Velocity', score: 92 },
    ],
    final: {
      teamA: { name: 'Silver Wolves Cheer', score: 96, isWinner: true },
      teamB: { name: 'White Hawks Pep', score: 94 },
      champion: 'Silver Wolves Cheer 🥇',
    },
    rightSF: [
      { name: 'White Hawks Pep', score: 94, isWinner: true },
      { name: 'Cobra Pep Squad', score: 91 },
    ],
    rightQF: [
      [{ name: 'White Hawks Pep', score: 93, isWinner: true }, { name: 'Spartan Stunters', score: 89 }],
      [{ name: 'Cobra Pep Squad', score: 92, isWinner: true }, { name: 'Titan Flyers', score: 88 }],
    ],
    rightR16: [
      [{ name: 'White Hawks Pep', score: 92, isWinner: true, seed: 2 }, { name: 'Green Archer Cheer', score: 87, seed: 15 }],
      [{ name: 'Spartan Stunters', score: 90, isWinner: true, seed: 7 }, { name: 'Warrior Flyers', score: 86, seed: 10 }],
      [{ name: 'Cobra Pep Squad', score: 91, isWinner: true, seed: 6 }, { name: 'Stallion Cheer', score: 87, seed: 11 }],
      [{ name: 'Titan Flyers', score: 89, isWinner: true, seed: 3 }, { name: 'Dragon Stunters', score: 85, seed: 14 }],
    ],
  },
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
  const { matches } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>(initialSportId);

  // Active sport metadata
  const sportMeta = useMemo(() => {
    return SPORTS_CATALOG.find(s => s.id === selectedSport) || SPORTS_CATALOG[0];
  }, [selectedSport]);

  // Dynamic tree with real matches blended in if available
  const treeData = useMemo(() => {
    const rawMatches = matches.filter(
      m => m.sport === selectedSport || getSportName(m.sport).toLowerCase() === sportMeta.name.toLowerCase()
    );

    const base = SPORT_TREES_16[selectedSport] || SPORT_TREES_16['s1'];

    // Helper: overlay a live/finished match score onto a bracket pair slot
    const overlayPair = (
      pair: [BracketTeamEntry, BracketTeamEntry]
    ): [BracketTeamEntry, BracketTeamEntry] => {
      const [a, b] = pair;
      const liveMatch = rawMatches.find(
        m =>
          (m.teamA === a.name && m.teamB === b.name) ||
          (m.teamA === b.name && m.teamB === a.name)
      );
      if (!liveMatch) return pair;
      const isFin = liveMatch.status === 'finished';
      const isLiv = liveMatch.status === 'live';
      const aIsTeamA = liveMatch.teamA === a.name;
      const scoreA_live = aIsTeamA ? liveMatch.scoreA : liveMatch.scoreB;
      const scoreB_live = aIsTeamA ? liveMatch.scoreB : liveMatch.scoreA;
      return [
        {
          ...a,
          score: scoreA_live,
          isLive: isLiv,
          isWinner: isFin ? scoreA_live > scoreB_live : a.isWinner,
        },
        {
          ...b,
          score: scoreB_live,
          isLive: isLiv,
          isWinner: isFin ? scoreB_live > scoreA_live : b.isWinner,
        },
      ];
    };

    // Helper: overlay a live/finished match onto a SF single-row entry
    const overlaySingle = (
      entry: BracketTeamEntry,
      partner: BracketTeamEntry
    ): BracketTeamEntry => {
      const liveMatch = rawMatches.find(
        m =>
          (m.teamA === entry.name && m.teamB === partner.name) ||
          (m.teamA === partner.name && m.teamB === entry.name)
      );
      if (!liveMatch) return entry;
      const isFin = liveMatch.status === 'finished';
      const isLiv = liveMatch.status === 'live';
      const isTeamA = liveMatch.teamA === entry.name;
      const myScore = isTeamA ? liveMatch.scoreA : liveMatch.scoreB;
      const theirScore = isTeamA ? liveMatch.scoreB : liveMatch.scoreA;
      return {
        ...entry,
        score: myScore,
        isLive: isLiv,
        isWinner: isFin ? myScore > theirScore : entry.isWinner,
      };
    };

    // Overlay all rounds
    const leftR16 = base.leftR16.map(pair => overlayPair(pair)) as typeof base.leftR16;
    const leftQF  = base.leftQF.map(pair => overlayPair(pair))  as typeof base.leftQF;
    const leftSF: [BracketTeamEntry, BracketTeamEntry] = [
      overlaySingle(base.leftSF[0], base.leftSF[1]),
      overlaySingle(base.leftSF[1], base.leftSF[0]),
    ];
    const rightR16 = base.rightR16.map(pair => overlayPair(pair)) as typeof base.rightR16;
    const rightQF  = base.rightQF.map(pair => overlayPair(pair))  as typeof base.rightQF;
    const rightSF: [BracketTeamEntry, BracketTeamEntry] = [
      overlaySingle(base.rightSF[0], base.rightSF[1]),
      overlaySingle(base.rightSF[1], base.rightSF[0]),
    ];

    // Final node
    const finalMatch = rawMatches.find(m => m.roundNumber === 3 || m.round.toLowerCase().includes('final'));
    let finalNode = base.final;
    if (finalMatch) {
      const isFin = finalMatch.status === 'finished';
      const isLiv = finalMatch.status === 'live';
      finalNode = {
        teamA: {
          name: finalMatch.teamA,
          score: finalMatch.scoreA,
          isWinner: isFin ? finalMatch.scoreA > finalMatch.scoreB : undefined,
          isLive: isLiv,
        },
        teamB: {
          name: finalMatch.teamB,
          score: finalMatch.scoreB,
          isWinner: isFin ? finalMatch.scoreB > finalMatch.scoreA : undefined,
          isLive: isLiv,
        },
        champion: isFin
          ? finalMatch.winner || (finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamA : finalMatch.teamB)
          : isLiv ? 'Match in Progress' : 'TBD',
        isLive: isLiv,
      };
    }

    return { leftR16, leftQF, leftSF, final: finalNode, rightSF, rightQF, rightR16 };
  }, [matches, selectedSport, sportMeta]);

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
            Single Elimination Structure · 16 Teams competing for Championship Gold
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
            {/* ── LEFT: R16 to QF ── */}
            {/* Pair 1 (boxes at 33 & 73 -> QF at 53) */}
            <path d="M 156 33 H 173 V 73 H 156 M 173 53 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
            <path d="M 156 127 H 173 V 167 H 156 M 173 147 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
            <path d="M 156 253 H 173 V 293 H 156 M 173 273 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
            <path d="M 156 347 H 173 V 387 H 156 M 173 367 H 190" stroke="var(--border)" strokeWidth="1.75" fill="none" />

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

            {/* ── RIGHT: QF to R16 ── */}
            {/* Pair 1 (boxes at 33 & 73 -> QF at 53) */}
            <path d="M 1104 33 H 1087 V 73 H 1104 M 1087 53 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 2 (boxes at 127 & 167 -> QF at 147) */}
            <path d="M 1104 127 H 1087 V 167 H 1104 M 1087 147 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 3 (boxes at 253 & 293 -> QF at 273) */}
            <path d="M 1104 253 H 1087 V 293 H 1104 M 1087 273 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
            {/* Pair 4 (boxes at 347 & 387 -> QF at 367) */}
            <path d="M 1104 347 H 1087 V 387 H 1104 M 1087 367 H 1070" stroke="var(--border)" strokeWidth="1.75" fill="none" />
          </svg>

          {/* ── ROUND LABELS BAR ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            position: 'absolute',
            top: '-2px',
            left: 0,
            padding: '0 20px',
            boxSizing: 'border-box',
            zIndex: 3,
          }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center' }}>Round of 16</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginLeft: '34px' }}>Quarter-Finals</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginLeft: '39px' }}>Semi-Finals</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '180px', textAlign: 'center' }}>Championship Final</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginRight: '39px' }}>Semi-Finals</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center', marginRight: '34px' }}>Quarter-Finals</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: '136px', textAlign: 'center' }}>Round of 16</span>
          </div>

          {/* ── LEFT COLUMN 1: ROUND OF 16 (X = 20) ──────────────────────────── */}
          <div style={{ position: 'absolute', left: '20px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][0]} /></div>
          <div style={{ position: 'absolute', left: '20px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][1]} /></div>
          
          <div style={{ position: 'absolute', left: '20px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][0]} /></div>
          <div style={{ position: 'absolute', left: '20px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][1]} /></div>

          <div style={{ position: 'absolute', left: '20px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][0]} /></div>
          <div style={{ position: 'absolute', left: '20px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][1]} /></div>

          <div style={{ position: 'absolute', left: '20px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][0]} /></div>
          <div style={{ position: 'absolute', left: '20px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][1]} /></div>

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
              background: 'var(--accent)',
              color: '#fff',
              padding: '5px 12px',
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
            }}>
              <span>🏆 {treeData.final.champion}</span>
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

          {/* ── RIGHT COLUMN 1: ROUND OF 16 (X = 1104) ───────────────────────── */}
          <div style={{ position: 'absolute', left: '1104px', top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '1104px', top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][1]} align="right" /></div>

          <div style={{ position: 'absolute', left: '1104px', top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '1104px', top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][1]} align="right" /></div>

          <div style={{ position: 'absolute', left: '1104px', top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '1104px', top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][1]} align="right" /></div>

          <div style={{ position: 'absolute', left: '1104px', top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][0]} align="right" /></div>
          <div style={{ position: 'absolute', left: '1104px', top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][1]} align="right" /></div>

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
