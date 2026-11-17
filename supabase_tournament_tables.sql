-- ==============================================================================
-- ASIAN COLLEGE PADULA 2026 — SUPABASE SQL FOR PLAYERS, EVENTS, MATCHES & BRACKETS, ANNOUNCEMENTS
-- Safe to run on an existing Supabase database (uses IF NOT EXISTS — preserves existing data)
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard -> SQL Editor -> New Query
-- 2. Paste this script and click "Run"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PLAYERS
-- ------------------------------------------------------------------------------
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

ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_name TEXT;

CREATE INDEX IF NOT EXISTS idx_players_sport ON players (sport);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_players_department ON players (department);

-- ------------------------------------------------------------------------------
-- 2. TOURNAMENT EVENTS & BRACKETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  division TEXT,
  format TEXT DEFAULT 'single_elimination',
  category TEXT,
  dates TEXT,
  start_date DATE,
  end_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  rules TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'ongoing', 'completed')),
  bracket JSONB DEFAULT '[]'::jsonb,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'single_elimination';
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS bracket JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_events_sport ON tournament_events (sport);
CREATE INDEX IF NOT EXISTS idx_events_status ON tournament_events (status);

-- ------------------------------------------------------------------------------
-- 3. MATCHES (SCHEDULE & BRACKET SLOTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  sport TEXT NOT NULL,
  division TEXT,
  format TEXT DEFAULT 'single_elimination',
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'single_elimination';

CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches (event_id);
CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches (sport);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);

-- ------------------------------------------------------------------------------
-- 4. ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
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

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sport TEXT;

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements (created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Read Players" ON players;
  CREATE POLICY "Public Read Players" ON players FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Players" ON players;
  CREATE POLICY "Operational Write Players" ON players FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public Read Events" ON tournament_events;
  CREATE POLICY "Public Read Events" ON tournament_events FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Events" ON tournament_events;
  CREATE POLICY "Operational Write Events" ON tournament_events FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public Read Matches" ON matches;
  CREATE POLICY "Public Read Matches" ON matches FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Matches" ON matches;
  CREATE POLICY "Operational Write Matches" ON matches FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public Read Announcements" ON announcements;
  CREATE POLICY "Public Read Announcements" ON announcements FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Operational Write Announcements" ON announcements;
  CREATE POLICY "Operational Write Announcements" ON announcements FOR ALL USING (true);
END $$;

-- ------------------------------------------------------------------------------
-- 6. ENABLE SUPABASE REALTIME FOR LIVE UPDATES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE matches;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE tournament_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE players;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

