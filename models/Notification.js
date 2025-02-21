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
        comment: "수신자 id",
      },
      from_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "발신자 id",
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
      response_status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: true,
        comment: "응답 상태",
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
      room_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "게임방 ID", // 게임초대의 경우
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "알림 만료 시간", // 게임초대의 경우
      },
      requires_response: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "응답 필요 여부",
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
          fields: ["user_id", "is_read", "create_date"],
          name: "idx_user_notifications",
        },
      ], // 유저 알림 인덱스 생성
    },
  );
};

module.exports = Notification;
