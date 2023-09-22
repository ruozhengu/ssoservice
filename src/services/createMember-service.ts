import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { getUserByUUID } from "./getUserByuuid-service";
import { v4 as generateUUID } from "uuid";
import { log } from "../utils/functions";
import { findMembers } from "./findMembers-service";
import { saveUser } from "./saveUser-service";
import { findMemberByIDandPolicy } from "../utils/findMemberFunctions";

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

export async function createMember(
  member: EligibilityRecord,
  createdBy: string
): Promise<number> {
  const requiredFields = [
    "memberID",
    "policyNumber",
  ] as (keyof EligibilityRecord)[];

  requiredFields.forEach((field) => {
    if (!member[field]) {
      throw Error(field + " is missing.");
    }
  });

  let version = 1;
  let memberID = member.memberID?.replace(/^[a-zA-Z0]+/, "") || "";
  let policyNumber = member.policyNumber?.replace(/^[a-zA-Z0]+/, "") || "";
  let latestExistingUser: EligibilityRecord | null = null;
  if (member.uuid) {
    log(
      "User " +
        createdBy +
        " is editing member with memberID: " +
        memberID +
        " and policyNumber: " +
        policyNumber
    );
    const res = await getUserByUUID(member.uuid);
    const existingMembers = res.sort(
      (a, b) => (b.version || 0) - (a.version || 0)
    );
    if (existingMembers.length) {
      version = (existingMembers[0].version || 0) + 1;
      memberID = existingMembers[0].memberID || "member_ID_missing";
      policyNumber = existingMembers[0].policyNumber || "member_ID_missing";
      latestExistingUser = existingMembers[0];
    } else {
      throw Error("There is an issue with editing a member.");
    }
  } else {
    const members = await findMemberByIDandPolicy(
      member.memberID || "",
      policyNumber
    );
    if (members.length) {
      throw Error(
        "Member with the memberID and policy number specified already exists."
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
    const item: EligibilityRecord = {
      version: version,
      is_current: true,
      uuid: member.uuid || generatedID,
      header: member.header,
      operation: member.operation,
      recordType: member.recordType,
      memberID: memberID,
      familyName: member.familyName,
      firstName: member.firstName,
      addressFirstLine: member.addressFirstLine,
      addressCity: member.addressCity,
      addressSecondLine: member.addressSecondLine,
      stateProvinceCountry: member.stateProvinceCountry,
      postalCode: member.postalCode,
      sex: member.sex,
      language: member.language,
      dateOfBirth: member.dateOfBirth,
      sunLifeNumber: member.sunLifeNumber,
      payrollNumber: member.payrollNumber,
      policyNumber: policyNumber,
      employmentDate: member.employmentDate,
      filler2: member.filler2,
      dateOfDeath: member.dateOfDeath,
      dentalCoverageEffectiveDate: member.dentalCoverageEffectiveDate,
      dentalCoverageTerminationDate: member.dentalCoverageTerminationDate,
      dentalBillingGroup: member.dentalBillingGroup,
      dentalRateGroup: member.dentalRateGroup,
      dentalExperienceGroup: member.dentalExperienceGroup,
      dentalPlanNumber: member.dentalPlanNumber,
      dependentDentalCoverageEffectiveDate:
        member.dependentDentalCoverageEffectiveDate,
      dependentDentalBillingGroup: member.dependentDentalBillingGroup,
      dependentDentalRateGroup: member.dependentDentalRateGroup,
      dependentDentalExperienceGroup: member.dependentDentalExperienceGroup,
      dependentDentalCoverageTerminationDate:
        member.dependentDentalCoverageTerminationDate,
      dependentDentalPlanNumber: member.dependentDentalPlanNumber,
      medicalPSACoverageEffectiveDate: member.medicalPSACoverageEffectiveDate,
      medicalPSACoverageTerminationDate:
        member.medicalPSACoverageTerminationDate,
      medicalPSABillingGroup: member.medicalPSABillingGroup,
      medicalPSARateGroup: member.medicalPSARateGroup,
      medicalPSAExperienceGroup: member.medicalPSAExperienceGroup,
      medicalPSAPlanNumber: member.medicalPSAPlanNumber,
      dependentMedicalCoverageEffectiveDate:
        member.dependentMedicalCoverageEffectiveDate,
      dependentMedicalCoverageTerminationDate:
        member.dependentMedicalCoverageTerminationDate,
      dependentMedicalBillingGroup: member.dependentMedicalBillingGroup,
      dependentMedicalRateGroup: member.dependentMedicalRateGroup,
      dependentMedicalExperienceGroup: member.dependentMedicalExperienceGroup,
      dependentMedicalPlanNumber: member.dependentMedicalPlanNumber,
      specialInfo: member.specialInfo,
      hsaOrPsaDate: member.hsaOrPsaDate,
      hsaOrPsaUpdateType: member.hsaOrPsaUpdateType,
      hsaOrPsaAmount: member.hsaOrPsaAmount,
      lateEntrantCode: member.lateEntrantCode,
      dentalCOBIndicator: member.dentalCOBIndicator,
      medicalCOBIndicator: member.medicalCOBIndicator,
      dentalHSAAmount: member.dentalHSAAmount,
      filler3: member.filler3,
      endOfFileCode: member.endOfFileCode,
      email: member.email,
      manuallyCreatedBy: createdBy,
      lastSeen: new Date().toISOString(),
    };

    if (latestExistingUser) {
      latestExistingUser.is_current = false;
      await saveUser(latestExistingUser);
    }

    const params: PutCommandInput = {
      TableName: process.env.ERecordsTable || "",
      Item: item,
    };

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
