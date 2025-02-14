const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';

let config = require('../config/config.js')[env];
const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

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
module.exports = db;
