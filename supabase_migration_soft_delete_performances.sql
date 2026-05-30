-- Soft delete support for performances.
-- Run this in the Supabase SQL Editor before deploying code that filters by is_deleted.

ALTER TABLE public.performances
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE public.performances
SET is_deleted = FALSE
WHERE is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_performances_is_deleted
ON public.performances (is_deleted);
