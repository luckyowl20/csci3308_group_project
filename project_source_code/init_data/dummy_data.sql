-- Insert dummy users
INSERT INTO users (username, email, password_hash)
VALUES
  ('alice', 'alice@example.com', '$2a$10$NmFWQj6gzAyNtUARhwvAoObl2ZaV/yqndKrFwSXK.C5m7exNxpBgy'), -- pass1
  ('bob', 'bob@example.com', '$2a$10$3phaO9YBuWeHqnXgOoUPtezTfUBHuxi3NCsbo4d/6oceNevBVHo9i'), 
  ('charlie', 'charlie@example.com', '$2a$10$tZA.8bbWjvHfbdEoaBo.juoL93qXF9uPvi8n5Rn6Dg4CiolVB3cyS'),
  ('dave', 'dave@example.com', '$2a$10$8EDQiYdE30dwEpJvFu5p/u/KZHd0DFkXA.kO74lNq4gjiX30KA7VK'),
  ('eve', 'eve@example.com', '$2a$10$uH1jFLbbrTUa6nsFOvPsM.lmAedFx0Ml2SuFbT2lmj0PanRFeeYNK'),
  ('frank', 'frank@example.com', '$2a$10$b/bpYP7ehzm1RvTydyB.iOvjJapcELdXgwmWp/f7vgcq1CJng8DpW'),
  ('grace', 'grace@example.com', '$2a$10$3ZCUWMe6oARxRJNQPcIRPeY57Bf5RY9TxT38HijaFr46lfA5amcnC'),
  ('heidi', 'heidi@example.com', '$2a$10$vu3cz4Vewy1zBxD00r69weHSDe6EKe4Se1aKr4cAU5QJLHe1cPTdG'),
  ('ivan', 'ivan@example.com', '$2a$10$qhrqPEIXYAusTbup/M75Iu5TA055JV/mqVy5bhHbU725cgPd8Sk42'),
  ('judy', 'judy@example.com', '$2a$10$fUun/OcW7SR/zaK3fMlNKuDhQwR39vMJGHq31e9r0f3SeG2aDtISG'); -- pass10

-- Insert dummy photos
INSERT INTO photos (url, description)
VALUES
  ('https://example.com/photos/1.jpg', 'Photo 1 description'),
  ('https://example.com/photos/2.jpg', 'Photo 2 description'),
  ('https://example.com/photos/3.jpg', 'Photo 3 description'),
  ('https://example.com/photos/4.jpg', 'Photo 4 description'),
  ('https://example.com/photos/5.jpg', 'Photo 5 description');

-- Insert dummy posts (using some photos and some with no photo)
INSERT INTO posts (user_id, photo_id, title, body)
VALUES
  -- Posts for Alice (user_id = 1)
  (1, 1, 'Alice''s First Post', 'Hello, this is Alice!'),
  (1, 2, 'Alice''s Second Post', 'Another day, another update from Alice.'),
  
  -- Posts for Bob (user_id = 2)
  (2, 2, 'Bob''s First Post', 'Hi, Bob here. Enjoying the platform!'),
  (2, NULL, 'Bob''s Second Post', 'Sometimes I post without a photo.'),
  
  -- Posts for Charlie (user_id = 3)
  (3, 3, 'Charlie''s First Post', 'Greetings from Charlie!'),
  (3, 1, 'Charlie''s Second Post', 'Loving this community.'),
  
  -- Posts for Dave (user_id = 4)
  (4, 4, 'Dave''s Thoughts', 'This is Dave sharing his thoughts.'),
  (4, NULL, 'Dave''s Update', 'Another update from Dave.'),
  
  -- Posts for Eve (user_id = 5)
  (5, 5, 'Eve''s Update', 'Eve checking in with a photo.'),
  (5, NULL, 'Eve''s Second Update', 'No photo this time.'),
  
  -- Posts for Frank (user_id = 6)
  (6, NULL, 'Frank''s Post', 'Frank here, sharing my first post.'),
  (6, 3, 'Frank''s Second Post', 'Another insight from Frank.'),
  
  -- Posts for Grace (user_id = 7)
  (7, 2, 'Grace''s Post', 'Grace is excited to join!'),
  (7, NULL, 'Grace Again', 'More from Grace, without a photo.'),
  
  -- Posts for Heidi (user_id = 8)
  (8, 4, 'Heidi''s Thoughts', 'Heidi is reflecting on the day.'),
  (8, NULL, 'Heidi''s Update', 'Another post from Heidi.'),
  
  -- Posts for Ivan (user_id = 9)
  (9, 5, 'Ivan''s Update', 'Ivan here with a fresh update!'),
  (9, NULL, 'Ivan Again', 'Just checking in, no photo this time.'),
  
  -- Posts for Judy (user_id = 10)
  (10, 1, 'Judy''s First Post', 'Judy is excited to be here.'),
  (10, NULL, 'Judy''s Second Post', 'Another update from Judy.');

-- Insert dummy friendships between users
INSERT INTO friends (user_id, friend_id)
VALUES
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (1, 9),
  (1, 10),
  (2, 1),
  (2, 3),
  (2, 5),
  (3, 6),
  (4, 7),
  (5, 8),
  (6, 9),
  (7, 10),
  (8, 9),
  (9, 10);

-- dummy messages
INSERT INTO messages (sender_id, receiver_id, conversation_type, content)
VALUES
  -- Conversation between Alice (1) and Bob (2)
  (1, 2, 'friend', 'Hey Bob, how are you doing today?'),
  (2, 1, 'friend', 'Hi Alice, I''m good! How about you?'),

  -- Conversation between Charlie (3) and Dave (4)
  (3, 4, 'match', 'Hi Dave, glad we matched. Want to chat?'),
  (4, 3, 'match', 'Sure Charlie, let''s talk about our interests.'),

  -- Conversation between Eve (5) and Frank (6)
  (5, 6, 'friend', 'Frank, let''s catch up soon over coffee.'),
  (6, 5, 'friend', 'Sounds great, Eve. I''ll message you later.'),

  -- Conversation between Grace (7) and Heidi (8)
  (7, 8, 'match', 'Heidi, I really liked your profile picture!'),
  (8, 7, 'match', 'Thanks Grace, I appreciate it.'),

  -- Conversation between Ivan (9) and Judy (10)
  (9, 10, 'friend', 'Hey Judy, any plans for the weekend?'),
  (10, 9, 'friend', 'Hi Ivan, not yet. Maybe we can plan something.'),

  -- Additional conversations
  (2, 3, 'friend', 'Charlie, want to join our hiking trip next week?'),
  (3, 2, 'friend', 'I''d love to, Bob. Count me in!'),
  
  (4, 5, 'match', 'Eve, your recent post really caught my attention.'),
  (5, 4, 'match', 'Thank you, Dave. I''m glad you enjoyed it.'),
  
  (6, 7, 'friend', 'Grace, let''s collaborate on that new project you mentioned.'),
  (7, 6, 'friend', 'Absolutely, Frank. I''ll send you some ideas soon.'),
  
  (8, 9, 'match', 'Ivan, your artwork is amazing!'),
  (9, 8, 'match', 'Thanks Heidi, I appreciate the compliment.');


-- Dummy profiles for test users
INSERT INTO profiles (user_id, display_name, biography, interests, birthday, profile_picture_url, spotify_song_id)
VALUES
  (1, 'Alice A.', 'Adventurer and lifelong learner. I love the outdoors and sharing stories.', 'hiking,reading,photography', '1992-06-15', 'data:image/jpeg;base64,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', '3FtYbEfBqAlGO46NUDQSAt'),
  (2, 'Bob B.', 'Tech geek and coffee enthusiast. Let’s chat about AI or our favorite brew.', 'coding,coffee,chess', '1988-03-12', 'data:image/jpeg;base64,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', '0ofHAoxe9vBkTCp2UQIavz'),
  (3, 'Charlie C.', 'Musician by passion, developer by profession. I play the guitar.', 'music,travel,gaming', '1990-11-22', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFG1E137ftz85FZ1K4z5oJXs2bQKA7TxYBsQ&s', '0VjIjW4GlUZAMYd2vXMi3b'),
  (4, 'Dave D.', 'Fitness junkie and motivational writer. Every day is a fresh start.', 'fitness,writing,meditation', '1985-01-05', 'data:image/jpeg;base64,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', '3AJwUDP919kvQ9QcozQPxg '),
  (5, 'Eve E.', 'Artist and designer. Obsessed with colors and visual storytelling.', 'art,design,photography', '1993-09-30', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWtle7vjXV0S3OOZ0FWsig017IJX5EscmCvg&s', '39LLxExYz6ewLAcYrzQQyP'),
  (6, 'Frank F.', 'Builder of things, tinkerer of electronics, lover of puzzles.', 'engineering,DIY,puzzles', '1987-05-18', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBeNc960I8VPeKCmIAfSIjLcY8MdrvoCeZtg&s', '5ghIJDpPoe3CfHMGu71E6T'),
  (7, 'Grace G.', 'Blogger and food critic. I enjoy discovering local eateries.', 'writing,food,travel', '1995-02-14', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaSSJ7vdaxPd8dLSFwtPxY0a0Ixy37WLPjsA&s', '5Z01UMMf7V1o0MzF86s6WJ'),
  (8, 'Heidi H.', 'Photographer and dreamer. Life is about capturing the little things.', 'photography,nature,travel', '1991-07-21', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBcZ6mR4gHOG2ubziBcnwteYjnfeZ6bgof1Q&s', '7H0ya83CMmgFcOhw0UB6ow'),
  (9, 'Ivan I.', 'Painter and digital artist. My work explores surreal spaces.', 'art,drawing,digital art', '1994-10-09', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKAuP2Ko95WgTMiITDVcw5ABjdF4XoV_LmEQ&s', '6l8GvAyoUZwWDgF1e4822w'),
  (10, 'Judy J.', 'Bookworm and tea lover. Cozy evenings with a good novel = heaven.', 'reading,tea,cozy vibes', '1996-12-02', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUsQXFk2k2Sd6nAyv1_DjNYFqX5UfQk-rstg&s', '6M14BiCN00nOsba4JaYsHW');


-- possible user interests
INSERT INTO interests (name) VALUES ('Art') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Animation') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Astrology') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Baking') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Board Games') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Books') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Cars') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Climbing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Coffee') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Comedy') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Cooking') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Cycling') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Dancing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Design') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('DIY') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Drawing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Fashion') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Fitness') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Food') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Gaming') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Gardening') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Hiking') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('History') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Investing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Languages') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Movies') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Music') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Outdoors') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Painting') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Pets') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Philosophy') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Photography') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Poetry') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Podcasts') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Politics') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Programming') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Reading') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Running') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Science') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Shopping') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Singing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Skincare') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Spirituality') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Sports') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Streaming') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Technology') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Theater') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Travel') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Video Editing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Volunteering') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Walking') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Writing') ON CONFLICT DO NOTHING;
INSERT INTO interests (name) VALUES ('Yoga') ON CONFLICT DO NOTHING;
