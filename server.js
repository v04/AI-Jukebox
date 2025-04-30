// server.js (final)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getLoginUrl,
  exchangeCodeForToken,
  refreshTokenIfNeeded,
  getLikedSongs,
  getRecentlyPlayed,
  getUserPlaylists,
  addToPlaylist,
  getRecommendations,
} from "./spotify.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "jukebox-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.get("/", (req, res) => res.send("🎵 AI JukeBox Backend is running."));

// Step 1: Spotify login redirect
app.get("/login", (req, res) => {
  const url = getLoginUrl();
  res.redirect(url);
});

// Step 2: Callback to exchange code for tokens
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const tokens = await exchangeCodeForToken(code);
    req.session.tokens = tokens;
    console.log("✅ Spotify tokens stored in session.");
    return res.send("✅ Spotify authenticated. You can now close this tab.");
  } catch (err) {
    console.error("❌ Callback error:", err);
    return res.status(500).send("Authentication failed.");
  }
});

// Main generate endpoint
app.post("/generate", async (req, res) => {
  try {
    if (!req.session.tokens) return res.status(401).json({ message: "Not authenticated" });
    const token = await refreshTokenIfNeeded(req.session.tokens);
    const prompt = req.body.prompt || "suggest me music ";
    console.log("📝 Prompt:", prompt);

    const liked = await getLikedSongs(token, 10);
    const recent = await getRecentlyPlayed(token, 10);

    const likedSummary = liked.map(s => `${s.name} - ${s.artist}`).join(", ");
    const recentSummary = recent.map(s => `${s.name} - ${s.artist}`).join(", ");

    const fullPrompt = `User prompt: ${prompt}\nLiked: ${likedSummary}\nRecent: ${recentSummary}\nReturn a JSON object: { tracks: [{ title: string, artist: string }] }`;

    const aiRes = await model.generateContent(fullPrompt);
    let text = aiRes.response.text().replace(/```json|```/g, "").trim();
    // ensure valid JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const jsonString = text.slice(start, end + 1);
    const { tracks } = JSON.parse(jsonString);
    console.log("🎵 AI tracks:", tracks);

    const playlist = await getRecommendations(tracks, token);
    console.log(`🎶 Enriched tracks: ${playlist.length}`);
    return res.json({ playlist });
  } catch (err) {
    console.error("❌ /generate error:", err);
    return res.status(500).json({ message: "Generation failed" });
  }
});

// Fetch user playlists
app.get("/playlists", async (req, res) => {
  try {
    if (!req.session.tokens) return res.status(401).json([]);
    const token = await refreshTokenIfNeeded(req.session.tokens);
    const list = await getUserPlaylists(token);
    return res.json(list);
  } catch (err) {
    console.error("❌ /playlists error:", err);
    return res.status(500).json([]);
  }
});

// Add to Spotify playlist
app.post("/add-to-playlist", async (req, res) => {
  try {
    if (!req.session.tokens) return res.status(401).json({ message: "Not authenticated" });
    const token = await refreshTokenIfNeeded(req.session.tokens);
    const { playlistName, tracks } = req.body;
    await addToPlaylist(token, playlistName, tracks);
    return res.json({ message: "✅ Added to playlist" });
  } catch (err) {
    console.error("❌ /add-to-playlist error:", err);
    return res.status(500).json({ message: "Add failed" });
  }
});

app.listen(port, () => console.log(`🎵 Backend listening on http://localhost:${port}`));
