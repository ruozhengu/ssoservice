import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { v4 as generateUUID } from "uuid";
import { log } from "../utils/functions";
import { listDependantsPerMember } from "./listDependantsPerMember-service";
import { saveDependant } from "./saveDependant-service";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });
const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: true, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: true, // false, by default.
};
const dynamoDoc = DynamoDBDocumentClient.from(dynamo, { marshallOptions });

export async function createDependant(
  member: DependentRecord,
  createdBy: string
): Promise<number> {
  const requiredFields = [
    "memberID",
    "policyNumber",
    "dependentFirstName",
    "dependentDateOfBirth",
  ] as (keyof DependentRecord)[];

  requiredFields.forEach((field) => {
    if (!member[field]) {
      throw Error(field + " is missing.");
    }
  });

  let version = 1;
  let memberID = member.memberID?.replace(/^[a-zA-Z0]+/, "") || "";
  let policyNumber = member.policyNumber?.replace(/^[a-zA-Z0]+/, "") || "";
  let latestExistingUser: DependentRecord | null = null;
  const res = await listDependantsPerMember(
    member.memberID || "",
    member.policyNumber || ""
  );
  if (member.uuid) {
    log(
      "User " +
        createdBy +
        " is editing dependant with memberID: " +
        memberID +
        " and policyNumber: " +
        policyNumber
    );

    const existingDependents = res.sort((a, b) => b.version - a.version);
    if (existingDependents.length) {
      version = (existingDependents[0].version || 0) + 1;
      memberID = existingDependents[0].memberID || "member_ID_missing";
      policyNumber =
        existingDependents[0].policyNumber || "policyNumber_missing";
      latestExistingUser = existingDependents[0];
    } else {
      throw Error("There is an issue with editing a dependent.");
    }
  } else {
    let members = res.filter(
      (x) =>
        x.policyNumber === policyNumber &&
        x.dependentFirstName === member.dependentFirstName
    );
    if (new Set(members.map((x) => x.version)).size !== members.length) {
      //if we have duplicate versions, then we have 2 different people with the same name
      members = members.filter(
        (x) =>
          x.policyNumber === policyNumber &&
          x.dependentDateOfBirth === member.dependentDateOfBirth &&
          x.dependentFirstName === member.dependentFirstName
      );
    }

    if (members.length) {
      throw Error(
        "Member with the memberID, policy number, First name and Date of birth specified already exists."
      );
    }
    log(
      "User " +
        createdBy +
        " is creating a new user with memberID: " +
        memberID +
        " and policyNumber: " +
        policyNumber
    );
  }
  const generatedID = generateUUID();
  try {
    const item: DependentRecord = {
      version: version,
      uuid: member.uuid || generatedID,
      is_current: true,
      header: member.header,
      policyNumber: member.policyNumber,
      memberID: member.memberID,
      dependentFirstName: member.dependentFirstName,
      dependentLastName: member.dependentLastName,
      dependentSex: member.dependentSex,
      dependentRelationship: member.dependentRelationship,
      dependentDateOfBirth: member.dependentDateOfBirth,
      dependentEffectiveDate: member.dependentEffectiveDate,
      dependentTerminationDate: member.dependentTerminationDate,
      studentCode: member.studentCode,
      dependentCoverageInformation: member.dependentCoverageInformation,
      specialInformation: member.specialInformation,
      manuallyCreatedBy: createdBy,
      lastSeen: new Date().toISOString(),
    };
    const params: PutCommandInput = {
      TableName: process.env.CRecordsTable || "",
      Item: item,
    };

    if (latestExistingUser) {
      latestExistingUser.is_current = false;
      await saveDependant(latestExistingUser);
    }

    const putCommand = new PutCommand(params);
    const res = await dynamoDoc.send(putCommand);
    console.log(res);
    if (!res.$metadata.httpStatusCode) {
      throw new Error("Failed to send database call");
    }
    return res.$metadata.httpStatusCode;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
