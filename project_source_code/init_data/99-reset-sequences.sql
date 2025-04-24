-- Reset sequences for all tables with SERIAL IDs

-- users
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

-- photos
SELECT setval('photos_id_seq', COALESCE((SELECT MAX(id) FROM photos), 1));

-- posts
SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1));

-- profiles
SELECT setval('profiles_id_seq', COALESCE((SELECT MAX(id) FROM profiles), 1));

-- interests
SELECT setval('interests_id_seq', COALESCE((SELECT MAX(id) FROM interests), 1));

-- messages
SELECT setval('messages_id_seq', COALESCE((SELECT MAX(id) FROM messages), 1));

-- user_settings
SELECT setval('user_settings_id_seq', COALESCE((SELECT MAX(id) FROM user_settings), 1));

-- blogs
SELECT setval(
  pg_get_serial_sequence('blogs', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM blogs), 1),
  true
);

SELECT setval(
  pg_get_serial_sequence('matches', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM matches), 1),
  true
);
