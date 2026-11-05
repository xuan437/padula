-- ==============================================================================
-- ASIAN COLLEGE PADULA INTRAMURALS — COMPLETE SUPABASE DATABASE SCHEMA & SEED
-- Asian College Athletics, Dumaguete City
--
-- Instructions to run in Supabase:
-- 1. Open your Supabase Project Dashboard
-- 2. Go to "SQL Editor" -> "New Query"
-- 3. Paste this entire script and click "Run"
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- CLEAN RESET: Drop existing tables to prevent schema/column drift
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS tournament_events CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS officials CASCADE;
DROP TABLE IF EXISTS divisions CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE DEFINITIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. DEPARTMENTS / COLLEGES
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VENUES & COURTS
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INT DEFAULT 300,
  location TEXT,
  sports JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DIVISIONS / CATEGORIES
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACCREDITED GAME OFFICIALS
CREATE TABLE IF NOT EXISTS officials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('scorekeeper', 'coach', 'manager', 'referee')),
  sport TEXT NOT NULL,
  affiliation TEXT,
  license_id TEXT,
  contact TEXT,
  assigned_game_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COLLEGIATE ATHLETIC TEAMS
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  department TEXT NOT NULL,
  division TEXT,
  coach TEXT,
  seed INT,
  color TEXT DEFAULT '#3b82f6',
  players JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENT ATHLETES & PLAYERS
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  jersey_number TEXT,
  position TEXT,
  gwa NUMERIC(4,2),
  medical_cleared BOOLEAN DEFAULT true,
  date_of_birth DATE,
  place_of_birth TEXT,
  manager TEXT,
  int_matches INT DEFAULT 0,
  int_goals INT DEFAULT 0,
  current_season_goals INT DEFAULT 0,
  current_season_assists INT DEFAULT 0,
  performance_trend JSONB DEFAULT '[]'::jsonb,
  career_history JSONB DEFAULT '[]'::jsonb,
  match_stats JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TOURNAMENT MATCHES
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  division TEXT,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  score_a INT DEFAULT 0,
  score_b INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  venue TEXT NOT NULL,
  round TEXT NOT NULL,
  round_number INT DEFAULT 1,
  match_number INT DEFAULT 1,
  scheduled_time TIMESTAMPTZ,
  winner TEXT,
  referee TEXT,
  scorekeeper TEXT,
  coach_a TEXT,
  coach_b TEXT,
  manager TEXT,
  conflict_warning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TOURNAMENT EVENTS & CALENDARS
CREATE TABLE IF NOT EXISTS tournament_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  division TEXT,
  category TEXT,
  dates TEXT,
  start_date DATE,
  end_date DATE,
  venue TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. OFFICIAL ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SYSTEM AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  details TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. USER ACCOUNTS (Role-based authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'coordinator', 'scorer', 'player', 'guest')),
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  department TEXT,
  assigned_sport TEXT,
  avatar_initials TEXT,
  gmail_verified BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_default_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public / Anon read & authenticated operational policies
DO $$
BEGIN
  -- Departments
  DROP POLICY IF EXISTS "Public Read Departments" ON departments;
  CREATE POLICY "Public Read Departments" ON departments FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Departments" ON departments;
  CREATE POLICY "Operational Write Departments" ON departments FOR ALL USING (true);

  -- Venues
  DROP POLICY IF EXISTS "Public Read Venues" ON venues;
  CREATE POLICY "Public Read Venues" ON venues FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Venues" ON venues;
  CREATE POLICY "Operational Write Venues" ON venues FOR ALL USING (true);

  -- Divisions
  DROP POLICY IF EXISTS "Public Read Divisions" ON divisions;
  CREATE POLICY "Public Read Divisions" ON divisions FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Divisions" ON divisions;
  CREATE POLICY "Operational Write Divisions" ON divisions FOR ALL USING (true);

  -- Officials
  DROP POLICY IF EXISTS "Public Read Officials" ON officials;
  CREATE POLICY "Public Read Officials" ON officials FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Officials" ON officials;
  CREATE POLICY "Operational Write Officials" ON officials FOR ALL USING (true);

  -- Teams
  DROP POLICY IF EXISTS "Public Read Teams" ON teams;
  CREATE POLICY "Public Read Teams" ON teams FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Teams" ON teams;
  CREATE POLICY "Operational Write Teams" ON teams FOR ALL USING (true);

  -- Players
  DROP POLICY IF EXISTS "Public Read Players" ON players;
  CREATE POLICY "Public Read Players" ON players FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Players" ON players;
  CREATE POLICY "Operational Write Players" ON players FOR ALL USING (true);

  -- Matches
  DROP POLICY IF EXISTS "Public Read Matches" ON matches;
  CREATE POLICY "Public Read Matches" ON matches FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Matches" ON matches;
  CREATE POLICY "Operational Write Matches" ON matches FOR ALL USING (true);

  -- Tournament Events
  DROP POLICY IF EXISTS "Public Read Events" ON tournament_events;
  CREATE POLICY "Public Read Events" ON tournament_events FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Events" ON tournament_events;
  CREATE POLICY "Operational Write Events" ON tournament_events FOR ALL USING (true);

  -- Announcements
  DROP POLICY IF EXISTS "Public Read Announcements" ON announcements;
  CREATE POLICY "Public Read Announcements" ON announcements FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Announcements" ON announcements;
  CREATE POLICY "Operational Write Announcements" ON announcements FOR ALL USING (true);

  -- Audit Logs
  DROP POLICY IF EXISTS "Public Read Audit" ON audit_logs;
  CREATE POLICY "Public Read Audit" ON audit_logs FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Audit" ON audit_logs;
  CREATE POLICY "Operational Write Audit" ON audit_logs FOR ALL USING (true);

  -- Users
  DROP POLICY IF EXISTS "Public Read Users" ON users;
  CREATE POLICY "Public Read Users" ON users FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Users" ON users;
  CREATE POLICY "Operational Write Users" ON users FOR ALL USING (true);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COLUMN DEFENSIVE SAFEGUARDS (Ensures all columns exist before seeding)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS officials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS officials ADD COLUMN IF NOT EXISTS affiliation TEXT;
ALTER TABLE IF EXISTS officials ADD COLUMN IF NOT EXISTS license_id TEXT;
ALTER TABLE IF EXISTS officials ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE IF EXISTS officials ADD COLUMN IF NOT EXISTS assigned_game_id TEXT;

ALTER TABLE IF EXISTS teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS teams ADD COLUMN IF NOT EXISTS coach TEXT;
ALTER TABLE IF EXISTS teams ADD COLUMN IF NOT EXISTS seed INT;
ALTER TABLE IF EXISTS teams ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE IF EXISTS teams ADD COLUMN IF NOT EXISTS players JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS medical_cleared BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS gwa NUMERIC(4,2);
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS manager TEXT;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS int_matches INT DEFAULT 0;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS int_goals INT DEFAULT 0;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS current_season_goals INT DEFAULT 0;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS current_season_assists INT DEFAULT 0;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS performance_trend JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS career_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS players ADD COLUMN IF NOT EXISTS match_stats JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_default_password BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS gmail_verified BOOLEAN DEFAULT true;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTION SEED DATA (Asian College Athletics, Dumaguete)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. DEPARTMENTS
INSERT INTO departments (id, name, short_name, color) VALUES
  ('d1', 'Business Administration & Accountancy', 'BAA',         '#f59e0b'),
  ('d2', 'Computer Studies & Engineering',        'CSE',         '#3b82f6'),
  ('d3', 'Hospitality & Tourism Management',       'HTM',         '#f97316'),
  ('d4', 'Diploma Program Department',      'DPD',         '#ef4444'),
  ('d5', 'Senior Department',                     'Senior Dept', '#8b5cf6')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, short_name = EXCLUDED.short_name, color = EXCLUDED.color;

-- 2. VENUES
INSERT INTO venues (id, name, capacity, location, sports) VALUES
  ('v1', 'Main Arena Court 1',  500, 'Main Gymnasium - East Wing', '["s1", "s2"]'::jsonb),
  ('v2', 'Main Arena Court 2',  500, 'Main Gymnasium - West Wing', '["s1", "s2"]'::jsonb),
  ('v3', 'Pavilion Court',       300, 'Sports Pavilion Center',    '["s2", "s3"]'::jsonb),
  ('v4', 'Fieldhouse Annex',     200, 'Fieldhouse Complex',        '["s3", "s4"]'::jsonb),
  ('v5', 'Esports Arena',        120, 'CSE Innovation Hub',        '["s5", "s6", "s7"]'::jsonb),
  ('v6', 'Chess Hall',            80, 'Academic Hall 2nd Floor',   '["s8"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, capacity = EXCLUDED.capacity, location = EXCLUDED.location, sports = EXCLUDED.sports;

-- 3. DIVISIONS
INSERT INTO divisions (id, name, sport_id) VALUES
  ('div1', 'Men''s Varsity',   's1'),
  ('div2', 'Women''s Varsity', 's1'),
  ('div3', 'Men''s Varsity',   's2'),
  ('div4', 'Women''s Varsity', 's2'),
  ('div5', 'Men''s Singles',   's3'),
  ('div6', 'Women''s Singles', 's3')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sport_id = EXCLUDED.sport_id;

-- 4. OFFICIALS
INSERT INTO officials (id, name, role, sport, affiliation, license_id, contact, is_active) VALUES
  ('off-sk-1', 'Sam Chen',           'scorekeeper', 'Basketball', 'Asian College Athletic Board',  'PAD-SK-01',  'sam.chen@asiancollege.edu.ph', true),
  ('off-sk-2', 'Maria Santos',        'scorekeeper', 'Volleyball', 'Asian College Athletic Board',  'PAD-SK-02',  'm.santos@asiancollege.edu.ph', true),
  ('off-sk-3', 'Lee Park',            'scorekeeper', 'Badminton',  'Asian College Athletic Board',  'PAD-SK-03',  'l.park@asiancollege.edu.ph', true),
  ('off-ch-1', 'Coach Rivera',        'coach',       'Basketball', 'College of Computer Studies',   'PAD-COA-01', 'rivera@athletics.edu.ph', true),
  ('off-ch-2', 'Coach Henderson',     'coach',       'Basketball', 'College of Business Admin',     'PAD-COA-02', 'henderson@athletics.edu.ph', true),
  ('off-ch-3', 'Coach Alvarez',       'coach',       'Volleyball', 'College of Engineering',        'PAD-COA-03', 'alvarez@athletics.edu.ph', true),
  ('off-ch-4', 'Coach Morales',       'coach',       'Volleyball', 'College of Arts & Sciences',    'PAD-COA-04', 'morales@athletics.edu.ph', true),
  ('off-mg-1', 'Director Dave Cruz',  'manager',     'All Sports', 'BAA',                           'PAD-MGR-01', 'd.cruz@asiancollege.edu.ph', true),
  ('off-mg-2', 'Dean Gloria Ramos',   'manager',     'All Sports', 'CSE',                           'PAD-MGR-02', 'g.ramos@asiancollege.edu.ph', true),
  ('off-mg-3', 'Engr. Victor Tan',    'manager',     'All Sports', 'HTM',                           'PAD-MGR-03', 'v.tan@asiancollege.edu.ph', true),
  ('off-rf-1', 'Prof. Marcus Aurelio','referee',     'Basketball', 'National Referees Commission',  'PAD-REF-01', 'm.aurelio@referees.org', true),
  ('off-rf-2', 'Elena Rostova',       'referee',     'Volleyball', 'FIVB Certified Commission',     'PAD-REF-02', 'e.rostova@referees.org', true),
  ('off-rf-3', 'Carlos Mendez',       'referee',     'Badminton',  'BWF Accredited Referees',       'PAD-REF-03', 'c.mendez@referees.org', true),
  ('off-rf-4', 'Dante Silva',         'referee',     'Basketball', 'Asian College Referees Guild',  'PAD-REF-04', 'd.silva@referees.org', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, role = EXCLUDED.role, sport = EXCLUDED.sport,
  affiliation = EXCLUDED.affiliation, license_id = EXCLUDED.license_id, contact = EXCLUDED.contact;

-- 5. TEAMS
INSERT INTO teams (id, name, sport, department, division, coach, seed, color, players, is_active) VALUES
  ('t1', 'Padula Eagles',  's1', 'd1', 'div1', 'Coach Rivera',    1, '#f59e0b', '["p1", "p2", "p3", "p4", "p5"]'::jsonb, true),
  ('t2', 'Red Lions',      's1', 'd2', 'div1', 'Coach Henderson', 2, '#3b82f6', '["p6", "p7", "p8", "p9", "p10"]'::jsonb, true),
  ('t3', 'Blue Sharks',    's1', 'd3', 'div1', 'Coach Alvarez',   3, '#f97316', '["p11", "p12", "p13", "p14", "p15"]'::jsonb, true),
  ('t4', 'Padula Tigers',  's1', 'd4', 'div1', 'Coach Morales',   4, '#ef4444', '["p16", "p17", "p18", "p19", "p20"]'::jsonb, true),
  ('t5', 'Panthers',       's1', 'd5', 'div1', 'Coach Henderson', 5, '#8b5cf6', '["p21", "p22", "p23", "p24", "p25"]'::jsonb, true),
  ('t6', 'Silver Wolves',  's1', 'd1', 'div1', 'Coach Alvarez',   6, '#d97706', '["p26", "p27", "p28", "p29", "p30"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, sport = EXCLUDED.sport, department = EXCLUDED.department,
  coach = EXCLUDED.coach, seed = EXCLUDED.seed, color = EXCLUDED.color, players = EXCLUDED.players;

-- 6. PLAYERS
INSERT INTO players (
  id, name, student_id, department, sport, team_id, jersey_number, position,
  gwa, medical_cleared, date_of_birth, place_of_birth, manager,
  int_matches, int_goals, current_season_goals, current_season_assists,
  performance_trend, career_history, match_stats, is_active
) VALUES
  (
    'p1', 'Juan dela Cruz', '2024-001', 'd1', 's1', 't1', '10', 'Point Guard',
    1.75, true, '2003-07-15', 'Dumaguete City, PH', 'Director Dave Cruz',
    6, 4, 29, 14,
    '[14, 18, 22, 21, 28, 35, 42]'::jsonb,
    '[{"season": "2025-2026", "team": "Padula Eagles", "matches": 14, "goals": 21}, {"season": "2024-2025", "team": "Dumaguete Heat", "matches": 18, "goals": 19}]'::jsonb,
    '[{"matchId": "m1", "matchday": "MD 1", "opponent": "Red Lions", "venue": "H", "result": "W 45-38", "minutes": 36, "points": 24, "assists": 7, "rebounds": 5, "fouls": 2, "rating": 9.2}]'::jsonb,
    true
  ),
  (
    'p2', 'Maria Reyes', '2024-002', 'd1', 's1', 't1', '23', 'Small Forward',
    1.50, true, '2004-02-18', 'Bacolod City, PH', 'Coach Rivera',
    5, 3, 24, 8,
    '[12, 16, 20, 24, 26, 30]'::jsonb,
    '[{"season": "2025-2026", "team": "Padula Eagles", "matches": 12, "goals": 18}]'::jsonb,
    '[{"matchId": "m1", "matchday": "MD 1", "opponent": "Red Lions", "venue": "H", "result": "W 45-38", "minutes": 32, "points": 18, "assists": 4, "rebounds": 6, "fouls": 1, "rating": 8.9}]'::jsonb,
    true
  ),
  (
    'p3', 'Christian Santos', '2024-003', 'd2', 's1', 't2', '07', 'Shooting Guard',
    1.85, true, '2003-11-04', 'Dumaguete City, PH', 'Coach Henderson',
    4, 2, 21, 10,
    '[10, 15, 18, 21, 23, 27]'::jsonb,
    '[{"season": "2025-2026", "team": "Red Lions", "matches": 10, "goals": 15}]'::jsonb,
    '[{"matchId": "m1", "matchday": "MD 1", "opponent": "Padula Eagles", "venue": "A", "result": "L 38-45", "minutes": 34, "points": 20, "assists": 5, "rebounds": 3, "fouls": 2, "rating": 8.6}]'::jsonb,
    true
  ),
  (
    'p4', 'David Lim', '2024-004', 'd3', 's1', 't3', '15', 'Center',
    2.10, true, '2002-09-22', 'Cebu City, PH', 'Coach Alvarez',
    6, 1, 17, 4,
    '[8, 12, 14, 16, 18, 22]'::jsonb,
    '[{"season": "2025-2026", "team": "Blue Sharks", "matches": 11, "goals": 12}]'::jsonb,
    '[{"matchId": "m2", "matchday": "MD 1", "opponent": "Padula Tigers", "venue": "H", "result": "W 2-1", "minutes": 28, "points": 14, "assists": 2, "rebounds": 11, "fouls": 3, "rating": 8.5}]'::jsonb,
    true
  ),
  (
    'p5', 'Patricia Gomez', '2024-005', 'd4', 's2', 't4', '05', 'Setter',
    1.60, true, '2004-05-12', 'Dumaguete City, PH', 'Coach Morales',
    7, 5, 15, 22,
    '[15, 17, 21, 25, 28, 32]'::jsonb,
    '[{"season": "2025-2026", "team": "Padula Tigers", "matches": 13, "goals": 11}]'::jsonb,
    '[{"matchId": "m2", "matchday": "MD 1", "opponent": "Blue Sharks", "venue": "A", "result": "L 1-2", "minutes": 30, "points": 12, "assists": 18, "rebounds": 4, "fouls": 1, "rating": 8.7}]'::jsonb,
    true
  ),
  (
    'p6', 'Marcus Tan', '2024-006', 'd5', 's1', 't5', '33', 'Power Forward',
    2.25, false, '2003-01-30', 'Dumaguete City, PH', 'Coach Henderson',
    2, 0, 8, 3,
    '[6, 8, 9, 11]'::jsonb,
    '[{"season": "2025-2026", "team": "Panthers", "matches": 6, "goals": 8}]'::jsonb,
    '[]'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, student_id = EXCLUDED.student_id, department = EXCLUDED.department,
  sport = EXCLUDED.sport, team_id = EXCLUDED.team_id, jersey_number = EXCLUDED.jersey_number,
  position = EXCLUDED.position, gwa = EXCLUDED.gwa, medical_cleared = EXCLUDED.medical_cleared,
  current_season_goals = EXCLUDED.current_season_goals, current_season_assists = EXCLUDED.current_season_assists;

-- 7. MATCHES
INSERT INTO matches (
  id, sport, division, team_a, team_b, score_a, score_b,
  status, venue, round, round_number, match_number, scheduled_time,
  winner, referee, scorekeeper, coach_a, coach_b, manager, conflict_warning
) VALUES
  (
    'm1', 's1', 'div1', 'Padula Eagles', 'Red Lions', 45, 38,
    'live', 'Main Arena Court 1', 'Semi-Final', 2, 1, '2026-11-10T09:00:00Z',
    NULL, 'Prof. Marcus Aurelio', 'Sam Chen', 'Coach Rivera', 'Coach Henderson', 'Director Dave Cruz', NULL
  ),
  (
    'm2', 's2', 'div3', 'Blue Sharks', 'Padula Tigers', 2, 1,
    'live', 'Pavilion Court', 'Quarter-Final', 1, 2, '2026-11-10T10:00:00Z',
    NULL, 'Elena Rostova', 'Maria Santos', 'Coach Alvarez', 'Coach Morales', 'Dean Gloria Ramos', NULL
  ),
  (
    'm3', 's3', 'div5', 'Chris Kim', 'Alex Park', 21, 18,
    'finished', 'Fieldhouse Annex', 'Gold Final', 3, 1, '2026-11-09T14:00:00Z',
    'Chris Kim', 'Carlos Mendez', 'Lee Park', 'Coach Rivera', 'Coach Alvarez', 'Director Dave Cruz', NULL
  ),
  (
    'm4', 's1', 'div1', 'Panthers', 'Silver Wolves', 0, 0,
    'scheduled', 'Main Arena Court 2', 'Quarter-Final', 1, 4, '2026-11-11T09:00:00Z',
    NULL, 'Dante Silva', 'Sam Chen', 'Coach Henderson', 'Coach Morales', 'Engr. Victor Tan',
    'Scorer Sam Chen has multiple concurrent matches scheduled'
  ),
  (
    'm5', 's4', 'div1', 'Padula Smashers', 'Tiger Spinners', 3, 1,
    'live', 'Fieldhouse Annex', 'Semi-Final', 2, 1, '2026-11-10T11:00:00Z',
    NULL, 'Prof. Marcus Aurelio', 'Lee Park', 'Coach Rivera', 'Coach Morales', 'Director Dave Cruz', NULL
  ),
  (
    'm6', 's1', 'div1', 'Blue Sharks', 'Padula Eagles', 58, 62,
    'finished', 'Main Arena Court 1', 'Quarter-Final', 1, 1, '2026-11-08T15:30:00Z',
    'Padula Eagles', 'Prof. Marcus Aurelio', 'Sam Chen', 'Coach Alvarez', 'Coach Rivera', 'Director Dave Cruz', NULL
  )
ON CONFLICT (id) DO UPDATE SET
  sport = EXCLUDED.sport, division = EXCLUDED.division, team_a = EXCLUDED.team_a, team_b = EXCLUDED.team_b,
  score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b, status = EXCLUDED.status,
  venue = EXCLUDED.venue, round = EXCLUDED.round, winner = EXCLUDED.winner,
  referee = EXCLUDED.referee, scorekeeper = EXCLUDED.scorekeeper;

-- 8. TOURNAMENT EVENTS
INSERT INTO tournament_events (
  id, name, sport, division, category, dates, start_date, end_date, venue, status, archived
) VALUES
  (
    'ev-1', 'Asian College Padula Intramurals 2026', 's1', 'div1',
    'Inter-Collegiate Championship', 'Nov 10 – Nov 18, 2026', '2026-11-10', '2026-11-18',
    'Main Arena Court 1', 'published', false
  ),
  (
    'ev-2', 'Dumaguete Collegiate Volleyball Cup 2026', 's2', 'div3',
    'Collegiate Men & Women Division', 'Nov 12 – Nov 20, 2026', '2026-11-12', '2026-11-20',
    'Pavilion Court', 'published', false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, dates = EXCLUDED.dates, status = EXCLUDED.status;

-- 9. ANNOUNCEMENTS
INSERT INTO announcements (id, title, body, priority, created_by, created_at) VALUES
  (
    'ann-1',
    'Championship Finals Schedule Broadcasted',
    'All varsity athletes and registered tournament officials are required to present athletic clearance at Main Arena Court 1 by 08:00 AM.',
    'urgent',
    'Sports Director Alex Rivera',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'ann-2',
    'Digital Scorer Console Verification Active',
    'Referees and certified scorers must authenticate via their official credentials before entering match scores.',
    'normal',
    'Athletics Governance Board',
    NOW() - INTERVAL '5 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, body = EXCLUDED.body, priority = EXCLUDED.priority;

-- 10. AUDIT LOGS
INSERT INTO audit_logs (id, action, user_id, user_name, user_role, details, entity_id, entity_type, created_at) VALUES
  ('al-1', 'login', 'u1', 'Alex Rivera', 'director', 'Sports Director authorized master session.', 'u1', 'User', NOW() - INTERVAL '30 minutes'),
  ('al-2', 'match_start', 'u3', 'Sam Chen', 'scorer', 'Official match clock started: Padula Eagles vs Red Lions', 'm1', 'Match', NOW() - INTERVAL '25 minutes'),
  ('al-3', 'score_update', 'u3', 'Sam Chen', 'scorer', 'Score update verified: Padula Eagles 45 – Red Lions 38', 'm1', 'Match', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO UPDATE SET
  details = EXCLUDED.details, created_at = EXCLUDED.created_at;

-- 11. USERS & INITIAL ACCOUNTS
-- Password: 'password123' or 'admin123'
INSERT INTO users (
  id, name, role, username, email, password, department, assigned_sport,
  avatar_initials, gmail_verified, is_active, is_default_password
) VALUES
  (
    'u1', 'Alex Rivera', 'director', 'admin',
    'admin@asiancollege.edu.ph', 'admin123', 'd1', 'All Sports',
    'AR', true, true, true
  ),
  (
    'u2', 'Jordan Lee', 'coordinator', 'coordinator',
    'j.lee@asiancollege.edu.ph', 'password123', 'd1', 'Basketball',
    'JL', true, true, false
  ),
  (
    'u3', 'Sam Chen', 'scorer', 'scorer',
    's.chen@asiancollege.edu.ph', 'password123', 'd1', 'Basketball',
    'SC', true, true, false
  ),
  (
    'u4', 'Maria Santos', 'scorer', 'scorer.santos',
    'm.santos@asiancollege.edu.ph', 'password123', 'd2', 'Volleyball',
    'MS', true, true, false
  ),
  (
    'u5', 'Juan dela Cruz', 'player', '2024-001',
    'juan.delacruz@asiancollege.edu.ph', 'password123', 'd1', 'Basketball',
    'JC', true, true, false
  ),
  (
    'u6', 'Maria Reyes', 'player', '2024-002',
    'maria.reyes@asiancollege.edu.ph', 'password123', 'd1', 'Basketball',
    'MR', true, true, false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, role = EXCLUDED.role, email = EXCLUDED.email, password = EXCLUDED.password;
