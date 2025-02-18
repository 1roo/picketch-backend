const PlayerGroup = (sequelize, DataTypes) => {
  return sequelize.define(
    "playerGroup",
    {
      player_group_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      game_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "player_group",
      freezeTableName: true,
      timestamps: false,
      indexes: [{ unique: true, fields: ["user_id", "game_id"] }],
    },
  );
};

module.exports = PlayerGroup;
