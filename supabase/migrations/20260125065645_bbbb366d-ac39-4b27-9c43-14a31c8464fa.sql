-- Add entry_id column to messages table to link messages to River entries
ALTER TABLE public.messages 
ADD COLUMN entry_id uuid REFERENCES public.xcrol_entries(id) ON DELETE SET NULL;

-- Add an index for efficient querying
CREATE INDEX idx_messages_entry_id ON public.messages(entry_id) WHERE entry_id IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.messages.entry_id IS 'Links message to a River entry when it is a response to a post';