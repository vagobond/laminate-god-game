-- Geo-pins on entries (optional per-entry location).
--
-- A pin is three nullable columns riding the existing xcrol_entries row, so
-- visibility is row-level: pins automatically inherit the entry's
-- privacy_level ladder with zero new RLS policies. Footprint is ~20 bytes per
-- pinned entry and no new index (no spatial queries in v1 — pins render per
-- already-fetched row).

alter table public.xcrol_entries
  add column latitude numeric(9,6),
  add column longitude numeric(9,6),
  add column location_label text,
  add constraint xcrol_entries_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint xcrol_entries_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  -- lat and lng travel together: both set or both null.
  add constraint xcrol_entries_latlng_pair
    check ((latitude is null) = (longitude is null)),
  add constraint xcrol_entries_location_label_length
    check (location_label is null or char_length(location_label) <= 80);

-- get_river_entries must return the pin columns. RETURNS TABLE out-params
-- cannot change via CREATE OR REPLACE, so drop + recreate (same pattern as
-- 20260811020000). New columns are APPENDED so already-deployed frontends —
-- which ignore extra returned fields — keep working during the deploy window.
-- Body is otherwise identical to 20260811020000.

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
  latitude numeric, longitude numeric, location_label text
)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if p_filter = 'rss' then
    return query
    select sub.id, sub.content, sub.link, sub.entry_date, sub.privacy_level,
           sub.user_id, sub.author_display_name, sub.author_avatar_url, sub.author_username,
           sub.published_at as sort_at,
           null::numeric as latitude, null::numeric as longitude, null::text as location_label
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
           u.latitude, u.longitude, u.location_label
    from (
      (
        select
          e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
          p.display_name as author_display_name, p.avatar_url as author_avatar_url, p.username as author_username,
          e.created_at as sort_at,
          e.latitude::numeric as latitude, e.longitude::numeric as longitude, e.location_label
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
               null::numeric as latitude, null::numeric as longitude, null::text as location_label
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
      e.latitude::numeric, e.longitude::numeric, e.location_label
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
