/**
 * Websocket message handlers for different message types
 * Like app.ts for express, but with handlers for different message types instead of URLs
 */
import initialise from "./src/message-handlers/initialise";

const messageHandlers: Record<string, any> = {
  initialise,
};

export { messageHandlers };
