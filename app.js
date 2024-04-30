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

app.get("/get-genres", async (req, res) => {
  let url = `${root}/recommendations/available-genre-seeds`;
  const headers = { Authorization: `Bearer ${req.session.token}` };

  try {
    const result = await axios.get(url, { headers: headers });

    res.json({ result: result.data.genres });
  } catch (e) {
    console.error({ err: e });
    res.send({ error: e });
  }
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
    res.send({ error: e });
  }
});

//get recommendations based on song,genre or artist
app.get("/recommendations/:type", async (req, res) => {
  if (
    req.params.type !== "track" &&
    req.params.type !== "genre" &&
    req.params.type !== "artist"
  ) {
    res.status(404).send("Path not found");
    return;
  }

  const getWarningText = (type) => {
    return `${type} Id not included, Please include atleast one ${type} Id to get recommendations`;
  };

  const headers = { Authorization: `Bearer ${req.session.token}` };

  //artist recommendations
  if (req.params.type === "artist") {
    if (req.query.id === undefined) {
      res.send(getWarningText("Artist"));
      return;
    }

    const artistId = req.query.id;
    console.log(artistId);
    const url = `${root}/artists/${artistId}/related-artists`;

    try {
      const recommendations = await axios.get(url, {
        headers: headers,
      });

      const artists = [];

      for (artist of recommendations.data.artists) {
        artists.push({
          name: artist.name,
          images: artist.images,
          genres: artist.genres,
        });
      }
      res.send({ artists: artists });
    } catch (e) {
      console.error({ err: e });
      res.send({ error: e });
    }
    return;
  } else if (req.params.type === "track" || req.params.type === "genre") {
    const params = { limit: 8 };
    // recommendation for tracks
    if (req.params.type === "track") {
      if (req.query.id === undefined) {
        return res.send(getWarningText("Track"));
      }
      params.seed_tracks = req.query.id;

      // recommendation for genre
    } else if (req.params.type === "genre") {
      if (req.query.id === undefined) {
        return res.send(getWarningText("Genre"));
      }
      params.seed_genres = req.query.id;
    }

    const url = `${root}/recommendations`;

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
      res.send({ error: e });
    }
    return;
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
