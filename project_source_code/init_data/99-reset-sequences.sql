-- Reset sequences for all tables with SERIAL IDs

-- users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- photos
SELECT setval('photos_id_seq', (SELECT MAX(id) FROM photos));

-- posts
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));

-- profiles
SELECT setval('profiles_id_seq', (SELECT MAX(id) FROM profiles));

-- interests
SELECT setval('interests_id_seq', (SELECT MAX(id) FROM interests));

-- messages
SELECT setval('messages_id_seq', (SELECT MAX(id) FROM messages));

-- user_settings
SELECT setval('user_settings_id_seq', (SELECT MAX(id) FROM user_settings));

-- blogs
SELECT setval('blogs_id_seq', (SELECT MAX(id) FROM blogs));