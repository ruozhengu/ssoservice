import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getQueryParams, handleError } from "../utils/apiWrapper";
import { headers } from "../utils/constants";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = getQueryParams(event);
    console.log(body);
    // TODO check the origin of this request, just for some basic validation

    const {
      PING_ID_AUTH_PATH,
      PING_ID_REDIRECT_PATH,
      PING_ID_CLIENT_ID,
      PING_ID_ISSUER,
    } = process.env;

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        PING_ID_AUTH_PATH,
        PING_ID_REDIRECT_PATH,
        PING_ID_CLIENT_ID,
        PING_ID_ISSUER,
      }),
    };
  } catch (err) {
    console.error(err);
    return handleError(err, "Internal Server Error", 500);
  }
};
