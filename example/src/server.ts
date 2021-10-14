import WebSocket from 'ws';
import * as JsonRpc from 'duplex-json-rpc';

import callHandler from './call_handler';

const server = new JsonRpc.Server<WebSocket>(callHandler, (packet, context) => {
  context.send(packet);
});

const wss = new WebSocket.Server({
  port: 8080,
});
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Use connection to this specific client as a context.
    server.onRequestPacket(message.toString(), ws).catch(console.error);
  });
});
