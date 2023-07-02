import cluster from "cluster";
import http from "http";
import { availableParallelism } from "os";
import { app } from "./app";
import { sendError } from "./utils/util";
import { config } from "dotenv";

export default () => {
  if (cluster.isPrimary) {
    config();
    const PORT = parseInt(process.env.PORT ?? "4000");

    process.on("uncaughtException", (error) => console.error(error.message));

    const workersCount = availableParallelism() - 1;
    if (workersCount === 0) {
      console.error("This server doesn't have a parallelism feature");
      process.exit();
    }

    const workerPorts: number[] = [];

    for (let i = 0; i < workersCount; i++) {
      const workerPort = PORT + 1 + i;

      cluster.fork({ PORT: workerPort });
      workerPorts.push(workerPort);
    }

    let nextServer = 0;

    const loadBalancer = http.createServer((req, res) => {
      console.info(`Request ${req.method}: ${req.url} to Load Balancer`);

      nextServer = (nextServer % workersCount) + 1;
      const port = 4000 + nextServer;

      try {
        const connector = http.request(
          {
            hostname: "localhost",
            port: port,
            path: req.url,
            method: req.method,
            headers: req.headers,
          },
          (resp) => {
            res.writeHead(
              resp.statusCode ?? 200,
              resp.statusMessage,
              resp.headers
            );
            resp.pipe(res);
          }
        );
        connector.on("error", (error) => {
          console.error(error.message);
          sendError(res, 500, error.message);
          req.unpipe(connector);
        });

        console.info(`Forward request to worker on port ${port}`);

        req.pipe(connector);
      } catch (error) {
        let message = String(error) ?? "Server Error";
        if (error instanceof Error) {
          message = error.message;
        }
        console.error(message);
        sendError(res, 500, message);
      }
    });
    loadBalancer.on("error", (error) => {
      console.error(error.message);
    });

    loadBalancer.listen(PORT, () => {
      console.info(`Load Balancer is listening on port ${PORT}`);
    });
  } else {
    // Worker instance
    const port = parseInt(process.env.PORT ?? "4001");
    app(port);
  }
};
