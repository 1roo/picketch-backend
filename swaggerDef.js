const swaggerJSDoc = require("swagger-jsdoc");

// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Express API with Swagger",
//       version: "1.0.0",
//       description: "API documentation with Swagger",
//     },
//     servers: [
//       {
//         url: "http://localhost:8080",
//         description: "Development server",
//       },
//     ],
//   },
//   apis: ["./routes/*.js"], // 라우트 파일들의 경로
// };

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      //   version: "1.0.0",
      title: "picketch",
      description: "프로젝트 설명",

      // "프로젝트 설명 Node.js Swaager swagger-jsdoc 방식 RestFul API 클라이언트 UI",
    },
    servers: [
      {
        url: "http://localhost:8080", // 요청 URL
      },
    ],
  },
  apis: ["./routes/*.js"], //Swagger 파일 연동
};
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
