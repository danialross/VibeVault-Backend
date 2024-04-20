const express = require("express");
const session = require("express-session");
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
  if (req.session.token && req.session.expires_in > Date.now()) {
    console.log("session already exist");
    return next();
  }
  console.log("creating new session");
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

//testing middleware
app.get("/test", (req, res) => {
  console.log(req.session);
  res.status(200).send("completed");
});

//get spotify metadata of track/artist to use in recommendation query
app.get("/get-metadata", async (req, res) => {
  let url = "https://api.spotify.com/v1/search";
  let isTrack = false;
  const headers = { Authorization: `Bearer ${req.session.token}` };
  let params = { limit: 4 };

  if (req.query.track) {
    params.type = "track";
    params.q = req.query.track;
    isTrack = true;
  } else {
    params.type = "artist";
    params.q = req.query.artist;
  }

  console.log(`url: ${url}`);
  console.log(`token ${req.session.token}`);

  try {
    const result = await axios.get(url, { headers: headers, params: params });
    const metadata = [];

    //grabs the artist name or track name depending or query
    let iterable = null;
    isTrack
      ? (iterable = result.data.tracks.items)
      : (iterable = result.data.artists.items);

    for (item of iterable) {
      metadata.push({
        name: item.name,

        id: item.id,
        ...(isTrack
          ? { artist: item.artists, images: item.album.images }
          : { images: item.images }),
      });
    }
    res.json({ result: metadata });
  } catch (e) {
    console.error({ err: e });
  }
});

//get recommendations based on song
app.get("/recommendations/track", async (req, res) => {
  const url = `${root}/recommendations`;
  const headers = { Authorization: `Bearer ${req.session.token}` };
  const params = {
    limit: 5,
    seed_tracks: req.query.id,
  };
  console.log(`url: ${url}`);
  console.log(`headers: ${headers}`);
  console.log(`params: ${params}`);

  try {
    const recommendations = await axios.get(url, {
      headers: headers,
      params: params,
    });

    const tracks = [];

    for (track of recommendations.data.tracks) {
      tracks.push({
        name: track.name,
        images: track.album.images,
        artists: track.artists,
      });
    }
    res.send({ tracks: tracks });
  } catch (e) {
    console.error({ err: e });
  }
});

//get recommendations based on genre
app.post("/recommendations/genre", (req, res) => {
  res.send("genre");
});

//get recommendations based on artist
app.post("/recommendations/artist", (req, res) => {
  res.send("artist");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
