require('dotenv').config();

const development = {
  username: process.env.LOCAL_DB_USERNAME,
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
  host: process.env.LOCAL_DB_HOST,
  dialect: 'mysql',
};

const production = {
  username: process.env.DB_PROD_USERNAME,
  password: process.env.DB_PROD_PASSWORD,
  database: process.env.DB_PROD_DATABASE,
  host: process.env.DB_PROD_HOST,
  dialect: 'mysql',
};

module.exports = { development, production };
