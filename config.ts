const config = {
  server: {
    httpPort: Number(process.env.HTTP_PORT) || 3000,
    websocketPort: Number(process.env.WEBSOCKET_PORT) || 3001,
    domain: process.env.DOMAIN || "localhost",
    password: process.env.PASSWORD || "changeme",
    bannedIps: [] as string[],
    bannedClientIds: [] as string[],
    bannedHostnames: [] as string[],
  },

  apiKey: process.env.API_KEY ?? "changeme",

  mysql: {
    host: process.env.MYSQL_HOST ?? "localhost",
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "changeme",
    database: process.env.MYSQL_DATABASE ?? "tunnelmole",
  },

  runtime: {
    debug: true,
    enableLogging: false,
    connectionTimeout: 43200,
    timeoutCheckFrequency: 5000,
  },
} as const;

export default config;
