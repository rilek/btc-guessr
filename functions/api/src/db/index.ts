import { type AttributeAction, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { PlayerSchema } from "./schema";
import type { Player } from "./types";

const client = new DynamoDBClient();
const docClient = DynamoDBDocument.from(client);
const PlayerTableName = Resource.PlayersTable.name;

export const getPlayer = async (playerId: string) => {
  const userGet = await docClient.get({
    TableName: PlayerTableName,
    Key: {
      playerId: playerId,
    },
  });

  return userGet.Item as Player | null;
};

export const createPlayer = async () => {
  const playerId = crypto.randomUUID();
  await docClient.put({
    TableName: PlayerTableName,
    Item: PlayerSchema.parse({ playerId, createdAt: new Date().toISOString() }),
  });
  return playerId;
};

export const updatePlayer = async (update: Partial<Player>) => {
  const output = await docClient.update({
    TableName: PlayerTableName,
    Key: { playerId: update.playerId },
    AttributeUpdates: Object.entries(update).reduce(
      (acc, [key, value]) => {
        if (key !== "playerId")
          acc[key] = {
            Action: "PUT",
            Value: value,
          };
        return acc;
      },
      {} as Record<string, { Action: AttributeAction; Value: unknown }>,
    ),
  });

  return output.Attributes as Player;
};
