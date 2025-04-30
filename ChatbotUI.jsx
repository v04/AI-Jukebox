import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import Snackbar from '@/components/ui/snackbar';

export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    { role: 'system', text: 'Hi! Describe your mood or moment to get a playlist.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiTracks, setAiTracks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    if (snackbar) {
      const timer = setTimeout(() => setSnackbar(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  useEffect(() => {
    fetch('http://localhost:3001/playlists', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPlaylists(data))
      .catch(console.error);
  }, []);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setMessages(msgs => [...msgs, { role: 'user', text: input }]);
    try {
      const res = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const { playlist } = await res.json();
      setAiTracks(playlist);
      setMessages(msgs => [...msgs, { role: 'bot', text: '🎶 Here are your tracks!' }]);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setSnackbar('⚠️ Failed to generate playlist');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist) {
      setSnackbar('⚠️ Please select a playlist');
      return;
    }
    try {
      await fetch('http://localhost:3001/add-to-playlist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistName: selectedPlaylist, tracks: aiTracks }),
      });
      setSnackbar('✅ Tracks added');
      setShowModal(false);
      setSelectedPlaylist('');
    } catch (err) {
      console.error(err);
      setSnackbar('⚠️ Could not add to playlist');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <span>�🎧</span> AI JukeBox
      </h1>

      <Card className="w-full max-w-2xl mb-4">
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-blue-600 self-end text-white' : 'bg-gray-200 text-black'
              }`}
            >
              {m.text}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <div className="flex w-full max-w-2xl gap-2 mb-4">
        <Input
          className="flex-1"
          placeholder="e.g. 'Rainy night drive in Tokyo'"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendPrompt()}
        />
        <Button onClick={sendPrompt} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Send'}
        </Button>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Save to playlist">
        <div className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            {aiTracks.map((t, i) => (
              <li key={i} className="bg-zinc-800 p-2 rounded-lg flex items-center gap-2">
                {t.image && <img src={t.image} alt={t.title} className="w-12 h-12 rounded" />}
                <div className="flex-1">
                  <a
                    href={t.url || t.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline text-white"
                  >
                    {t.title}
                  </a>
                  <p className="text-gray-400 text-sm">{t.artist}</p>
                  {t.preview_url && (
                    <audio controls className="mt-1 w-full">
                      <source src={t.preview_url} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <select
            className="w-full rounded p-2 bg-zinc-800 text-white"
            value={selectedPlaylist}
            onChange={e => setSelectedPlaylist(e.target.value)}
          >
            <option value="">-- choose playlist --</option>
            {playlists.map(p => (
              <option key={p.id} value={p.name}> {p.name} </option>
            ))}
          </select>

          <Button onClick={handleAddToPlaylist} className="w-full">➕ Add to Spotify</Button>
        </div>
      </Modal>

      {snackbar && <Snackbar message={snackbar} onClose={() => setSnackbar('')} />}
    </div>
  );
}
