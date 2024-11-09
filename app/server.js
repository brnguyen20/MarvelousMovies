let axios = require("axios");
let path = require("path");
let express = require("express");
let app = express();

let env = require("../env.json");
let hostname = "localhost";
let port = 3000;

let http = require("http");
let fs = require("fs");
let { Pool } = require("pg");

let pool = new Pool(env);
pool.connect().then(() => {
  console.log("Connected to database");
});

app.use(express.json());
app.use(express.static("public"));

const apiKey = env.api_key;

// this function will be called whenever our server receives a request
// args are request and response objects with these properties:
// https://nodejs.org/api/http.html#http_class_http_clientrequest
// https://nodejs.org/api/http.html#http_class_http_serverresponse
function handleRequest(req, res) {
  console.log("Request URL:", req.url);
  console.log("Request headers:", req.headers);
  console.log("Request method:", req.method);
  console.log();

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");

  let path = "site" + req.url;
  console.log(path);

  if (isDirectory(path)) {
    let newPath = path + "/index.html";
    fileExists(newPath, res);
  } else {
    fileExists(path, res);
  }
}

function fileExists(path, res) {
  try {
    if (fs.existsSync(path)) {
      setContentType(path, res);
      res.end(fs.readFileSync(path));
    } else {
      res.statusCode = 404;
      res.end("File not found");
    }
  } catch {
    res.statusCode = 500;
    res.end("Something went wrong");
  }
}

function isDirectory(path) {
  return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

function setContentType(ext, res) {
  switch (path.extname(ext)) {
    case ".html":
      res.setHeader("Content-Type", "text/html");
      break;
    case ".css":
      res.setHeader("Content-Type", "text/css");
      break;
    case ".js":
      res.setHeader("Content-Type", "text/javascript");
      break;
  }
}

//add logic here
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

// sets the response body and sends the response to the client
// should be called exactly once for each request

// now handleRequest will be called whenever our program receives a request
// the server will automatically pass request and response objects to it
let server = http.createServer(handleRequest);
app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
  });