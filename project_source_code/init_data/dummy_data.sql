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
