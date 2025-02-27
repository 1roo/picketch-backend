require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const { sequelize } = require("./models");
// const redisManager = require("./utils/redisManager");
const indexRouter = require("./routes");
const { socketHandler } = require("./socket/index");
const swaggerUi = require("swagger-ui-express");

const app = express();

// 환경변수
const SERVER_PREFIX = "/api";
const SWAGGER_URL = "/api-docs";
const PORT = process.env.SERVER_PORT;

// Redis
// const redis = redisManager.connect();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Swagger
function loadSwaggerFile(filePath) {
  try {
    return YAML.parse(fs.readFileSync(path.join(__dirname, filePath), "utf8"));
  } catch (err) {
    console.error(`Error loading Swagger file: ${filePath}`, err);
    throw err;
  }
}

function loadSwaggerFiles() {
  const swaggerDoc = loadSwaggerFile("./docs/swagger.yaml");
  const components = loadSwaggerFile("./docs/component/index.yaml");

  return {
    ...swaggerDoc,
    components: {
      schemas: components.schemas,
      securitySchemes: components.securitySchemes,
    },
    paths: {
      ...loadSwaggerFile("./docs/paths/auth.yaml"),
      ...loadSwaggerFile("./docs/paths/friend.yaml"),
      ...loadSwaggerFile("./docs/paths/ranking.yaml"),
      ...loadSwaggerFile("./docs/paths/game-room.yaml"),
      ...loadSwaggerFile("./docs/paths/user.yaml"),
    },
  };
}

const swaggerDocument = loadSwaggerFiles();

// Routes
app.use(SERVER_PREFIX, indexRouter);
app.use(SWAGGER_URL, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("DB connection success");

    const server = http.createServer(app);

    // socketHandler(server, redis);
    socketHandler(server);

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(
        `API documentation available at http://localhost:${PORT}${SWAGGER_URL}`,
      );
    });
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
};

startServer();

// module.exports = { app, redis };
module.exports = { app };