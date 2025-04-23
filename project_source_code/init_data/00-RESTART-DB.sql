-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Truncate all tables
TRUNCATE TABLE
  blogs_posts,
  blogs,
  user_settings,
  messages,
  matches,
  friends,
  swipes,
  user_interests,
  interests,
  profiles,
  posts,
  post_likes,
  photos,
  restaurants,
  users
RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;
