import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getQueryParams,
  handleError,
  responseWrapper,
  validateRequiredParameters,
} from "../utils/apiWrapper";
import { NotFoundError } from "../types/NotFoundError";
import { getUserByUUID } from "../services/getUserByuuid-service";
import { listDependantsPerMember } from "../services/listDependantsPerMember-service";
import { listClaimsPerMember } from "../services/listClaimsPerMember-service";
import { getBankingInfo } from "../services/getBankingInfo-service";
import { introspectToken } from "../services/introspectToken-service";

// Initialize DynamoDB and S3 Connection
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const sessionToken =
      event.headers["x-session-token"] ||
      event.headers["X-Session-Token"] ||
      "";
    if (!sessionToken) {
      return handleError(
        new Error(`Invalid session token`),
        `Invalid session token`,
        418
      );
    }
    let valid: { data: { active: boolean } };
    try {
      valid = await introspectToken(sessionToken);
    } catch (e) {
      return handleError(
        null,
        "There is an issue with the authentication. You will not see any data. Please try again later or clear your cache and try again.",
        400
      );
    }

    if (!valid.data.active) {
      return handleError(
        new Error(`Invalid session token`),
        `Invalid session token`,
        418
      );
    }
    const query = getQueryParams(event);
    console.log(query);
    // Validates parameters
    const validate = validateRequiredParameters(["userUUID"], query);
    if (validate.error) return validate.error;

    // Creates claim
    const memberVersions = await getUserByUUID(query.userUUID);
    if (!memberVersions) {
      return handleError({}, "No User Found", 404);
    }
    let dependants: DependentRecord[];
    try {
      dependants = await listDependantsPerMember(
        memberVersions.at(-1)?.memberID || "",
        memberVersions.at(-1)?.policyNumber || ""
      );
    } catch (e) {
      dependants = [];
    }
    let claims: claimTableObject[];
    try {
      claims = await listClaimsPerMember(query.userUUID);
    } catch (e) {
      claims = [];
    }
    let bankingInfo: bankingInfoTableObject;
    try {
      bankingInfo = await getBankingInfo(query.userUUID);
    } catch (e) {
      bankingInfo = {
        accountNumber: "",
        bankName: "",
        institutionNumber: "",
        memberID: "",
        transitNumber: "",
      };
    }
    return responseWrapper(
      {
        member: memberVersions,
        dependants,
        claims,
        bankingInfo,
      },
      200
    );
  } catch (err) {
    if (err instanceof NotFoundError) {
      return responseWrapper({}, 404, err.message);
    }
    console.error(err);
    return handleError(err, "Internal Server Error", 500);
  }
};
