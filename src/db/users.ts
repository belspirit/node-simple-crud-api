import { User, isUser } from "../types/User";
import cluster from "cluster";
import { uuidValidateV4 } from "../utils/util";
import { DbOperation, DbRequest, DbResponse } from "./types";

let users: User[] = [];
const multi = JSON.parse(process.env.MULTI ?? "false");

const isDbRequest = (message: DbRequest): message is DbRequest => {
  return (
    !!message &&
    !!message.operation &&
    typeof message.operation === "string" &&
    (message.data === undefined ||
      typeof message.data === "string" ||
      isUser(message.data))
  );
};

const isDbResponse = (message: DbResponse): message is DbResponse => {
  return (
    message &&
    !!message.operation &&
    typeof message.operation === "string" &&
    (message.data === undefined ||
      message.data instanceof Object ||
      typeof message.data === "string")
  );
};

if (multi && cluster.isPrimary) {
  cluster.on("message", (worker, message: DbRequest, handle) => {
    if (!isDbRequest(message)) {
      return;
    }

    const { operation, data } = message;
    switch (operation) {
      case "getUsers":
        worker.send({ ok: true, operation, data: users });
        break;
      case "getUser":
        if (typeof data === "string" && uuidValidateV4(data)) {
          worker.send({
            ok: true,
            operation,
            data: users.find((u) => u.id === data),
          });
        } else {
          worker.send({ ok: false, operation });
        }
        break;
      case "createUser":
        if (data === undefined || typeof data === "string" || !isUser(data)) {
          worker.send({ ok: false, operation });
          return;
        }
        users = [...users, data];
        worker.send({ ok: true, operation, data });
        break;
      case "updateUser":
        if (data === undefined || typeof data === "string" || !isUser(data)) {
          worker.send({ ok: false, operation });
          return;
        }
        users = [...users.filter((value) => value.id !== data.id), data];
        worker.send({ ok: true, operation, data });
        break;
      case "deleteUser":
        users = users.filter((value) => value.id !== data);
        worker.send({ ok: true, operation });
        break;

      default:
        worker.send({ ok: false, operation });
        break;
    }
  });
}

export const getAllUsers = async () => {
  if (multi) {
    return performDbOperation<User[]>("getUsers");
  }
  return users;
};

export const getUser = async (id: string) => {
  if (multi) {
    return performDbOperation<User>("getUser", id);
  }
  return users.find((u) => u.id === id);
};

export const createUser = async (user: User) => {
  if (multi) {
    return performDbOperation<User>("createUser", user);
  }
  users = [...users, user];
  return user;
};

export const updateUser = async (user: User) => {
  if (multi) {
    return performDbOperation<User>("updateUser", user);
  }
  users = [...users.filter((value) => value.id !== user.id), user];
  return user;
};

export const deleteUser = async (id: string) => {
  if (multi) {
    return performDbOperation("deleteUser", id);
  }
  users = users.filter((value) => value.id !== id);
};

const performDbOperation = <User>(
  operation: DbOperation,
  data?: User | string
): Promise<unknown> => {
  if (cluster.isPrimary) {
    throw new Error(
      "DB operations should be called only from Workers, not from Primary thread"
    );
  }
  return new Promise((resolve, reject) => {
    const listener = (message: any) => {
      if (!isDbResponse(message)) {
        return;
      }
      resolve(message.data);
      process.removeListener("message", listener);
    };
    process.addListener("message", listener);
    process.send?.({ operation, data });
  });
};

export default {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
