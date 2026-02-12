-- Nudge Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER ACCOUNTS
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAKS
-- ============================================

CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('journal', 'focus', 'reminders', 'objectives')),
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

CREATE TABLE streak_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL,
    completed_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, streak_type, completed_date)
);

-- ============================================
-- REMINDERS
-- ============================================

CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    recurrence TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);

-- ============================================
-- CALENDAR EVENTS
-- ============================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    color TEXT DEFAULT '#007AFF',
    source_type TEXT DEFAULT 'local' CHECK (source_type IN ('local', 'google', 'apple', 'outlook')),
    source_id TEXT,
    google_event_id TEXT,
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user ON calendar_events(user_id);
CREATE INDEX idx_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_events_source ON calendar_events(source_type, source_id);

-- ============================================
-- CALENDAR ACCOUNTS (Sync Hub)
-- ============================================

CREATE TABLE calendar_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook')),
    account_email TEXT,
    account_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_connected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar sync rules for the hub
CREATE TABLE calendar_sync_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_account_id UUID REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    target_account_id UUID REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    sync_direction TEXT CHECK (sync_direction IN ('one_way', 'bi_directional')),
    sync_events BOOLEAN DEFAULT TRUE,
    sync_tasks BOOLEAN DEFAULT FALSE,
    prefix TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOURNAL ENTRIES
-- ============================================

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[],
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_user ON journal_entries(user_id);
CREATE INDEX idx_journal_created ON journal_entries(created_at);

-- ============================================
-- OBJECTIVES (OKRs)
-- ============================================

CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'personal' CHECK (category IN ('work', 'personal', 'health', 'learning')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    progress INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value INTEGER DEFAULT 100,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_objectives_user ON objectives(user_id);
CREATE INDEX idx_key_results_objective ON key_results(objective_id);

-- ============================================
-- FEAR OBJECTIVES (Fear Setting)
-- ============================================

CREATE TABLE fear_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fear TEXT NOT NULL,
    why TEXT NOT NULL,
    prevention TEXT,
    repair TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fear_action_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fear_id UUID NOT NULL REFERENCES fear_objectives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fear_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fear_id UUID NOT NULL REFERENCES fear_objectives(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fears_user ON fear_objectives(user_id);

-- ============================================
-- FOCUS SESSIONS (Pomodoro)
-- ============================================

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    break_duration_minutes INTEGER DEFAULT 5,
    sessions_completed INTEGER DEFAULT 1,
    total_minutes INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_focus_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_completed ON focus_sessions(completed_at);

-- ============================================
-- USER PREFERENCES & SETTINGS
-- ============================================

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- Feature flags
    reminders_enabled BOOLEAN DEFAULT TRUE,
    calendar_enabled BOOLEAN DEFAULT TRUE,
    events_enabled BOOLEAN DEFAULT TRUE,
    pomodoro_enabled BOOLEAN DEFAULT TRUE,
    app_blocking_enabled BOOLEAN DEFAULT TRUE,
    journal_enabled BOOLEAN DEFAULT TRUE,
    objectives_enabled BOOLEAN DEFAULT TRUE,
    -- Visual settings
    visual_effects_enabled BOOLEAN DEFAULT TRUE,
    dark_mode TEXT DEFAULT 'system' CHECK (dark_mode IN ('light', 'dark', 'system')),
    -- Widget settings
    motivation_photo_url TEXT,
    -- Notification settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    reminder_notifications BOOLEAN DEFAULT TRUE,
    focus_notifications BOOLEAN DEFAULT TRUE,
    streak_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_accounts_updated_at BEFORE UPDATE ON calendar_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON key_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fear_objectives_updated_at BEFORE UPDATE ON fear_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
    INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_action_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can read own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streak history" ON streak_history FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own calendar accounts" ON calendar_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sync rules" ON calendar_sync_rules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own objectives" ON objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own key results" ON key_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fear objectives" ON fear_objectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fear action steps" ON fear_action_steps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fear reflections" ON fear_reflections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own focus sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
