"use strict";

const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

const KeywordModel = require('./game/Keyword.js')(sequelize);
const GameModel = require('./game/Game.js')(sequelize);
const PlayerGroupModel = require('./game/PlayerGroup.js')(sequelize);

GameModel.hasMany(PlayerGroupModel, {
  foreignKey: 'gameId',
  sourceKey: 'gameId',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});
PlayerGroupModel.belongsTo(GameModel, {
  foreignKey: 'gameId',
  targetKey: 'gameId',
});

db.Keyword = KeywordModel;
db.Game = GameModel;
db.PlayerGroup = PlayerGroupModel;

db.sequelize = sequelize;

db.Sequelize = Sequelize;

// 모델
db.User = require("./User")(sequelize, Sequelize);
db.Region = require("./Region")(sequelize, Sequelize);
db.Notification = require("./Notification")(sequelize, Sequelize);
db.Dm = require("./Dm")(sequelize, Sequelize);
db.DmChat = require("./DmChat")(sequelize, Sequelize);
db.Friend = require("./Friend")(sequelize, Sequelize);

// 관계 (함수 내부에 작성 바랍니당)
const dataRelation = () => {
  // User-Region
  db.User.belongsTo(db.Region, {
    foreignKey: "region_id",
    targetKey: "region_id",
  });

  db.Region.hasMany(db.User, {
    foreignKey: "region_id",
    sourceKey: "region_id",
  });

  // Notification
  db.User.hasMany(db.Notification, {
    as: "ReceivedNotifications",
    foreignKey: "user_id",
    sourceKey: "user_id",
  });

  db.User.hasMany(db.Notification, {
    as: "SentNotifications",
    foreignKey: "from_user_id",
    sourceKey: "user_id",
  });

  db.Notification.belongsTo(db.User, {
    as: "FromUser",
    foreignKey: "from_user_id",
    targetKey: "user_id",
  });

  db.Notification.belongsTo(db.User, {
    as: "ToUser",
    foreignKey: "user_id",
    targetKey: "user_id",
  });

  // Friend 
  db.User.hasMany(db.Friend, {
    foreignKey: "user_id",
    sourceKey: "user_id",
  });

  db.Friend.belongsTo(db.User, {
    foreignKey: "user_id",
    targetKey: "user_id",
  });

  // Dm
  db.User.hasMany(db.Dm, {
    foreignKey: "user_id",
    sourceKey: "user_id",
  });

  db.Dm.belongsTo(db.User, {
    foreignKey: "user_id",
    targetKey: "user_id",
  });

  // Dm-Dmchat
  db.Dm.hasMany(db.DmChat, {
    foreignKey: "dm_id",
    sourceKey: "dm_id",
  });

  db.DmChat.belongsTo(db.Dm, {
    foreignKey: "dm_id",
    targetKey: "dm_id",
  });

};

dataRelation();

module.exports = db;
