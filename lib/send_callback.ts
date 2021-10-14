import { DefaultContext } from './context';

/**
 * Type of a function specifying how a JSON-RPC packet may be sent.
 * @remarks May optionally accept a `Context` provided prior by the user.
 */
export type SendCallback<Context = DefaultContext> = (packet: string, context: Context) => Promise<unknown> | unknown;
