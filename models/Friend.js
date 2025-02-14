const Friend = (sequelize, DataTypes) => {
    return sequelize.define(
      "friend",
      {
        user_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          comment: "고유 사용자 id"
        },
        friend_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
          comment: "사용자의 친구 id"
        },
      },
      {
        timestamps: false,
        freezeTableName: true,
      }
    );
  };
  module.exports = Friend;
  