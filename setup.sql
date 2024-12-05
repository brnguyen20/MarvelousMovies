--command
--psql -U postgres -f setup.sql

-- Drop the database if it exists (to reset it completely)
DROP DATABASE IF EXISTS marvelousmovies;

-- Create the database
CREATE DATABASE marvelousmovies;

-- Connect to the new database
\connect marvelousmovies;

-- Now add your tables and data
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    location VARCHAR(255),
    activity JSON,
    social_media_links JSON,
    reviews_list JSON,
    favorites_list JSON,
    follower_list JSON,
    following_list JSON,
    films_watched_list JSON,
    custom_lists JSON
);

CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    user_id INT,
    movie_id INT,
    star_rating INT CHECK (star_rating >= 0 AND star_rating <= 5),
    content TEXT,
    likes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE moviecomments(
    movie_id SERIAL PRIMARY KEY,
    comment_thread JSON
);

CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    user_id INT,
    friend_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (friend_id) REFERENCES users(user_id)
);

CREATE TABLE recommendations(
    id SERIAL PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    movie_list JSON
)

-- Testing Purposes (Save for later)
-- CREATE TABLE Replies (
--     reply_id SERIAL PRIMARY KEY,
--     review_id INT,
--     user_id INT,
--     content TEXT NOT NULL,
--     FOREIGN KEY (review_id) REFERENCES Review(review_id) ON DELETE CASCADE,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
-- );



-- SELECT * FROM users;
-- SELECT * FROM review;
SELECT * FROM moviecomments;