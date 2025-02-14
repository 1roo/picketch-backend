const { DataTypes } = require('sequelize');

const PlayerGroup = (sequelize) => {
  return sequelize.define(
    'PlayerGroup',
    {
      playerGroupId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'player_group',
      freezeTableName: true,
      timestamps: false,
      underscored: true,
    }
  );
};

module.exports = PlayerGroup;
