-- Revert minimum username length back to 2 characters
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
  display_name_value TEXT;
BEGIN
  -- Get display name from metadata, fallback to email prefix
  display_name_value := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
  
  -- LOWERCASE FIRST, then remove special chars
  base_username := regexp_replace(lower(display_name_value), '[^a-z0-9]', '', 'g');
  
  -- Ensure it's at least 2 characters (reverted from 3)
  IF length(base_username) < 2 THEN
    base_username := base_username || 'user';
  END IF;
  
  -- Start with the base username
  final_username := base_username;
  
  -- Check if username exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    new.id,
    new.email,
    display_name_value,
    final_username
  );
  RETURN new;
END;
$function$;