/// <reference path="./.sst/platform/config.d.ts" />

const FUNCTIONS_DIR = "functions/api/src/routes/";

export default $config({
  app(input) {
    return {
      name: "btc-guessr",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const playerTable = new sst.aws.Dynamo("PlayerTable", {
      fields: {
        playerId: "string",
      },
      primaryIndex: { hashKey: "playerId" },
    });

    const api = new sst.aws.ApiGatewayV2("API", {
      link: [playerTable],
    });

    api.route("GET /players/{id}", {
      handler: handlerPath("players.get"),
    });

    api.route("POST /players", {
      handler: handlerPath("players.post"),
    });

    api.route("GET /ticker", {
      handler: handlerPath("ticker.get"),
    });

    api.route("POST /guess", {
      handler: handlerPath("guess.post"),
    });

    api.route("POST /guess/resolve", {
      handler: handlerPath("guess.resolve.post"),
    });

    new sst.aws.React("Frontend", {
      path: "apps/frontend",
      link: [api],
    });
  },
});

const handlerPath = (fileName: string) => `${FUNCTIONS_DIR}${fileName}.handler`;
