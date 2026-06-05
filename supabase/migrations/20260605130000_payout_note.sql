-- Optional free-text detail for a payout. Used by "other" payouts to record
-- what the kid was actually given (a preset like "Gift", or typed text like
-- "Lego set"). Null for cash payouts.

alter table public.payouts
  add column note text;
