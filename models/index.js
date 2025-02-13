'use strict';

const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모델
db.User = require('./User')(sequelize, Sequelize);
db.Region = require('./Region')(sequelize, Sequelize);
db.Notification = require('./Notification')(sequelize, Sequelize);

// 관계 (함수 내부에 작성 바랍니당)
const dataRelation = () => {
  // User-Region
  db.User.belongsTo(db.Region, {
    foreignKey: 'region_id',
    targetKey: 'region_id',
  });

  db.Region.hasMany(db.User, {
    foreignKey: 'region_id',
    sourceKey: 'region_id',
  });

  // Notification
  db.User.hasMany(db.Notification, {
    foreignKey: 'user_id',
    sourceKey: 'user_id',
  });

  db.Notification.belongsTo(db.User, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
  });
};

dataRelation();

module.exports = db;
