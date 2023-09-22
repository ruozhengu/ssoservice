import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getQueryParams,
  handleError,
  responseWrapper,
  validateRequiredParameters,
} from "../utils/apiWrapper";
import { NotFoundError } from "../types/NotFoundError";
import { listDependantsPerMember } from "../services/listDependantsPerMember-service";
import { getUserByUUID } from "../services/getUserByuuid-service";
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

    // Validates parameters
    const validate = validateRequiredParameters(["userUUID"], query);
    if (validate.error) return validate.error;

    // Creates claim
    const baseUser = (await getUserByUUID(query.uuid))[0];
    if (!baseUser) {
      return handleError(null, "No User Found", 400);
    }
    const res = await listDependantsPerMember(
      baseUser.memberID || "",
      baseUser.policyNumber || ""
    );

    return responseWrapper(res, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return responseWrapper({}, 404, err.message);
    }
    console.error(err);
    return handleError(err, "Internal Server Error", 500);
  }
};
