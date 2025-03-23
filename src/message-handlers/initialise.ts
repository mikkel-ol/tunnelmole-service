import InitialiseMessage from "../messages/initialise-message";
import HostipWebSocket from "../websocket/host-ip-websocket";
import HostnameAssignedMessage from "../messages/hostname-assigned-message";
import config from "../../config";
import Proxy from "../proxy";
import HostnameAlreadyTakenMessage from "../messages/hostname-already-taken";
import InvalidSubscriptionMessage from "../messages/invalid-subscription-message";
import addClientLog from "../metrics/add-client-log";
import { bannedClientIds } from "../../security/banned-client-ids";
import { INDEX_OF_NOT_FOUND } from "../../constants";
import { bannedIps } from "../../security/banned-ips";
import { bannedHostnames } from "../../security/banned-hostnames";
import { authorize } from "../authentication/authorize";
import { generateSlug } from "random-word-slugs";

const { verify } = require("reverse-dns-lookup");

export default async function initialise(message: InitialiseMessage, websocket: HostipWebSocket) {
  let validSubscription = false;
  if (typeof message.apiKey === "string") {
    validSubscription = await authorize(message.apiKey, websocket);

    if (!validSubscription) {
      const invalidSubscriptionMessage: InvalidSubscriptionMessage = {
        type: "invalidSubscription",
        apiKey: message.apiKey,
      };

      websocket.sendMessage(invalidSubscriptionMessage);
    }
  }

  if (typeof message.apiKey !== "string" && message.subdomain) {
    const invalidSubscriptionMessage: InvalidSubscriptionMessage = {
      type: "invalidSubscription",
      apiKey: null,
    };

    websocket.sendMessage(invalidSubscriptionMessage);
  }

  // By default use a random subdomain unless the subscription is valid and a subdomain is passed
  let subdomain = generateRandomSubdomain(websocket);
  if (validSubscription && typeof message.subdomain === "string") {
    subdomain = message.subdomain;
  }

  const clientId = message.clientId;
  const hostname = subdomain + "." + config.server.domain;

  let isBannedHostname;

  try {
    isBannedHostname = await verify(websocket.ipAddress, ...bannedHostnames);
  } catch (error) {
    // Sometimes hostnames fail to be looked up, ignore this error
    isBannedHostname = false;
  }

  // "Shadow ban" banned client ids and banned ip addresses
  if (
    isBannedHostname ||
    bannedClientIds.indexOf(clientId) !== INDEX_OF_NOT_FOUND ||
    bannedIps.indexOf(websocket.ipAddress) !== INDEX_OF_NOT_FOUND
  ) {
    // Make this service look like its working, when in fact its not
    const fakeHostnameAssignedMessage: HostnameAssignedMessage = {
      type: "hostnameAssigned",
      hostname,
    };

    websocket.sendMessage(fakeHostnameAssignedMessage);

    setTimeout(() => {
      websocket.close();
    }, 43200000);

    return;
  }

  // Add websocket to proxy connections for future web requests to use
  const proxy = Proxy.getInstance();

  // Check for an existing connection for this hostname
  // If there is an existing connection for this hostname and the client id matches the one passed by the client, replace the websocket with the new one
  // if there is an existing connection for this hostname but the client id does not match, send back a hostnameAlreadyTaken message
  const existingConnection = proxy.findConnectionByHostname(hostname);
  if (typeof existingConnection == "undefined") {
    await addClientLog(clientId, "initialized", hostname);
    proxy.addConnection(hostname, websocket, clientId, message.apiKey, websocket.ipAddress);
  } else if (existingConnection.clientId === clientId) {
    // Consider using api key instead to establish subdomain ownership?
    proxy.replaceWebsocket(hostname, websocket);
  } else {
    const hostnameAlreadyTaken: HostnameAlreadyTakenMessage = {
      type: "hostnameAlreadyTaken",
      hostname,
    };

    websocket.sendMessage(hostnameAlreadyTaken);
  }

  const hostnameAssignedMessage: HostnameAssignedMessage = {
    type: "hostnameAssigned",
    hostname,
  };

  websocket.sendMessage(hostnameAssignedMessage);

  console.info("Websocket connection initialised for client id" + message.clientId);
}

const generateRandomSubdomain = (websocket: HostipWebSocket): string => {
  return generateSlug(2);
};
