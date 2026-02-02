-- Replace 'cash' with 'withdraw' in payment method constraints

ALTER TABLE public.pos_transactions
  DROP CONSTRAINT IF EXISTS pos_transactions_payment_method_check;

ALTER TABLE public.pos_transactions
  ADD CONSTRAINT pos_transactions_payment_method_check
  CHECK (payment_method IN ('cash', 'withdraw', 'mpesa', 'card', 'room-charge', 'bank-transfer'));

UPDATE public.pos_transactions
SET payment_method = 'withdraw'
WHERE payment_method = 'cash';

ALTER TABLE public.pos_transactions
  DROP CONSTRAINT IF EXISTS pos_transactions_payment_method_check;

ALTER TABLE public.pos_transactions
  ADD CONSTRAINT pos_transactions_payment_method_check
  CHECK (payment_method IN ('withdraw', 'mpesa', 'card', 'room-charge', 'bank-transfer'));

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_payment_method_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_payment_method_check
  CHECK (payment_method IN ('cash', 'withdraw', 'mpesa', 'bank_transfer', 'credit'));

UPDATE public.expenses
SET payment_method = 'withdraw'
WHERE payment_method = 'cash';

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_payment_method_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_payment_method_check
  CHECK (payment_method IN ('withdraw', 'mpesa', 'bank_transfer', 'credit'));
