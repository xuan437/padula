// ============================================================
// ASIAN COLLEGE PADULA — SPORTS ANALYTICS SYSTEM TYPES
// ============================================================

// ── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'director' | 'coordinator' | 'scorer' | 'player' | 'guest';

export type StaffRole = 'director' | 'coordinator' | 'scorer';
export type StaffStatus = 'active' | 'pending' | 'disabled';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface StaffInvitation {
  id: string;
  recipientName: string;
  recipientEmail: string;
  role: 'director' | 'coordinator' | 'scorer';
  roleTitle: string;
  assignedSportOrDept: string;
  generatedPassword: string;
  status: InvitationStatus;
  sentBy: string;
  sentByEmail: string;
  sentAt: string;
  respondedAt?: string;
  subject: string;
  letterBody: string;
  // Gmail API Dispatch status & receipt
  dispatchedViaApi?: boolean;
  dispatchedToEmail?: string;
  apiDeliveryStatus?: 'pending' | 'sent' | 'failed';
  apiTransactionId?: string;
  apiDispatchedAt?: string;
  apiProvider?: string;
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  assignedCompetitionId?: string; // e.g. 's1' (Basketball)
  assignedMatchIds?: string[];    // match IDs assigned to scorer
  status: StaffStatus;
  password?: string;
  invitationStatus?: InvitationStatus;
  invitationId?: string;
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
  password?: string;
  invitationStatus?: InvitationStatus;
  invitationId?: string;
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

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'scorer';
  sportOrDept: string;
  note: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined';
  reviewedAt?: string;
  reviewedBy?: string;
  generatedPassword?: string;
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

// ── Sport-Specific Player & Match Stats ──────────────────────────────────────
export interface SportSpecificStats {
  // Basketball
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  fouls?: number;
  // Volleyball
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  // Football
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  // Racket & Sepak Takraw
  setsWon?: number;
  smashes?: number;
  // Frisbee (Ultimate)
  turnovers?: number;
  // Board Games (Chess / Scrabble)
  wins?: number;
  draws?: number;
  losses?: number;
  avgSpread?: number;
  eloRating?: number;
  // Esports (Mobile Legends / DOTA 2 / Valorant)
  esportKills?: number;
  deaths?: number;
  esportAssists?: number;
  objectives?: number;
  acs?: number; // Average Combat Score / MVP rating
}

export interface PlayerMatchStat {
  matchId: string;
  matchday?: number | string;
  opponent: string;
  result: string;
  venue: 'H' | 'A';
  minutes: number;
  points: number;       // goals / points / kills
  assists?: number;
  rebounds?: number;
  steals?: number;
  fouls?: number;
  kills?: number;
  aces?: number;
  blocks?: number;
  digs?: number;
  deaths?: number;
  objectives?: number;
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
  sportStats?: SportSpecificStats;
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
  password?: string;
  invitationStatus?: InvitationStatus;
  invitationId?: string;
  assignedGameId?: string;
  isActive?: boolean;
  isMock?: boolean;
}

// ── Matches ───────────────────────────────────────────────────────────────────
export type TournamentFormat = 'single_elimination' | 'round_robin';

export interface MatchPeriodScore {
  label: string;   // e.g. 'Q1', 'Set 1', '1st Half', 'Game 1'
  scoreA: number;
  scoreB: number;
}

export interface MatchTimelineEvent {
  id: string;
  time: string;    // e.g. "Q1 04:12" or "Set 2" or "14'"
  team: 'A' | 'B';
  player?: string;
  type: 'score' | 'foul' | 'timeout' | 'substitution' | 'milestone';
  description: string;
  scoreSnapshot?: string; // e.g. "24 - 19"
}

export interface Match {
  id: string;
  eventId?: string;
  sport: string;
  division?: string;
  format?: TournamentFormat;
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
  scheduledDate?: string;
  scheduledTime?: string; // ISO datetime string or time string
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
  // Sports Analytics enrichments
  periodScores?: MatchPeriodScore[];
  timeline?: MatchTimelineEvent[];
  playerOfTheMatch?: {
    playerId?: string;
    name: string;
    team: string;
    statLine: string;
  };
  momentumHistory?: { label: string; diff: number }[]; // + for Team A lead, - for Team B lead
  correctionHistory?: {
    timestamp: string;
    by: string;
    oldScore: string;
    newScore: string;
    reason: string;
  }[];
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
  format?: TournamentFormat;
  category: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  rules?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  bracket?: Match[];
  archived?: boolean;
  archivedAt?: string;
  seasonYear?: number;
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
  matchId?: string;
  eventId?: string;
  sport?: string;
  isMock?: boolean;
}

// ── Audit Log ────────────────────────────────────────────────────────────────
export type AuditAction =
  | 'login' | 'logout' | 'failed_login' | 'denied_access' | 'request_access' | 'approve_access' | 'decline_access'
  | 'event_create' | 'event_update' | 'event_publish' | 'event_archive' | 'archive_event'
  | 'team_register' | 'player_register' | 'player_clear'
  | 'bracket_generate'
  | 'match_start' | 'score_update' | 'score_correct' | 'score_finalize' | 'score_override' | 'match_finish'
  | 'official_register' | 'official_assign'
  | 'account_add' | 'account_remove' | 'account_deactivate' | 'sensitive_action'
  | 'announcement_post'
  | 'email_dispatch'
  | 'department_add' | 'venue_add' | 'division_add'
  | 'delete_mock_data'
  | 'settings_update' | 'settings_reset' | 'settings_import' | 'settings_export';

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
  beforeValue?: string;
  afterValue?: string;
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
export const AccessRequest = {};
export * from './settings';
