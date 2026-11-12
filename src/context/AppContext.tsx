import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isPlaceholder, getRoundName } from '../lib/bracket';
import { getSportName } from '../lib/sports';
import { sendEmailViaOfficialApi, type EmailDispatchResult } from '../lib/emailApi';
import type { AppSettings } from '../types/settings';
import {
  getSettings,
  updateSettings as updateStoredSettings,
  resetSettings as resetStoredSettings,
  resetSection as resetStoredSection,
} from '../services/settingsService';

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}
import type {
  User, UserRole, TournamentEvent, TournamentFormat, Match, GameOfficial,
  Player, Team, Department, Division, Venue,
  AuditLog, AuditAction, Announcement,
  StandingsRow, MedalTallyRow,
  StaffMember, StaffRole, StaffStatus,
  StaffInvitation, InvitationStatus,
  AccessRequest,
} from '../types';

function generateOfficialPassword(role: 'coordinator' | 'scorer'): string {
  const prefix = role === 'coordinator' ? 'CO' : 'SK';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `Padula2026!${prefix}-${rand}`;
}

function createStaffInvitationRecord(params: {
  recipientName: string;
  recipientEmail: string;
  role: 'director' | 'coordinator' | 'scorer';
  assignedSportOrDept: string;
  generatedPassword: string;
  sentBy: string;
  sentByEmail: string;
}): StaffInvitation {
  const roleTitle = params.role === 'director'
    ? 'Sports Director'
    : params.role === 'coordinator'
    ? 'Sports Coordinator'
    : 'Official Scorekeeper';
  const subject = `[Asian College Padula 2026] Official Appointment & Portal Credentials — ${roleTitle}`;
  const letterBody = [
    `Dear ${params.recipientName},`,
    ``,
    `Greetings from the Asian College Padula Athletics Governance Board!`,
    ``,
    params.role === 'director'
      ? `You have been officially commissioned by the Board of Trustees and Office of the President to serve as Sports Director for the Asian College Padula Intramurals 2026.`
      : `You have been officially registered and appointed by Sports Director ${params.sentBy} (${params.sentByEmail}) to serve as ${roleTitle} (${params.assignedSportOrDept}) for the Asian College Padula Intramurals 2026.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OFFICIAL PORTAL LOGIN CREDENTIALS`,
    `• Registered Email: ${params.recipientEmail}`,
    `• Assigned Password: ${params.generatedPassword}`,
    `• Official Role: ${roleTitle}`,
    `• Assigned Scope: ${params.assignedSportOrDept}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `ACTION REQUIRED — ACCEPT OR DECLINE INVITATION:`,
    `Please confirm your appointment by selecting [Accept Invitation] below (or on the Staff Login Portal using your email and password above) to activate your account, or select [Decline Invitation] if you are unable to serve.`,
    ``,
    `Sincerely,`,
    `${params.sentBy}`,
    `Sports Director (${params.sentByEmail})`,
    `Asian College Dumaguete — Padula Athletics`,
  ].join('\n');

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail.toLowerCase(),
    role: params.role,
    roleTitle,
    assignedSportOrDept: params.assignedSportOrDept,
    generatedPassword: params.generatedPassword,
    status: 'pending',
    sentBy: params.sentBy,
    sentByEmail: params.sentByEmail,
    sentAt: new Date().toISOString(),
    subject,
    letterBody,
  };
}

// ── Context shape ─────────────────────────────────────────────────────────────
interface AppContextType {
  // Auth & Staff Access Control
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  staff: StaffMember[];
  staffInvitations: StaffInvitation[];
  latestInvitation: StaffInvitation | null;
  clearLatestInvitation: () => void;
  respondToInvitation: (invitationId: string, decision: 'accepted' | 'declined') => StaffInvitation | null;
  dispatchInvitationViaApi: (invitationId: string, customRecipientEmail?: string) => Promise<{ success: boolean; result?: EmailDispatchResult; error?: string }>;
  verifyAndSignInStaff: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User; pendingInvitation?: StaffInvitation }>;
  addCoordinator: (name: string, email: string, competitionId: string) => Promise<{ success: boolean; error?: string; invitation?: StaffInvitation }>;
  addScorer: (name: string, email: string, matchIds?: string[], sport?: string) => Promise<{ success: boolean; error?: string; invitation?: StaffInvitation }>;
  deactivateStaff: (staffId: string) => Promise<void>;
  removeStaff: (staffId: string) => Promise<void>;

  // Access Requests (from Login Portal to Sports Director)
  accessRequests: AccessRequest[];
  submitAccessRequest: (data: {
    name: string;
    email: string;
    role: 'coordinator' | 'scorer';
    sportOrDept: string;
    note: string;
  }) => AccessRequest;
  approveAccessRequest: (requestId: string) => Promise<{ success: boolean; error?: string; password?: string }>;
  declineAccessRequest: (requestId: string, reason?: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => AppSettings;
  resetSettings: () => AppSettings;
  resetSettingsSection: <K extends keyof AppSettings>(sectionKey: K) => AppSettings;

  registeredUsers: User[];
  registerUser: (user: User) => StaffInvitation | null;
  toggleUserStatus: (userId: string, active: boolean) => void;
  removeUser: (userId: string) => void;
  toggleOfficialStatus: (officialId: string, active: boolean) => void;
  removeOfficial: (officialId: string) => void;
  togglePlayerStatus: (playerId: string, active: boolean) => void;
  toggleTeamStatus: (teamId: string, active: boolean) => void;
  removeTeam: (teamId: string) => void;

  // Supabase connection status
  isSupabaseConnected: boolean;

  // Navigation
  activeView: string;
  setActiveView: (view: string) => void;

  // Core data
  events: TournamentEvent[];
  setEvents: (events: TournamentEvent[]) => void;
  matches: Match[];
  officials: GameOfficial[];
  players: Player[];
  teams: Team[];
  departments: Department[];
  divisions: Division[];
  venues: Venue[];
  announcements: Announcement[];
  auditLogs: AuditLog[];

  // Officials
  registerOfficial: (official: Omit<GameOfficial, 'id'>) => void;
  assignMatchOfficials: (matchId: string, assignments: {
    venue?: string; referee?: string; scorekeeper?: string; coachA?: string; coachB?: string; manager?: string;
  }) => void;

  // Scoring & Match Workflow
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, details?: any) => void;
  submitMatchScore: (matchId: string) => Promise<void>;
  finalizeMatchScore: (matchId: string) => Promise<void>;
  correctMatchScore: (matchId: string, scoreA: number, scoreB: number, reason: string) => Promise<void>;
  startMatch: (matchId: string) => void;
  finishMatch: (
    matchId: string,
    finalizedBy?: string,
    isOverride?: boolean,
    finalScores?: { scoreA: number; scoreB: number },
    advanceTarget?: { nextMatchId: string | null; nextSlot?: 'A' | 'B' }
  ) => { success: boolean; message?: string };
  advanceTeamToBracketSlot: (
    teamName: string,
    targetMatchId: string,
    targetSlot: 'A' | 'B',
    sourceMatchId?: string
  ) => { success: boolean; message?: string };
  reopenMatch: (matchId: string) => void;

  // Mock Test Mode & Demo Seeder
  isMockMode: boolean;
  signInMockAccount: (email: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  deleteMockData: () => Promise<void>;
  seedDemoData: () => void;
  clearAllMatches: () => void;
  deleteMatch: (id: string) => void;

  // Event management
  createEvent: (event: Omit<TournamentEvent, 'id' | 'bracket'>) => string;
  updateEvent: (id: string, updates: Partial<TournamentEvent>) => void;
  publishEvent: (id: string) => void;
  archiveEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
  deleteBracket: (eventIdOrSport: string) => void;
  generateBracket: (eventId: string, teamIds?: string[], forceRegenerate?: boolean, formatOverride?: TournamentFormat) => void;

  // Teams & Players
  registerTeam: (team: Omit<Team, 'id'>) => string;
  registerPlayer: (player: Omit<Player, 'id'>) => string;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  // Setup entities
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  removeDepartment: (id: string) => void;
  addDivision: (div: Omit<Division, 'id'>) => void;
  removeDivision: (id: string) => void;
  addVenue: (venue: Omit<Venue, 'id'>) => void;
  removeVenue: (id: string) => void;

  // Announcements
  postAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'>) => void;
  deleteAnnouncement: (id: string) => void;

  // Computed
  computeStandings: (sportId: string) => StandingsRow[];
  computeMedalTally: () => MedalTallyRow[];

  // Audit
  addAuditLog: (
    action: AuditAction,
    details: string,
    entityId?: string,
    entityType?: string,
    actingUser?: { id: string; name: string; role: UserRole },
    beforeValue?: string,
    afterValue?: string
  ) => void;
}

const AppContext = createContext<AppContextType | null>(null);

import { isMockModeActive } from '../lib/config';

import {
  INITIAL_DEPARTMENTS,
  INITIAL_VENUES,
  INITIAL_DIVISIONS,
  INITIAL_OFFICIALS,
  INITIAL_TEAMS,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT,
  INITIAL_USERS,
  INITIAL_STAFF,
  INITIAL_STAFF_INVITATIONS,
  INITIAL_ACCESS_REQUESTS,
  MOCK_VENUE,
  MOCK_DEPARTMENTS,
  PUBLIC_GUEST_USER,
  uid,
} from '../data/seed';

export { PUBLIC_GUEST_USER };

const isMockActive = isMockModeActive();
const isMockDeleted = typeof window !== 'undefined' && localStorage.getItem('padula_mock_data_deleted') === 'true';
const shouldInjectMock = isMockActive && !isMockDeleted;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Always start on the Public View as a guest spectator when opening the system
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('public');
  const [isSupabaseConnected, setIsConnected] = useState(false);

  // Settings State
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());

  const handleUpdateSettings = (partial: Partial<AppSettings>): AppSettings => {
    const updated = updateStoredSettings(partial, currentUser?.name || 'Staff User');
    setSettingsState(updated);
    return updated;
  };

  const handleResetSettings = (): AppSettings => {
    const reset = resetStoredSettings(currentUser?.name || 'Staff User');
    setSettingsState(reset);
    return reset;
  };

  const handleResetSection = <K extends keyof AppSettings>(sectionKey: K): AppSettings => {
    const reset = resetStoredSection(sectionKey, currentUser?.name || 'Staff User');
    setSettingsState(reset);
    return reset;
  };

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const stored = localStorage.getItem('padula_staff');
      if (stored) {
        const parsed: StaffMember[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove mock/legacy director accounts and ensure the official Director & Demo Accounts are present
          const cleaned = parsed.filter(s =>
            !s.isMock &&
            !s.email?.includes('mock.') &&
            !s.email?.includes('j.lee@') &&
            !s.email?.includes('demo.director@') &&
            !s.email?.includes('john.samane@') &&
            !['staff-1', 'staff-2', 'staff-3', 'staff-4'].includes(s.id)
          );
          const merged = [...INITIAL_STAFF];
          cleaned.forEach(s => {
            if (!merged.some(m => m.email.toLowerCase() === s.email?.toLowerCase() || m.id === s.id)) {
              merged.push(s);
            }
          });
          localStorage.setItem('padula_staff', JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return INITIAL_STAFF;
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('padula_registered_users');
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove mock/legacy director accounts and ensure the official Director & Demo Accounts are present
          const cleaned = parsed.filter(u =>
            !u.isMock &&
            !u.email?.includes('mock.') &&
            !u.email?.includes('demo.director@') &&
            !u.email?.includes('john.samane@') &&
            !['u1', 'u2', 'u3', 'u4'].includes(u.id) &&
            !u.username?.includes('jordan') &&
            !u.username?.includes('sam.chen') &&
            !u.username?.includes('maria.santos')
          );
          const merged = [...INITIAL_USERS];
          cleaned.forEach(u => {
            if (!merged.some(m => m.email.toLowerCase() === u.email?.toLowerCase() || m.id === u.id)) {
              merged.push(u);
            }
          });
          localStorage.setItem('padula_registered_users', JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return INITIAL_USERS;
  });

  const [events, setEvents] = useState<TournamentEvent[]>(() => {
    try {
      const stored = localStorage.getItem('padula_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(e => !['e1', 'e2', 'mock-ev-1'].includes(e.id) && !e.isMock && !e.id?.startsWith('mock-'));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return INITIAL_EVENTS;
  });
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const stored = localStorage.getItem('padula_matches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const legacyNames = ['alex park', 'padula smashers', 'tiger spinners', 'marcus vance'];
          const filtered = parsed.filter(m =>
            !['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'].includes(m.id) &&
            !m.isMock &&
            !m.id?.startsWith('mock-') &&
            !m.isBye &&
            !legacyNames.includes((m.teamA || '').toLowerCase()) &&
            !legacyNames.includes((m.teamB || '').toLowerCase()) &&
            !legacyNames.includes((m.winner || '').toLowerCase())
          );
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return INITIAL_MATCHES;
  });
  const [officials, setOfficials] = useState<GameOfficial[]>(() => {
    try {
      const stored = localStorage.getItem('padula_officials');
      if (stored) {
        const parsed: GameOfficial[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(o =>
            !o.id?.startsWith('off-sk-') && !o.id?.startsWith('off-ch-') && !o.id?.startsWith('off-mg-') && !o.id?.startsWith('off-rf-') && !o.isMock
          );
          const merged = [...INITIAL_OFFICIALS];
          filtered.forEach(o => {
            if (!merged.some(m => m.id === o.id || m.name.toLowerCase() === o.name?.toLowerCase())) {
              merged.push(o);
            }
          });
          localStorage.setItem('padula_officials', JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return INITIAL_OFFICIALS;
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = localStorage.getItem('padula_players');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(p => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id) && !p.isMock && !p.id?.startsWith('mock-'));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return INITIAL_PLAYERS;
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const stored = localStorage.getItem('padula_teams');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(t => !['t1', 't2', 't3', 't4', 't5', 't6'].includes(t.id) && !t.isMock && !t.id?.startsWith('mock-'));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return INITIAL_TEAMS;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    return shouldInjectMock ? [...INITIAL_DEPARTMENTS, ...MOCK_DEPARTMENTS] : INITIAL_DEPARTMENTS;
  });
  const [divisions, setDivisions] = useState<Division[]>(INITIAL_DIVISIONS);
  const [venues, setVenues] = useState<Venue[]>(() => {
    return shouldInjectMock ? [MOCK_VENUE, ...INITIAL_VENUES] : INITIAL_VENUES;
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const stored = localStorage.getItem('padula_announcements');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(a => !['ann1', 'ann2', 'mock-ann-1'].includes(a.id));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return INITIAL_ANNOUNCEMENTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT);
  const [staffInvitations, setStaffInvitations] = useState<StaffInvitation[]>(() => {
    try {
      const stored = localStorage.getItem('padula_staff_invitations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          INITIAL_STAFF_INVITATIONS.forEach(init => {
            const idx = merged.findIndex(i => i.recipientEmail.toLowerCase() === init.recipientEmail.toLowerCase());
            if (idx === -1) {
              merged.push(init);
            } else if (init.recipientEmail.toLowerCase() === 'jsamane@asiancollege.edu.ph') {
              merged[idx] = {
                ...merged[idx],
                generatedPassword: 'padulaAdmin2026',
                role: 'director',
                roleTitle: 'Sports Director',
              };
            }
          });
          return merged;
        }
      }
    } catch {}
    return INITIAL_STAFF_INVITATIONS;
  });
  const [latestInvitation, setLatestInvitation] = useState<StaffInvitation | null>(null);
  const clearLatestInvitation = useCallback(() => setLatestInvitation(null), []);

  useEffect(() => {
    try { localStorage.setItem('padula_staff_invitations', JSON.stringify(staffInvitations)); } catch {}
  }, [staffInvitations]);

  // ── Access Requests State (Login Portal -> Sports Director Desk) ───────────
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    try {
      const stored = localStorage.getItem('padula_access_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ACCESS_REQUESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('padula_access_requests', JSON.stringify(accessRequests));
    } catch {}
  }, [accessRequests]);
  const lastScoreEntryTimeRef = useRef<Record<string, number>>({});
  const eventsRef = useRef<TournamentEvent[]>(events);
  const teamsRef = useRef<Team[]>(teams);
  eventsRef.current = events;
  teamsRef.current = teams;

  // Persist core tournament entities to localStorage so state survives reloads
  useEffect(() => {
    try { localStorage.setItem('padula_events', JSON.stringify(events)); } catch {}
  }, [events]);
  useEffect(() => {
    try { localStorage.setItem('padula_matches', JSON.stringify(matches)); } catch {}
  }, [matches]);
  useEffect(() => {
    try { localStorage.setItem('padula_teams', JSON.stringify(teams)); } catch {}
  }, [teams]);
  useEffect(() => {
    try { localStorage.setItem('padula_players', JSON.stringify(players)); } catch {}
  }, [players]);
  useEffect(() => {
    try { localStorage.setItem('padula_announcements', JSON.stringify(announcements)); } catch {}
  }, [announcements]);

  // â”€â”€ 1. Fetch initial data from Supabase if tables exist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseData() {
      try {
        // Test connection
        const { error: connError } = await supabase.from('departments').select('id').limit(1);
        if (connError) {
          // Table might not exist yet, but client is valid
          setIsConnected(true);
          return;
        }

        setIsConnected(true);

        // Load tables in parallel
        const [
          deptRes, venueRes, divRes, offRes,
          teamRes, playRes, matchRes, annRes, auditRes, eventRes, userRes
        ] = await Promise.all([
          supabase.from('departments').select('*'),
          supabase.from('venues').select('*'),
          supabase.from('divisions').select('*'),
          supabase.from('officials').select('*'),
          supabase.from('teams').select('*'),
          supabase.from('players').select('*'),
          supabase.from('matches').select('*'),
          supabase.from('announcements').select('*'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
          supabase.from('tournament_events').select('*'),
          supabase.from('users').select('*'),
        ]);

        if (!isMounted) return;

        if (deptRes.data && deptRes.data.length > 0) {
          setDepartments(deptRes.data.map(d => ({
            id: d.id, name: d.name, shortName: d.short_name, color: d.color,
          })));
        }
        if (venueRes.data && venueRes.data.length > 0) {
          setVenues(venueRes.data.map(v => ({
            id: v.id, name: v.name, capacity: v.capacity, location: v.location, sports: v.sports || [],
          })));
        }
        if (divRes.data && divRes.data.length > 0) {
          setDivisions(divRes.data.map(dv => ({
            id: dv.id, name: dv.name, sportId: dv.sport_id,
          })));
        }
        if (offRes.data && offRes.data.length > 0) {
          const fromDb = offRes.data.map(o => ({
            id: o.id, name: o.name, role: o.role, sport: o.sport,
            affiliation: o.affiliation, licenseId: o.license_id, contact: o.contact, assignedGameId: o.assigned_game_id,
          }));
          const mergedOff = [...INITIAL_OFFICIALS];
          fromDb.forEach(o => {
            if (!mergedOff.some(m => m.id === o.id || m.name.toLowerCase() === o.name?.toLowerCase())) {
              mergedOff.push(o);
            }
          });
          setOfficials(mergedOff);
        }
        if (teamRes.data && teamRes.data.length > 0) {
          const validTeams = teamRes.data.filter(t => !['t1', 't2', 't3', 't4', 't5', 't6'].includes(t.id) && !t.id?.startsWith('mock-'));
          setTeams(validTeams.map(t => ({
            id: t.id, name: t.name, sport: t.sport, department: t.department,
            division: t.division, coach: t.coach, seed: undefined, color: t.color, players: t.players || [],
          })));
        }
        if (playRes.data && playRes.data.length > 0) {
          const validPlayers = playRes.data.filter(p => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id) && !p.id?.startsWith('mock-'));
          setPlayers(validPlayers.map(p => ({
            id: p.id, name: p.name, studentId: p.student_id, department: p.department,
            sport: p.sport, teamId: p.team_id, jerseyNumber: p.jersey_number,
            position: p.position, gwa: p.gwa ? Number(p.gwa) : undefined, medicalCleared: p.medical_cleared,
          })));
        }
        if (matchRes.data && matchRes.data.length > 0) {
          const legacyIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
          const legacyNames = ['alex park', 'padula smashers', 'tiger spinners', 'marcus vance'];
          const toDeleteIds = matchRes.data
            .filter(m =>
              legacyIds.includes(m.id) ||
              m.id?.startsWith('mock-') ||
              m.is_bye === true ||
              legacyNames.includes((m.team_a || '').toLowerCase()) ||
              legacyNames.includes((m.team_b || '').toLowerCase()) ||
              legacyNames.includes((m.winner || '').toLowerCase())
            )
            .map(m => m.id);
          if (toDeleteIds.length > 0) {
            supabase.from('matches').delete().in('id', toDeleteIds).then();
          }
          const validMatches = matchRes.data.filter(m => !toDeleteIds.includes(m.id));
          setMatches(validMatches.map(m => ({
            id: m.id, eventId: m.event_id, sport: m.sport, division: m.division, teamA: m.team_a, teamB: m.team_b,
            scoreA: m.score_a, scoreB: m.score_b, status: m.status, venue: m.venue, round: m.round,
            roundNumber: m.round_number, slot: m.slot, matchNumber: m.match_number, scheduledTime: m.scheduled_time,
            nextMatchId: m.next_match_id, nextSlot: m.next_slot,
            winner: m.winner, referee: m.referee, scorekeeper: m.scorekeeper,
            coachA: m.coach_a, coachB: m.coach_b, manager: m.manager,
            finalizedBy: m.finalized_by, finalizedAt: m.finalized_at, isBye: false, scorerId: m.scorer_id,
            conflictWarning: m.status === 'finished' ? undefined : m.conflict_warning,
          })));
        }
        if (annRes.data && annRes.data.length > 0) {
          setAnnouncements(annRes.data.map(a => ({
            id: a.id, title: a.title, body: a.body, priority: a.priority,
            createdAt: a.created_at, createdBy: a.created_by,
          })));
        }
        if (auditRes.data && auditRes.data.length > 0) {
          setAuditLogs(auditRes.data.map(al => ({
            id: al.id, action: al.action, userId: al.user_id, userName: al.user_name,
            userRole: al.user_role, details: al.details, timestamp: al.created_at,
            entityId: al.entity_id, entityType: al.entity_type,
          })));
        }
        if (eventRes && eventRes.data && eventRes.data.length > 0) {
          setEvents(eventRes.data.map(e => ({
            id: e.id, name: e.name, sport: e.sport, division: e.division, category: e.category,
            dates: e.dates, startDate: e.start_date, endDate: e.end_date, venue: e.venue,
            status: e.status, archived: e.archived, archivedAt: e.archived_at, bracket: [],
          })));
        }
        if (userRes && userRes.data && userRes.data.length > 0) {
          const fromDb = userRes.data.map(u => ({
            id: u.id, name: u.name, role: u.role, username: u.username, email: u.email,
            password: u.password, department: u.department, assignedSport: u.assigned_sport,
            avatarInitials: u.avatar_initials, gmailVerified: u.gmail_verified,
            isActive: u.is_active, isDefaultPassword: u.is_default_password,
          }));
          const mergedUsers = [...INITIAL_USERS];
          fromDb.forEach(u => {
            if (!u.email?.includes('mock.') && !mergedUsers.some(m => m.email.toLowerCase() === u.email?.toLowerCase())) {
              mergedUsers.push(u);
            }
          });
          setRegisteredUsers(mergedUsers);
        }
      } catch (err) {
        console.warn('Supabase initialization notice (offline fallback active):', err);
      }
    }

    initSupabaseData();

    // â”€â”€ 2. Realtime subscription for Matches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const matchChannel = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, payload => {
        if (!isMounted) return;
        const newOrUpdated = payload.new as Record<string, any>;
        if (!newOrUpdated || !newOrUpdated.id) return;

        const updatedMatch: Match = {
          id: newOrUpdated.id,
          eventId: newOrUpdated.event_id,
          sport: newOrUpdated.sport,
          division: newOrUpdated.division,
          teamA: newOrUpdated.team_a,
          teamB: newOrUpdated.team_b,
          scoreA: newOrUpdated.score_a,
          scoreB: newOrUpdated.score_b,
          status: newOrUpdated.status,
          venue: newOrUpdated.venue,
          round: newOrUpdated.round,
          roundNumber: newOrUpdated.round_number,
          slot: newOrUpdated.slot,
          matchNumber: newOrUpdated.match_number,
          scheduledTime: newOrUpdated.scheduled_time,
          nextMatchId: newOrUpdated.next_match_id,
          nextSlot: newOrUpdated.next_slot,
          winner: newOrUpdated.winner,
          referee: newOrUpdated.referee,
          scorekeeper: newOrUpdated.scorekeeper,
          coachA: newOrUpdated.coach_a,
          coachB: newOrUpdated.coach_b,
          manager: newOrUpdated.manager,
          finalizedBy: newOrUpdated.finalized_by,
          finalizedAt: newOrUpdated.finalized_at,
          isBye: newOrUpdated.is_bye,
          scorerId: newOrUpdated.scorer_id,
          conflictWarning: newOrUpdated.status === 'finished' ? undefined : newOrUpdated.conflict_warning,
        };

        setMatches(prev => {
          const exists = prev.some(m => m.id === updatedMatch.id);
          if (exists) {
            return prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
          }
          return [updatedMatch, ...prev];
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(matchChannel);
    };
  }, []);

  // ── Audit helper (with deduplication & before/after support) ──────────────
  const lastAuditRef = useRef<{ key: string; ts: number }>({ key: '', ts: 0 });
  const addAuditLog = useCallback((
    action: AuditAction,
    details: string,
    entityId?: string,
    entityType?: string,
    actingUser?: { id: string; name: string; role: UserRole },
    beforeValue?: string,
    afterValue?: string
  ) => {
    const userToRecord = actingUser || currentUser;
    const userId = userToRecord?.id ?? 'system';
    const dedupKey = `${action}::${userId}::${details}`;
    const nowMs = Date.now();
    if (lastAuditRef.current.key === dedupKey && nowMs - lastAuditRef.current.ts < 2500) {
      return; // Prevent duplicate double-writes at the same second
    }
    lastAuditRef.current = { key: dedupKey, ts: nowMs };

    const newLog: AuditLog = {
      id: uid('al'),
      action,
      userId,
      userName:   userToRecord?.name ?? 'System',
      userRole:   userToRecord?.role ?? 'guest',
      details,
      timestamp:  new Date(nowMs).toISOString(),
      entityId,
      entityType,
      beforeValue,
      afterValue,
    };

    setAuditLogs(prev => {
      // Also guard against identical action+details within 2 seconds at the head of state
      const head = prev[0];
      if (
        head &&
        head.action === newLog.action &&
        head.userId === newLog.userId &&
        head.details === newLog.details &&
        Math.abs(new Date(head.timestamp).getTime() - nowMs) < 2500
      ) {
        return prev;
      }
      return [newLog, ...prev];
    });

    // Async push to Supabase
    supabase.from('audit_logs').insert([{
      id: newLog.id,
      action: newLog.action,
      user_id: newLog.userId,
      user_name: newLog.userName,
      user_role: newLog.userRole,
      details: newLog.details,
      entity_id: newLog.entityId,
      entity_type: newLog.entityType,
      created_at: newLog.timestamp,
    }]).then(({ error }) => {
      if (error) console.debug('Audit log Supabase save (local retained):', error.message);
    });
  }, [currentUser]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const setCurrentUser = useCallback((user: User | null) => {
    const prev = currentUser;
    setCurrentUserState(user);

    if (user && user.role !== 'guest') {
      try {
        localStorage.setItem('padula_current_user', JSON.stringify(user));
      } catch {}
      addAuditLog(
        'login',
        `${user.role === 'director' ? 'Sports Director' : user.role === 'coordinator' ? 'Sports Coordinator' : 'Official Scorer'} ${user.name} logged in`,
        user.id,
        'User',
        { id: user.id, name: user.name, role: user.role }
      );
    } else {
      try {
        localStorage.removeItem('padula_current_user');
      } catch {}
      if (prev && prev.role !== 'guest') {
        addAuditLog(
          'logout',
          `${prev.role === 'director' ? 'Sports Director' : prev.role === 'coordinator' ? 'Sports Coordinator' : 'Official Scorer'} ${prev.name} logged out`,
          prev.id,
          'User',
          { id: prev.id, name: prev.name, role: prev.role }
        );
      }
    }
  }, [currentUser, addAuditLog]);

  const registerUser = useCallback((newUser: User): StaffInvitation | null => {
    const cleanEmail = (newUser.email || '').trim().toLowerCase();
    let createdInvitation: StaffInvitation | null = null;

    if (newUser.role === 'coordinator' || newUser.role === 'scorer') {
      const safePassword = newUser.password && newUser.password !== 'padulaAdmin2026'
        ? newUser.password
        : generateOfficialPassword(newUser.role);
      const generatedPassword = cleanEmail === 'jsamane@asiancollege.edu.ph' ? 'padulaAdmin2026' : safePassword;
      const deptObj = departments.find(d => d.id === newUser.department);
      const assignedScope = newUser.assignedSport
        ? getSportName(newUser.assignedSport)
        : (deptObj ? `${deptObj.shortName} — ${deptObj.name}` : (newUser.department || 'All Sports'));

      createdInvitation = createStaffInvitationRecord({
        recipientName: newUser.name.trim(),
        recipientEmail: cleanEmail,
        role: newUser.role,
        assignedSportOrDept: assignedScope,
        generatedPassword,
        sentBy: currentUser?.name || 'Mr. John Eric Samane',
        sentByEmail: currentUser?.email || 'jsamane@asiancollege.edu.ph',
      });

      const inv = createdInvitation;
      setStaffInvitations(prev => {
        const updated = [inv, ...prev.filter(i => i.recipientEmail.toLowerCase() !== cleanEmail)];
        try { localStorage.setItem('padula_staff_invitations', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setLatestInvitation(inv);

      const enrichedUser: User = {
        ...newUser,
        email: cleanEmail,
        password: generatedPassword,
        invitationStatus: 'pending',
        invitationId: inv.id,
        status: 'pending',
        isActive: true,
      };

      setRegisteredUsers(prev => {
        const updated = [enrichedUser, ...prev.filter(u => u.email?.toLowerCase() !== cleanEmail)];
        try { localStorage.setItem('padula_registered_users', JSON.stringify(updated)); } catch {}
        return updated;
      });

      const newStaffMember: StaffMember = {
        id: enrichedUser.id,
        name: enrichedUser.name,
        email: cleanEmail,
        role: newUser.role,
        assignedCompetitionId: enrichedUser.assignedCompetitionId || enrichedUser.assignedSport || enrichedUser.department,
        status: 'pending',
        password: generatedPassword,
        invitationStatus: 'pending',
        invitationId: inv.id,
        addedBy: currentUser?.email || 'jsamane@asiancollege.edu.ph',
        createdAt: new Date().toISOString(),
      };

      setStaff(prev => {
        const updated = [newStaffMember, ...prev.filter(s => s.email?.toLowerCase() !== cleanEmail)];
        try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (newUser.role === 'scorer') {
        setOfficials(prev => {
          const updated = prev.map(o =>
            (o.role === 'scorekeeper' && (o.contact?.toLowerCase() === cleanEmail || o.name.toLowerCase() === enrichedUser.name.toLowerCase()))
              ? { ...o, contact: cleanEmail, password: generatedPassword, invitationStatus: 'pending' as InvitationStatus, invitationId: inv.id }
              : o
          );
          try { localStorage.setItem('padula_officials', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }

      addAuditLog(
        'account_add',
        `Registered ${inv.roleTitle} ${enrichedUser.name} (${cleanEmail}) and sent invitation letter with temporary password`,
        enrichedUser.id,
        'User'
      );
      return inv;
    }

    setRegisteredUsers(prev => {
      const updated = [newUser, ...prev.filter(u => u.email?.toLowerCase() !== cleanEmail)];
      try {
        localStorage.setItem('padula_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditLog('login', `Account registered: ${newUser.name} (${newUser.email}) - ${newUser.role}`);
    return null;
  }, [currentUser, departments, addAuditLog]);

  const respondToInvitation = useCallback((invitationId: string, decision: 'accepted' | 'declined'): StaffInvitation | null => {
    const targetInv = staffInvitations.find(i => i.id === invitationId);
    if (!targetInv) return null;

    const nowIso = new Date().toISOString();
    const updatedInv: StaffInvitation = {
      ...targetInv,
      status: decision,
      respondedAt: nowIso,
    };

    setStaffInvitations(prev => {
      const updated = prev.map(i => i.id === invitationId ? updatedInv : i);
      try { localStorage.setItem('padula_staff_invitations', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (latestInvitation?.id === invitationId) {
      setLatestInvitation(updatedInv);
    }

    const emailLower = targetInv.recipientEmail.toLowerCase();
    const isAccepted = decision === 'accepted';
    const nextStaffStatus: StaffStatus = isAccepted ? 'active' : 'disabled';

    setStaff(prev => {
      const updated = prev.map(s =>
        s.email.toLowerCase() === emailLower || s.invitationId === invitationId
          ? { ...s, status: nextStaffStatus, invitationStatus: decision }
          : s
      );
      try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setRegisteredUsers(prev => {
      const updated = prev.map(u =>
        u.email?.toLowerCase() === emailLower || u.invitationId === invitationId
          ? { ...u, status: nextStaffStatus, isActive: isAccepted, invitationStatus: decision }
          : u
      );
      try { localStorage.setItem('padula_registered_users', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setOfficials(prev => {
      const updated = prev.map(o =>
        (o.contact?.toLowerCase() === emailLower || o.invitationId === invitationId || o.name.toLowerCase() === targetInv.recipientName.toLowerCase())
          ? { ...o, isActive: isAccepted, invitationStatus: decision }
          : o
      );
      try { localStorage.setItem('padula_officials', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (!isAccepted && targetInv.role === 'scorer') {
      // Free scheduled match slots if scorekeeper declined invitation
      const nameLower = targetInv.recipientName.toLowerCase();
      setMatches(prev => prev.map(m =>
        m.status === 'scheduled' && m.scorekeeper?.toLowerCase() === nameLower
          ? { ...m, scorekeeper: undefined, scorerId: undefined }
          : m
      ));
    }

    addAuditLog(
      isAccepted ? 'account_add' : 'account_deactivate',
      `${targetInv.roleTitle} ${targetInv.recipientName} (${targetInv.recipientEmail}) ${decision.toUpperCase()} the appointment invitation`,
      targetInv.id,
      'Staff'
    );

    return updatedInv;
  }, [staffInvitations, latestInvitation, addAuditLog]);

  const dispatchInvitationViaApi = useCallback(async (
    invitationId: string,
    customRecipientEmail?: string
  ): Promise<{ success: boolean; result?: EmailDispatchResult; error?: string }> => {
    const targetInv = staffInvitations.find(i => i.id === invitationId) || (latestInvitation?.id === invitationId ? latestInvitation : null);
    if (!targetInv) {
      return { success: false, error: 'Appointment invitation record not found.' };
    }

    const cleanRecipientEmail = (customRecipientEmail || targetInv.recipientEmail).trim().toLowerCase();
    const senderName = currentUser?.name || targetInv.sentBy || 'Mr. John Eric Samane';
    const senderEmail = currentUser?.email || targetInv.sentByEmail || 'jsamane@asiancollege.edu.ph';

    try {
      const result = await sendEmailViaOfficialApi({
        to: cleanRecipientEmail,
        toName: targetInv.recipientName,
        fromName: senderName,
        fromEmail: senderEmail,
        subject: targetInv.subject,
        body: targetInv.letterBody,
        roleTitle: targetInv.roleTitle,
        assignedScope: targetInv.assignedSportOrDept,
        tempPassword: targetInv.generatedPassword,
        invitationId: targetInv.id,
      });

      const updatedInv: StaffInvitation = {
        ...targetInv,
        dispatchedViaApi: true,
        dispatchedToEmail: cleanRecipientEmail,
        apiDeliveryStatus: 'sent',
        apiTransactionId: result.transactionId,
        apiDispatchedAt: result.timestamp,
        apiProvider: result.provider,
      };

      setStaffInvitations(prev => {
        const updated = prev.map(i => i.id === invitationId ? updatedInv : i);
        try { localStorage.setItem('padula_staff_invitations', JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (latestInvitation?.id === invitationId) {
        setLatestInvitation(updatedInv);
      }

      addAuditLog(
        'email_dispatch',
        `Official appointment letter dispatched via Gmail API to ${cleanRecipientEmail} (Sender: ${senderName} <${senderEmail}>, Provider: ${result.provider}, Ref: ${result.transactionId})`,
        invitationId,
        'StaffInvitation'
      );

      return { success: true, result };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to dispatch email via API.';
      return { success: false, error: errMsg };
    }
  }, [staffInvitations, latestInvitation, currentUser, addAuditLog]);

  const toggleUserStatus = useCallback((userId: string, active: boolean) => {
    if (!currentUser || currentUser.role !== 'director') {
      console.warn('Security: Only Sports Director can deactivate/activate user accounts.');
      return;
    }
    setRegisteredUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, isActive: active } : u);
      try {
        localStorage.setItem('padula_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditLog('login', `User account ${active ? 'activated' : 'deactivated'} for user ID: ${userId}`, userId, 'User');
  }, [currentUser, addAuditLog]);

  const removeUser = useCallback((userId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can remove user accounts.');
      return;
    }
    if (userId === currentUser.id) {
      console.warn('Cannot delete currently signed-in account.');
      return;
    }
    const target = registeredUsers.find(u => u.id === userId);
    setRegisteredUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      try {
        localStorage.setItem('padula_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (target) {
      setStaff(prev => {
        const updated = prev.filter(s => s.id !== userId && s.email.toLowerCase() !== target.email?.toLowerCase());
        try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setOfficials(prev => {
        const updated = prev.filter(o => o.id !== userId && o.contact?.toLowerCase() !== target.email?.toLowerCase() && o.name.toLowerCase() !== target.name.toLowerCase());
        try { localStorage.setItem('padula_officials', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
    supabase.from('users').delete().eq('id', userId).then();
    supabase.from('staff').delete().eq('id', userId).then();
    addAuditLog('account_remove', `Deleted user account: ${target?.name || userId} (${target?.email || ''})`, userId, 'User');
  }, [currentUser, registeredUsers, addAuditLog]);

  const toggleOfficialStatus = useCallback((officialId: string, active: boolean) => {
    setOfficials(prev => {
      const updated = prev.map(o => o.id === officialId ? { ...o, isActive: active } : o);
      try {
        localStorage.setItem('padula_officials', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditLog('official_register', `Official ${active ? 'activated' : 'deactivated'} (ID: ${officialId})`, officialId, 'GameOfficial');
  }, [addAuditLog]);

  const removeOfficial = useCallback((officialId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can remove officials.');
      return;
    }
    const target = officials.find(o => o.id === officialId);
    setOfficials(prev => {
      const updated = prev.filter(o => o.id !== officialId);
      try {
        localStorage.setItem('padula_officials', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (target) {
      if (target.role === 'scorekeeper') {
        setRegisteredUsers(prev => {
          const updated = prev.filter(u =>
            u.id !== officialId &&
            !(u.role === 'scorer' && (u.name.toLowerCase() === target.name.toLowerCase() || (target.contact && u.email.toLowerCase() === target.contact.toLowerCase())))
          );
          try { localStorage.setItem('padula_registered_users', JSON.stringify(updated)); } catch {}
          return updated;
        });
        setStaff(prev => {
          const updated = prev.filter(s =>
            s.id !== officialId &&
            !(s.role === 'scorer' && (s.name.toLowerCase() === target.name.toLowerCase() || (target.contact && s.email.toLowerCase() === target.contact.toLowerCase())))
          );
          try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
      // Unassign official from any scheduled/live matches
      setMatches(prev => prev.map(m => {
        if (m.status === 'finished') return m;
        const nameLower = target.name.toLowerCase();
        return {
          ...m,
          referee: m.referee?.toLowerCase() === nameLower ? undefined : m.referee,
          scorekeeper: m.scorekeeper?.toLowerCase() === nameLower ? undefined : m.scorekeeper,
          coachA: m.coachA?.toLowerCase() === nameLower ? undefined : m.coachA,
          coachB: m.coachB?.toLowerCase() === nameLower ? undefined : m.coachB,
          manager: m.manager?.toLowerCase() === nameLower ? undefined : m.manager,
        };
      }));
    }
    supabase.from('officials').delete().eq('id', officialId).then();
    addAuditLog('official_register', `Removed ${target?.role || 'official'}: ${target?.name || officialId}`, officialId, 'GameOfficial');
  }, [currentUser, officials, addAuditLog]);

  const togglePlayerStatus = useCallback((playerId: string, active: boolean) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isActive: active } : p));
    addAuditLog('player_register', `Player ${active ? 'activated' : 'deactivated'} (ID: ${playerId})`, playerId, 'Player');
  }, [addAuditLog]);

  const toggleTeamStatus = useCallback((teamId: string, active: boolean) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, isActive: active } : t));
    addAuditLog('team_register', `Team ${active ? 'activated' : 'deactivated'} (ID: ${teamId})`, teamId, 'Team');
  }, [addAuditLog]);

  const removeTeam = useCallback((teamId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can remove teams.');
      return;
    }
    const target = teams.find(t => t.id === teamId);
    teamsRef.current = teamsRef.current.filter(t => t.id !== teamId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setPlayers(prev => prev.map(p => p.teamId === teamId ? { ...p, teamId: '' } : p));
    if (target) {
      // Clear deleted team from any unstarted scheduled matches so the slot returns to TBD
      setMatches(prev => prev.map(m => {
        if (m.status !== 'scheduled') return m;
        const matchA = m.teamA === target.name;
        const matchB = m.teamB === target.name;
        if (!matchA && !matchB) return m;
        const updatedA = matchA ? 'TBD' : m.teamA;
        const updatedB = matchB ? 'TBD' : m.teamB;
        supabase.from('matches').update({ team_a: updatedA, team_b: updatedB }).eq('id', m.id).then();
        return { ...m, teamA: updatedA, teamB: updatedB };
      }));
    }
    supabase.from('teams').delete().eq('id', teamId).then();
    addAuditLog('team_register', `Removed team: ${target?.name || teamId}`, teamId, 'Team');
  }, [currentUser, teams, addAuditLog]);

  // ── Staff & Access Control Management ─────────────────────────────────────
  const verifyAndSignInStaff = useCallback(async (email: string, password?: string): Promise<{ success: boolean; error?: string; user?: User; pendingInvitation?: StaffInvitation }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Google Institutional Domain Enforcement (@asiancollege.edu.ph)
    if (!cleanEmail.endsWith('@asiancollege.edu.ph')) {
      addAuditLog('denied_access', `Access denied: non-institutional domain (${cleanEmail})`, undefined, 'Auth');
      return {
        success: false,
        error: "Only official @asiancollege.edu.ph Google accounts are permitted."
      };
    }

    // 2. Fetch latest staff from Supabase if connected, always preserving the 3 Demo Accounts + registeredUsers
    let currentStaffList = [...INITIAL_STAFF];
    staff.forEach(s => {
      if (!currentStaffList.some(m => m.email.toLowerCase() === s.email.toLowerCase())) {
        currentStaffList.push(s);
      }
    });
    registeredUsers.forEach(u => {
      if ((u.role === 'director' || u.role === 'coordinator' || u.role === 'scorer') && u.email && !currentStaffList.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
        currentStaffList.push({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          assignedCompetitionId: u.assignedCompetitionId || u.assignedSport || u.department,
          status: u.status || (u.isActive === false ? 'disabled' : 'active'),
          password: u.password,
          invitationStatus: u.invitationStatus,
          invitationId: u.invitationId,
        });
      }
    });
    try {
      const { data, error } = await supabase.from('staff').select('*');
      if (!error && data && data.length > 0) {
        data.forEach((d: any) => {
          if (d.email && !d.email.includes('mock.') && !currentStaffList.some(m => m.email.toLowerCase() === d.email.toLowerCase())) {
            currentStaffList.push({
              id: d.id,
              email: d.email,
              name: d.name,
              role: d.role as StaffRole,
              assignedCompetitionId: d.assigned_competition_id,
              assignedMatchIds: d.assigned_match_ids,
              status: d.status as StaffStatus,
              addedBy: d.added_by,
              createdAt: d.created_at,
              lastLoginAt: d.last_login_at,
            });
          }
        });
        setStaff(currentStaffList);
        try { localStorage.setItem('padula_staff', JSON.stringify(currentStaffList)); } catch {}
      }
    } catch {}

    // 3. Find record
    const member = currentStaffList.find(s => s.email.toLowerCase() === cleanEmail);
    const matchingInvite = staffInvitations.find(i => i.recipientEmail.toLowerCase() === cleanEmail);

    if (matchingInvite && matchingInvite.status === 'declined') {
      return {
        success: false,
        error: 'You have declined this appointment invitation. Contact Sports Director Mr. John Eric Samane (jsamane@asiancollege.edu.ph) if you wish to be re-invited.',
      };
    }

    if (!member || member.status === 'disabled') {
      addAuditLog('denied_access', `Access denied: Unapproved Google account ${cleanEmail} attempted portal sign-in`, undefined, 'Auth');
      return {
        success: false,
        error: "Your account isn't approved yet. Contact the Sports Director or click 'Request Access' below."
      };
    }

    const DIRECTOR_EMAIL = 'jsamane@asiancollege.edu.ph';
    const DIRECTOR_FIXED_PASSWORD = 'padulaAdmin2026';
    const isDirectorAccount = cleanEmail === DIRECTOR_EMAIL || member.role === 'director';

    // ── Strict rule: "only the sports director can use it" ──
    if (password && password.trim() === DIRECTOR_FIXED_PASSWORD && !isDirectorAccount) {
      addAuditLog('failed_login', `Unauthorized director password attempt from ${cleanEmail}`, undefined, 'Auth');
      return {
        success: false,
        error: 'This password is reserved exclusively for Sports Director Mr. John Eric Samane. Please enter your own assigned invitation password.',
      };
    }

    // Check password if this account was issued an invitation password
    if (isDirectorAccount) {
      if (password !== undefined && password.trim() !== '') {
        if (password.trim() !== DIRECTOR_FIXED_PASSWORD) {
          addAuditLog('failed_login', `Invalid Sports Director password attempt from ${cleanEmail}`, undefined, 'Auth');
          return {
            success: false,
            error: 'Invalid password. Please enter the correct Sports Director password.',
          };
        }
      }
    } else {
      const expectedPassword = member.password || matchingInvite?.generatedPassword;
      if (expectedPassword && password !== undefined && password.trim() !== '') {
        if (password.trim() !== expectedPassword) {
          addAuditLog('failed_login', `Invalid password attempt for ${cleanEmail}`, undefined, 'Auth');
          return {
            success: false,
            error: 'Invalid password. Please enter the password sent to your registered email invitation letter.',
          };
        }
      }
    }

    // If the user has a pending invitation and hasn't accepted yet (and didn't pass password yet), surface the invitation
    if (matchingInvite && matchingInvite.status === 'pending' && (!password || password.trim() === '')) {
      return {
        success: false,
        pendingInvitation: matchingInvite,
        error: 'Please review your appointment letter, enter your assigned password, and accept or decline the invitation to continue.',
      };
    }

    // Auto-accept pending invitation upon valid password sign-in
    if (matchingInvite && matchingInvite.status === 'pending') {
      respondToInvitation(matchingInvite.id, 'accepted');
    }

    // 4. Update status from 'pending' to 'active' on first sign-in
    const updatedStatus: StaffStatus = 'active';
    const nowIso = new Date().toISOString();

    const updatedMember: StaffMember = {
      ...member,
      status: updatedStatus,
      invitationStatus: 'accepted',
      lastLoginAt: nowIso,
    };

    setStaff(prev => {
      const updated = prev.map(s => s.id === member.id ? updatedMember : s);
      try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}
      return updated;
    });

    supabase.from('staff').update({
      status: updatedStatus,
      last_login_at: nowIso,
    }).eq('id', member.id).then();

    const loggedUser: User = {
      id: member.id,
      name: member.name,
      role: member.role,
      username: member.email.split('@')[0],
      email: member.email,
      assignedCompetitionId: member.assignedCompetitionId,
      assignedMatchIds: member.assignedMatchIds,
      status: updatedStatus,
      invitationStatus: 'accepted',
      isActive: true,
      gmailVerified: true,
      avatarInitials: member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    };

    setCurrentUser(loggedUser);
    addAuditLog('login', `Successful Google authentication for ${member.role} ${member.name} (${cleanEmail})`, member.id, 'User');

    // Role-based destination redirect
    const requestedPage = typeof window !== 'undefined' ? sessionStorage.getItem('padula_requested_page') : null;
    if (requestedPage) {
      sessionStorage.removeItem('padula_requested_page');
      setActiveView(requestedPage);
    } else if (member.role === 'director' || member.role === 'coordinator') {
      setActiveView('admin');
    } else {
      setActiveView('scorekeeper');
    }

    return { success: true, user: loggedUser };
  }, [staff, registeredUsers, staffInvitations, respondToInvitation, setCurrentUser, setActiveView, addAuditLog]);

  const addCoordinator = useCallback(async (name: string, email: string, competitionId: string) => {
    if (!currentUser || currentUser.role !== 'director') {
      return { success: false, error: 'Unauthorized: Only Sports Director can add coordinators.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@asiancollege.edu.ph')) {
      return { success: false, error: 'Must use an @asiancollege.edu.ph email address.' };
    }
    if (staff.some(s => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A staff member with this email already exists.' };
    }

    const generatedPassword = generateOfficialPassword('coordinator');
    const invitation = createStaffInvitationRecord({
      recipientName: name.trim(),
      recipientEmail: cleanEmail,
      role: 'coordinator',
      assignedSportOrDept: getSportName(competitionId),
      generatedPassword,
      sentBy: currentUser.name || 'Mr. John Eric Samane',
      sentByEmail: currentUser.email || 'jsamane@asiancollege.edu.ph',
    });

    setStaffInvitations(prev => {
      const u = [invitation, ...prev.filter(i => i.recipientEmail.toLowerCase() !== cleanEmail)];
      try { localStorage.setItem('padula_staff_invitations', JSON.stringify(u)); } catch {}
      return u;
    });
    setLatestInvitation(invitation);

    const newStaff: StaffMember = {
      id: `staff-coord-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'coordinator',
      assignedCompetitionId: competitionId,
      status: 'pending',
      password: generatedPassword,
      invitationStatus: 'pending',
      invitationId: invitation.id,
      addedBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    const updated = [newStaff, ...staff];
    setStaff(updated);
    try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}

    supabase.from('staff').insert([{
      id: newStaff.id,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      assigned_competition_id: newStaff.assignedCompetitionId,
      status: newStaff.status,
      added_by: newStaff.addedBy,
      created_at: newStaff.createdAt,
    }]).then();

    addAuditLog('account_add', `Added Sports Coordinator ${newStaff.name} (${cleanEmail}) for competition ${competitionId} and sent invitation letter`, newStaff.id, 'Staff');
    return { success: true, invitation };
  }, [currentUser, staff, addAuditLog]);

  const addScorer = useCallback(async (name: string, email: string, matchIds?: string[], sport?: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      return { success: false, error: 'Unauthorized: Only Coordinators or Director can add scorers.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@asiancollege.edu.ph')) {
      return { success: false, error: 'Must use an @asiancollege.edu.ph email address.' };
    }
    if (staff.some(s => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A staff member with this email already exists.' };
    }

    const generatedPassword = generateOfficialPassword('scorer');
    const invitation = createStaffInvitationRecord({
      recipientName: name.trim(),
      recipientEmail: cleanEmail,
      role: 'scorer',
      assignedSportOrDept: sport || 'Basketball',
      generatedPassword,
      sentBy: currentUser.name || 'Mr. John Eric Samane',
      sentByEmail: currentUser.email || 'jsamane@asiancollege.edu.ph',
    });

    setStaffInvitations(prev => {
      const u = [invitation, ...prev.filter(i => i.recipientEmail.toLowerCase() !== cleanEmail)];
      try { localStorage.setItem('padula_staff_invitations', JSON.stringify(u)); } catch {}
      return u;
    });
    setLatestInvitation(invitation);

    const assignedComp = currentUser.role === 'coordinator' ? currentUser.assignedCompetitionId : undefined;
    const newStaff: StaffMember = {
      id: `staff-scorer-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'scorer',
      assignedCompetitionId: assignedComp,
      assignedMatchIds: matchIds || [],
      status: 'pending',
      password: generatedPassword,
      invitationStatus: 'pending',
      invitationId: invitation.id,
      addedBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    const updated = [newStaff, ...staff];
    setStaff(updated);
    try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}

    // Also register as official so they appear in dropdowns, Officials Hub, and Scoring Desk!
    const newOfficial: GameOfficial = {
      id: `off-sk-${Date.now()}`,
      name: name.trim(),
      role: 'scorekeeper',
      sport: sport || 'Basketball',
      affiliation: 'Athletic Board',
      licenseId: `PAD-SK-${Date.now().toString().slice(-4)}`,
      contact: cleanEmail,
      password: generatedPassword,
      invitationStatus: 'pending',
      invitationId: invitation.id,
      isActive: true,
    };
    setOfficials(prev => {
      const u = [newOfficial, ...prev];
      try { localStorage.setItem('padula_officials', JSON.stringify(u)); } catch {}
      return u;
    });

    supabase.from('staff').insert([{
      id: newStaff.id,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      assigned_competition_id: newStaff.assignedCompetitionId,
      assigned_match_ids: newStaff.assignedMatchIds,
      status: newStaff.status,
      added_by: newStaff.addedBy,
      created_at: newStaff.createdAt,
    }]).then();

    supabase.from('officials').insert([{
      id: newOfficial.id,
      name: newOfficial.name,
      role: newOfficial.role,
      sport: newOfficial.sport,
      affiliation: newOfficial.affiliation,
      license_id: newOfficial.licenseId,
      contact: newOfficial.contact,
    }]).then();

    // Automatically assign the newly registered scorekeeper to matches in their sport
    const targetSportLower = (sport || 'All Sports').toLowerCase();
    setMatches(prev => prev.map(m => {
      if (m.status === 'finished') return m;
      const mSportNameLower = getSportName(m.sport).toLowerCase();
      const sportMatches =
        targetSportLower === 'all sports' ||
        targetSportLower === 'general' ||
        m.sport.toLowerCase() === targetSportLower ||
        mSportNameLower === targetSportLower;
      if (!sportMatches) return m;

      const shouldAssign =
        (matchIds && matchIds.includes(m.id)) ||
        !m.scorekeeper ||
        m.scorekeeper === 'Unassigned' ||
        m.scorekeeper === 'Demo Scorekeeper';
      if (!shouldAssign) return m;

      supabase.from('matches').update({
        scorekeeper: newOfficial.name,
        scorer_id: newOfficial.id,
      }).eq('id', m.id).then();

      return { ...m, scorekeeper: newOfficial.name, scorerId: newOfficial.id };
    }));

    addAuditLog('account_add', `Added Official Scorer ${newStaff.name} (${cleanEmail}) and sent invitation letter`, newStaff.id, 'Staff');
    return { success: true, invitation };
  }, [currentUser, staff, addAuditLog]);

  const deactivateStaff = useCallback(async (staffId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) return;
    const target = staff.find(s => s.id === staffId);
    if (!target) return;
    if (currentUser.role === 'coordinator' && target.role !== 'scorer') return;

    const nextStatus: StaffStatus = target.status === 'disabled' ? 'active' : 'disabled';
    const updated = staff.map(s => s.id === staffId ? { ...s, status: nextStatus } : s);
    setStaff(updated);
    try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}

    supabase.from('staff').update({ status: nextStatus }).eq('id', staffId).then();

    addAuditLog('account_deactivate', `${nextStatus === 'disabled' ? 'Deactivated' : 'Reactivated'} staff account ${target.name} (${target.email})`, staffId, 'Staff');

    // Immediate session termination if deactivated user is current user
    if (currentUser.id === staffId && nextStatus === 'disabled') {
      setCurrentUser(null);
      setActiveView('public');
    }
  }, [currentUser, staff, addAuditLog, setCurrentUser, setActiveView]);

  const removeStaff = useCallback(async (staffId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) return;
    const target = staff.find(s => s.id === staffId);
    if (!target) return;
    if (currentUser.role === 'coordinator' && target.role !== 'scorer') return;

    const updated = staff.filter(s => s.id !== staffId);
    setStaff(updated);
    try { localStorage.setItem('padula_staff', JSON.stringify(updated)); } catch {}

    supabase.from('staff').delete().eq('id', staffId).then();
    addAuditLog('account_remove', `Removed staff member ${target.name} (${target.email})`, staffId, 'Staff');

    if (currentUser.id === staffId) {
      setCurrentUser(null);
      setActiveView('public');
    }
  }, [currentUser, staff, addAuditLog, setCurrentUser, setActiveView]);

  // ── Access Request Handlers (Directly received & managed by Sports Director) ──
  const submitAccessRequest = useCallback((data: {
    name: string;
    email: string;
    role: 'coordinator' | 'scorer';
    sportOrDept: string;
    note: string;
  }): AccessRequest => {
    const cleanEmail = data.email.trim().toLowerCase();
    const newReq: AccessRequest = {
      id: `req-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      sportOrDept: data.sportOrDept,
      note: data.note.trim(),
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    setAccessRequests(prev => {
      const updated = [newReq, ...prev.filter(r => r.email.toLowerCase() !== cleanEmail || r.status !== 'pending')];
      try { localStorage.setItem('padula_access_requests', JSON.stringify(updated)); } catch {}
      return updated;
    });

    addAuditLog(
      'request_access',
      `Access request submitted by ${data.name} (${cleanEmail}) for ${data.role} (${data.sportOrDept}). Note: "${data.note || 'N/A'}"`,
      newReq.id,
      'Staff'
    );

    return newReq;
  }, [addAuditLog]);

  const approveAccessRequest = useCallback(async (requestId: string): Promise<{ success: boolean; error?: string; password?: string }> => {
    const req = accessRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Access request not found.' };

    const genPassword = `Padula2026!${req.role === 'coordinator' ? 'CO' : 'SK'}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Add staff member if not already registered
    if (req.role === 'coordinator') {
      await addCoordinator(req.name, req.email, req.sportOrDept);
    } else {
      await addScorer(req.name, req.email, [], req.sportOrDept);
    }

    const updatedReq: AccessRequest = {
      ...req,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Mr. John Eric Samane',
      generatedPassword: genPassword,
    };

    setAccessRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? updatedReq : r);
      try { localStorage.setItem('padula_access_requests', JSON.stringify(updated)); } catch {}
      return updated;
    });

    addAuditLog(
      'approve_access',
      `Sports Director approved access request for ${req.name} (${req.email}) as ${req.role} for ${req.sportOrDept}. Credentials issued.`,
      requestId,
      'Director'
    );

    return { success: true, password: genPassword };
  }, [accessRequests, currentUser, addCoordinator, addScorer, addAuditLog]);

  const declineAccessRequest = useCallback((requestId: string, reason?: string) => {
    const req = accessRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReq: AccessRequest = {
      ...req,
      status: 'declined',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Mr. John Eric Samane',
      note: reason ? `${req.note ? req.note + ' | ' : ''}Decline reason: ${reason}` : req.note,
    };

    setAccessRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? updatedReq : r);
      try { localStorage.setItem('padula_access_requests', JSON.stringify(updated)); } catch {}
      return updated;
    });

    addAuditLog(
      'decline_access',
      `Sports Director declined access request for ${req.name} (${req.email}). Reason: ${reason || 'Not specified'}`,
      requestId,
      'Director'
    );
  }, [accessRequests, currentUser, addAuditLog]);

  const seedDemoData = useCallback(() => {
    setEvents(INITIAL_EVENTS);
    eventsRef.current = INITIAL_EVENTS;
    setTeams(INITIAL_TEAMS);
    teamsRef.current = INITIAL_TEAMS;
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setOfficials(INITIAL_OFFICIALS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAuditLogs(INITIAL_AUDIT);
    setDepartments(INITIAL_DEPARTMENTS);
    setVenues(INITIAL_VENUES);
    setDivisions(INITIAL_DIVISIONS);
    try {
      localStorage.setItem('padula_events', JSON.stringify(INITIAL_EVENTS));
      localStorage.setItem('padula_teams', JSON.stringify(INITIAL_TEAMS));
      localStorage.setItem('padula_players', JSON.stringify(INITIAL_PLAYERS));
      localStorage.setItem('padula_matches', JSON.stringify(INITIAL_MATCHES));
      localStorage.setItem('padula_officials', JSON.stringify(INITIAL_OFFICIALS));
      localStorage.setItem('padula_announcements', JSON.stringify(INITIAL_ANNOUNCEMENTS));
      localStorage.removeItem('padula_mock_data_deleted');
    } catch {}
    addAuditLog(
      'event_create',
      'Loaded realistic Padula 2026 tournament demo dataset (BAA Falcons, CSE Titans, HTM Chefs, DPD Vanguards, SHS Royals across 6 competitions).',
      'pad-ev-1',
      'TournamentEvent'
    );
  }, [addAuditLog]);

  // ── Demo Account Sign-In ──────────────────────────────────────────────────
  const signInMockAccount = useCallback(async (demoEmail: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = demoEmail.trim().toLowerCase();
    const allStaff = [...INITIAL_STAFF, ...staff];
    let member = allStaff.find(s => s.email.toLowerCase() === cleanEmail);
    if (!member) {
      if (cleanEmail.includes('director')) member = INITIAL_STAFF.find(s => s.id === 'demo-director') || INITIAL_STAFF.find(s => s.role === 'director');
      else if (cleanEmail.includes('coordinator')) member = INITIAL_STAFF.find(s => s.role === 'coordinator');
      else if (cleanEmail.includes('scorer') || cleanEmail.includes('scorekeeper')) member = INITIAL_STAFF.find(s => s.role === 'scorer');
    }

    if (!member || member.status === 'disabled') {
      return {
        success: false,
        error: "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.",
      };
    }

    // Automatically reset sample tournament data when entering demo mode
    seedDemoData();

    const isDemoRole = cleanEmail.startsWith('demo.') || member.isMock || cleanEmail.includes('mock');
    const demoDisplayName = member.role === 'director'
      ? 'Demo Director'
      : member.role === 'coordinator'
      ? 'Demo Coordinator'
      : 'Demo Scorer';

    const loggedUser: User = {
      id: member.id,
      name: isDemoRole ? demoDisplayName : member.name,
      role: member.role,
      username: member.email.split('@')[0],
      email: isDemoRole ? `demo.${member.role}@asiancollege.edu.ph` : member.email,
      assignedCompetitionId: member.assignedCompetitionId || 's1',
      assignedMatchIds: member.assignedMatchIds,
      status: member.status,
      isActive: true,
      gmailVerified: true,
      isMock: true,
      avatarInitials: member.role === 'director' ? 'DD' : member.role === 'coordinator' ? 'DC' : 'DS',
    };

    setCurrentUser(loggedUser);
    addAuditLog('login', `Entered Demo Mode as ${demoDisplayName} (Sample Dataset Active)`, member.id, 'User');

    if (member.role === 'director' || member.role === 'coordinator') {
      setActiveView('admin');
    } else {
      setActiveView('scorekeeper');
    }

    return { success: true, user: loggedUser };
  }, [staff, setCurrentUser, setActiveView, seedDemoData, addAuditLog]);

  const deleteMockData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'director') {
      console.warn('Security: Only Sports Director can purge mock data.');
      return;
    }

    // 1. Remove all records marked isMock = true
    setStaff(prev => prev.filter(s => !s.isMock));
    setEvents(prev => prev.filter(e => !e.isMock));
    setVenues(prev => prev.filter(v => !v.isMock));
    setDepartments(prev => prev.filter(d => !d.isMock));
    setTeams(prev => prev.filter(t => !t.isMock));
    setPlayers(prev => prev.filter(p => !p.isMock));
    setMatches(prev => prev.filter(m => !m.isMock));
    setAnnouncements(prev => prev.filter(a => !a.isMock));
    setOfficials(prev => prev.filter(o => !o.isMock));
    setAuditLogs(prev => prev.filter(al => !al.isMock && !al.userName.toLowerCase().includes('mock')));

    // 2. Persist purge flag in localStorage
    try {
      localStorage.setItem('padula_mock_data_deleted', 'true');
      localStorage.removeItem('padula_mock_mode');
    } catch {}

    // 3. Log audit trail
    addAuditLog('delete_mock_data', 'Sports Director purged all mock accounts, matches, teams, and sample data.', undefined, 'System');

    // 4. If current user is a mock account, immediately terminate session
    if (currentUser.isMock || currentUser.email.endsWith('@mock.test')) {
      setCurrentUser(null);
      setActiveView('public');
    }
  }, [currentUser, addAuditLog, setCurrentUser, setActiveView]);

  const clearAllMatches = useCallback(() => {
    setMatches([]);
    try {
      localStorage.removeItem('padula_offline_queue');
    } catch {}
    supabase.from('matches').delete().neq('id', 'keep_none').then();
    addAuditLog('sensitive_action', 'Sports Director purged all active matches to test fresh bracket registration.', undefined, 'System');
  }, [addAuditLog]);

  const deleteMatch = useCallback((id: string) => {
    const target = matches.find(m => m.id === id);
    setMatches(prev => prev.filter(m => m.id !== id));
    supabase.from('matches').delete().eq('id', id).then();
    addAuditLog('sensitive_action', `Deleted match: ${target ? `${target.teamA} vs ${target.teamB}` : id}`, id, 'Match');
  }, [matches, addAuditLog]);

  // ── Match Scoring Workflow ───────────────────────────────────────────────
  const submitMatchScore = useCallback(async (matchId: string) => {
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;

    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'submitted' as any } : m));
    supabase.from('matches').update({ status: 'submitted' }).eq('id', matchId).then();

    addAuditLog('score_update', `Scorer submitted final match scores for ${targetMatch.teamA} (${targetMatch.scoreA}) vs ${targetMatch.teamB} (${targetMatch.scoreB}). Waiting for Coordinator / Director finalization.`, matchId, 'Match');
  }, [matches, addAuditLog]);

  const correctMatchScore = useCallback(async (matchId: string, scoreA: number, scoreB: number, reason: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) return;
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;

    if (scoreA === scoreB) {
      console.warn('Cannot correct score to a tie for a knockout match.');
      return;
    }

    // If finished and next match has already started, cannot change winner
    const winningTeam = scoreA > scoreB ? targetMatch.teamA : targetMatch.teamB;
    if (targetMatch.status === 'finished' && targetMatch.nextMatchId) {
      const nextM = matches.find(m => m.id === targetMatch.nextMatchId);
      if (nextM && (nextM.status === 'live' || nextM.status === 'finished')) {
        console.warn('Cannot correct score: the next round match has already started or completed.');
        return;
      }
    }

    const oldScoreStr = `${targetMatch.teamA} ${targetMatch.scoreA} – ${targetMatch.scoreB} ${targetMatch.teamB}`;
    const newScoreStr = `${targetMatch.teamA} ${scoreA} – ${scoreB} ${targetMatch.teamB}`;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          scoreA,
          scoreB,
          winner: targetMatch.status === 'finished' ? winningTeam : m.winner,
          correctionHistory: [
            ...(m.correctionHistory || []),
            {
              timestamp: new Date().toISOString(),
              by: currentUser.name,
              oldScore: `${targetMatch.scoreA}–${targetMatch.scoreB}`,
              newScore: `${scoreA}–${scoreB}`,
              reason,
            },
          ],
        };
      }
      if (targetMatch.status === 'finished' && targetMatch.nextMatchId && m.id === targetMatch.nextMatchId) {
        return {
          ...m,
          teamA: targetMatch.nextSlot === 'A' ? winningTeam : m.teamA,
          teamB: targetMatch.nextSlot === 'B' ? winningTeam : m.teamB,
        };
      }
      return m;
    }));

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      winner: targetMatch.status === 'finished' ? winningTeam : targetMatch.winner,
    }).eq('id', matchId).then();

    if (targetMatch.status === 'finished' && targetMatch.nextMatchId && targetMatch.nextSlot) {
      const field = targetMatch.nextSlot === 'A' ? 'team_a' : 'team_b';
      supabase.from('matches').update({ [field]: winningTeam }).eq('id', targetMatch.nextMatchId).then();
    }

    addAuditLog(
      'score_correct',
      `Corrected score for ${targetMatch.teamA} vs ${targetMatch.teamB} from [${targetMatch.scoreA}-${targetMatch.scoreB}] to [${scoreA}-${scoreB}]. Reason: ${reason}`,
      matchId,
      'Match',
      undefined,
      oldScoreStr,
      newScoreStr
    );
  }, [currentUser, matches, addAuditLog]);

  // â”€â”€ Officials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const registerOfficial = useCallback((officialData: Omit<GameOfficial, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator' && currentUser.role !== 'scorer')) {
      console.warn('Security: Only Director/Coordinator/Scorer can register officials.');
      return;
    }
    const newOfficial: GameOfficial = { ...officialData, id: uid('off') };
    setOfficials(prev => {
      const updated = [newOfficial, ...prev];
      try {
        localStorage.setItem('padula_officials', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditLog('official_register', `Registered ${officialData.role}: ${officialData.name}`, newOfficial.id, 'GameOfficial');

    supabase.from('officials').insert([{
      id: newOfficial.id,
      name: newOfficial.name,
      role: newOfficial.role,
      sport: newOfficial.sport,
      affiliation: newOfficial.affiliation,
      license_id: newOfficial.licenseId,
      contact: newOfficial.contact,
    }]).then();

    // Automatically assign newly registered scorekeeper or referee to open match slots in their sport
    if (newOfficial.role === 'scorekeeper' || newOfficial.role === 'referee') {
      const offSportLower = (newOfficial.sport || 'All Sports').toLowerCase();
      setMatches(prev => prev.map(m => {
        if (m.status === 'finished') return m;
        const mSportNameLower = getSportName(m.sport).toLowerCase();
        const matchesSport =
          offSportLower === 'all sports' ||
          offSportLower === 'general' ||
          m.sport.toLowerCase() === offSportLower ||
          mSportNameLower === offSportLower;
        if (!matchesSport) return m;

        if (newOfficial.role === 'scorekeeper') {
          const isUnassignedOrDemo = !m.scorekeeper || m.scorekeeper === 'Unassigned' || m.scorekeeper === 'Demo Scorekeeper';
          if (isUnassignedOrDemo && m.status === 'scheduled') {
            supabase.from('matches').update({
              scorekeeper: newOfficial.name,
              scorer_id: newOfficial.id,
            }).eq('id', m.id).then();
            return { ...m, scorekeeper: newOfficial.name, scorerId: newOfficial.id };
          }
        } else if (newOfficial.role === 'referee') {
          if (!m.referee || m.referee === 'Unassigned') {
            supabase.from('matches').update({ referee: newOfficial.name }).eq('id', m.id).then();
            return { ...m, referee: newOfficial.name };
          }
        }
        return m;
      }));
    }
  }, [currentUser, addAuditLog]);

  const assignMatchOfficials = useCallback((matchId: string, assignments: {
    venue?: string; referee?: string; scorekeeper?: string; coachA?: string; coachB?: string; manager?: string;
  }) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can assign match officials.');
      return;
    }
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;

    const newScorekeeper = assignments.scorekeeper !== undefined ? assignments.scorekeeper : targetMatch.scorekeeper;
    const newVenue = assignments.venue !== undefined ? assignments.venue : targetMatch.venue;
    const scheduledTime = targetMatch.scheduledTime;

    let warning: string | undefined = undefined;
    // Conflict only triggers when both matches have the same non-empty scheduledTime
    if (scheduledTime && targetMatch.status !== 'finished') {
      const conflict = matches.find(m =>
        m.id !== matchId &&
        m.status !== 'finished' &&
        m.scheduledTime &&
        m.scheduledTime === scheduledTime &&
        (
          (newScorekeeper && m.scorekeeper && m.scorekeeper.toLowerCase() === newScorekeeper.toLowerCase()) ||
          (newVenue && m.venue && m.venue.toLowerCase() === newVenue.toLowerCase())
        )
      );
      if (conflict) {
        if (newVenue && conflict.venue && conflict.venue.toLowerCase() === newVenue.toLowerCase()) {
          warning = `Venue conflict: "${newVenue}" is already used by ${conflict.teamA} vs ${conflict.teamB} at the same time.`;
        } else if (newScorekeeper && conflict.scorekeeper && conflict.scorekeeper.toLowerCase() === newScorekeeper.toLowerCase()) {
          warning = `Conflict: ${newScorekeeper} is also assigned to Match ${conflict.teamA} vs ${conflict.teamB} at the same time.`;
        }
      }
    }

    const resolvedWarning = targetMatch.status === 'finished' ? undefined : warning;

    // Update matches locally
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          ...assignments,
          conflictWarning: resolvedWarning,
        };
      }
      return m;
    }));

    addAuditLog('official_assign', `Updated assignments/venue for match ${targetMatch.teamA} vs ${targetMatch.teamB}`, matchId, 'Match');

    const dbPayload: any = {
      conflict_warning: resolvedWarning || null,
    };
    if (assignments.venue !== undefined) dbPayload.venue = assignments.venue;
    if (assignments.scorekeeper !== undefined) dbPayload.scorekeeper = assignments.scorekeeper;
    if (assignments.referee !== undefined) dbPayload.referee = assignments.referee;
    if (assignments.coachA !== undefined) dbPayload.coach_a = assignments.coachA;
    if (assignments.coachB !== undefined) dbPayload.coach_b = assignments.coachB;
    if (assignments.manager !== undefined) dbPayload.manager = assignments.manager;

    supabase.from('matches').update(dbPayload).eq('id', matchId).then();
  }, [currentUser, matches, addAuditLog]);

  // ── Scoring ─────────────────────────────────────────────────────────────
  const updateMatchScore = useCallback((matchId: string, scoreA: number, scoreB: number, details?: any) => {
    // 1. Role permission check: guests and players are strictly read-only
    if (!currentUser || currentUser.role === 'guest' || currentUser.role === 'player') {
      console.warn('Security: Unauthorized score edit rejected. Guests and athletes are read-only.');
      return;
    }

    const prevMatch = matches.find(m => m.id === matchId);
    if (!prevMatch) return;

    // 2. Lock check: finished matches CANNOT be overwritten
    if (prevMatch.status === 'finished') {
      console.warn('Security: Match is finalized and locked. Reopen the match first before updating scores.');
      return;
    }

    // 3. Scorer permission: Official / Demo Scorekeeper can score every available match
    const assignedScorerName = prevMatch.scorekeeper || currentUser.name || 'Demo Scorekeeper';

    // 4. Rate limiting: max 1 update per 150ms per match
    const now = Date.now();
    const lastTime = lastScoreEntryTimeRef.current[matchId] || 0;
    if (now - lastTime < 150) {
      return; // Rate limited
    }
    lastScoreEntryTimeRef.current[matchId] = now;

    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, scoreA, scoreB, status: 'live', scorekeeper: m.scorekeeper || assignedScorerName, ...details } : m
    ));

    const isOverrideScore = (currentUser.role === 'director' || currentUser.role === 'coordinator') &&
      (!prevMatch.scorekeeper || prevMatch.scorekeeper.trim().toLowerCase() !== currentUser.name?.trim().toLowerCase());

    const logAction = isOverrideScore ? 'score_override' : 'score_update';
    const logPrefix = isOverrideScore ? '[OVERRIDE] ' : '';
    const matchName = `${prevMatch.teamA} vs ${prevMatch.teamB}`;

    addAuditLog(
      logAction,
      `${logPrefix}${currentUser.name} updated score for ${matchName}: ${prevMatch.scoreA}–${prevMatch.scoreB} → ${scoreA}–${scoreB}`,
      matchId,
      'Match',
      undefined,
      `${prevMatch.teamA} ${prevMatch.scoreA} – ${prevMatch.scoreB} ${prevMatch.teamB}`,
      `${prevMatch.teamA} ${scoreA} – ${scoreB} ${prevMatch.teamB}`
    );

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'live',
    }).eq('id', matchId).then();
  }, [matches, currentUser, addAuditLog]);

  // ── Announcements (defined early so match/event lifecycle hooks can auto-announce) ──
  const postAnnouncement = useCallback((ann: Omit<Announcement, 'id' | 'createdAt'>) => {
    const id = uid('ann');
    const createdAt = new Date().toISOString();
    setAnnouncements(prev => [{
      ...ann, id, createdAt,
    }, ...prev]);
    addAuditLog('announcement_post', `Posted announcement: ${ann.title}`, id, 'Announcement');

    supabase.from('announcements').insert([{
      id,
      title: ann.title,
      body: ann.body,
      priority: ann.priority,
      created_by: ann.createdBy,
      created_at: createdAt,
    }]).then();
  }, [addAuditLog]);

  const deleteAnnouncement = useCallback((id: string) => {
    const target = announcements.find(a => a.id === id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    supabase.from('announcements').delete().eq('id', id).then();
    addAuditLog('announcement_post', `Deleted announcement: ${target?.title || id}`, id, 'Announcement');
  }, [announcements, addAuditLog]);

  const startMatch = useCallback((matchId: string) => {
    const target = matches.find(m => m.id === matchId);
    if (!target) return;

    // Refuse if either team is a placeholder
    if (isPlaceholder(target.teamA) || isPlaceholder(target.teamB)) {
      console.warn(`Cannot start match ${matchId}: one or both teams are not ready.`);
      return;
    }

    if (target.status === 'finished') {
      console.warn(`Cannot start match ${matchId}: match is already finished.`);
      return;
    }

    const assignedScorerName = target.scorekeeper || currentUser?.name || 'Demo Scorekeeper';

    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'live', scorekeeper: m.scorekeeper || assignedScorerName } : m
    ));
    addAuditLog('match_start', `Match ${matchId} started (${target.teamA} vs ${target.teamB})`, matchId, 'Match');

    const sportLabel = getSportName(target.sport);
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    postAnnouncement({
      title: `Match Starting Now (${sportLabel} · ${target.round}): ${target.teamA} vs ${target.teamB}`,
      body: `${target.teamA} vs ${target.teamB} (${sportLabel} — ${target.round}) has officially started at ${target.venue || 'Main Arena'} (${timeNow}). Official Scorer: ${target.scorekeeper || currentUser?.name || 'Scoring Desk'}.`,
      priority: 'urgent',
      createdBy: currentUser?.name || target.scorekeeper || 'Official Scoring Desk',
      matchId,
      sport: target.sport,
    });

    supabase.from('matches').update({ status: 'live' }).eq('id', matchId).then();
  }, [matches, currentUser, addAuditLog, postAnnouncement]);

  const finishMatch = useCallback((
    matchId: string,
    finalizedBy?: string,
    isOverride?: boolean,
    finalScores?: { scoreA: number; scoreB: number },
    advanceTarget?: { nextMatchId: string | null; nextSlot?: 'A' | 'B' }
  ): { success: boolean; message?: string } => {
    const callerName = finalizedBy || currentUser?.name || 'Official Scorer';
    const callerRole = currentUser?.role || 'scorer';

    const target = matches.find(m => m.id === matchId);
    if (!target) {
      const msg = `Match ${matchId} not found.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    // 1. Rejects if match is already finished
    if (target.status === 'finished') {
      const msg = `Match ${matchId} is already finalized and locked.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    // 2. Rejects placeholder teams
    if (isPlaceholder(target.teamA) || isPlaceholder(target.teamB)) {
      const msg = `Cannot finalize match ${matchId}: both competing teams must be decided before finalizing.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    const scoreA = finalScores !== undefined ? finalScores.scoreA : target.scoreA;
    const scoreB = finalScores !== undefined ? finalScores.scoreB : target.scoreB;

    // 3. Rejects ties and 0-0
    if (scoreA === scoreB) {
      const msg = scoreA === 0
        ? `Cannot finalize match with 0–0 scores. Game results must be entered.`
        : `Cannot finalize match with tied scores (${scoreA}–${scoreB}). A knockout match must have a winner.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    // 4. Permissions check: Scorekeeper can finalize every available match
    const isAssignedScorer = callerRole === 'scorer' || !!(
      target.scorekeeper &&
      target.scorekeeper.trim().toLowerCase() === callerName.trim().toLowerCase()
    );
    const isDirectorOrCoord = callerRole === 'director' || callerRole === 'coordinator';

    if (!isAssignedScorer && !(isDirectorOrCoord && isOverride)) {
      const msg = `Security: Only an Official Scorekeeper can finalize this match.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    // 5. Sets winner = the team with the higher score that the scorer entered
    const winningTeam = scoreA > scoreB ? target.teamA : target.teamB;
    const nowIso = new Date().toISOString();

    // 6. Scorekeeper decides which next-round match & slot the winner advances to
    let nextMatchUpdate: { id: string; slot: 'A' | 'B'; team: string } | null = null;
    if (advanceTarget !== undefined) {
      if (advanceTarget.nextMatchId && advanceTarget.nextSlot) {
        nextMatchUpdate = {
          id: advanceTarget.nextMatchId,
          slot: advanceTarget.nextSlot,
          team: winningTeam,
        };
      }
    } else if (target.nextMatchId && target.nextSlot) {
      nextMatchUpdate = {
        id: target.nextMatchId,
        slot: target.nextSlot,
        team: winningTeam,
      };
    }

    const chosenNextMatchId = nextMatchUpdate ? nextMatchUpdate.id : target.nextMatchId;
    const chosenNextSlot = nextMatchUpdate ? nextMatchUpdate.slot : target.nextSlot;

    setMatches(prev => {
      return prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            scoreA,
            scoreB,
            status: 'finished' as const,
            winner: winningTeam,
            nextMatchId: chosenNextMatchId,
            nextSlot: chosenNextSlot,
            finalizedBy: callerName,
            finalizedAt: nowIso,
            conflictWarning: undefined,
          };
        }
        if (nextMatchUpdate && m.id === nextMatchUpdate.id) {
          return {
            ...m,
            teamA: nextMatchUpdate.slot === 'A' ? nextMatchUpdate.team : m.teamA,
            teamB: nextMatchUpdate.slot === 'B' ? nextMatchUpdate.team : m.teamB,
          };
        }
        return m;
      });
    });

    const isOverrideLog = isDirectorOrCoord && !isAssignedScorer;
    const auditAction = isOverrideLog ? 'score_override' : 'score_finalize';
    const nextMatchObj = nextMatchUpdate ? matches.find(m => m.id === nextMatchUpdate!.id) : undefined;
    const advanceNote = nextMatchUpdate
      ? ` Advanced to ${nextMatchObj?.round || 'Next Round'} (Match #${nextMatchObj?.slot ?? nextMatchObj?.matchNumber ?? ''}, Slot ${nextMatchUpdate.slot}).`
      : '';
    const auditText = isOverrideLog
      ? `[OVERRIDE] Finalized match ${target.teamA} vs ${target.teamB} by ${callerRole} ${callerName}. Final Score: ${scoreA}–${scoreB}. Winner: ${winningTeam}.${advanceNote}`
      : `Finalized match ${target.teamA} vs ${target.teamB} by scorer ${callerName}. Final Score: ${scoreA}–${scoreB}. Winner: ${winningTeam}.${advanceNote}`;

    addAuditLog(auditAction, auditText, matchId, 'Match');

    // Automatically post Post-Match Result Announcement
    const sportLabel = getSportName(target.sport);
    const losingTeam = winningTeam === target.teamA ? target.teamB : target.teamA;
    const isFinalRound = (target.round || '').toLowerCase().includes('final') || (target.round || '').toLowerCase().includes('championship');
    postAnnouncement({
      title: isFinalRound
        ? `${sportLabel} Champion: ${winningTeam} Defeats ${losingTeam} (${scoreA}–${scoreB})!`
        : `Match Result (${sportLabel} · ${target.round}): ${winningTeam} Defeats ${losingTeam} (${scoreA}–${scoreB})`,
      body: `Official final score at ${target.venue || 'Main Arena'}: ${target.teamA} ${scoreA} – ${scoreB} ${target.teamB}. Winner: ${winningTeam} (Finalized by ${callerName}).${advanceNote}`,
      priority: isFinalRound ? 'urgent' : 'normal',
      createdBy: callerName,
      matchId,
      sport: target.sport,
    });

    // If the next-round match now has BOTH competing teams decided, automatically post an Upcoming Match Announcement for it
    if (nextMatchUpdate && nextMatchObj) {
      const updatedNextA = nextMatchUpdate.slot === 'A' ? nextMatchUpdate.team : nextMatchObj.teamA;
      const updatedNextB = nextMatchUpdate.slot === 'B' ? nextMatchUpdate.team : nextMatchObj.teamB;
      if (!isPlaceholder(updatedNextA) && !isPlaceholder(updatedNextB)) {
        postAnnouncement({
          title: `Upcoming Match: ${sportLabel} ${nextMatchObj.round} — ${updatedNextA} vs ${updatedNextB}`,
          body: `Next-round bracket matchup is officially set: ${updatedNextA} vs ${updatedNextB} (${sportLabel} — ${nextMatchObj.round}) at ${nextMatchObj.venue || 'Main Arena'}.`,
          priority: 'normal',
          createdBy: callerName,
          matchId: nextMatchObj.id,
          sport: target.sport,
        });
      }
    }

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'finished',
      winner: winningTeam,
      next_match_id: chosenNextMatchId || null,
      next_slot: chosenNextSlot || null,
      finalized_by: callerName,
      finalized_at: nowIso,
      conflict_warning: null,
    }).eq('id', matchId).then();

    supabase.from('match_score_audits').insert([{
      id: uid('msa'),
      match_id: matchId,
      caller_name: callerName,
      caller_role: callerRole,
      action: isOverrideLog ? 'score_override' : 'score_finalize',
      old_score_a: target.scoreA,
      old_score_b: target.scoreB,
      new_score_a: scoreA,
      new_score_b: scoreB,
      winner: winningTeam,
      created_at: nowIso,
    }]).then();

    if (nextMatchUpdate) {
      const field = nextMatchUpdate.slot === 'A' ? 'team_a' : 'team_b';
      supabase.from('matches').update({
        [field]: nextMatchUpdate.team,
      }).eq('id', nextMatchUpdate.id).then();
    }

    return { success: true };
  }, [matches, currentUser, addAuditLog, postAnnouncement]);

  const advanceTeamToBracketSlot = useCallback((
    teamName: string,
    targetMatchId: string,
    targetSlot: 'A' | 'B',
    sourceMatchId?: string
  ): { success: boolean; message?: string } => {
    if (!currentUser || (currentUser.role !== 'scorer' && currentUser.role !== 'coordinator' && currentUser.role !== 'director')) {
      return { success: false, message: 'Only Official Scorers, Coordinators, or the Sports Director can place teams into bracket slots.' };
    }
    const targetMatch = matches.find(m => m.id === targetMatchId);
    if (!targetMatch) {
      return { success: false, message: 'Target bracket match not found.' };
    }
    if (targetMatch.status === 'live' || targetMatch.status === 'finished') {
      return { success: false, message: 'Cannot change bracket slot: the target match has already started or finished.' };
    }

    const updatedA = targetSlot === 'A' ? teamName : targetMatch.teamA;
    const updatedB = targetSlot === 'B' ? teamName : targetMatch.teamB;

    setMatches(prev => prev.map(m => {
      if (m.id === targetMatchId) {
        return {
          ...m,
          teamA: updatedA,
          teamB: updatedB,
        };
      }
      if (sourceMatchId && m.id === sourceMatchId) {
        return {
          ...m,
          nextMatchId: targetMatchId,
          nextSlot: targetSlot,
        };
      }
      return m;
    }));

    const field = targetSlot === 'A' ? 'team_a' : 'team_b';
    supabase.from('matches').update({ [field]: teamName }).eq('id', targetMatchId).then();
    if (sourceMatchId) {
      supabase.from('matches').update({ next_match_id: targetMatchId, next_slot: targetSlot }).eq('id', sourceMatchId).then();
    }

    addAuditLog(
      'score_update',
      `Scorekeeper ${currentUser.name} placed "${teamName}" into ${targetMatch.round} (Match #${targetMatch.slot ?? targetMatch.matchNumber ?? ''}, Slot ${targetSlot})`,
      targetMatchId,
      'Match'
    );

    if (!isPlaceholder(updatedA) && !isPlaceholder(updatedB)) {
      const sportLabel = getSportName(targetMatch.sport);
      postAnnouncement({
        title: `Upcoming Match: ${sportLabel} ${targetMatch.round} — ${updatedA} vs ${updatedB}`,
        body: `Matchup confirmed for ${targetMatch.round}: ${updatedA} vs ${updatedB} at ${targetMatch.venue || 'Main Arena'}.`,
        priority: 'normal',
        createdBy: currentUser.name,
        matchId: targetMatchId,
        sport: targetMatch.sport,
      });
    }

    return { success: true };
  }, [matches, currentUser, addAuditLog, postAnnouncement]);

  const finalizeMatchScore = useCallback(async (matchId: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director or Coordinator can finalize matches via administrative override.');
      return;
    }
    finishMatch(matchId, currentUser.name, true);
  }, [currentUser, finishMatch]);

  const reopenMatch = useCallback((matchId: string) => {
    const target = matches.find(m => m.id === matchId);
    if (!target) return;

    if (target.nextMatchId) {
      const nextMatch = matches.find(m => m.id === target.nextMatchId);
      if (nextMatch && (nextMatch.status === 'live' || nextMatch.status === 'finished')) {
        const msg = `Cannot reopen Match ${matchId}: The next match (${nextMatch.teamA} vs ${nextMatch.teamB}) has already started (${nextMatch.status}).`;
        console.warn(msg);
        alert(msg);
        return;
      }
    }

    let nextMatchReset: { id: string; slot: 'A' | 'B'; placeholder: string } | null = null;
    if (target.nextMatchId && target.nextSlot) {
      nextMatchReset = {
        id: target.nextMatchId,
        slot: target.nextSlot,
        placeholder: `Winner of M${target.slot ?? target.matchNumber ?? ''}`,
      };
    }

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'live' as const,
          winner: undefined,
          finalizedBy: undefined,
          finalizedAt: undefined,
        };
      }
      if (nextMatchReset && m.id === nextMatchReset.id) {
        return {
          ...m,
          teamA: nextMatchReset.slot === 'A' ? nextMatchReset.placeholder : m.teamA,
          teamB: nextMatchReset.slot === 'B' ? nextMatchReset.placeholder : m.teamB,
        };
      }
      return m;
    }));

    addAuditLog('match_start', `Match ${matchId} reopened by ${currentUser?.name || 'Director'}. Advanced team cleared from next match.`, matchId, 'Match');

    supabase.from('matches').update({
      status: 'live',
      winner: null,
      finalized_by: null,
      finalized_at: null,
    }).eq('id', matchId).then();

    if (nextMatchReset) {
      const field = nextMatchReset.slot === 'A' ? 'team_a' : 'team_b';
      supabase.from('matches').update({
        [field]: nextMatchReset.placeholder,
      }).eq('id', nextMatchReset.id).then();
    }
  }, [matches, currentUser, addAuditLog]);

  // ── Bracket & Schedule generation (Single Elimination OR Round Robin) ──────
  const generateBracket = useCallback((eventId: string, teamIds?: string[], forceRegenerate?: boolean, formatOverride?: TournamentFormat) => {
    const allEvents = eventsRef.current.length > 0 ? eventsRef.current : events;
    const allTeams = teamsRef.current.length > 0 ? teamsRef.current : teams;

    let event = allEvents.find(e => e.id === eventId);
    if (!event) {
      // Fallback if eventId is a sport ID or newly created
      const inferredSport = (teamIds && teamIds.length > 0
        ? allTeams.find(t => teamIds.includes(t.id))?.sport
        : undefined) || eventId || 's1';
      event = {
        id: eventId || uid('evt'),
        name: 'Padula Tournament Event',
        sport: inferredSport,
        division: 'div1',
        format: formatOverride || 'single_elimination',
        category: 'Championship',
        dates: 'Nov 10 – Nov 18, 2026',
        venue: venues[0]?.name || 'Main Arena Court 1',
        status: 'ongoing',
        bracket: [],
      };
    }

    const activeFormat: TournamentFormat = formatOverride || event.format || 'single_elimination';
    if (formatOverride && event.format !== formatOverride) {
      setEvents(prev => prev.map(ev => ev.id === event!.id ? { ...ev, format: formatOverride } : ev));
      eventsRef.current = eventsRef.current.map(ev => ev.id === event!.id ? { ...ev, format: formatOverride } : ev);
    }

    // Check if the event/sport already has matches
    const existingEventMatches = matches.filter(m => m.eventId === event!.id || m.sport === event!.sport);
    if (existingEventMatches.length > 0 && !forceRegenerate) {
      return;
    }

    // Only accept teams of the event's sport (or auto-select all active teams for that sport when teamIds is omitted/empty)
    const sportTeams = (teamIds && teamIds.length > 0)
      ? teamIds
          .map(id => allTeams.find(t => t.id === id))
          .filter((t): t is Team => !!t && t.sport === event!.sport)
      : allTeams.filter(t => t.isActive !== false && t.sport === event!.sport);

    const matchesByRound: Match[][] = [];
    let overallMatchNum = 1;

    // Base start date & start hour from the event's configured startDate / startTime
    const baseDateStr = event.startDate || '2026-11-10';
    const baseStartHour = event.startTime ? (parseInt(event.startTime.split(':')[0], 10) || 9) : 9;
    const baseStartMin = event.startTime ? (event.startTime.split(':')[1] || '00') : '00';
    const N = sportTeams.length;
    let P = N > 8 ? 16 : 8;
    let totalRounds = Math.round(Math.log2(P));

    if (activeFormat === 'round_robin') {
      // ── ROUND ROBIN SCHEDULE (Every team plays every other team) ──
      const teamPool: string[] = N >= 2
        ? sportTeams.map(t => t.name)
        : [sportTeams[0]?.name || 'TBD', 'TBD', 'TBD', 'TBD'];
      if (teamPool.length % 2 !== 0) {
        teamPool.push('__BYE__');
      }
      const poolSize = teamPool.length;
      totalRounds = poolSize - 1;
      const matchesPerRound = poolSize / 2;
      P = N >= 2 ? N : 4;

      const rot = [...teamPool];
      for (let r = 1; r <= totalRounds; r++) {
        const roundMatches: Match[] = [];
        let roundDateStr = `2026-11-${String(9 + r).padStart(2, '0')}`;
        if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
          const dt = new Date(`${baseDateStr}T00:00:00`);
          if (!isNaN(dt.getTime())) {
            dt.setDate(dt.getDate() + (r - 1));
            roundDateStr = dt.toISOString().slice(0, 10);
          }
        }

        let slotCounter = 1;
        for (let i = 0; i < matchesPerRound; i++) {
          const tA = rot[i];
          const tB = rot[poolSize - 1 - i];
          if (tA === '__BYE__' || tB === '__BYE__') continue;

          const matchId = uid('m');
          const matchHour = Math.min(20, baseStartHour + (slotCounter - 1) * 2);
          roundMatches.push({
            id: matchId,
            eventId: event.id,
            sport: event.sport,
            division: event.division,
            format: 'round_robin',
            roundNumber: r,
            slot: slotCounter++,
            matchNumber: overallMatchNum++,
            round: `Round Robin · Round ${r}`,
            status: 'scheduled',
            teamA: tA,
            teamB: tB,
            scoreA: 0,
            scoreB: 0,
            isBye: false,
            nextMatchId: null,
            nextSlot: null,
            venue: event.venue || venues[0]?.name || 'Main Arena Court 1',
            scheduledTime: `${roundDateStr}T${String(matchHour).padStart(2, '0')}:${baseStartMin}:00`,
          });
        }
        matchesByRound.push(roundMatches);

        // Rotate circle (keep index 0 fixed)
        const last = rot.pop()!;
        rot.splice(1, 0, last);
      }
    } else {
      // ── SINGLE ELIMINATION BRACKET (Quarter-Finals -> Semi-Finals -> Final) ──
      // NO automatic seeding and NO automatic BYE advancement!
      for (let r = 1; r <= totalRounds; r++) {
        const matchCount = P / Math.pow(2, r);
        const roundMatches: Match[] = [];
        const roundName = getRoundName(r, totalRounds);

        // Compute date offset for round r
        let roundDateStr = `2026-11-${String(9 + r * 2).padStart(2, '0')}`;
        if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
          const dt = new Date(`${baseDateStr}T00:00:00`);
          if (!isNaN(dt.getTime())) {
            dt.setDate(dt.getDate() + (r - 1) * 2);
            roundDateStr = dt.toISOString().slice(0, 10);
          }
        }

        for (let slot = 1; slot <= matchCount; slot++) {
          const matchId = uid('m');
          const matchHour = Math.min(20, baseStartHour + (slot - 1) * 2);
          roundMatches.push({
            id: matchId,
            eventId: event.id,
            sport: event.sport,
            division: event.division,
            format: 'single_elimination',
            roundNumber: r,
            slot,
            matchNumber: overallMatchNum++,
            round: roundName,
            status: 'scheduled',
            teamA: 'TBD',
            teamB: 'TBD',
            scoreA: 0,
            scoreB: 0,
            isBye: false,
            venue: event.venue || venues[0]?.name || 'Main Arena Court 1',
            scheduledTime: `${roundDateStr}T${String(matchHour).padStart(2, '0')}:${baseStartMin}:00`,
          });
        }
        matchesByRound.push(roundMatches);
      }

      // Default bracket tree pointers (Scorekeeper can override target match & slot when finalizing)
      for (let r = 0; r < totalRounds - 1; r++) {
        const currentRoundMatches = matchesByRound[r];
        const nextRoundMatches = matchesByRound[r + 1];

        for (let slot = 0; slot < currentRoundMatches.length; slot++) {
          const parentIndex = Math.floor(slot / 2);
          const parentMatch = nextRoundMatches[parentIndex];
          currentRoundMatches[slot].nextMatchId = parentMatch.id;
          currentRoundMatches[slot].nextSlot = (slot % 2 === 0) ? 'A' : 'B';
        }
      }
      matchesByRound[totalRounds - 1][0].nextMatchId = null;
      matchesByRound[totalRounds - 1][0].nextSlot = null;

      // Place registered teams sequentially into Round 1 without automatic seeding or auto-advancement
      const round1Matches = matchesByRound[0];
      for (let slot = 0; slot < round1Matches.length; slot++) {
        const m = round1Matches[slot];
        const teamAObj = sportTeams[slot * 2] || null;
        const teamBObj = sportTeams[slot * 2 + 1] || null;

        m.teamA = teamAObj ? teamAObj.name : 'TBD';
        m.teamB = teamBObj ? teamBObj.name : 'TBD';
        m.status = 'scheduled';
        m.winner = undefined;
        m.isBye = false;
      }
    }

    const round1Matches = matchesByRound[0] || [];

    const allNewMatches: Match[] = matchesByRound.flat();
    const removedMatchIds = forceRegenerate
      ? new Set(existingEventMatches.map(m => m.id))
      : new Set<string>();
    const retainedMatches = matches.filter(m => !removedMatchIds.has(m.id));

    // ── Auto-assign eligible scorers (same sport, active, load-balanced, conflict check) ──
    const eventSportNameLower = getSportName(event.sport).toLowerCase();
    const eligibleScorers = officials.filter(o => {
      if (o.role !== 'scorekeeper' || o.isActive === false) return false;
      const oSport = (o.sport || '').toLowerCase();
      return (
        !oSport ||
        oSport === 'all sports' ||
        oSport === 'general' ||
        oSport === event.sport.toLowerCase() ||
        oSport === eventSportNameLower
      );
    });
    const fallbackScorers = eligibleScorers.length > 0
      ? eligibleScorers
      : officials.filter(o => o.role === 'scorekeeper' && o.isActive !== false);

    const eligibleReferees = officials.filter(o => {
      if (o.role !== 'referee' || o.isActive === false) return false;
      const oSport = (o.sport || '').toLowerCase();
      return (
        !oSport ||
        oSport === 'all sports' ||
        oSport === 'general' ||
        oSport === event.sport.toLowerCase() ||
        oSport === eventSportNameLower
      );
    });

    const scorerLoad: Record<string, number> = {};
    fallbackScorers.forEach(s => { scorerLoad[s.name] = 0; });
    retainedMatches.forEach(m => {
      if (m.scorekeeper && scorerLoad[m.scorekeeper] !== undefined) {
        scorerLoad[m.scorekeeper]++;
      }
    });

    const isScorerFree = (scorerName: string, scheduledTime?: string) => {
      if (!scheduledTime) return true;
      const conflictExisting = retainedMatches.some(m => m.scorekeeper === scorerName && m.scheduledTime === scheduledTime);
      const conflictNew = allNewMatches.some(m => m.scorekeeper === scorerName && m.scheduledTime === scheduledTime);
      return !conflictExisting && !conflictNew;
    };

    if (fallbackScorers.length > 0) {
      for (const m of allNewMatches) {
        if (m.isBye) continue; // BYE matches do not need a live scorer

        const available = fallbackScorers
          .filter(s => isScorerFree(s.name, m.scheduledTime))
          .sort((a, b) => (scorerLoad[a.name] ?? 0) - (scorerLoad[b.name] ?? 0));

        if (available.length > 0) {
          const chosen = available[0];
          m.scorekeeper = chosen.name;
          m.scorerId = chosen.id;
          scorerLoad[chosen.name] = (scorerLoad[chosen.name] ?? 0) + 1;
        } else {
          const fallback = [...fallbackScorers].sort((a, b) => (scorerLoad[a.name] ?? 0) - (scorerLoad[b.name] ?? 0))[0];
          if (fallback) {
            m.scorekeeper = fallback.name;
            m.scorerId = fallback.id;
            scorerLoad[fallback.name] = (scorerLoad[fallback.name] ?? 0) + 1;
          }
        }
      }
    } else {
      for (const m of allNewMatches) {
        if (!m.isBye && !m.scorekeeper) {
          m.scorekeeper = 'Demo Scorekeeper';
          m.scorerId = 'demo-scorer';
        }
      }
    }

    if (eligibleReferees.length > 0) {
      allNewMatches.forEach((m, idx) => {
        if (!m.referee) {
          m.referee = eligibleReferees[idx % eligibleReferees.length].name;
        }
      });
    }

    // ── Venue conflict checks ──
    for (const m of allNewMatches) {
      if (m.isBye || !m.venue || !m.scheduledTime) continue;
      const venueClash = retainedMatches.some(
        o => o.id !== m.id && o.venue === m.venue && o.scheduledTime === m.scheduledTime
      ) || allNewMatches.some(
        o => o.id !== m.id && o.venue === m.venue && o.scheduledTime === m.scheduledTime
      );
      if (venueClash && !m.conflictWarning) {
        m.conflictWarning = `Venue clash: ${m.venue} is booked for multiple matches at this time.`;
      }
    }

    // The bracket is derived strictly from matches
    setMatches(prev => [...prev.filter(m => !removedMatchIds.has(m.id)), ...allNewMatches]);
    addAuditLog('bracket_generate',
      `Generated bracket for event ${event.id} with ${sportTeams.length} teams (${P}-team bracket, ${totalRounds} rounds)`,
      event.id, 'TournamentEvent');

    // Automatically post pre-match announcements for any Round 1 matches that already have both competing teams set
    const sportLabel = getSportName(event.sport);
    round1Matches.forEach(m => {
      if (!isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)) {
        const timeStr = m.scheduledTime
          ? new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'TBD';
        postAnnouncement({
          title: `Upcoming Match: ${sportLabel} (${m.round}) — ${m.teamA} vs ${m.teamB}`,
          body: `${m.teamA} vs ${m.teamB} is scheduled in ${m.round} at ${m.venue || 'Main Arena'} (${timeStr}).${m.scorekeeper ? ` Official Scorer: ${m.scorekeeper}.` : ''}`,
          priority: 'normal',
          createdBy: currentUser?.name || 'Tournament System',
          matchId: m.id,
          eventId: event!.id,
          sport: event!.sport,
        });
      }
    });

    if (removedMatchIds.size > 0) {
      supabase.from('matches').delete().in('id', Array.from(removedMatchIds)).then(() => {
        supabase.from('matches').insert(allNewMatches.map(m => ({
          id: m.id,
          event_id: m.eventId,
          sport: m.sport,
          division: m.division,
          team_a: m.teamA,
          team_b: m.teamB,
          score_a: m.scoreA,
          score_b: m.scoreB,
          status: m.status,
          venue: m.venue,
          round: m.round,
          round_number: m.roundNumber,
          slot: m.slot,
          match_number: m.matchNumber,
          next_match_id: m.nextMatchId,
          next_slot: m.nextSlot,
          winner: m.winner,
          scheduled_time: m.scheduledTime,
          conflict_warning: m.conflictWarning,
          scorekeeper: m.scorekeeper,
          scorer_id: m.scorerId,
          is_bye: m.isBye ?? false,
        }))).then();
      });
    } else {
      // Batch push new matches to Supabase
      supabase.from('matches').insert(allNewMatches.map(m => ({
        id: m.id,
        event_id: m.eventId,
        sport: m.sport,
        division: m.division,
        team_a: m.teamA,
        team_b: m.teamB,
        score_a: m.scoreA,
        score_b: m.scoreB,
        status: m.status,
        venue: m.venue,
        round: m.round,
        round_number: m.roundNumber,
        slot: m.slot,
        match_number: m.matchNumber,
        next_match_id: m.nextMatchId,
        next_slot: m.nextSlot,
        winner: m.winner,
        scheduled_time: m.scheduledTime,
        conflict_warning: m.conflictWarning,
        scorekeeper: m.scorekeeper,
        scorer_id: m.scorerId,
        is_bye: m.isBye ?? false,
      }))).then();
    }
  }, [events, teams, matches, venues, officials, currentUser, addAuditLog, postAnnouncement]);

  // ── Event management (fused with automatic bracket generation & announcements) ──
  const createEvent = useCallback((eventData: Omit<TournamentEvent, 'id' | 'bracket'>) => {
    const id = uid('evt');
    const chosenFormat: TournamentFormat = eventData.format || 'single_elimination';
    const chosenVenue = eventData.venue || venues[0]?.name || 'Main Arena Court 1';
    const newEvent: TournamentEvent = { ...eventData, id, format: chosenFormat, venue: chosenVenue, bracket: [] };
    eventsRef.current = [newEvent, ...eventsRef.current];
    setEvents(prev => [newEvent, ...prev]);
    addAuditLog('event_create', `Created event: ${eventData.name} (${chosenFormat === 'round_robin' ? 'Round Robin' : 'Single Elimination'}) at ${chosenVenue}`, id, 'TournamentEvent');

    supabase.from('tournament_events').insert([{
      id,
      name: newEvent.name,
      sport: newEvent.sport,
      division: newEvent.division,
      category: newEvent.category,
      dates: newEvent.dates,
      start_date: newEvent.startDate,
      end_date: newEvent.endDate,
      venue: newEvent.venue,
      status: newEvent.status,
    }]).then();

    // Post an official announcement for the event with its format, start date/time, end date/time, and event place
    const sportLabel = getSportName(newEvent.sport);
    const formatLabel = chosenFormat === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    const startTimeFmt = formatTime12h(newEvent.startTime);
    const endTimeFmt = formatTime12h(newEvent.endTime);
    const startLabel = newEvent.startDate
      ? `${newEvent.startDate}${startTimeFmt ? ` at ${startTimeFmt}` : ''}`
      : (startTimeFmt || '');
    const endLabel = newEvent.endDate
      ? `${newEvent.endDate}${endTimeFmt ? ` at ${endTimeFmt}` : ''}`
      : (endTimeFmt || '');
    const scheduleDetail = (startLabel || endLabel)
      ? ` Event Starts: ${startLabel || 'TBA'} · Event Ends: ${endLabel || 'TBA'}.`
      : (newEvent.dates ? ` Schedule: ${newEvent.dates}.` : '');

    postAnnouncement({
      title: `Event Scheduled: ${newEvent.name} (${sportLabel} · ${formatLabel})`,
      body: `${newEvent.name}${newEvent.category ? ` (${newEvent.category})` : ''} — Format: ${formatLabel} · Event Place: ${chosenVenue}.${scheduleDetail} Tournament ${formatLabel.toLowerCase()} schedule has been automatically generated.`,
      priority: 'normal',
      createdBy: currentUser?.name || 'Sports Director',
      eventId: id,
      sport: newEvent.sport,
    });

    // Automatically generate the tournament bracket / round-robin schedule for this event upon creation
    const allTeams = teamsRef.current.length > 0 ? teamsRef.current : teams;
    const sportTeamIds = allTeams
      .filter(t => t.isActive !== false && t.sport === newEvent.sport)
      .map(t => t.id);
    generateBracket(id, sportTeamIds, false, chosenFormat);

    return id;
  }, [addAuditLog, teams, venues, currentUser, generateBracket, postAnnouncement]);

  const updateEvent = useCallback((id: string, updates: Partial<TournamentEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addAuditLog('event_update', `Updated event ${id}`, id, 'TournamentEvent');

    supabase.from('tournament_events').update({
      status: updates.status,
      archived: updates.archived,
      archived_at: updates.archivedAt,
    }).eq('id', id).then();
  }, [addAuditLog]);

  const publishEvent = useCallback((id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'published' } : e));
    addAuditLog('event_publish', `Published event ${id}`, id, 'TournamentEvent');

    supabase.from('tournament_events').update({ status: 'published' }).eq('id', id).then();
  }, [addAuditLog]);

  const archiveEvent = useCallback((id: string) => {
    const archivedAt = new Date().toISOString();
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, archived: true, archivedAt } : e
    ));
    addAuditLog('event_archive', `Archived event ${id}`, id, 'TournamentEvent');

    supabase.from('tournament_events').update({ archived: true, archived_at: archivedAt }).eq('id', id).then();
  }, [addAuditLog]);

  const deleteEvent = useCallback((id: string) => {
    const target = events.find(e => e.id === id);
    eventsRef.current = eventsRef.current.filter(e => e.id !== id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setMatches(prev => prev.filter(m => m.eventId !== id));
    supabase.from('matches').delete().eq('event_id', id).then();
    supabase.from('tournament_events').delete().eq('id', id).then();
    addAuditLog('event_archive', `Deleted event: ${target?.name || id} and its bracket matches`, id, 'TournamentEvent');
  }, [events, addAuditLog]);

  const deleteBracket = useCallback((eventIdOrSport: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Sports Director and Coordinator can delete brackets.');
      return;
    }

    const targetEvent = events.find(e => e.id === eventIdOrSport || e.sport === eventIdOrSport);
    const targetSport = targetEvent?.sport || eventIdOrSport;
    const sportName = getSportName(targetSport);

    // Identify all matches belonging to this event or sport
    const matchingMatches = matches.filter(
      m => (targetEvent && m.eventId === targetEvent.id) || m.sport === targetSport
    );
    const matchIdsToDelete = matchingMatches.map(m => m.id);

    if (matchIdsToDelete.length > 0) {
      setMatches(prev => prev.filter(m => !matchIdsToDelete.includes(m.id)));
      supabase.from('matches').delete().in('id', matchIdsToDelete).then();
    }

    // Reset bracket array on the event if present
    if (targetEvent) {
      setEvents(prev => prev.map(e => e.id === targetEvent.id ? { ...e, bracket: [] } : e));
      eventsRef.current = eventsRef.current.map(e => e.id === targetEvent.id ? { ...e, bracket: [] } : e);
      supabase.from('tournament_events').update({ bracket: [] }).eq('id', targetEvent.id).then();
    }

    const roleTitle = currentUser.role === 'director' ? 'Sports Director' : 'Sports Coordinator';
    addAuditLog(
      'sensitive_action',
      `${roleTitle} (${currentUser.name}) deleted tournament bracket for ${sportName} (${matchIdsToDelete.length} match(es) removed).`,
      targetEvent?.id || targetSport,
      'TournamentBracket'
    );
  }, [currentUser, events, matches, addAuditLog]);

  // â”€â”€ Teams & Players â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const registerTeam = useCallback((teamData: Omit<Team, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator' && currentUser.role !== 'scorer')) {
      console.warn('Security: Only Director/Coordinator/Scorer can register teams.');
      return '';
    }
    const id = uid('t');
    const newTeam: Team = { ...teamData, id };
    teamsRef.current = [...teamsRef.current, newTeam];
    setTeams(prev => [...prev, newTeam]);
    addAuditLog('team_register', `Registered team: ${teamData.name}`, id, 'Team');

    supabase.from('teams').insert([{
      id,
      name: newTeam.name,
      sport: newTeam.sport,
      department: newTeam.department,
      division: newTeam.division,
      coach: newTeam.coach,
      color: newTeam.color,
      players: newTeam.players,
    }]).then();

    // If no bracket exists yet for this sport, automatically generate the bracket and assign the team into Slot 1A
    const existingEvent = (eventsRef.current.length > 0 ? eventsRef.current : events).find(
      e => e.sport === newTeam.sport && !e.archived
    );
    const sportTeamIds = teamsRef.current
      .filter(t => t.isActive !== false && t.sport === newTeam.sport)
      .map(t => t.id);
    const sportMatches = matches.filter(m => m.sport === newTeam.sport);
    const hasExistingBracket = sportMatches.length > 0;
    const isRoundRobin = existingEvent?.format === 'round_robin' || sportMatches.some(m => m.format === 'round_robin');

    if (!hasExistingBracket) {
      generateBracket(existingEvent?.id || newTeam.sport, sportTeamIds, false, existingEvent?.format || 'single_elimination');
      return id;
    }

    // For Round Robin events where no match has started yet, rebuild pairings when 2+ teams are registered
    if (isRoundRobin && sportTeamIds.length >= 2 && sportMatches.every(m => m.status === 'scheduled')) {
      generateBracket(existingEvent?.id || newTeam.sport, sportTeamIds, true, 'round_robin');
      return id;
    }

    // If a bracket already exists for this sport with an open Round 1 TBD slot, automatically place the team into it
    setMatches(prev => {
      const sportRound1 = prev
        .filter(m =>
          m.sport === newTeam.sport &&
          (m.roundNumber === 1 || (m.round || '').toLowerCase().includes('quarter') || (m.round || '').toLowerCase().includes('16')) &&
          m.status === 'scheduled'
        )
        .sort((a, b) => (a.slot ?? a.matchNumber ?? 0) - (b.slot ?? b.matchNumber ?? 0));

      const alreadyInBracket = sportRound1.some(m => m.teamA === newTeam.name || m.teamB === newTeam.name);
      if (alreadyInBracket || sportRound1.length === 0) return prev;

      const targetMatch = sportRound1.find(m => isPlaceholder(m.teamA) || isPlaceholder(m.teamB));
      if (!targetMatch) return prev;

      const fillSlotA = isPlaceholder(targetMatch.teamA);
      const nextA = fillSlotA ? newTeam.name : targetMatch.teamA;
      const nextB = fillSlotA ? targetMatch.teamB : newTeam.name;

      // Ensure the match also has an assigned scorekeeper so it appears in the Scorer Desk immediately
      let assignedScorer = targetMatch.scorekeeper;
      let assignedScorerId = targetMatch.scorerId;
      if (!assignedScorer || assignedScorer === 'Unassigned') {
        const sportNameLower = getSportName(newTeam.sport).toLowerCase();
        const matchingOfficial = officials.find(o => {
          if (o.role !== 'scorekeeper' || o.isActive === false) return false;
          const oSport = (o.sport || '').toLowerCase();
          return !oSport || oSport === 'all sports' || oSport === 'general' || oSport === newTeam.sport.toLowerCase() || oSport === sportNameLower;
        }) || officials.find(o => o.role === 'scorekeeper' && o.isActive !== false);

        if (currentUser?.role === 'scorer' && currentUser.name) {
          assignedScorer = currentUser.name;
          assignedScorerId = currentUser.id;
        } else if (matchingOfficial) {
          assignedScorer = matchingOfficial.name;
          assignedScorerId = matchingOfficial.id;
        }
      }

      const updatedField = fillSlotA
        ? { teamA: newTeam.name, scorekeeper: assignedScorer, scorerId: assignedScorerId }
        : { teamB: newTeam.name, scorekeeper: assignedScorer, scorerId: assignedScorerId };
      const dbField = fillSlotA
        ? { team_a: newTeam.name, scorekeeper: assignedScorer, scorer_id: assignedScorerId }
        : { team_b: newTeam.name, scorekeeper: assignedScorer, scorer_id: assignedScorerId };

      supabase.from('matches').update(dbField).eq('id', targetMatch.id).then();

      // If this registration completes a Round 1 matchup (both teams now set), automatically announce the upcoming match
      if (!isPlaceholder(nextA) && !isPlaceholder(nextB)) {
        const sportLabel = getSportName(newTeam.sport);
        const timeStr = targetMatch.scheduledTime
          ? new Date(targetMatch.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'TBD';
        setTimeout(() => {
          postAnnouncement({
            title: `Upcoming Match: ${sportLabel} (${targetMatch.round}) — ${nextA} vs ${nextB}`,
            body: `${nextA} vs ${nextB} is officially set for ${targetMatch.round} at ${targetMatch.venue || 'Main Arena'} (${timeStr}).`,
            priority: 'normal',
            createdBy: currentUser?.name || 'Tournament System',
            matchId: targetMatch.id,
            sport: newTeam.sport,
          });
        }, 0);
      }

      return prev.map(m => m.id === targetMatch.id ? { ...m, ...updatedField } : m);
    });

    return id;
  }, [currentUser, matches, events, officials, generateBracket, addAuditLog, postAnnouncement]);

  // Automatically sync any unplaced registered teams into open Round 1 TBD slots & ensure matches have scorekeepers assigned
  useEffect(() => {
    if (matches.length === 0) return;

    let changed = false;
    const dbUpdates: { id: string; payload: Record<string, unknown> }[] = [];

    // Group active registered teams by sport
    const activeTeamsBySport = new Map<string, Team[]>();
    teams.forEach(t => {
      if (t.isActive === false) return;
      const list = activeTeamsBySport.get(t.sport) || [];
      list.push(t);
      activeTeamsBySport.set(t.sport, list);
    });

    // Track which teams are already placed in Round 1 per sport
    const placedInSport = new Map<string, Set<string>>();
    matches.forEach(m => {
      const set = placedInSport.get(m.sport) || new Set<string>();
      if (m.teamA && !isPlaceholder(m.teamA)) set.add(m.teamA);
      if (m.teamB && !isPlaceholder(m.teamB)) set.add(m.teamB);
      placedInSport.set(m.sport, set);
    });

    // Queue of unplaced registered teams per sport
    const unplacedQueueBySport = new Map<string, string[]>();
    activeTeamsBySport.forEach((sportTeams, sportId) => {
      const placed = placedInSport.get(sportId) || new Set<string>();
      const unplaced = sportTeams
        .map(t => t.name)
        .filter(name => !placed.has(name));
      if (unplaced.length > 0) {
        unplacedQueueBySport.set(sportId, unplaced);
      }
    });

    // Sort Round 1 scheduled matches by slot so teams fill Match 1 Slot A -> Match 1 Slot B -> Match 2 Slot A...
    const round1IdsBySport = new Map<string, string[]>();
    const sortedMatches = [...matches].sort((a, b) => (a.slot ?? a.matchNumber ?? 0) - (b.slot ?? b.matchNumber ?? 0));
    sortedMatches.forEach(m => {
      const isR1 = m.roundNumber === 1 || (m.round || '').toLowerCase().includes('quarter') || (m.round || '').toLowerCase().includes('16');
      if (isR1 && m.status === 'scheduled') {
        const list = round1IdsBySport.get(m.sport) || [];
        list.push(m.id);
        round1IdsBySport.set(m.sport, list);
      }
    });

    const nextMatches = matches.map(m => {
      let updatedMatch = m;
      const payload: Record<string, unknown> = {};

      // 1. Auto-assign unplaced registered teams into open Round 1 TBD slots
      const r1Ids = round1IdsBySport.get(m.sport);
      const queue = unplacedQueueBySport.get(m.sport);
      if (r1Ids && r1Ids.includes(m.id) && queue && queue.length > 0) {
        let nextA = updatedMatch.teamA;
        let nextB = updatedMatch.teamB;
        if (isPlaceholder(nextA) && queue.length > 0) {
          nextA = queue.shift()!;
          payload.team_a = nextA;
          changed = true;
        }
        if (isPlaceholder(nextB) && queue.length > 0) {
          nextB = queue.shift()!;
          payload.team_b = nextB;
          changed = true;
        }
        if (nextA !== updatedMatch.teamA || nextB !== updatedMatch.teamB) {
          updatedMatch = { ...updatedMatch, teamA: nextA, teamB: nextB };
        }
      }

      // 2. Auto-assign an active scorekeeper if the match has no scorekeeper assigned
      if (updatedMatch.status !== 'finished' && (!updatedMatch.scorekeeper || updatedMatch.scorekeeper === 'Unassigned')) {
        const sportNameLower = getSportName(updatedMatch.sport).toLowerCase();
        const matchingScorer = officials.find(o => {
          if (o.role !== 'scorekeeper' || o.isActive === false) return false;
          const oSport = (o.sport || '').toLowerCase();
          return !oSport || oSport === 'all sports' || oSport === 'general' || oSport === updatedMatch.sport.toLowerCase() || oSport === sportNameLower;
        }) || officials.find(o => o.role === 'scorekeeper' && o.isActive !== false);

        if (matchingScorer) {
          updatedMatch = { ...updatedMatch, scorekeeper: matchingScorer.name, scorerId: matchingScorer.id };
          payload.scorekeeper = matchingScorer.name;
          payload.scorer_id = matchingScorer.id;
          changed = true;
        }
      }

      if (Object.keys(payload).length > 0) {
        dbUpdates.push({ id: updatedMatch.id, payload });
      }
      return updatedMatch;
    });

    if (changed) {
      setMatches(nextMatches);
      dbUpdates.forEach(u => {
        supabase.from('matches').update(u.payload).eq('id', u.id).then();
      });
    }
  }, [teams, matches, officials]);

  const registerPlayer = useCallback((playerData: Omit<Player, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can register players.');
      return '';
    }
    const id = uid('p');
    const newPlayer: Player = { ...playerData, id };
    setPlayers(prev => [...prev, newPlayer]);
    if (playerData.teamId) {
      setTeams(prev => prev.map(t =>
        t.id === playerData.teamId ? { ...t, players: [...t.players, id] } : t
      ));
    }
    addAuditLog('player_register', `Registered player: ${playerData.name}`, id, 'Player');

    supabase.from('players').insert([{
      id,
      name: newPlayer.name,
      student_id: newPlayer.studentId,
      department: newPlayer.department,
      sport: newPlayer.sport,
      team_id: newPlayer.teamId,
      jersey_number: newPlayer.jerseyNumber,
      position: newPlayer.position,
      gwa: newPlayer.gwa,
      medical_cleared: newPlayer.medicalCleared,
    }]).then();

    return id;
  }, [currentUser, addAuditLog]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can update player records.');
      return;
    }
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const target = players.find(p => p.id === id);
    addAuditLog('player_register', `Updated player: ${target?.name || id}`, id, 'Player');
    supabase.from('players').update({
      medical_cleared: updates.medicalCleared,
      team_id: updates.teamId,
      jersey_number: updates.jerseyNumber,
      position: updates.position,
    }).eq('id', id).then();
  }, [currentUser, players, addAuditLog]);

  const removePlayer = useCallback((id: string) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can remove players.');
      return;
    }
    const target = players.find(p => p.id === id);
    setPlayers(prev => prev.filter(p => p.id !== id));
    setTeams(prev => prev.map(t => ({
      ...t,
      players: (t.players || []).filter(pid => pid !== id),
    })));
    addAuditLog('player_register', `Removed player: ${target?.name || id}`, id, 'Player');
    supabase.from('players').delete().eq('id', id).then();
  }, [currentUser, players, addAuditLog]);

  // ── Setup entities ─────────────────────────────────────────────────────────
  const addDepartment = useCallback((dept: Omit<Department, 'id'>) => {
    const id = uid('d');
    setDepartments(prev => [...prev, { ...dept, id }]);
    addAuditLog('department_add', `Added department: ${dept.name}`, id, 'Department');

    supabase.from('departments').insert([{
      id,
      name: dept.name,
      short_name: dept.shortName,
      color: dept.color,
    }]).then();
  }, [addAuditLog]);

  const removeDepartment = useCallback((id: string) => {
    const target = departments.find(d => d.id === id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    supabase.from('departments').delete().eq('id', id).then();
    addAuditLog('department_add', `Removed department: ${target?.name || id}`, id, 'Department');
  }, [departments, addAuditLog]);

  const addDivision = useCallback((div: Omit<Division, 'id'>) => {
    const id = uid('div');
    setDivisions(prev => [...prev, { ...div, id }]);
    addAuditLog('division_add', `Added division: ${div.name}`, id, 'Division');

    supabase.from('divisions').insert([{
      id,
      name: div.name,
      sport_id: div.sportId,
    }]).then();
  }, [addAuditLog]);

  const removeDivision = useCallback((id: string) => {
    const target = divisions.find(d => d.id === id);
    setDivisions(prev => prev.filter(d => d.id !== id));
    supabase.from('divisions').delete().eq('id', id).then();
    addAuditLog('division_add', `Removed division: ${target?.name || id}`, id, 'Division');
  }, [divisions, addAuditLog]);

  const addVenue = useCallback((venue: Omit<Venue, 'id'>) => {
    const id = uid('v');
    setVenues(prev => [...prev, { ...venue, id }]);
    addAuditLog('venue_add', `Added venue: ${venue.name}`, id, 'Venue');

    supabase.from('venues').insert([{
      id,
      name: venue.name,
      capacity: venue.capacity,
      location: venue.location,
      sports: venue.sports,
    }]).then();
  }, [addAuditLog]);

  const removeVenue = useCallback((id: string) => {
    const target = venues.find(v => v.id === id);
    setVenues(prev => prev.filter(v => v.id !== id));
    supabase.from('venues').delete().eq('id', id).then();
    addAuditLog('venue_add', `Removed venue: ${target?.name || id}`, id, 'Venue');
  }, [venues, addAuditLog]);

  // â”€â”€ Computed: Standings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const computeStandings = useCallback((sportId: string): StandingsRow[] => {
    const sportMatches = matches.filter(m => m.sport === sportId && m.status === 'finished' && !m.isBye);
    const teamMap = new Map<string, StandingsRow>();

    const ensureTeam = (name: string) => {
      if (!teamMap.has(name)) {
        const teamObj = teams.find(t => t.name === name);
        const dept = departments.find(d => d.id === teamObj?.department);
        teamMap.set(name, {
          teamId: teamObj?.id ?? name,
          teamName: name,
          department: dept?.shortName ?? 'â€”',
          played: 0, won: 0, lost: 0,
          pointsFor: 0, pointsAgainst: 0, winPct: 0,
        });
      }
      return teamMap.get(name)!;
    };

    for (const m of sportMatches) {
      const a = ensureTeam(m.teamA);
      const b = ensureTeam(m.teamB);
      a.played++; b.played++;
      a.pointsFor    += m.scoreA; a.pointsAgainst += m.scoreB;
      b.pointsFor    += m.scoreB; b.pointsAgainst += m.scoreA;
      if (m.winner === m.teamA) { a.won++; b.lost++; }
      else                      { b.won++; a.lost++; }
      a.winPct = a.played ? a.won / a.played : 0;
      b.winPct = b.played ? b.won / b.played : 0;
    }
    return Array.from(teamMap.values()).sort((a, b) => b.won - a.won || b.winPct - a.winPct);
  }, [matches, teams, departments]);

  // â”€â”€ Computed: Medal Tally â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const computeMedalTally = useCallback((): MedalTallyRow[] => {
    const tallyMap = new Map<string, MedalTallyRow>();

    const ensureDept = (deptId: string) => {
      if (!tallyMap.has(deptId)) {
        const dept = departments.find(d => d.id === deptId);
        tallyMap.set(deptId, {
          departmentId: deptId,
          departmentName: dept?.shortName ?? deptId,
          gold: 0, silver: 0, bronze: 0, total: 0,
        });
      }
      return tallyMap.get(deptId)!;
    };

    const finishedMatches = matches.filter(m => m.status === 'finished' && !m.isBye);
    for (const m of finishedMatches) {
      if (!m.winner) continue;
      const rLower = (m.round || '').toLowerCase();
      const winnerTeam  = teams.find(t => t.name === m.winner);
      const loserName   = m.winner === m.teamA ? m.teamB : m.teamA;
      const loserTeam   = teams.find(t => t.name === loserName);

      const isGrandFinal =
        rLower.includes('championship') ||
        rLower.includes('gold') ||
        rLower.includes('grand final') ||
        (rLower.includes('final') && !rLower.includes('semi') && !rLower.includes('quarter'));

      if (isGrandFinal) {
        if (winnerTeam) { const r = ensureDept(winnerTeam.department); r.gold++; r.total++; }
        if (loserTeam)  { const r = ensureDept(loserTeam.department);  r.silver++; r.total++; }
      } else if (rLower.includes('bronze') || rLower.includes('third')) {
        if (winnerTeam) { const r = ensureDept(winnerTeam.department); r.bronze++; r.total++; }
      }
    }

    for (const dept of departments) {
      ensureDept(dept.id);
    }

    return Array.from(tallyMap.values())
      .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
  }, [matches, teams, departments]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      staff, staffInvitations, latestInvitation, clearLatestInvitation, respondToInvitation, dispatchInvitationViaApi,
      verifyAndSignInStaff,
      addCoordinator, addScorer, deactivateStaff, removeStaff,
      accessRequests, submitAccessRequest, approveAccessRequest, declineAccessRequest,
      registeredUsers, registerUser,
      toggleUserStatus, removeUser,
      toggleOfficialStatus, removeOfficial,
      togglePlayerStatus, toggleTeamStatus, removeTeam,
      isSupabaseConnected,
      activeView, setActiveView,
      events, setEvents,
      matches, officials, players, teams, departments, divisions, venues,
      announcements, auditLogs,
      registerOfficial, assignMatchOfficials,
      updateMatchScore, submitMatchScore, finalizeMatchScore, correctMatchScore,
      startMatch, finishMatch, advanceTeamToBracketSlot, reopenMatch,
      createEvent, updateEvent, publishEvent, archiveEvent, deleteEvent, deleteBracket, generateBracket,
      registerTeam, registerPlayer, updatePlayer, removePlayer,
      addDepartment, removeDepartment,
      addDivision, removeDivision,
      addVenue, removeVenue,
      postAnnouncement, deleteAnnouncement,
      computeStandings, computeMedalTally,
      addAuditLog,
      settings,
      updateSettings: handleUpdateSettings,
      resetSettings: handleResetSettings,
      resetSettingsSection: handleResetSection,
      isMockMode: isMockActive,
      signInMockAccount,
      deleteMockData,
      seedDemoData,
      clearAllMatches,
      deleteMatch,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

