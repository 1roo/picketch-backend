const express = require('express');
const app = express();
const { sequelize } = require('./models');
const indexRouter = require('./routes');
const serverPrefix = '/api';
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerDef');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(serverPrefix, indexRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

sequelize
  .sync({ force: false })
  .then(() => {
    app.listen(process.env.SERVER_PORT, () => {
      console.log(`http://localhost:${process.env.SERVER_PORT}`);
    });
  })
  .catch((err) => {
    console.log('err', err);
  });

//test
