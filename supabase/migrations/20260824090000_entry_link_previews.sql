-- Stored link previews on entries.
--
-- Previously every LinkPreview render called the link-preview edge function.
-- The River loads 20 entries per page and the component has no cache, so one
-- page view could burn 20 of the function's 30-requests-per-minute-per-IP
-- budget; a browser reload plus a PWA cold load tripped the limit and every
-- preview silently vanished (the 429 is swallowed and the card renders null).
--
-- The fix is to resolve OG data ONCE, when the link is attached to the entry,
-- and store it on the row. Rendering then costs zero edge calls, previews
-- survive offline in the PWA, and the rate limit only ever sees compose-time
-- traffic (one call per post).
--
-- Shape mirrors 20260813010000_entry_geo_pins: nullable columns riding the
-- existing xcrol_entries row, so preview visibility inherits the entry's
-- privacy_level ladder with zero new RLS policies.

alter table public.xcrol_entries
  add column preview_type text,
  add column preview_title text,
  add column preview_description text,
  add column preview_image_url text,
  add column preview_site_name text,
  add column preview_favicon_url text,
  add column preview_fetched_at timestamptz,
  -- Only the render-relevant kinds; 'unknown' is stored as NULL (nothing to
  -- show) so a failed probe is indistinguishable from "never fetched" and can
  -- be retried later without a sentinel value.
  add constraint xcrol_entries_preview_type_valid
    check (preview_type is null or preview_type in ('pixelfed', 'peertube', 'generic')),
  -- Bound every stored string so a hostile OG tag can't bloat the row. The
  -- edge function already truncates description to 200; belt and braces.
  add constraint xcrol_entries_preview_title_length
    check (preview_title is null or char_length(preview_title) <= 300),
  add constraint xcrol_entries_preview_description_length
    check (preview_description is null or char_length(preview_description) <= 500),
  add constraint xcrol_entries_preview_image_url_length
    check (preview_image_url is null or char_length(preview_image_url) <= 2000),
  add constraint xcrol_entries_preview_site_name_length
    check (preview_site_name is null or char_length(preview_site_name) <= 120),
  add constraint xcrol_entries_preview_favicon_url_length
    check (preview_favicon_url is null or char_length(preview_favicon_url) <= 2000),
  -- A preview only means anything alongside a link.
  add constraint xcrol_entries_preview_needs_link
    check (preview_type is null or link is not null);

comment on column public.xcrol_entries.preview_fetched_at is
  'When the stored OG data was resolved. NULL with a non-null link means the preview was never fetched (pre-migration row, or the probe failed) — clients may fall back to the link-preview edge function for those.';

-- get_river_entries must return the preview columns. RETURNS TABLE out-params
-- cannot change via CREATE OR REPLACE, so drop + recreate (same pattern as
-- 20260811020000 and 20260813010000). New columns are APPENDED so an
-- already-deployed frontend — which ignores extra returned fields — keeps
-- working during the deploy window. Body is otherwise identical to
-- 20260813010000_entry_geo_pins.

drop function if exists public.get_river_entries(uuid, integer, integer, text, timestamptz, uuid);

create function public.get_river_entries(
  p_viewer_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_filter text default 'all',
  p_before_ts timestamptz default null,
  p_before_id uuid default null
)
returns table(
  id uuid, content text, link text, entry_date date, privacy_level text,
  user_id uuid, author_display_name text, author_avatar_url text, author_username text,
  sort_at timestamptz,
  latitude numeric, longitude numeric, location_label text,
  preview_type text, preview_title text, preview_description text,
  preview_image_url text, preview_site_name text, preview_favicon_url text,
  preview_fetched_at timestamptz
)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if p_filter = 'rss' then
    return query
    select sub.id, sub.content, sub.link, sub.entry_date, sub.privacy_level,
           sub.user_id, sub.author_display_name, sub.author_avatar_url, sub.author_username,
           sub.published_at as sort_at,
           null::numeric as latitude, null::numeric as longitude, null::text as location_label,
           null::text as preview_type, null::text as preview_title, null::text as preview_description,
           null::text as preview_image_url, null::text as preview_site_name, null::text as preview_favicon_url,
           null::timestamptz as preview_fetched_at
    from (
      select
        ri.id,
        coalesce(ri.title, 'Untitled') || case when ri.content is not null and ri.content != '' then E'\n\n' || ri.content else '' end as content,
        ri.link,
        (ri.published_at at time zone 'UTC')::date as entry_date,
        'rss'::text as privacy_level,
        ri.user_id,
        rf.feed_name as author_display_name,
        rf.feed_icon as author_avatar_url,
        null::text as author_username,
        ri.published_at,
        row_number() over (partition by ri.feed_id order by ri.published_at desc) as rn,
        rf.max_items
      from rss_feed_items ri
      join user_rss_feeds rf on rf.id = ri.feed_id
      where ri.user_id = p_viewer_id
    ) sub
    where sub.rn <= sub.max_items
      and (p_before_ts is null or (sub.published_at, sub.id) < (p_before_ts, p_before_id))
    order by sub.published_at desc, sub.id desc
    limit p_limit offset case when p_before_ts is null then p_offset else 0 end;

  elsif p_filter = 'all' and p_viewer_id is not null then
    return query
    select u.id, u.content, u.link, u.entry_date, u.privacy_level,
           u.user_id, u.author_display_name, u.author_avatar_url, u.author_username,
           u.sort_at,
           u.latitude, u.longitude, u.location_label,
           u.preview_type, u.preview_title, u.preview_description,
           u.preview_image_url, u.preview_site_name, u.preview_favicon_url,
           u.preview_fetched_at
    from (
      (
        select
          e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
          p.display_name as author_display_name, p.avatar_url as author_avatar_url, p.username as author_username,
          e.created_at as sort_at,
          e.latitude::numeric as latitude, e.longitude::numeric as longitude, e.location_label,
          e.preview_type, e.preview_title, e.preview_description,
          e.preview_image_url, e.preview_site_name, e.preview_favicon_url,
          e.preview_fetched_at
        from xcrol_entries e
        join profiles p on p.id = e.user_id
        where (
            e.privacy_level = 'public'
            or e.user_id = p_viewer_id
            or (
              exists (
                select 1 from friendships f
                where f.user_id = e.user_id and f.friend_id = p_viewer_id
                  and (
                    (e.privacy_level = 'close_friend' and f.level in ('close_friend', 'secret_friend', 'family'))
                    or (e.privacy_level = 'buddy' and f.level in ('close_friend', 'buddy', 'secret_friend', 'family'))
                    or (e.privacy_level = 'friendly_acquaintance' and f.level in ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend', 'family'))
                  )
              )
              and not exists (
                select 1 from user_blocks b
                where (b.blocker_id = e.user_id and b.blocked_id = p_viewer_id)
                   or (b.blocker_id = p_viewer_id and b.blocked_id = e.user_id)
              )
            )
          )
          and (p_before_ts is null or (e.created_at, e.id) < (p_before_ts, p_before_id))
      )
      union all
      (
        select sub2.id, sub2.content, sub2.link, sub2.entry_date, sub2.privacy_level,
               sub2.user_id, sub2.author_display_name, sub2.author_avatar_url, sub2.author_username,
               sub2.sort_at,
               null::numeric as latitude, null::numeric as longitude, null::text as location_label,
               null::text as preview_type, null::text as preview_title, null::text as preview_description,
               null::text as preview_image_url, null::text as preview_site_name, null::text as preview_favicon_url,
               null::timestamptz as preview_fetched_at
        from (
          select
            ri.id,
            coalesce(ri.title, 'Untitled') || case when ri.content is not null and ri.content != '' then E'\n\n' || ri.content else '' end as content,
            ri.link,
            (ri.published_at at time zone 'UTC')::date as entry_date,
            'rss'::text as privacy_level, ri.user_id,
            rf.feed_name as author_display_name, rf.feed_icon as author_avatar_url, null::text as author_username,
            ri.published_at as sort_at,
            row_number() over (partition by ri.feed_id order by ri.published_at desc) as rn,
            rf.max_items
          from rss_feed_items ri
          join user_rss_feeds rf on rf.id = ri.feed_id
          where ri.user_id = p_viewer_id
        ) sub2
        where sub2.rn <= sub2.max_items
          and (p_before_ts is null or (sub2.sort_at, sub2.id) < (p_before_ts, p_before_id))
      )
    ) u
    order by u.sort_at desc, u.id desc
    limit p_limit offset case when p_before_ts is null then p_offset else 0 end;

  else
    -- public / anonymous-all / family / level filters: entries only.
    return query
    select
      e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
      p.display_name, p.avatar_url, p.username,
      e.created_at as sort_at,
      e.latitude::numeric, e.longitude::numeric, e.location_label,
      e.preview_type, e.preview_title, e.preview_description,
      e.preview_image_url, e.preview_site_name, e.preview_favicon_url,
      e.preview_fetched_at
    from xcrol_entries e
    join profiles p on p.id = e.user_id
    where (
        e.privacy_level = 'public'
        or e.user_id = p_viewer_id
        or (
          p_viewer_id is not null
          and exists (
            select 1 from friendships f
            where f.user_id = e.user_id and f.friend_id = p_viewer_id
              and (
                (e.privacy_level = 'close_friend' and f.level in ('close_friend', 'secret_friend', 'family'))
                or (e.privacy_level = 'buddy' and f.level in ('close_friend', 'buddy', 'secret_friend', 'family'))
                or (e.privacy_level = 'friendly_acquaintance' and f.level in ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend', 'family'))
              )
          )
          and not exists (
            select 1 from user_blocks b
            where (b.blocker_id = e.user_id and b.blocked_id = p_viewer_id)
               or (b.blocker_id = p_viewer_id and b.blocked_id = e.user_id)
          )
        )
      )
      and (
        p_filter in ('all', 'public')
        or (p_filter = 'family' and (
          e.user_id = p_viewer_id
          or exists (
            select 1 from friendships f
            where f.user_id = p_viewer_id and f.friend_id = e.user_id and f.level = 'family'
          )
        ))
        or (p_filter in ('close_friend', 'buddy', 'friendly_acquaintance') and (
          e.user_id = p_viewer_id
          or exists (
            select 1 from friendships f
            where f.user_id = p_viewer_id and f.friend_id = e.user_id
            and (
              (p_filter = 'friendly_acquaintance' and f.level in ('close_friend', 'secret_friend', 'buddy', 'friendly_acquaintance'))
              or (p_filter = 'buddy' and f.level in ('close_friend', 'secret_friend', 'buddy'))
              or (p_filter = 'close_friend' and f.level in ('close_friend', 'secret_friend'))
            )
          )
        ))
      )
      and (p_before_ts is null or (e.created_at, e.id) < (p_before_ts, p_before_id))
    order by e.created_at desc, e.id desc
    limit p_limit offset case when p_before_ts is null then p_offset else 0 end;
  end if;
end;
$function$;

grant execute on function public.get_river_entries(uuid, integer, integer, text, timestamptz, uuid)
  to anon, authenticated;
