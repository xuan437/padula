// ============================================================
// ASIAN COLLEGE PADULA — SPORTS SYSTEM TYPES
// ============================================================

// ── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'director' | 'coordinator' | 'scorer' | 'player' | 'guest';

export type StaffRole = 'director' | 'coordinator' | 'scorer';
export type StaffStatus = 'active' | 'pending' | 'disabled';

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  assignedCompetitionId?: string; // e.g. 's1' (Basketball)
  assignedMatchIds?: string[];    // match IDs assigned to scorer
  status: StaffStatus;
  addedBy?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isMock?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  email: string;           // institutional Google (@asiancollege.edu.ph)
  department?: string;     // assigned dept
  assignedSport?: string;  // assigned sport / competition ID
  assignedCompetitionId?: string;
  assignedMatchIds?: string[];
  status?: StaffStatus;
  avatarInitials?: string;
  gmailVerified?: boolean;
  isActive?: boolean;
  isMock?: boolean;
}

// ── Sport Catalog ────────────────────────────────────────────────────────────
export type SportType = 'bracket' | 'judged';

export interface Sport {
  id: string;
  name: string;
  type: SportType;
  subtitle: string;
  icon: string;
  isEsport?: boolean;
  maxTeams?: number;
  minPlayersPerTeam?: number;
}

// ── Departments & Divisions & Venues ─────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  shortName: string;
  color: string;           // hex accent color
  isMock?: boolean;
}

export interface Division {
  id: string;
  name: string;            // e.g. "Men's Varsity", "Women's Varsity", "Open"
  sportId: string;
  isMock?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  location: string;
  sports: string[];        // sport IDs supported
  isMock?: boolean;
}

// ── Players & Teams ──────────────────────────────────────────────────────────
export interface PlayerMatchStat {
  matchId: string;
  matchday?: number | string;
  opponent: string;
  result: string;
  venue: 'H' | 'A';
  minutes: number;
  points: number;       // goals / points
  assists?: number;
  rebounds?: number;
  fouls?: number;
  rating?: number;
}

export interface PlayerCareerHistory {
  season: string;
  team: string;
  matches: number;
  goals: number;
}

export interface Player {
  id: string;
  name: string;
  studentId: string;
  department: string;      // department ID
  sport: string;           // sport ID
  division?: string;       // division ID
  jerseyNumber: string;
  position?: string;
  gwa?: number;            // general weighted average (eligibility)
  medicalCleared: boolean;
  photoUrl?: string;       // placeholder or uploaded image
  teamId?: string;
  email?: string;          // Gmail address
  gmailVerified?: boolean;
  isActive?: boolean;

  // Rich Player Statistics & Profile attributes
  dateOfBirth?: string;
  placeOfBirth?: string;
  manager?: string;
  intMatches?: number;
  intGoals?: number;
  currentSeasonGoals?: number;
  currentSeasonAssists?: number;
  careerHistory?: PlayerCareerHistory[];
  matchStats?: PlayerMatchStat[];
  performanceTrend?: number[]; // rating or points trend e.g. [12, 14, 18, 22, 28, 35]
  isMock?: boolean;
}

export interface Team {
  id: string;
  name: string;
  sport: string;           // sport ID
  division?: string;       // division ID
  department: string;      // department ID
  players: string[];       // player IDs
  coach?: string;
  trainer?: string;        // team athletic trainer
  seed?: number;
  color?: string;
  isActive?: boolean;
  isMock?: boolean;
}

// ── Officials ─────────────────────────────────────────────────────────────────
export type OfficialRole = 'scorekeeper' | 'coach' | 'manager' | 'referee';

export interface GameOfficial {
  id: string;
  name: string;
  role: OfficialRole;
  sport: string;
  affiliation?: string;
  licenseId?: string;
  contact?: string;
  assignedGameId?: string;
  isActive?: boolean;
  isMock?: boolean;
}

// ── Matches ───────────────────────────────────────────────────────────────────
export interface Match {
  id: string;
  eventId?: string;
  sport: string;
  division?: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'finished';
  venue?: string;
  round: string;
  roundNumber: number;    // 1 = QF/R1, 2 = SF, 3 = Final
  slot?: number;          // position within the round
  matchNumber?: number;   // overall match sequence number
  nextMatchId?: string | null;
  nextSlot?: 'A' | 'B' | null;
  scheduledTime?: string; // ISO datetime string
  winner?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  isBye?: boolean;
  scorerId?: string;
  referee?: string;
  scorekeeper?: string;
  coachA?: string;
  coachB?: string;
  manager?: string;
  conflictWarning?: string;
  offlineQueue?: { scoreA: number; scoreB: number; ts: number }[];
  isMock?: boolean;
}

// ── Bracket node ──────────────────────────────────────────────────────────────
export interface BracketSlot {
  matchId: string | null;
  team?: string;
  score?: number;
  isWinner?: boolean;
}

// ── Tournament Event ──────────────────────────────────────────────────────────
export interface TournamentEvent {
  id: string;
  name: string;
  sport: string;
  division?: string;
  category: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  venue: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  bracket?: Match[];
  archived?: boolean;
  archivedAt?: string;
  isMock?: boolean;
}

// ── Standings ─────────────────────────────────────────────────────────────────
export interface StandingsRow {
  teamId: string;
  teamName: string;
  department: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: number;
}

// ── Medal Tally ───────────────────────────────────────────────────────────────
export interface MedalTallyRow {
  departmentId: string;
  departmentName: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

// ── Announcements ─────────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  createdAt: string;
  createdBy: string;
  isMock?: boolean;
}

// ── Audit Log ────────────────────────────────────────────────────────────────
export type AuditAction =
  | 'login' | 'logout'
  | 'event_create' | 'event_update' | 'event_publish' | 'event_archive' | 'archive_event'
  | 'team_register' | 'player_register' | 'player_clear'
  | 'bracket_generate'
  | 'match_start' | 'score_update' | 'score_correct' | 'score_finalize' | 'score_override' | 'match_finish'
  | 'official_register' | 'official_assign'
  | 'account_add' | 'account_remove' | 'account_deactivate' | 'sensitive_action'
  | 'announcement_post'
  | 'department_add' | 'venue_add' | 'division_add'
  | 'delete_mock_data';

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  timestamp: string;        // ISO string
  entityId?: string;        // ID of affected object
  entityType?: string;
  isMock?: boolean;
}

// ── Misc ──────────────────────────────────────────────────────────────────────
export type FlowchartView = 'system' | 'admin-setup' | 'scorekeeper';

// Runtime export safeguards so Vite ESM bundler/browser never throws module export missing errors
export const Match = {};
export const User = {};
export const Sport = {};
export const Team = {};
export const TournamentEvent = {};
export const GameOfficial = {};
export const Player = {};
export const Department = {};
export const Venue = {};
export const Division = {};
export const AuditLog = {};
