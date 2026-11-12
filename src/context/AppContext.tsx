import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isPlaceholder, getRoundName, getSeedOrder } from '../lib/bracket';
import type {
  User, UserRole, TournamentEvent, Match, GameOfficial,
  Player, Team, Department, Division, Venue,
  AuditLog, AuditAction, Announcement,
  StandingsRow, MedalTallyRow,
  StaffMember, StaffRole, StaffStatus,
} from '../types';

// ── Context shape ─────────────────────────────────────────────────────────────
interface AppContextType {
  // Auth & Staff Access Control
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  staff: StaffMember[];
  verifyAndSignInStaff: (email: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  addCoordinator: (name: string, email: string, competitionId: string) => Promise<{ success: boolean; error?: string }>;
  addScorer: (name: string, email: string, matchIds?: string[], sport?: string) => Promise<{ success: boolean; error?: string }>;
  deactivateStaff: (staffId: string) => Promise<void>;
  removeStaff: (staffId: string) => Promise<void>;

  registeredUsers: User[];
  registerUser: (user: User) => void;
  toggleUserStatus: (userId: string, active: boolean) => void;
  toggleOfficialStatus: (officialId: string, active: boolean) => void;
  togglePlayerStatus: (playerId: string, active: boolean) => void;
  toggleTeamStatus: (teamId: string, active: boolean) => void;

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
  finishMatch: (matchId: string, finalizedBy?: string, isOverride?: boolean, finalScores?: { scoreA: number; scoreB: number }) => { success: boolean; message?: string };
  reopenMatch: (matchId: string) => void;

  // Mock Test Mode
  isMockMode: boolean;
  signInMockAccount: (email: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  deleteMockData: () => Promise<void>;
  clearAllMatches: () => void;

  // Event management
  createEvent: (event: Omit<TournamentEvent, 'id' | 'bracket'>) => string;
  updateEvent: (id: string, updates: Partial<TournamentEvent>) => void;
  publishEvent: (id: string) => void;
  archiveEvent: (id: string) => void;
  generateBracket: (eventId: string, teamIds: string[]) => void;

  // Teams & Players
  registerTeam: (team: Omit<Team, 'id'>) => string;
  registerPlayer: (player: Omit<Player, 'id'>) => string;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  // Setup entities
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  addDivision: (div: Omit<Division, 'id'>) => void;
  addVenue: (venue: Omit<Venue, 'id'>) => void;

  // Announcements
  postAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'>) => void;

  // Computed
  computeStandings: (sportId: string) => StandingsRow[];
  computeMedalTally: () => MedalTallyRow[];

  // Audit
  addAuditLog: (action: AuditAction, details: string, entityId?: string, entityType?: string, actingUser?: { id: string; name: string; role: UserRole }) => void;
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
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('padula_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id === 'u1' && parsed.email?.toLowerCase().endsWith('@asiancollege.edu.ph')) {
          return parsed;
        }
        // If stored was Mock Director or any mock account, replace immediately with real Sports Director Mr. John Eric Samane
        if (parsed?.name?.toLowerCase().includes('mock') || parsed?.email?.includes('mock.')) {
          const realDirector = INITIAL_USERS[0];
          localStorage.setItem('padula_current_user', JSON.stringify(realDirector));
          return realDirector;
        }
      }
    } catch {}
    return INITIAL_USERS[0];
  });
  const [activeView, setActiveView] = useState('public');
  const [isSupabaseConnected, setIsConnected] = useState(false);

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const stored = localStorage.getItem('padula_staff');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy placeholder coordinators and scorers
          const filtered = parsed.filter(s =>
            s.id === 'staff-1' || (!s.id?.startsWith('staff-') && !s.email?.includes('j.lee@') && !s.email?.includes('mock.'))
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('padula_staff', JSON.stringify(filtered));
          }
          return filtered;
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
          // Filter out legacy placeholder coordinators & scorers
          const filtered = parsed.filter(u =>
            u.id === 'u1' || (!['u2', 'u3', 'u4'].includes(u.id) && !u.username?.includes('jordan') && !u.username?.includes('sam.chen') && !u.username?.includes('maria.santos'))
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('padula_registered_users', JSON.stringify(filtered));
          }
          return filtered;
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
          return filtered;
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
          const filtered = parsed.filter(m => !['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'].includes(m.id) && !m.isMock && !m.id?.startsWith('mock-'));
          return filtered;
        }
      }
    } catch {}
    return INITIAL_MATCHES;
  });
  const [officials, setOfficials] = useState<GameOfficial[]>(() => {
    try {
      const stored = localStorage.getItem('padula_officials');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy placeholder seed officials
          const filtered = parsed.filter(o =>
            !o.id?.startsWith('off-sk-') && !o.id?.startsWith('off-ch-') && !o.id?.startsWith('off-mg-') && !o.id?.startsWith('off-rf-') && !o.isMock
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('padula_officials', JSON.stringify(filtered));
          }
          return filtered;
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
          const filtered = parsed.filter(p => !p.id?.startsWith('p') && !p.isMock && !p.id?.startsWith('mock-'));
          return filtered;
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
          return filtered;
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
          return parsed.filter(a => !['ann1', 'ann2', 'mock-ann-1'].includes(a.id));
        }
      }
    } catch {}
    return INITIAL_ANNOUNCEMENTS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT);
  const lastScoreEntryTimeRef = useRef<Record<string, number>>({});

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
          setOfficials(offRes.data.map(o => ({
            id: o.id, name: o.name, role: o.role, sport: o.sport,
            affiliation: o.affiliation, licenseId: o.license_id, contact: o.contact, assignedGameId: o.assigned_game_id,
          })));
        }
        if (teamRes.data && teamRes.data.length > 0) {
          setTeams(teamRes.data.map(t => ({
            id: t.id, name: t.name, sport: t.sport, department: t.department,
            division: t.division, coach: t.coach, seed: t.seed, color: t.color, players: t.players || [],
          })));
        }
        if (playRes.data && playRes.data.length > 0) {
          setPlayers(playRes.data.map(p => ({
            id: p.id, name: p.name, studentId: p.student_id, department: p.department,
            sport: p.sport, teamId: p.team_id, jerseyNumber: p.jersey_number,
            position: p.position, gwa: p.gwa ? Number(p.gwa) : undefined, medicalCleared: p.medical_cleared,
          })));
        }
        if (matchRes.data && matchRes.data.length > 0) {
          setMatches(matchRes.data.map(m => ({
            id: m.id, eventId: m.event_id, sport: m.sport, division: m.division, teamA: m.team_a, teamB: m.team_b,
            scoreA: m.score_a, scoreB: m.score_b, status: m.status, venue: m.venue, round: m.round,
            roundNumber: m.round_number, slot: m.slot, matchNumber: m.match_number, scheduledTime: m.scheduled_time,
            nextMatchId: m.next_match_id, nextSlot: m.next_slot,
            winner: m.winner, referee: m.referee, scorekeeper: m.scorekeeper,
            coachA: m.coach_a, coachB: m.coach_b, manager: m.manager,
            finalizedBy: m.finalized_by, finalizedAt: m.finalized_at, isBye: m.is_bye, scorerId: m.scorer_id,
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
          setRegisteredUsers(userRes.data.map(u => ({
            id: u.id, name: u.name, role: u.role, username: u.username, email: u.email,
            password: u.password, department: u.department, assignedSport: u.assigned_sport,
            avatarInitials: u.avatar_initials, gmailVerified: u.gmail_verified,
            isActive: u.is_active, isDefaultPassword: u.is_default_password,
          })));
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

  // ── Audit helper ─────────────────────────────────────────────────────────
  const addAuditLog = useCallback((
    action: AuditAction, details: string, entityId?: string, entityType?: string,
    actingUser?: { id: string; name: string; role: UserRole }
  ) => {
    const userToRecord = actingUser || currentUser;
    const newLog: AuditLog = {
      id: uid('al'),
      action,
      userId:     userToRecord?.id ?? 'system',
      userName:   userToRecord?.name ?? 'System',
      userRole:   userToRecord?.role ?? 'guest',
      details,
      timestamp:  new Date().toISOString(),
      entityId,
      entityType,
    };

    setAuditLogs(prev => [newLog, ...prev]);

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

  const registerUser = useCallback((newUser: User) => {
    setRegisteredUsers(prev => {
      const updated = [newUser, ...prev.filter(u => u.email?.toLowerCase() !== newUser.email?.toLowerCase())];
      try {
        localStorage.setItem('padula_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditLog('login', `Account registered: ${newUser.name} (${newUser.email}) - ${newUser.role}`);
  }, [addAuditLog]);

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

  const togglePlayerStatus = useCallback((playerId: string, active: boolean) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isActive: active } : p));
    addAuditLog('player_register', `Player ${active ? 'activated' : 'deactivated'} (ID: ${playerId})`, playerId, 'Player');
  }, [addAuditLog]);

  const toggleTeamStatus = useCallback((teamId: string, active: boolean) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, isActive: active } : t));
    addAuditLog('team_register', `Team ${active ? 'activated' : 'deactivated'} (ID: ${teamId})`, teamId, 'Team');
  }, [addAuditLog]);

  // ── Staff & Access Control Management ─────────────────────────────────────
  const verifyAndSignInStaff = useCallback(async (email: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Google Institutional Domain Enforcement (@asiancollege.edu.ph)
    if (!cleanEmail.endsWith('@asiancollege.edu.ph')) {
      return {
        success: false,
        error: "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director."
      };
    }

    // 2. Fetch latest staff from Supabase if connected
    let currentStaffList = staff;
    try {
      const { data, error } = await supabase.from('staff').select('*');
      if (!error && data && data.length > 0) {
        currentStaffList = data.map((d: any) => ({
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
        }));
        setStaff(currentStaffList);
        try { localStorage.setItem('padula_staff', JSON.stringify(currentStaffList)); } catch {}
      }
    } catch {}

    // 3. Find record
    const member = currentStaffList.find(s => s.email.toLowerCase() === cleanEmail);
    if (!member || member.status === 'disabled') {
      return {
        success: false,
        error: "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director."
      };
    }

    // 4. Update status from 'pending' to 'active' on first sign-in
    const updatedStatus: StaffStatus = member.status === 'pending' ? 'active' : member.status;
    const nowIso = new Date().toISOString();

    const updatedMember: StaffMember = {
      ...member,
      status: updatedStatus,
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
      isActive: true,
      gmailVerified: true,
      avatarInitials: member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    };

    setCurrentUser(loggedUser);

    if (member.role === 'director' || member.role === 'coordinator') {
      setActiveView('admin');
    } else {
      setActiveView('scorer-dashboard');
    }

    addAuditLog('login', `${member.role.toUpperCase()} ${member.name} (${member.email}) logged in via Institutional Google`, member.id, 'Staff', {
      id: member.id,
      name: member.name,
      role: member.role,
    });

    return { success: true, user: loggedUser };
  }, [staff, setCurrentUser, addAuditLog, setActiveView]);

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

    const newStaff: StaffMember = {
      id: `staff-coord-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'coordinator',
      assignedCompetitionId: competitionId,
      status: 'pending',
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

    addAuditLog('account_add', `Added Sports Coordinator ${newStaff.name} (${cleanEmail}) for competition ${competitionId}`, newStaff.id, 'Staff');
    return { success: true };
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

    const assignedComp = currentUser.role === 'coordinator' ? currentUser.assignedCompetitionId : undefined;
    const newStaff: StaffMember = {
      id: `staff-scorer-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'scorer',
      assignedCompetitionId: assignedComp,
      assignedMatchIds: matchIds || [],
      status: 'pending',
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

    addAuditLog('account_add', `Added Official Scorer ${newStaff.name} (${cleanEmail})`, newStaff.id, 'Staff');
    return { success: true };
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

  // ── Mock Test Mode Sign-In & Data Purge ───────────────────────────────────
  const signInMockAccount = useCallback(async (mockEmail: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!isMockModeActive()) {
      return {
        success: false,
        error: 'Mock test mode is not enabled in this environment.',
      };
    }

    const cleanEmail = mockEmail.trim().toLowerCase();
    // Normal staff table lookup (enforcing role and registration rules)
    let member = staff.find(s => s.email.toLowerCase() === cleanEmail);
    if (!member && (cleanEmail.includes('director') || cleanEmail.includes('samane'))) {
      member = staff.find(s => s.role === 'director') || staff[0];
    }

    if (!member || member.status === 'disabled') {
      return {
        success: false,
        error: "This account isn't registered for Padula. Contact your Sports Coordinator or the Sports Director.",
      };
    }

    const loggedUser: User = {
      id: member.id,
      name: member.name,
      role: member.role,
      username: member.email.split('@')[0],
      email: member.email,
      assignedCompetitionId: member.assignedCompetitionId,
      assignedMatchIds: member.assignedMatchIds,
      status: member.status,
      isActive: true,
      gmailVerified: true,
      isMock: true,
      avatarInitials: member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    };

    setCurrentUser(loggedUser);

    if (member.role === 'director' || member.role === 'coordinator') {
      setActiveView('admin');
    } else {
      setActiveView('scorekeeper');
    }

    addAuditLog(
      'login',
      `[MOCK TEST MODE] ${member.role.toUpperCase()} ${member.name} (${member.email}) logged in without Google`,
      member.id,
      'MockStaff',
      { id: member.id, name: member.name, role: member.role }
    );

    return { success: true, user: loggedUser };
  }, [staff, setCurrentUser, addAuditLog, setActiveView]);

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

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          scoreA,
          scoreB,
          winner: targetMatch.status === 'finished' ? winningTeam : m.winner,
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

    addAuditLog('score_correct', `Corrected score for ${targetMatch.teamA} vs ${targetMatch.teamB} from [${targetMatch.scoreA}-${targetMatch.scoreB}] to [${scoreA}-${scoreB}]. Reason: ${reason}`, matchId, 'Match');
  }, [currentUser, matches, addAuditLog]);

  // â”€â”€ Officials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const registerOfficial = useCallback((officialData: Omit<GameOfficial, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can register officials.');
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

    // 3. Scorer assignment check: scorer can ONLY score matches where they are the assigned scorekeeper
    if (currentUser.role === 'scorer') {
      const isAssigned = !!(
        prevMatch.scorekeeper &&
        prevMatch.scorekeeper.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()
      );
      if (!isAssigned) {
        console.warn(`Security: Scorer ${currentUser.name} is not assigned to score match ${matchId} (Assigned: ${prevMatch.scorekeeper || 'None'}).`);
        return;
      }
    }

    // 4. Rate limiting: max 1 update per 150ms per match
    const now = Date.now();
    const lastTime = lastScoreEntryTimeRef.current[matchId] || 0;
    if (now - lastTime < 150) {
      return; // Rate limited
    }
    lastScoreEntryTimeRef.current[matchId] = now;

    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, scoreA, scoreB, status: 'live', ...details } : m
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
      'Match'
    );

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'live',
    }).eq('id', matchId).then();
  }, [matches, currentUser, addAuditLog]);

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

    // Scorer can only start their own assigned match
    if (currentUser?.role === 'scorer') {
      const isAssigned = !!(
        target.scorekeeper &&
        target.scorekeeper.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()
      );
      if (!isAssigned) {
        console.warn(`Security: Scorer ${currentUser.name} is not assigned to start match ${matchId}.`);
        return;
      }
    }

    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'live' } : m
    ));
    addAuditLog('match_start', `Match ${matchId} started (${target.teamA} vs ${target.teamB})`, matchId, 'Match');

    supabase.from('matches').update({ status: 'live' }).eq('id', matchId).then();
  }, [matches, currentUser, addAuditLog]);

  const finishMatch = useCallback((
    matchId: string,
    finalizedBy?: string,
    isOverride?: boolean,
    finalScores?: { scoreA: number; scoreB: number }
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

    // 4. Permissions check
    const isAssignedScorer = !!(
      target.scorekeeper &&
      target.scorekeeper.trim().toLowerCase() === callerName.trim().toLowerCase()
    );
    const isDirectorOrCoord = callerRole === 'director' || callerRole === 'coordinator';

    if (!isAssignedScorer && !(isDirectorOrCoord && isOverride)) {
      const msg = `Security: Only assigned Official Scorer (${target.scorekeeper || 'Unassigned'}) can finalize this match. Coordinator/Director requires explicit logged override.`;
      console.warn(`finishMatch: ${msg}`);
      return { success: false, message: msg };
    }

    // 5. Sets winner = the team with the higher score that the scorer entered
    const winningTeam = scoreA > scoreB ? target.teamA : target.teamB;
    const nowIso = new Date().toISOString();

    let nextMatchUpdate: { id: string; slot: 'A' | 'B'; team: string } | null = null;
    if (target.nextMatchId && target.nextSlot) {
      nextMatchUpdate = {
        id: target.nextMatchId,
        slot: target.nextSlot,
        team: winningTeam,
      };
    }

    setMatches(prev => {
      return prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            scoreA,
            scoreB,
            status: 'finished' as const,
            winner: winningTeam,
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
    const auditText = isOverrideLog
      ? `[OVERRIDE] Finalized match ${target.teamA} vs ${target.teamB} by ${callerRole} ${callerName}. Final Score: ${scoreA}–${scoreB}. Winner: ${winningTeam}`
      : `Finalized match ${target.teamA} vs ${target.teamB} by scorer ${callerName}. Final Score: ${scoreA}–${scoreB}. Winner: ${winningTeam}`;

    addAuditLog(auditAction, auditText, matchId, 'Match');

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'finished',
      winner: winningTeam,
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
  }, [matches, currentUser, addAuditLog]);

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

  // ── Event management ───────────────────────────────────────────────────
  const createEvent = useCallback((eventData: Omit<TournamentEvent, 'id' | 'bracket'>) => {
    const id = uid('evt');
    const newEvent: TournamentEvent = { ...eventData, id, bracket: [] };
    setEvents(prev => [newEvent, ...prev]);
    addAuditLog('event_create', `Created event: ${eventData.name}`, id, 'TournamentEvent');

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

    return id;
  }, [addAuditLog]);

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

  // â”€â”€ Bracket generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const generateBracket = useCallback((eventId: string, teamIds: string[]) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Do not run if the event already has matches
    const eventHasMatches = matches.some(m => m.eventId === eventId);
    if (eventHasMatches) {
      console.warn(`generateBracket: Event ${eventId} already has matches.`);
      return;
    }

    // Only accept teams of the event's sport
    const sportTeams = teamIds
      .map(id => teams.find(t => t.id === id))
      .filter((t): t is Team => !!t && t.sport === event.sport);

    if (sportTeams.length < 2) {
      console.warn(`generateBracket: Need at least 2 teams of sport ${event.sport}. Found ${sportTeams.length}.`);
      return;
    }

    // Sort by seed if available
    sportTeams.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

    // Pad to power of 2
    const N = sportTeams.length;
    const P = Math.pow(2, Math.ceil(Math.log2(Math.max(N, 2))));
    const totalRounds = Math.round(Math.log2(P));

    const matchesByRound: Match[][] = [];
    let overallMatchNum = 1;

    for (let r = 1; r <= totalRounds; r++) {
      const matchCount = P / Math.pow(2, r);
      const roundMatches: Match[] = [];
      const roundName = getRoundName(r, totalRounds);

      for (let slot = 1; slot <= matchCount; slot++) {
        const matchId = uid('m');
        roundMatches.push({
          id: matchId,
          eventId,
          sport: event.sport,
          division: event.division,
          roundNumber: r,
          slot,
          matchNumber: overallMatchNum++,
          round: roundName,
          status: 'scheduled',
          teamA: `Winner R${r - 1} M${slot * 2 - 1}`,
          teamB: `Winner R${r - 1} M${slot * 2}`,
          scoreA: 0,
          scoreB: 0,
          venue: event.venue || venues[0]?.name || 'Main Arena',
          scheduledTime: `2026-11-${String(9 + r * 2).padStart(2, '0')}T${String(9 + (slot - 1) * 2).padStart(2, '0')}:00:00`,
        });
      }
      matchesByRound.push(roundMatches);
    }

    // Link nextMatchId and nextSlot
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

    // Seed round 1 & give BYEs to top seeds
    const seedOrder = getSeedOrder(P);
    const round1Matches = matchesByRound[0];

    for (let slot = 0; slot < round1Matches.length; slot++) {
      const m = round1Matches[slot];
      const seedA = seedOrder[slot * 2];
      const seedB = seedOrder[slot * 2 + 1];

      const teamAObj = seedA <= sportTeams.length ? sportTeams[seedA - 1] : null;
      const teamBObj = seedB <= sportTeams.length ? sportTeams[seedB - 1] : null;

      m.teamA = teamAObj ? teamAObj.name : 'BYE';
      m.teamB = teamBObj ? teamBObj.name : 'BYE';

      const isByeA = m.teamA === 'BYE';
      const isByeB = m.teamB === 'BYE';

      if (isByeA && !isByeB) {
        // Lone team is B -> Auto-advance
        m.status = 'finished';
        m.isBye = true;
        m.winner = m.teamB;
        if (m.nextMatchId && m.nextSlot && totalRounds > 1) {
          const parent = matchesByRound[1][Math.floor(slot / 2)];
          if (m.nextSlot === 'A') parent.teamA = m.teamB;
          else parent.teamB = m.teamB;
        }
      } else if (!isByeA && isByeB) {
        // Lone team is A -> Auto-advance
        m.status = 'finished';
        m.isBye = true;
        m.winner = m.teamA;
        if (m.nextMatchId && m.nextSlot && totalRounds > 1) {
          const parent = matchesByRound[1][Math.floor(slot / 2)];
          if (m.nextSlot === 'A') parent.teamA = m.teamA;
          else parent.teamB = m.teamA;
        }
      } else if (!isByeA && !isByeB) {
        // Both real teams
        m.status = 'scheduled';
        m.winner = undefined;
        if (m.nextMatchId && m.nextSlot && totalRounds > 1) {
          const parent = matchesByRound[1][Math.floor(slot / 2)];
          const placeholder = `Winner of M${m.slot}`;
          if (m.nextSlot === 'A') parent.teamA = placeholder;
          else parent.teamB = placeholder;
        }
      }
    }

    const allNewMatches: Match[] = matchesByRound.flat();

    // ── Auto-assign eligible scorers (same sport, active, load-balanced, conflict check) ──
    const eligibleScorers = officials.filter(o =>
      o.role === 'scorekeeper' &&
      (o.isActive !== false) &&
      (o.sport === event.sport || o.sport === 'All Sports' || !o.sport)
    );

    const scorerLoad: Record<string, number> = {};
    eligibleScorers.forEach(s => { scorerLoad[s.name] = 0; });
    matches.forEach(m => {
      if (m.scorekeeper && scorerLoad[m.scorekeeper] !== undefined) {
        scorerLoad[m.scorekeeper]++;
      }
    });

    const isScorerFree = (scorerName: string, scheduledTime?: string) => {
      if (!scheduledTime) return true;
      const conflictExisting = matches.some(m => m.scorekeeper === scorerName && m.scheduledTime === scheduledTime);
      const conflictNew = allNewMatches.some(m => m.scorekeeper === scorerName && m.scheduledTime === scheduledTime);
      return !conflictExisting && !conflictNew;
    };

    if (eligibleScorers.length > 0) {
      for (const m of allNewMatches) {
        if (m.isBye) continue; // BYE matches do not need a live scorer

        const available = eligibleScorers
          .filter(s => isScorerFree(s.name, m.scheduledTime))
          .sort((a, b) => (scorerLoad[a.name] ?? 0) - (scorerLoad[b.name] ?? 0));

        if (available.length > 0) {
          const chosen = available[0];
          m.scorekeeper = chosen.name;
          m.scorerId = chosen.id;
          scorerLoad[chosen.name] = (scorerLoad[chosen.name] ?? 0) + 1;
        } else {
          const fallback = [...eligibleScorers].sort((a, b) => (scorerLoad[a.name] ?? 0) - (scorerLoad[b.name] ?? 0))[0];
          if (fallback) {
            m.scorekeeper = fallback.name;
            m.scorerId = fallback.id;
            scorerLoad[fallback.name] = (scorerLoad[fallback.name] ?? 0) + 1;
            m.conflictWarning = `Schedule clash: ${fallback.name} has multiple matches at ${m.scheduledTime}`;
          }
        }
      }
    }

    // ── Venue conflict checks ──
    for (const m of allNewMatches) {
      if (m.isBye || !m.venue || !m.scheduledTime) continue;
      const venueClash = matches.some(
        o => o.id !== m.id && o.venue === m.venue && o.scheduledTime === m.scheduledTime
      ) || allNewMatches.some(
        o => o.id !== m.id && o.venue === m.venue && o.scheduledTime === m.scheduledTime
      );
      if (venueClash && !m.conflictWarning) {
        m.conflictWarning = `Venue clash: ${m.venue} is booked for multiple matches at this time.`;
      }
    }

    // The bracket is derived strictly from matches
    setMatches(prev => [...prev, ...allNewMatches]);
    addAuditLog('bracket_generate',
      `Generated bracket for event ${eventId} with ${sportTeams.length} teams (${P}-team bracket, ${totalRounds} rounds)`,
      eventId, 'TournamentEvent');

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
  }, [events, teams, matches, venues, officials, addAuditLog]);

  // â”€â”€ Teams & Players â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const registerTeam = useCallback((teamData: Omit<Team, 'id'>) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can register teams.');
      return '';
    }
    const id = uid('t');
    const newTeam: Team = { ...teamData, id };
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

    return id;
  }, [currentUser, addAuditLog]);

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
    addAuditLog('player_register', `Removed player: ${target?.name || id}`, id, 'Player');
    supabase.from('players').delete().eq('id', id).then();
  }, [currentUser, players, addAuditLog]);

  // â”€â”€ Setup entities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Announcements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    const finalMatches = matches.filter(m => m.round.toLowerCase().includes('final') && m.status === 'finished' && !m.isBye);
    for (const m of finalMatches) {
      if (!m.winner) continue;
      const winnerTeam  = teams.find(t => t.name === m.winner);
      const loserName   = m.winner === m.teamA ? m.teamB : m.teamA;
      const loserTeam   = teams.find(t => t.name === loserName);

      if (m.round.toLowerCase().includes('championship') || m.round.toLowerCase().includes('gold')) {
        if (winnerTeam) { const r = ensureDept(winnerTeam.department); r.gold++; r.total++; }
        if (loserTeam)  { const r = ensureDept(loserTeam.department);  r.silver++; r.total++; }
      } else if (m.round.toLowerCase().includes('bronze')) {
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
      staff, verifyAndSignInStaff,
      addCoordinator, addScorer, deactivateStaff, removeStaff,
      registeredUsers, registerUser,
      toggleUserStatus, toggleOfficialStatus, togglePlayerStatus, toggleTeamStatus,
      isSupabaseConnected,
      activeView, setActiveView,
      events, setEvents,
      matches, officials, players, teams, departments, divisions, venues,
      announcements, auditLogs,
      registerOfficial, assignMatchOfficials,
      updateMatchScore, submitMatchScore, finalizeMatchScore, correctMatchScore,
      startMatch, finishMatch, reopenMatch,
      createEvent, updateEvent, publishEvent, archiveEvent, generateBracket,
      registerTeam, registerPlayer, updatePlayer, removePlayer,
      addDepartment, addDivision, addVenue,
      postAnnouncement,
      computeStandings, computeMedalTally,
      addAuditLog,
      isMockMode: isMockActive,
      signInMockAccount,
      deleteMockData,
      clearAllMatches,
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

