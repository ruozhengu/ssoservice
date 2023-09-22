import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

const TOTAL_SEGMENTS = 20;

export async function findByMemberID(memberID: string) {
  try {
    const scanSegment = async (segment: number) => {
      const scanResults = [] as EligibilityRecord[];
      const params: ScanCommandInput = {
        TableName: process.env.ERecordsTable || "",
        //the view that needs this doesnt need intermediate versions
        FilterExpression:
          "memberID = :memberID and (is_current = :is_current or version = :version)",
        ExpressionAttributeValues: {
          ":memberID": memberID,
          ":is_current": true,
          ":version": 1,
        },
        Segment: segment,
        TotalSegments: TOTAL_SEGMENTS,
      };
      const scanCommand = new ScanCommand(params);
      let items;
      do {
        items = await dynamo.send(scanCommand);
        scanResults.push(...(items.Items ? items.Items : []));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (items.LastEvaluatedKey !== undefined);
      return scanResults as EligibilityRecord[];
    };

    const allResults = await Promise.all(
      Array(TOTAL_SEGMENTS)
        .fill("")
        .map((_, i) => scanSegment(i))
    );

    return allResults.flat();
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
