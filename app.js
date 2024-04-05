const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 3001;
const root = "http://ws.audioscrobbler.com/2.0";
const headers = {
  "User-Agent": "VibeVault/1.0 ( danialrossar@gmail.com )",
  Accept: "application/json",
};

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

//get recommendations based on song
app.post("/api/track", async (req, res) => {
  const recording = encodeURIComponent(req.body.recording);
  const artist = encodeURIComponent(req.body.artist);

  console.log(recording);
  console.log(artist);
  console.log(root);
  console.log(headers);
  const url = `${root}/recording?query=recording:%22${recording}%22+AND+artist:%22${artist}%22`;

  try {
    const result = await axios.get(url, { headers: headers });
    res.send({ res: result.data });
  } catch (e) {
    console.error({ error: e });
    res.status(500).send({ error: "Failed to fetch data", details: e });
  }
  //   res.send({
  //     recording: recording,
  //     artist: artist,
  //     root: root,
  //     headers: headers,
  //     url: url,
  //   });
});

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
