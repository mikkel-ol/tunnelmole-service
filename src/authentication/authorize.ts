import HostipWebSocket from "../websocket/host-ip-websocket";
import InitialiseMessage from "../messages/initialise-message";
import InvalidSubscriptionMessage from "../messages/invalid-subscription-message";
import config from "../../config";

const authorize = async (apiKey: string, websocket: HostipWebSocket): Promise<boolean> => {
  if (apiKey !== config.apiKey) {
    const invalidSubscriptionMessage: InvalidSubscriptionMessage = {
      type: "invalidSubscription",
      apiKey: apiKey,
    };

    websocket.sendMessage(invalidSubscriptionMessage);
    websocket.close();
    return false;
  }

  return true;
};

export { authorize };
