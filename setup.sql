-- Drop the database if it exists (to reset it completely)
DROP DATABASE IF EXISTS marvelousmovies;

-- Create the database
CREATE DATABASE marvelousmovies;

-- Connect to the new database only after creating it
\c marvelousmovies

-- Now add your tables and data
create table Users (
    user_id SERIAL PRIMARY KEY,
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

create table MoviePage (
    movie_id SERIAL PRIMARY KEY,
    movie_title VARCHAR(255) NOT NULL,
    replies JSON
);

create table Review (
    review_id SERIAL PRIMARY KEY,
    user_id INT,
    movie_id INT,
    star_rating INT CHECK (star_rating >= 0 AND star_rating <= 5),
    content TEXT,
    likes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES MoviePage(movie_id) ON DELETE CASCADE
);

SELECT * FROM Users;
SELECT * FROM MoviePage;
SELECT * FROM Review;

-- Testing Purposes (Save for later)
-- CREATE TABLE Replies (
--     reply_id SERIAL PRIMARY KEY,
--     review_id INT,
--     user_id INT,
--     content TEXT NOT NULL,
--     FOREIGN KEY (review_id) REFERENCES Review(review_id) ON DELETE CASCADE,
--     FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
-- );

-- Insert dummy data
-- INSERT INTO Users (name, email, location, activity, social_media_links) 
-- VALUES 
-- ('John Doe', 'john@example.com', 'New York', '{}', '{"Twitter": "https://twitter.com/johndoe"}'),
-- ('Jane Smith', 'jane@example.com', 'Los Angeles', '{}', '{"Instagram": "https://instagram.com/janesmith"}');

-- INSERT INTO MoviePage (movie_title) 
-- VALUES 
-- ('Inception'),
-- ('The Matrix'),
-- ('Interstellar');

-- INSERT INTO Review (user_id, movie_id, star_rating, content, likes) 
-- VALUES 
-- (1, 1, 5, 'Amazing movie with stunning visuals!', 10),
-- (2, 2, 4, 'A classic sci-fi masterpiece!', 15);

-- INSERT INTO Replies (review_id, user_id, content) 
-- VALUES 
-- (1, 2, 'I totally agree! The visuals were incredible.'),
-- (2, 1, 'Absolutely! It never gets old.');