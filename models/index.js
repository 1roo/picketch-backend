"use strict";

const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모델
db.User = require("./User")(sequelize, Sequelize);
db.Region = require("./Region")(sequelize, Sequelize);
db.Notification = require("./Notification")(sequelize, Sequelize);
db.Dm = require("./Dm")(sequelize, Sequelize);
db.DmChat = require("./DmChat")(sequelize, Sequelize);
db.Friend = require("./Friend")(sequelize, Sequelize);
db.Keyword = require("./Keyword")(sequelize, Sequelize);
db.Game = require("./Game")(sequelize, Sequelize);
db.PlayerGroup = require("./PlayerGroup")(sequelize, Sequelize);

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
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
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

  // Game-PlayerGroup
  db.Game.hasMany(db.PlayerGroup, {
    foreignKey: "game_id",
    sourceKey: "game_id",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  db.PlayerGroup.belongsTo(db.Game, {
    foreignKey: "game_id",
    targetKey: "game_id",
  });

  // PlayerGroup-User
  db.User.hasMany(db.PlayerGroup, {
    foreignKey: "user_id",
    sourceKey: "user_id",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  db.PlayerGroup.belongsTo(db.User, {
    foreignKey: "user_id",
    sourceKey: "user_id",
  });
};

dataRelation();

// db.User.afterCreate(async (user, options) => {
//   await updateRegionScore(user.region_id);
// });

db.User.afterUpdate(async (user, options) => {
  if (user.changed("user_score")) {
    await updateRegionScore(user.region_id);
  }
});

async function updateRegionScore(region_id) {
  const regionScore = await db.User.sum("user_score", { where: { region_id } });
  console.log(regionScore);
  await db.Region.update({ region_score: regionScore || 0 }, { where: { region_id } });
}
module.exports = db;
