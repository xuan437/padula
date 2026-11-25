-- ============================================================================
-- PADULA 2026 — SYSTEM SETTINGS PERSISTENCE & REALTIME SYNC MIGRATION
-- Safe to run on an existing Supabase database (does NOT drop existing data).
-- Run this in Supabase Dashboard -> SQL Editor -> New Query.
-- ============================================================================

-- 1. Ensure system_settings table exists with updated_by tracking
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- 2. Enable Row Level Security & allow read/write across clients
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read System Settings" ON system_settings;
CREATE POLICY "Public Read System Settings"
  ON system_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Operational Write System Settings" ON system_settings;
CREATE POLICY "Operational Write System Settings"
  ON system_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Enable Supabase Realtime on system_settings so changes sync live to all users
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
