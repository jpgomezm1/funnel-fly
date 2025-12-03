-- Migration: Process Recurring Transactions
-- This creates a function to automatically generate pending recurring transactions

-- Function to process recurring transactions for a given month
CREATE OR REPLACE FUNCTION process_recurring_transactions(target_year INT DEFAULT NULL, target_month INT DEFAULT NULL)
RETURNS TABLE (
  transactions_created INT,
  transactions_processed INT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INT;
  v_month INT;
  v_created INT := 0;
  v_processed INT := 0;
  v_details JSONB := '[]'::jsonb;
  v_recurring RECORD;
  v_target_date DATE;
  v_exists BOOLEAN;
  v_last_day INT;
  v_day_to_use INT;
  v_new_id UUID;
BEGIN
  -- Use current date if not specified
  v_year := COALESCE(target_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  v_month := COALESCE(target_month, EXTRACT(MONTH FROM CURRENT_DATE)::INT);

  -- Get last day of target month
  v_last_day := EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(v_year, v_month, 1)) + INTERVAL '1 month - 1 day'))::INT;

  -- Find all recurring transactions that:
  -- 1. Are marked as recurring (is_recurring = true)
  -- 2. Have no end date OR end date is in the future
  -- 3. Have a recurring_day set
  -- 4. Started before or during the target month
  FOR v_recurring IN
    SELECT
      id,
      transaction_type,
      income_category,
      expense_category,
      expense_classification,
      amount_original,
      currency,
      exchange_rate,
      amount_usd,
      description,
      vendor_or_source,
      payment_method,
      notes,
      recurring_day,
      recurring_frequency,
      recurring_end_date,
      transaction_date
    FROM finance_transactions
    WHERE is_recurring = true
      AND recurring_day IS NOT NULL
      AND parent_transaction_id IS NULL -- Only process parent recurring transactions
      AND (recurring_end_date IS NULL OR recurring_end_date >= MAKE_DATE(v_year, v_month, 1))
      AND transaction_date <= (DATE_TRUNC('month', MAKE_DATE(v_year, v_month, 1)) + INTERVAL '1 month - 1 day')::DATE
  LOOP
    v_processed := v_processed + 1;

    -- Calculate the day to use (handle months with fewer days)
    v_day_to_use := LEAST(v_recurring.recurring_day, v_last_day);
    v_target_date := MAKE_DATE(v_year, v_month, v_day_to_use);

    -- Skip if the target date is before the original transaction date
    IF v_target_date < v_recurring.transaction_date THEN
      CONTINUE;
    END IF;

    -- Check if a transaction already exists for this recurring item in the target month
    SELECT EXISTS (
      SELECT 1 FROM finance_transactions
      WHERE (
        -- Either it's a child of this recurring transaction
        parent_transaction_id = v_recurring.id
        -- Or it has the same characteristics and is in the same month
        OR (
          is_recurring = true
          AND description = v_recurring.description
          AND amount_original = v_recurring.amount_original
          AND transaction_type = v_recurring.transaction_type
        )
      )
      AND EXTRACT(YEAR FROM transaction_date) = v_year
      AND EXTRACT(MONTH FROM transaction_date) = v_month
    ) INTO v_exists;

    -- If no transaction exists for this month, create one
    IF NOT v_exists THEN
      INSERT INTO finance_transactions (
        transaction_type,
        income_category,
        expense_category,
        expense_classification,
        amount_original,
        currency,
        exchange_rate,
        amount_usd,
        description,
        vendor_or_source,
        payment_method,
        notes,
        transaction_date,
        is_recurring,
        recurring_day,
        recurring_frequency,
        recurring_end_date,
        parent_transaction_id,
        created_by
      ) VALUES (
        v_recurring.transaction_type,
        v_recurring.income_category,
        v_recurring.expense_category,
        v_recurring.expense_classification,
        v_recurring.amount_original,
        v_recurring.currency,
        v_recurring.exchange_rate,
        v_recurring.amount_usd,
        v_recurring.description,
        v_recurring.vendor_or_source,
        v_recurring.payment_method,
        v_recurring.notes,
        v_target_date,
        true,
        v_recurring.recurring_day,
        v_recurring.recurring_frequency,
        v_recurring.recurring_end_date,
        v_recurring.id, -- Link to parent
        'system_cron'
      )
      RETURNING id INTO v_new_id;

      v_created := v_created + 1;

      -- Add to details
      v_details := v_details || jsonb_build_object(
        'parent_id', v_recurring.id,
        'new_id', v_new_id,
        'description', v_recurring.description,
        'amount_usd', v_recurring.amount_usd,
        'date', v_target_date
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_created, v_processed, v_details;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION process_recurring_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION process_recurring_transactions TO service_role;

-- Create a table to log cron executions
CREATE TABLE IF NOT EXISTS recurring_transactions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_year INT NOT NULL,
  target_month INT NOT NULL,
  transactions_created INT NOT NULL DEFAULT 0,
  transactions_processed INT NOT NULL DEFAULT 0,
  details JSONB,
  triggered_by TEXT DEFAULT 'manual'
);

-- Grant access to the log table
GRANT SELECT, INSERT ON recurring_transactions_log TO authenticated;
GRANT SELECT, INSERT ON recurring_transactions_log TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION process_recurring_transactions IS
'Processes recurring transactions for a given month.
Call with no arguments to process current month.
Call with (year, month) to process a specific month.
Returns: transactions_created, transactions_processed, details (JSON array of created transactions)';
