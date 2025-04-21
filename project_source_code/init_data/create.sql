-- create database lucky_moment_db;

-- table of users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,      -- creates a unique identifier for each user as a serialized integer
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- table of user photos, can be attached to posts or profiles
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY, -- photo identifier number (integer)
    url TEXT NOT NULL, -- TODO: decide if we want to store the URL or the raw image data
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);


-- table of user posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user created the post
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE SET NULL, -- to track which photo is associated with the post in the photos table
    photo_id INTEGER, -- the id of the photo in the photos table
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,   
    body TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- table of user profiles
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user the profile belongs to
    user_id INTEGER UNIQUE NOT NULL,
    display_name VARCHAR(100),
    biography TEXT,
    interests TEXT,
    birthday DATE,
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    spotify_song_id TEXT
);

-- table of pending user swipes, awating matches or friend requests
CREATE TABLE IF NOT EXISTS swipes (
    swiper_id INTEGER NOT NULL, -- the user doing the swiping (id number)
    swipee_id INTEGER NOT NULL, -- the user being swiped on (id number)
    is_liked BOOLEAN NOT NULL,  -- TRUE for "yes/right", FALSE for "no/left"
    swipe_type VARCHAR(10) NOT NULL, -- to track the type of swipe (friend request or match)
    swiped_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (swiper_id, swipee_id),
    FOREIGN KEY (swiper_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user initiated the swipe
    FOREIGN KEY (swipee_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user was swiped on
    CHECK (swiper_id <> swipee_id), -- to prevent self-swiping
    CHECK (swipe_type IN ('friend', 'match')) -- to ensure valid swipe types
); 
/*
Tracking matches query
SELECT s1.swiper_id AS user1, s1.swipee_id AS user2
FROM swipes s1
JOIN swipes s2 ON s1.swiper_id = s2.swipee_id AND s1.swipee_id = s2.swiper_id
WHERE s1.is_liked = TRUE AND s2.is_liked = TRUE;
*/

-- table of user friends
CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL, -- the user id number
    friend_id INTEGER NOT NULL, -- to track the friend of the user
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user initiated the friend request
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user was added as a friend
    CHECK (user_id <> friend_id) -- to prevent self-friending
);


-- track user matches with other users, populated when a match is confirmed between two users
CREATE TABLE IF NOT EXISTS matches (
    user_id INTEGER NOT NULL, -- the user id number
    matched_user_id INTEGER NOT NULL, -- to track the matched user
    matched_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, matched_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user initiated the match
    FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user was matched with
    CHECK (user_id <> matched_user_id) -- to prevent self-matching
);

-- table of user messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY, -- message identifier number (integer)
    sender_id INTEGER NOT NULL, -- the user sending the message
    receiver_id INTEGER NOT NULL, -- the user receiving the message
    conversation_type VARCHAR(10) NOT NULL,  -- 'friend' or 'match'
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user sent the message
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user received the message
    CHECK (sender_id <> receiver_id), -- to prevent self-messaging
    CHECK (conversation_type IN ('friend', 'match')) -- to ensure valid conversation types and for sorting later
);

-- user setting tablle
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY, -- setting identifier number (integer)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user the settings belong to
    user_id INTEGER UNIQUE NOT NULL,

    -- notification_preferences TEXT,
    message_notifs BOOLEAN DEFAULT TRUE,
    match_notifs BOOLEAN DEFAULT TRUE,

    -- privacy_settings TEXT,
    public_friends BOOLEAN DEFAULT TRUE,

    account_status TEXT,
    location_settings TEXT,
    
    -- appearance_preferences TEXT,
    apperance_mode TEXT DEFAULT 'light',

    language_preferences TEXT,
    chat_settings TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- table of blog posts
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user created the blog
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blogs_posts (
    PRIMARY KEY (blog_id, post_id),
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE, -- to track which blog the post belongs to
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, -- to track which post is associated with the blog
    blog_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL
);

-- table of user opinion on restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- the user who liked the restaurant
    place_id CHAR(500), -- Google Map PlaceAPI's place_id
    opinion INTEGER NOT NULL -- (-1) = dislike, (1) = like
);

CREATE TABLE IF NOT EXISTS activities (
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  place_id CHAR(500),
  opinion INTEGER NOT NULL -- (-1) = dislike, (1) = like
);