import { User } from "../types/User";

export type DbOperation =
  | "getUsers"
  | "getUser"
  | "createUser"
  | "updateUser"
  | "deleteUser";

export interface DbRequest {
  operation: DbOperation;
  data?: User | string;
}

export interface DbResponse {
  ok: boolean;
  operation: DbOperation;
  data?: User | User[];
}
