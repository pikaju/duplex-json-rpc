# duplex-json-rpc

Transport layer independent JSON-RPC library with calls in both directions (i.e. the server can perform calls on the client).
See the [example project](./example) for WebSocket usage examples.

## Client usage

```typescript
// Import the package.
import * as JsonRpc from 'duplex-json-rpc';

// Define a custom context type.
type Context = ...;

// Create your client object.
const client = new JsonRpc.Client<Context>((packet, context) => {
    // Define how a string message is sent to the server via
    // your transport layer given a context.
    ...
});

// Perform your JSON RPC call.
const result = await client.call('myMethod', { myParameter: 5 }, myContext);
```

## Server usage

```typescript
// Import the package.
import * as JsonRpc from 'duplex-json-rpc';

// Define a custom context type.
type Context = ...;

// Define your server methods.
const callHandler: JsonRpc.CallHandler<Context> = {
    async myMethod(params, context): Promise<MyResult> {
        // Optionally throw one of duplex-json-rpc's error types.

        // Return your result.
        return ...;
    }
};

// Create your server object.
const server = new JsonRpc.Server<Context>(callHandler, (packet, context) => {
    // Define how a string message is sent in response to a client
    // RPC call via your transport layer. The target client should
    // be part of the context.
    ...
});

...

// Whenever a client packet is received on your transport layer,
// notify the server object.
await server.onRequestPacket(myReceivedMessage.toString(), myContext);
```

## Duplex server usage

```typescript
// Import the package.
import * as JsonRpc from 'duplex-json-rpc';

// Define a custom context type.
type Context = ...;

// Define your server methods.
const callHandler: JsonRpc.CallHandler<Context> = {
    async myMethod(params, context): Promise<MyResult> {
        // Optionally throw one of duplex-json-rpc's error types.

        // Return your result.
        return ...;
    }
};

// Create your server object.
const server = new JsonRpc.DuplexServer<Context>(callHandler, (packet, context) => {
    // Define how a string message is sent in response to a client
    // RPC call via your transport layer. The target client should
    // be part of the context.
    ...
});

...

// Whenever a client packet (which may be a request or a response) is received
// on your transport layer, notify the server object.
await server.onDataPacket(myReceivedMessage.toString(), myContext);

// With a DuplexServer, you can now also perform RPC calls on the client.
await server.call('myMethod', { myParameter: 5 }, myContext);
```