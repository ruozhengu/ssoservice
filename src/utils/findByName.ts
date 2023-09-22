import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { getUserByUUID } from "../services/getUserByuuid-service";

const dynamo = new DynamoDBClient({
  region: "ca-central-1",
  credentials: {
    accessKeyId: "ASIA6EBR5AWURXWOYMBS",
    secretAccessKey: "HDKhHqKfdoN41Ac8rng5e8Jy7FWoR0hfF+RDuwno",
    sessionToken:
      "IQoJb3JpZ2luX2VjECQaDGNhLWNlbnRyYWwtMSJIMEYCIQCQg7ohfWTIjdglIKnPLOucMKR6bqGwykNYT7UG+MghFAIhAIcTavLFTEc7xhb8rx7OiaI80pC4DY7epZVlouzbRC83KpMDCB0QARoMOTcwNzY3MjcxMzM3Igz6KfnKGxs5Y9pjfrYq8AJHXiXtQZXp/3+kXYN4sBXORxNYwt33FiniQggNkXFytamUmjkRcx/S/dSTn6d5niQu4l1H2MEbDccqG3fOqNc5K6wVogvUPYV0M1BIglT5Zlgadicil4FcJambf6qf8E3wOknA711K02wTk77iPtLUsZ2t1HevtaVMzAoiBDrNE0fR8SyMxZBh6w0KoZ3hjUuRiygJeyGan11vK5jqnF3/xpLFAH+FCn2G4U1haA177EP7bWxciAxEfnh4u/Pj22cIajxkICV0jP6ZMB/4SAQztdG1qC+pK0gA0Rbq3Gtl1twZos9L/9VzjqEbfCnZX6C6df8GK9iSalxi9UaidCQvWa0AeGCD28DglXXMdg7/+35zsUPQJY1RODW+AfFGZgS6TS4AKXiS0aHocg0zv0FXcztaMYvnmfFz++Wv6308UXq2ZHL1byAl3w8SCFTO7e/hGt2vP5OLrluUEkrz2A8TVEbRM+EDqBuTMZdcShKZ4jD77beoBjqlAZsYgrIT/ENdr6JY70xPXWk4V9lzeCdi6wYcc0r/DLCfRqc3r+/V7j7YRwAY/nMYzVD+zanR/w8t02XYU/ImNIMTfUtLPq0U+PYXTXdDFcmfyy+8FaIhqpUIMqvwbfqICP4hZyk6ztOuwx65ECfhTFxAaf0EogHL4vE/tTozXNyKsT5Gy83ojTbhr/YxyiOmLPEmDbPtKsHUZsTeEgyE/fK7tA9Tnw==",
  },
});
const TOTAL_SEGMENTS = 1;

/**
 * Finds records based on a query string.
 *
 * @param queryValue - A string containing key-value pairs for filtering.
 * @returns An array of eligibility records.
 */
export async function findByName(queryValue: string) {
  console.log(queryValue);
  // try {
  const { firstname, lastname } = queryValue.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=").map((str) => str.trim());
    if (key === "firstname" || key === "lastname") {
      acc[key] = value;
    }
    console.log(key, acc);
    return acc;
  }, {} as { firstname?: string; lastname?: string });

  if (!firstname && !lastname) {
    throw new Error(
      "InvalidQuery: At least one of firstname or lastname must be provided."
    );
  }
  console.log(firstname, lastname);
  // Construct search query
  const filterExpression: string[] = [];
  const expressionAttributeValues: Record<string, string> = {};
  if (firstname) {
    filterExpression.push("firstName = :firstName");
    expressionAttributeValues[":firstName"] = firstname;
  }
  if (lastname) {
    filterExpression.push("familyName = :familyName");
    expressionAttributeValues[":familyName"] = lastname;
  }
  console.log(
    "yeee",
    filterExpression.join(" AND "),
    expressionAttributeValues,
    process.env.ERecordsTable
  );
  const scanSegment = async (segment: number) => {
    const scanResults = [] as EligibilityRecord[];
    const params: any = {
      TableName: "ppr-e-records-dynamo-dev2" || "",
      FilterExpression: `email = :email`,
      ExpressionAttributeValues: {
        ":email": "123",
      },
      Segment: segment,
      TotalSegments: TOTAL_SEGMENTS,
    };

    let lastEvaluatedKey;
    // try {
    do {
      console.log(
        "---------",

        segment,
        TOTAL_SEGMENTS
      );
      const items = await dynamo.send(new ScanCommand(params));
      console.log("---------", items.LastEvaluatedKey, segment, TOTAL_SEGMENTS);
      if (items.Items) {
        scanResults.push(...items.Items);
      }
      lastEvaluatedKey = items.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    } while (lastEvaluatedKey);
    // } catch (scanError) {
    //   console.error("FindByName ScanError:", scanError);
    //   throw new Error("Failed to scan segment");
    // }

    return scanResults as EligibilityRecord[];
  };

  const promises = Array(TOTAL_SEGMENTS)
    .fill("")
    .map((_, i) => scanSegment(i));
  const results = await Promise.all(promises);

  const combinedResults = [] as EligibilityRecord[];
  results.forEach((segmentResult) => combinedResults.push(...segmentResult));

  if (combinedResults.length) {
    try {
      const members = await Promise.all(
        combinedResults.map((record) => getUserByUUID(record.uuid || ""))
      );
      return members.flat();
    } catch (uuidError) {
      console.error("UUIDError:", uuidError);
      throw new Error("Failed to retrieve user by UUID");
    }
  }
  return [];
  // } catch (error) {
  //   console.error("GeneralError:", error);
  //   throw error;
  // }
}
