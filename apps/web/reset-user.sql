-- Delete the admin user so we can test clean signup
DELETE FROM auth.users WHERE email = 'admin@pebric.com';
DELETE FROM public.profiles WHERE email = 'admin@pebric.com';
