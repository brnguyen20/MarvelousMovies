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

CREATE TABLE moviecomments (
    movie_id INT,
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

-- -- Test With JSON
-- INSERT INTO users (name, email, activity) 
-- VALUES 
-- ('Jeffery', 'Jefferys-email@example.com', '{
--     "last_login": "2024-11-06T14:30:00Z",
--     "recent_activities": [
--         {
--             "type": "watched",
--             "movie_id": 123,
--             "title": "Inception",
--             "timestamp": "2024-11-05T18:45:00Z"
--         },
--         {
--             "type": "reviewed",
--             "movie_id": 456,
--             "title": "The Matrix",
--             "timestamp": "2024-11-04T16:30:00Z",
--             "review": "Amazing movie, loved the action scenes!"
--         },
--         {
--             "type": "favorited",
--             "movie_id": 789,
--             "title": "Interstellar",
--             "timestamp": "2024-11-03T14:15:00Z"
--         }]}'),
-- ('Sig', 'Sigs-email@example.com', '{
--     "last_login": "2024-10-06T14:30:00Z",
--     "recent_activities": [
--         {
--             "type": "watched",
--             "movie_id": 550,
--             "title": "Fight Club",
--             "timestamp": "2024-10-05T18:45:00Z"
--         },
--         {
--             "type": "reviewed",
--             "movie_id": 550,
--             "title": "Fight Club",
--             "timestamp": "2024-10-04T16:30:00Z",
--             "review": "Dope movie yo!"
--         },
--         {
--             "type": "favorited",
--             "movie_id": 550,
--             "title": "Fight Club",
--             "timestamp": "2024-10-03T14:15:00Z"
--         }
--     ]
-- }');

-- INSERT INTO review (user_id, movie_id, star_rating, content, likes) 
-- VALUES 
-- (1, 1, 5, 'Dont talk about Fight Club!', 10),
-- (2, 2, 4, 'A classic sci-fi masterpiece!', 15);
-- -- (12, 567, 1, 'fake movies really stink', 1);

-- -- INSERT INTO Replies (review_id, user_id, content) 
-- -- VALUES 
-- -- (1, 2, 'I totally agree! The visuals were incredible.'),
-- -- (2, 1, 'Absolutely! It never gets old.');

-- -- Perform the SELECT queries at the end
-- INSERT INTO moviecomments (movie_id, comment_thread)
-- VALUES
--     (278, 
--      '{
--         "comments": [
--             {
--                 "user": "JohnDoe",
--                 "comment": "This movie was outstanding!",
--                 "replies": [
--                     {
--                         "user": "JaneDoe",
--                         "comment": "I think so too.",
--                         "replies": [
--                             {
--                                 "user": "JoeC",
--                                 "comment": "Agreed, it was a masterpiece.",
--                                 "replies": []
--                             }
--                         ]
--                     }
--                 ]
--             },
--             {
--                 "user": "AliceSmith",
--                 "comment": "Loved it from start to finish.",
--                 "replies": []
--             }
--         ]
--      }'::json),
--     (238, 
--      '{
--         "comments": [
--             {
--                 "user": "BobJohnson",
--                 "comment": "A classic that never gets old.",
--                 "replies": [
--                     {
--                         "user": "CharlieBrown",
--                         "comment": "Absolutely, its timeless.",
--                         "replies": []
--                     }
--                 ]
--             }
--         ]
--      }'::json);



-- SELECT * FROM users;
-- SELECT * FROM review;
SELECT * FROM moviecomments;