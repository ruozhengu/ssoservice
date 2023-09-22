import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Initialize DynamoDB and S3 Connection
const s3 = new S3Client({ region: "ca-central-1" });
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function uploadEOBFile(
  s3Key: string,
  submissionID: string,
  eobFile: Buffer
): Promise<string> {
  // Upload to S3
  try {
    const command: PutObjectCommand = new PutObjectCommand({
      Bucket: process.env.eobBucket,
      Key: s3Key,
      Body: eobFile,
    });
    await s3.send(command);
    console.log("Successfully uploaded to S3");
  } catch (err) {
    console.error("Error uploading to S3:", err);
    return "Error uploading to S3";
  }

  // Update Claim in Dynamo
  try {
    const params: UpdateCommandInput = {
      TableName: process.env.ClaimsTable || "",
      Key: {
        submissionID: submissionID,
      },
      UpdateExpression: "SET eobFile = :e",
      ExpressionAttributeValues: {
        ":e": s3Key,
      },
    };

    const updateCommand = new UpdateCommand(params);
    const res = await dynamo.send(updateCommand);
    console.log(res);
    console.log("Successfully updated item in DynamoDB.");
    return "Success";
  } catch (err) {
    if ((err as Error).name == "ResourceNotFoundException") {
      console.log(`Submission ID ${submissionID} was not found.`);
      throw new Error(`Submission ID ${submissionID} was not found.`);
    } else {
      console.error("Error updating item in DynamoDB:", err);
      throw new Error(`Error updating item in DynamoDB`);
    }
  }
}
