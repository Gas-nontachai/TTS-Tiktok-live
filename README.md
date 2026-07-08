# TikTok Live Comment TTS MVP

Local web app for connecting to a TikTok Live room, showing real-time comments, and reading them aloud with server-generated AI Thai voices.

## Requirements

- Node.js and npm available on PATH
- Python 3.10+ for AI Thai TTS when running without Docker

## Install

```bash
npm install
```

## AI Thai TTS Setup

The app uses server-generated AI Thai TTS by default so the voice stays the same on macOS and Windows.

1. Install Python dependencies in the Python environment you want the app to use:

```bash
pip install edge-tts
```

2. Open the TTS page and set:

- Voice: `th-TH-PremwadeeNeural` or `th-TH-NiwatNeural`

3. Click `Check AI Thai TTS`.

AI Thai TTS uses ready-made neural Thai voices and does not use OS/browser voices. It sends the text to Microsoft Edge TTS to generate MP3 audio. Speech generation is stopped after 180 seconds if Python hangs.

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

## Docker Development

Use Docker when you want the same Node/Python runtime on macOS and Windows.

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

The compose setup keeps `node_modules` and `apps/server/data` inside Docker volumes, so host OS differences do not leak into the app.

Docker installs AI Thai TTS by default for the backend service and uses the container Python runtime.

To reset persisted Docker config/uploads:

```bash
docker compose down -v
```

## Scripts

```bash
npm run dev
npm run dev:server
npm run dev:web
npm run build
npm run start
```
