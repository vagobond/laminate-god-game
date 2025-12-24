-- Grant execute permission on get_visible_profile to anonymous users
GRANT EXECUTE ON FUNCTION public.get_visible_profile(uuid, uuid) TO anon, authenticated;

-- Also grant execute on resolve_username_to_id for anonymous users to resolve usernames
GRANT EXECUTE ON FUNCTION public.resolve_username_to_id(text) TO anon, authenticated;