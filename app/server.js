// require() is Node's version of Python's import
let http = require("http");
let fs = require("fs");
let path = require("path");
let express = require("express");
let { Pool } = require("pg");
let env = require("../env.json");

let hostname = "localhost";
let port = 3000;
let app = express();

app.use(express.json());
app.use(express.static("public"));

let pool = new Pool(env);
pool.connect().then(() => {
  console.log("Connected to database");
});

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

const tmdbApiKey = env.tmdbApiKey;

app.get("/title", async (req, res) => {
  const movieId = req.query.id;

  if (!movieId) {
    return res.status(400).json({ error: "Movie ID is required" });
  }

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        params: { api_key: tmdbApiKey },
      }
    );
    const title = response.data.title;
    res.json({ title });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch movie title" });
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
  