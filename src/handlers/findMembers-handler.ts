import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { findMembers } from "../services/findMembers-service";
import {
  getQueryParams,
  handleError,
  responseWrapper,
  validateRequiredParameters,
} from "../utils/apiWrapper";
import { queryFieldsValues } from "../types/mappings";
import { NotFoundError } from "../types/NotFoundError";
import { introspectToken } from "../services/introspectToken-service";

// Initialize DynamoDB and S3 Connection
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // try {
  //   const sessionToken =
  //     event.headers["x-session-token"] ||
  //     event.headers["X-Session-Token"] ||
  //     "";
  //   if (!sessionToken) {
  //     return handleError(
  //       new Error(`Invalid session token`),
  //       `Invalid session token`,
  //       418
  //     );
  //   }
  //   let valid: { data: { active: boolean } };
  //   try {
  //     valid = await introspectToken(sessionToken);
  //   } catch (e) {
  //     return handleError(
  //       null,
  //       "There is an issue with the authentication. You will not see any data. Please try again later or clear your cache and try again.",
  //       400
  //     );
  //   }

  //   if (!valid.data.active) {
  //     return handleError(
  //       new Error(`Invalid session token`),
  //       `Invalid session token`,
  //       418
  //     );
  //   }

  const query = { queryField: "name", queryValue: "firstname=x,lastname=y" };
  // Validates parameters
  // const validate = validateRequiredParameters(
  //   ["queryField", "queryValue"],
  //   query
  // );
  // if (validate.error) return validate.error;
  // if (!queryFieldsValues.includes(query.queryField) && query.queryField) {
  //   return handleError(
  //     new Error(`Invalid queryField: ${query.queryField}`),
  //     `Invalid queryField: ${query.queryField}`
  //   );
  // }

  // Creates claim
  //TODO add pagination rather than limiting to 1000
  const queryField: queryFields = "name";
  const res = await findMembers(queryField, "firstname=Jonny", 1000);

  return responseWrapper(res, 200);
  // } catch (err) {
  //   if (err instanceof NotFoundError) {
  //     return responseWrapper({}, 404, err.message);
  //   }
  //   console.error(err);
  //   return handleError(err, "Internal Server Error", 500);
  // }
};
