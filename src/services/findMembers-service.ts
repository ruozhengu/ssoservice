import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  findByClaimID,
  findByPolicyNumber,
  findBySubmissionID,
} from "../utils/findMemberFunctions";
import { findByMemberID } from "../utils/findByMemberID";
import { findByEmail } from "../utils/findByEmail";
import { findByName } from "../utils/findByName";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function findMembers(
  queryField: queryFields,
  queryValue?: string,
  limit = Infinity
) {
  console.log(
    "Searching for members using " + queryField + " value: " + queryValue
  );
  if (!queryValue) {
    return [];
  }
  let query = queryValue;
  if (["memberID", "policyNumber"].includes(queryField)) {
    query = queryValue.replace(/^[a-zA-Z0]+/, ""); //remove leading zeroes or letters
  }
  if (
    typeof queryValue === "string" &&
    queryValue.length < 50 &&
    queryField !== "name"
  ) {
    queryValue = queryValue.replaceAll(/[:=<>!]/g, "");
  }

  console.log("---------------------", queryField);
  switch (queryField as queryFields) {
    case "memberID":
      console.log("---------------------1");
      return await findByMemberID(queryValue);
    case "policyNumber":
      console.log("---------------------2");
      return await findByPolicyNumber(queryValue);
    case "email":
      console.log("---------------------3");
      return await findByEmail(queryValue);
    case "submissionID":
      console.log("---------------------4");
      return await findBySubmissionID(queryValue);
    case "claimID":
      console.log("---------------------5");
      return await findByClaimID(queryValue);
    case "name":
      console.log("---------------------");
      return await findByName(queryValue);
  }
}
