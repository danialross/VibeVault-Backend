const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
require("dotenv").config();
const root = "https://api.spotify.com/v1";
const port = process.env.PORT;

app.use(
  cors({
    origin: "https://localhost:3000",
    methods: ["GET", "POST"],
  })
);

app.use(
  session({
    secret: process.env.SECRETKEY,
    resave: false,
    saveUninitialized: true,
    rolling: false,
    cookie: { httpOnly: true, secure: false, maxAge: 3600000 },
  })
);

app.use(express.json());

// middleware to check for a valid session and refresh token if not
app.use(async (req, res, next) => {
  if (
    req.session.userId &&
    req.session.token &&
    req.session.expires_in > Date.now()
  ) {
    return next();
  }

  const url = "https://accounts.spotify.com/api/token";
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(url, "grant_type=client_credentials", {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    req.session.token = response.data.access_token;
    req.session.expires_in = Date.now() + response.data.expires_in * 1000;
    next();
  } catch (e) {
    console.error("Error getting authorization from Spotify API", e);
    res.status(500).send("Failed to authenticate with Spotify");
  }
});

app.get("/", (req, res) => {
  res.send({ message: "Welcome to VibeVault API." });
});

app.get("/get-id", async (req, res) => {
  const validated = validateToken(req);
  if (!validated) {
    return res.send("an error occured when validating user");
  }

  let url = "https://api.spotify.com/v1/search?q=";
  if (req.query.track) {
    url += req.query.track + "&type=track&limit=4";

    try {
      const response = await axios.get(url);
      const result = [];

      for (item of response.data.tracks.items) {
        result.push({
          track: album.name,
          artist: album.artists,
          image: album.images,
        });
      }
    } catch (e) {
      console.error({ err: e });
    }
  } else {
    url + req.query.artist + "&type=artist&limit=4";
  }
});

//get recommendations based on song
app.post("/api/track", async (req, res) => {});

//get recommendations based on genre
app.post("/api/genre", (req, res) => {
  res.send("genre");
});

//get recommendations based on artist
app.post("/api/artist", (req, res) => {
  res.send("artist");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
