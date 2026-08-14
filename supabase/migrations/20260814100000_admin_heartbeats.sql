-- Activity-based heartbeat for the dead-man's switch.
-- Records a timestamp each time an admin loads the dashboard,
-- so the switch checks actual usage rather than last_sign_in_at.

CREATE TABLE IF NOT EXISTS admin_heartbeats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admins can upsert their own row, nobody else touches it.
ALTER TABLE admin_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can upsert own heartbeat"
  ON admin_heartbeats
  FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (used by heartbeat-check edge fn) bypasses RLS, so no
-- additional policy needed for the read path.
