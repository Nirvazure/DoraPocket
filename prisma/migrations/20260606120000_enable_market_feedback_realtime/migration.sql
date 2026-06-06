ALTER TABLE "MarketFeedback" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_select_own_market_feedback" ON "MarketFeedback";
CREATE POLICY "realtime_select_own_market_feedback"
  ON "MarketFeedback"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.current_app_user_id());

GRANT SELECT ON "MarketFeedback" TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE "MarketFeedback";
