const argon2 = require("argon2");
const { Pool } = require("pg");
const env = require("../env.json");

const pool = new Pool(env);

const dummyUsers = [
  {
    username: "RobSimmons",
    password: "mycoolpassword",
    name: "Rob Simmons",
    email: "Robs-email@example.com",
    location: "PA",
    activity: {
      last_login: "2024-11-06T14:30:00Z",
      recent_activities: [
        {
          type: "watched",
          movie_id: 123,
          title: "Inception",
          timestamp: "2024-11-05T18:45:00Z"
        }
      ]
    },
    social_media_links: {
      Twitter: "https://twitter.com/notarealaccount"
    },
    reviews_list: [],
    favorites_list: [550, 238, 278], // movie_ids
    follower_list: [],
    following_list: [],
    films_watched_list: [550, 238, 278],
    custom_lists: {
      "Favorite Sci-Fi": [238, 550],
      "Watch Later": [278]
    }
  },
  {
    username: "MovieBuff",
    password: "password123",
    name: "Jane Smith",
    email: "jane@example.com",
    location: "NY",
    activity: {
      last_login: "2024-10-06T14:30:00Z",
      recent_activities: [
        {
          type: "reviewed",
          movie_id: 550,
          title: "Fight Club",
          timestamp: "2024-10-04T16:30:00Z",
          review: "Masterpiece!"
        }
      ]
    },
    social_media_links: {
      Instagram: "https://instagram.com/moviebuff"
    },
    reviews_list: [],
    favorites_list: [550],
    follower_list: [],
    following_list: [],
    films_watched_list: [550],
    custom_lists: {}
  }
];

const dummyReviews = [
  {
    movie_id: 550,
    star_rating: 5,
    content: "Don't talk about Fight Club!",
    likes: 10
  },
  {
    movie_id: 238,
    star_rating: 4,
    content: "A classic sci-fi masterpiece!",
    likes: 15
  }
];

const dummyMovieComments = [
  {
    movie_id: 278,
    comment_thread: {
      comments: [
        {
          user: "RobSimmons",
          comment: "This movie was outstanding!",
          replies: [
            {
              user: "MovieBuff",
              comment: "I think so too.",
              replies: []
            }
          ]
        }
      ]
    }
  }
];

pool.connect().then(async (client) => {
  try {
    // Insert Users
    for (const userData of dummyUsers) {
      const hash = await argon2.hash(userData.password);
      await client.query(
        `INSERT INTO Users (username, password, name, email, location, activity, 
          social_media_links, reviews_list, favorites_list, follower_list, 
          following_list, films_watched_list, custom_lists) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          userData.username,
          hash,
          userData.name,
          userData.email,
          userData.location,
          JSON.stringify(userData.activity),
          JSON.stringify(userData.social_media_links),
          JSON.stringify(userData.reviews_list),
          JSON.stringify(userData.favorites_list),
          JSON.stringify(userData.follower_list),
          JSON.stringify(userData.following_list),
          JSON.stringify(userData.films_watched_list),
          JSON.stringify(userData.custom_lists)
        ]
      );
      console.log(`Inserted user: ${userData.username}`);
    }

    // Get user_ids for reviews
    const userResult = await client.query("SELECT user_id, username FROM Users");
    const userMap = Object.fromEntries(
      userResult.rows.map(row => [row.username, row.user_id])
    );

    // Insert Reviews
    for (const review of dummyReviews) {
      await client.query(
        `INSERT INTO review (user_id, movie_id, star_rating, content, likes)
         VALUES ($1, $2, $3, $4, $5)`,
        [userMap["RobSimmons"], review.movie_id, review.star_rating, review.content, review.likes]
      );
      console.log(`Inserted review for movie: ${review.movie_id}`);
    }

    // Insert MovieComments
    for (const commentData of dummyMovieComments) {
      await client.query(
        `INSERT INTO moviecomments (movie_id, comment_thread)
         VALUES ($1, $2)`,
        [commentData.movie_id, JSON.stringify(commentData.comment_thread)]
      );
      console.log(`Inserted comments for movie: ${commentData.movie_id}`);
    }

    // Log the results
    console.log("\nInserted Users:");
    const users = await client.query("SELECT * FROM Users");
    console.log(users.rows);

    console.log("\nInserted Reviews:");
    const reviews = await client.query("SELECT * FROM review");
    console.log(reviews.rows);

    console.log("\nInserted MovieComments:");
    const comments = await client.query("SELECT * FROM moviecomments");
    console.log(comments.rows);

  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    await client.release();
    await pool.end();
  }
});
