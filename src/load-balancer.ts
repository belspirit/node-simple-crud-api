import cluster from "cluster";
import http from "http";
import { availableParallelism } from "os";
import { app } from "./app";
import { sendError } from "./utils/util";

export default (port: number) => {
  if (cluster.isPrimary) {
    process.on("uncaughtException", (error) => console.error(error.message));

    const workersCount = availableParallelism() - 1;
    if (workersCount === 0) {
      console.error("This server doesn't have a parallelism feature");
      process.exit();
    }

    const workerPorts: number[] = [];

    for (let i = 0; i < workersCount; i++) {
      const workerPort = port + 1 + i;

      cluster.fork({ WORKER_PORT: workerPort });
      workerPorts.push(workerPort);
    }

    let nextServer = 0;

    const loadBalancer = http.createServer((req, res) => {
      console.info(`Request ${req.method}: ${req.url} to Load Balancer`);

      nextServer = (nextServer % workersCount) + 1;
      const workerPort = port + nextServer;

      try {
        const connector = http.request(
          {
            hostname: "localhost",
            port: workerPort,
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

        console.info(`Forward request to worker on port ${workerPort}`);

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

    loadBalancer.listen(port, () => {
      console.info(`Load Balancer is listening on port ${port}`);
    });
  } else {
    // Worker instance
    const childPort = parseInt(process.env.WORKER_PORT ?? "4001");
    app(childPort);
  }
};
