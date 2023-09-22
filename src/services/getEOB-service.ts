import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  GetObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { PassThrough, Readable } from "stream";

// Initialize DynamoDB and S3 Connection
const s3 = new S3Client({ region: "ca-central-1" });
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function getEOBFile(claimUUID: string): Promise<string> {
  try {
    const params: GetCommandInput = {
      TableName: process.env.ClaimsTable || "",
      Key: {
        submissionID: claimUUID,
      },
    };

    const getCommand = new GetCommand(params);
    const res = await dynamo.send(getCommand);
    console.log(res);
    if (!res.Item) {
      throw new Error("Claim not found by ID");
    }
    const claim: claimTableObject = res.Item as claimTableObject;
    if (!claim.eobFile) {
      throw new Error("Fetched claim does not have a saved EOB File.");
    }
    const s3FetchParams: S3DocumentRequest = {
      s3: s3,
      bucket: process.env.eobBucket || "",
      objectKey: claim.eobFile,
    };
    const eobFile = await getS3Document(s3FetchParams);
    if (!eobFile) {
      throw new Error("Failed to get EOB File from S3 Bucket");
    }
    return eobFile;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}

export type S3DocumentRequest = {
  s3: S3Client;
  bucket: string;
  objectKey: string;
};

export async function getS3Document({
  s3,
  bucket,
  objectKey,
}: S3DocumentRequest): Promise<string | undefined> {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );

    return new Promise((resolve, reject) => {
      const pass = new PassThrough();

      const data: Uint8Array[] = [];

      pass.on("data", (chunk) => data.push(chunk));
      pass.on("end", () => resolve(Buffer.concat(data).toString("base64")));
      pass.on("error", reject);

      (response.Body as Readable).pipe(pass);
    });
  } catch (error: unknown) {
    const typedError = error as Error;
    throw new Error(`Could not retrieve file from S3: ${typedError.message}`);
  }
}
