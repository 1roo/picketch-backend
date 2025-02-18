require("dotenv").config();
const express = require("express");
const app = express();
const { sequelize } = require("./models");
const indexRouter = require("./routes");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { socketHandler } = require("./socket/index");

const SERVER_PREFIX = "/api";
const SWAGGER_URL = "/api-docs";
const PORT = process.env.SERVER_PORT;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // 세션값 전송 가능하게 설정
  }),
);

// Swagger
function loadSwaggerFiles() {
  try {
    // 각 YAML 파일 읽기
    const swaggerFile = fs.readFileSync(
      path.join(__dirname, "./docs/swagger.yaml"),
      "utf8",
    );
    const componentsFile = fs.readFileSync(
      path.join(__dirname, "./docs/component/index.yaml"),
      "utf8",
    );
    const authPathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/auth.yaml"),
      "utf8",
    );
    const gamePathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/game.yaml"),
      "utf8",
    );
    const friendPathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/friend.yaml"),
      "utf8",
    );
    const rankingPathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/ranking.yaml"),
      "utf8",
    );
    const gameRoomPathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/game-room.yaml"),
      "utf8",
    );
    const userPathFile = fs.readFileSync(
      path.join(__dirname, "./docs/paths/user.yaml"),
      "utf8",
    );

    // YAML 파싱
    const swaggerDoc = YAML.parse(swaggerFile);
    const components = YAML.parse(componentsFile);
    const authPaths = YAML.parse(authPathFile);
    const gamePaths = YAML.parse(gamePathFile);
    const friendPaths = YAML.parse(friendPathFile);
    const rankingPaths = YAML.parse(rankingPathFile);
    const gameRoomPaths = YAML.parse(gameRoomPathFile);
    const userPaths = YAML.parse(userPathFile);

    console.log("Loaded swagger.yaml:", swaggerDoc);
    console.log("Loaded components:", components);
    console.log("Loaded paths:", authPaths);

    // 문서 병합
    const mergedDoc = {
      ...swaggerDoc,
      components: {
        schemas: components.schemas,
        securitySchemes: components.securitySchemes,
      },
      paths: {
        ...authPaths,
        ...gamePaths,
        ...friendPaths,
        ...rankingPaths,
        ...gameRoomPaths,
        ...userPaths,
      },
    };
    console.log("Merged Swagger document:", mergedDoc);
    return mergedDoc;
  } catch (error) {
    console.error("Error loading Swagger files:", error);
    throw error;
  }
}

const swaggerDocument = loadSwaggerFiles();

// Routes
app.use(SERVER_PREFIX, indexRouter);
app.use(SWAGGER_URL, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "naverTest.html"));
});

// Server
const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("DB connection success");

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(
        `API documentation available at http://localhost:${PORT}${SWAGGER_URL}`,
      );
    });
    socketHandler(server);
  } catch (error) {
    console.error("DB connection failed", error);
    process.exit(1);
  }
};

startServer();
