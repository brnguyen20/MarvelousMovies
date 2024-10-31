// require() is Node's version of Python's import
let http = require("http");
let axios = require("axios");
let fs = require("fs");
let path = require("path");
let express = require("express");
let { Pool } = require("pg");
let env = require("../env.json");
let apiKey = env.api_key
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
    console.log(cast)
    return res.status(200).json({ cast });
  }).catch(error => {
    console.log(error)
    return res.status(400).json({error : error.data});
  });
});
// sets the response body and sends the response to the client
// should be called exactly once for each request

// now handleRequest will be called whenever our program receives a request
// the server will automatically pass request and response objects to it
let server = http.createServer(handleRequest);
app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
  });
  