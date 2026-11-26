-- ============================================================================
-- MIGRATION: Normalize all team names in Supabase to Department Names Only
-- Run this in your Supabase SQL Editor to update existing teams, players, and matches.
-- ============================================================================

-- 1. Update teams.name to match departments.short_name (BAA, CSE, HTM, DPD, SHS, etc.)
UPDATE teams t
SET name = d.short_name
FROM departments d
WHERE (
  LOWER(t.department) = LOWER(d.id)
  OR LOWER(t.department) = LOWER(d.short_name)
  OR LOWER(t.department) = LOWER(d.name)
)
AND d.short_name IS NOT NULL
AND t.name IS DISTINCT FROM d.short_name;

-- 2. Update players.team_name (if column exists) to match the updated team name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'team_name'
  ) THEN
    UPDATE players p
    SET team_name = t.name
    FROM teams t
    WHERE p.team_id = t.id
      AND p.team_name IS DISTINCT FROM t.name;
  END IF;
END $$;

-- 3. Update matches.team_a, matches.team_b, and matches.winner from mascot/old names to department short names
UPDATE matches
SET
  team_a = CASE
    WHEN team_a ~* '^(BAA|Padula Eagles|Silver Wolves)' THEN 'BAA'
    WHEN team_a ~* '^(CSE|Blue Sharks)' THEN 'CSE'
    WHEN team_a ~* '^(HTM|Red Lions)' THEN 'HTM'
    WHEN team_a ~* '^(DPD|Padula Tigers)' THEN 'DPD'
    WHEN team_a ~* '^(SHS|Panthers|Senior Dept)' THEN 'SHS'
    ELSE team_a
  END,
  team_b = CASE
    WHEN team_b ~* '^(BAA|Padula Eagles|Silver Wolves)' THEN 'BAA'
    WHEN team_b ~* '^(CSE|Blue Sharks)' THEN 'CSE'
    WHEN team_b ~* '^(HTM|Red Lions)' THEN 'HTM'
    WHEN team_b ~* '^(DPD|Padula Tigers)' THEN 'DPD'
    WHEN team_b ~* '^(SHS|Panthers|Senior Dept)' THEN 'SHS'
    ELSE team_b
  END,
  winner = CASE
    WHEN winner ~* '^(BAA|Padula Eagles|Silver Wolves)' THEN 'BAA'
    WHEN winner ~* '^(CSE|Blue Sharks)' THEN 'CSE'
    WHEN winner ~* '^(HTM|Red Lions)' THEN 'HTM'
    WHEN winner ~* '^(DPD|Padula Tigers)' THEN 'DPD'
    WHEN winner ~* '^(SHS|Panthers|Senior Dept)' THEN 'SHS'
    ELSE winner
  END
WHERE
  team_a ~* '^(BAA |CSE |HTM |DPD |SHS |Padula Eagles|Red Lions|Blue Sharks|Padula Tigers|Panthers|Silver Wolves|Senior Dept)'
  OR team_b ~* '^(BAA |CSE |HTM |DPD |SHS |Padula Eagles|Red Lions|Blue Sharks|Padula Tigers|Panthers|Silver Wolves|Senior Dept)'
  OR winner ~* '^(BAA |CSE |HTM |DPD |SHS |Padula Eagles|Red Lions|Blue Sharks|Padula Tigers|Panthers|Silver Wolves|Senior Dept)';
