let axios = require("axios");
let path = require("path");
let express = require("express");
let app = express();
let { Pool } = require("pg");
let argon2 = require("argon2"); 
let cookieParser = require("cookie-parser"); 
let crypto = require("crypto"); 
let env = require("../env.json");
let port = 3000;

let http = require("http");
let fs = require("fs");

let host;
let databaseConfig;
// fly.io sets NODE_ENV to production automatically, otherwise it's unset when running locally
if (process.env.NODE_ENV == "production") {
	host = "0.0.0.0";
	databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
	host = "localhost";
	let { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;
	databaseConfig = { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT };
}

let pool = new Pool(databaseConfig);
pool.connect().then(() => {
  console.log("Connected to database");
});

app.use(express.json());
app.use(cookieParser());

let authorize = (req, res, next) => {
  let { token } = req.cookies;
  if (!token || !tokenStorage.hasOwnProperty(token)) {
    return res.redirect('/index.html');
  }
  next();
};

app.use('/movies.html', authorize);
app.use('/profile.html', authorize);
app.use('/movieInfo.html', authorize);
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.use(express.static("public"));

const apiKey = env.api_key;


let tokenStorage = {};

let cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
};

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function validateLogin(body) {
  return body.username && body.password;
}

app.post("/create", async (req, res) => {
  let { username, password } = req.body;

  if (!validateLogin(req.body)) {
    return res.status(400).send("Invalid request data.");
  }

  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.error("HASH FAILED", error);
    return res.sendStatus(500);
  }

  try {
    await pool.query(`
      INSERT INTO users (
        username, 
        password, 
        name, 
        email, 
        location, 
        films_watched_list, 
        favorites_list
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
      [username, hash, username, `${username}@example.com`, 'Not Set', '[]', '[]']
    );
  } catch (error) {
    console.error("INSERT FAILED", error);
    return res.sendStatus(500);
  }

  let token = makeToken();
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send("Account created and logged in.");
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;

  if (!validateLogin(req.body)) {
    return res.status(400).send("Invalid request data.");
  }

  let result;
  try {
    result = await pool.query("SELECT password FROM users WHERE username = $1", [username]);
  } catch (error) {
    console.error("SELECT FAILED", error);
    return res.sendStatus(500);
  }

  if (result.rows.length === 0) {
    return res.status(400).send("Invalid username or password.");
  }

  let hash = result.rows[0].password;

  let verifyResult;
  try {
    verifyResult = await argon2.verify(hash, password);
  } catch (error) {
    console.error("VERIFY FAILED", error);
    return res.sendStatus(500);
  }

  if (!verifyResult) {
    return res.status(400).send("Invalid username or password.");
  }

  let token = makeToken();
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send("Logged in successfully.");
});

app.post("/logout", (req, res) => {
  let { token } = req.cookies;

  if (!token || !tokenStorage[token]) {
    return res.status(400).send("Not logged in.");
  }

  delete tokenStorage[token];
  return res.clearCookie("token", cookieOptions).send("Logged out successfully.");
});

app.get("/public", (req, res) => {
  return res.send("A public message\n");
});

app.get("/private", authorize, (req, res) => {
  return res.send("A private message\n");
});

app.get(`/genre`, (req, res) => {
  let movieID = req.query.movieID;
  let url = `https://api.themoviedb.org/3/movie/${movieID}?language=en-US`;
  axios({
    method: 'get',
    url: url,
    headers: {
      Authorization: apiKey,
      Accept: 'application/json'
    }
  }).then(response => {
    const genreNames = (response.data.genres || []).map(genre => genre.name);
    res.status(response.status).json({ genres: genreNames });
    }).catch(error => {
      res.status(error.response.status).json({error : error.response.data});
    });
  });

  app.get(`/details`, (req, res) => {
    let movieID = req.query.movieID;
    let url = `https://api.themoviedb.org/3/movie/${movieID}?language=en-US`;
    axios({
      method: 'get',
      url: url,
      headers: {
        Authorization: apiKey,
        Accept: 'application/json'
      }
    }).then(response => {
      res.status(response.status).json(response.data);
    }).catch(error => {
      res.status(error.response.status).json({error : error.response.data});
    });
  });

  app.get("/images", (req, res) => {
    let movieID = req.query.movieID;
    let url = `https://api.themoviedb.org/3/movie/${movieID}/images`;
    axios({
      method: 'get',
      url: url,
      headers: {
        Authorization: apiKey,
        Accept: 'application/json'
      }
    }).then(response => {
      res.status(response.status).json(response.data);
    }).catch(error => {
      res.status(error.response.status).json({error : error.response.data});
    });
  });

  app.get(`/cast`, (req, res) => {
    let movieID = req.query.movieID;
    let url = `https://api.themoviedb.org/3/movie/${movieID}/credits`;
    axios({
      method: 'get',
      url: url,
      headers: {
        Authorization: apiKey,
        Accept: 'application/json'
      }
    }).then(response => {
      //console.log(response.data)
      let data = response.data.cast
      let cast = {}
      for (let key in data) {
        let person = data[key];
        if (person.known_for_department === "Acting") {
          cast[person.name] = person.character;
        }
      }
      return res.status(200).json({ cast });
    }).catch(error => {
      console.log(error)
      return res.status(400).json({error : error.data});
    });
  });

app.get("/title", async (req, res) => {
  const movieId = req.query.movieID;

  if (!movieId) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        headers: {
          Authorization: apiKey,
          Accept: 'application/json'
        }
      }
    );
    const title = response.data.title;
    res.json({ title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch movie title" });
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: "Movie name is required" });
  }

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie`,
      {
        params: {
          query, // movie name
          language: "en-US",
        },
        headers: {
          Accept: "application/json",
          Authorization: apiKey, 
        },
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      res.json(response.data.results); 
    } else {
      res.status(404).json({ error: "No movies found with that name" });
    }
  } catch (error) {
    console.error("Error searching for movie:", error);
    res.status(500).json({ error: "Failed to search for movie" });
  }
});

app.get(`/load`, (req, res) => {
  let movieID = req.query.movieID;
  console.log(movieID)
  pool.query(
    'SELECT comment_thread FROM MovieComments WHERE movie_id = $1', [movieID]
  ).then((result) => {
    if (result.rows.length > 0) {
      console.log(result.rows[0].comment_thread)
      res.status(200).json(result.rows[0].comment_thread);
    }
  }).catch((error) => {
    console.error("Query error", error);
    res.status(500).json({ error: "Internal server error" });
  })
});
app.post('/save-comments', (req, res) => {
  const { movie_id, comment_thread } = req.body;

  pool.query(
      'INSERT INTO MovieComments (movie_id, comment_thread) VALUES ($1, $2) ON CONFLICT (movie_id) DO UPDATE SET comment_thread = $2',
      [movie_id, comment_thread]
  )
  .then(() => {
      res.status(200).json({ success: true });
  })
  .catch((error) => {
      console.error('Error inserting comments:', error);
      res.status(500).json({ error: 'Failed to save comments' });
  });
});

app.get('/popular', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular`,
      {
        headers: {
          Authorization: apiKey, 
          Accept: 'application/json',
        },
        params: {
          language: 'en-US',
        },
      }
    );
    res.json(response.data.results); 
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

function getCurrentUser(req) {
  const token = req.cookies.token;
  return tokenStorage[token];
}

app.get('/api/user/profile', authorize, async (req, res) => {
  try {
    const username = getCurrentUser(req);
    const result = await pool.query(
      `SELECT user_id, username, name, email, location, 
              social_media_links, films_watched_list, favorites_list 
       FROM users 
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.get('/api/user/comments', authorize, async (req, res) => {
  try {
    const username = getCurrentUser(req);
    const result = await pool.query('SELECT movie_id, comment_thread FROM moviecomments');
    
    // not sure if this is the most efficient way to do this
    const allComments = [];
    result.rows.forEach(row => {
      const thread = row.comment_thread;
      
      const findUserComments = (comments) => {
        comments.forEach(comment => {
          if (comment.user === username) {
            allComments.push({
              movieId: row.movie_id,
              text: comment.text,
              type: comment.type
            });
          }
          if (comment.replies) {
            findUserComments(comment.replies);
          }
        });
      };

      findUserComments(thread.comments);
    });

    res.json(allComments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: "Failed to fetch user comments" });
  }
});

app.get('/api/users', authorize, async (req, res) => {
    try {
        const currentUser = getCurrentUser(req);
        const result = await pool.query(
            'SELECT user_id, username FROM users WHERE username != $1',
            [currentUser]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get('/api/user/friends', authorize, async (req, res) => {
    try {
        const username = getCurrentUser(req);
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1',
            [username]
        );
        const userId = userResult.rows[0].user_id;

        const friendsResult = await pool.query(
            `SELECT f.friend_id, u.username 
             FROM friends f 
             JOIN users u ON f.friend_id = u.user_id 
             WHERE f.user_id = $1`,
            [userId]
        );
        res.json(friendsResult.rows);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: "Failed to fetch friends" });
    }
});

app.post('/api/user/friends', authorize, async (req, res) => {
    try {
        const username = getCurrentUser(req);
        const { friendId } = req.body;
        
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1',
            [username]
        );
        const userId = userResult.rows[0].user_id;

        await pool.query(
            'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)',
            [userId, friendId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: "Failed to add friend" });
    }
});

app.delete('/api/user/friends', authorize, async (req, res) => {
    try {
        const username = getCurrentUser(req);
        const { friendId } = req.body;
        
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1',
            [username]
        );
        const userId = userResult.rows[0].user_id;

        await pool.query(
            'DELETE FROM friends WHERE user_id = $1 AND friend_id = $2',
            [userId, friendId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: "Failed to remove friend" });
    }
});

app.get('/api/user/recommendations', authorize, async (req, res) => {
  try {
      const username = getCurrentUser(req);

      // Get the user's ID from the username
      const result = await pool.query(
          'SELECT user_id FROM users WHERE username = $1',
          [username]
      );
      const userId = result.rows[0].user_id;

      // Fetch the movie_list for this user
      const recommendationsResult = await pool.query(
          'SELECT movie_list FROM recommendations WHERE user_id = $1',
          [userId]
      );

      if (recommendationsResult.rows.length === 0) {
          // No recommendations for the user
          return res.json([]);
      }

      const movieList = recommendationsResult.rows[0].movie_list;
      res.json(movieList || []);
  } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/api/user/friendsRecommendations', authorize, async (req, res) => {
  try {
    const username = getCurrentUser(req);

    // Get the user's ID
    const userResult = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].user_id;

    // Get the list of friend IDs
    const friendsResult = await pool.query(
      'SELECT friend_id FROM friends WHERE user_id = $1',
      [userId]
    );
    const friendIds = friendsResult.rows.map(row => row.friend_id);

    if (friendIds.length === 0) {
      // No friends found
      return res.json([]);
    }

    // Get recommendations from all friends
    const recommendationsResult = await pool.query(
      'SELECT movie_list FROM recommendations WHERE user_id = ANY($1::int[])',
      [friendIds]
    );

    // Compile a single list of movies from all friends' recommendations
    const friendsMovies = [];
    recommendationsResult.rows.forEach(row => {
      if (Array.isArray(row.movie_list)) {
        friendsMovies.push(...row.movie_list);
      }
    });

    res.json(friendsMovies);
  } catch (error) {
    console.error('Error fetching friends recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch friends recommendations' });
  }
});

app.post('/add-to-recommendations', authorize, async (req, res) => {
  const { movieID } = req.body;

  if (!movieID) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  const username = getCurrentUser(req); // Assuming this function now returns user_id, not username
  let userId = -1;
  try {
    console.log("fetching userId");
    const result = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    userId = result["rows"][0]["user_id"];
  } catch(error) {
    console.log(error);
  }
  try {
    // Fetch the user's current recommendations list using user_id
    const result = await pool.query(
      'SELECT movie_list FROM recommendations WHERE user_id = $1',
      [userId]
    );
    console.log(userId);
    if (result.rows.length === 0) {
      // If no recommendations list exists for the user, create one
      await pool.query(
        'INSERT INTO recommendations (user_id, movie_list) VALUES ($1, $2)',
        [userId, JSON.stringify([movieID])]
      );
    } else {
      // If the list exists, add the movie to the list
      const movieList = result.rows[0].movie_list;
      if (!movieList.includes(movieID)) {
        movieList.push(movieID); // Add the movie if it's not already in the list
        console.log("movieList:" + movieList);
        await pool.query(
          'UPDATE recommendations SET movie_list = $1 WHERE user_id = $2',
          [JSON.stringify(movieList), userId]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding movie to recommendations:", error);
    res.status(500).json({ error: "Failed to add movie to recommendations" });
  }
});

app.post('/remove-from-recommendations', authorize, async (req, res) => {
  const { movieID } = req.body;

  if (!movieID) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  const username = getCurrentUser(req); // Assuming this function returns user_id
  let userId = -1;
  try {
    // Fetch user_id from the username
    const result = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );
    userId = result["rows"][0]["user_id"];
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return res.status(500).json({ error: "Failed to fetch user ID" });
  }

  try {
    // Fetch the user's current recommendations list
    const result = await pool.query(
      'SELECT movie_list FROM recommendations WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "No recommendations list found for the user" });
    }

    const movieList = result.rows[0].movie_list;

    // Remove the movie from the list if it exists
    const updatedMovieList = movieList.filter(id => id !== movieID);

    // Update the database with the new list
    await pool.query(
      'UPDATE recommendations SET movie_list = $1 WHERE user_id = $2',
      [JSON.stringify(updatedMovieList), userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing movie from recommendations:", error);
    res.status(500).json({ error: "Failed to remove movie from recommendations" });
  }
});

app.post('/api/rating', authorize, async (req, res) => {
  const { user_id, movie_id, star_rating, content } = req.body;

  if (!user_id || !movie_id || !star_rating) {
    return res.status(400).json({ error: 'User ID, Movie ID, and Star Rating are required' });
  }

  try {
    const existingRating = await pool.query(
      'SELECT * FROM review WHERE user_id = $1 AND movie_id = $2', 
      [user_id, movie_id]
    );

    if (existingRating.rows.length > 0) {
      await pool.query(
        'UPDATE review SET star_rating = $1, content = $2 WHERE user_id = $3 AND movie_id = $4', 
        [star_rating, content, user_id, movie_id]
      );
      res.status(200).json({ message: 'Rating updated successfully!' });
    } else {
      await pool.query(
        'INSERT INTO review (user_id, movie_id, star_rating, content) VALUES ($1, $2, $3, $4)', 
        [user_id, movie_id, star_rating, content]
      );
      res.status(200).json({ message: 'Rating posted successfully!' });
    }
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

app.get('/api/ratings', authorize, async (req, res) => {
  const { movie_id } = req.query;

  if (!movie_id) {
    return res.status(400).json({ error: 'Movie ID is required' });
  }

  try {
    const ratings = await pool.query(
      `SELECT r.user_id, r.star_rating, r.content, u.username, r.likes
       FROM review r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.movie_id = $1`,
      [movie_id]
    );

    res.status(200).json(ratings.rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});


app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
