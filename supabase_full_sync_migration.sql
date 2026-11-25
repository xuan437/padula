-- ============================================================================
-- PADULA 2026 — FULL SUPABASE PERSISTENCE & REALTIME SYNC MIGRATION
-- Ensures ALL app functions (player fouls, in-play/reserved lineups,
-- match period scores, timelines, elimination stages, series, team trainers,
-- event seeding/advancement, and system settings) are stored in Supabase.
-- Safe to run on an existing database (does NOT drop any data).
-- ============================================================================

-- 1. PLAYERS: Fouls, Lineup Status (in_play / reserved), Sport Stats
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS roster_status TEXT DEFAULT 'in_play',
  ADD COLUMN IF NOT EXISTS fouls INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS foul_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS foul_logs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sport_stats JSONB DEFAULT '{}'::jsonb;

-- 2. MATCHES: Elimination Stage, Double-Elimination Links, Series, Lineups, Fouls, Timelines
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'elimination',
  ADD COLUMN IF NOT EXISTS bracket_side TEXT,
  ADD COLUMN IF NOT EXISTS loser_next_match_id TEXT,
  ADD COLUMN IF NOT EXISTS loser_next_slot TEXT,
  ADD COLUMN IF NOT EXISTS best_of INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS series_wins_a INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS series_wins_b INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advancing_teams_count INT,
  ADD COLUMN IF NOT EXISTS seeding_mode TEXT,
  ADD COLUMN IF NOT EXISTS period_scores JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS player_match_fouls JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS player_lineup_status JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS player_of_the_match JSONB,
  ADD COLUMN IF NOT EXISTS correction_history JSONB DEFAULT '[]'::jsonb;

-- 3. TOURNAMENT EVENTS: Advancing Teams, Seeding Mode, Season Year, Lead Referee
ALTER TABLE tournament_events
  ADD COLUMN IF NOT EXISTS advancing_teams_count INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS seeding_mode TEXT DEFAULT 'seeded',
  ADD COLUMN IF NOT EXISTS season_year INT,
  ADD COLUMN IF NOT EXISTS referee TEXT;

-- 4. TEAMS: Athletic Trainer
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS trainer TEXT;

-- 5. SYSTEM SETTINGS: Updated By + Realtime Policies
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read System Settings" ON system_settings;
CREATE POLICY "Public Read System Settings"
  ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Operational Write System Settings" ON system_settings;
CREATE POLICY "Operational Write System Settings"
  ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. ENABLE SUPABASE REALTIME ACROSS ALL CORE TABLES
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'matches',
    'players',
    'teams',
    'tournament_events',
    'announcements',
    'officials',
    'system_settings'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
