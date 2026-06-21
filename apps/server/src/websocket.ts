import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { WsEvent } from "./types.js";

export class RealtimeHub {
  private wss?: WebSocketServer;

  attach(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
  }

  broadcast(event: WsEvent) {
    const message = JSON.stringify(event);

    this.wss?.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
