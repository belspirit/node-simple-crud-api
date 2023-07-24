import request from "supertest";
import { app } from "./app";
import { User } from "./types/User";

const port = parseInt(process.env.PORT ?? "3000");
const host = `localhost:${port}`;
let server: any;
let user: User;

const fakeUuid = "aaaaaaaa-bbbb-cccc-dddd-123456789012";

describe("CRUD API tests: Scenario 1", () => {
  let userId: string;

  beforeAll(async () => {
    server = await app(port);
  });

  afterAll(() => {
    server.exit();
  });

  test("Get all records - empty array is expected", async () => {
    const response = await request(host).get("/users");
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
  });

  test("A new object is created - a response containing newly created record is expected", async () => {
    const newUser = { name: "Sergey", age: 39, hobbies: ["GYM", "Tea"] };
    const response = await request(host).post("/users").send(newUser);
    expect(response.statusCode).toBe(201);
    user = response.body;
    userId = user.id;
    const matchUser = { id: userId, ...newUser };
    expect(user).toStrictEqual(matchUser);
  });

  test("Get the created record by its id - the created record is expected", async () => {
    const response = await request(host).get(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(user);
  });

  test("Update the created record - a response is expected containing an updated object with the same id", async () => {
    const updateUser = {
      name: "Sergey Labetik",
      age: 40,
      hobbies: ["GYM", "Tea", "Family"],
    };
    const response = await request(host)
      .put(`/users/${userId}`)
      .send(updateUser);
    expect(response.statusCode).toBe(200);
    const { id } = response.body;
    const matchUser = { id: userId, ...updateUser };
    expect(id).toStrictEqual(userId);
    expect(response.body).toStrictEqual(matchUser);
  });

  test("Delete the created object by id - confirmation of successful deletion is expected", async () => {
    const response = await request(host).delete(`/users/${userId}`);
    expect(response.statusCode).toBe(204);
  });

  test("Get a deleted object by id - expected answer is that there is no such object", async () => {
    const response = await request(host).get(`/users/${userId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("User is not found");
  });
});

describe("CRUD API tests: Scenario 2", () => {
  let userId1: string, userId2: string, userId3: string;

  beforeAll(async () => {
    server = await app(port);
  });

  afterAll(() => {
    server.exit();
  });

  test("A new object 1 is created - a response containing newly created record is expected", async () => {
    const newUser = { name: "Iryna", age: 39, hobbies: ["Pool", "Youga"] };
    const response = await request(host).post("/users").send(newUser);
    expect(response.statusCode).toBe(201);
    user = response.body;
    userId1 = user.id;
    const matchUser = { id: userId1, ...newUser };
    expect(user).toStrictEqual(matchUser);
  });

  test("A new object 2 is created - a response containing newly created record is expected", async () => {
    const newUser = { name: "Sergey", age: 39, hobbies: ["GYM"] };
    const response = await request(host).post("/users").send(newUser);
    expect(response.statusCode).toBe(201);
    user = response.body;
    userId2 = user.id;
    const matchUser = { id: userId2, ...newUser };
    expect(user).toStrictEqual(matchUser);
  });

  test("A new object 3 is created - a response containing newly created record is expected", async () => {
    const newUser = { name: "Young", age: 3, hobbies: ["Toys"] };
    const response = await request(host).post("/users").send(newUser);
    expect(response.statusCode).toBe(201);
    user = response.body;
    userId3 = user.id;
    const matchUser = { id: userId3, ...newUser };
    expect(user).toStrictEqual(matchUser);
  });

  test("Get all records - 3 records in array are expected", async () => {
    const response = await request(host).get("/users");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
  });

  test("Delete the created object by id - confirmation of successful deletion is expected", async () => {
    const response = await request(host).delete(`/users/${userId2}`);
    expect(response.statusCode).toBe(204);
  });

  test("Get all records - 2 records in array are expected", async () => {
    const response = await request(host).get("/users");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });
});

describe("CRUD API tests: Scenario 3", () => {
  beforeAll(async () => {
    server = await app(port);
  });

  afterAll(() => {
    server.exit();
  });

  test("GET /users/id: Response with status code 400 and message if userId is invalid", async () => {
    const wrongId = "wrong-id";
    const response = await request(host).get(`/users/${wrongId}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User ID should be UUID v4 like");
  });

  test("DELETE /users/id: Response with status code 400 and message if userId is invalid", async () => {
    const wrongId = "wrong-id";
    const response = await request(host).delete(`/users/${wrongId}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User ID should be UUID v4 like");
  });

  test("PUT /users/id: Response with status code 400 and message if userId is invalid", async () => {
    const wrongId = "wrong-id";
    const newUser = { name: "Iryna", age: 39, hobbies: ["Pool", "Youga"] };
    const response = await request(host).put(`/users/${wrongId}`).send(newUser);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("User ID should be UUID v4 like");
  });

  test("POST /users: Response with status code 400 and message if object structure is invalid", async () => {
    const newUser = {
      name: "Sergey",
      age: "39",
      hobbies: "bad object structure",
    };
    const response = await request(host).post("/users").send(newUser);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toStrictEqual("Wrong user structure");
  });

  test("PUT /users/id: Response with status code 400 and message if object structure is invalid", async () => {
    const newUser = {
      name: "Sergey",
      age: "39",
      hobbies: "bad object structure",
    };
    const response = await request(host)
      .put(`/users/${fakeUuid}`)
      .send(newUser);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toStrictEqual("Wrong user structure");
  });
});
