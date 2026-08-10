-- Worklist #2: rate limiting for public edge functions.
-- Fixed-window counters keyed by (bucket, window). Service-role only —
-- edge functions call check_rate_limit(); clients can never touch this.

create table if not exists public.rate_limit_counters (
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket_key, window_start)
);

alter table public.rate_limit_counters enable row level security;
-- No policies on purpose: nothing but service_role / the definer RPC may touch it.
revoke all on public.rate_limit_counters from public, anon, authenticated;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  -- Align windows to epoch boundaries so all callers share the same buckets.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters as r (bucket_key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
  do update set count = r.count + 1
  returning r.count into v_count;

  -- Opportunistic cleanup (~1% of calls) keeps the table tiny without pg_cron.
  if random() < 0.01 then
    delete from public.rate_limit_counters
    where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer)
  to service_role;
