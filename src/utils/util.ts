import { ServerResponse } from "http";
import { version as uuidVersion, validate as uuidValidate } from "uuid";

export const sendError = (
  res: ServerResponse,
  statusCode: number,
  message: string
) => {
  res.statusCode = statusCode;
  res.end(JSON.stringify({ message }));
};

export const sendResponse = (
  res: ServerResponse,
  statusCode: number,
  data?: unknown
) => {
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
};

export const uuidValidateV4 = (uuid: string): boolean => {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
};
