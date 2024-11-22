let axios = require("axios");
let path = require("path");
let express = require("express");
let app = express();
let { Pool } = require("pg");
let argon2 = require("argon2"); 
let cookieParser = require("cookie-parser"); 
let crypto = require("crypto"); 
let env = require("../env.json");
let hostname = "localhost";
let port = 3000;

let http = require("http");
let fs = require("fs");

let pool = new Pool(env);
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
      ) VALUES ($1, $2, $1, $1 || '@example.com', 'Not Set', '[]'::json, '[]'::json)`, 
      [username, hash]
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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});