import config from "../../config";

export default function log(message: string, level: "info" | "warning" | "error" = "info") {
  switch (level) {
    case "info":
      if (config.runtime.debug) {
        console.info(message);
      }
      break;
    case "warning":
      console.warn(message);
      break;
    case "error":
      console.error(message);
      break;
    default:
      console.info(message);
      break;
  }
}
