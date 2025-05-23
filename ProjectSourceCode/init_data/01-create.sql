-- create database lucky_moment_db;
CREATE EXTENSION IF NOT EXISTS postgis; -- allows for location queries

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

CREATE TABLE IF NOT EXISTS post_likes (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  liked_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- table of user profiles
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user the profile belongs to
    user_id INTEGER UNIQUE NOT NULL,
    display_name VARCHAR(100),
    biography TEXT,
    birthday DATE,
    profile_picture_url TEXT DEFAULT 'data:image/jpeg;base64,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',
    created_at TIMESTAMP DEFAULT NOW(),
    spotify_song_id TEXT,

    -- preferences section
    user_location_text TEXT,
    user_location GEOGRAPHY(Point, 4326), -- to store the user's location as a point in a geographic coordinate system with postgis
    match_distance_miles INTEGER DEFAULT 200,
    gender TEXT,
    preferred_gender TEXT,
    preferred_age_min INTEGER DEFAULT 18,
    preferred_age_max INTEGER DEFAULT 100
);

-- table of all available interests users can select from
CREATE TABLE IF NOT EXISTS interests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- table of user interests, to track which users have selected which interests
CREATE TABLE IF NOT EXISTS user_interests (
  user_id INTEGER NOT NULL,
  interest_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user has the interest
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE -- to track which interest is selected
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

-- table of user opinion on music
CREATE TABLE IF NOT EXISTS music (
    user_id INTEGER NOT NULL,
    song_id CHAR(500) NOT NULL,
    liked BOOLEAN NOT NULL,
    PRIMARY KEY (user_id, song_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 

-- table of user opinion on restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- the user who liked the restaurant
    place_id CHAR(500), -- Google Map PlaceAPI's place_id
    opinion BOOLEAN NOT NULL -- (False) = dislike, (True) = like
);

-- table of user opinion on activities
CREATE TABLE IF NOT EXISTS activities (
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- the user who liked the activity
    place_id CHAR(500), -- Google Maps PlaceAPI's place_id for the activity
    opinion BOOLEAN NOT NULL -- (False) = dislike, (True) = like
);