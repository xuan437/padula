import type {
  Department, Venue, Division, GameOfficial,
  Team, Player, Match, TournamentEvent, Announcement, AuditLog, User, StaffMember, StaffInvitation, AccessRequest
} from '../types';

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'director-samane',
    email: 'jsamane@asiancollege.edu.ph',
    name: 'Mr. John Eric Samane',
    role: 'director',
    status: 'active',
    password: 'padulaAdmin2026',
    invitationStatus: 'accepted',
    invitationId: 'inv-director-samane',
    addedBy: 'system',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'demo-director',
    email: 'demo.director@asiancollege.edu.ph',
    name: 'Demo Director',
    role: 'director',
    status: 'active',
    isMock: true,
    addedBy: 'system',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'demo-coordinator',
    email: 'demo.coordinator@asiancollege.edu.ph',
    name: 'Demo Coordinator',
    role: 'coordinator',
    assignedCompetitionId: 's1',
    status: 'active',
    isMock: true,
    password: 'Padula2026!CO-1001',
    invitationStatus: 'accepted',
    invitationId: 'inv-demo-coordinator',
    addedBy: 'jsamane@asiancollege.edu.ph',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'demo-scorer',
    email: 'demo.scorer@asiancollege.edu.ph',
    name: 'Demo Scorer',
    role: 'scorer',
    assignedCompetitionId: 's1',
    status: 'active',
    isMock: true,
    password: 'Padula2026!SK-1002',
    invitationStatus: 'accepted',
    invitationId: 'inv-demo-scorer',
    addedBy: 'jsamane@asiancollege.edu.ph',
    createdAt: '2026-10-01T08:00:00Z',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'director-samane',
    name: 'Mr. John Eric Samane',
    role: 'director',
    username: 'jsamane',
    email: 'jsamane@asiancollege.edu.ph',
    avatarInitials: 'JS',
    gmailVerified: true,
    status: 'active',
    isActive: true,
    password: 'padulaAdmin2026',
    invitationStatus: 'accepted',
    invitationId: 'inv-director-samane',
  },
  {
    id: 'demo-director',
    name: 'Demo Director',
    role: 'director',
    username: 'demo.director',
    email: 'demo.director@asiancollege.edu.ph',
    avatarInitials: 'DD',
    gmailVerified: true,
    status: 'active',
    isActive: true,
    isMock: true,
  },
  {
    id: 'demo-coordinator',
    name: 'Demo Coordinator',
    role: 'coordinator',
    username: 'demo.coordinator',
    email: 'demo.coordinator@asiancollege.edu.ph',
    assignedSport: 's1',
    assignedCompetitionId: 's1',
    department: 'd3',
    avatarInitials: 'DC',
    gmailVerified: true,
    status: 'active',
    isActive: true,
  },
  {
    id: 'demo-scorer',
    name: 'Demo Scorer',
    role: 'scorer',
    username: 'demo.scorer',
    email: 'demo.scorer@asiancollege.edu.ph',
    assignedSport: 's1',
    assignedCompetitionId: 's1',
    avatarInitials: 'DS',
    gmailVerified: true,
    status: 'active',
    isActive: true,
  },
];

export const INITIAL_STAFF_INVITATIONS: StaffInvitation[] = [
  {
    id: 'inv-director-samane',
    recipientName: 'Mr. John Eric Samane',
    recipientEmail: 'jsamane@asiancollege.edu.ph',
    role: 'director',
    roleTitle: 'Sports Director',
    assignedSportOrDept: 'All Sports & Governance',
    generatedPassword: 'padulaAdmin2026',
    status: 'accepted',
    sentBy: 'Board of Trustees & Office of the President',
    sentByEmail: 'bot@asiancollege.edu.ph',
    sentAt: '2026-10-01T08:00:00Z',
    subject: '[Asian College Padula 2026] Official Appointment & Portal Credentials — Sports Director',
    letterBody: [
      'Dear Mr. John Eric Samane,',
      '',
      'Greetings from the Asian College Padula Athletics Governance Board!',
      '',
      'You have been officially commissioned by the Board of Trustees and Office of the President to serve as Sports Director for the Asian College Padula 2026.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'OFFICIAL EXECUTIVE CREDENTIALS',
      '• Registered Email: jsamane@asiancollege.edu.ph',
      '• Assigned Password: padulaAdmin2026',
      '• Official Role: Sports Director',
      '• Assigned Scope: All Sports & Tournament Governance',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'This fixed credential is reserved exclusively for the Sports Director.',
      '',
      'Sincerely,',
      'Board of Trustees & Office of the President',
      'Asian College Dumaguete — Padula Athletics',
    ].join('\n'),
  },
  {
    id: 'inv-demo-coordinator',
    recipientName: 'Demo Coordinator',
    recipientEmail: 'demo.coordinator@asiancollege.edu.ph',
    role: 'coordinator',
    roleTitle: 'Sports Coordinator',
    assignedSportOrDept: 'Basketball (s1)',
    generatedPassword: 'Padula2026!CO-1001',
    status: 'accepted',
    sentBy: 'Mr. John Eric Samane',
    sentByEmail: 'jsamane@asiancollege.edu.ph',
    sentAt: '2026-10-01T08:00:00Z',
    subject: '[Asian College Padula 2026] Official Appointment & Portal Credentials — Sports Coordinator',
    letterBody: [
      'Dear Demo Coordinator,',
      '',
      'Greetings from the Asian College Padula Athletics Governance Board!',
      '',
      'You have been officially registered and appointed by Sports Director Mr. John Eric Samane (jsamane@asiancollege.edu.ph) to serve as Sports Coordinator (Basketball) for the Asian College Padula 2026.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'OFFICIAL PORTAL LOGIN CREDENTIALS',
      '• Registered Email: demo.coordinator@asiancollege.edu.ph',
      '• Assigned Password: Padula2026!CO-1001',
      '• Official Role: Sports Coordinator',
      '• Assigned Scope: Basketball (s1)',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Sincerely,',
      'Mr. John Eric Samane',
      'Sports Director (jsamane@asiancollege.edu.ph)',
      'Asian College Dumaguete — Padula Athletics',
    ].join('\n'),
  },
  {
    id: 'inv-demo-scorer',
    recipientName: 'Demo Scorer',
    recipientEmail: 'demo.scorer@asiancollege.edu.ph',
    role: 'scorer',
    roleTitle: 'Official Scorekeeper',
    assignedSportOrDept: 'Basketball (s1)',
    generatedPassword: 'Padula2026!SK-1002',
    status: 'accepted',
    sentBy: 'Mr. John Eric Samane',
    sentByEmail: 'jsamane@asiancollege.edu.ph',
    sentAt: '2026-10-01T08:00:00Z',
    subject: '[Asian College Padula 2026] Official Appointment & Portal Credentials — Official Scorekeeper',
    letterBody: [
      'Dear Demo Scorer,',
      '',
      'Greetings from the Asian College Padula Athletics Governance Board!',
      '',
      'You have been officially registered and appointed by Sports Director Mr. John Eric Samane (jsamane@asiancollege.edu.ph) to serve as Official Scorekeeper (Basketball) for the Asian College Padula 2026.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'OFFICIAL PORTAL LOGIN CREDENTIALS',
      '• Registered Email: demo.scorer@asiancollege.edu.ph',
      '• Assigned Password: Padula2026!SK-1002',
      '• Official Role: Official Scorekeeper',
      '• Assigned Scope: Basketball (s1)',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Sincerely,',
      'Mr. John Eric Samane',
      'Sports Director (jsamane@asiancollege.edu.ph)',
      'Asian College Dumaguete — Padula Athletics',
    ].join('\n'),
  },
];

export const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [];

export const PUBLIC_GUEST_USER: User = {
  id: 'guest',
  name: 'Spectator',
  role: 'guest',
  username: 'guest',
  email: 'guest@asiancollege.edu.ph',
  avatarInitials: 'G',
  gmailVerified: false,
  isActive: true,
};

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Business Administration & Accountancy', shortName: 'BAA', color: '#eab308' },
  { id: 'd2', name: 'Hotel & Tourism Management',            shortName: 'HTM', color: '#dc2626' },
  { id: 'd3', name: 'Computer Studies & Engineering',        shortName: 'CSE', color: '#9333ea' },
  { id: 'd4', name: 'Diploma Programs Department',           shortName: 'DPD', color: '#059669' },
  { id: 'd5', name: 'Senior High School Department',         shortName: 'SHS', color: '#0284c7' },
];

export const INITIAL_VENUES: Venue[] = [
  { id: 'v1', name: 'Main Arena Court 1', capacity: 800, location: 'Gymnasium Building A', sports: ['s1', 's2'] },
  { id: 'v2', name: 'Main Arena Court 2', capacity: 400, location: 'Gymnasium Building A', sports: ['s1', 's2', 's3', 's_sepaktakraw'] },
  { id: 'v3', name: 'Student Center Hall', capacity: 200, location: 'Student Center 2F', sports: ['s4', 's8', 's_scrabble'] },
  { id: 'v4', name: 'Esports Arena Lab 1', capacity: 120, location: 'IT Building 3F', sports: ['s5', 's6', 's7'] },
  { id: 'v5', name: 'Main Sports Field', capacity: 1000, location: 'Outdoor Campus Oval', sports: ['s_football', 's_frisbee'] },
];

export const INITIAL_DIVISIONS: Division[] = [
  { id: 'div1', name: "Men's Collegiate",   sportId: 's1' },
  { id: 'div2', name: "Women's Collegiate", sportId: 's1' },
  { id: 'div3', name: "Men's Collegiate",   sportId: 's2' },
  { id: 'div4', name: "Women's Collegiate", sportId: 's2' },
  { id: 'div5', name: 'Open Division',      sportId: 's3' },
  { id: 'div6', name: 'Open Division',      sportId: 's4' },
  { id: 'div7', name: 'Open Division',      sportId: 's5' },
  { id: 'div8', name: 'Open Division',      sportId: 's6' },
  { id: 'div9', name: 'Open Division',      sportId: 's7' },
  { id: 'div10', name: 'Open Division',     sportId: 's8' },
  { id: 'div11', name: 'Open Division',     sportId: 's_football' },
  { id: 'div12', name: 'Open Division',     sportId: 's_sepaktakraw' },
  { id: 'div13', name: 'Open Division',     sportId: 's_frisbee' },
  { id: 'div14', name: 'Open Division',     sportId: 's_scrabble' },
];


export const INITIAL_OFFICIALS: GameOfficial[] = [];

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_EVENTS: TournamentEvent[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_AUDIT: AuditLog[] = [];

export const MOCK_VENUE: Venue = INITIAL_VENUES[0];
export const MOCK_DEPARTMENTS: Department[] = [];

export const ARCHIVED_2025_SUMMARY = {
  season: 'Padula 2025',
  overallChampion: 'CSE — Computer Studies & Engineering',
  runnerUp: 'BAA — Business Administration & Accountancy',
  totalMatches: 42,
  totalAthletes: 164,
  departmentMedals: [
    { dept: 'CSE', gold: 5, silver: 3, bronze: 2, points: 38 },
    { dept: 'BAA', gold: 4, silver: 4, bronze: 3, points: 35 },
    { dept: 'HTM', gold: 2, silver: 3, bronze: 4, points: 23 },
    { dept: 'DPD', gold: 1, silver: 1, bronze: 2, points: 10 },
    { dept: 'SHS', gold: 0, silver: 1, bronze: 1, points: 4 },
  ],
};

let counter = 100;
export const uid = (prefix = 'id') => `${prefix}-${++counter}-${Date.now().toString(36)}`;
