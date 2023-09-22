import axios, { AxiosResponse, isAxiosError } from "axios";
import { headers } from "./constants";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const debug = true;

export const getQueryParams = (event: APIGatewayProxyEvent) => {
  const queryParams = event.queryStringParameters;
  if (!queryParams) {
    return handleError(
      new Error(`No query parameters provided.`),
      `No query parameters provided.`
    );
  }
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const body: any = {};
  for (const [key, value] of Object.entries(queryParams)) {
    body[key] = value as string;
  }
  return body;
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getAttribute = (attributePath: string, object: any) => {
  const path = attributePath.split(".");
  let output = object;
  for (let i = 0, n = path.length; i < n; i++) {
    output = output[path[i]];
  }
  return output;
};

export const validateRequiredParameters = (
  requiredParams: string[],
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  body: any
): { valid: boolean; error?: APIGatewayProxyResult } => {
  const missingArray: string[] = [];
  requiredParams.forEach((param) => {
    if (!getAttribute(param, body)) {
      missingArray.push(param);
    }
  });
  if (missingArray.length != 0) {
    return {
      valid: false,
      error: handleError(
        new Error(`Missing required parameter: ${missingArray.join()}`),
        `Missing required parameter: ${missingArray.join()}`
      ),
    };
  } else {
    return { valid: true };
  }
};

export const handleError = (
  e: unknown,
  message: string,
  statusCode = 400
): APIGatewayProxyResult => {
  const error =
    debug && isAxiosError(e)
      ? e.response?.data?.error_description || e.message
      : message;
  return {
    statusCode: statusCode,
    headers,
    body: JSON.stringify({ error }),
  };
};

export const postRequest = async (
  url: string,
  data: NonNullable<unknown>,
  headers: Record<string, string>,
  auth?: { username: string; password: string }
) => {
  return axios.post(url, data, { headers, auth }).catch((e) => {
    throw handleError(e, "Network Error");
  });
};

export const getRequest = async (
  url: string,
  headers: Record<string, string>
) => {
  return axios.get(url, { headers }).catch((e) => {
    throw handleError(e, "Network Error");
  });
};

export const sendVerificationCode = async (
  token: string,
  userId: string,
  apiPath: string,
  envID: string
) => {
  const url = `${apiPath}/environments/${envID}/users/${userId}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type":
      "application/vnd.pingidentity.user.sendVerificationCode+json",
  };

  return postRequest(url, {}, headers);
};

export const createUser = async (
  token: string,
  userCreateBody: NonNullable<unknown>,
  apiPath: string,
  envID: string
) => {
  const url = `${apiPath}/environments/${envID}/users`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/vnd.pingidentity.user.import+json",
  };

  // we don't want this to handle this error
  const userCreateResponse = await axios.post(url, userCreateBody, {
    headers,
  });

  // send verification code
  await sendVerificationCode(token, userCreateResponse.data.id, apiPath, envID);

  return userCreateResponse;
};

export const getAdminToken = async (
  authPath: string,
  envID: string,
  adminAppID: string,
  adminAppSecret: string
) => {
  const url = `${authPath}/${envID}/as/token`;
  const data = { grant_type: "client_credentials" };
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const auth = {
    username: adminAppID || "",
    password: adminAppSecret || "",
  };
  const response = await postRequest(url, data, headers, auth);
  return response.data.access_token;
};

export const verifyUser = async (
  token: string,
  userID: string,
  verificationCode: string,
  apiPath: string,
  envID: string
): Promise<AxiosResponse> => {
  const url = `${apiPath}/environments/${envID}/users/${userID}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type":
      "application/vnd.pingidentity.user.sendVerificationCode+json",
  };

  return postRequest(url, { verificationCode }, headers);
};

export const responseWrapper = (
  data: unknown,
  statusCode = 200,
  message?: string
): APIGatewayProxyResult => {
  return {
    body: JSON.stringify({
      data: data,
      // Priority: Specified Message > Error status code > No data > Data
      message: message
        ? message
        : statusCode - (statusCode % 100) != 200
        ? "Error"
        : isEmpty(data)
        ? "No data"
        : "Success",
    }),
    statusCode: statusCode || 200,
    headers: headers,
  };
};

const isEmpty = (data: unknown): boolean => {
  if (!data) {
    return true;
  }
  if (Object.keys(data).length == 0) {
    return true;
  }
  return false;
};
