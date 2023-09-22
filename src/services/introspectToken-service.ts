import axios, { AxiosResponse, isAxiosError } from "axios";
import https from "https";
import certificate from "./securian_trust.pem";
import { APIGatewayProxyResult } from "aws-lambda";
const api = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    ca: [certificate],
  }),
});
export const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", // or specify a domain
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handleError = (
  e: unknown,
  message: string,
  statusCode = 400
): APIGatewayProxyResult => {
  const error = message;
  console.log(e);
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
  return api
    .post(url, data, {
      headers,
      auth,
    })
    .catch((e) => {
      throw handleError(e, "Network Error");
    });
};

export async function introspectToken(token: string) {
  const introspectURL = process.env.PING_ID_INTROSPECT_PATH || "";
  const data = {
    token,
    client_id: process.env.PING_ID_CLIENT_ID,
  };

  try {
    const res = await postRequest(introspectURL, data, {
      "Content-Type": "application/x-www-form-urlencoded",
    });

    return res;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
