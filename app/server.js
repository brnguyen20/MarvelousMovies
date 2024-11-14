let axios = require("axios");
let path = require("path");
let express = require("express");
let app = express();
let { Pool } = require("pg");
let argon2 = require("argon2"); // Password hashing
let cookieParser = require("cookie-parser"); // Cookie handling
let crypto = require("crypto"); // Token generation
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

// Move the authorize middleware here, before it's used
let authorize = (req, res, next) => {
  let { token } = req.cookies;
  if (!token || !tokenStorage.hasOwnProperty(token)) {
    return res.redirect('/index.html');
  }
  next();
};

// Now use the middleware
app.use('/movies.html', authorize);
app.use('/profile.html', authorize);
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Add static file serving after the authorization middleware
app.use(express.static("public"));


const apiKey = env.api_key;

//AUTH ENDPOINTS

// In-memory token storage (for demonstration purposes)
let tokenStorage = {};

// Cookie options
let cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
};

// Function to generate a random 32-byte token
function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Function to validate login request body
function validateLogin(body) {
  return body.username && body.password; // Simple validation for demonstration
}

// Account creation endpoint
app.post("/create", async (req, res) => {
  let { username, password } = req.body;

  if (!validateLogin(req.body)) {
    return res.status(400).send("Invalid request data.");
  }

  // Hash the password
  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.error("HASH FAILED", error);
    return res.sendStatus(500);
  }

  // Insert the user into the database
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

  // Automatically log in after creating the account
  let token = makeToken();
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send("Account created and logged in.");
});

// Login endpoint
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

  // Username not found
  if (result.rows.length === 0) {
    return res.status(400).send("Invalid username or password.");
  }

  let hash = result.rows[0].password;

  // Verify the password
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

  // Generate login token and set it as a cookie
  let token = makeToken();
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send("Logged in successfully.");
});

// Logout endpoint
app.post("/logout", (req, res) => {
  let { token } = req.cookies;

  if (!token || !tokenStorage[token]) {
    return res.status(400).send("Not logged in.");
  }

  delete tokenStorage[token];
  return res.clearCookie("token", cookieOptions).send("Logged out successfully.");
});

// Public endpoint (no authorization required)
app.get("/public", (req, res) => {
  return res.send("A public message\n");
});

// Private endpoint (authorization required)
app.get("/private", authorize, (req, res) => {
  return res.send("A private message\n");
});

//MOVIE ENDPOINTS
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
    console.log(result.rows[0].comment_thread)
    res.status(200).json(result.rows[0].comment_thread);
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

// Add this helper function to get username from token
function getCurrentUser(req) {
  const token = req.cookies.token;
  return tokenStorage[token];
}

// Get basic user profile information
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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});