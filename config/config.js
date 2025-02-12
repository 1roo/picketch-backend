require('dotenv').config();

const development = {
  username: process.env.LOCAL_DB_USERNAME,
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
  host: process.env.LOCAL_DB_HOST,
  dialect: 'mysql',
};

const production = {
  username: process.env.REMOTE_DB_USERNAME,
  password: process.env.REMOTE_DB_PASSWORD,
  database: process.env.REMOTE_DB_DATABASE,
  host: process.env.REMOTE_DB_HOST,
  dialect: 'mysql',
};

module.exports = { development, production };
