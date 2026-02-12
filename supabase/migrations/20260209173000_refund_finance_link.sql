-- Link refund payouts to finance transactions and auto-mark refunds processed

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS refund_request_id UUID REFERENCES public.refund_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_refund_request_id
  ON public.finance_transactions(refund_request_id);

DROP FUNCTION IF EXISTS public.mark_refund_processed_from_finance();
CREATE FUNCTION public.mark_refund_processed_from_finance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.refund_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS NOT NULL AND NEW.type <> 'expense' THEN
    RETURN NEW;
  END IF;

  UPDATE public.refund_requests
    SET status = 'processed',
        updated_at = now()
  WHERE id = NEW.refund_request_id
    AND status <> 'processed';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS finance_transactions_refund_processed ON public.finance_transactions;
CREATE TRIGGER finance_transactions_refund_processed
  AFTER INSERT ON public.finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_refund_processed_from_finance();

-- Expand refund visibility to finance roles for payout processing
DROP POLICY IF EXISTS "Users with refunds permission can read refunds" ON public.refund_requests;
CREATE POLICY "Users with refunds or finance permission can read refunds"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (
    public.has_permission(auth.uid(), 'refunds.view')
    OR public.has_permission(auth.uid(), 'refunds.approve')
    OR public.has_permission(auth.uid(), 'finance.view')
    OR public.has_permission(auth.uid(), 'finance.manage')
  );

-- Allow finance managers to update refund status when needed
DROP POLICY IF EXISTS "Users with refunds.approve can update refunds" ON public.refund_requests;
CREATE POLICY "Users with refunds.approve or finance.manage can update refunds"
  ON public.refund_requests FOR UPDATE TO authenticated
  USING (
    public.has_permission(auth.uid(), 'refunds.approve')
    OR public.has_permission(auth.uid(), 'finance.manage')
  );
