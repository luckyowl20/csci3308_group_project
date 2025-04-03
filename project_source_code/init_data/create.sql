create database lucky_moment_db;

-- table of users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,      -- creates a unique identifier for each user as a serialized integer
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- table of user posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user created the post
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE SET NULL, -- to track which photo is associated with the post
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
);

-- table of user profiles
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user the profile belongs to
    user_id INTEGER UNIQUE NOT NULL,
    display_name VARCHAR(100),
    biography TEXT,
    interests TEXT,
    birthday DATE,
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- table of user photos, can be attached to posts or profiles
CREATE TABLE photos (
    id SERIAL PRIMARY KEY, -- photo identifier number (integer)
    image_data BYTEA, -- TODO: decide if we want to store the URL or the raw image data 
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);


-- table of pending user swipes, awating matches or friend requests
CREATE TABLE swipes (
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
CREATE TABLE friends (
    user_id INTEGER NOT NULL, -- the user id number
    friend_id INTEGER NOT NULL, -- to track the friend of the user
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user initiated the friend request
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user was added as a friend
    CHECK (user_id <> friend_id) -- to prevent self-friending
);


-- track user matches with other users, populated when a match is confirmed between two users
CREATE TABLE matches (
    user_id INTEGER NOT NULL, -- the user id number
    matched_user_id INTEGER NOT NULL, -- to track the matched user
    matched_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, matched_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user initiated the match
    FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE CASCADE, -- to track which user was matched with
    CHECK (user_id <> matched_user_id) -- to prevent self-matching
);

-- table of user messages
CREATE TABLE messages (
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