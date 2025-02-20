const Friend = (sequelize, DataTypes) => {
  return sequelize.define(
    "friend",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "친구 기본키",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "고유 사용자 id",
      },
      friend_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "사용자의 친구 id",
      },
      friend_nickname: {
        type: DataTypes.STRING(15),
        allowNull: false,
        comment: "사용자의 친구 닉네임",
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    },
  );
};
module.exports = Friend;
