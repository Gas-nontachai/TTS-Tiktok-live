# TikTok Live Comment TTS MVP

Local web app for connecting to a TikTok Live room, showing real-time comments, and reading them aloud with the browser `speechSynthesis` API.

## Requirements

- Node.js and npm available on PATH
- Python 3.10+ for Local Thai TTS

## Install

```bash
npm install
```

## Local Thai TTS Setup

The app defaults to browser TTS. Keep it on `browser` until the Local Thai check passes.

1. Install Python dependencies in the Python environment you want the app to use:

```bash
pip install torch cached-path librosa transformers f5-tts soundfile git+https://github.com/biodatlab/thonburian-tts.git
```

2. Open the TTS page and set:

- Engine: `local-thai`
- Thai model: `thonburian` first, then try `jaitts-f5tts` after the default model works
- Python path: the full path to the Python executable if `python` is not on PATH
- Reference WAV path: a readable local `.wav` file
- Reference text: the exact spoken text in the reference WAV

3. Click `Check Local Thai TTS`.

The check verifies the Python path, required Python modules, reference WAV readability, and reference text. It does not download the model or generate speech. The first real test can still take longer while the model cache warms up. Speech generation is stopped after 180 seconds if Python hangs.

## Development

```bash
npm run dev
```

If system Node/npm is not on PATH, use the included Windows helper:

```bat
start-dev.cmd
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

## Scripts

```bash
npm run dev
npm run dev:server
npm run dev:web
npm run build
npm run start
```
