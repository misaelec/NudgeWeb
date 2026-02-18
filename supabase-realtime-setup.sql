-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can select their own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime for user_preferences
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;

-- Update existing policies for other tables to ensure they work with Realtime
-- (These should already exist but adding for completeness)

-- Reminders policies
DROP POLICY IF EXISTS "Users can select their own reminders" ON public.reminders;
CREATE POLICY "Users can select their own reminders"
  ON public.reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
CREATE POLICY "Users can insert their own reminders"
  ON public.reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
CREATE POLICY "Users can update their own reminders"
  ON public.reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;
CREATE POLICY "Users can delete their own reminders"
  ON public.reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calendar events policies
DROP POLICY IF EXISTS "Users can select their own calendar_events" ON public.calendar_events;
CREATE POLICY "Users can select their own calendar_events"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own calendar_events" ON public.calendar_events;
CREATE POLICY "Users can insert their own calendar_events"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own calendar_events" ON public.calendar_events;
CREATE POLICY "Users can update their own calendar_events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own calendar_events" ON public.calendar_events;
CREATE POLICY "Users can delete their own calendar_events"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Journal entries policies
DROP POLICY IF EXISTS "Users can select their own journal_entries" ON public.journal_entries;
CREATE POLICY "Users can select their own journal_entries"
  ON public.journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own journal_entries" ON public.journal_entries;
CREATE POLICY "Users can insert their own journal_entries"
  ON public.journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own journal_entries" ON public.journal_entries;
CREATE POLICY "Users can delete their own journal_entries"
  ON public.journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Objectives policies
DROP POLICY IF EXISTS "Users can select their own objectives" ON public.objectives;
CREATE POLICY "Users can select their own objectives"
  ON public.objectives
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own objectives" ON public.objectives;
CREATE POLICY "Users can insert their own objectives"
  ON public.objectives
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own objectives" ON public.objectives;
CREATE POLICY "Users can update their own objectives"
  ON public.objectives
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own objectives" ON public.objectives;
CREATE POLICY "Users can delete their own objectives"
  ON public.objectives
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Key results policies
DROP POLICY IF EXISTS "Users can select their own key_results" ON public.key_results;
CREATE POLICY "Users can select their own key_results"
  ON public.key_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own key_results" ON public.key_results;
CREATE POLICY "Users can insert their own key_results"
  ON public.key_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own key_results" ON public.key_results;
CREATE POLICY "Users can update their own key_results"
  ON public.key_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own key_results" ON public.key_results;
CREATE POLICY "Users can delete their own key_results"
  ON public.key_results
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

-- Enable Realtime for all tables (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.objectives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
