-- Add brand to inventory_items and create inventory_transactions for stock tracking

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS brand TEXT;

UPDATE public.inventory_items
SET brand = 'Generic'
WHERE brand IS NULL OR brand = '';

ALTER TABLE public.inventory_items
  ALTER COLUMN brand SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'room-use', 'adjustment', 'transfer', 'maintenance')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  batch_code TEXT,
  expiry_date DATE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory_transactions"
  ON public.inventory_transactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert inventory_transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (true);
