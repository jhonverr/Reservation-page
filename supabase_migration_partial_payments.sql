-- Add paid_tickets column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS paid_tickets INTEGER DEFAULT 0;

-- Migrate existing data: if is_paid is true, set paid_tickets to the number of tickets
UPDATE reservations SET paid_tickets = tickets WHERE is_paid = true;

-- Note: We will keep is_paid for now to ensure we don't break existing views immediately,
-- but the UI will transition to using paid_tickets.
