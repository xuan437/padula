import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type {
  User, UserRole, TournamentEvent, Match, GameOfficial,
  Player, Team, Department, Division, Venue,
  AuditLog, AuditAction, Announcement,
  StandingsRow, MedalTallyRow,
} from '../types';

// â”€â”€ Context shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AppContextType {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  registeredUsers: User[];
  registerUser: (user: User) => void;
  changePassword: (userId: string, newPassword: string) => void;
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
    referee?: string; scorekeeper?: string; coachA?: string; coachB?: string; manager?: string;
  }) => void;

  // Scoring
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, details?: any) => void;
  startMatch: (matchId: string) => void;
  finishMatch: (matchId: string) => void;
  reopenMatch: (matchId: string) => void;

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
  PUBLIC_GUEST_USER,
  uid,
} from '../data/seed';

export { PUBLIC_GUEST_USER };

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser,         setCurrentUserState] = useState<User | null>(PUBLIC_GUEST_USER);
  const [activeView,          setActiveView]       = useState('public');
  const [isSupabaseConnected, setIsConnected]      = useState(false);

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('padula_registered_users');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_USERS;
  });

  const [events,         setEvents]           = useState<TournamentEvent[]>(INITIAL_EVENTS);
  const [matches,        setMatches]          = useState<Match[]>(INITIAL_MATCHES);
  const [officials,      setOfficials]        = useState<GameOfficial[]>(() => {
    try {
      const stored = localStorage.getItem('padula_officials');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_OFFICIALS;
  });
  const [players,        setPlayers]          = useState<Player[]>(INITIAL_PLAYERS);
  const [teams,          setTeams]            = useState<Team[]>(INITIAL_TEAMS);
  const [departments,    setDepartments]      = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [divisions,      setDivisions]        = useState<Division[]>(INITIAL_DIVISIONS);
  const [venues,         setVenues]           = useState<Venue[]>(INITIAL_VENUES);
  const [announcements,  setAnnouncements]    = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs,      setAuditLogs]        = useState<AuditLog[]>(INITIAL_AUDIT);
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
            id: m.id, sport: m.sport, division: m.division, teamA: m.team_a, teamB: m.team_b,
            scoreA: m.score_a, scoreB: m.score_b, status: m.status, venue: m.venue, round: m.round,
            roundNumber: m.round_number, matchNumber: m.match_number, scheduledTime: m.scheduled_time,
            winner: m.winner, referee: m.referee, scorekeeper: m.scorekeeper,
            coachA: m.coach_a, coachB: m.coach_b, manager: m.manager, conflictWarning: m.conflict_warning,
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
          matchNumber: newOrUpdated.match_number,
          scheduledTime: newOrUpdated.scheduled_time,
          winner: newOrUpdated.winner,
          referee: newOrUpdated.referee,
          scorekeeper: newOrUpdated.scorekeeper,
          coachA: newOrUpdated.coach_a,
          coachB: newOrUpdated.coach_b,
          manager: newOrUpdated.manager,
          conflictWarning: newOrUpdated.conflict_warning,
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
    if (user) {
      addAuditLog(
        'login',
        `${user.role === 'director' ? 'Sports Director' : user.role === 'coordinator' ? 'Sports Coordinator' : user.role} ${user.name} logged in`,
        user.id,
        'User',
        { id: user.id, name: user.name, role: user.role }
      );
    } else if (prev) {
      addAuditLog(
        'logout',
        `${prev.role === 'director' ? 'Sports Director' : prev.role === 'coordinator' ? 'Sports Coordinator' : prev.role} ${prev.name} logged out`,
        prev.id,
        'User',
        { id: prev.id, name: prev.name, role: prev.role }
      );
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

  const changePassword = useCallback((userId: string, newPassword: string) => {
    setRegisteredUsers(prev => {
      const updated = prev.map(u => u.id === userId ? {
        ...u,
        password: newPassword,
        isDefaultPassword: false,
        mustChangePassword: false,
      } : u);
      try {
        localStorage.setItem('padula_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentUserState(prev => prev && prev.id === userId ? {
      ...prev,
      password: newPassword,
      isDefaultPassword: false,
      mustChangePassword: false,
    } : prev);
    addAuditLog('login', `Password updated for user ID: ${userId}`, userId, 'User');
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
    referee?: string; scorekeeper?: string; coachA?: string; coachB?: string; manager?: string;
  }) => {
    if (!currentUser || (currentUser.role !== 'director' && currentUser.role !== 'coordinator')) {
      console.warn('Security: Only Director/Coordinator can assign match officials.');
      return;
    }
    let warning: string | undefined = undefined;
    const targetMatch = matches.find(m => m.id === matchId);

    if (assignments.scorekeeper) {
      const conflict = matches.find(m =>
        m.id !== matchId &&
        m.scorekeeper?.toLowerCase() === assignments.scorekeeper?.toLowerCase() &&
        m.status !== 'finished' &&
        (m.scheduledTime === targetMatch?.scheduledTime || m.venue === targetMatch?.venue)
      );
      if (conflict) {
        warning = `Conflict: ${assignments.scorekeeper} is also assigned to Match ${conflict.teamA} vs ${conflict.teamB} (${conflict.venue})`;
      }
    }

    setMatches(prev => prev.map(m => m.id !== matchId ? m : { ...m, ...assignments, conflictWarning: warning }));
    addAuditLog('official_assign', `Assigned officials to match ${targetMatch ? `${targetMatch.teamA} vs ${targetMatch.teamB}` : matchId} (Scorer: ${assignments.scorekeeper || 'None'})`, matchId, 'Match');

    supabase.from('matches').update({
      referee: assignments.referee,
      scorekeeper: assignments.scorekeeper,
      coach_a: assignments.coachA,
      coach_b: assignments.coachB,
      manager: assignments.manager,
    }).eq('id', matchId).then();
  }, [currentUser, matches, addAuditLog]);

  // ── Scoring ─────────────────────────────────────────────────────────────
  const updateMatchScore = useCallback((matchId: string, scoreA: number, scoreB: number, details?: any) => {
    // 1. Role permission check
    if (!currentUser || currentUser.role === 'guest' || currentUser.role === 'player') {
      console.warn('Security: Unauthorized score edit rejected.');
      return;
    }

    const prevMatch = matches.find(m => m.id === matchId);

    // 2. Lock check: finished matches can only be edited by Director or Coordinator
    if (prevMatch?.status === 'finished' && currentUser.role !== 'director' && currentUser.role !== 'coordinator') {
      console.warn('Security: Match is finalized and locked. Only Director/Coordinator can edit.');
      return;
    }

    // 3. Scorer assignment check
    if (currentUser.role === 'scorer') {
      const isAssigned = prevMatch && (
        prevMatch.scorekeeper?.toLowerCase() === currentUser.name?.toLowerCase() ||
        currentUser.assignedSport === prevMatch.sport ||
        !prevMatch.scorekeeper
      );
      if (!isAssigned) {
        console.warn('Security: Scorer is not assigned to this sport/match.');
        return;
      }
    }

    // 4. Rate limiting: max 1 update per 200ms per match
    const now = Date.now();
    const lastTime = lastScoreEntryTimeRef.current[matchId] || 0;
    if (now - lastTime < 200) {
      return; // Rate limited
    }
    lastScoreEntryTimeRef.current[matchId] = now;

    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, scoreA, scoreB, status: 'live', ...details } : m
    ));
    setEvents(prev => prev.map(ev => ({
      ...ev,
      bracket: ev.bracket.map(m => m.id === matchId ? { ...m, scoreA, scoreB, status: 'live' as const, ...details } : m),
    })));

    const matchName = prevMatch ? `${prevMatch.teamA} vs ${prevMatch.teamB}` : `Match ${matchId}`;
    addAuditLog('score_update', `${currentUser?.name || 'Scorer'} updated score for ${matchName}: ${prevMatch?.scoreA ?? 0}–${prevMatch?.scoreB ?? 0} → ${scoreA}–${scoreB}`, matchId, 'Match');

    supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'live',
    }).eq('id', matchId).then();
  }, [matches, currentUser, addAuditLog]);

  const startMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'live' } : m
    ));
    addAuditLog('match_start', `Match ${matchId} started`, matchId, 'Match');

    supabase.from('matches').update({ status: 'live' }).eq('id', matchId).then();
  }, [addAuditLog]);

  const finishMatch = useCallback((matchId: string) => {
    let winningTeam = '';
    setMatches(prev => {
      return prev.map(m => {
        if (m.id !== matchId) return m;
        const winner = m.scoreA >= m.scoreB ? m.teamA : m.teamB;
        winningTeam = winner;
        return { ...m, status: 'finished' as const, winner };
      });
    });

    setEvents(prev => prev.map(ev => ({
      ...ev,
      bracket: ev.bracket.map(m => {
        if (m.id !== matchId) return m;
        const winner = m.scoreA >= m.scoreB ? m.teamA : m.teamB;
        return { ...m, status: 'finished' as const, winner };
      }),
    })));

    addAuditLog('match_finish', `Match ${matchId} finalized. Winner: ${winningTeam}`, matchId, 'Match');

    supabase.from('matches').update({
      status: 'finished',
      winner: winningTeam,
    }).eq('id', matchId).then();
  }, [addAuditLog]);

  const reopenMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'live', winner: undefined } : m
    ));
    setEvents(prev => prev.map(ev => ({
      ...ev,
      bracket: ev.bracket.map(m => m.id === matchId ? { ...m, status: 'live' as const, winner: undefined } : m),
    })));
    addAuditLog('match_start', `Match ${matchId} reopened by ${currentUser?.name || 'Director'}`, matchId, 'Match');

    supabase.from('matches').update({
      status: 'live',
      winner: null,
    }).eq('id', matchId).then();
  }, [currentUser, addAuditLog]);

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

    const checkConflict = (scorekeeper: string | undefined, scheduledTime: string, matchId: string): string | undefined => {
      if (!scorekeeper) return undefined;
      const conflict = matches.find(m =>
        m.id !== matchId &&
        m.scorekeeper === scorekeeper &&
        m.scheduledTime === scheduledTime
      );
      return conflict ? `Scorer ${scorekeeper} double-booked at ${scheduledTime}` : undefined;
    };

    const teamsInEvent = teamIds.map(id => teams.find(t => t.id === id)?.name ?? id);
    const newMatches: Match[] = [];
    const roundCount = Math.ceil(Math.log2(teamsInEvent.length));

    let matchNum = 1;
    for (let i = 0; i < teamsInEvent.length - 1; i += 2) {
      const matchId = uid('m');
      const conflictWarning = checkConflict(undefined, `2026-11-10T0${9 + i}:00:00`, matchId);
      newMatches.push({
        id: matchId,
        sport: event.sport,
        division: event.division,
        teamA: teamsInEvent[i],
        teamB: teamsInEvent[i + 1] ?? 'TBD',
        scoreA: 0, scoreB: 0,
        status: 'scheduled',
        venue: venues[0]?.name ?? 'Main Arena',
        round: roundCount >= 2 ? 'Quarter-Final' : 'Final',
        roundNumber: 1,
        matchNumber: matchNum++,
        scheduledTime: `2026-11-10T${String(9 + i).padStart(2, '0')}:00:00`,
        conflictWarning,
      });
    }

    if (teamsInEvent.length > 2) {
      for (let i = 0; i < Math.floor(teamsInEvent.length / 4); i++) {
        newMatches.push({
          id: uid('m'), sport: event.sport,
          teamA: `Winner QF${i * 2 + 1}`, teamB: `Winner QF${i * 2 + 2}`,
          scoreA: 0, scoreB: 0, status: 'scheduled',
          venue: venues[0]?.name ?? 'Main Arena',
          round: 'Semi-Final', roundNumber: 2, matchNumber: matchNum++,
          scheduledTime: '2026-11-14T09:00:00',
        });
      }
      newMatches.push({
        id: uid('m'), sport: event.sport,
        teamA: 'Winner SF1', teamB: 'Winner SF2',
        scoreA: 0, scoreB: 0, status: 'scheduled',
        venue: venues[0]?.name ?? 'Main Arena',
        round: 'Championship Final', roundNumber: 3, matchNumber: matchNum++,
        scheduledTime: '2026-11-18T14:00:00',
      });
    }

    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, bracket: newMatches } : e));
    setMatches(prev => [...prev, ...newMatches]);
    addAuditLog('bracket_generate',
      `Generated bracket for event ${eventId} with ${teamsInEvent.length} teams`,
      eventId, 'TournamentEvent');

    // Batch push new matches to Supabase
    supabase.from('matches').insert(newMatches.map(m => ({
      id: m.id,
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
      match_number: m.matchNumber,
      scheduled_time: m.scheduledTime,
      conflict_warning: m.conflictWarning,
    }))).then();
  }, [events, teams, matches, venues, addAuditLog]);

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
    const sportMatches = matches.filter(m => m.sport === sportId && m.status === 'finished');
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

    const finalMatches = matches.filter(m => m.round.toLowerCase().includes('final') && m.status === 'finished');
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
      registeredUsers, registerUser,
      changePassword, toggleUserStatus, toggleOfficialStatus, togglePlayerStatus, toggleTeamStatus,
      isSupabaseConnected,
      activeView, setActiveView,
      events, setEvents,
      matches, officials, players, teams, departments, divisions, venues,
      announcements, auditLogs,
      registerOfficial, assignMatchOfficials,
      updateMatchScore, startMatch, finishMatch, reopenMatch,
      createEvent, updateEvent, publishEvent, archiveEvent, generateBracket,
      registerTeam, registerPlayer, updatePlayer, removePlayer,
      addDepartment, addDivision, addVenue,
      postAnnouncement,
      computeStandings, computeMedalTally,
      addAuditLog,
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

