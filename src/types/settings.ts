/**
 * Padula Sports - Tournament Analytics
 * Settings Type Definitions
 * 
 * Strict TypeScript interfaces with JSDoc comments for all 8 Settings sections.
 * Designed for easy backend replacement (REST / Supabase / GraphQL).
 */

import type { UserRole } from './index';

// ── 1. Sports & Competition Setup ─────────────────────────────────────────────

export type SportId =
  | 'basketball'
  | 'volleyball'
  | 'football'
  | 'sepaktakraw'
  | 'tabletennis'
  | 'badminton'
  | 'frisbee'
  | 'chess'
  | 'scrabble'
  | 'mobilelegends'
  | 'dota2'
  | 'valorant';

export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'pool_play_knockout';

export type TiebreakerRule =
  | 'head_to_head'
  | 'point_differential'
  | 'total_points_scored'
  | 'buchholz'
  | 'coin_toss';

export interface SportScoringRule {
  sportId: SportId;
  sportName: string;
  category: 'team' | 'individual' | 'board' | 'esport';
  unit: string;
  periodType: 'quarters' | 'halves' | 'sets' | 'games' | 'rounds';
  periodCount: number;
  periodDurationMinutes: number;
  bestOf: number; // e.g. 1, 3, 5
  targetScoreToWin?: number; // e.g. 21 for badminton, 25 for volleyball
  winByTwo: boolean;
  tiebreakerOrder: TiebreakerRule[];
  defaultTournamentFormat: TournamentFormat;
  maxPointsPossiblePerPeriod: number;
  allowedDivisions: string[];
}

export interface CompetitionEventSetup {
  eventName: string;
  academicYear: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  hostCampus: string;
  departments: string[];
  divisions: string[];
  categories: string[];
  venues: string[];
}

export interface SportsCompetitionSettings {
  /** Master list of rules for all 12 accredited sports */
  sports: Record<SportId, SportScoringRule>;
  /** Global competition and seasonal parameters */
  eventSetup: CompetitionEventSetup;
  /** Format assignments per competition ID */
  competitionFormats: Record<string, TournamentFormat>;
}

// ── 2. Teams, Players & Roster Rules ──────────────────────────────────────────

export type PlayerStatusOption = 'active' | 'injured' | 'suspended';

export interface SportRosterRule {
  sportId: SportId;
  minPlayers: number;
  maxPlayers: number;
  minStarters: number;
  allowedPositions: string[];
  maxSubstitutionsPerGame: number;
}

export interface JerseyNumberRules {
  minNumber: number;
  maxNumber: number;
  allowDuplicatesAcrossSports: boolean;
  allowDuplicatesWithinTeam: boolean;
}

export interface EligibilityRules {
  requireEnrolledStudent: boolean;
  minGpa: number;
  maxAcademicYearsEligible: number;
  requireMedicalClearance: boolean;
  requireSignedWaiver: boolean;
}

export interface RosterRulesSettings {
  jerseyRules: JerseyNumberRules;
  eligibility: EligibilityRules;
  rosterPerSport: Record<SportId, SportRosterRule>;
  allowedPlayerStatuses: PlayerStatusOption[];
  requireCoach: boolean;
  requireTrainer: boolean;
  maxCoachesPerTeam: number;
  maxTrainersPerTeam: number;
}

// ── 3. Statistics & Metrics ───────────────────────────────────────────────────

export interface MetricFormula {
  id: string;
  name: string;
  formula: string; // e.g. "((points + rebounds + assists + steals + blocks) - (missedFg + turnovers)) / gamesPlayed"
  description: string;
  sportId: SportId | 'all';
  isValid: boolean;
  variables: string[];
}

export interface MedalPointValues {
  gold: number;
  silver: number;
  bronze: number;
  fourthPlace: number;
}

export interface StatsMetricsSettings {
  /** Enabled statistics tracked per sport */
  trackedStatsPerSport: Record<SportId, string[]>;
  /** Custom formula for Efficiency Rating */
  efficiencyFormula: MetricFormula;
  /** Custom formula for MVP Score */
  mvpFormula: MetricFormula;
  /** Custom formula for Win Percentage */
  winPercentageFormula: MetricFormula;
  /** Medal values contributing to aggregate department points */
  medalPoints: MedalPointValues;
}

// ── 4. Scoring & Data Entry ───────────────────────────────────────────────────

export type ScorerInputMode = 'live' | 'post_game';
export type ConflictResolutionStrategy = 'server_wins' | 'client_wins' | 'manual_review';
export type ResultCorrectionPermission = 'director_only' | 'director_and_coordinator';

export interface ScoreValidationRule {
  sportId: SportId;
  maxScorePerPeriod: number;
  maxTotalScore: number;
  allowDraws: boolean;
}

export interface ScoringSettings {
  defaultInputMode: ScorerInputMode;
  scoreLimits: Record<SportId, ScoreValidationRule>;
  correctionPermission: ResultCorrectionPermission;
  requireCorrectionReason: boolean;
  autoLockResultsAfterMinutes: number; // 0 for no lock
  enableOfflineMode: boolean;
  offlineSyncIntervalSeconds: number;
  conflictStrategy: ConflictResolutionStrategy;
  allowPerGameScorerAssignment: boolean;
}

// ── 5. Users, Roles & Security ────────────────────────────────────────────────

export interface RolePermissions {
  role: UserRole;
  canViewMatches: boolean;
  canEnterScores: boolean;
  canEditFinalScores: boolean;
  canApproveRosters: boolean;
  canManageSchedules: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
}

export interface CoordinatorSlot {
  slotNumber: 1 | 2 | 3;
  userId?: string;
  assignedCompetitionId?: string;
  assignedCompetitionName?: string;
}

export interface SecuritySettings {
  maxCoordinators: 3;
  allowedEmailDomain: string; // e.g. "asiancollege.edu.ph"
  sessionTimeoutMinutes: number; // e.g. 30
  scorerSessionTimeoutMinutes: number; // e.g. 120
  forceLogoutAllActiveSessions: boolean;
  permissionsMatrix: Record<UserRole, RolePermissions>;
  coordinators: CoordinatorSlot[];
}

// ── 6. Dashboards & Reports ───────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type DefaultViewByRole = 'admin' | 'scorekeeper' | 'live' | 'public' | 'analytics';

export interface DashboardSettings {
  defaultViews: Record<UserRole, DefaultViewByRole>;
  defaultSportFilter: SportId | 'all';
  defaultDateFilter: 'today' | 'upcoming' | 'all';
  enabledExportFormats: ExportFormat[];
  chartTypePreference: 'bar' | 'line' | 'radar';
  enablePlayerComparison: boolean;
  enableTeamComparison: boolean;
  enableSeasonComparison: boolean;
}

// ── 7. Public Display & Notifications ─────────────────────────────────────────

export type ScoreboardTheme = 'dark_obsidian' | 'asian_crimson' | 'navy_broadcast';

export interface PublicDisplaySettings {
  showPublicStandings: boolean;
  showPublicBrackets: boolean;
  showPublicSchedule: boolean;
  showPublicMedalTally: boolean;
  showPublicPlayerStats: boolean;
  tvScoreboardTheme: ScoreboardTheme;
  tvSlideRotationIntervalSeconds: number;
  tvAnimatedWinnerScreen: boolean;
  tvLiveMedalRaceChart: boolean;
  tvAutoMatchRecapCard: boolean;
  notifyScheduleChangesInApp: boolean;
  notifyScheduleChangesEmail: boolean;
  notifyFinalResultsInApp: boolean;
  notifyFinalResultsEmail: boolean;
  notifyUpcomingGamesMinutesBefore: number;
}

// ── 8. System & Data Management ───────────────────────────────────────────────

export type PrivacyLevel = 'name_only' | 'name_and_department' | 'full_profile';

export interface SchoolBranding {
  schoolName: string;
  campusName: string;
  tournamentTitle: string;
  logoUrl: string;
  primaryColor: string; // e.g. "#dc2626"
  accentColor: string;  // e.g. "#f59e0b"
  themeMode: 'dark' | 'light' | 'auto';
  timeZone: string;     // e.g. "Asia/Manila"
  locale: string;       // e.g. "en-PH"
}

export interface SystemSettings {
  autoBackupDaily: boolean;
  lastBackupDate?: string;
  dataRetentionMonths: number;
  studentAthletePrivacy: PrivacyLevel;
  branding: SchoolBranding;
  allowCsvBulkImport: boolean;
}

// ── Master App Settings Object ────────────────────────────────────────────────

export interface AppSettings {
  version: string;
  lastUpdated: string;
  updatedBy: string;
  sportsCompetition: SportsCompetitionSettings;
  rosterRules: RosterRulesSettings;
  statsMetrics: StatsMetricsSettings;
  scoring: ScoringSettings;
  security: SecuritySettings;
  dashboards: DashboardSettings;
  publicDisplay: PublicDisplaySettings;
  system: SystemSettings;
}

// Runtime safeguard for ESM bundlers
export const AppSettings = {};

