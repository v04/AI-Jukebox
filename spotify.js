// spotify.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

let storedTokens = {
  access_token: null,
  refresh_token: null,
};

// 🔐 Step 1: Get login URL
export function getLoginUrl() {
  const scope = [
    "user-library-read",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-email",
    "user-read-recently-played",
    "user-read-private",
  ].join(" ");
  return `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`;
}

// 🔐 Step 2: Exchange code for tokens
export async function exchangeCodeForToken(code) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  const data = await res.json();
  storedTokens = { ...data };
  return data;
}

// ♻️ Refresh token
export async function refreshTokenIfNeeded(sessionTokens) {
  if (!sessionTokens?.refresh_token) throw new Error("Missing refresh token");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: sessionTokens.refresh_token,
    }),
  });

  const data = await res.json();
  storedTokens = { ...sessionTokens, access_token: data.access_token };
  return data.access_token;
}

// 🎧 Get user's liked songs
export async function getLikedSongs(token, limit = 10) {
  const res = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data.items?.map((item) => ({
    name: item.track.name,
    artist: item.track.artists[0].name,
    id: item.track.id,
  })) || [];
}

// 🎶 Get recently played
export async function getRecentlyPlayed(token, limit = 10) {
  const res = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data.items?.map((item) => ({
    name: item.track.name,
    artist: item.track.artists[0].name,
    id: item.track.id,
  })) || [];
}

// 📀 Get user playlists
export async function getUserPlaylists(token) {
  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data.items?.map((p) => ({
    id: p.id,
    name: p.name,
  })) || [];
}

// ➕ Add songs to a playlist (create if not exists)
export async function addToPlaylist(token, playlistName, tracks) {
  const userRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const userData = await userRes.json();
  const userId = userData.id;

  // Get user's existing playlists
  const playlists = await getUserPlaylists(token);
  let playlist = playlists.find((p) => p.name === playlistName);

  if (!playlist) {
    const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: playlistName, public: false }),
    });
    const created = await res.json();
    playlist = created;
  }

  // Search each track to get Spotify IDs
  const uris = [];
  for (const track of tracks) {
    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    const id = searchData.tracks?.items?.[0]?.uri;
    if (id) uris.push(id);
  }

  // Add to playlist
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });
}

// 🔎 Enrich Gemini response with Spotify data
// spotify.js (partial — patch only getRecommendations)

export async function getRecommendations(geminiTracks, token) {
  const enriched = [];

  for (const track of geminiTracks) {
    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    const item = searchData.tracks?.items?.[0];

    if (item) {
      enriched.push({
        title: item.name,
        artist: item.artists.map(a => a.name).join(", "),
        preview_url: item.preview_url,
        image: item.album.images[0]?.url || null,
        spotify_url: item.external_urls.spotify,
        id: item.id
      });
    }
  }

  return enriched;
}

