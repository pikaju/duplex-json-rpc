import WebSocket from 'ws';
import * as JsonRpc from 'duplex-json-rpc';

import callHandler from './call_handler';

const server = new JsonRpc.DuplexServer<WebSocket>(callHandler, (packet, context) => {
  context.send(packet);
});

const wss = new WebSocket.Server({
  port: 8080,
});
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Use connection to this specific client as a context.
    server.onDataPacket(message.toString(), ws).catch(console.error);
    server.call('log', { message: message.toString() }, ws).catch(console.error);
  });
});
