const PlayerGroup = (sequelize, DataTypes) => {
  return sequelize.define(
    'playerGroup',
    {
      player_group_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      game_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'player_group',
      freezeTableName: true,
      timestamps: false,
    }
  );
};

module.exports = PlayerGroup;
