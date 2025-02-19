const PlayerGroup = (sequelize, DataTypes) => {
  return sequelize.define(
    "playerGroup",
    {
      player_group_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        comment: "고유 게임 참여 그룹 id",
      },
      game_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "고유 생성 게임 id",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "고유 사용자 id",
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
