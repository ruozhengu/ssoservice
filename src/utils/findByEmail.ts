import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { getUserByUUID } from "../services/getUserByuuid-service";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({
  region: "ca-central-1",
  credentials: {
    accessKeyId: "ASIA6EBR5AWURXWOYMBS",
    secretAccessKey: "HDKhHqKfdoN41Ac8rng5e8Jy7FWoR0hfF+RDuwno",
    sessionToken:
      "IQoJb3JpZ2luX2VjECQaDGNhLWNlbnRyYWwtMSJIMEYCIQCQg7ohfWTIjdglIKnPLOucMKR6bqGwykNYT7UG+MghFAIhAIcTavLFTEc7xhb8rx7OiaI80pC4DY7epZVlouzbRC83KpMDCB0QARoMOTcwNzY3MjcxMzM3Igz6KfnKGxs5Y9pjfrYq8AJHXiXtQZXp/3+kXYN4sBXORxNYwt33FiniQggNkXFytamUmjkRcx/S/dSTn6d5niQu4l1H2MEbDccqG3fOqNc5K6wVogvUPYV0M1BIglT5Zlgadicil4FcJambf6qf8E3wOknA711K02wTk77iPtLUsZ2t1HevtaVMzAoiBDrNE0fR8SyMxZBh6w0KoZ3hjUuRiygJeyGan11vK5jqnF3/xpLFAH+FCn2G4U1haA177EP7bWxciAxEfnh4u/Pj22cIajxkICV0jP6ZMB/4SAQztdG1qC+pK0gA0Rbq3Gtl1twZos9L/9VzjqEbfCnZX6C6df8GK9iSalxi9UaidCQvWa0AeGCD28DglXXMdg7/+35zsUPQJY1RODW+AfFGZgS6TS4AKXiS0aHocg0zv0FXcztaMYvnmfFz++Wv6308UXq2ZHL1byAl3w8SCFTO7e/hGt2vP5OLrluUEkrz2A8TVEbRM+EDqBuTMZdcShKZ4jD77beoBjqlAZsYgrIT/ENdr6JY70xPXWk4V9lzeCdi6wYcc0r/DLCfRqc3r+/V7j7YRwAY/nMYzVD+zanR/w8t02XYU/ImNIMTfUtLPq0U+PYXTXdDFcmfyy+8FaIhqpUIMqvwbfqICP4hZyk6ztOuwx65ECfhTFxAaf0EogHL4vE/tTozXNyKsT5Gy83ojTbhr/YxyiOmLPEmDbPtKsHUZsTeEgyE/fK7tA9Tnw==",
  },
});
const TOTAL_SEGMENTS = 5;

export async function findByEmail(email: string) {
  try {
    const scanSegment = async (segment: number) => {
      const scanResults = [] as EligibilityRecord[];
      const params: ScanCommandInput = {
        TableName: process.env.ERecordsTable || "",
        FilterExpression: `email = :email`,
        ExpressionAttributeValues: {
          ":email": email,
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
      } while (items.LastEvaluatedKey !== undefined && scanResults.length == 0);
      return scanResults as EligibilityRecord[];
    };

    //only resolve if there is a result, so if one resolves we can finish
    const rejectIfEmpty = async (segment: number) => {
      return new Promise((resolve, reject) => {
        scanSegment(segment).then((res) => {
          if (res && res.length) {
            resolve(res);
          } else {
            reject();
          }
        });
      });
    };

    const promises = Array(TOTAL_SEGMENTS)
      .fill("")
      .map((_, i) => rejectIfEmpty(i));

    const results = (await Promise.any(promises)) as (
      | EligibilityRecord[]
      | undefined
    )[];

    let result = [] as EligibilityRecord[];

    for (const segmentResult of results) {
      if (segmentResult) {
        result = result.concat(segmentResult);
      }
    }
    if (result.length) {
      //we still need to get the latest version of this member
      const members = await getUserByUUID(result[0].uuid || "");
      return members;
    }
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
