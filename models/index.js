const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';

let config = require('../config/config.js')[env];
console.log(config);
const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
