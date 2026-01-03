/// <reference path="./.sst/platform/config.d.ts" />

const FUNCTIONS_DIR = "functions/api/src/routes/";

const handlerPath = (fileName: string) =>
  `${FUNCTIONS_DIR}/${fileName}.handler`;

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
    const guessTable = new sst.aws.Dynamo("GuessTable", {
      fields: {
        guessId: "string",
        playerId: "string",
      },
      primaryIndex: { hashKey: "playerId", rangeKey: "guessId" },
    });

    const api = new sst.aws.ApiGatewayV2("API", {
      link: [guessTable],
    });

    api.route("GET /guesses", {
      handler: handlerPath("guesses.get"),
    });

    api.route("POST /guesses", {
      handler: handlerPath("guesses.post"),
    });

    api.route("POST /guesses/resolve", {
      handler: handlerPath("guesses.resolve.post"),
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
