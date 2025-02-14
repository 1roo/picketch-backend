const DmChat = (sequelize, DataTypes) => {
  return sequelize.define(
    "dm_chat",
    {
      dm_chat_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "고유 채팅 id"
      },
      dm_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "고유 dm id"
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "채팅 메세지 내용"

      },
      sender_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "메세지 보낸 사용자 id"
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "읽음 여부",
      },
    },
    {
      timestamps: true,
      freezeTableName: true,
      createdAt: "send_time"
    }
  );
};
module.exports = DmChat;
