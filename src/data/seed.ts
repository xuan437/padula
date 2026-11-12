// ============================================================
// SEED DATA — Initial fallback data for the tournament system
// All INITIAL_* constants are defined here and imported by
// AppContext.tsx so the context file stays lean.
// ============================================================
import type {
  Department, Venue, Division, GameOfficial, Team,
  Player, Match, TournamentEvent, Announcement,
  AuditLog, User, StaffMember,
} from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Business Administration & Accountancy', shortName: 'BAA', color: '#f59e0b' },
  { id: 'd2', name: 'Computer Studies & Engineering',        shortName: 'CSE', color: '#3b82f6' },
  { id: 'd3', name: 'Hospitality & Tourism Management',       shortName: 'HTM', color: '#f97316' },
  { id: 'd4', name: 'Department of Public Development',      shortName: 'DPD', color: '#ef4444' },
  { id: 'd5', name: 'Senior Department',                     shortName: 'Senior Dept', color: '#8b5cf6' },
];

export const INITIAL_VENUES: Venue[] = [
  { id: 'v1', name: 'Main Arena Court 1',    capacity: 500, location: 'Main Gymnasium', sports: ['s1', 's2'] },
  { id: 'v2', name: 'Main Arena Court 2',    capacity: 500, location: 'Main Gymnasium', sports: ['s1', 's2'] },
  { id: 'v3', name: 'Pavilion Court',         capacity: 300, location: 'Sports Pavilion', sports: ['s2', 's3', 's_sepaktakraw'] },
  { id: 'v4', name: 'Fieldhouse Annex',       capacity: 200, location: 'Fieldhouse', sports: ['s3', 's4'] },
  { id: 'v5', name: 'Esports Arena Stage A',  capacity: 150, location: 'CCS Building', sports: ['s5', 's6', 's7'] },
  { id: 'v6', name: 'Athletics Open Field',   capacity: 800, location: 'Campus Grounds', sports: ['s_football', 's_frisbee'] },
  { id: 'v7', name: 'Board Games Hall',       capacity: 80,  location: 'Academic Building', sports: ['s8', 's_scrabble'] },
];

export const INITIAL_DIVISIONS: Division[] = [
  { id: 'div1',  name: "Men's Varsity",    sportId: 's1' },
  { id: 'div2',  name: "Women's Varsity",  sportId: 's1' },
  { id: 'div3',  name: "Men's Division",   sportId: 's2' },
  { id: 'div4',  name: "Women's Division", sportId: 's2' },
  { id: 'div5',  name: "Men's Division",   sportId: 's_football' },
  { id: 'div6',  name: "Women's Open",     sportId: 's_football' },
  { id: 'div7',  name: "Men's Regu",       sportId: 's_sepaktakraw' },
  { id: 'div8',  name: "Women's Regu",     sportId: 's_sepaktakraw' },
  { id: 'div9',  name: 'Singles',          sportId: 's4' },
  { id: 'div10', name: 'Doubles',          sportId: 's4' },
  { id: 'div11', name: "Men's Singles",    sportId: 's3' },
  { id: 'div12', name: "Women's Singles",  sportId: 's3' },
  { id: 'div13', name: 'Open Collegiate',  sportId: 's_frisbee' },
  { id: 'div14', name: 'Standard Classical', sportId: 's8' },
  { id: 'div15', name: 'Individual Open',  sportId: 's_scrabble' },
  { id: 'div16', name: 'Collegiate 5v5',   sportId: 's5' },
  { id: 'div17', name: 'Collegiate 5v5',   sportId: 's6' },
  { id: 'div18', name: 'Collegiate 5v5',   sportId: 's7' },
];

export const INITIAL_OFFICIALS: GameOfficial[] = [];

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_EVENTS: TournamentEvent[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_AUDIT: AuditLog[] = [];

// Helper: generate unique ID
export const uid = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Mr. John Eric Samane',
    role: 'director',
    username: 'director',
    email: 'john.samane@asiancollege.edu.ph',
    isActive: true,
    avatarInitials: 'JS',
    gmailVerified: true,
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    email: 'john.samane@asiancollege.edu.ph',
    name: 'Mr. John Eric Samane',
    role: 'director',
    status: 'active',
    addedBy: 'system',
    createdAt: '2026-11-01T08:00:00Z',
    lastLoginAt: '2026-11-09T07:50:00Z',
  },
];

export const PUBLIC_GUEST_USER: User = {
  id: 'guest',
  name: 'Public Visitor',
  role: 'guest',
  username: 'guest',
  email: '',
  avatarInitials: 'PV',
};

// ── 3 MOCK ACCOUNTS (all records marked isMock = true) ────────────────────────
export const MOCK_STAFF: StaffMember[] = [];

// ── MOCK SAMPLE DATA (all records marked isMock = true) ────────────────────────
export const MOCK_EVENT: TournamentEvent = {
  id: 'mock-ev-1',
  name: 'Padula Mock 2026',
  sport: 's1', // Basketball
  division: 'div1',
  category: "Men's Varsity",
  dates: 'Nov 15 - Nov 20, 2026',
  startDate: '2026-11-15',
  endDate: '2026-11-20',
  venue: 'Court 1',
  status: 'ongoing',
  bracket: [],
  isMock: true,
};

export const MOCK_VENUE: Venue = {
  id: 'mock-ven-1',
  name: 'Court 1',
  capacity: 350,
  location: 'Mock Sports Pavilion',
  sports: ['s1'],
  isMock: true,
};

export const MOCK_DEPARTMENTS: Department[] = [];

export const MOCK_PLAYERS: Player[] = [];

export const MOCK_TEAMS: Team[] = [];

export const MOCK_MATCHES: Match[] = [];

export const MOCK_ANNOUNCEMENT: Announcement = {
  id: 'mock-ann-1',
  title: 'Mock Tournament Notice',
  body: 'Welcome to Padula Mock 2026 test event. This is a simulated environment for official verification.',
  priority: 'normal',
  createdAt: '2026-11-10T08:00:00Z',
  createdBy: 'Mock Director',
  isMock: true,
};


