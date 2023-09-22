import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as generateUUID } from "uuid";
import { uploadEOBFile } from "../services/storeEOB-service";
import {
  handleError,
  responseWrapper,
  validateRequiredParameters,
} from "../utils/apiWrapper";
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
    // Validate params
    const validate = validateRequiredParameters(
      ["submissionID", "eobFile"],
      body
    );
    if (validate.error) return validate.error;
    const eobForm = body.eobFile;
    const mainPdfData = eobForm.split(",")[1];
    const mainPdfType = eobForm.split(",")[0].split(";")[0].split(":")[1];
    let mainPdfDoc;
    if (mainPdfType === "application/pdf") {
      mainPdfDoc = Buffer.from(mainPdfData, "base64"); //we dont attach this to a main pdf file since its an encrypted pdf
    } else {
      return handleError(
        new Error(`Wrong file type submitted.`),
        `Wrong file type submitted.`,
        400
      );
    }

    if (!mainPdfDoc) {
      return handleError(
        new Error(`Missing required parameter: eobForm`),
        `Missing required parameter: eobForm`,
        400
      );
    }
    const uuid = generateUUID();
    console.log(`Claim ID: ${body.submissionID}, UUID: ${uuid}`);
    const status = await uploadEOBFile(uuid, body.submissionID, mainPdfDoc);
    console.log(`Status: ${status}`);

    return responseWrapper(status, 201);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return responseWrapper({}, 404, err.message);
    }
    console.error(err);
    return handleError(err, "Internal Server Error", 500);
  }
};
