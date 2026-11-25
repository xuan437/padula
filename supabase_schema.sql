-- ==============================================================================
-- ASIAN COLLEGE PADULA SPORTS — COMPLETE SUPABASE DATABASE SCHEMA & SEED
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
DROP TABLE IF EXISTS email_send_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS staff_invitations CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS match_score_audits CASCADE;
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
  trainer TEXT,
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
  email TEXT,
  department TEXT NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  team_name TEXT,
  jersey_number TEXT,
  position TEXT,
  gwa NUMERIC(4,2),
  medical_cleared BOOLEAN DEFAULT true,
  roster_status TEXT DEFAULT 'in_play',
  fouls INT DEFAULT 0,
  foul_breakdown JSONB DEFAULT '{}'::jsonb,
  foul_logs JSONB DEFAULT '[]'::jsonb,
  sport_stats JSONB DEFAULT '{}'::jsonb,
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
  event_id TEXT,
  sport TEXT NOT NULL,
  division TEXT,
  format TEXT DEFAULT 'single_elimination',
  stage TEXT DEFAULT 'elimination',
  bracket_side TEXT,
  loser_next_match_id TEXT,
  loser_next_slot TEXT,
  best_of INT DEFAULT 1,
  series_wins_a INT DEFAULT 0,
  series_wins_b INT DEFAULT 0,
  advancing_teams_count INT,
  seeding_mode TEXT,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  score_a INT DEFAULT 0,
  score_b INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'submitted', 'finished', 'cancelled')),
  venue TEXT NOT NULL,
  round TEXT NOT NULL,
  round_number INT DEFAULT 1,
  slot INT,
  match_number INT DEFAULT 1,
  scheduled_time TIMESTAMPTZ,
  next_match_id TEXT,
  next_slot TEXT CHECK (next_slot IN ('A', 'B')),
  winner TEXT,
  finalized_by TEXT,
  finalized_at TIMESTAMPTZ,
  is_bye BOOLEAN DEFAULT false,
  scorer_id TEXT,
  referee TEXT,
  scorekeeper TEXT,
  coach_a TEXT,
  coach_b TEXT,
  manager TEXT,
  conflict_warning TEXT,
  period_scores JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  player_match_fouls JSONB DEFAULT '{}'::jsonb,
  player_lineup_status JSONB DEFAULT '{}'::jsonb,
  player_of_the_match JSONB,
  correction_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TOURNAMENT EVENTS & CALENDARS
CREATE TABLE IF NOT EXISTS tournament_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  division TEXT,
  format TEXT DEFAULT 'single_elimination',
  advancing_teams_count INT DEFAULT 4,
  seeding_mode TEXT DEFAULT 'seeded',
  season_year INT,
  category TEXT,
  dates TEXT,
  start_date DATE,
  end_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  referee TEXT,
  rules TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  bracket JSONB DEFAULT '[]'::jsonb,
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
  event_id TEXT,
  sport TEXT,
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

-- 10b. MATCH SCORE AUDIT LOGS (Score changes, submissions, and director overrides)
CREATE TABLE IF NOT EXISTS match_score_audits (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  caller_name TEXT NOT NULL,
  caller_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('score_update', 'score_finalize', 'score_override', 'score_correct', 'match_reopen')),
  old_score_a INT,
  old_score_b INT,
  new_score_a INT NOT NULL,
  new_score_b INT NOT NULL,
  winner TEXT,
  reason TEXT,
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

-- 12. STAFF DIRECTORY
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'coordinator', 'scorer')),
  assigned_competition_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  password TEXT,
  must_change_password BOOLEAN DEFAULT true,
  invitation_status TEXT,
  invitation_id TEXT,
  added_by TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACCESS REQUESTS
CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coordinator', 'scorer')),
  sport_or_dept TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  generated_password TEXT
);

-- 14. STAFF INVITATIONS (Stores SHA-256 hash of 24-hour one-time setup token; no raw password)
CREATE TABLE IF NOT EXISTS staff_invitations (
  id TEXT PRIMARY KEY,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  role TEXT NOT NULL,
  role_title TEXT,
  assigned_sport_or_dept TEXT,
  generated_password TEXT,
  setup_token_hash TEXT,
  setup_token_expires_at TIMESTAMPTZ,
  setup_token_used BOOLEAN DEFAULT false,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivery_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_by TEXT,
  sent_by_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  subject TEXT,
  letter_body TEXT
);

-- 14b. EMAIL SEND ATTEMPT LOGS
CREATE TABLE IF NOT EXISTS email_send_logs (
  id TEXT PRIMARY KEY,
  invitation_id TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  role_title TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  result TEXT NOT NULL CHECK (result IN ('sent', 'failed')),
  failure_reason TEXT,
  provider TEXT
);

-- 15. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE match_score_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

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

  -- Match Score Audits
  DROP POLICY IF EXISTS "Public Read Match Audits" ON match_score_audits;
  CREATE POLICY "Public Read Match Audits" ON match_score_audits FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Match Audits" ON match_score_audits;
  CREATE POLICY "Operational Write Match Audits" ON match_score_audits FOR ALL USING (true);

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

  -- Staff
  DROP POLICY IF EXISTS "Public Read Staff" ON staff;
  CREATE POLICY "Public Read Staff" ON staff FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Staff" ON staff;
  CREATE POLICY "Operational Write Staff" ON staff FOR ALL USING (true);

  -- Access Requests
  DROP POLICY IF EXISTS "Public Read Access Requests" ON access_requests;
  CREATE POLICY "Public Read Access Requests" ON access_requests FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Access Requests" ON access_requests;
  CREATE POLICY "Operational Write Access Requests" ON access_requests FOR ALL USING (true);

  -- Staff Invitations
  DROP POLICY IF EXISTS "Public Read Staff Invitations" ON staff_invitations;
  CREATE POLICY "Public Read Staff Invitations" ON staff_invitations FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Staff Invitations" ON staff_invitations;
  CREATE POLICY "Operational Write Staff Invitations" ON staff_invitations FOR ALL USING (true);

  -- Email Send Logs
  DROP POLICY IF EXISTS "Public Read Email Send Logs" ON email_send_logs;
  CREATE POLICY "Public Read Email Send Logs" ON email_send_logs FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Email Send Logs" ON email_send_logs;
  CREATE POLICY "Operational Write Email Send Logs" ON email_send_logs FOR ALL USING (true);

  -- System Settings
  DROP POLICY IF EXISTS "Public Read System Settings" ON system_settings;
  CREATE POLICY "Public Read System Settings" ON system_settings FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write System Settings" ON system_settings;
  CREATE POLICY "Operational Write System Settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Enable Supabase Realtime for system_settings so changes broadcast live to all users
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: FINISH_MATCH (Scorer-Controlled Finalization & Advancement)
-- Enforces:
-- 1. Match not found or already finished
-- 2. No placeholder teams
-- 3. No ties or 0-0
-- 4. Scorer identity or director/coordinator override
-- 5. Single atomic transaction for winner assignment and next round slot advance
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION finish_match(
  p_match_id TEXT,
  p_caller_name TEXT,
  p_caller_role TEXT DEFAULT 'scorer',
  p_is_override BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_winner TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Match not found.');
  END IF;

  IF v_match.status = 'finished' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Match is already finished.');
  END IF;

  IF v_match.team_a ILIKE 'Winner of%' OR v_match.team_b ILIKE 'Winner of%' OR
     v_match.team_a ILIKE 'TBD%' OR v_match.team_b ILIKE 'TBD%' OR
     v_match.team_a ILIKE 'BYE%' OR v_match.team_b ILIKE 'BYE%' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot finalize match with placeholder teams.');
  END IF;

  IF v_match.score_a = v_match.score_b THEN
    IF v_match.score_a = 0 THEN
      RETURN jsonb_build_object('success', false, 'message', 'Cannot finalize match with 0–0 scores. Game results must be entered.');
    ELSE
      RETURN jsonb_build_object('success', false, 'message', 'Cannot finalize match with tied scores. A knockout match must have a winner.');
    END IF;
  END IF;

  IF LOWER(TRIM(COALESCE(v_match.scorekeeper, ''))) <> LOWER(TRIM(p_caller_name)) THEN
    IF NOT (p_caller_role IN ('director', 'coordinator') AND p_is_override) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Security: Only assigned Official Scorer can finalize this match.');
    END IF;
  END IF;

  IF v_match.score_a > v_match.score_b THEN
    v_winner := v_match.team_a;
  ELSE
    v_winner := v_match.team_b;
  END IF;

  UPDATE matches SET
    status = 'finished',
    winner = v_winner,
    finalized_by = p_caller_name,
    finalized_at = v_now,
    conflict_warning = NULL
  WHERE id = p_match_id;

  IF v_match.next_match_id IS NOT NULL AND v_match.next_slot IS NOT NULL THEN
    IF v_match.next_slot = 'A' THEN
      UPDATE matches SET team_a = v_winner WHERE id = v_match.next_match_id;
    ELSIF v_match.next_slot = 'B' THEN
      UPDATE matches SET team_b = v_winner WHERE id = v_match.next_match_id;
    END IF;
  END IF;

  INSERT INTO audit_logs (id, action, user_id, user_name, user_role, details, entity_id, entity_type, created_at)
  VALUES (
    'al_' || gen_random_uuid(),
    CASE WHEN p_is_override THEN 'score_override' ELSE 'score_finalize' END,
    p_caller_name,
    p_caller_name,
    p_caller_role,
    'Finalized match ' || v_match.team_a || ' vs ' || v_match.team_b || ' with score ' || v_match.score_a || '–' || v_match.score_b || '. Winner: ' || v_winner,
    p_match_id,
    'Match',
    v_now
  );

  INSERT INTO match_score_audits (id, match_id, caller_name, caller_role, action, old_score_a, old_score_b, new_score_a, new_score_b, winner, created_at)
  VALUES (
    'msa_' || gen_random_uuid(),
    p_match_id,
    p_caller_name,
    p_caller_role,
    CASE WHEN p_is_override THEN 'score_override' ELSE 'score_finalize' END,
    v_match.score_a,
    v_match.score_b,
    v_match.score_a,
    v_match.score_b,
    v_winner,
    v_now
  );

  RETURN jsonb_build_object('success', true, 'winner', v_winner);
END;
$$;

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
  ('d5', 'Senior Department',                     'Senior Dept', '#8b5cf6'),
  ('d6', 'College of Arts & Sciences',            'CAS',         '#0ea5e9')
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
  ('div6', 'Women''s Singles', 's3'),
  ('div7', 'Open Division',    's_futsal'),
  ('div8', 'Collegiate 5v5',   's5'),
  ('div9', 'Open Classical',   's8')
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
  ('t6', 'Silver Wolves',  's1', 'd1', 'div1', 'Coach Alvarez',   6, '#d97706', '["p26", "p27", "p28", "p29", "p30"]'::jsonb, true),
  ('t7', 'CSE CyberHawks', 's2', 'd2', 'div3', 'Coach Alvarez',   1, '#0284c7', '["p7", "p8"]'::jsonb, true),
  ('t8', 'HTM Spikers',    's2', 'd3', 'div3', 'Coach Morales',   2, '#0ea5e9', '["p9"]'::jsonb, true),
  ('t9', 'BAA Golden Eagles','s_futsal','d1','div7','Coach Rivera',1, '#eab308', '["p10"]'::jsonb, true),
  ('t10','CSE Phoenix',    's5', 'd2', 'div8', 'Coach Henderson', 1, '#38bdf8', '["p11"]'::jsonb, true),
  ('t11','SHS Royals',     's_futsal','d5','div7','Coach Morales',2, '#0f2d5c', '["p12"]'::jsonb, true)
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
  ),
  (
    'p7', 'Elena Navarro', '2024-007', 'd2', 's2', 't7', '04', 'Outside Hitter',
    1.45, true, '2004-03-14', 'Dumaguete City, PH', 'Coach Alvarez',
    4, 2, 19, 6,
    '[11, 14, 17, 19]'::jsonb,
    '[{"season": "2025-2026", "team": "CSE CyberHawks", "matches": 8, "goals": 19}]'::jsonb,
    '[{"matchId": "m2", "matchday": "MD 1", "opponent": "Padula Tigers", "venue": "H", "result": "W 2-1", "minutes": 40, "points": 16, "assists": 3, "rating": 9.0}]'::jsonb,
    true
  ),
  (
    'p8', 'Rafael Mendoza', '2024-008', 'd2', 's2', 't7', '12', 'Middle Blocker',
    1.65, true, '2003-08-09', 'Cebu City, PH', 'Coach Alvarez',
    4, 1, 14, 5,
    '[9, 12, 13, 14]'::jsonb,
    '[{"season": "2025-2026", "team": "CSE CyberHawks", "matches": 8, "goals": 14}]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'p9', 'Camille Bautista', '2024-009', 'd3', 's2', 't8', '08', 'Libero',
    1.55, true, '2004-06-21', 'Bacolod City, PH', 'Coach Morales',
    5, 0, 9, 11,
    '[7, 8, 9, 11]'::jsonb,
    '[{"season": "2025-2026", "team": "HTM Spikers", "matches": 7, "goals": 9}]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'p10', 'Gabriel Villanueva', '2024-010', 'd1', 's_futsal', 't9', '09', 'Pivot (Forward)',
    1.70, true, '2003-12-03', 'Dumaguete City, PH', 'Coach Rivera',
    3, 5, 7, 4,
    '[2, 4, 5, 7]'::jsonb,
    '[{"season": "2025-2026", "team": "BAA Golden Eagles", "matches": 5, "goals": 7}]'::jsonb,
    '[{"matchId": "m7", "matchday": "MD 1", "opponent": "SHS Royals", "venue": "H", "result": "W 4-2", "minutes": 38, "points": 3, "assists": 1, "rating": 9.1}]'::jsonb,
    true
  ),
  (
    'p11', 'Kevin Soriano', '2024-011', 'd2', 's5', 't10', '01', 'Jungler',
    1.40, true, '2004-10-11', 'Dumaguete City, PH', 'Coach Henderson',
    6, 0, 12, 18,
    '[8, 10, 11, 12]'::jsonb,
    '[{"season": "2025-2026", "team": "CSE Phoenix", "matches": 6, "goals": 12}]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'p12', 'Miguel Torres', '2024-012', 'd5', 's_futsal', 't11', '11', 'Ala (Winger)',
    1.80, true, '2005-04-27', 'Dumaguete City, PH', 'Coach Morales',
    3, 3, 5, 3,
    '[1, 3, 4, 5]'::jsonb,
    '[{"season": "2025-2026", "team": "SHS Royals", "matches": 5, "goals": 5}]'::jsonb,
    '[]'::jsonb,
    true
  ),
  ('p13', 'Carlo Mendoza',      '2024-013', 'd1', 's1', 't1', '03', 'Shooting Guard',    1.65, true, '2004-01-12', 'Dumaguete City, PH', 'Coach Rivera',    4, 0, 16, 7,  '[10,12,14,16]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p14', 'Paolo Aquino',       '2024-014', 'd1', 's1', 't1', '14', 'Power Forward',     1.72, true, '2003-10-08', 'Bacolod City, PH',   'Coach Rivera',    4, 0, 14, 5,  '[9,11,13,14]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p15', 'Andre Bautista',     '2024-015', 'd1', 's1', 't1', '21', 'Center',            1.80, true, '2003-04-19', 'Cebu City, PH',      'Coach Rivera',    4, 0, 11, 3,  '[7,9,10,11]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p16', 'Luis Navarro',       '2024-016', 'd2', 's1', 't2', '02', 'Point Guard',       1.58, true, '2004-06-22', 'Dumaguete City, PH', 'Coach Henderson', 5, 0, 18, 9,  '[11,13,16,18]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p17', 'Marco Villanueva',   '2024-017', 'd2', 's1', 't2', '11', 'Small Forward',     1.74, true, '2003-08-30', 'Dumaguete City, PH', 'Coach Henderson', 5, 0, 15, 6,  '[10,12,14,15]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p18', 'Jerald Ramos',       '2024-018', 'd2', 's1', 't2', '24', 'Power Forward',     1.90, true, '2003-11-15', 'Iloilo City, PH',    'Coach Henderson', 5, 0, 13, 4,  '[8,10,12,13]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p19', 'Bryan Castillo',     '2024-019', 'd2', 's1', 't2', '34', 'Center',            1.82, true, '2002-12-03', 'Dumaguete City, PH', 'Coach Henderson', 5, 0, 10, 2,  '[6,8,9,10]'::jsonb,    '[]'::jsonb, '[]'::jsonb, true),
  ('p20', 'Nathaniel Cruz',     '2024-020', 'd3', 's1', 't3', '06', 'Point Guard',       1.62, true, '2004-02-14', 'Dumaguete City, PH', 'Coach Alvarez',   4, 0, 17, 8,  '[11,13,15,17]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p21', 'Victor Ocampo',      '2024-021', 'd3', 's1', 't3', '08', 'Shooting Guard',    1.78, true, '2003-07-07', 'Cebu City, PH',      'Coach Alvarez',   4, 0, 14, 5,  '[9,11,13,14]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p22', 'Dennis Flores',      '2024-022', 'd3', 's1', 't3', '19', 'Small Forward',     1.88, true, '2003-09-25', 'Dumaguete City, PH', 'Coach Alvarez',   4, 0, 12, 4,  '[7,9,11,12]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p23', 'Joshua Pascual',     '2024-023', 'd3', 's1', 't3', '27', 'Power Forward',     1.95, true, '2004-05-03', 'Bacolod City, PH',   'Coach Alvarez',   4, 0, 9,  3,  '[5,7,8,9]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p24', 'Jerome Diaz',        '2024-024', 'd4', 's1', 't4', '01', 'Point Guard',       1.68, true, '2004-08-17', 'Dumaguete City, PH', 'Coach Morales',   3, 0, 15, 7,  '[10,12,14,15]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p25', 'Adrian Salazar',     '2024-025', 'd4', 's1', 't4', '09', 'Shooting Guard',    1.76, true, '2003-03-21', 'Dumaguete City, PH', 'Coach Morales',   3, 0, 13, 5,  '[8,10,12,13]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p26', 'Kenneth Morales',    '2024-026', 'd4', 's1', 't4', '16', 'Small Forward',     1.84, true, '2003-06-11', 'Cebu City, PH',      'Coach Morales',   3, 0, 11, 4,  '[7,8,10,11]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p27', 'Tristan Mercado',    '2024-027', 'd4', 's1', 't4', '29', 'Center',            1.92, true, '2002-11-28', 'Dumaguete City, PH', 'Coach Morales',   3, 0, 10, 2,  '[6,8,9,10]'::jsonb,    '[]'::jsonb, '[]'::jsonb, true),
  ('p28', 'Sean Fernandez',     '2024-028', 'd5', 's1', 't5', '04', 'Point Guard',       1.70, true, '2005-01-19', 'Dumaguete City, PH', 'Coach Henderson', 3, 0, 14, 6,  '[9,11,13,14]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p29', 'Lance Gutierrez',    '2024-029', 'd5', 's1', 't5', '13', 'Shooting Guard',    1.85, true, '2005-04-02', 'Dumaguete City, PH', 'Coach Henderson', 3, 0, 11, 4,  '[7,8,10,11]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p30', 'Ethan Velasco',      '2024-030', 'd5', 's1', 't5', '22', 'Small Forward',     1.77, true, '2005-07-24', 'Bacolod City, PH',   'Coach Henderson', 3, 0, 9,  3,  '[5,7,8,9]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p31', 'Francis Romero',     '2024-031', 'd1', 's1', 't6', '05', 'Point Guard',       1.63, true, '2004-03-10', 'Dumaguete City, PH', 'Coach Alvarez',   3, 0, 16, 7,  '[10,12,14,16]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p32', 'Aldrin Herrera',     '2024-032', 'd1', 's1', 't6', '17', 'Shooting Guard',    1.79, true, '2003-12-18', 'Cebu City, PH',      'Coach Alvarez',   3, 0, 13, 5,  '[8,10,12,13]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p33', 'Cedric Aguilar',     '2024-033', 'd1', 's1', 't6', '25', 'Power Forward',     1.86, true, '2003-05-06', 'Dumaguete City, PH', 'Coach Alvarez',   3, 0, 11, 3,  '[7,9,10,11]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p34', 'Bea Dela Rosa',      '2024-034', 'd2', 's2', 't7', '02', 'Setter',            1.52, true, '2004-09-14', 'Dumaguete City, PH', 'Coach Alvarez',   4, 0, 14, 19, '[9,11,13,14]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p35', 'Clarisse Ong',       '2024-035', 'd2', 's2', 't7', '07', 'Opposite Hitter',   1.61, true, '2004-11-29', 'Cebu City, PH',      'Coach Alvarez',   4, 0, 17, 4,  '[11,13,15,17]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p36', 'Hannah Alcantara',   '2024-036', 'd2', 's2', 't7', '15', 'Libero',            1.59, true, '2003-08-05', 'Dumaguete City, PH', 'Coach Alvarez',   4, 0, 6,  12, '[4,5,6,6]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p37', 'Sophia Lim',         '2024-037', 'd3', 's2', 't8', '03', 'Setter',            1.48, true, '2004-04-12', 'Bacolod City, PH',   'Coach Morales',   4, 0, 12, 21, '[8,10,11,12]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p38', 'Nicole Sy',          '2024-038', 'd3', 's2', 't8', '10', 'Outside Hitter',    1.66, true, '2003-10-20', 'Dumaguete City, PH', 'Coach Morales',   4, 0, 18, 5,  '[12,14,16,18]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p39', 'Alyssa Tan',         '2024-039', 'd3', 's2', 't8', '14', 'Middle Blocker',    1.71, true, '2004-01-27', 'Cebu City, PH',      'Coach Morales',   4, 0, 15, 3,  '[10,12,14,15]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p40', 'Bianca Yu',          '2024-040', 'd3', 's2', 't8', '18', 'Opposite Hitter',   1.64, true, '2003-06-16', 'Dumaguete City, PH', 'Coach Morales',   4, 0, 13, 4,  '[8,10,12,13]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p41', 'Mateo Evangelista',  '2024-041', 'd1', 's_futsal', 't9', '01', 'Goalkeeper',   1.69, true, '2004-02-09', 'Dumaguete City, PH', 'Coach Rivera',    3, 0, 0,  2,  '[0,0,1,2]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p42', 'Lucas De Leon',      '2024-042', 'd1', 's_futsal', 't9', '05', 'Fixo (Defender)',1.74,true, '2003-07-18', 'Bacolod City, PH',   'Coach Rivera',    3, 2, 3,  4,  '[1,2,2,3]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p43', 'Julian Magno',       '2024-043', 'd1', 's_futsal', 't9', '07', 'Ala (Winger)', 1.67, true, '2004-09-23', 'Dumaguete City, PH', 'Coach Rivera',    3, 4, 5,  3,  '[2,3,4,5]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p44', 'Diego Perez',        '2024-044', 'd1', 's_futsal', 't9', '10', 'Universal',    1.73, true, '2003-11-02', 'Cebu City, PH',      'Coach Rivera',    3, 3, 4,  5,  '[1,2,3,4]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p45', 'Renz Tolentino',     '2024-045', 'd5', 's_futsal', 't11','01', 'Goalkeeper',   1.81, true, '2005-03-15', 'Dumaguete City, PH', 'Coach Morales',   3, 0, 0,  1,  '[0,0,1,1]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p46', 'Anton Rivera',       '2024-046', 'd5', 's_futsal', 't11','04', 'Fixo (Defender)',1.75,true, '2005-06-28', 'Dumaguete City, PH', 'Coach Morales',   3, 1, 2,  3,  '[1,1,2,2]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p47', 'Kobe Manalo',        '2024-047', 'd5', 's_futsal', 't11','08', 'Pivot (Forward)',1.79,true,'2005-08-19', 'Dumaguete City, PH', 'Coach Morales',   3, 4, 4,  2,  '[1,2,3,4]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p48', 'Vince Santiago',     '2024-048', 'd5', 's_futsal', 't11','12', 'Universal',    1.83, true, '2005-10-04', 'Bacolod City, PH',   'Coach Morales',   3, 2, 3,  4,  '[1,2,2,3]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p49', 'Zackary Chua',       '2024-049', 'd2', 's5', 't10', '02', 'Mid Lane',          1.50, true, '2004-04-05', 'Dumaguete City, PH', 'Coach Henderson', 6, 0, 14, 16, '[9,11,13,14]'::jsonb,  '[]'::jsonb, '[]'::jsonb, true),
  ('p50', 'Aaron Uy',           '2024-050', 'd2', 's5', 't10', '03', 'Exp Lane',          1.60, true, '2003-09-12', 'Cebu City, PH',      'Coach Henderson', 6, 0, 11, 14, '[7,9,10,11]'::jsonb,   '[]'::jsonb, '[]'::jsonb, true),
  ('p51', 'Noah Villareal',     '2024-051', 'd2', 's5', 't10', '04', 'Gold Lane',         1.54, true, '2004-07-21', 'Dumaguete City, PH', 'Coach Henderson', 6, 0, 16, 12, '[10,12,14,16]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p52', 'Gelo Bautista',      '2024-052', 'd2', 's5', 't10', '05', 'Roamer',            1.68, true, '2003-12-30', 'Iloilo City, PH',    'Coach Henderson', 6, 0, 5,  24, '[3,4,4,5]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true),
  ('p53', 'Chris Kim',          '2024-053', 'd6', 's3', 't1',  '09', 'Singles Specialist',1.55, true, '2003-05-11', 'Dumaguete City, PH', 'Coach Rivera',    4, 0, 21, 0,  '[15,18,19,21]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p54', 'Alex Park',          '2024-054', 'd6', 's3', 't2',  '10', 'Singles Specialist',1.62, true, '2004-01-08', 'Cebu City, PH',      'Coach Alvarez',   4, 0, 18, 0,  '[14,16,17,18]'::jsonb, '[]'::jsonb, '[]'::jsonb, true),
  ('p55', 'Samantha Reyes',     '2024-055', 'd6', 's8', 't3',  '01', 'Board 1',           1.42, true, '2004-03-25', 'Dumaguete City, PH', 'Coach Rivera',    5, 0, 4,  0,  '[2,3,3,4]'::jsonb,     '[]'::jsonb, '[]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, student_id = EXCLUDED.student_id, department = EXCLUDED.department,
  sport = EXCLUDED.sport, team_id = EXCLUDED.team_id, jersey_number = EXCLUDED.jersey_number,
  position = EXCLUDED.position, gwa = EXCLUDED.gwa, medical_cleared = EXCLUDED.medical_cleared,
  current_season_goals = EXCLUDED.current_season_goals, current_season_assists = EXCLUDED.current_season_assists;

-- 7. MATCHES
INSERT INTO matches (
  id, event_id, sport, division, team_a, team_b, score_a, score_b,
  status, venue, round, round_number, match_number, scheduled_time,
  winner, referee, scorekeeper, coach_a, coach_b, manager, conflict_warning
) VALUES
  (
    'm1', 'ev-1', 's1', 'div1', 'Padula Eagles', 'Red Lions', 45, 38,
    'live', 'Main Arena Court 1', 'Semi-Final', 2, 1, '2026-11-10T09:00:00Z',
    NULL, 'Prof. Marcus Aurelio', 'Sam Chen', 'Coach Rivera', 'Coach Henderson', 'Director Dave Cruz', NULL
  ),
  (
    'm2', 'ev-2', 's2', 'div3', 'Blue Sharks', 'Padula Tigers', 2, 1,
    'live', 'Pavilion Court', 'Quarter-Final', 1, 2, '2026-11-10T10:00:00Z',
    NULL, 'Elena Rostova', 'Maria Santos', 'Coach Alvarez', 'Coach Morales', 'Dean Gloria Ramos', NULL
  ),
  (
    'm3', 'ev-4', 's3', 'div5', 'Chris Kim', 'Alex Park', 21, 18,
    'finished', 'Fieldhouse Annex', 'Gold Final', 3, 1, '2026-11-09T14:00:00Z',
    'Chris Kim', 'Carlos Mendez', 'Lee Park', 'Coach Rivera', 'Coach Alvarez', 'Director Dave Cruz', NULL
  ),
  (
    'm4', 'ev-1', 's1', 'div1', 'Panthers', 'Silver Wolves', 0, 0,
    'scheduled', 'Main Arena Court 2', 'Quarter-Final', 1, 4, '2026-11-11T09:00:00Z',
    NULL, 'Dante Silva', 'Sam Chen', 'Coach Henderson', 'Coach Morales', 'Engr. Victor Tan',
    'Scorer Sam Chen has multiple concurrent matches scheduled'
  ),
  (
    'm5', 'ev-4', 's4', 'div1', 'Padula Smashers', 'Tiger Spinners', 3, 1,
    'live', 'Fieldhouse Annex', 'Semi-Final', 2, 1, '2026-11-10T11:00:00Z',
    NULL, 'Prof. Marcus Aurelio', 'Lee Park', 'Coach Rivera', 'Coach Morales', 'Director Dave Cruz', NULL
  ),
  (
    'm6', 'ev-1', 's1', 'div1', 'Blue Sharks', 'Padula Eagles', 58, 62,
    'finished', 'Main Arena Court 1', 'Quarter-Final', 1, 1, '2026-11-08T15:30:00Z',
    'Padula Eagles', 'Prof. Marcus Aurelio', 'Sam Chen', 'Coach Alvarez', 'Coach Rivera', 'Director Dave Cruz', NULL
  ),
  (
    'm7', 'ev-3', 's_futsal', 'div7', 'BAA Golden Eagles', 'SHS Royals', 4, 2,
    'live', 'Main Arena Court 1', 'Semi-Final', 2, 1, '2026-11-12T14:00:00Z',
    NULL, 'Prof. Marcus Aurelio', 'Sam Chen', 'Coach Rivera', 'Coach Morales', 'Director Dave Cruz', NULL
  ),
  (
    'm8', 'ev-5', 's5', 'div8', 'CSE Phoenix', 'BAA Falcons', 2, 1,
    'finished', 'Esports Arena', 'Semi-Final', 2, 1, '2026-11-11T16:00:00Z',
    'CSE Phoenix', 'Carlos Mendez', 'Lee Park', 'Coach Henderson', 'Coach Rivera', 'Dean Gloria Ramos', NULL
  ),
  (
    'm9', 'ev-2', 's2', 'div3', 'CSE CyberHawks', 'HTM Spikers', 0, 0,
    'scheduled', 'Pavilion Court', 'Semi-Final', 2, 2, '2026-11-13T10:00:00Z',
    NULL, 'Elena Rostova', 'Maria Santos', 'Coach Alvarez', 'Coach Morales', 'Engr. Victor Tan', NULL
  ),
  (
    'm10', 'ev-6', 's8', 'div9', 'Samantha Reyes', 'Christian Santos', 1, 0,
    'finished', 'Chess Hall', 'Round 1', 1, 1, '2026-11-10T13:00:00Z',
    'Samantha Reyes', 'Carlos Mendez', 'Lee Park', 'Coach Rivera', 'Coach Henderson', 'Director Dave Cruz', NULL
  )
ON CONFLICT (id) DO UPDATE SET
  event_id = EXCLUDED.event_id, sport = EXCLUDED.sport, division = EXCLUDED.division,
  team_a = EXCLUDED.team_a, team_b = EXCLUDED.team_b, score_a = EXCLUDED.score_a, score_b = EXCLUDED.score_b,
  status = EXCLUDED.status, venue = EXCLUDED.venue, round = EXCLUDED.round, winner = EXCLUDED.winner,
  referee = EXCLUDED.referee, scorekeeper = EXCLUDED.scorekeeper;

-- 8. TOURNAMENT EVENTS
INSERT INTO tournament_events (
  id, name, sport, division, category, dates, start_date, end_date, venue, status, archived
) VALUES
  (
    'ev-1', 'Asian College Padula 2026 — Basketball', 's1', 'div1',
    'Inter-Collegiate Championship', 'Nov 10 – Nov 18, 2026', '2026-11-10', '2026-11-18',
    'Main Arena Court 1', 'published', false
  ),
  (
    'ev-2', 'Dumaguete Collegiate Volleyball Cup 2026', 's2', 'div3',
    'Collegiate Men & Women Division', 'Nov 12 – Nov 20, 2026', '2026-11-12', '2026-11-20',
    'Pavilion Court', 'published', false
  ),
  (
    'ev-3', 'Padula 2026 Futsal Cup', 's_futsal', 'div7',
    'Team Sports · 5v5 Indoor', 'Nov 12 – Nov 19, 2026', '2026-11-12', '2026-11-19',
    'Main Arena Court 1', 'ongoing', false
  ),
  (
    'ev-4', 'Padula 2026 Badminton & Racket Open', 's3', 'div5',
    'Individual & Doubles', 'Nov 09 – Nov 16, 2026', '2026-11-09', '2026-11-16',
    'Fieldhouse Annex', 'ongoing', false
  ),
  (
    'ev-5', 'Padula 2026 Esports Invitational', 's5', 'div8',
    'Esports Collegiate 5v5', 'Nov 11 – Nov 18, 2026', '2026-11-11', '2026-11-18',
    'Esports Arena', 'published', false
  ),
  (
    'ev-6', 'Padula 2026 Chess Classical', 's8', 'div9',
    'Board Sports · FIDE Classical', 'Nov 10 – Nov 15, 2026', '2026-11-10', '2026-11-15',
    'Chess Hall', 'published', false
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
    'u1',
    NOW() - INTERVAL '5 hours'
  ),
  (
    'ann-3',
    'Futsal & Esports Bracket Schedule Live',
    'Spectators can now follow live Futsal and Mobile Legends matchups from the public tournament hub.',
    'normal',
    'u2',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'ann-4',
    'Badminton & Table Tennis Quarter-Finals',
    'Matches at Fieldhouse Annex begin promptly at 08:30 AM. Warm-up courts open 30 minutes prior.',
    'normal',
    'u1',
    NOW() - INTERVAL '45 minutes'
  ),
  (
    'ann-5',
    'Medical Clearance Reminder for Varsity Athletes',
    'Athletes with pending medical clearance must submit signed forms before Semi-Final tip-off.',
    'urgent',
    'u1',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    'ann-6',
    'Chess Hall Classical Round Robin Pairings',
    'Round 2 classical pairings are posted on the Brackets & Standings page.',
    'normal',
    'u2',
    NOW() - INTERVAL '15 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, body = EXCLUDED.body, priority = EXCLUDED.priority;

-- 9b. MATCH SCORE AUDITS
INSERT INTO match_score_audits (
  id, match_id, caller_name, caller_role, action, old_score_a, old_score_b, new_score_a, new_score_b, winner, reason
) VALUES
  ('msa-1', 'm6', 'Sam Chen', 'scorer', 'score_finalize', 58, 60, 58, 62, 'Padula Eagles', 'Final buzzer verified by court referee'),
  ('msa-2', 'm1', 'Sam Chen', 'scorer', 'score_update', 42, 38, 45, 38, NULL, '3-pointer by #10 Juan dela Cruz'),
  ('msa-3', 'm3', 'Lee Park', 'scorer', 'score_finalize', 19, 18, 21, 18, 'Chris Kim', 'Gold medal match finalized'),
  ('msa-4', 'm7', 'Sam Chen', 'scorer', 'score_update', 3, 2, 4, 2, NULL, 'Goal by #09 Gabriel Villanueva'),
  ('msa-5', 'm8', 'Lee Park', 'scorer', 'score_finalize', 1, 1, 2, 1, 'CSE Phoenix', 'Game 3 nexus push completed'),
  ('msa-6', 'm10', 'Lee Park', 'scorer', 'score_finalize', 0, 0, 1, 0, 'Samantha Reyes', 'Checkmate on move 42')
ON CONFLICT (id) DO UPDATE SET
  new_score_a = EXCLUDED.new_score_a, new_score_b = EXCLUDED.new_score_b, winner = EXCLUDED.winner;

-- 10. AUDIT LOGS
INSERT INTO audit_logs (id, action, user_id, user_name, user_role, details, entity_id, entity_type, created_at) VALUES
  ('al-1', 'login', 'u1', 'Alex Rivera', 'director', 'Sports Director authorized master session.', 'u1', 'User', NOW() - INTERVAL '30 minutes'),
  ('al-2', 'match_start', 'u3', 'Sam Chen', 'scorer', 'Official match clock started: Padula Eagles vs Red Lions', 'm1', 'Match', NOW() - INTERVAL '25 minutes'),
  ('al-3', 'score_update', 'u3', 'Sam Chen', 'scorer', 'Score update verified: Padula Eagles 45 – Red Lions 38', 'm1', 'Match', NOW() - INTERVAL '15 minutes'),
  ('al-4', 'score_finalize', 'u3', 'Sam Chen', 'scorer', 'Finalized Basketball Quarter-Final: Padula Eagles 62 – Blue Sharks 58', 'm6', 'Match', NOW() - INTERVAL '12 minutes'),
  ('al-5', 'event_create', 'u1', 'Mr. John Eric Samane', 'director', 'Published Padula 2026 Futsal Cup schedule', 'ev-3', 'TournamentEvent', NOW() - INTERVAL '8 minutes'),
  ('al-6', 'score_finalize', 'u4', 'Maria Santos', 'scorer', 'Finalized Esports Semi-Final: CSE Phoenix 2 – BAA Falcons 1', 'm8', 'Match', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO UPDATE SET
  details = EXCLUDED.details, created_at = EXCLUDED.created_at;

-- 11. USERS & INITIAL ACCOUNTS
-- Password: 'password123' or 'admin123'
INSERT INTO users (
  id, name, role, username, email, password, department, assigned_sport,
  avatar_initials, gmail_verified, is_active, is_default_password
) VALUES
  (
    'u1', 'Mr. John Eric Samane', 'director', 'jsamane',
    'jsamane@asiancollege.edu.ph', 'padulaAdmin2026', 'd1', 'All Sports',
    'JS', true, true, true
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

-- ─────────────────────────────────────────────────────────────────────────────
-- FOREIGN KEY CONSTRAINTS & REFERENTIAL INTEGRITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Link Teams to Divisions and Departments
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS division_id TEXT,
  ADD COLUMN IF NOT EXISTS department_id TEXT;

UPDATE teams
SET
  division_id = CASE WHEN division IN (SELECT id FROM divisions) THEN division ELSE NULL END,
  department_id = CASE WHEN department IN (SELECT id FROM departments) THEN department ELSE NULL END;

ALTER TABLE teams
  ADD CONSTRAINT fk_teams_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_teams_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Link Players to Teams
ALTER TABLE players
  ADD CONSTRAINT fk_players_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Link Matches to Tournament Events, Venues, Teams, and Officials
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS tournament_event_id TEXT,
  ADD COLUMN IF NOT EXISTS venue_id TEXT,
  ADD COLUMN IF NOT EXISTS team_a_id TEXT,
  ADD COLUMN IF NOT EXISTS team_b_id TEXT,
  ADD COLUMN IF NOT EXISTS official_id TEXT;

UPDATE matches
SET tournament_event_id = CASE WHEN event_id IN (SELECT id FROM tournament_events) THEN event_id ELSE NULL END;

ALTER TABLE matches
  ADD CONSTRAINT fk_matches_event FOREIGN KEY (tournament_event_id) REFERENCES tournament_events(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_matches_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_matches_team_a FOREIGN KEY (team_a_id) REFERENCES teams(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_matches_team_b FOREIGN KEY (team_b_id) REFERENCES teams(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_matches_official FOREIGN KEY (official_id) REFERENCES officials(id) ON DELETE SET NULL;

-- Link Match Score Audits to Matches and Users
ALTER TABLE match_score_audits
  ADD COLUMN IF NOT EXISTS changed_by TEXT;

ALTER TABLE match_score_audits
  ADD CONSTRAINT fk_score_audits_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_score_audits_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Link Announcements and Audit Logs to Users
UPDATE announcements
SET created_by = NULL
WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM users);

ALTER TABLE announcements
  ADD CONSTRAINT fk_announcements_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE audit_logs
  ALTER COLUMN user_id DROP NOT NULL;

UPDATE audit_logs
SET user_id = NULL
WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
