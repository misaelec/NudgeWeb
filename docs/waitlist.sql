-- Create mobile_waitlist table
CREATE TABLE public.mobile_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mobile_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous waitlist signups)
CREATE POLICY "Allow anonymous inserts" ON public.mobile_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to select (to check if email exists)
CREATE POLICY "Allow anonymous selects" ON public.mobile_waitlist
  FOR SELECT TO anon, authenticated
  USING (true);
