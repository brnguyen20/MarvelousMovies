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

-- Testing Purposes (Save for later)
-- CREATE TABLE Replies (
--     reply_id SERIAL PRIMARY KEY,
--     review_id INT,
--     user_id INT,
--     content TEXT NOT NULL,
--     FOREIGN KEY (review_id) REFERENCES Review(review_id) ON DELETE CASCADE,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
-- );

-- Insert dummy data------------------------------------------------------------------------------------------------------
-- Test Without JSON
-- INSERT INTO users (name, email, location, social_media_links) 
-- VALUES 
-- ('Rob Simmons', 'Robs-email@example.com', 'PA', '{"Twitter": "https://twitter.com/notarealaccount"}'),
-- ('Elvis', 'Elvis-email@example.com', 'Elvis house', '{"Instagram": "https://instagram.com/fakeaccount"}');

-- Perform the SELECT queries at the end
INSERT INTO moviecomments (movie_id, comment_thread)
VALUES
    (278, 
     '{
        "comments": [
            {
                "user": "JohnDoe",
                "text": "This movie was outstanding!",
                "replies": [
                    {
                        "user": "JaneDoe",
                        "type": "top-level",
                        "text": "I think so too.",
                        "replies": [
                            {
                                "user": "JoeC",
                                "type": "reply",
                                "text": "Agreed, it was a masterpiece.",
                                "replies": []
                            }
                        ]
                    }
                ]
            },
            {
                "user": "AliceSmith",
                "type": "top-level",
                "text": "Loved it from start to finish.",
                "replies": []
            }
        ]
     }'::json),
    (238, 
     '{
        "comments": [
            {
                "user": "BobJohnson",
                "comment": "A classic that never gets old.",
                "replies": [
                    {
                        "user": "CharlieBrown",
                        "type": "top-level",
                        "text": "Absolutely, its timeless.",
                        "replies": []
                    }
                ]
            }
        ]
     }'::json),
     (533535, 
     '{
        "comments": [
            {
                "user": "Unknown",
                "type": "top-level",
                "text": "this is a deadpool and wolverine top-level comment",
                "replies": [
                    {
                        "user": "Unknown",
                        "type": "reply",
                        "text": "this is a reply to a top-level comment",
                        "replies": [
                            {
                                "user": "Unknown",
                                "type": "reply",
                                "text": "this is a reply to a reply",
                                "replies": [
                                    {
                                        "user": "Unknown",
                                        "type": "reply",
                                        "text": "this is a reply to a reply to a reply",
                                        "replies": []
                                    }
                                ]
                            },
                            {
                                "user": "Unknown",
                                "type": "reply",
                                "text": "this is another reply to a reply",
                                "replies": []
                            }
                        ]
                    }
                ]
            },
            {
                "user": "Unknown",
                "type": "top-level",
                "text": "this is another top-level comment",
                "replies": []
            }
        ]
     }'::json);;



-- SELECT * FROM users;
-- SELECT * FROM review;
SELECT * FROM moviecomments;