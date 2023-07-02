import http, { IncomingMessage, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";
import "./db/users";
import db from "./db/users";
import { DataResponse } from "./types/DataResponse";
import { isUser } from "./types/User";
import { sendError, sendResponse, uuidValidateV4 } from "./utils/util";

export const app = async (port: number) => {
  const server = http.createServer((req, res) => {
    console.info(`Request ${req.method}: ${req.url} to Server on port ${port}`);
    router(req, res);
  });

  server.listen(port, () => {
    console.info(`Server is listening on port ${port}`);
  });
};

const router = async (
  req: IncomingMessage & DataResponse,
  res: ServerResponse
) => {
  const handlers = [
    parseJSONMiddlware,
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    defaultHandler,
  ];

  for (const handler of handlers) {
    await new Promise((resolve, reject) => {
      try {
        handler(req, res, () => {
          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
    if (req.ended) break;
  }
};

const parseJSONMiddlware = (
  req: IncomingMessage & DataResponse,
  res: ServerResponse,
  next: () => void
) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk.toString();
  });
  req.on("end", () => {
    const object = JSON.parse(data);
    Object.defineProperty(req, "data", { value: object });
    next();
  });
  res.setHeader("Content-Type", "application/json");
};

const getAllUsers = async (
  req: IncomingMessage & DataResponse,
  res: ServerResponse,
  next: () => void
) => {
  if (req.url !== "/users" || req.method !== "GET") {
    next();
    return;
  }
  const users = await db.getAllUsers();
  sendResponse(res, 200, users);
};

const getUser = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => {
  if (!req.url?.startsWith("/users/") || req.method !== "GET") {
    next();
    return;
  }
  const userId = req.url.substring(7);
  if (uuidValidateV4(userId)) {
    const user = await db.getUser(userId);
    if (!user) {
      sendError(res, 404, "User is not found");
    }
    sendResponse(res, 200, user);
  } else {
    sendError(res, 400, "User ID should be UUID v4 like");
  }
};

const createUser = async (
  req: IncomingMessage & DataResponse,
  res: ServerResponse,
  next: () => void
) => {
  if (req.url !== "/users" || req.method !== "POST") {
    next();
    return;
  }
  if (!isUser(req.data)) {
    sendError(res, 400, "Wrong user structure");
    return;
  }
  const { name, age, hobbies } = req.data;
  let user: any = { id: uuidv4(), name, age, hobbies };
  user = await db.createUser(user);
  sendResponse(res, 201, user);
};

const updateUser = async (
  req: IncomingMessage & DataResponse,
  res: ServerResponse,
  next: () => void
) => {
  if (!req.url?.startsWith("/users/") || req.method !== "PUT") {
    next();
    return;
  }
  if (!isUser(req.data)) {
    sendError(res, 400, "Wrong user structure");
    return;
  }
  const userId = req.url.substring(7);
  if (uuidValidateV4(userId)) {
    let user: any = await db.getUser(userId);
    if (!user) {
      sendError(res, 404, "User is not found");
    }
    const { name, age, hobbies } = req.data;
    user = { id: userId, name, age, hobbies };
    user = await db.updateUser(user);
    sendResponse(res, 200, user);
  } else {
    sendError(res, 400, "User ID should be UUID v4 like");
  }
};

const deleteUser = async (
  req: IncomingMessage & DataResponse,
  res: ServerResponse,
  next: () => void
) => {
  if (!req.url?.startsWith("/users/") || req.method !== "DELETE") {
    next();
    return;
  }
  const userId = req.url.substring(7);
  if (uuidValidateV4(userId)) {
    let user: any = await db.getUser(userId);
    if (!user) {
      sendError(res, 404, "User is not found");
    }
    await db.deleteUser(userId);
    sendResponse(res, 204);
  } else {
    sendError(res, 400, "User ID should be UUID v4 like");
  }
};

const defaultHandler = (req: IncomingMessage, res: ServerResponse) => {
  sendError(res, 404, "Request to non-existing endpoint");
};
