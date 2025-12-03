-- Migration: Setup pg_cron for recurring transactions
-- This configures automatic execution at mid-month (15th) and end of month (28th)
-- Note: pg_cron is only available on Supabase Pro plan

-- Enable pg_cron extension (if not already enabled)
-- This may require the Pro plan
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule job for mid-month (15th at 6:00 AM UTC - 1:00 AM Colombia)
SELECT cron.schedule(
  'process-recurring-mid-month',
  '0 6 15 * *', -- At 06:00 on day 15 of every month
  $$
  INSERT INTO recurring_transactions_log (target_year, target_month, transactions_created, transactions_processed, details, triggered_by)
  SELECT
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    r.transactions_created,
    r.transactions_processed,
    r.details,
    'pg_cron_mid_month'
  FROM process_recurring_transactions() r;
  $$
);

-- Schedule job for end of month (28th at 6:00 AM UTC - 1:00 AM Colombia)
-- Using 28th to be safe for February
SELECT cron.schedule(
  'process-recurring-end-month',
  '0 6 28 * *', -- At 06:00 on day 28 of every month
  $$
  INSERT INTO recurring_transactions_log (target_year, target_month, transactions_created, transactions_processed, details, triggered_by)
  SELECT
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    r.transactions_created,
    r.transactions_processed,
    r.details,
    'pg_cron_end_month'
  FROM process_recurring_transactions() r;
  $$
);

-- Also schedule for the 1st of each month to catch any transactions
-- that should have been created at the end of the previous month
SELECT cron.schedule(
  'process-recurring-start-month',
  '0 6 1 * *', -- At 06:00 on day 1 of every month
  $$
  -- Process previous month to catch any missed transactions
  INSERT INTO recurring_transactions_log (target_year, target_month, transactions_created, transactions_processed, details, triggered_by)
  SELECT
    EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::INT,
    EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::INT,
    r.transactions_created,
    r.transactions_processed,
    r.details,
    'pg_cron_catchup_prev_month'
  FROM process_recurring_transactions(
    EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::INT,
    EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::INT
  ) r
  WHERE r.transactions_created > 0;

  -- Also process current month
  INSERT INTO recurring_transactions_log (target_year, target_month, transactions_created, transactions_processed, details, triggered_by)
  SELECT
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    r.transactions_created,
    r.transactions_processed,
    r.details,
    'pg_cron_start_month'
  FROM process_recurring_transactions() r;
  $$
);

-- Create a view to easily check scheduled jobs
CREATE OR REPLACE VIEW scheduled_cron_jobs AS
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username
FROM cron.job
WHERE jobname LIKE 'process-recurring%';

-- Grant access to view
GRANT SELECT ON scheduled_cron_jobs TO authenticated;
GRANT SELECT ON scheduled_cron_jobs TO service_role;

-- Comment for documentation
COMMENT ON VIEW scheduled_cron_jobs IS
'View to monitor scheduled cron jobs for recurring transactions processing';
