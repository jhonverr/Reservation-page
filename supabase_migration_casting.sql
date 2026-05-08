-- Add casting information support.
-- Run this once in Supabase SQL Editor before using the casting fields in admin.

alter table public.performances
add column if not exists casting_mode text not null default 'single',
add column if not exists casting_info text;

alter table public.performance_sessions
add column if not exists casting_info text;

update public.performances
set casting_mode = 'single'
where casting_mode is null;

alter table public.performances
drop constraint if exists performances_casting_mode_check;

alter table public.performances
add constraint performances_casting_mode_check
check (casting_mode in ('single', 'multi'));
