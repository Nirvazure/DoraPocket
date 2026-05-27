-- Map Supabase auth.uid() to application User.id for Realtime RLS.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM "User" WHERE "supabaseUserId" = (auth.uid())::text LIMIT 1;
$$;

ALTER TABLE "PocketItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatHistoryEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketSubmission" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_select_own_pocket_items" ON "PocketItem";
CREATE POLICY "realtime_select_own_pocket_items"
  ON "PocketItem"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "realtime_select_own_user_settings" ON "UserSettings";
CREATE POLICY "realtime_select_own_user_settings"
  ON "UserSettings"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "realtime_select_own_chat_history" ON "ChatHistoryEntry";
CREATE POLICY "realtime_select_own_chat_history"
  ON "ChatHistoryEntry"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.current_app_user_id());

DROP POLICY IF EXISTS "realtime_select_own_market_submissions" ON "MarketSubmission";
CREATE POLICY "realtime_select_own_market_submissions"
  ON "MarketSubmission"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.current_app_user_id());

GRANT SELECT ON "PocketItem" TO authenticated;
GRANT SELECT ON "UserSettings" TO authenticated;
GRANT SELECT ON "ChatHistoryEntry" TO authenticated;
GRANT SELECT ON "MarketSubmission" TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE "PocketItem";
ALTER PUBLICATION supabase_realtime ADD TABLE "UserSettings";
ALTER PUBLICATION supabase_realtime ADD TABLE "ChatHistoryEntry";
ALTER PUBLICATION supabase_realtime ADD TABLE "MarketSubmission";
