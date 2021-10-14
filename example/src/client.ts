import WebSocket from 'ws';
import * as JsonRpc from 'duplex-json-rpc';

const client = new JsonRpc.Client<WebSocket>((packet, context) => context.send(packet));

const ws = new WebSocket('ws://example.com/endpoint');
ws.on('message', (message) => void client.onResponsePacket(message.toString()));
ws.on('open', () => {
  (async () => {
    try {
      const user = await client.call('getUser', { id: '5' }, ws);
      console.log(user);
    } catch (err) {
      if (err instanceof JsonRpc.HandledError && err.codeField === 404) {
        console.log('User does not exist.');
      }
    }
  })().catch(console.error);
});
