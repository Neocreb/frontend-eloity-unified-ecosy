-- Fix RLS Policies for live_streams to properly handle authenticated and public access

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active live streams" ON public.live_streams;
DROP POLICY IF EXISTS "Users can create their own live streams" ON public.live_streams;
DROP POLICY IF EXISTS "Users can update their own live streams" ON public.live_streams;
DROP POLICY IF EXISTS "Users can delete their own live streams" ON public.live_streams;

-- Create new policies with better logic
CREATE POLICY "Public can view active live streams" ON public.live_streams
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own inactive live streams" ON public.live_streams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own live streams" ON public.live_streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live streams" ON public.live_streams
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own live streams" ON public.live_streams
  FOR DELETE USING (auth.uid() = user_id);

-- Fix RLS for battles table
DROP POLICY IF EXISTS "Anyone can view battles" ON public.battles;
CREATE POLICY "Public can view battles" ON public.battles
  FOR SELECT USING (true);

-- Ensure table allows unauthenticated reads
GRANT SELECT ON public.live_streams TO anon;
GRANT SELECT ON public.battles TO anon;
