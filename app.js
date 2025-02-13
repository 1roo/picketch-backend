const express = require("express");
const app = express();
const { sequelize } = require("./models");
const indexRouter = require("./routes");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerDef");
require("dotenv").config();

const SERVER_PREFIX = "/api";
const SWAGGER_URL = "/api-docs";

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // 세션값 전송 가능하게 설정
  }),
);

// Routes
app.use(SERVER_PREFIX, indexRouter);
app.use(SWAGGER_URL, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("DB connection success");

    app.listen(process.env.SERVER_PORT, () => {
      console.log(`Server is running on http://localhost:${process.env.SERVER_PORT}`);
      console.log(
        `API documentation available at http://localhost:${process.env.SERVER_PORT}${SWAGGER_URL}`,
      );
    });
  } catch (error) {
    console.error("DB connection failed", error);
    process.exit(1);
  }
};

startServer();
