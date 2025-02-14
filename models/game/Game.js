const { DataTypes } = require('sequelize');

const Game = (sequelize) => {
  return sequelize.define(
    'Game',
    {
      gameId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(30), allowNull: false },
      manager: { type: DataTypes.INTEGER, allowNull: false },
      isLock: { type: DataTypes.BOOLEAN, allowNull: false },
      pw: { type: DataTypes.STRING(20), allowNull: true },
      round: { type: DataTypes.INTEGER(50), allowNull: false },
    },
    {
      tableName: 'game',
      freezeTableName: true,
      timestamps: false,
      underscored: true,
    }
  );
};

module.exports = Game;
