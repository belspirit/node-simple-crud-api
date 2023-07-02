import { config } from "dotenv";
import { app } from "./app";
import run from "./load-balancer";

config();

const multi = String(process.env.MULTI).toLowerCase() === "true";
const port = parseInt(process.env.PORT ?? "4000");

if (multi) {
  run(port);
} else {
  app(port);
}
