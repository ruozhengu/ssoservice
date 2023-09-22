import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { updateClaim } from "../services/updateClaim-service";
import {
  handleError,
  responseWrapper,
  validateRequiredParameters,
} from "../utils/apiWrapper";
import { claimStatusValues, claimTypeValues } from "../types/mappings";
import { NotFoundError } from "../types/NotFoundError";
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
    if (!event.body) {
      return handleError(
        new Error(`Missing request body.`),
        `Missing request body.`
      );
    }
    const body = JSON.parse(event.body);

    // Validates parameters
    const validate = validateRequiredParameters(["submissionID"], body);
    if (validate.error) return validate.error;
    if (!claimStatusValues.includes(body.status) && body.status) {
      return handleError(
        new Error(`Invalid status: ${body.status}`),
        `Invalid status: ${body.status}`
      );
    }
    if (!claimTypeValues.includes(body.type) && body.type) {
      return handleError(
        new Error(`Invalid type: ${body.type}`),
        `Invalid type: ${body.type}`
      );
    }

    // Creates claim
    const res: number = await updateClaim(body);

    return responseWrapper(res, 201);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return responseWrapper({}, 404, err.message);
    }
    console.error(err);
    return handleError(err, "Internal Server Error", 500);
  }
};
