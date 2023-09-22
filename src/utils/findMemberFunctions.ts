import {
  QueryCommandInput,
  QueryCommandOutput,
  QueryCommand,
  ScanCommandInput,
  ScanCommand,
  GetCommand,
  GetCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getUserByUUID } from "../services/getUserByuuid-service";
const dynamo = new DynamoDBClient({ region: "ca-central-1" });
export async function queryTable(
  params: QueryCommandInput
): Promise<EligibilityRecord[]> {
  let response: QueryCommandOutput;

  let foundItems: Record<string, any>[] = [];

  const queryCommand = new QueryCommand(params);

  do {
    response = await dynamo.send(queryCommand);

    if (response.Items != undefined) {
      foundItems = foundItems.concat([...response.Items]);
    }

    params.ExclusiveStartKey = response.LastEvaluatedKey;
  } while (response.LastEvaluatedKey != undefined);

  return foundItems;
}

export async function findMemberByIDandPolicy(
  memberID: string,
  policyNumber: string,
  isDependant?: boolean
) {
  const params: QueryCommandInput = {
    TableName:
      (isDependant ? process.env.CRecordsTable : process.env.ERecordsTable) ||
      "",
    IndexName: "policyAndMemberID",
    KeyConditionExpression:
      "policyNumber = :policyNumber and memberID = :memberID",
    ExpressionAttributeValues: {
      ":policyNumber": policyNumber,
      ":memberID": memberID,
    },
  };

  return await queryTable(params);
}

export async function findBaseUser(memberID: string, policyNumber: string) {
  console.log(
    "finding base member with memberID:" +
      memberID +
      " and policyID:" +
      policyNumber
  );

  let response: QueryCommandOutput;

  let foundItems: Record<string, any>[] = [];

  const params: QueryCommandInput = {
    TableName: process.env.ERecordsTable || "",
    IndexName: "policyAndMemberID",
    KeyConditionExpression:
      "policyNumber = :policyNumber and memberID = :memberID",
    FilterExpression: "version = :version",
    ExpressionAttributeValues: {
      ":policyNumber": policyNumber,
      ":memberID": memberID,
      ":version": 1,
    },
  };

  const queryCommand = new QueryCommand(params);

  do {
    response = await dynamo.send(queryCommand);

    if (response.Items != undefined) {
      foundItems = foundItems.concat([...response.Items]);
    }

    params.ExclusiveStartKey = response.LastEvaluatedKey;
  } while (response.LastEvaluatedKey != undefined && foundItems.length === 0);

  return foundItems[0] || null;
}

export async function findLatestUser(memberID: string, policyNumber: string) {
  console.log(
    "finding base member with memberID:" +
      memberID +
      " and policyID:" +
      policyNumber
  );

  let response: QueryCommandOutput;

  let foundItems: Record<string, any>[] = [];

  const params: QueryCommandInput = {
    TableName: process.env.ERecordsTable || "",
    IndexName: "policyAndMemberID",
    KeyConditionExpression:
      "policyNumber = :policyNumber and memberID = :memberID",
    FilterExpression: "is_current = :is_current",
    ExpressionAttributeValues: {
      ":policyNumber": policyNumber,
      ":memberID": memberID,
      ":is_current": true,
    },
  };

  const queryCommand = new QueryCommand(params);

  do {
    response = await dynamo.send(queryCommand);

    if (response.Items != undefined) {
      foundItems = foundItems.concat([...response.Items]);
    }

    params.ExclusiveStartKey = response.LastEvaluatedKey;
  } while (response.LastEvaluatedKey != undefined && foundItems.length === 0);

  return foundItems[0] || null;
}

export async function findByPolicyNumber(policyNumber: string, limit = 1000) {
  //the view that needs this doesnt need intermediate versions
  console.log("finding members by policyNumber:" + policyNumber);
  const params: QueryCommandInput = {
    TableName: process.env.ERecordsTable || "",
    IndexName: "policyAndMemberID",
    KeyConditionExpression: "policyNumber = :policyNumber",
    FilterExpression: "is_current = :is_current or version = :version",
    ExpressionAttributeValues: {
      ":policyNumber": policyNumber,
      ":is_current": true,
      ":version": 1,
    },
  };

  let response: QueryCommandOutput;

  let foundItems: Record<string, any>[] = [];

  const queryCommand = new QueryCommand(params);

  do {
    response = await dynamo.send(queryCommand);

    if (response.Items != undefined) {
      foundItems = foundItems.concat([...response.Items]);
    }

    params.ExclusiveStartKey = response.LastEvaluatedKey;
  } while (response.LastEvaluatedKey != undefined && foundItems.length < limit);

  return foundItems || [];
}

export async function findByClaimID(claimID: string) {
  console.log("finding members by claimID:" + claimID);
  const params: ScanCommandInput = {
    TableName: process.env.ClaimsTable || "",
    FilterExpression: "claimID = :claimID",
    ExpressionAttributeValues: {
      ":claimID": claimID,
    },
  };
  const scanResults = [] as EligibilityRecord[];
  const scanCommand = new ScanCommand(params);
  let items;
  do {
    items = await dynamo.send(scanCommand);
    scanResults.push(...(items.Items ? items.Items : []));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (scanResults.length == 0);

  const claim = scanResults[0] as claimTableObject;

  if (claim) {
    const user = await getUserByUUID(claim.userUUID);
    return user;
  }

  return [];
}

export async function findBySubmissionID(submissionID: string) {
  console.log("finding members by submissionID:" + submissionID);
  const params: GetCommandInput = {
    TableName: process.env.ClaimsTable || "",
    Key: {
      submissionID: submissionID,
    },
  };
  const scanCommand = new GetCommand(params);
  const response = await dynamo.send(scanCommand);
  const claim = response.Item as claimTableObject;

  if (claim) {
    const user = await getUserByUUID(claim.userUUID);
    return user;
  }
  return [];
}
