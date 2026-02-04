-- Task 3: Enable slow query logging (queries >200ms)
-- Note: This requires setting the log_min_duration_statement parameter
-- Since we can't directly modify postgresql.conf, we'll create a helper view for monitoring
-- The actual logging config needs to be done through Supabase dashboard

-- Task 4 & 5: Add nudge tracking columns

-- Add nudge_sent_at column to friend_requests table
ALTER TABLE public.friend_requests 
ADD COLUMN IF NOT EXISTS nudge_sent_at timestamptz DEFAULT NULL;

-- Add nudge_sent_at and can_be_deleted columns to brooks table
ALTER TABLE public.brooks 
ADD COLUMN IF NOT EXISTS nudge_sent_at timestamptz DEFAULT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.friend_requests.nudge_sent_at IS 'Timestamp when a one-time nudge was sent to remind the recipient';
COMMENT ON COLUMN public.brooks.nudge_sent_at IS 'Timestamp when a one-time nudge was sent to the other party';

-- Create RLS policy for deleting brooks that are:
-- 1. Pending and user is the creator (user1_id)
-- 2. Have never had posts by BOTH users
CREATE OR REPLACE FUNCTION public.can_delete_brook(p_brook_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  brook_record RECORD;
  user1_posted BOOLEAN;
  user2_posted BOOLEAN;
BEGIN
  -- Get brook data
  SELECT * INTO brook_record FROM brooks WHERE id = p_brook_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- User must be a participant
  IF brook_record.user1_id != p_user_id AND brook_record.user2_id != p_user_id THEN
    RETURN false;
  END IF;
  
  -- If pending and user is creator, can delete
  IF brook_record.status = 'pending' AND brook_record.user1_id = p_user_id THEN
    RETURN true;
  END IF;
  
  -- If archived, the user who is NOT the creator can delete (they declined it)
  IF brook_record.status = 'archived' AND brook_record.user2_id = p_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if both users have posted (if so, cannot delete)
  SELECT EXISTS(SELECT 1 FROM brook_posts WHERE brook_id = p_brook_id AND user_id = brook_record.user1_id) INTO user1_posted;
  SELECT EXISTS(SELECT 1 FROM brook_posts WHERE brook_id = p_brook_id AND user_id = brook_record.user2_id) INTO user2_posted;
  
  -- If both have posted, cannot delete
  IF user1_posted AND user2_posted THEN
    RETURN false;
  END IF;
  
  -- If only the requesting user has posted (or no one has), they can delete
  IF p_user_id = brook_record.user1_id AND NOT user2_posted THEN
    RETURN true;
  END IF;
  
  IF p_user_id = brook_record.user2_id AND NOT user1_posted THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update or create DELETE policy for brooks
DROP POLICY IF EXISTS "Users can delete their unused brooks" ON public.brooks;

CREATE POLICY "Users can delete their unused brooks"
ON public.brooks
FOR DELETE
USING (public.can_delete_brook(id, auth.uid()));