-- Multi-Calendar Integration Tables

-- Table to store connected external calendars
CREATE TABLE connected_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'outlook', 'nudge'
  account_email VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id VARCHAR(255), -- External calendar ID (e.g., Google calendar ID)
  is_primary BOOLEAN DEFAULT false,
  color VARCHAR(7), -- Hex color for display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, calendar_id)
);

-- Table to store sync rules between calendars
CREATE TABLE calendar_sync_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_calendar_id UUID REFERENCES connected_calendars(id) ON DELETE CASCADE NOT NULL,
  target_calendar_id UUID REFERENCES connected_calendars(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  visibility_type VARCHAR(20) DEFAULT 'busy', -- 'busy', 'full', 'blocked'
  sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'one_way', 'bidirectional'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_calendar_id, target_calendar_id)
);

-- Table to track synced event IDs to avoid duplicates
CREATE TABLE synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_event_id VARCHAR(255) NOT NULL,
  target_event_id VARCHAR(255) NOT NULL,
  source_calendar_id UUID REFERENCES connected_calendars(id) ON DELETE CASCADE NOT NULL,
  target_calendar_id UUID REFERENCES connected_calendars(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_event_id, source_calendar_id)
);

-- Indexes for performance
CREATE INDEX idx_connected_calendars_user ON connected_calendars(user_id);
CREATE INDEX idx_calendar_sync_rules_user ON calendar_sync_rules(user_id);
CREATE INDEX idx_calendar_sync_rules_source ON calendar_sync_rules(source_calendar_id);
CREATE INDEX idx_calendar_sync_rules_target ON calendar_sync_rules(target_calendar_id);
CREATE INDEX idx_synced_events_user ON synced_events(user_id);

-- Enable RLS
ALTER TABLE connected_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_calendars
DROP POLICY IF EXISTS "Users can view own connected calendars" ON connected_calendars;
CREATE POLICY "Users can view own connected calendars" ON connected_calendars
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own connected calendars" ON connected_calendars;
CREATE POLICY "Users can insert own connected calendars" ON connected_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connected calendars" ON connected_calendars;
CREATE POLICY "Users can update own connected calendars" ON connected_calendars
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own connected calendars" ON connected_calendars;
CREATE POLICY "Users can delete own connected calendars" ON connected_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for calendar_sync_rules
DROP POLICY IF EXISTS "Users can view own sync rules" ON calendar_sync_rules;
CREATE POLICY "Users can view own sync rules" ON calendar_sync_rules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sync rules" ON calendar_sync_rules;
CREATE POLICY "Users can insert own sync rules" ON calendar_sync_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sync rules" ON calendar_sync_rules;
CREATE POLICY "Users can update own sync rules" ON calendar_sync_rules
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sync rules" ON calendar_sync_rules;
CREATE POLICY "Users can delete own sync rules" ON calendar_sync_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for synced_events
DROP POLICY IF EXISTS "Users can view own synced events" ON synced_events;
CREATE POLICY "Users can view own synced events" ON synced_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own synced events" ON synced_events;
CREATE POLICY "Users can insert own synced events" ON synced_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own synced events" ON synced_events;
CREATE POLICY "Users can delete own synced events" ON synced_events
  FOR DELETE USING (auth.uid() = user_id);

-- Add nudge as a special calendar type (automatic)
-- This will be created automatically when user signs up
