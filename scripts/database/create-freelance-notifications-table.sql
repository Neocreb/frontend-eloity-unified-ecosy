-- Create freelance_notifications table
CREATE TABLE IF NOT EXISTS public.freelance_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  action VARCHAR(100),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT freelance_notifications_user_fk 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS freelance_notifications_user_id_idx 
  ON public.freelance_notifications(user_id);
  
CREATE INDEX IF NOT EXISTS freelance_notifications_created_at_idx 
  ON public.freelance_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS freelance_notifications_type_idx 
  ON public.freelance_notifications(type);

CREATE INDEX IF NOT EXISTS freelance_notifications_read_idx 
  ON public.freelance_notifications(read);

-- Enable Row Level Security
ALTER TABLE public.freelance_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for freelance_notifications

-- Policy 1: Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.freelance_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: System/service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.freelance_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications"
  ON public.freelance_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.freelance_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_freelance_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER freelance_notifications_updated_at_trigger
  BEFORE UPDATE ON public.freelance_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_freelance_notifications_updated_at();

-- Add comment to describe the table
COMMENT ON TABLE public.freelance_notifications IS 
  'Stores notifications for freelance platform events (proposals, milestones, payments, etc.)';
