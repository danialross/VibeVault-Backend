const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
require("dotenv").config();
const root = "https://api.spotify.com/v1";
const port = process.env.PORT;

let token = null;

app.use(
  cors({
    origin: "https://localhost:3000",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to VibeVault API." });
});

app.get("/get-token", async (req, res) => {
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
    token = response.data.access_token;
    console.log({ res: token });
    res.send("Authorized by Spotify API");
  } catch (e) {
    console.error("Error getting authorization from Spotify API", e);
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
