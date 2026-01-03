/// <reference path="./.sst/platform/config.d.ts" />

const FUNCTIONS_DIR = "functions/api/src/routes";

const handlerPath = (fileName: string) =>
  `${FUNCTIONS_DIR}/${fileName}.handler`;

export default $config({
  app(input) {
    return {
      name: "btc-guessr",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-1",
        },
      },
    };
  },
  async run() {
    const playersTable = new sst.aws.Dynamo("PlayersTable", {
      fields: { playerId: "string" },
      primaryIndex: { hashKey: "playerId" },
    });

    const api = new sst.aws.ApiGatewayV2("Api", {
      link: [playersTable],
    });

    api.route("POST /players", {
      handler: handlerPath("players.post"),
    });

    api.route("GET /players/{playerId}", {
      handler: handlerPath("players.get"),
    });

    api.route("POST /players/{playerId}/guess", {
      handler: handlerPath("players.guess.post"),
    });

    api.route("POST /players/{playerId}/guess/resolve", {
      handler: handlerPath("players.guess.resolve.post"),
    });

    api.route("GET /ticker", {
      handler: handlerPath("ticker.get"),
    });

    new sst.aws.StaticSite("Frontend", {
      path: "apps/frontend",
      build: {
        command: "pnpm build",
        output: "apps/frontend/dist",
      },
      environment: {
        VITE_API_URL: api.url,
      },
    });
  },
});
