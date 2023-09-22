import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function getBankingInfo(userUUID: string) {
  try {
    const params: GetCommandInput = {
      TableName: process.env.BankingInfoTable || "",
      Key: {
        memberID: userUUID,
      },
    };

    const getCommand = new GetCommand(params);
    const res = await dynamo.send(getCommand);
    const bankingInfo: bankingInfoTableObject =
      res.Item as bankingInfoTableObject;
    console.log(bankingInfo);
    return bankingInfo;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
