-- ============================================================================
-- PADULA 2026 — FLEXIBLE BRACKET ENGINE SQL MIGRATION
-- Supports: Single-Elimination, Double-Elimination (with Bracket Reset),
-- Round-Robin, Group-Stage, Swiss System, Ladder/Pyramid,
-- Prediction Bracket, Voting Bracket, and Custom Bracket Media.
-- Safe to run on an existing Supabase database.
-- ============================================================================

-- 1. Extend MATCHES for Group-Stage, Swiss, Bracket Reset, and Voting
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS swiss_round INT,
  ADD COLUMN IF NOT EXISTS is_bracket_reset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS votes_a INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS votes_b INT DEFAULT 0;

-- 2. Extend TOURNAMENT_EVENTS for per-competition format configuration
ALTER TABLE tournament_events
  ADD COLUMN IF NOT EXISTS group_count INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS advancing_per_group INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS swiss_rounds INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS double_elim_reset BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_changes_after_start BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_prediction_bracket BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_voting_bracket BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS voting_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enable_custom_bracket_media BOOLEAN DEFAULT false;

-- 3. LADDER / PYRAMID STANDINGS
CREATE TABLE IF NOT EXISTS ladder_entries (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  sport TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  rank INT NOT NULL,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LADDER / PYRAMID CHALLENGE HISTORY
CREATE TABLE IF NOT EXISTS ladder_challenges (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  sport TEXT NOT NULL,
  challenger_team TEXT NOT NULL,
  defender_team TEXT NOT NULL,
  challenger_rank INT NOT NULL,
  defender_rank INT NOT NULL,
  winner_team TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. PREDICTION BRACKET SUBMISSIONS
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  sport TEXT NOT NULL,
  match_id TEXT NOT NULL,
  predictor_name TEXT NOT NULL,
  predictor_email TEXT,
  predicted_winner TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, device_id)
);

-- 6. VOTING BRACKET VOTES (One vote per device or verified account per match)
CREATE TABLE IF NOT EXISTS bracket_votes (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  voted_team TEXT NOT NULL CHECK (voted_team IN ('A', 'B')),
  voter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, voter_key)
);

-- 7. ROW LEVEL SECURITY & POLICIES
ALTER TABLE ladder_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Ladder Entries" ON ladder_entries;
CREATE POLICY "Public Read Ladder Entries" ON ladder_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operational Write Ladder Entries" ON ladder_entries;
CREATE POLICY "Operational Write Ladder Entries" ON ladder_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Ladder Challenges" ON ladder_challenges;
CREATE POLICY "Public Read Ladder Challenges" ON ladder_challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operational Write Ladder Challenges" ON ladder_challenges;
CREATE POLICY "Operational Write Ladder Challenges" ON ladder_challenges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Bracket Predictions" ON bracket_predictions;
CREATE POLICY "Public Read Bracket Predictions" ON bracket_predictions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Write Bracket Predictions" ON bracket_predictions;
CREATE POLICY "Public Write Bracket Predictions" ON bracket_predictions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Bracket Votes" ON bracket_votes;
CREATE POLICY "Public Read Bracket Votes" ON bracket_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Write Bracket Votes" ON bracket_votes;
CREATE POLICY "Public Write Bracket Votes" ON bracket_votes FOR ALL USING (true) WITH CHECK (true);

-- 8. REALTIME PUBLICATION
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'ladder_entries',
    'ladder_challenges',
    'bracket_predictions',
    'bracket_votes'
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
