const Dm = (sequelize, DataTypes) => {
  return sequelize.define(
    "dm",
    {
      dm_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "고유 dm id",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "고유 사용자 id",
      },
      friend_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "채팅 상대 고유 id",
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["user_id", "friend_id"],
        },
      ],
    },
    {
      tableName: "dm",
      timestamps: false,
      freezeTableName: true,
    },
  );
};
module.exports = Dm;
