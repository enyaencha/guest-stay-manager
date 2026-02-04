-- Introduce lot-level inventory for brand/batch/expiry tracking

CREATE TABLE IF NOT EXISTS public.inventory_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  batch_code TEXT,
  expiry_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_lots_item_id_idx ON public.inventory_lots(inventory_item_id);
CREATE INDEX IF NOT EXISTS inventory_lots_brand_idx ON public.inventory_lots(brand);
CREATE INDEX IF NOT EXISTS inventory_lots_expiry_idx ON public.inventory_lots(expiry_date);

ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory_lots"
  ON public.inventory_lots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert inventory_lots"
  ON public.inventory_lots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory_lots"
  ON public.inventory_lots FOR UPDATE
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS inventory_lot_id UUID REFERENCES public.inventory_lots(id) ON DELETE SET NULL;

-- Backfill: create a default lot for each item based on current stock
INSERT INTO public.inventory_lots (inventory_item_id, brand, batch_code, expiry_date, quantity, unit_cost)
SELECT
  i.id,
  COALESCE(NULLIF(i.brand, ''), 'Generic') AS brand,
  NULL,
  NULL,
  COALESCE(i.current_stock, 0),
  COALESCE(i.unit_cost, 0)
FROM public.inventory_items i
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_lots l WHERE l.inventory_item_id = i.id
);

-- Attach existing transactions to the default lot for each item
UPDATE public.inventory_transactions t
SET inventory_lot_id = l.id
FROM public.inventory_lots l
WHERE t.inventory_item_id = l.inventory_item_id
  AND t.inventory_lot_id IS NULL;
