import loaders from "./loaders";
import config from "@/config";
import http from "http";

(async function () {
  const { app } = loaders({});

  const server = http.createServer(app);

  server
    .listen(config.port, () => {
      console.info(
        `🚀 Server listening on port: http://localhost:${config.port}/api`
      );
    })
    .on("error", (err) => {
      console.error(err);
      process.exit(1);
    });
})();
