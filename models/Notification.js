const Notification = (sequelize, DataTypes) => {
  return sequelize.define(
    "notification",
    {
      notification_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "고유 알림 id",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        comment: "수신자 id",
      },
      notification_type: {
        type: DataTypes.ENUM(
          "FRIEND_REQUEST",
          "FRIEND_ACCEPT",
          "GAME_INVITE",
          "DM_RECEIVED",
        ),
        allowNull: false,
        comment: "알림 유형",
      },
      content: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "알림 내용",
      },
      link_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "알림 클릭시 이동할 URL",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "읽음 여부",
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "읽은 시간",
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: "create_date",
      indexes: [
        {
          fields: ["user_id", "is_read"],
          name: "idx_user_unread",
        },
      ], // 읽지 않은 알림만 인덱스 생성
    },
  );
};

module.exports = Notification;
