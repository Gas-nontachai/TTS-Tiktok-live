# TikTok Live Comment TTS MVP

Local web app for connecting to a TikTok Live room, showing real-time comments, and reading them aloud with the browser `speechSynthesis` API.

## Requirements

- Node.js and npm available on PATH

## Install

```bash
npm install
```

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
