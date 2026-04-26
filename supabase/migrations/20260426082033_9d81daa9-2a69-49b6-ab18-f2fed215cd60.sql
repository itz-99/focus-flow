-- Add points + parent pin to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_pin_hash TEXT;

-- Withdrawals history
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawals"
ON public.withdrawals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Enable pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Award points (called after a successful session)
CREATE OR REPLACE FUNCTION public.award_session_points(_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _points IS NULL OR _points <= 0 OR _points > 1000 THEN
    RAISE EXCEPTION 'Invalid points amount';
  END IF;

  UPDATE public.profiles
  SET points_balance = points_balance + _points,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING points_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Set or update parent PIN (4-digit string, stored hashed)
CREATE OR REPLACE FUNCTION public.set_parent_pin(_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must be 4 digits';
  END IF;

  UPDATE public.profiles
  SET parent_pin_hash = encode(digest(_pin, 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$;

-- Withdraw points: verify PIN, deduct, log
CREATE OR REPLACE FUNCTION public.withdraw_points(_amount INTEGER, _pin TEXT, _note TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  stored_hash TEXT;
  new_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  IF _pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must be 4 digits';
  END IF;

  SELECT points_balance, parent_pin_hash
  INTO current_balance, stored_hash
  FROM public.profiles
  WHERE id = auth.uid();

  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'Parent PIN not set';
  END IF;
  IF stored_hash <> encode(digest(_pin, 'sha256'), 'hex') THEN
    RAISE EXCEPTION 'Incorrect parent PIN';
  END IF;
  IF current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.profiles
  SET points_balance = points_balance - _amount,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING points_balance INTO new_balance;

  INSERT INTO public.withdrawals (user_id, amount, note)
  VALUES (auth.uid(), _amount, _note);

  RETURN new_balance;
END;
$$;